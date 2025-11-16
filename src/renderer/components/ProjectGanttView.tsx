import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Calendar, FileDown, Flag } from 'lucide-react';
import { useTasksStore } from '../stores/tasksStore';
import { useMilestonesStore } from '../stores/milestonesStore';
import type { Task } from '../types/task';
import { exportGanttToPDF } from '../lib/pdfExport';

interface ProjectGanttViewProps {
  projectId: string;
  projectColor: string;
}

type GanttViewMode = 'day' | 'week' | 'month';

export const ProjectGanttView: React.FC<ProjectGanttViewProps> = ({ projectId, projectColor }) => {
  const { tasks, fetchTasks } = useTasksStore();
  const { milestones, fetchMilestones } = useMilestonesStore();
  const [isExporting, setIsExporting] = useState(false);
  const [viewMode, setViewMode] = useState<GanttViewMode>('month');
  const ganttRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchTasks();
    fetchMilestones();
  }, [fetchTasks, fetchMilestones]);

  // Filter tasks for this project with dates
  const projectTasksWithDates = useMemo(() => {
    return tasks
      .filter(t => t.projectId === projectId && t.startDate && t.endDate);
  }, [tasks, projectId]);

  // Filter milestones for this project
  const projectMilestones = useMemo(() => {
    return milestones.filter(m => m.projectId === projectId);
  }, [milestones, projectId]);

  // Combine tasks and milestones into a chronologically sorted list
  type TimelineItem =
    | { type: 'task'; data: Task; sortDate: Date }
    | { type: 'milestone'; data: typeof projectMilestones[0]; sortDate: Date };

  const timelineItems = useMemo(() => {
    const items: TimelineItem[] = [
      ...projectTasksWithDates.map(task => ({
        type: 'task' as const,
        data: task,
        sortDate: new Date(task.endDate!),
      })),
      ...projectMilestones.map(milestone => ({
        type: 'milestone' as const,
        data: milestone,
        sortDate: new Date(milestone.targetDate),
      })),
    ];

    // Sort by date, milestones appear above tasks on the same date
    items.sort((a, b) => {
      const dateDiff = a.sortDate.getTime() - b.sortDate.getTime();
      if (dateDiff !== 0) return dateDiff;
      // Same date: milestone comes first
      if (a.type === 'milestone' && b.type === 'task') return -1;
      if (a.type === 'task' && b.type === 'milestone') return 1;
      return 0;
    });

    return items;
  }, [projectTasksWithDates, projectMilestones]);

  // Calculate timeline range based on view mode
  const { timelineStart, timelineEnd, totalDays } = useMemo(() => {
    let start: Date;
    let end: Date;

    if (projectTasksWithDates.length === 0 && projectMilestones.length === 0) {
      start = new Date();
    } else {
      const dates = [
        ...projectTasksWithDates.flatMap(t => [
          new Date(t.startDate!),
          new Date(t.endDate!)
        ]),
        ...projectMilestones.map(m => new Date(m.targetDate))
      ];
      start = new Date(Math.min(...dates.map(d => d.getTime())));
    }

    // Calculate end based on view mode
    switch (viewMode) {
      case 'day':
        // 30 days view
        start.setHours(0, 0, 0, 0);
        end = new Date(start);
        end.setDate(end.getDate() + 30);
        break;
      case 'week':
        // 12 weeks view (84 days)
        start.setHours(0, 0, 0, 0);
        // Round to week start (Monday)
        const day = start.getDay();
        const diff = day === 0 ? -6 : 1 - day;
        start.setDate(start.getDate() + diff);
        end = new Date(start);
        end.setDate(end.getDate() + (12 * 7));
        break;
      case 'month':
        // 12 months view
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        end = new Date(start);
        end.setMonth(end.getMonth() + 12);
        end.setDate(0);
        break;
    }

    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    return {
      timelineStart: start,
      timelineEnd: end,
      totalDays: days,
    };
  }, [projectTasksWithDates, projectMilestones, viewMode]);

  // Generate timeline periods based on view mode
  const timelinePeriods = useMemo(() => {
    const result = [];
    const current = new Date(timelineStart);

    switch (viewMode) {
      case 'day':
        // Generate days
        while (current <= timelineEnd) {
          result.push({
            date: new Date(current),
            label: current.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
            days: 1,
          });
          current.setDate(current.getDate() + 1);
        }
        break;

      case 'week':
        // Generate weeks
        while (current <= timelineEnd) {
          const weekEnd = new Date(current);
          weekEnd.setDate(weekEnd.getDate() + 6);
          const weekNumber = Math.ceil(((current.getTime() - new Date(current.getFullYear(), 0, 1).getTime()) / 86400000 + 1) / 7);
          result.push({
            date: new Date(current),
            label: `S${weekNumber}`,
            days: 7,
          });
          current.setDate(current.getDate() + 7);
        }
        break;

      case 'month':
        // Generate months
        while (current <= timelineEnd) {
          const daysInMonth = new Date(current.getFullYear(), current.getMonth() + 1, 0).getDate();
          result.push({
            date: new Date(current),
            label: current.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }),
            days: daysInMonth,
          });
          current.setMonth(current.getMonth() + 1);
        }
        break;
    }

    return result;
  }, [timelineStart, timelineEnd, viewMode]);

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done': return 'bg-green-500';
      case 'in_progress': return 'bg-blue-500';
      case 'blocked': return 'bg-red-500';
      case 'review': return 'bg-purple-500';
      default: return 'bg-gray-400';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'done': return 'Terminé';
      case 'in_progress': return 'En cours';
      case 'blocked': return 'Bloqué';
      case 'review': return 'En revue';
      case 'todo': return 'À faire';
      default: return status;
    }
  };

  const getMilestoneMarkerStyle = (targetDate: string) => {
    const date = new Date(targetDate);
    const daysFromStart = Math.floor((date.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24));
    const position = (daysFromStart / totalDays) * 100;
    const left = Math.max(0, Math.min(100, position));

    return {
      left: `${left}%`,
    };
  };

  const getMilestoneStatusColor = (status: string) => {
    switch (status) {
      case 'achieved': return 'bg-green-100 text-green-700 border-green-300';
      case 'missed': return 'bg-red-100 text-red-700 border-red-300';
      default: return 'bg-blue-100 text-blue-700 border-blue-300';
    }
  };

  const getMilestoneStatusLabel = (status: string) => {
    switch (status) {
      case 'achieved': return 'Atteint';
      case 'missed': return 'Manqué';
      default: return 'En attente';
    }
  };

  const dayWidth = 100 / totalDays;

  const handleExportPDF = async () => {
    if (!ganttRef.current) return;

    try {
      setIsExporting(true);
      await exportGanttToPDF(ganttRef.current);
    } catch (error) {
      console.error('Error exporting Gantt to PDF:', error);
      alert('Erreur lors de l\'export du Gantt en PDF');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Gantt du projet</h3>
          <p className="text-sm text-gray-600">
            {projectTasksWithDates.length} tâche(s) · {projectMilestones.length} jalon(s)
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View mode selector */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                viewMode === 'day'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Jour
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                viewMode === 'week'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Semaine
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                viewMode === 'month'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Mois
            </button>
          </div>

          <button
            onClick={handleExportPDF}
            disabled={isExporting || timelineItems.length === 0}
            className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Exporter en PDF"
          >
            <FileDown className="w-4 h-4" />
            {isExporting ? 'Export...' : 'PDF'}
          </button>
        </div>
      </div>

      {/* Empty State */}
      {timelineItems.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-500 bg-gray-50 rounded-lg">
          <Calendar className="w-12 h-12 mb-3 text-gray-300" />
          <p className="text-sm font-medium mb-1">Aucune tâche avec dates ni jalon</p>
          <p className="text-xs text-gray-500">
            Ajoutez des tâches avec dates ou des jalons pour voir le Gantt
          </p>
        </div>
      )}

      {/* Gantt Chart */}
      {timelineItems.length > 0 && (
        <div ref={ganttRef} className="flex-1 bg-white rounded-lg border border-gray-200 overflow-hidden flex flex-col">
          {/* Timeline Header */}
          <div className="border-b border-gray-200 bg-gray-50">
            <div className="flex">
              {/* Task names column */}
              <div className="w-64 flex-shrink-0 px-3 py-2 border-r border-gray-200 font-semibold text-xs text-gray-700">
                Tâches
              </div>

              {/* Timeline periods */}
              <div className="flex-1 flex">
                {timelinePeriods.map((period, idx) => (
                  <div
                    key={idx}
                    className="border-r border-gray-200 last:border-r-0 px-2 py-2 text-center text-xs font-medium text-gray-700"
                    style={{ width: `${(period.days / totalDays) * 100}%` }}
                  >
                    {period.label}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tasks and Milestones */}
          <div className="flex-1 overflow-y-auto">
            {timelineItems.map((item) => (
              <div
                key={item.type === 'task' ? item.data.id : `milestone-${item.data.id}`}
                className="flex border-b border-gray-100 hover:bg-gray-50 group"
              >
                {item.type === 'task' ? (
                  <>
                    {/* Task name */}
                    <div className="w-64 flex-shrink-0 px-3 py-2.5 border-r border-gray-200">
                      <div className="text-xs font-medium text-gray-900 line-clamp-1 mb-1">
                        {item.data.title}
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className={`px-1.5 py-0.5 rounded ${getStatusColor(item.data.status)} text-white`}>
                          {getStatusLabel(item.data.status)}
                        </span>
                        {item.data.estimatedHours && (
                          <span className="text-gray-500">
                            {item.data.estimatedHours}h
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Timeline bar */}
                    <div className="flex-1 relative py-2.5 px-1">
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
                        className="absolute top-1/2 -translate-y-1/2 h-5 rounded cursor-pointer transition-all group-hover:h-6 shadow-sm"
                        style={{
                          ...getTaskBarStyle(item.data),
                          backgroundColor: projectColor,
                          opacity: 0.9,
                        }}
                        title={`${item.data.title}\n${new Date(item.data.startDate!).toLocaleDateString('fr-FR')} - ${new Date(item.data.endDate!).toLocaleDateString('fr-FR')}\nStatut: ${getStatusLabel(item.data.status)}`}
                      >
                        <div className="h-full flex items-center justify-between px-2 text-white text-xs font-medium truncate">
                          <span className="truncate">{item.data.title}</span>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Milestone name */}
                    <div className="w-64 flex-shrink-0 px-3 py-2.5 border-r border-gray-200 bg-gray-50">
                      <div className="flex items-center gap-2 mb-1">
                        <Flag className="w-4 h-4 text-gray-600" />
                        <div className="text-xs font-semibold text-gray-900 line-clamp-1">
                          {item.data.name}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className={`px-1.5 py-0.5 rounded border ${getMilestoneStatusColor(item.data.status)}`}>
                          {getMilestoneStatusLabel(item.data.status)}
                        </span>
                        <span className="text-gray-500">
                          {new Date(item.data.targetDate).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    </div>

                    {/* Timeline marker */}
                    <div className="flex-1 relative py-2.5 px-1">
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

                      {/* Milestone marker (diamond) */}
                      <div
                        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
                        style={getMilestoneMarkerStyle(item.data.targetDate)}
                      >
                        <div
                          className={`w-4 h-4 rotate-45 border-2 ${getMilestoneStatusColor(item.data.status)} shadow-md cursor-pointer`}
                          title={`Jalon: ${item.data.name}\nDate: ${new Date(item.data.targetDate).toLocaleDateString('fr-FR')}\nStatut: ${getMilestoneStatusLabel(item.data.status)}`}
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="border-t border-gray-200 bg-gray-50 px-3 py-2">
            <div className="flex items-center gap-3 text-xs text-gray-600 flex-wrap">
              <span className="font-medium">Vue:</span>
              <span>{viewMode === 'day' ? '30 jours' : viewMode === 'week' ? '12 semaines' : '12 mois'}</span>
              <span>·</span>
              <span className="font-medium">Période:</span>
              <span>{timelineStart.toLocaleDateString('fr-FR')} - {timelineEnd.toLocaleDateString('fr-FR')}</span>
              <span>·</span>
              <span>{projectTasksWithDates.length} tâche(s)</span>
              <span>·</span>
              <span>{projectMilestones.length} jalon(s)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
