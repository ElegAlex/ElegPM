import React, { useState } from 'react';
import { X, Calendar, Clock, User, Tag } from 'lucide-react';
import type { Task } from '../types/task';
import { CommentsList } from './CommentsList';
import { CommentForm } from './CommentForm';
import { AttachmentsList } from './AttachmentsList';
import { AttachmentUploadForm } from './AttachmentUploadForm';

interface TaskDetailModalProps {
  task: Task;
  projectName: string;
  projectColor: string;
  onClose: () => void;
}

const statusConfig = {
  todo: { label: 'À faire', color: 'bg-gray-100 text-gray-700' },
  in_progress: { label: 'En cours', color: 'bg-blue-100 text-blue-700' },
  review: { label: 'En revue', color: 'bg-purple-100 text-purple-700' },
  done: { label: 'Terminé', color: 'bg-green-100 text-green-700' },
  blocked: { label: 'Bloqué', color: 'bg-red-100 text-red-700' },
};

const priorityConfig = {
  low: { label: 'Basse', color: 'text-gray-600' },
  medium: { label: 'Moyenne', color: 'text-blue-600' },
  high: { label: 'Haute', color: 'text-orange-600' },
  urgent: { label: 'Urgente', color: 'text-red-600' },
};

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  projectName,
  projectColor,
  onClose
}) => {
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [showAttachmentForm, setShowAttachmentForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCommentAdded = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleAttachmentAdded = () => {
    setRefreshKey(prev => prev + 1);
  };

  const parseTags = (tags: any): string[] => {
    if (typeof tags === 'string') {
      try {
        return JSON.parse(tags || '[]');
      } catch {
        return [];
      }
    }
    return Array.isArray(tags) ? tags : [];
  };

  const taskTags = parseTags(task.tags);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-200">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: projectColor }}
              />
              <span className="text-sm text-gray-600">{projectName}</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">{task.title}</h2>
            <div className="flex items-center gap-3 flex-wrap">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusConfig[task.status].color}`}>
                {statusConfig[task.status].label}
              </span>
              <span className={`text-sm font-medium ${priorityConfig[task.priority].color}`}>
                Priorité: {priorityConfig[task.priority].label}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Description */}
          {task.description && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Description</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{task.description}</p>
            </div>
          )}

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Assignee */}
            {task.assignee && (
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">Assigné à:</span>
                <span className="font-medium text-gray-900">{task.assignee}</span>
              </div>
            )}

            {/* Estimated Hours */}
            {task.estimatedHours && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">Temps estimé:</span>
                <span className="font-medium text-gray-900">{task.estimatedHours}h</span>
              </div>
            )}

            {/* Actual Hours */}
            {task.actualHours && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">Temps réel:</span>
                <span className="font-medium text-gray-900">{task.actualHours}h</span>
              </div>
            )}

            {/* Start Date */}
            {task.startDate && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">Début:</span>
                <span className="font-medium text-gray-900">
                  {new Date(task.startDate).toLocaleDateString('fr-FR')}
                </span>
              </div>
            )}

            {/* End Date */}
            {task.endDate && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">Échéance:</span>
                <span className="font-medium text-gray-900">
                  {new Date(task.endDate).toLocaleDateString('fr-FR')}
                </span>
              </div>
            )}
          </div>

          {/* Tags */}
          {taskTags.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Tag className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-semibold text-gray-700">Tags</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {taskTags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Divider */}
          <div className="border-t border-gray-200" />

          {/* Attachments */}
          <AttachmentsList
            key={`attachments-${refreshKey}`}
            taskId={task.id}
            onAddAttachment={() => setShowAttachmentForm(true)}
          />

          {/* Divider */}
          <div className="border-t border-gray-200" />

          {/* Comments */}
          <CommentsList
            key={`comments-${refreshKey}`}
            taskId={task.id}
            onAddComment={() => setShowCommentForm(true)}
          />
        </div>
      </div>

      {/* Comment Form Modal */}
      {showCommentForm && (
        <CommentForm
          taskId={task.id}
          onClose={() => setShowCommentForm(false)}
          onCommentAdded={handleCommentAdded}
        />
      )}

      {/* Attachment Upload Form Modal */}
      {showAttachmentForm && (
        <AttachmentUploadForm
          taskId={task.id}
          onClose={() => setShowAttachmentForm(false)}
          onAttachmentAdded={handleAttachmentAdded}
        />
      )}
    </div>
  );
};
