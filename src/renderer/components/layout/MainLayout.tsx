import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { DashboardView } from '../../views/DashboardView';
import { ProjectsView } from '../../views/ProjectsView';
import { TasksView } from '../../views/TasksView';
import { GanttView } from '../../views/GanttView';
import { MilestonesView } from '../../views/MilestonesView';
import { ResourcesView } from '../../views/ResourcesView';

const MainLayout: React.FC = () => {
  const [currentView, setCurrentView] = useState('dashboard');

  const renderContent = () => {
    switch (currentView) {
      case 'projects':
        return (
          <div className="p-8 h-full">
            <div className="max-w-7xl mx-auto h-full">
              <ProjectsView />
            </div>
          </div>
        );

      case 'tasks':
        return (
          <div className="p-8 h-full">
            <div className="max-w-full mx-auto h-full px-4">
              <TasksView />
            </div>
          </div>
        );

      case 'gantt':
        return (
          <div className="p-8 h-full">
            <div className="max-w-full mx-auto h-full px-4">
              <GanttView />
            </div>
          </div>
        );

      case 'milestones':
        return (
          <div className="p-8 h-full">
            <div className="max-w-7xl mx-auto h-full">
              <MilestonesView />
            </div>
          </div>
        );

      case 'resources':
        return (
          <div className="p-8 h-full">
            <div className="max-w-7xl mx-auto h-full">
              <ResourcesView />
            </div>
          </div>
        );

      case 'dashboard':
      default:
        return (
          <div className="p-8">
            <div className="max-w-7xl mx-auto">
              <DashboardView />
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar currentView={currentView} onViewChange={setCurrentView} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header currentView={currentView} />

        <main className="flex-1 overflow-y-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
