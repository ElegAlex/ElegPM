import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

const MainLayout: React.FC = () => {
  const [currentView, setCurrentView] = useState('dashboard');

  const renderContent = () => {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          {/* Placeholder content */}
          <div className="bg-white rounded-lg border border-border p-8 text-center">
            <h3 className="text-2xl font-bold text-foreground mb-4">
              Bienvenue dans Gestion de Projet
            </h3>
            <p className="text-gray-600 mb-6">
              Vue: <span className="font-semibold text-primary">{currentView}</span>
            </p>
            <div className="grid grid-cols-3 gap-6 mt-8">
              <div className="p-6 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-3xl font-bold text-blue-600">0</div>
                <div className="text-sm text-gray-600 mt-2">Projets actifs</div>
              </div>
              <div className="p-6 bg-green-50 rounded-lg border border-green-200">
                <div className="text-3xl font-bold text-green-600">0</div>
                <div className="text-sm text-gray-600 mt-2">Tâches complétées</div>
              </div>
              <div className="p-6 bg-orange-50 rounded-lg border border-orange-200">
                <div className="text-3xl font-bold text-orange-600">0</div>
                <div className="text-sm text-gray-600 mt-2">Jalons à venir</div>
              </div>
            </div>
            <div className="mt-8 p-4 bg-gray-50 rounded border border-gray-200">
              <p className="text-sm text-gray-600">
                ✅ <strong>Connexion réussie</strong> - Base de données SQLite opérationnelle
              </p>
              <p className="text-xs text-gray-500 mt-2">
                L'application est prête à être utilisée. Les fonctionnalités seront ajoutées progressivement.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
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
