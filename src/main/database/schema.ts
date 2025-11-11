import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// Projects table
export const projects = sqliteTable('projects', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  status: text('status', {
    enum: ['not_started', 'in_progress', 'on_hold', 'completed', 'archived'],
  }).notNull().default('not_started'),
  priority: text('priority', {
    enum: ['low', 'medium', 'high', 'urgent'],
  }).notNull().default('medium'),
  startDate: text('start_date'),
  endDate: text('end_date'),
  progress: integer('progress').notNull().default(0),
  color: text('color').notNull().default('#3B82F6'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
});

// Tasks table
export const tasks = sqliteTable('tasks', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  status: text('status', {
    enum: ['todo', 'in_progress', 'review', 'done', 'blocked'],
  }).notNull().default('todo'),
  priority: text('priority', {
    enum: ['low', 'medium', 'high', 'urgent'],
  }).notNull().default('medium'),
  assignee: text('assignee'),
  estimatedHours: real('estimated_hours'),
  actualHours: real('actual_hours'),
  startDate: text('start_date'),
  endDate: text('end_date'),
  parentTaskId: text('parent_task_id').references((): any => tasks.id, { onDelete: 'set null' }),
  milestoneId: text('milestone_id').references(() => milestones.id, { onDelete: 'set null' }),
  orderIndex: integer('order_index'),
  tags: text('tags'), // JSON array
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
});

// Milestones table
export const milestones = sqliteTable('milestones', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  targetDate: text('target_date').notNull(),
  status: text('status', {
    enum: ['pending', 'achieved', 'missed'],
  }).notNull().default('pending'),
  color: text('color').notNull().default('#10B981'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
});

// Resources table
export const resources = sqliteTable('resources', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  role: text('role'),
  email: text('email'),
  department: text('department'),
  availability: real('availability').notNull().default(100),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
});

// Task assignments table (many-to-many)
export const taskAssignments = sqliteTable('task_assignments', {
  id: text('id').primaryKey(),
  taskId: text('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  resourceId: text('resource_id').notNull().references(() => resources.id, { onDelete: 'cascade' }),
  allocationPercentage: real('allocation_percentage').notNull().default(100),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
});

// Comments table
export const comments = sqliteTable('comments', {
  id: text('id').primaryKey(),
  taskId: text('task_id').references(() => tasks.id, { onDelete: 'cascade' }),
  projectId: text('project_id').references(() => projects.id, { onDelete: 'cascade' }),
  author: text('author').notNull(),
  content: text('content').notNull(),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
});

// Attachments table
export const attachments = sqliteTable('attachments', {
  id: text('id').primaryKey(),
  taskId: text('task_id').references(() => tasks.id, { onDelete: 'cascade' }),
  projectId: text('project_id').references(() => projects.id, { onDelete: 'cascade' }),
  filename: text('filename').notNull(),
  filepath: text('filepath').notNull(),
  fileType: text('file_type'),
  fileSize: integer('file_size'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
});

// Activity log table
export const activityLog = sqliteTable('activity_log', {
  id: text('id').primaryKey(),
  entityType: text('entity_type').notNull(), // 'project', 'task', 'milestone'
  entityId: text('entity_id').notNull(),
  action: text('action').notNull(), // 'created', 'updated', 'deleted', 'status_changed'
  author: text('author'),
  changes: text('changes'), // JSON
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
});
