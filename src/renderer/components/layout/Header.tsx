import React from 'react';
import { Search, Bell, Settings } from 'lucide-react';

interface HeaderProps {
  currentView: string;
}

const Header: React.FC<HeaderProps> = ({ currentView }) => {
  const getViewTitle = () => {
    const titles: Record<string, string> = {
      dashboard: 'Dashboard',
      projects: 'Projets',
      tasks: 'Tâches',
      gantt: 'Diagramme de Gantt',
      milestones: 'Jalons',
      resources: 'Ressources',
      exports: 'Import / Export',
    };
    return titles[currentView] || 'Gestion de Projet';
  };

  return (
    <header className="h-16 border-b border-border bg-white flex items-center justify-between px-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">{getViewTitle()}</h2>
      </div>

      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Rechercher..."
            className="pl-10 pr-4 py-2 border border-input rounded-md bg-input text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent w-64"
          />
        </div>

        {/* Notifications */}
        <button className="p-2 hover:bg-gray-100 rounded-md transition-colors">
          <Bell size={20} className="text-gray-600" />
        </button>

        {/* Settings */}
        <button className="p-2 hover:bg-gray-100 rounded-md transition-colors">
          <Settings size={20} className="text-gray-600" />
        </button>
      </div>
    </header>
  );
};

export default Header;
