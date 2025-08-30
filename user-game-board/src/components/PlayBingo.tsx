import React, { useState, useEffect, useCallback } from 'react';
import { RotateCcw, Maximize2, Settings, Menu, Play, Pause, Shuffle, Clock, Square } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

interface PlayBingoProps {
  game: any;
  onNumberCall: (number: number) => void;
  onCreateNewGame: () => void;
}

const PlayBingo: React.FC<PlayBingoProps> = ({ game, onNumberCall, onCreateNewGame }) => {
  const [loading, setLoading] = useState(true);
  const [gameStatus, setGameStatus] = useState(game.status);
  const [calledNumbers, setCalledNumbers] = useState<number[]>(game.calledNumbers || []);
  const [autoCallEnabled, setAutoCallEnabled] = useState(false);
  const [callInterval, setCallInterval] = useState(3); // seconds
  const [isShuffling, setIsShuffling] = useState(false);
  const [remainingNumbers, setRemainingNumbers] = useState<number[]>([]);
  const [autoCallTimer, setAutoCallTimer] = useState<NodeJS.Timeout | null>(null);
  const [lastCalledNumber, setLastCalledNumber] = useState<number | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  // Initialize remaining numbers
  useEffect(() => {
    const allNumbers = Array.from({ length: 75 }, (_, i) => i + 1);
    const remaining = allNumbers.filter(num => !calledNumbers.includes(num));
    setRemainingNumbers(remaining);
  }, [calledNumbers]);

  // Auto-call functionality
  const startAutoCall = useCallback(() => {
    if (gameStatus !== 'active' || remainingNumbers.length === 0) return;

    const timer = setInterval(() => {
      setRemainingNumbers(prev => {
        if (prev.length === 0) {
          setAutoCallEnabled(false);
          return prev;
        }

        const randomIndex = Math.floor(Math.random() * prev.length);
        const calledNumber = prev[randomIndex];
        
        setCalledNumbers(current => [...current, calledNumber]);
        setLastCalledNumber(calledNumber);
        onNumberCall(calledNumber);

        // Add animation class to the called number
        const numberElement = document.querySelector(`[data-number="${calledNumber}"]`);
        if (numberElement) {
          numberElement.classList.add('animate-pulse', 'ring-4', 'ring-yellow-400');
          setTimeout(() => {
            numberElement.classList.remove('animate-pulse', 'ring-4', 'ring-yellow-400');
          }, 2000);
        }

        return prev.filter(num => num !== calledNumber);
      });
    }, callInterval * 1000);

    setAutoCallTimer(timer);
  }, [gameStatus, remainingNumbers.length, callInterval, onNumberCall]);

  // Stop auto-call
  const stopAutoCall = useCallback(() => {
    if (autoCallTimer) {
      clearInterval(autoCallTimer);
      setAutoCallTimer(null);
    }
  }, [autoCallTimer]);

  // Handle auto-call toggle
  useEffect(() => {
    if (autoCallEnabled && gameStatus === 'active') {
      startAutoCall();
    } else {
      stopAutoCall();
    }

    return () => stopAutoCall();
  }, [autoCallEnabled, gameStatus, startAutoCall, stopAutoCall]);

  // Shuffle animation and functionality
  const handleShuffle = () => {
    if (isShuffling || remainingNumbers.length === 0) return;

    setIsShuffling(true);
    
    // Stop auto-call during shuffle
    const wasAutoCallEnabled = autoCallEnabled;
    setAutoCallEnabled(false);

    // Shuffle animation
    setTimeout(() => {
      const shuffled = [...remainingNumbers].sort(() => Math.random() - 0.5);
      setRemainingNumbers(shuffled);
      setIsShuffling(false);
      
      // Resume auto-call if it was enabled
      if (wasAutoCallEnabled) {
        setAutoCallEnabled(true);
      }
    }, 2500);
  };

  // Manual number call
  const handleManualCall = (number: number) => {
    if (gameStatus !== 'active' || calledNumbers.includes(number)) return;

    setCalledNumbers(prev => [...prev, number]);
    setLastCalledNumber(number);
    setRemainingNumbers(prev => prev.filter(num => num !== number));
    onNumberCall(number);

    // Add animation
    const numberElement = document.querySelector(`[data-number="${number}"]`);
    if (numberElement) {
      numberElement.classList.add('animate-bounce');
      setTimeout(() => {
        numberElement.classList.remove('animate-bounce');
      }, 1000);
    }
  };

  // Finish game
  const handleFinishGame = () => {
    setGameStatus('finished');
    setAutoCallEnabled(false);
    stopAutoCall();
    
    // Redirect to finish page after a short delay
    setTimeout(() => {
      window.location.href = '/?page=game-finished';
    }, 1500);
  };

  // Start game
  const handleStartGame = () => {
    setGameStatus('active');
    setCalledNumbers([]);
    setLastCalledNumber(null);
    const allNumbers = Array.from({ length: 75 }, (_, i) => i + 1);
    setRemainingNumbers(allNumbers);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const bingoLetters = ['B', 'I', 'N', 'G', 'O'];

  const getNumbersForColumn = (columnIndex: number) => {
    const start = columnIndex * 15 + 1;
    return Array.from({ length: 15 }, (_, i) => start + i);
  };

  const getStatusBadgeColor = () => {
    switch (gameStatus) {
      case 'active': return 'bg-green-500';
      case 'finished': return 'bg-red-500';
      default: return 'bg-yellow-500';
    }
  };

  const getStatusText = () => {
    switch (gameStatus) {
      case 'active': return 'GAME IS ACTIVE';
      case 'finished': return 'GAME IS FINISHED';
      default: return 'GAME IS WAITING';
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-slate-800">
        <div className="flex items-center gap-4">
          <button className="p-2 rounded-md hover:bg-slate-700">
            <Menu size={20} />
          </button>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-4xl font-bold text-yellow-400">ONE</div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              className="p-2 rounded-md bg-green-600 hover:bg-green-700"
              onClick={() => window.location.reload()}
            >
              <RotateCcw size={16} />
            </button>
            
            <select className="bg-red-600 text-white px-3 py-1 rounded text-sm border-none">
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
      </div>

      {/* Game Info Bar */}
      <div className="flex items-center gap-4 p-4 bg-slate-800 border-t border-slate-700 flex-wrap">
        <span className="text-4xl font-bold text-yellow-400">GAME {game.id}</span>
        <span className={`${getStatusBadgeColor()} text-black px-3 py-1 rounded text-sm font-bold`}>
          {getStatusText()}
        </span>
        <span className="bg-yellow-400 text-black px-3 py-1 rounded text-sm font-bold">
          Called {calledNumbers.length}/75
        </span>
        {gameStatus === 'active' && (
          <span className="bg-green-500 text-white px-3 py-1 rounded text-sm font-bold animate-pulse">
            🔴 LIVE
          </span>
        )}
        {lastCalledNumber && (
          <span className="bg-purple-500 text-white px-4 py-2 rounded text-lg font-bold animate-pulse">
            Last Called: {lastCalledNumber}
          </span>
        )}
      </div>

      {/* Control Panel */}
      <div className="flex items-center gap-4 p-4 bg-slate-700 border-t border-slate-600 flex-wrap">
        {/* Auto Call Toggle */}
        <button
          onClick={() => setAutoCallEnabled(!autoCallEnabled)}
          disabled={gameStatus !== 'active'}
          className={`flex items-center gap-2 px-4 py-2 rounded font-semibold transition-colors ${
            autoCallEnabled 
              ? 'bg-green-600 hover:bg-green-700' 
              : 'bg-gray-600 hover:bg-gray-700'
          } ${gameStatus !== 'active' ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {autoCallEnabled ? <Pause size={16} /> : <Play size={16} />}
          Auto Call {autoCallEnabled ? 'ON' : 'OFF'}
        </button>

        {/* Shuffle Button */}
        <button
          onClick={handleShuffle}
          disabled={gameStatus !== 'active' || remainingNumbers.length === 0 || isShuffling}
          className={`flex items-center gap-2 px-4 py-2 rounded font-semibold transition-colors bg-purple-600 hover:bg-purple-700 ${
            (gameStatus !== 'active' || remainingNumbers.length === 0 || isShuffling) 
              ? 'opacity-50 cursor-not-allowed' 
              : ''
          }`}
        >
          <Shuffle size={16} className={isShuffling ? 'animate-spin' : ''} />
          {isShuffling ? 'Shuffling...' : 'Shuffle'}
        </button>

        {/* Interval Adjuster */}
        <div className="flex items-center gap-2 bg-slate-600 px-4 py-2 rounded">
          <Clock size={16} />
          <span className="text-sm">Interval:</span>
          <button
            onClick={() => setCallInterval(Math.max(1, callInterval - 1))}
            className="bg-red-500 hover:bg-red-600 text-white w-6 h-6 rounded text-sm flex items-center justify-center"
          >
            -
          </button>
          <span className="bg-slate-800 px-3 py-1 rounded text-sm font-bold min-w-[3rem] text-center">
            {callInterval}s
          </span>
          <button
            onClick={() => setCallInterval(Math.min(10, callInterval + 1))}
            className="bg-green-500 hover:bg-green-600 text-white w-6 h-6 rounded text-sm flex items-center justify-center"
          >
            +
          </button>
        </div>

        {/* Finish Game Button */}
        <button
          onClick={handleFinishGame}
          disabled={gameStatus !== 'active'}
          className={`flex items-center gap-2 px-6 py-2 rounded font-semibold transition-colors bg-red-600 hover:bg-red-700 ${
            gameStatus !== 'active' ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <Square size={16} />
          Finish Game
        </button>

        {/* Remaining Numbers Counter */}
        <div className="bg-blue-600 px-4 py-2 rounded">
          <span className="text-sm font-semibold">Remaining: {remainingNumbers.length}</span>
        </div>
      </div>

      <div className="flex gap-8 p-6">
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
          
          {gameStatus === 'waiting' ? (
            <button
              onClick={handleStartGame}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded mt-4 font-semibold text-sm"
            >
              Start Game
            </button>
          ) : (
            <button
              onClick={onCreateNewGame}
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-3 rounded mt-4 font-semibold text-sm"
            >
              Create New Game
            </button>
          )}
        </div>

        {/* Number Grid - 15 columns (BINGO) x 5 rows */}
        <div className="flex-1">
          <div className={`grid grid-cols-15 gap-1 ${isShuffling ? 'animate-pulse' : ''}`}>
            {bingoLetters.map((letter, columnIndex) => 
              getNumbersForColumn(columnIndex).map((number) => (
                <button
                  key={number}
                  data-number={number}
                  onClick={() => handleManualCall(number)}
                  disabled={gameStatus !== 'active'}
                  className={`w-12 h-12 flex items-center justify-center text-white font-bold text-sm rounded transition-all duration-300 transform hover:scale-105 ${
                    calledNumbers.includes(number) 
                      ? 'bg-green-600 hover:bg-green-500 shadow-lg' 
                      : 'bg-red-800 hover:bg-red-700'
                  } ${
                    gameStatus !== 'active' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                  } ${
                    lastCalledNumber === number ? 'ring-4 ring-yellow-400 animate-pulse' : ''
                  }`}
                >
                  {number}
                </button>
              ))
            )}
          </div>

          {/* Shuffle Animation Overlay */}
          {isShuffling && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-8 rounded-lg text-center">
                <div className="text-4xl mb-4 animate-spin">🎲</div>
                <div className="text-xl font-bold text-gray-800 mb-2">Shuffling Numbers...</div>
                <div className="text-gray-600">Randomizing call order</div>
              </div>
            </div>
          )}

          {gameStatus === 'active' && (
            <div className="mt-4 text-center">
              <div className="text-sm font-semibold">Numbers Called:</div>
              <div className="text-lg font-bold">{calledNumbers.length}</div>
              {autoCallEnabled && (
                <div className="text-xs text-green-400 animate-pulse">
                  Auto-calling every {callInterval} seconds
                </div>
              )}
            </div>
          )}
          
          {gameStatus === 'finished' && (
            <div className="mt-4 text-center">
              <div className="text-lg font-semibold text-red-500">🎉 GAME FINISHED! 🎉</div>
              <div className="text-xs mt-1">Redirecting to finish page...</div>
            </div>
          )}
        </div>

        {/* Win Money Panel */}
        <div className="bg-yellow-400 text-black p-6 rounded-lg w-64 h-fit">
          <div className="text-center">
            <div className="text-lg font-bold mb-2">Win Money</div>
            <div className="text-3xl font-bold mb-4">112.5 BIRR</div>
            <div className="flex items-center justify-center gap-2">
              <div className="text-2xl">💰</div>
              <div className="text-2xl">💵</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayBingo;