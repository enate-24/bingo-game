import { useState, useEffect, useCallback } from 'react';
import { GameStats, GameData, Game, Cartela, DashboardOverview, FinancialSummary } from '../types';
import { apiService } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';

export const useGameData = () => {
  const { user } = useAuth();
  const [gameStats, setGameStats] = useState<GameStats>({
    dailyProfit: 0,
    dailyTotal: 0,
    weeklyTotal: 0,
    weeklyProfit: 0,
    fifteenDayProfit: 0,
    todayHouseJackpot: 0,
    todayPlayersJackpot: 0
  });
  const [gameData, setGameData] = useState<GameData[]>([]);
  const [currentGame, setCurrentGame] = useState<Game | null>(null);
  const [cartelas, setCartelas] = useState<Cartela[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  // Fetch dashboard overview and transform to game stats
  const fetchGameStats = useCallback(async () => {
    try {
      const [overviewResponse, financialResponse] = await Promise.all([
        apiService.getDashboardOverview(),
        apiService.getFinancialSummary()
      ]);

      if (overviewResponse.success && overviewResponse.data) {
        const overview: DashboardOverview = overviewResponse.data;
        const financial: FinancialSummary = financialResponse.success ? financialResponse.data : null;

        // Transform backend data to match frontend GameStats interface
        const transformedStats: GameStats = {
          dailyProfit: financial?.summary?.netProfit || 0,
          dailyTotal: overview.recent30Days.revenue || 0,
          weeklyTotal: overview.lastWeek.revenue || 0,
          weeklyProfit: financial?.summary?.netProfit * 0.7 || 0, // Approximate weekly profit
          fifteenDayProfit: financial?.summary?.netProfit * 0.5 || 0, // Approximate 15-day profit
          todayHouseJackpot: financial?.summary?.totalRevenue * 0.1 || 0, // Approximate jackpot
          todayPlayersJackpot: financial?.summary?.totalPayouts * 0.8 || 0, // Approximate player jackpot
          totalGames: overview.overview.totalGames,
          totalRevenue: overview.overview.totalRevenue,
          totalHouseProfit: financial?.summary?.netProfit || 0
        };

        setGameStats(transformedStats);
      }
    } catch (err) {
      console.error('Failed to fetch game statistics:', err);
      setError('Failed to load game statistics');
    }
  }, []);

  // Fetch game data history (mock transformation for now)
  const fetchGameData = useCallback(async () => {
    try {
      // For now, we'll create mock data based on financial summary
      const response = await apiService.getFinancialSummary();
      if (response.success && response.data) {
        // Create mock historical data
        const mockGameData: GameData[] = [];
        const today = new Date();
        
        for (let i = 0; i < 7; i++) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          
          mockGameData.push({
            date: date.toISOString().split('T')[0],
            games: Math.floor(Math.random() * 15) + 5,
            playersBet: (Math.random() * 2000 + 500).toFixed(2),
            playersWon: (Math.random() * 1500 + 300).toFixed(2),
            houseProfit: (Math.random() * 500 + 100).toFixed(2)
          });
        }
        
        setGameData(mockGameData);
      }
    } catch (err) {
      console.error('Failed to fetch game data:', err);
    }
  }, []);

  // Fetch current active game
  const fetchCurrentGame = useCallback(async () => {
    try {
      const response = await apiService.getCurrentGame();
      if (response.success && response.data) {
        const gameData = response.data;
        // Transform backend game data to match frontend interface
        const transformedGame: Game = {
          ...gameData,
          id: parseInt(gameData.gameId?.split('_')[1]) || 188, // Extract numeric ID
          betMoney: gameData.cartelaPrice || 125,
          winMoney: gameData.prizePool * 0.9 || 112.5,
          cartelaSelected: gameData.statistics?.totalCartelasSold || 25,
          calledNumbers: gameData.drawnNumbers?.map((dn: any) => dn.number) || [],
          selectedNumbers: []
        };
        setCurrentGame(transformedGame);
      } else {
        // Set default game if no active game
        setCurrentGame({
          gameId: 'GAME_DEFAULT',
          title: 'Default Game',
          gameType: 'traditional',
          status: 'waiting',
          maxPlayers: 100,
          currentPlayers: 0,
          cartelaPrice: 125,
          prizePool: 0,
          prizes: [],
          drawnNumbers: [],
          winningPattern: 'full_house',
          winners: [],
          gameSettings: {
            autoCallInterval: 5000,
            allowLateBuying: false,
            maxCartelasPerPlayer: 10
          },
          operator: '',
          statistics: {
            totalCartelasSold: 0,
            totalRevenue: 0,
            totalPrizesAwarded: 0,
            houseProfit: 0
          },
          createdAt: new Date(),
          updatedAt: new Date(),
          id: 188,
          betMoney: 125,
          winMoney: 112.5,
          cartelaSelected: 25,
          calledNumbers: [],
          selectedNumbers: []
        });
      }
    } catch (err) {
      console.error('Failed to fetch current game:', err);
      // Set default game on error
      setCurrentGame({
        gameId: 'GAME_DEFAULT',
        title: 'Default Game',
        gameType: 'traditional',
        status: 'waiting',
        maxPlayers: 100,
        currentPlayers: 0,
        cartelaPrice: 125,
        prizePool: 0,
        prizes: [],
        drawnNumbers: [],
        winningPattern: 'full_house',
        winners: [],
        gameSettings: {
          autoCallInterval: 5000,
          allowLateBuying: false,
          maxCartelasPerPlayer: 10
        },
        operator: '',
        statistics: {
          totalCartelasSold: 0,
          totalRevenue: 0,
          totalPrizesAwarded: 0,
          houseProfit: 0
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        id: 188,
        betMoney: 125,
        winMoney: 112.5,
        cartelaSelected: 25,
        calledNumbers: [],
        selectedNumbers: []
      });
    }
  }, []);

  // Fetch user cartelas
  const fetchCartelas = useCallback(async () => {
    try {
      const response = await apiService.getUserCartelas();
      if (response.success && response.data) {
        const cartelasData = response.data;
        // Transform backend cartela data to match frontend interface
        const transformedCartelas: Cartela[] = cartelasData.map((cartela: any) => ({
          ...cartela,
          id: cartela._id,
          selected: cartela.isActive
        }));
        setCartelas(transformedCartelas);
      }
    } catch (err) {
      console.error('Failed to fetch cartelas:', err);
      // Set default cartelas on error
      setCartelas([
        {
          numbers: [1, 16, 31, 46, 61, 2, 17, 32, 47, 62, 3, 18, 0, 48, 63, 4, 19, 33, 49, 64, 5, 20, 34, 50, 65],
          isActive: true,
          purchasePrice: 125,
          purchasedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          id: 1,
          selected: true
        },
        {
          numbers: [6, 21, 36, 51, 66, 7, 22, 37, 52, 67, 8, 23, 0, 53, 68, 9, 24, 38, 54, 69, 10, 25, 39, 55, 70],
          isActive: false,
          purchasePrice: 125,
          purchasedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          id: 2,
          selected: false
        }
      ]);
    }
  }, []);

  // Initialize data on component mount
  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      setError(null);

      try {
        await Promise.all([
          fetchGameStats(),
          fetchGameData(),
          fetchCurrentGame(),
          fetchCartelas()
        ]);
      } catch (err) {
        console.error('Failed to initialize data:', err);
        setError('Failed to load application data');
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, [fetchGameStats, fetchGameData, fetchCurrentGame, fetchCartelas]);

  // Refresh data function
  const refreshData = useCallback(async () => {
    await Promise.all([
      fetchGameStats(),
      fetchCurrentGame(),
      fetchCartelas()
    ]);
  }, [fetchGameStats, fetchCurrentGame, fetchCartelas]);

  return {
    gameStats,
    gameData,
    user,
    currentGame,
    setCurrentGame,
    cartelas,
    setCartelas,
    loading,
    error,
    refreshData
  };
};
