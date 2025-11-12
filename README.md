# ElegPM - Project Management Desktop Application

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20Linux-lightgrey.svg)]()

> Modern desktop project management application inspired by Linear, with JSON file storage and React/TypeScript interface. Deployable as a standalone executable for local use without network dependencies.

---

## 📋 Overview

ElegPM is a desktop application designed to track complex projects in environments where external hosting is difficult to validate. A perfect standalone solution for local use with easy export capabilities for sharing.

### Main Use Cases

Track projects involving:
- Multiple resources and activities
- Workshops and team collaboration
- Organization by service/department
- Deliverables with milestones
- Detailed planning and scheduling
- Export capabilities for sharing and reporting

**Problems Solved**:
- ✅ No dependency on external hosting
- ✅ Simple installation on Windows/Linux
- ✅ PDF/Excel export for offline sharing
- ✅ Ergonomic and intuitive interface
- ✅ Performant local file-based storage
- ✅ Import existing projects from Excel

---

## 🎯 Main Features

### Project Management
- Create/edit/delete projects
- 5 statuses (not started, in progress, paused, completed, archived)
- 4 priority levels (low, medium, high, urgent)
- Automatic progress tracking
- Customizable color coding

### Task Management
- Hierarchical organization (tasks/subtasks)
- 5 statuses (to do, in progress, review, done, blocked)
- Resource assignment
- Estimation vs actual time
- Customizable tags
- Comments and attachments
- Task dependencies

### Visualizations
- **Dashboard**: Overview with statistics and recent activity
- **List View**: Hierarchical task organization
- **Kanban View**: Organization by status with drag & drop
- **Gantt Chart**: Timeline with milestones and dependencies
- **Resource View**: Workload and allocation

### Milestones
- Target date definition
- 3 statuses (pending, achieved, missed)
- Display in Gantt chart
- Alerts for upcoming milestones

### Import/Export
- **Import**: Excel (.xlsx) with flexible column mapping
- **Export PDF**: Complete report with all sections
- **Export Excel**: Complete data for analysis
- **Export PNG/JPG**: Gantt charts and visualizations

### Resources
- Team management (name, role, department, email)
- Availability rate
- Task allocation with percentage
- Workload view

---

## 🏗️ Technical Architecture

### Technology Stack

**Frontend**
- React 18 + TypeScript
- Tailwind CSS + shadcn/ui
- Zustand (state management)
- Recharts (charts)
- Lucide React (icons)
- date-fns (date handling)

**Backend**
- Electron (desktop wrapper)
- JSON file storage (local data persistence)
- Node.js (integrated runtime)

**Build**
- Electron Forge
- Webpack
- TypeScript compiler

### Data Storage Structure

JSON file-based storage with 8 main entities:
1. **projects**: Project information
2. **tasks**: Tasks with hierarchy
3. **milestones**: Project milestones
4. **resources**: Team/resources
5. **task_assignments**: Resource → task allocation
6. **comments**: Comments on tasks/projects
7. **attachments**: Attached files metadata
8. **activity_log**: Action history

### IPC Communication

Secure architecture with:
- **Main Process**: Manages file storage and system operations
- **Renderer Process**: Isolated React interface
- **Preload Script**: Secure API exposure via contextBridge
- **IPC Channels**: Async communication via electron ipcMain/ipcRenderer

---

## 🎨 Design

### Linear-Inspired (Light Mode)

- Clean and modern interface
- Generous spacing (8-point grid)
- Inter typography
- Smooth transitions (150ms)
- No unnecessary frills

### Color Palette

```css
Primary:    #3B82F6 (Blue)
Success:    #10B981 (Green)
Warning:    #F59E0B (Orange)
Error:      #EF4444 (Red)
Background: #FFFFFF (White)
Foreground: #171717 (Near Black)
Border:     #E5E7EB (Light Gray)
```

### UI Components

- Buttons: 3 variants × 3 sizes
- Inputs: Blue focus ring, inline validation
- Cards: Subtle shadow, hover lift
- Badges: Colored status and priority
- Sidebar: 240px, #FAFAFA background
- Tooltips: Details on hover
- Modals: Overlay + center, fade animation

---

## 📦 Distribution

### Distribution Format

**File**: `ElegPM-{platform}-x64-1.0.0.zip` (Windows/Linux)
- Size: ~100-105 MB (including Electron runtime)
- Installation: Extract and run
- Data: `%APPDATA%/ElegPM/` (Windows) or `~/.config/ElegPM/` (Linux)

### System Requirements

- **OS**: Windows 10/11 or Linux (64-bit)
- **RAM**: 2 GB minimum, 4 GB recommended
- **Disk**: 300 MB free space
- **Processor**: Dual-core 2 GHz minimum

---

## 🚀 Quick Start

### Installation for Development

```bash
# 1. Clone the repository
git clone https://github.com/ElegAlex/ElegPM.git
cd ElegPM

# 2. Install dependencies
npm install

# 3. Run in development mode
npm start
```

### Production Build

```bash
# Build packages for distribution
npm run make

# Packages will be in: out/make/zip/{platform}/x64/
```

---

## 🔧 Customization

### Easy Configuration

All customizable elements are centralized:

**Colors**: `tailwind.config.js`
```javascript
colors: {
  primary: "#3B82F6",  // Change main color
  success: "#10B981",
  // ...
}
```

**Constants**: `src/renderer/lib/constants.ts`
```typescript
export const APP_NAME = "ElegPM";
export const DEFAULT_PROJECT_COLOR = "#3B82F6";
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
```

---

## 📝 Development Notes

### Best Practices

1. **TypeScript Strict**: Enable strict mode
2. **Atomic Commits**: One commit = one feature
3. **Tests**: Add unit tests for business logic
4. **Documentation**: Comment complex code
5. **Logs**: Use console.log intelligently (dev only)

### Security

- ✅ Context isolation enabled
- ✅ Node integration disabled
- ✅ Preload script for API exposure
- ✅ Input validation
- ✅ Data sanitization
- ✅ CSP headers

### Performance

- Pagination for large lists
- Virtual scrolling (react-window)
- Debouncing for search
- Lazy loading of images
- React memoization (React.memo)

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

Copyright (c) 2025 Alexandre BERGE

---

## 👤 Author

**Alexandre BERGE**
- Website: [Elegartech.fr](https://elegartech.fr)
- GitHub: [@ElegAlex](https://github.com/ElegAlex)
- Blog: [Communs Numériques](https://communs-numeriques.fr)

---

## 🙏 Acknowledgments

Built with modern web technologies and inspired by Linear's clean design philosophy.

---

**Version**: 1.0.0
**Last Updated**: November 2025

---

Made with ❤️ by Alexandre BERGE
