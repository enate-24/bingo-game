import React from 'react';
import { Menu, Bell, Search, Sun, Moon, User } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';

interface HeaderProps {
  onMenuToggle: () => void;
  currentPage: string;
}

const Header: React.FC<HeaderProps> = ({ onMenuToggle, currentPage }) => {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const { notifications } = useNotification();

  const getPageTitle = (page: string) => {
    const titles: { [key: string]: string } = {
      'dashboard': 'Dashboard',
      'weekly-reports': 'Weekly Reports',
      'shops-management': 'Shops Management',
      'admin-package-management': 'Package Management',
      'transactions': 'Transactions',
      'settings': 'Settings'
    };
    return titles[page] || 'Dashboard';
  };

  const getBreadcrumbs = (page: string) => {
    return ['Pages', getPageTitle(page)];
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuToggle}
            className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 lg:hidden"
          >
            <Menu size={20} className="text-gray-600 dark:text-gray-400" />
          </button>
          
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {getPageTitle(currentPage)}
            </h1>
            <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-1">
              {getBreadcrumbs(currentPage).map((crumb, index) => (
                <React.Fragment key={crumb}>
                  {index > 0 && <span>/</span>}
                  <span className={index === getBreadcrumbs(currentPage).length - 1 ? 'text-blue-600 dark:text-blue-400' : ''}>
                    {crumb}
                  </span>
                </React.Fragment>
              ))}
            </nav>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="hidden md:flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2">
            <Search size={16} className="text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              className="bg-transparent border-none outline-none text-sm text-gray-700 dark:text-gray-300 w-64"
            />
          </div>
          
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          
          {/* Notifications */}
          <button className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400">
            <Bell size={20} />
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {notifications.length}
              </span>
            )}
          </button>
          
          {/* User Profile */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {user?.name || 'Admin User'}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {user?.role || 'Administrator'}
              </div>
            </div>
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <User size={16} className="text-white" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
