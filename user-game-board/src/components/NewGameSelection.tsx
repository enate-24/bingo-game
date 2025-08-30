import React, { useState, useEffect } from 'react';
import { Menu, Eye, Minus, Plus } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

interface NewGameSelectionProps {
  onStartGame: (selectedCards: number[]) => void;
  onReturnToMenu: () => void;
}

const NewGameSelection: React.FC<NewGameSelectionProps> = ({ onStartGame, onReturnToMenu }) => {
  const [loading, setLoading] = useState(true);
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [gamesPlayed] = useState(19);
  const [bonusPlayed] = useState(0);
  const [betBirr, setBetBirr] = useState(10);
  const [winBirr] = useState(0.00);
  const [rememberSelection, setRememberSelection] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <LoadingSpinner size="lg" color="text-blue-500" />
      </div>
    );
  }

  const handleCardSelect = (cardNumber: number) => {
    setSelectedCards(prev => 
      prev.includes(cardNumber) 
        ? prev.filter(num => num !== cardNumber)
        : [...prev, cardNumber]
    );
  };

  const handleStartGame = () => {
    if (selectedCards.length > 0) {
      onStartGame(selectedCards);
    }
  };

  // Generate numbers 1-161 for the grid
  const numbers = Array.from({ length: 161 }, (_, i) => i + 1);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 bg-white border-b border-gray-200">
        <button 
          onClick={onReturnToMenu}
          className="p-2 rounded-md hover:bg-gray-100"
        >
          <Menu size={20} className="text-black" />
        </button>
      </div>

      {/* Game Stats */}
      <div className="p-6 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-8 mb-4">
          <div className="text-gray-700">
            <span className="font-semibold">Games Played:</span> 
            <span className="text-blue-600 font-bold ml-1">{gamesPlayed}</span>
          </div>
          <div className="text-gray-700">
            <span className="font-semibold">Bonus Played:</span> 
            <span className="text-green-600 font-bold ml-1">{bonusPlayed}</span>
          </div>
        </div>

        {/* Betting Controls */}
        <div className="flex items-center gap-6 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-gray-700 font-semibold">Bet Birr:</span>
            <button
              onClick={() => setBetBirr(Math.max(1, betBirr - 1))}
              className="bg-red-500 hover:bg-red-600 text-white w-8 h-8 rounded flex items-center justify-center"
            >
              <Minus size={16} />
            </button>
            <span className="bg-white border border-gray-300 px-4 py-2 rounded font-bold min-w-[60px] text-center">
              {betBirr}
            </span>
            <button
              onClick={() => setBetBirr(betBirr + 1)}
              className="bg-green-500 hover:bg-green-600 text-white w-8 h-8 rounded flex items-center justify-center"
            >
              <Plus size={16} />
            </button>
          </div>

          <div className="text-gray-700">
            <span className="font-semibold">Win Birr:</span> 
            <span className="font-bold ml-1">{winBirr.toFixed(2)}</span>
          </div>

          <div className="flex items-center gap-2 text-gray-700">
            <span className="font-semibold">House</span>
            <Eye size={16} />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-4">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded font-semibold">
            Cartela Check 📋
          </button>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded font-semibold">
            Enter ID (Fast)
          </button>
          <button
            onClick={handleStartGame}
            disabled={selectedCards.length === 0}
            className={`px-8 py-2 rounded font-semibold ${
              selectedCards.length > 0
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-gray-400 text-gray-200 cursor-not-allowed'
            }`}
          >
            Start Game
          </button>
        </div>
      </div>

      {/* Card Selection */}
      <div className="p-6">
        <div className="flex items-center gap-4 mb-4">
          <h2 className="text-lg font-bold text-gray-800">
            Selected Cards({selectedCards.length})
          </h2>
          <label className="flex items-center gap-2 text-gray-700">
            <input
              type="checkbox"
              checked={rememberSelection}
              onChange={(e) => setRememberSelection(e.target.checked)}
              className="rounded"
            />
            Remember Selection
          </label>
        </div>

        {/* Responsive Number Grid */}
        <div className="grid grid-cols-10 sm:grid-cols-12 md:grid-cols-14 lg:grid-cols-16 xl:grid-cols-20 2xl:grid-cols-26 gap-2">
          {numbers.map((number) => (
            <button
              key={number}
              onClick={() => handleCardSelect(number)}
              className={`aspect-square text-white font-bold text-xs sm:text-sm rounded flex items-center justify-center transition-all duration-200 min-h-[40px] sm:min-h-[48px] ${
                selectedCards.includes(number)
                  ? 'bg-green-600 hover:bg-green-700 ring-2 ring-green-300 transform scale-105'
                  : 'bg-blue-500 hover:bg-blue-600'
              }`}
            >
              {number}
            </button>
          ))}
        </div>

        {/* Selection Summary */}
        {selectedCards.length > 0 && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-2">Selected Cards:</h3>
            <div className="flex flex-wrap gap-2">
              {selectedCards.map((card) => (
                <span
                  key={card}
                  className="bg-blue-600 text-white px-3 py-1 rounded text-sm font-semibold"
                >
                  {card}
                </span>
              ))}
            </div>
            <div className="mt-2 text-sm text-gray-600">
              Total Bet: {selectedCards.length * betBirr} Birr
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewGameSelection;