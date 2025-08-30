import React from 'react';
import { 
  Home, 
  Play, 
  Plus, 
  List, 
  Settings, 
  LogOut,
  X,
  Gamepad2
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  activeItem: string;
  onItemClick: (item: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, 
  onToggle, 
  activeItem, 
  onItemClick 
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'play-bingo', label: 'Play Bingo', icon: Gamepad2 },
    { id: 'add-cartela', label: 'Add Cartela', icon: Plus },
    { id: 'cartela-list', label: 'Cartela List', icon: List },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 lg:hidden z-40"
          onClick={onToggle}
        />
      )}
      
      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 h-full bg-slate-800 text-white transform transition-transform duration-300 ease-in-out z-50 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } w-64 lg:translate-x-0 lg:static lg:z-auto`}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-xl font-bold text-yellow-400">BINGO ONE</h2>
          <button
            onClick={onToggle}
            className="lg:hidden p-1 rounded-md hover:bg-slate-700"
          >
            <X size={20} />
          </button>
        </div>
        
        <nav className="mt-8">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onItemClick(item.id);
                  if (window.innerWidth < 1024) onToggle();
                }}
                className={`w-full flex items-center gap-3 px-6 py-3 text-left hover:bg-slate-700 transition-colors ${
                  activeItem === item.id ? 'bg-slate-700 border-r-2 border-yellow-400' : ''
                }`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </button>
            );
          })}
          
          <button
            onClick={() => onItemClick('logout')}
            className="w-full flex items-center gap-3 px-6 py-3 text-left hover:bg-red-600 transition-colors mt-8 border-t border-slate-700"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </nav>
      </div>
    </>
  );
};

export default Sidebar;