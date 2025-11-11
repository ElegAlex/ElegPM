import React, { useState } from 'react';
import {
  LayoutDashboard,
  FolderKanban,
  ListTodo,
  GanttChart,
  Flag,
  Users,
  BarChart3,
  FileDown,
} from 'lucide-react';

interface SidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'projects', label: 'Projets', icon: FolderKanban },
    { id: 'tasks', label: 'Tâches', icon: ListTodo },
    { id: 'gantt', label: 'Gantt', icon: GanttChart },
    { id: 'milestones', label: 'Jalons', icon: Flag },
    { id: 'resources', label: 'Ressources', icon: Users },
    { id: 'workload', label: 'Charge de travail', icon: BarChart3 },
    { id: 'exports', label: 'Export', icon: FileDown },
  ];

  return (
    <aside className="w-60 bg-sidebar border-r border-border h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <h1 className="text-xl font-bold text-foreground">Gestion Projet</h1>
        <p className="text-xs text-gray-500 mt-1">CPAM Île-de-France</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;

            return (
              <li key={item.id}>
                <button
                  onClick={() => onViewChange(item.id)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium
                    transition-colors duration-150
                    ${
                      isActive
                        ? 'bg-primary text-white'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }
                  `}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <div className="text-xs text-gray-500">
          <p>Version 1.0.0</p>
          <p className="mt-1">© 2025 CPAM IDF</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
