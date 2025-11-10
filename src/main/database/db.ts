import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { app } from 'electron';
import path from 'path';
import fs from 'fs';
import * as schema from './schema';

// Get database path (in userData directory)
const userDataPath = app.getPath('userData');
const dataDir = path.join(userDataPath, 'data');

// Create data directory if it doesn't exist
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'database.db');

console.log('Database path:', dbPath);

// Create SQLite connection
const sqlite = new Database(dbPath);

// Enable foreign keys
sqlite.pragma('foreign_keys = ON');

// Enable WAL mode for better performance
sqlite.pragma('journal_mode = WAL');

// Create Drizzle instance
export const db = drizzle(sqlite, { schema });

// Initialize database (create tables)
export function initializeDatabase() {
  console.log('Initializing database...');

  // Create tables if they don't exist
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      status TEXT CHECK(status IN ('not_started', 'in_progress', 'on_hold', 'completed', 'archived')) NOT NULL DEFAULT 'not_started',
      priority TEXT CHECK(priority IN ('low', 'medium', 'high', 'urgent')) NOT NULL DEFAULT 'medium',
      start_date TEXT,
      end_date TEXT,
      progress INTEGER DEFAULT 0 CHECK(progress >= 0 AND progress <= 100),
      color TEXT DEFAULT '#3B82F6',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT CHECK(status IN ('todo', 'in_progress', 'review', 'done', 'blocked')) NOT NULL DEFAULT 'todo',
      priority TEXT CHECK(priority IN ('low', 'medium', 'high', 'urgent')) NOT NULL DEFAULT 'medium',
      assignee TEXT,
      estimated_hours REAL CHECK(estimated_hours IS NULL OR estimated_hours >= 0),
      actual_hours REAL CHECK(actual_hours IS NULL OR actual_hours >= 0),
      start_date TEXT,
      end_date TEXT,
      parent_task_id TEXT,
      order_index INTEGER,
      tags TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (parent_task_id) REFERENCES tasks(id) ON DELETE SET NULL,
      CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date)
    );

    CREATE TABLE IF NOT EXISTS milestones (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      target_date TEXT NOT NULL,
      status TEXT CHECK(status IN ('pending', 'achieved', 'missed')) NOT NULL DEFAULT 'pending',
      color TEXT DEFAULT '#10B981',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS resources (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT,
      email TEXT,
      department TEXT,
      availability REAL DEFAULT 100 CHECK(availability >= 0 AND availability <= 100),
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS task_assignments (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      resource_id TEXT NOT NULL,
      allocation_percentage REAL DEFAULT 100 CHECK(allocation_percentage > 0 AND allocation_percentage <= 100),
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
      FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE,
      UNIQUE(task_id, resource_id)
    );

    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      task_id TEXT,
      project_id TEXT,
      author TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS attachments (
      id TEXT PRIMARY KEY,
      task_id TEXT,
      project_id TEXT,
      filename TEXT NOT NULL,
      filepath TEXT NOT NULL,
      file_type TEXT,
      file_size INTEGER,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS activity_log (
      id TEXT PRIMARY KEY,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      action TEXT NOT NULL,
      author TEXT,
      changes TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // Create indexes for better performance
  sqlite.exec(`
    CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
    CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee);
    CREATE INDEX IF NOT EXISTS idx_tasks_parent ON tasks(parent_task_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_dates ON tasks(start_date, end_date);
    CREATE INDEX IF NOT EXISTS idx_milestones_project ON milestones(project_id);
    CREATE INDEX IF NOT EXISTS idx_task_assignments_task ON task_assignments(task_id);
    CREATE INDEX IF NOT EXISTS idx_task_assignments_resource ON task_assignments(resource_id);
    CREATE INDEX IF NOT EXISTS idx_comments_task ON comments(task_id);
    CREATE INDEX IF NOT EXISTS idx_comments_project ON comments(project_id);
    CREATE INDEX IF NOT EXISTS idx_attachments_task ON attachments(task_id);
    CREATE INDEX IF NOT EXISTS idx_activity_log_entity ON activity_log(entity_type, entity_id);
    CREATE INDEX IF NOT EXISTS idx_activity_log_date ON activity_log(created_at);
  `);

  // Create triggers for updated_at
  sqlite.exec(`
    CREATE TRIGGER IF NOT EXISTS update_project_timestamp
    AFTER UPDATE ON projects
    BEGIN
      UPDATE projects SET updated_at = datetime('now') WHERE id = NEW.id;
    END;

    CREATE TRIGGER IF NOT EXISTS update_task_timestamp
    AFTER UPDATE ON tasks
    BEGIN
      UPDATE tasks SET updated_at = datetime('now') WHERE id = NEW.id;
    END;

    CREATE TRIGGER IF NOT EXISTS update_milestone_timestamp
    AFTER UPDATE ON milestones
    BEGIN
      UPDATE milestones SET updated_at = datetime('now') WHERE id = NEW.id;
    END;

    CREATE TRIGGER IF NOT EXISTS update_resource_timestamp
    AFTER UPDATE ON resources
    BEGIN
      UPDATE resources SET updated_at = datetime('now') WHERE id = NEW.id;
    END;

    CREATE TRIGGER IF NOT EXISTS update_comment_timestamp
    AFTER UPDATE ON comments
    BEGIN
      UPDATE comments SET updated_at = datetime('now') WHERE id = NEW.id;
    END;
  `);

  // Create trigger for automatic project progress calculation
  sqlite.exec(`
    CREATE TRIGGER IF NOT EXISTS calculate_project_progress
    AFTER UPDATE OF status ON tasks
    BEGIN
      UPDATE projects
      SET progress = (
        SELECT CAST(COUNT(CASE WHEN status = 'done' THEN 1 END) * 100.0 / COUNT(*) AS INTEGER)
        FROM tasks
        WHERE project_id = NEW.project_id
      )
      WHERE id = NEW.project_id;
    END;
  `);

  // Create trigger for activity log on task status change
  sqlite.exec(`
    CREATE TRIGGER IF NOT EXISTS log_task_status_change
    AFTER UPDATE OF status ON tasks
    WHEN OLD.status != NEW.status
    BEGIN
      INSERT INTO activity_log (id, entity_type, entity_id, action, changes, created_at)
      VALUES (
        lower(hex(randomblob(16))),
        'task',
        NEW.id,
        'status_changed',
        json_object('old_status', OLD.status, 'new_status', NEW.status),
        datetime('now')
      );
    END;
  `);

  console.log('Database initialized successfully');
}

export default db;
