import React, { useState, useEffect } from 'react';
import { Monitor, Tv, Settings, Users, Play, Pause, Square, RotateCcw } from 'lucide-react';
import OperatorInterface from './OperatorInterface';
import PublicDisplay from './PublicDisplay';

interface DualScreenManagerProps {
  game: any;
  onNumberCall: (number: number) => void;
  onCreateNewGame: () => void;
}

const DualScreenManager: React.FC<DualScreenManagerProps> = ({ 
  game, 
  onNumberCall, 
  onCreateNewGame 
}) => {
  const [hasSecondScreen, setHasSecondScreen] = useState(false);
  const [publicWindow, setPublicWindow] = useState<Window | null>(null);
  const [gameState, setGameState] = useState({
    currentNumber: null as number | null,
    calledNumbers: [] as number[],
    gameStatus: 'waiting' as 'waiting' | 'active' | 'paused' | 'finished',
    pattern: 'full-card',
    players: 0,
    autoCall: false,
    callInterval: 3
  });

  // Detect second screen
  useEffect(() => {
    const checkScreens = () => {
      if (screen.availWidth > window.screen.width || window.screen.availHeight > window.screen.height) {
        setHasSecondScreen(true);
      }
    };

    checkScreens();
    window.addEventListener('resize', checkScreens);
    return () => window.removeEventListener('resize', checkScreens);
  }, []);

  // Open public display in same window
  const openPublicDisplay = () => {
    if (hasSecondScreen && !publicWindow) {
      window.location.href = `${window.location.origin}?display=public`;
    }
  };

  // Close public display
  const closePublicDisplay = () => {
    if (publicWindow) {
      publicWindow.close();
      setPublicWindow(null);
    }
  };

  // Update game state and sync with public display
  const updateGameState = (updates: Partial<typeof gameState>) => {
    const newState = { ...gameState, ...updates };
    setGameState(newState);
    
    if (publicWindow && !publicWindow.closed) {
      publicWindow.postMessage({ type: 'GAME_STATE', data: newState }, '*');
    }
  };

  // Handle number calling
  const handleNumberCall = (number: number) => {
    const newCalledNumbers = [...gameState.calledNumbers, number];
    updateGameState({
      currentNumber: number,
      calledNumbers: newCalledNumbers
    });
    onNumberCall(number);
  };

  // Check if we should show public display based on URL
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('display') === 'public') {
    return <PublicDisplay gameState={gameState} />;
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Dual Screen Status Bar */}
      <div className="bg-slate-800 text-white p-4 flex items-center justify-between border-b border-slate-700">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Monitor size={20} />
            <span className="font-semibold">Operator Interface</span>
          </div>
          
          <div className={`flex items-center gap-2 px-3 py-1 rounded ${
            hasSecondScreen ? 'bg-green-600' : 'bg-red-600'
          }`}>
            <Tv size={16} />
            <span className="text-sm">
              {hasSecondScreen ? 'Second Display Detected' : 'Single Display Mode'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasSecondScreen && (
            <>
              {!publicWindow || publicWindow.closed ? (
                <button
                  onClick={openPublicDisplay}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2"
                >
                  <Tv size={16} />
                  Open Public Display
                </button>
              ) : (
                <button
                  onClick={closePublicDisplay}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded flex items-center gap-2"
                >
                  <Square size={16} />
                  Close Public Display
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Main Operator Interface */}
      <OperatorInterface
        game={game}
        gameState={gameState}
        onNumberCall={handleNumberCall}
        onGameStateUpdate={updateGameState}
        onCreateNewGame={onCreateNewGame}
        hasPublicDisplay={!!publicWindow && !publicWindow.closed}
      />
    </div>
  );
};

export default DualScreenManager;
