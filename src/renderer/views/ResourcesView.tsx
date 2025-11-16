import React, { useEffect, useState } from 'react';
import { Plus, Search, Edit2, Trash2, Users, Mail, Building, Download, Upload } from 'lucide-react';
import { useResourcesStore } from '../stores/resourcesStore';
import { ResourceForm } from '../components/ResourceForm';
import type { Resource } from '../types/resource';
import { exportResourcesToExcel } from '../lib/excelExport';
import { importResourcesFromExcel } from '../lib/excelImport';

export const ResourcesView: React.FC = () => {
  const { resources, isLoading, error, fetchResources, deleteResource, createResource } = useResourcesStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  const filteredResources = resources.filter(resource =>
    resource.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    resource.role?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    resource.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    resource.department?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEdit = (resource: Resource) => {
    setEditingResource(resource);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette ressource ?')) {
      try {
        await deleteResource(id);
      } catch (error) {
        console.error('Error deleting resource:', error);
      }
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingResource(null);
  };

  const getAvailabilityColor = (availability: number) => {
    if (availability >= 80) return 'text-green-600 bg-green-50';
    if (availability >= 50) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      await exportResourcesToExcel(filteredResources);
    } catch (error) {
      console.error('Error exporting resources:', error);
      alert('Erreur lors de l\'export des ressources');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async () => {
    try {
      setIsImporting(true);

      // Ouvrir le dialogue de sélection de fichier
      const result = await window.api.files.openExcelDialog();

      if (result.canceled || !result.fileBuffer) {
        setIsImporting(false);
        return;
      }

      // Convertir le buffer en File object
      const uint8Array = new Uint8Array(result.fileBuffer);
      const blob = new Blob([uint8Array], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const file = new File([blob], result.fileName || 'import.xlsx');

      // Importer les données
      const importResult = await importResourcesFromExcel(file);

      if (importResult.errors.length > 0) {
        const errorMessages = importResult.errors.map(e => `Ligne ${e.row}, ${e.field}: ${e.message}`).join('\n');
        alert(`Import terminé avec des erreurs:\n\n${errorMessages}\n\n${importResult.success.length} ressources importées avec succès.`);
      }

      // Créer les ressources importées
      let successCount = 0;
      for (const resourceInput of importResult.success) {
        try {
          await createResource(resourceInput);
          successCount++;
        } catch (error) {
          console.error('Error creating resource:', error);
        }
      }

      if (successCount > 0) {
        await fetchResources();
        alert(`${successCount} ressource(s) importée(s) avec succès !`);
      }
    } catch (error) {
      console.error('Error importing resources:', error);
      alert('Erreur lors de l\'import des ressources');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header Actions */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher une ressource..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="flex items-center gap-2 ml-4">
          <button
            onClick={handleImport}
            disabled={isImporting}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Importer depuis Excel"
          >
            <Upload className="w-5 h-5" />
            {isImporting ? 'Import...' : 'Importer'}
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting || filteredResources.length === 0}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Exporter vers Excel"
          >
            <Download className="w-5 h-5" />
            {isExporting ? 'Export...' : 'Exporter'}
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Nouvelle ressource
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-500">Chargement des ressources...</div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredResources.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
          <Users className="w-16 h-16 mb-4 text-gray-300" />
          <p className="text-lg font-medium mb-2">
            {searchQuery ? 'Aucune ressource trouvée' : 'Aucune ressource'}
          </p>
          <p className="text-sm">
            {searchQuery ? 'Essayez une autre recherche' : 'Ajoutez les membres de votre équipe'}
          </p>
        </div>
      )}

      {/* Resources Grid */}
      {!isLoading && filteredResources.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredResources.map(resource => (
            <div
              key={resource.id}
              className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow"
            >
              {/* Resource Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-lg font-semibold text-blue-600">
                      {resource.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">
                      {resource.name}
                    </h3>
                    {resource.role && (
                      <p className="text-sm text-gray-600">
                        {resource.role}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEdit(resource)}
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="Modifier"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(resource.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Resource Info */}
              <div className="space-y-2 mb-4">
                {resource.email && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="truncate">{resource.email}</span>
                  </div>
                )}
                {resource.department && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Building className="w-4 h-4 text-gray-400" />
                    <span>{resource.department}</span>
                  </div>
                )}
              </div>

              {/* Availability */}
              <div>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="text-gray-600">Disponibilité</span>
                  <span
                    className={`font-semibold px-2 py-0.5 rounded ${getAvailabilityColor(
                      resource.availability
                    )}`}
                  >
                    {resource.availability}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      resource.availability >= 80
                        ? 'bg-green-500'
                        : resource.availability >= 50
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${resource.availability}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Resource Form Modal */}
      {showForm && (
        <ResourceForm
          resource={editingResource}
          onClose={handleCloseForm}
        />
      )}
    </div>
  );
};
