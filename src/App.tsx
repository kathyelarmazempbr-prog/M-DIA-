import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Login } from './components/Login';
import { DriverDashboard } from './components/driver/DriverDashboard';
import { ManagerDashboard } from './components/manager/ManagerDashboard';

const MainContent: React.FC = () => {
  const { currentUser } = useApp();

  if (!currentUser) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased">
      <Navbar />
      <main className="flex-1 mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 pt-6">
        {currentUser.role !== 'driver' ? <ManagerDashboard /> : <DriverDashboard />}
      </main>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
