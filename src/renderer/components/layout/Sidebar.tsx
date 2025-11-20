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
  Github,
  Globe,
  BookOpen,
  Settings,
} from 'lucide-react';
import { useTranslation } from '../../i18n/useTranslation';

interface SidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange }) => {
  const { t } = useTranslation();

  const menuItems = [
    { id: 'dashboard', label: t('dashboard'), icon: LayoutDashboard },
    { id: 'projects', label: t('projects'), icon: FolderKanban },
    { id: 'tasks', label: t('tasks'), icon: ListTodo },
    { id: 'gantt', label: t('gantt'), icon: GanttChart },
    { id: 'milestones', label: t('milestones'), icon: Flag },
    { id: 'resources', label: t('resources'), icon: Users },
    { id: 'workload', label: t('workload'), icon: BarChart3 },
    { id: 'exports', label: t('export'), icon: FileDown },
    { id: 'settings', label: t('settings'), icon: Settings },
  ];

  const handleExternalLink = async (url: string) => {
    try {
      console.log('Opening external link:', url);
      console.log('window.api:', window.api);
      await window.api.openExternal(url);
      console.log('Link opened successfully');
    } catch (error) {
      console.error('Error opening external link:', error);
    }
  };

  return (
    <aside className="w-60 bg-sidebar dark:bg-gray-900 border-r border-border dark:border-gray-700 h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-border dark:border-gray-700">
        <h1 className="text-xl font-bold text-foreground dark:text-gray-200">ElegPM</h1>
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
                        : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
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

      {/* À propos */}
      <div className="p-4 border-t border-border dark:border-gray-700">
        <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase mb-2">À propos</h3>
        <div className="space-y-1">
          <button
            onClick={() => handleExternalLink('https://github.com/ElegAlex/ElegPM')}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
          >
            <Github size={14} />
            <span>GitHub du projet</span>
          </button>
          <button
            onClick={() => handleExternalLink('https://elegartech.fr')}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
          >
            <Globe size={14} />
            <span>Elegartech.fr</span>
          </button>
          <button
            onClick={() => handleExternalLink('https://communs-numeriques.fr')}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
          >
            <BookOpen size={14} />
            <span>Communs Numériques</span>
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border dark:border-gray-700">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          <p>Version 1.0.0</p>
          <p className="mt-1">2025 Elegartech.fr</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
