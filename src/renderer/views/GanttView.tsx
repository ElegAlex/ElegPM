import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Calendar, FileDown } from 'lucide-react';
import { useProjectsStore } from '../stores/projectsStore';
import type { Project } from '../types/project';
import { exportGanttToPDF } from '../lib/pdfExport';
import { useTranslation } from '../i18n/useTranslation';

type GanttViewMode = 'day' | 'week' | 'month';

export const GanttView: React.FC = () => {
  const { t } = useTranslation();
  const { projects, fetchProjects } = useProjectsStore();
  const [isExporting, setIsExporting] = useState(false);
  const [viewMode, setViewMode] = useState<GanttViewMode>('month');
  const ganttRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Filter projects with dates
  const projectsWithDates = useMemo(() => {
    return projects.filter(p => p.startDate && p.endDate);
  }, [projects]);

  // Calculate timeline range based on view mode
  const { timelineStart, timelineEnd, totalDays } = useMemo(() => {
    let start: Date;
    let end: Date;

    if (projectsWithDates.length === 0) {
      start = new Date();
    } else {
      const dates = projectsWithDates.flatMap(p => [
        new Date(p.startDate!),
        new Date(p.endDate!)
      ]);
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
  }, [projectsWithDates, viewMode]);

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

  // Calculate project bar position and width
  const getProjectBarStyle = (project: Project) => {
    const start = new Date(project.startDate!);
    const end = new Date(project.endDate!);

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
      case 'completed': return 'bg-green-500';
      case 'in_progress': return 'bg-blue-500';
      case 'on_hold': return 'bg-yellow-500';
      case 'not_started': return 'bg-gray-400';
      case 'archived': return 'bg-gray-300';
      default: return 'bg-gray-400';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return t('statusCompleted');
      case 'in_progress': return t('statusInProgress');
      case 'on_hold': return t('statusPaused');
      case 'not_started': return t('statusNotStarted');
      case 'archived': return t('statusArchived');
      default: return status;
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
      alert(t('ganttExportError'));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{t('ganttTitle')}</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('ganttDescription')} ({projectsWithDates.length} {t('ganttProjectCount')})
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View mode selector */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                viewMode === 'day'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              {t('ganttViewDay')}
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                viewMode === 'week'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              {t('ganttViewWeek')}
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                viewMode === 'month'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              {t('ganttViewMonth')}
            </button>
          </div>

          <button
            onClick={handleExportPDF}
            disabled={isExporting || projectsWithDates.length === 0}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title={t('ganttExportPDF')}
          >
            <FileDown className="w-5 h-5" />
            {isExporting ? t('ganttExporting') : t('ganttExportPDF')}
          </button>
        </div>
      </div>

      {/* Empty State */}
      {projectsWithDates.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
          <Calendar className="w-16 h-16 mb-4 text-gray-300 dark:text-gray-600" />
          <p className="text-lg font-medium mb-2">{t('ganttNoProjectsWithDates')}</p>
          <p className="text-sm">
            {t('ganttNoProjectsMessage')}
          </p>
        </div>
      )}

      {/* Gantt Chart */}
      {projectsWithDates.length > 0 && (
        <div ref={ganttRef} className="flex-1 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
          {/* Timeline Header */}
          <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <div className="flex">
              {/* Project names column */}
              <div className="w-80 flex-shrink-0 px-4 py-3 border-r border-gray-200 dark:border-gray-700 font-semibold text-sm text-gray-700 dark:text-gray-300">
                {t('ganttProjectsHeader')}
              </div>

              {/* Timeline periods */}
              <div className="flex-1 flex">
                {timelinePeriods.map((period, idx) => (
                  <div
                    key={idx}
                    className="border-r border-gray-200 dark:border-gray-700 last:border-r-0 px-2 py-3 text-center text-sm font-medium text-gray-700 dark:text-gray-300"
                    style={{ width: `${(period.days / totalDays) * 100}%` }}
                  >
                    {period.label}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Projects and Bars */}
          <div className="flex-1 overflow-y-auto">
            {projectsWithDates.map((project) => (
              <div key={project.id} className="flex border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 group">
                {/* Project name and info */}
                <div className="w-80 flex-shrink-0 px-4 py-4 border-r border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: project.color }}
                    />
                    <div className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-1">
                      {project.name}
                    </div>
                  </div>
                  {project.description && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mb-2">
                      {project.description}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-xs">
                    <span className={`px-2 py-0.5 rounded-full ${getStatusColor(project.status)} text-white`}>
                      {getStatusLabel(project.status)}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">
                      {project.progress}%
                    </span>
                  </div>
                </div>

                {/* Timeline bar */}
                <div className="flex-1 relative py-4 px-1">
                  {/* Grid lines (days) */}
                  <div className="absolute inset-0 flex">
                    {Array.from({ length: totalDays }).map((_, i) => (
                      <div
                        key={i}
                        className="border-r border-gray-100 dark:border-gray-700"
                        style={{ width: `${dayWidth}%` }}
                      />
                    ))}
                  </div>

                  {/* Project bar */}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 h-8 rounded-lg cursor-pointer transition-all group-hover:h-9 overflow-hidden shadow-sm"
                    style={{
                      ...getProjectBarStyle(project),
                      backgroundColor: project.color,
                    }}
                    title={`${project.name}\n${new Date(project.startDate!).toLocaleDateString('fr-FR')} - ${new Date(project.endDate!).toLocaleDateString('fr-FR')}\nProgrès: ${project.progress}%`}
                  >
                    {/* Progress bar */}
                    <div
                      className="h-full bg-white/30 dark:bg-gray-900/30"
                      style={{ width: `${project.progress}%` }}
                    />
                    <div className="absolute inset-0 flex items-center justify-between px-3 text-white text-xs font-medium">
                      <span className="truncate">{project.name}</span>
                      <span className="ml-2 flex-shrink-0">{project.progress}%</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-3">
            <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
              <span className="font-medium">{t('ganttViewLabel')}:</span>
              <span>{viewMode === 'day' ? t('gantt30Days') : viewMode === 'week' ? t('gantt12Weeks') : t('gantt12Months')}</span>
              <span>·</span>
              <span className="font-medium">{t('ganttPeriodLabel')}:</span>
              <span>{timelineStart.toLocaleDateString('fr-FR')} - {timelineEnd.toLocaleDateString('fr-FR')}</span>
              <span>·</span>
              <span>{projectsWithDates.length} {t('ganttProjectCount')}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
