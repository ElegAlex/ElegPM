import React, { useEffect, useState, useMemo } from 'react';
import { Filter, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTasksStore } from '../stores/tasksStore';
import { useProjectsStore } from '../stores/projectsStore';
import type { Task } from '../types/task';

export const GanttView: React.FC = () => {
  const { tasks, fetchTasks } = useTasksStore();
  const { projects, fetchProjects } = useProjectsStore();
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [viewStart, setViewStart] = useState(new Date());

  useEffect(() => {
    fetchProjects();
    fetchTasks();
  }, [fetchProjects, fetchTasks]);

  // Filter tasks with dates
  const tasksWithDates = useMemo(() => {
    const filtered = selectedProject === 'all'
      ? tasks
      : tasks.filter(t => t.projectId === selectedProject);

    return filtered.filter(t => t.startDate && t.endDate);
  }, [tasks, selectedProject]);

  // Calculate timeline range
  const { timelineStart, timelineEnd, totalDays } = useMemo(() => {
    if (tasksWithDates.length === 0) {
      const start = new Date();
      start.setDate(1);
      const end = new Date(start);
      end.setMonth(end.getMonth() + 3);
      return {
        timelineStart: start,
        timelineEnd: end,
        totalDays: 90,
      };
    }

    const dates = tasksWithDates.flatMap(t => [
      new Date(t.startDate!),
      new Date(t.endDate!)
    ]);

    let start = new Date(Math.min(...dates.map(d => d.getTime())));
    let end = new Date(Math.max(...dates.map(d => d.getTime())));

    // Add padding
    start.setDate(start.getDate() - 7);
    end.setDate(end.getDate() + 7);

    // Round to month start/end
    start.setDate(1);
    end.setMonth(end.getMonth() + 1);
    end.setDate(0);

    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    return {
      timelineStart: start,
      timelineEnd: end,
      totalDays: days,
    };
  }, [tasksWithDates]);

  // Generate months for timeline
  const months = useMemo(() => {
    const result = [];
    const current = new Date(timelineStart);

    while (current <= timelineEnd) {
      const daysInMonth = new Date(current.getFullYear(), current.getMonth() + 1, 0).getDate();
      result.push({
        date: new Date(current),
        label: current.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }),
        days: daysInMonth,
      });
      current.setMonth(current.getMonth() + 1);
    }

    return result;
  }, [timelineStart, timelineEnd]);

  // Calculate task bar position and width
  const getTaskBarStyle = (task: Task) => {
    const start = new Date(task.startDate!);
    const end = new Date(task.endDate!);

    const daysFromStart = Math.floor((start.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24));
    const duration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const left = (daysFromStart / totalDays) * 100;
    const width = (duration / totalDays) * 100;

    return {
      left: `${Math.max(0, left)}%`,
      width: `${Math.min(100 - left, width)}%`,
    };
  };

  const getProjectColor = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project?.color || '#3B82F6';
  };

  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project?.name || 'Projet inconnu';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done': return 'bg-green-500';
      case 'in_progress': return 'bg-blue-500';
      case 'blocked': return 'bg-red-500';
      case 'review': return 'bg-purple-500';
      default: return 'bg-gray-400';
    }
  };

  const dayWidth = 100 / totalDays;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Diagramme de Gantt</h2>
          <p className="text-sm text-gray-600">
            Visualisation temporelle des tâches ({tasksWithDates.length} tâches)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Filter className="w-5 h-5 text-gray-500" />
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tous les projets</option>
            {projects.map(project => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Empty State */}
      {tasksWithDates.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
          <Calendar className="w-16 h-16 mb-4 text-gray-300" />
          <p className="text-lg font-medium mb-2">Aucune tâche avec dates</p>
          <p className="text-sm">
            Les tâches doivent avoir une date de début et de fin pour apparaître dans le Gantt
          </p>
        </div>
      )}

      {/* Gantt Chart */}
      {tasksWithDates.length > 0 && (
        <div className="flex-1 bg-white rounded-lg border border-gray-200 overflow-hidden flex flex-col">
          {/* Timeline Header */}
          <div className="border-b border-gray-200 bg-gray-50">
            <div className="flex">
              {/* Task names column */}
              <div className="w-64 flex-shrink-0 px-4 py-3 border-r border-gray-200 font-semibold text-sm text-gray-700">
                Tâches
              </div>

              {/* Timeline months */}
              <div className="flex-1 flex">
                {months.map((month, idx) => (
                  <div
                    key={idx}
                    className="border-r border-gray-200 last:border-r-0 px-2 py-3 text-center text-sm font-medium text-gray-700"
                    style={{ width: `${(month.days / totalDays) * 100}%` }}
                  >
                    {month.label}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tasks and Bars */}
          <div className="flex-1 overflow-y-auto">
            {tasksWithDates.map((task) => (
              <div key={task.id} className="flex border-b border-gray-100 hover:bg-gray-50 group">
                {/* Task name */}
                <div className="w-64 flex-shrink-0 px-4 py-3 border-r border-gray-200">
                  <div className="text-sm font-medium text-gray-900 line-clamp-1">
                    {task.title}
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: getProjectColor(task.projectId) }}
                    />
                    <span className="text-xs text-gray-500 truncate">
                      {getProjectName(task.projectId)}
                    </span>
                  </div>
                </div>

                {/* Timeline bar */}
                <div className="flex-1 relative py-3 px-1">
                  {/* Grid lines (days) */}
                  <div className="absolute inset-0 flex">
                    {Array.from({ length: totalDays }).map((_, i) => (
                      <div
                        key={i}
                        className="border-r border-gray-100"
                        style={{ width: `${dayWidth}%` }}
                      />
                    ))}
                  </div>

                  {/* Task bar */}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 h-6 rounded cursor-pointer transition-all group-hover:h-7"
                    style={{
                      ...getTaskBarStyle(task),
                      backgroundColor: getProjectColor(task.projectId),
                      opacity: 0.8,
                    }}
                    title={`${task.title}\n${new Date(task.startDate!).toLocaleDateString('fr-FR')} - ${new Date(task.endDate!).toLocaleDateString('fr-FR')}`}
                  >
                    <div className="h-full flex items-center justify-between px-2 text-white text-xs font-medium truncate">
                      <span className="truncate">{task.title}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="border-t border-gray-200 bg-gray-50 px-4 py-2">
            <div className="flex items-center gap-4 text-xs text-gray-600">
              <span>Période: {timelineStart.toLocaleDateString('fr-FR')} - {timelineEnd.toLocaleDateString('fr-FR')}</span>
              <span>·</span>
              <span>{totalDays} jours</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
