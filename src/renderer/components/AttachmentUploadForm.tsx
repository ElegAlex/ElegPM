import React, { useState } from 'react';
import { X, Upload, File } from 'lucide-react';

interface AttachmentUploadFormProps {
  taskId: string;
  onClose: () => void;
  onAttachmentAdded?: () => void;
}

export const AttachmentUploadForm: React.FC<AttachmentUploadFormProps> = ({
  taskId,
  onClose,
  onAttachmentAdded
}) => {
  const [selectedFile, setSelectedFile] = useState<{ name: string; path: string; size: number } | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleSelectFile = async () => {
    try {
      // TODO: Implement file dialog
      alert('Sélection de fichier - Fonctionnalité à venir');
    } catch (error) {
      console.error('Error selecting file:', error);
      alert('Erreur lors de la sélection du fichier');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile) {
      alert('Veuillez sélectionner un fichier');
      return;
    }

    try {
      setIsUploading(true);

      await window.api.attachments.create({
        taskId,
        filename: selectedFile.name,
        filepath: selectedFile.path,
        fileSize: selectedFile.size
      });

      if (onAttachmentAdded) {
        onAttachmentAdded();
      }
      onClose();
    } catch (error) {
      console.error('Error uploading attachment:', error);
      alert('Erreur lors de l\'upload de la pièce jointe');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Ajouter une pièce jointe</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
            disabled={isUploading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* File Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fichier <span className="text-red-500">*</span>
            </label>

            {!selectedFile ? (
              <button
                type="button"
                onClick={handleSelectFile}
                disabled={isUploading}
                className="w-full border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-blue-400 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex flex-col items-center gap-2 text-gray-500">
                  <Upload className="w-8 h-8" />
                  <span className="text-sm font-medium">Cliquez pour sélectionner un fichier</span>
                  <span className="text-xs">Tous types de fichiers acceptés</span>
                </div>
              </button>
            ) : (
              <div className="border border-gray-300 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    <File className="w-8 h-8 text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 text-sm truncate">
                      {selectedFile.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatFileSize(selectedFile.size)}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedFile(null)}
                    disabled={isUploading}
                    className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors"
                    title="Retirer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Info Message */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-700">
              Le fichier sera copié dans le dossier de données de l'application et restera accessible même si le fichier original est déplacé ou supprimé.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={isUploading}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isUploading || !selectedFile}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload className="w-4 h-4" />
              {isUploading ? 'Upload...' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
