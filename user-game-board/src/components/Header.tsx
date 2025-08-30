import React from 'react';
import { Menu, RotateCcw, Maximize2, Settings } from 'lucide-react';
import { User } from '../types';

interface HeaderProps {
  onMenuToggle: () => void;
  user: User | null;
}

const Header: React.FC<HeaderProps> = ({ onMenuToggle, user }) => {
  const displayName = user?.fullName || user?.username || 'Guest';
  const displayBalance = user?.balance || 
    (user?.gameStats ? (user.gameStats.totalWin || 0) - (user.gameStats.totalBet || 0) : 0);

  return (
    <header className="bg-slate-800 text-white p-4 flex items-center justify-between">
      <button
        onClick={onMenuToggle}
        className="p-2 rounded-md hover:bg-slate-700 lg:hidden"
      >
        <Menu size={20} />
      </button>
      
      <div className="flex items-center gap-4 ml-auto">
        <div className="text-center">
          <div className="text-lg font-semibold">User {displayName}</div>
          <div className="text-sm text-gray-300">Balance {displayBalance.toFixed(2)}</div>
        </div>
        
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-md bg-green-600 hover:bg-green-700">
            <RotateCcw size={16} />
          </button>
          
          <select className="bg-red-600 text-white px-3 py-1 rounded text-sm">
            <option>🇹🇷 Girl</option>
          </select>
          
          <button className="p-2 rounded-md bg-yellow-500 hover:bg-yellow-600">
            <Settings size={16} />
          </button>
          
          <button className="p-2 rounded-md bg-blue-600 hover:bg-blue-700">
            <Maximize2 size={16} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
