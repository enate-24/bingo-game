import React, { useState, useEffect } from 'react';
import { Home, Play, Trophy, RotateCcw } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

interface GameFinishedProps {
  onCreateNewGame: () => void;
  onReturnToMenu: () => void;
}

const GameFinished: React.FC<GameFinishedProps> = ({ onCreateNewGame, onReturnToMenu }) => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-8">
        {/* Trophy Animation */}
        <div className="mb-8">
          <div className="text-8xl animate-bounce mb-4">🏆</div>
          <div className="text-4xl font-bold text-yellow-400 mb-2">GAME FINISHED!</div>
          <div className="text-xl text-gray-300">Congratulations on completing the game</div>
        </div>

        {/* Game Stats */}
        <div className="bg-slate-800 rounded-lg p-6 mb-8">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-400">75</div>
              <div className="text-sm text-gray-400">Numbers Called</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-400">112.5</div>
              <div className="text-sm text-gray-400">Birr Won</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <button
            onClick={onCreateNewGame}
            className="w-full bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors flex items-center justify-center gap-3"
          >
            <Play size={24} />
            Create New Game
          </button>
          
          <button
            onClick={onReturnToMenu}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors flex items-center justify-center gap-3"
          >
            <Home size={24} />
            Return to Main Menu
          </button>

          <button
            onClick={() => window.location.reload()}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors flex items-center justify-center gap-3"
          >
            <RotateCcw size={24} />
            Refresh Page
          </button>
        </div>

        {/* Decorative Elements */}
        <div className="mt-8 flex justify-center gap-4 text-4xl">
          <span className="animate-pulse">🎉</span>
          <span className="animate-bounce">🎊</span>
          <span className="animate-pulse">🎉</span>
        </div>
      </div>
    </div>
  );
};

export default GameFinished;