import React from 'react';

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
    <header className="h-16 border-b border-border bg-white flex items-center px-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">{getViewTitle()}</h2>
      </div>
    </header>
  );
};

export default Header;
