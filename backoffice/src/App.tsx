import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import WeeklyReports from './pages/WeeklyReports';
import ShopsManagement from './pages/ShopsManagement';
import AdminPackageManagement from './pages/AdminPackageManagement';
import Transactions from './pages/Transactions';
import Settings from './pages/Settings';
import ConnectionTest from './pages/ConnectionTest';
import Login from './pages/Login';
import LoadingSpinner from './components/LoadingSpinner';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { WebSocketProvider } from './contexts/WebSocketContext';
import { NotificationProvider } from './contexts/NotificationContext';

// Main authenticated app component
const AuthenticatedApp: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeComponent, setActiveComponent] = useState('dashboard');
  const { logout } = useAuth();

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleMenuItemClick = (item: string) => {
    if (item === 'sign-out') {
      // Handle sign out
      // Example: Clear authentication and redirect to login
      localStorage.removeItem('authToken');
      window.location.href = '/login';
      return;
    }
    
    setActiveComponent(item);
    // Close sidebar on mobile after selection
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  const renderActiveComponent = () => {
    switch (activeComponent) {
      case 'dashboard':
        return <Dashboard />;
      case 'connection-test':
        return <ConnectionTest />;
      case 'weekly-reports':
        return <WeeklyReports />;
      case 'shops-management':
        return <ShopsManagement />;
      case 'admin-package-management':
        return <AdminPackageManagement />;
      case 'transactions':
        return <Transactions />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <WebSocketProvider>
      <NotificationProvider>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
          <Sidebar
            isOpen={sidebarOpen}
            onToggle={handleSidebarToggle}
            activeItem={activeComponent}
            onItemClick={handleMenuItemClick}
          />
          
          <div className="flex-1 flex flex-col lg:ml-64">
            <Header 
              onMenuToggle={handleSidebarToggle}
              currentPage={activeComponent}
            />
            
            <main className={`flex-1 overflow-auto ${activeComponent === 'dashboard' ? '' : 'p-6'}`}>
              <div className="animate-fade-in">
                {renderActiveComponent()}
              </div>
            </main>
          </div>
        </div>
      </NotificationProvider>
    </WebSocketProvider>
  );
};

// App wrapper component that handles authentication
const AppContent: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-4">
            Backoffice Admin
          </div>
          <LoadingSpinner size="lg" />
          <div className="text-gray-600 dark:text-gray-400 mt-4">Loading...</div>
        </div>
      </div>
    );
  }

  return user ? <AuthenticatedApp /> : <Login />;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
