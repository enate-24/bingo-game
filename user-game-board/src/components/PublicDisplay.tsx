import React, { useEffect, useState } from 'react';

interface PublicDisplayProps {
  gameState: any;
}

const PublicDisplay: React.FC<PublicDisplayProps> = ({ gameState: initialGameState }) => {
  const [gameState, setGameState] = useState(initialGameState);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Listen for game state updates from operator interface
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'GAME_STATE') {
        setGameState(event.data.data);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const bingoLetters = ['B', 'I', 'N', 'G', 'O'];
  const getNumbersForColumn = (columnIndex: number) => {
    const start = columnIndex * 15 + 1;
    return Array.from({ length: 15 }, (_, i) => start + i);
  };

  const getStatusColor = () => {
    switch (gameState.gameStatus) {
      case 'active': return 'bg-green-500';
      case 'paused': return 'bg-yellow-500';
      case 'finished': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    switch (gameState.gameStatus) {
      case 'active': return 'GAME IS ACTIVE';
      case 'paused': return 'GAME IS PAUSED';
      case 'finished': return 'GAME IS FINISHED';
      default: return 'GAME IS WAITING';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 text-white overflow-hidden">
      {/* Header */}
      <div className="bg-black bg-opacity-50 p-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="text-6xl font-bold text-yellow-400">BINGO</div>
            <div className={`${getStatusColor()} text-black px-6 py-3 rounded-lg text-2xl font-bold`}>
              {getStatusText()}
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-3xl font-bold">
              {currentTime.toLocaleTimeString()}
            </div>
            <div className="text-xl text-gray-300">
              {currentTime.toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-120px)]">
        {/* Left Side - Current Number Display */}
        <div className="w-1/3 flex flex-col items-center justify-center p-8">
          <div className="text-center mb-8">
            <div className="text-4xl font-bold text-yellow-400 mb-4">CURRENT NUMBER</div>
            {gameState.currentNumber ? (
              <div className="relative">
                <div className="w-80 h-80 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-2xl animate-pulse">
                  <div className="text-9xl font-bold text-black">
                    {gameState.currentNumber}
                  </div>
                </div>
                <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-black bg-opacity-70 px-6 py-2 rounded-full">
                    <div className="text-2xl font-bold text-yellow-400">
                      {bingoLetters[Math.floor((gameState.currentNumber - 1) / 15)]}-{gameState.currentNumber}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-80 h-80 bg-gray-700 rounded-full flex items-center justify-center shadow-2xl">
                <div className="text-4xl font-bold text-gray-400">
                  WAITING
                </div>
              </div>
            )}
          </div>

          {/* Game Progress */}
          <div className="w-full max-w-md">
            <div className="bg-black bg-opacity-50 p-6 rounded-lg">
              <div className="text-center mb-4">
                <div className="text-2xl font-bold text-yellow-400">GAME PROGRESS</div>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between text-xl">
                  <span>Numbers Called:</span>
                  <span className="font-bold text-green-400">{gameState.calledNumbers.length}</span>
                </div>
                
                <div className="flex justify-between text-xl">
                  <span>Remaining:</span>
                  <span className="font-bold text-blue-400">{75 - gameState.calledNumbers.length}</span>
                </div>
                
                <div className="w-full bg-gray-700 rounded-full h-4">
                  <div 
                    className="bg-gradient-to-r from-green-400 to-blue-500 h-4 rounded-full transition-all duration-500"
                    style={{ width: `${(gameState.calledNumbers.length / 75) * 100}%` }}
                  />
                </div>
                
                <div className="text-center text-2xl font-bold text-yellow-400">
                  {Math.round((gameState.calledNumbers.length / 75) * 100)}% Complete
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Bingo Board */}
        <div className="flex-1 p-8">
          <div className="bg-black bg-opacity-30 rounded-2xl p-8 h-full">
            <div className="text-center mb-8">
              <div className="text-4xl font-bold text-yellow-400 mb-2">BINGO BOARD</div>
              <div className="text-xl text-gray-300">Called Numbers Highlighted</div>
            </div>

            <div className="flex justify-center">
              <div className="flex gap-4">
                {/* BINGO Column Headers */}
                <div className="flex flex-col gap-2">
                  {bingoLetters.map((letter) => (
                    <div
                      key={letter}
                      className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white font-bold text-3xl rounded-lg shadow-lg"
                    >
                      {letter}
                    </div>
                  ))}
                </div>

                {/* Number Grid */}
                <div className="grid grid-cols-15 gap-2">
                  {bingoLetters.map((letter, columnIndex) => 
                    getNumbersForColumn(columnIndex).map((number) => (
                      <div
                        key={number}
                        className={`w-16 h-16 flex items-center justify-center text-white font-bold text-lg rounded-lg transition-all duration-500 ${
                          gameState.calledNumbers.includes(number) 
                            ? 'bg-gradient-to-br from-green-400 to-green-600 shadow-lg transform scale-110 animate-pulse' 
                            : 'bg-gradient-to-br from-gray-600 to-gray-800'
                        } ${
                          gameState.currentNumber === number 
                            ? 'ring-4 ring-yellow-400 ring-opacity-75 animate-bounce' 
                            : ''
                        }`}
                      >
                        {number}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-black bg-opacity-50 p-4">
        <div className="flex justify-center items-center gap-8 text-xl">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
            <span>Called Numbers</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-600 rounded-full"></div>
            <span>Available Numbers</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-400 rounded-full animate-pulse"></div>
            <span>Current Number</span>
          </div>
        </div>
      </div>

      {/* Winning Pattern Display (if game is finished) */}
      {gameState.gameStatus === 'finished' && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-yellow-400 to-orange-500 p-12 rounded-2xl text-center text-black">
            <div className="text-8xl mb-6">🏆</div>
            <div className="text-6xl font-bold mb-4">BINGO!</div>
            <div className="text-3xl font-semibold">Game Complete</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicDisplay;