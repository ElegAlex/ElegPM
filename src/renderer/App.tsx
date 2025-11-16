import React, { useEffect, useState } from 'react';
import MainLayout from './components/layout/MainLayout';

const App: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Test IPC connection
    const testConnection = async () => {
      try {
        const response = await window.api.ping();
        console.log('IPC Connection test:', response);
        setIsConnected(response === 'pong');
      } catch (error) {
        console.error('IPC Connection failed:', error);
        setIsConnected(false);
      }
    };

    testConnection();
  }, []);

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground">Connexion à la base de données...</p>
        </div>
      </div>
    );
  }

  return <MainLayout />;
};

export default App;
