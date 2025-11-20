import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { DashboardView } from '../../views/DashboardView';
import { ProjectsView } from '../../views/ProjectsView';
import { ProjectDetailView } from '../../views/ProjectDetailView';
import { TasksView } from '../../views/TasksView';
import { GanttView } from '../../views/GanttView';
import { MilestonesView } from '../../views/MilestonesView';
import { ResourcesView } from '../../views/ResourcesView';
import { WorkloadView } from '../../views/WorkloadView';
import { SettingsView } from '../../views/SettingsView';

const MainLayout: React.FC = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const handleProjectClick = (projectId: string) => {
    setSelectedProjectId(projectId);
  };

  const handleBackToProjects = () => {
    setSelectedProjectId(null);
  };

  const handleViewChange = (view: string) => {
    setCurrentView(view);
    setSelectedProjectId(null); // Reset project selection when changing views
  };

  const renderContent = () => {
    switch (currentView) {
      case 'projects':
        return (
          <div className="p-8 h-full">
            <div className="max-w-7xl mx-auto h-full">
              {selectedProjectId ? (
                <ProjectDetailView
                  projectId={selectedProjectId}
                  onBack={handleBackToProjects}
                />
              ) : (
                <ProjectsView onProjectClick={handleProjectClick} />
              )}
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

      case 'workload':
        return (
          <div className="p-8 h-full">
            <div className="max-w-7xl mx-auto h-full">
              <WorkloadView />
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="h-full">
            <div className="max-w-7xl mx-auto h-full">
              <SettingsView />
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
    <div className="flex h-screen bg-background dark:bg-gray-900 overflow-hidden">
      <Sidebar currentView={currentView} onViewChange={handleViewChange} />

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
