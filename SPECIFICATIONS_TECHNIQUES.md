# Spécifications Techniques - Application de Gestion de Projet Electron

## Vue d'ensemble

Application desktop autonome de gestion de projet inspirée de Linear, développée avec Electron, permettant un déploiement en .exe avec base de données locale SQLite.

---

## Architecture Technique

### Stack Technologique

**Frontend**
- Framework: React 18+ avec TypeScript
- UI Library: Tailwind CSS + shadcn/ui components
- State Management: Zustand (léger et performant)
- Graphiques: Recharts pour les diagrammes de Gantt
- Date Management: date-fns
- Icons: Lucide React
- PDF Export: jsPDF + html2canvas
- Excel Import/Export: SheetJS (xlsx)

**Backend**
- Runtime: Node.js intégré dans Electron
- Base de données: SQLite3 (better-sqlite3)
- ORM: Drizzle ORM (léger et type-safe)
- API: IPC Electron (communication Renderer ↔ Main process)

**Build & Distribution**
- Electron Forge pour la création du .exe
- electron-builder comme alternative
- Auto-update via electron-updater (optionnel)

---

## Structure de la Base de Données

### Tables Principales

#### 1. `projects`
```sql
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT CHECK(status IN ('not_started', 'in_progress', 'on_hold', 'completed', 'archived')),
  priority TEXT CHECK(priority IN ('low', 'medium', 'high', 'urgent')),
  start_date TEXT,
  end_date TEXT,
  progress INTEGER DEFAULT 0,
  color TEXT DEFAULT '#3B82F6',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
```

#### 2. `tasks`
```sql
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT CHECK(status IN ('todo', 'in_progress', 'review', 'done', 'blocked')),
  priority TEXT CHECK(priority IN ('low', 'medium', 'high', 'urgent')),
  assignee TEXT,
  estimated_hours REAL,
  actual_hours REAL,
  start_date TEXT,
  end_date TEXT,
  parent_task_id TEXT,
  order_index INTEGER,
  tags TEXT, -- JSON array
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_task_id) REFERENCES tasks(id) ON DELETE SET NULL
);
```

#### 3. `milestones`
```sql
CREATE TABLE milestones (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  target_date TEXT NOT NULL,
  status TEXT CHECK(status IN ('pending', 'achieved', 'missed')),
  color TEXT DEFAULT '#10B981',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);
```

#### 4. `resources`
```sql
CREATE TABLE resources (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT,
  email TEXT,
  department TEXT,
  availability REAL DEFAULT 100, -- pourcentage
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
```

#### 5. `task_assignments`
```sql
CREATE TABLE task_assignments (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  allocation_percentage REAL DEFAULT 100,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE,
  UNIQUE(task_id, resource_id)
);
```

#### 6. `comments`
```sql
CREATE TABLE comments (
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
```

#### 7. `attachments`
```sql
CREATE TABLE attachments (
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
```

#### 8. `activity_log`
```sql
CREATE TABLE activity_log (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL, -- 'project', 'task', 'milestone'
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL, -- 'created', 'updated', 'deleted', 'status_changed'
  author TEXT,
  changes TEXT, -- JSON
  created_at TEXT DEFAULT (datetime('now'))
);
```

---

## Architecture Frontend

### Structure des Dossiers

```
src/
├── main/                      # Electron Main Process
│   ├── index.ts              # Point d'entrée principal
│   ├── database/
│   │   ├── schema.ts         # Schémas Drizzle
│   │   ├── migrations/       # Migrations SQL
│   │   └── connection.ts     # Configuration SQLite
│   ├── ipc/                  # Handlers IPC
│   │   ├── projects.ts
│   │   ├── tasks.ts
│   │   ├── milestones.ts
│   │   ├── resources.ts
│   │   └── exports.ts
│   └── utils/
│       ├── excel-importer.ts
│       └── file-manager.ts
│
├── renderer/                  # Electron Renderer Process
│   ├── src/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── components/
│   │   │   ├── ui/           # shadcn/ui components
│   │   │   ├── layout/
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   ├── Header.tsx
│   │   │   │   └── MainLayout.tsx
│   │   │   ├── projects/
│   │   │   │   ├── ProjectList.tsx
│   │   │   │   ├── ProjectCard.tsx
│   │   │   │   ├── ProjectForm.tsx
│   │   │   │   └── ProjectDetail.tsx
│   │   │   ├── tasks/
│   │   │   │   ├── TaskList.tsx
│   │   │   │   ├── TaskCard.tsx
│   │   │   │   ├── TaskForm.tsx
│   │   │   │   ├── TaskKanban.tsx
│   │   │   │   └── TaskDetail.tsx
│   │   │   ├── gantt/
│   │   │   │   ├── GanttChart.tsx
│   │   │   │   ├── GanttTimeline.tsx
│   │   │   │   └── GanttRow.tsx
│   │   │   ├── milestones/
│   │   │   │   ├── MilestoneList.tsx
│   │   │   │   └── MilestoneForm.tsx
│   │   │   ├── resources/
│   │   │   │   ├── ResourceList.tsx
│   │   │   │   ├── ResourceForm.tsx
│   │   │   │   └── ResourceChart.tsx
│   │   │   ├── dashboard/
│   │   │   │   ├── Dashboard.tsx
│   │   │   │   ├── StatsCard.tsx
│   │   │   │   └── ActivityFeed.tsx
│   │   │   └── exports/
│   │   │       ├── ExportDialog.tsx
│   │   │       └── ImportDialog.tsx
│   │   ├── stores/
│   │   │   ├── projectStore.ts
│   │   │   ├── taskStore.ts
│   │   │   ├── milestoneStore.ts
│   │   │   ├── resourceStore.ts
│   │   │   └── uiStore.ts
│   │   ├── hooks/
│   │   │   ├── useProjects.ts
│   │   │   ├── useTasks.ts
│   │   │   └── useIpc.ts
│   │   ├── lib/
│   │   │   ├── ipc-api.ts    # API wrapper pour IPC
│   │   │   ├── date-utils.ts
│   │   │   ├── export-utils.ts
│   │   │   └── constants.ts
│   │   └── types/
│   │       ├── project.ts
│   │       ├── task.ts
│   │       └── common.ts
│   └── index.html
│
└── preload/                   # Preload Script (sécurité)
    └── index.ts
```

---

## Fonctionnalités Principales

### 1. Gestion des Projets

**Vues:**
- Liste des projets (cards avec statistiques)
- Vue détaillée d'un projet
- Création/édition de projet

**Fonctionnalités:**
- Statut du projet (5 états)
- Priorité (4 niveaux)
- Dates de début/fin
- Progression automatique basée sur les tâches
- Code couleur personnalisable
- Filtres et recherche
- Archivage

### 2. Gestion des Tâches

**Vues:**
- Liste hiérarchique (avec sous-tâches)
- Vue Kanban (par statut)
- Vue Gantt (timeline)
- Vue détaillée d'une tâche

**Fonctionnalités:**
- 5 statuts (todo, in_progress, review, done, blocked)
- Priorités
- Assignation de ressources
- Estimation vs temps réel
- Dépendances entre tâches
- Tags personnalisables
- Commentaires
- Pièces jointes
- Glisser-déposer pour réorganiser

### 3. Diagramme de Gantt

**Caractéristiques:**
- Affichage par jour/semaine/mois/trimestre
- Barre de progression par tâche
- Jalons visuels
- Dépendances visuelles (liens entre tâches)
- Zoom et pan
- Export en image (PNG) ou PDF
- Légende avec code couleur

### 4. Gestion des Jalons (Milestones)

**Fonctionnalités:**
- Création de jalons avec date cible
- 3 statuts (pending, achieved, missed)
- Affichage dans le Gantt
- Alertes pour jalons approchant
- Couleurs personnalisables

### 5. Gestion des Ressources

**Fonctionnalités:**
- Création de profils ressources
- Rôle et département
- Taux de disponibilité
- Vue de charge (workload)
- Allocation par tâche
- Graphiques de répartition

### 6. Dashboard / Tableau de Bord

**Widgets:**
- Statistiques globales (projets, tâches, progression)
- Projets en cours
- Tâches urgentes
- Jalons à venir
- Charge des ressources
- Activité récente
- Graphiques d'avancement

### 7. Import/Export

**Import:**
- Excel (.xlsx) avec mapping de colonnes
- CSV
- Validation des données
- Aperçu avant import
- Gestion des erreurs

**Export:**
- PDF complet (rapport de projet)
- Excel avec toutes les données
- PNG/JPG (Gantt, tableaux)
- CSV pour analyse externe

### 8. Recherche et Filtres

**Capacités:**
- Recherche globale full-text
- Filtres par statut
- Filtres par priorité
- Filtres par date
- Filtres par assigné
- Filtres par tags
- Sauvegarde de filtres

---

## Design System (Inspiré de Linear)

### Palette de Couleurs (Mode Clair)

```css
/* Couleurs principales */
--background: #FFFFFF
--foreground: #171717
--card: #FFFFFF
--card-foreground: #171717

/* Bordures et séparateurs */
--border: #E5E7EB
--input: #F3F4F6

/* Accents et états */
--primary: #3B82F6        /* Bleu Linear */
--primary-foreground: #FFFFFF
--secondary: #F3F4F6
--secondary-foreground: #171717
--accent: #F3F4F6
--accent-foreground: #171717

/* États */
--success: #10B981
--warning: #F59E0B
--error: #EF4444
--info: #3B82F6

/* Statuts tâches */
--status-todo: #94A3B8
--status-progress: #3B82F6
--status-review: #F59E0B
--status-done: #10B981
--status-blocked: #EF4444

/* Priorités */
--priority-low: #94A3B8
--priority-medium: #3B82F6
--priority-high: #F59E0B
--priority-urgent: #EF4444

/* Transparences */
--overlay: rgba(0, 0, 0, 0.5)
--hover: rgba(0, 0, 0, 0.04)
--active: rgba(0, 0, 0, 0.08)
```

### Typographie

```css
/* Fonts */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* Scales */
--text-xs: 0.75rem      /* 12px */
--text-sm: 0.875rem     /* 14px */
--text-base: 1rem       /* 16px */
--text-lg: 1.125rem     /* 18px */
--text-xl: 1.25rem      /* 20px */
--text-2xl: 1.5rem      /* 24px */
--text-3xl: 1.875rem    /* 30px */

/* Weights */
--font-normal: 400
--font-medium: 500
--font-semibold: 600
--font-bold: 700
```

### Spacing

```css
/* Scale 8-point grid */
--space-1: 0.25rem    /* 4px */
--space-2: 0.5rem     /* 8px */
--space-3: 0.75rem    /* 12px */
--space-4: 1rem       /* 16px */
--space-5: 1.25rem    /* 20px */
--space-6: 1.5rem     /* 24px */
--space-8: 2rem       /* 32px */
--space-10: 2.5rem    /* 40px */
--space-12: 3rem      /* 48px */
```

### Border Radius

```css
--radius-sm: 0.25rem   /* 4px */
--radius-md: 0.375rem  /* 6px */
--radius-lg: 0.5rem    /* 8px */
--radius-xl: 0.75rem   /* 12px */
--radius-full: 9999px
```

### Composants UI Clés

#### Boutons
- Primary: fond bleu, texte blanc
- Secondary: fond gris clair, texte noir
- Ghost: transparent avec hover
- Danger: fond rouge, texte blanc
- Tailles: sm (32px), md (40px), lg (48px)
- Border radius: 6px
- Transition: 150ms ease

#### Cards
- Fond blanc
- Border 1px gris clair
- Border radius: 8px
- Padding: 16px ou 24px
- Shadow subtile au hover
- Transition smooth

#### Inputs
- Border 1px gris clair
- Border radius: 6px
- Height: 40px
- Padding: 0 12px
- Focus: border bleue, ring bleu subtil
- Placeholder: gris moyen

#### Sidebar
- Largeur: 240px
- Fond: #FAFAFA
- Border droite: 1px gris clair
- Items: hover gris, actif bleu clair
- Icons Lucide 20px
- Texte: 14px medium

---

## IPC API (Communication Frontend ↔ Backend)

### Channels IPC

#### Projects
```typescript
// Invoke (async)
'projects:getAll'
'projects:getById' -> { id: string }
'projects:create' -> { data: ProjectInput }
'projects:update' -> { id: string, data: Partial<ProjectInput> }
'projects:delete' -> { id: string }
'projects:search' -> { query: string }

// On (event listeners)
'projects:updated' -> (project: Project)
'projects:deleted' -> (id: string)
```

#### Tasks
```typescript
'tasks:getAll' -> { projectId?: string }
'tasks:getById' -> { id: string }
'tasks:create' -> { data: TaskInput }
'tasks:update' -> { id: string, data: Partial<TaskInput> }
'tasks:delete' -> { id: string }
'tasks:updateStatus' -> { id: string, status: TaskStatus }
'tasks:reorder' -> { taskId: string, newIndex: number }
'tasks:move' -> { taskId: string, newParentId: string | null }
```

#### Milestones
```typescript
'milestones:getAll' -> { projectId: string }
'milestones:create' -> { data: MilestoneInput }
'milestones:update' -> { id: string, data: Partial<MilestoneInput> }
'milestones:delete' -> { id: string }
```

#### Resources
```typescript
'resources:getAll'
'resources:getById' -> { id: string }
'resources:create' -> { data: ResourceInput }
'resources:update' -> { id: string, data: Partial<ResourceInput> }
'resources:delete' -> { id: string }
'resources:getWorkload' -> { resourceId: string, startDate: string, endDate: string }
```

#### Export/Import
```typescript
'export:pdf' -> { projectId: string, options: ExportOptions }
'export:excel' -> { projectId: string }
'export:ganttImage' -> { projectId: string, format: 'png' | 'jpg' }
'import:excel' -> { filepath: string, mapping: ColumnMapping }
'import:validate' -> { filepath: string }
```

---

## Flux de Données

### Architecture Store (Zustand)

```typescript
// projectStore.ts
interface ProjectStore {
  projects: Project[]
  currentProject: Project | null
  isLoading: boolean
  error: string | null
  
  fetchProjects: () => Promise<void>
  fetchProjectById: (id: string) => Promise<void>
  createProject: (data: ProjectInput) => Promise<void>
  updateProject: (id: string, data: Partial<ProjectInput>) => Promise<void>
  deleteProject: (id: string) => Promise<void>
  setCurrentProject: (project: Project | null) => void
}

// taskStore.ts
interface TaskStore {
  tasks: Task[]
  filteredTasks: Task[]
  filters: TaskFilters
  isLoading: boolean
  error: string | null
  
  fetchTasks: (projectId?: string) => Promise<void>
  createTask: (data: TaskInput) => Promise<void>
  updateTask: (id: string, data: Partial<TaskInput>) => Promise<void>
  deleteTask: (id: string) => Promise<void>
  updateTaskStatus: (id: string, status: TaskStatus) => Promise<void>
  setFilters: (filters: Partial<TaskFilters>) => void
  applyFilters: () => void
}
```

---

## Sécurité

### Context Isolation
- Activation du contextIsolation
- Utilisation de preload script
- Pas d'accès direct à Node.js depuis le renderer
- API exposée via contextBridge

### Content Security Policy
```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self'; 
               style-src 'self' 'unsafe-inline'; 
               img-src 'self' data:;">
```

### Validation des Données
- Validation côté backend avant insertion en DB
- Sanitization des inputs utilisateur
- Validation des fichiers importés

---

## Performance

### Optimisations

1. **Base de données**
   - Index sur colonnes fréquemment requêtées
   - Requêtes préparées (prepared statements)
   - Pagination pour les grandes listes
   - Lazy loading des données

2. **Frontend**
   - React.memo pour éviter re-renders inutiles
   - Virtual scrolling pour longues listes
   - Debouncing pour recherche
   - Code splitting par route

3. **Electron**
   - Désactivation d'Aero sous Windows (optionnel)
   - Utilisation de webPreferences optimisées
   - Gestion mémoire avec limits

---

## Build et Distribution

### Configuration Electron Forge

```javascript
// forge.config.js
module.exports = {
  packagerConfig: {
    name: 'GestionProjet',
    executableName: 'gestion-projet',
    icon: './assets/icon',
    asar: true,
  },
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'GestionProjet',
        setupIcon: './assets/icon.ico',
      }
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin']
    }
  ]
}
```

### Taille Estimée
- Application: ~150-200 MB (incluant Electron runtime)
- Base de données: Variable selon usage (généralement < 50 MB)

---

## Roadmap de Développement

### Phase 1 - MVP (2-3 semaines)
- [ ] Setup Electron + React + TypeScript
- [ ] Configuration base de données SQLite
- [ ] IPC handlers basiques
- [ ] Layout principal (sidebar, header)
- [ ] CRUD Projects
- [ ] CRUD Tasks
- [ ] Vue liste simple

### Phase 2 - Visualisations (2 semaines)
- [ ] Diagramme de Gantt
- [ ] Vue Kanban
- [ ] Dashboard basique
- [ ] Gestion des jalons
- [ ] Filtres et recherche

### Phase 3 - Avancé (2 semaines)
- [ ] Gestion des ressources
- [ ] Sous-tâches et hiérarchie
- [ ] Commentaires et pièces jointes
- [ ] Activity log
- [ ] Export PDF/Excel
- [ ] Import Excel

### Phase 4 - Polish (1 semaine)
- [ ] Animations et transitions
- [ ] Optimisations performances
- [ ] Tests
- [ ] Documentation utilisateur
- [ ] Build final .exe

**Total estimé: 7-8 semaines pour version complète**

---

## Prochaines Étapes Immédiates

1. **Valider cette spécification** avec les besoins réels
2. **Récupérer le fichier Excel** pour analyser la structure des données
3. **Initialiser le projet** Electron avec le boilerplate
4. **Créer les maquettes** des écrans principaux
5. **Commencer le développement** Phase 1

