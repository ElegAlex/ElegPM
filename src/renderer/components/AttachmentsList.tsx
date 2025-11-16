import React, { useEffect, useState } from 'react';
import { Paperclip, Download, Trash2, File, FileText, Image, FileArchive } from 'lucide-react';
import type { Attachment } from '../types/attachment';

interface AttachmentsListProps {
  taskId: string;
  onAddAttachment?: () => void;
}

export const AttachmentsList: React.FC<AttachmentsListProps> = ({ taskId, onAddAttachment }) => {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAttachments();
  }, [taskId]);

  const loadAttachments = async () => {
    try {
      setIsLoading(true);
      const data = await window.api.attachments.getAll({ taskId });
      setAttachments(data);
    } catch (error) {
      console.error('Error loading attachments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (attachmentId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette pièce jointe ?')) {
      try {
        await window.api.attachments.delete(attachmentId);
        await loadAttachments();
      } catch (error) {
        console.error('Error deleting attachment:', error);
      }
    }
  };

  const handleDownload = async (attachment: Attachment) => {
    try {
      // TODO: Implement file download functionality
      alert(`Téléchargement de ${attachment.filename} - Fonctionnalité à venir`);
      console.log('Download attachment:', attachment);
    } catch (error) {
      console.error('Error downloading attachment:', error);
      alert('Erreur lors du téléchargement du fichier');
    }
  };

  const getFileIcon = (filename: string) => {
    const extension = filename.split('.').pop()?.toLowerCase();

    switch (extension) {
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'svg':
      case 'webp':
        return <Image className="w-5 h-5 text-purple-600" />;
      case 'pdf':
        return <FileText className="w-5 h-5 text-red-600" />;
      case 'zip':
      case 'rar':
      case '7z':
      case 'tar':
      case 'gz':
        return <FileArchive className="w-5 h-5 text-yellow-600" />;
      default:
        return <File className="w-5 h-5 text-gray-600" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-500 text-sm">Chargement des pièces jointes...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-gray-700">
          <Paperclip className="w-5 h-5" />
          <span className="font-medium">
            Pièces jointes ({attachments.length})
          </span>
        </div>
        {onAddAttachment && (
          <button
            onClick={onAddAttachment}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Ajouter une pièce jointe
          </button>
        )}
      </div>

      {/* Empty State */}
      {attachments.length === 0 && (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <Paperclip className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 text-sm mb-2">Aucune pièce jointe</p>
          {onAddAttachment && (
            <button
              onClick={onAddAttachment}
              className="text-blue-600 hover:underline text-sm"
            >
              Ajouter la première pièce jointe
            </button>
          )}
        </div>
      )}

      {/* Attachments List */}
      {attachments.length > 0 && (
        <div className="space-y-2">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-center gap-3">
                {/* File Icon */}
                <div className="flex-shrink-0">
                  {getFileIcon(attachment.filename)}
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 text-sm truncate">
                    {attachment.filename}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>{formatFileSize(attachment.fileSize)}</span>
                    <span>•</span>
                    <span>{formatDate(attachment.createdAt)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleDownload(attachment)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="Télécharger"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(attachment.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
