import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  Shuffle, 
  Clock, 
  Users, 
  Trophy, 
  Settings,
  BarChart3,
  Volume2,
  VolumeX,
  Minus,
  Plus,
  RotateCcw
} from 'lucide-react';

interface OperatorInterfaceProps {
  game: any;
  gameState: any;
  onNumberCall: (number: number) => void;
  onGameStateUpdate: (updates: any) => void;
  onCreateNewGame: () => void;
  hasPublicDisplay: boolean;
}

const OperatorInterface: React.FC<OperatorInterfaceProps> = ({
  game,
  gameState,
  onNumberCall,
  onGameStateUpdate,
  onCreateNewGame,
  hasPublicDisplay
}) => {
  const [autoCallTimer, setAutoCallTimer] = useState<NodeJS.Timeout | null>(null);
  const [remainingNumbers, setRemainingNumbers] = useState<number[]>([]);
  const [isShuffling, setIsShuffling] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Initialize remaining numbers
  useEffect(() => {
    const allNumbers = Array.from({ length: 75 }, (_, i) => i + 1);
    const remaining = allNumbers.filter(num => !gameState.calledNumbers.includes(num));
    setRemainingNumbers(remaining);
  }, [gameState.calledNumbers]);

  // Auto-call functionality
  useEffect(() => {
    if (gameState.autoCall && gameState.gameStatus === 'active' && remainingNumbers.length > 0) {
      const timer = setInterval(() => {
        if (remainingNumbers.length > 0) {
          const randomIndex = Math.floor(Math.random() * remainingNumbers.length);
          const calledNumber = remainingNumbers[randomIndex];
          onNumberCall(calledNumber);
          
          // Play sound if enabled
          if (soundEnabled) {
            // Audio feedback would be implemented here
            console.log(`Called number: ${calledNumber}`);
          }
        }
      }, gameState.callInterval * 1000);

      setAutoCallTimer(timer);
      return () => clearInterval(timer);
    } else if (autoCallTimer) {
      clearInterval(autoCallTimer);
      setAutoCallTimer(null);
    }
  }, [gameState.autoCall, gameState.gameStatus, gameState.callInterval, remainingNumbers, soundEnabled]);

  // Handle shuffle
  const handleShuffle = () => {
    if (isShuffling || remainingNumbers.length === 0) return;
    
    setIsShuffling(true);
    onGameStateUpdate({ autoCall: false });
    
    setTimeout(() => {
      const shuffled = [...remainingNumbers].sort(() => Math.random() - 0.5);
      setRemainingNumbers(shuffled);
      setIsShuffling(false);
    }, 2500);
  };

  // Start game
  const handleStartGame = () => {
    onGameStateUpdate({
      gameStatus: 'active',
      calledNumbers: [],
      currentNumber: null
    });
  };

  // Pause/Resume game
  const handlePauseResume = () => {
    onGameStateUpdate({
      gameStatus: gameState.gameStatus === 'active' ? 'paused' : 'active'
    });
  };

  // Finish game
  const handleFinishGame = () => {
    onGameStateUpdate({
      gameStatus: 'finished',
      autoCall: false
    });
  };

  const bingoLetters = ['B', 'I', 'N', 'G', 'O'];
  const getNumbersForColumn = (columnIndex: number) => {
    const start = columnIndex * 15 + 1;
    return Array.from({ length: 15 }, (_, i) => start + i);
  };

  return (
    <div className="flex h-[calc(100vh-80px)]">
      {/* Left Control Panel */}
      <div className="w-80 bg-slate-800 text-white p-6 overflow-y-auto">
        <h2 className="text-xl font-bold mb-6 text-yellow-400">Game Control Panel</h2>
        
        {/* Game Status */}
        <div className="mb-6">
          <div className="bg-slate-700 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-300">Game Status</span>
              <span className={`px-2 py-1 rounded text-xs font-bold ${
                gameState.gameStatus === 'active' ? 'bg-green-500' :
                gameState.gameStatus === 'paused' ? 'bg-yellow-500' :
                gameState.gameStatus === 'finished' ? 'bg-red-500' : 'bg-gray-500'
              }`}>
                {gameState.gameStatus.toUpperCase()}
              </span>
            </div>
            <div className="text-2xl font-bold text-yellow-400">GAME {game.id}</div>
            <div className="text-sm text-gray-300">
              Called: {gameState.calledNumbers.length}/75
            </div>
          </div>
        </div>

        {/* Game Controls */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Game Controls</h3>
          <div className="space-y-2">
            {gameState.gameStatus === 'waiting' ? (
              <button
                onClick={handleStartGame}
                className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded flex items-center justify-center gap-2 font-semibold"
              >
                <Play size={20} />
                Start Game
              </button>
            ) : (
              <>
                <button
                  onClick={handlePauseResume}
                  className={`w-full px-4 py-3 rounded flex items-center justify-center gap-2 font-semibold ${
                    gameState.gameStatus === 'active' 
                      ? 'bg-yellow-600 hover:bg-yellow-700' 
                      : 'bg-green-600 hover:bg-green-700'
                  } text-white`}
                >
                  {gameState.gameStatus === 'active' ? <Pause size={20} /> : <Play size={20} />}
                  {gameState.gameStatus === 'active' ? 'Pause Game' : 'Resume Game'}
                </button>
                
                <button
                  onClick={handleFinishGame}
                  className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded flex items-center justify-center gap-2 font-semibold"
                >
                  <Square size={20} />
                  Finish Game
                </button>
              </>
            )}
            
            <button
              onClick={onCreateNewGame}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded flex items-center justify-center gap-2 font-semibold"
            >
              <RotateCcw size={20} />
              New Game
            </button>
          </div>
        </div>

        {/* Auto Call Controls */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Auto Call Settings</h3>
          <div className="space-y-3">
            <button
              onClick={() => onGameStateUpdate({ autoCall: !gameState.autoCall })}
              disabled={gameState.gameStatus !== 'active'}
              className={`w-full px-4 py-2 rounded flex items-center justify-center gap-2 font-semibold ${
                gameState.autoCall 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-gray-600 hover:bg-gray-700'
              } text-white ${gameState.gameStatus !== 'active' ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {gameState.autoCall ? <Pause size={16} /> : <Play size={16} />}
              Auto Call {gameState.autoCall ? 'ON' : 'OFF'}
            </button>

            <div className="flex items-center gap-2 bg-slate-700 px-3 py-2 rounded">
              <Clock size={16} />
              <span className="text-sm">Interval:</span>
              <button
                onClick={() => onGameStateUpdate({ callInterval: Math.max(1, gameState.callInterval - 1) })}
                className="bg-red-500 hover:bg-red-600 text-white w-6 h-6 rounded text-sm flex items-center justify-center"
              >
                <Minus size={12} />
              </button>
              <span className="bg-slate-800 px-2 py-1 rounded text-sm font-bold min-w-[2rem] text-center">
                {gameState.callInterval}s
              </span>
              <button
                onClick={() => onGameStateUpdate({ callInterval: Math.min(10, gameState.callInterval + 1) })}
                className="bg-green-500 hover:bg-green-600 text-white w-6 h-6 rounded text-sm flex items-center justify-center"
              >
                <Plus size={12} />
              </button>
            </div>

            <button
              onClick={handleShuffle}
              disabled={gameState.gameStatus !== 'active' || remainingNumbers.length === 0 || isShuffling}
              className={`w-full px-4 py-2 rounded flex items-center justify-center gap-2 font-semibold bg-purple-600 hover:bg-purple-700 text-white ${
                (gameState.gameStatus !== 'active' || remainingNumbers.length === 0 || isShuffling) 
                  ? 'opacity-50 cursor-not-allowed' 
                  : ''
              }`}
            >
              <Shuffle size={16} className={isShuffling ? 'animate-spin' : ''} />
              {isShuffling ? 'Shuffling...' : 'Shuffle'}
            </button>
          </div>
        </div>

        {/* Player Management */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Player Management</h3>
          <div className="bg-slate-700 p-3 rounded">
            <div className="flex items-center gap-2 mb-2">
              <Users size={16} />
              <span className="text-sm">Active Players</span>
            </div>
            <div className="text-2xl font-bold">{gameState.players}</div>
          </div>
        </div>

        {/* Settings */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Settings</h3>
          <div className="space-y-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`w-full px-4 py-2 rounded flex items-center justify-center gap-2 ${
                soundEnabled ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-600 hover:bg-gray-700'
              } text-white`}
            >
              {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              Sound {soundEnabled ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>

        {/* Public Display Status */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Display Status</h3>
          <div className={`p-3 rounded ${hasPublicDisplay ? 'bg-green-700' : 'bg-red-700'}`}>
            <div className="text-sm font-semibold">
              Public Display: {hasPublicDisplay ? 'Connected' : 'Disconnected'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Game Board */}
      <div className="flex-1 p-6">
        <div className="flex gap-8">
          {/* BINGO Column */}
          <div className="flex flex-col gap-2">
            {bingoLetters.map((letter) => (
              <div
                key={letter}
                className="w-16 h-16 bg-orange-500 flex items-center justify-center text-white font-bold text-2xl rounded"
              >
                {letter}
              </div>
            ))}
          </div>

          {/* Number Grid */}
          <div className="flex-1">
            <div className="grid grid-cols-15 gap-1">
              {bingoLetters.map((letter, columnIndex) => 
                getNumbersForColumn(columnIndex).map((number) => (
                  <button
                    key={number}
                    onClick={() => gameState.gameStatus === 'active' && onNumberCall(number)}
                    disabled={gameState.gameStatus !== 'active'}
                    className={`w-12 h-12 flex items-center justify-center text-white font-bold text-sm rounded transition-all duration-300 transform hover:scale-105 ${
                      gameState.calledNumbers.includes(number) 
                        ? 'bg-green-600 hover:bg-green-500 shadow-lg' 
                        : 'bg-red-800 hover:bg-red-700'
                    } ${
                      gameState.gameStatus !== 'active' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                    } ${
                      gameState.currentNumber === number ? 'ring-4 ring-yellow-400 animate-pulse' : ''
                    }`}
                  >
                    {number}
                  </button>
                ))
              )}
            </div>

            {/* Game Statistics */}
            <div className="mt-6 grid grid-cols-3 gap-4">
              <div className="bg-slate-800 p-4 rounded-lg text-white">
                <div className="text-sm text-gray-300">Remaining Numbers</div>
                <div className="text-2xl font-bold text-blue-400">{remainingNumbers.length}</div>
              </div>
              
              <div className="bg-slate-800 p-4 rounded-lg text-white">
                <div className="text-sm text-gray-300">Last Called</div>
                <div className="text-2xl font-bold text-yellow-400">
                  {gameState.currentNumber || '-'}
                </div>
              </div>
              
              <div className="bg-slate-800 p-4 rounded-lg text-white">
                <div className="text-sm text-gray-300">Progress</div>
                <div className="text-2xl font-bold text-green-400">
                  {Math.round((gameState.calledNumbers.length / 75) * 100)}%
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Shuffle Animation Overlay */}
        {isShuffling && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-lg text-center">
              <div className="text-6xl mb-4 animate-spin">🎲</div>
              <div className="text-2xl font-bold text-gray-800 mb-2">Shuffling Numbers...</div>
              <div className="text-gray-600">Randomizing call order</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OperatorInterface;