import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import DualScreenManager from './components/DualScreenManager';
import NewGameSelection from './components/NewGameSelection';
import GameFinished from './components/GameFinished';
import CartelaList from './components/CartelaList';
import AddCartela from './components/AddCartela';
import Settings from './components/Settings';
import LoadingSpinner from './components/LoadingSpinner';
import Login from './components/Login';
import { useGameData } from './hooks/useGameData';
import { useAuth } from './contexts/AuthContext';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeComponent, setActiveComponent] = useState('dashboard');
  const [appLoading, setAppLoading] = useState(true);
  
  const {
    gameStats,
    gameData,
    user,
    currentGame,
    setCurrentGame,
    cartelas,
    setCartelas,
    loading: dataLoading,
    error: dataError,
    refreshData
  } = useGameData();

  React.useEffect(() => {
    const timer = setTimeout(() => setAppLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleMenuItemClick = (item: string) => {
    if (item === 'logout') {
      // Handle logout
      console.log('Logging out...');
      return;
    }

    // For Play Bingo, just set the active component in the same window
    setActiveComponent(item);
  };

  const handleNumberCall = (number: number) => {
    if (!currentGame) return;
    
    setCurrentGame(prev => {
      if (!prev) return null;
      const calledNumbers = prev.calledNumbers || [];
      return {
        ...prev,
        calledNumbers: calledNumbers.includes(number)
          ? calledNumbers.filter(n => n !== number)
          : [...calledNumbers, number]
      };
    });
  };

  const handleCreateNewGame = () => {
    if (!currentGame) return;
    
    setCurrentGame(prev => {
      if (!prev) return null;
      return {
        ...prev,
        id: (prev.id || 0) + 1,
        status: 'waiting' as const,
        calledNumbers: [],
        selectedNumbers: []
      };
    });
    setActiveComponent('play-bingo');
  };

  const handleStartGame = (selectedCards: number[]) => {
    if (!currentGame) return;
    
    setCurrentGame(prev => {
      if (!prev) return null;
      return {
        ...prev,
        status: 'active' as const,
        selectedNumbers: selectedCards
      };
    });
    setActiveComponent('play-bingo');
  };

  const handleAddCartela = (cartela: any) => {
    setCartelas(prev => [...prev, cartela]);
    setActiveComponent('cartela-list');
  };

  // Check if opened from URL parameter (for new window)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const page = urlParams.get('page');
    if (page === 'play-bingo') {
      setActiveComponent('play-bingo');
    } else if (page === 'new-game') {
      setActiveComponent('new-game');
    } else if (page === 'game-finished') {
      setActiveComponent('game-finished');
    }
  }, []);

  if (appLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl font-bold text-yellow-400 mb-4">BINGO ONE</div>
          <LoadingSpinner size="lg" />
          <div className="text-white mt-4">Loading game...</div>
        </div>
      </div>
    );
  }

  const renderActiveComponent = () => {
    switch (activeComponent) {
      case 'dashboard':
        return <Dashboard gameStats={gameStats} gameData={gameData} />;
      case 'new-game':
        return (
          <NewGameSelection
            onStartGame={handleStartGame}
            onReturnToMenu={() => setActiveComponent('dashboard')}
          />
        );
      case 'play-bingo':
        return (
          <DualScreenManager
            game={currentGame}
            onNumberCall={handleNumberCall}
            onCreateNewGame={handleCreateNewGame}
          />
        );
      case 'game-finished':
        return (
          <GameFinished
            onCreateNewGame={handleCreateNewGame}
            onReturnToMenu={() => setActiveComponent('dashboard')}
          />
        );
      case 'add-cartela':
        return (
          <AddCartela
            onSave={handleAddCartela}
            onCancel={() => setActiveComponent('cartela-list')}
          />
        );
      case 'cartela-list':
        return (
          <CartelaList
            cartelas={cartelas}
            onAddCartela={() => setActiveComponent('add-cartela')}
            onNewGame={() => setActiveComponent('play-bingo')}
          />
        );
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard gameStats={gameStats} gameData={gameData} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex relative">
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={handleSidebarToggle}
        activeItem={activeComponent}
        onItemClick={handleMenuItemClick}
      />
      
      <div className={`flex-1 flex flex-col transition-all duration-300 ${activeComponent === 'play-bingo' || activeComponent === 'cartela-list' ? '' : 'lg:ml-0'}`}>
        {!['play-bingo', 'cartela-list', 'new-game', 'game-finished'].includes(activeComponent) && (
          <Header onMenuToggle={handleSidebarToggle} user={user} />
        )}
        
        <main className={`flex-1 overflow-auto ${['play-bingo', 'cartela-list', 'new-game', 'game-finished'].includes(activeComponent) ? 'ml-0' : ''}`}>
          {renderActiveComponent()}
        </main>
      </div>
    </div>
  );
}

export default App;
