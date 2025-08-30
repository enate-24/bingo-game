import React, { useState, useEffect } from 'react';
import { 
  Calendar,
  TrendingUp,
  BarChart3,
  Users,
  DollarSign,
  Activity,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { useWebSocket } from '../contexts/WebSocketContext';
import apiService from '../services/apiService';

interface DashboardStats {
  overview: {
    totalUsers: number;
    activeUsers: number;
    totalGames: number;
    activeGames: number;
    totalTransactions: number;
    totalRevenue: number;
  };
  recent30Days: {
    newUsers: number;
    newGames: number;
    newTransactions: number;
    revenue: number;
  };
  lastWeek: {
    newUsers: number;
    newGames: number;
    newTransactions: number;
    revenue: number;
  };
}

interface TopPlayer {
  _id: string;
  username: string;
  email: string;
  gameStats: {
    totalGames: number;
    totalBet: number;
    totalWin: number;
    totalProfit: number;
  };
}

interface SystemHealth {
  healthScore: number;
  healthStatus: string;
  metrics: {
    activeGames: number;
    recentTransactions: number;
    failedTransactions: number;
    suspendedUsers: number;
    recentErrors: number;
  };
}

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [topPlayers, setTopPlayers] = useState<TopPlayer[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { isConnected, lastMessage } = useWebSocket();

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [overviewResponse, topPlayersResponse, healthResponse] = await Promise.all([
        apiService.getDashboardOverview(),
        apiService.getTopPlayers('totalBet', 10),
        apiService.getSystemHealth()
      ]);

      if (overviewResponse.success) {
        setDashboardStats(overviewResponse.data);
      }

      if (topPlayersResponse.success) {
        setTopPlayers(topPlayersResponse.data.topPlayers || []);
      }

      if (healthResponse.success) {
        setSystemHealth(healthResponse.data);
      }

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Refresh data when WebSocket receives updates
  useEffect(() => {
    if (lastMessage && lastMessage.type === 'dashboard_update') {
      fetchDashboardData();
    }
  }, [lastMessage]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Error Loading Dashboard</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard Overview</h1>
          <p className="text-gray-600 dark:text-gray-400">Monitor your bingo platform performance</p>
        </div>
        
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                ${dashboardStats?.overview.totalRevenue?.toLocaleString() || '0'}
              </p>
            </div>
            <div className="p-3 rounded-full bg-green-50">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
            <span className="text-sm font-medium text-green-600">
              ${dashboardStats?.recent30Days.revenue?.toLocaleString() || '0'}
            </span>
            <span className="text-sm text-gray-500 ml-1">last 30 days</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Users</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {dashboardStats?.overview.activeUsers?.toLocaleString() || '0'}
              </p>
            </div>
            <div className="p-3 rounded-full bg-blue-50">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
            <span className="text-sm font-medium text-green-600">
              +{dashboardStats?.recent30Days.newUsers || 0}
            </span>
            <span className="text-sm text-gray-500 ml-1">new users</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Games</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {dashboardStats?.overview.activeGames || '0'}
              </p>
            </div>
            <div className="p-3 rounded-full bg-purple-50">
              <Activity className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
            <span className="text-sm font-medium text-green-600">
              +{dashboardStats?.recent30Days.newGames || 0}
            </span>
            <span className="text-sm text-gray-500 ml-1">new games</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">System Health</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {systemHealth?.healthScore || 0}%
              </p>
            </div>
            <div className={`p-3 rounded-full ${
              (systemHealth?.healthScore || 0) >= 90 ? 'bg-green-50' : 
              (systemHealth?.healthScore || 0) >= 70 ? 'bg-yellow-50' : 'bg-red-50'
            }`}>
              <CheckCircle className={`h-6 w-6 ${
                (systemHealth?.healthScore || 0) >= 90 ? 'text-green-600' : 
                (systemHealth?.healthScore || 0) >= 70 ? 'text-yellow-600' : 'text-red-600'
              }`} />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <span className={`text-sm font-medium ${
              (systemHealth?.healthScore || 0) >= 90 ? 'text-green-600' : 
              (systemHealth?.healthScore || 0) >= 70 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {systemHealth?.healthStatus || 'Unknown'}
            </span>
          </div>
        </div>
      </div>

      {/* Top Players Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Top Players</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Players with highest total bets</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700">
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">#</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">Player</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">Games</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">Total Bet</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">Total Win</th>
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {topPlayers.length > 0 ? topPlayers.map((player, index) => (
                <tr key={player._id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <td className="py-3 px-6 text-sm text-gray-900 dark:text-white">{index + 1}</td>
                  <td className="py-3 px-6 text-sm text-gray-900 dark:text-white font-medium">{player.username}</td>
                  <td className="py-3 px-6 text-sm text-gray-900 dark:text-white">{player.gameStats.totalGames}</td>
                  <td className="py-3 px-6 text-sm text-gray-900 dark:text-white">${player.gameStats.totalBet.toLocaleString()}</td>
                  <td className="py-3 px-6 text-sm text-gray-900 dark:text-white">${player.gameStats.totalWin.toLocaleString()}</td>
                  <td className="py-3 px-6 text-sm text-gray-900 dark:text-white">${player.gameStats.totalProfit.toLocaleString()}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="py-8 px-6 text-center text-gray-500 dark:text-gray-400">
                    No player data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Connection Status */}
      <div className="flex items-center justify-center gap-2 text-sm">
        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
        <span className="text-gray-600 dark:text-gray-400">
          {isConnected ? 'Real-time updates active' : 'Connection lost'}
        </span>
      </div>
    </div>
  );
};

export default Dashboard;
