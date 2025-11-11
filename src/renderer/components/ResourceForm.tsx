import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useResourcesStore } from '../stores/resourcesStore';
import type { Resource, ResourceInput } from '../types/resource';

interface ResourceFormProps {
  resource?: Resource | null;
  onClose: () => void;
}

export const ResourceForm: React.FC<ResourceFormProps> = ({ resource, onClose }) => {
  const { createResource, updateResource } = useResourcesStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<ResourceInput>({
    name: '',
    role: '',
    email: '',
    department: '',
    availability: 100,
  });

  useEffect(() => {
    if (resource) {
      setFormData({
        name: resource.name,
        role: resource.role || '',
        email: resource.email || '',
        department: resource.department || '',
        availability: resource.availability,
      });
    }
  }, [resource]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (resource) {
        await updateResource(resource.id, formData);
      } else {
        await createResource(formData);
      }
      onClose();
    } catch (error) {
      console.error('Error saving resource:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name === 'availability') {
      setFormData(prev => ({ ...prev, [name]: parseFloat(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {resource ? 'Modifier la ressource' : 'Nouvelle ressource'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Nom complet <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: Marie Dupont"
            />
          </div>

          {/* Role and Department */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                Rôle / Fonction
              </label>
              <input
                type="text"
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: Chef de projet"
              />
            </div>

            <div>
              <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
                Département
              </label>
              <input
                type="text"
                id="department"
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: IT"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: marie.dupont@example.com"
            />
          </div>

          {/* Availability */}
          <div>
            <label htmlFor="availability" className="block text-sm font-medium text-gray-700 mb-1">
              Disponibilité (%)
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                id="availability"
                name="availability"
                min="0"
                max="100"
                step="5"
                value={formData.availability}
                onChange={handleChange}
                className="flex-1"
              />
              <div className="w-16 text-center">
                <span className="text-lg font-semibold text-gray-900">
                  {formData.availability}%
                </span>
              </div>
            </div>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  formData.availability >= 80
                    ? 'bg-green-500'
                    : formData.availability >= 50
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
                }`}
                style={{ width: `${formData.availability}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Indique le pourcentage de temps disponible pour les projets
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Enregistrement...' : (resource ? 'Enregistrer' : 'Créer')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
