import React from 'react';
import { useTranslation } from '../../i18n/useTranslation';

interface HeaderProps {
  currentView: string;
}

const Header: React.FC<HeaderProps> = ({ currentView }) => {
  const { t } = useTranslation();

  const getViewTitle = () => {
    const titles: Record<string, string> = {
      dashboard: t('dashboard'),
      projects: t('projects'),
      tasks: t('tasks'),
      gantt: t('gantt'),
      milestones: t('milestones'),
      resources: t('resources'),
      workload: t('workload'),
      settings: t('settings'),
      exports: t('export') + ' / ' + t('import'),
    };
    return titles[currentView] || 'ElegPM';
  };

  return (
    <header className="h-16 border-b border-border dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center px-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground dark:text-white">{getViewTitle()}</h2>
      </div>
    </header>
  );
};

export default Header;
