const express = require('express');
const Game = require('../models/Game');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Cartela = require('../models/Cartela');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const { validateDateRange } = require('../middleware/validation');

const router = express.Router();

// @route   GET /api/dashboard/overview
// @desc    Get dashboard overview statistics
// @access  Private/Admin
router.get('/overview', verifyToken, requireAdmin, async (req, res) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get basic counts
    const [
      totalUsers,
      activeUsers,
      totalGames,
      activeGames,
      totalTransactions,
      totalRevenue
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ status: 'active' }),
      Game.countDocuments(),
      Game.countDocuments({ status: { $in: ['waiting', 'active', 'paused'] } }),
      Transaction.countDocuments({ status: 'completed' }),
      Transaction.aggregate([
        { $match: { status: 'completed', type: { $in: ['purchase', 'deposit'] } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);

    // Get recent statistics (last 30 days)
    const recentStats = await Promise.all([
      User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      Game.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      Transaction.countDocuments({ 
        createdAt: { $gte: thirtyDaysAgo }, 
        status: 'completed' 
      }),
      Transaction.aggregate([
        { 
          $match: { 
            createdAt: { $gte: thirtyDaysAgo }, 
            status: 'completed',
            type: { $in: ['purchase', 'deposit'] }
          } 
        },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);

    // Get weekly statistics (last 7 days)
    const weeklyStats = await Promise.all([
      User.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      Game.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      Transaction.countDocuments({ 
        createdAt: { $gte: sevenDaysAgo }, 
        status: 'completed' 
      }),
      Transaction.aggregate([
        { 
          $match: { 
            createdAt: { $gte: sevenDaysAgo }, 
            status: 'completed',
            type: { $in: ['purchase', 'deposit'] }
          } 
        },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          activeUsers,
          totalGames,
          activeGames,
          totalTransactions,
          totalRevenue: totalRevenue[0]?.total || 0
        },
        recent30Days: {
          newUsers: recentStats[0],
          newGames: recentStats[1],
          newTransactions: recentStats[2],
          revenue: recentStats[3][0]?.total || 0
        },
        lastWeek: {
          newUsers: weeklyStats[0],
          newGames: weeklyStats[1],
          newTransactions: weeklyStats[2],
          revenue: weeklyStats[3][0]?.total || 0
        }
      }
    });
  } catch (error) {
    console.error('Get dashboard overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching dashboard overview'
    });
  }
});

// @route   GET /api/dashboard/revenue-chart
// @desc    Get revenue chart data
// @access  Private/Admin
router.get('/revenue-chart', verifyToken, requireAdmin, validateDateRange, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const revenueData = await Transaction.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: 'completed',
          type: { $in: ['purchase', 'deposit'] }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          revenue: { $sum: '$amount' },
          transactions: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    // Fill in missing days with zero revenue
    const chartData = [];
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const dateKey = {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate()
      };

      const existingData = revenueData.find(item => 
        item._id.year === dateKey.year &&
        item._id.month === dateKey.month &&
        item._id.day === dateKey.day
      );

      chartData.push({
        date: date.toISOString().split('T')[0],
        revenue: existingData ? existingData.revenue : 0,
        transactions: existingData ? existingData.transactions : 0
      });
    }

    res.json({
      success: true,
      data: { chartData }
    });
  } catch (error) {
    console.error('Get revenue chart error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching revenue chart data'
    });
  }
});

// @route   GET /api/dashboard/user-growth
// @desc    Get user growth chart data
// @access  Private/Admin
router.get('/user-growth', verifyToken, requireAdmin, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const userGrowthData = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          newUsers: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    // Fill in missing days and calculate cumulative growth
    const chartData = [];
    let cumulativeUsers = await User.countDocuments({ 
      createdAt: { $lt: startDate } 
    });

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const dateKey = {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate()
      };

      const existingData = userGrowthData.find(item => 
        item._id.year === dateKey.year &&
        item._id.month === dateKey.month &&
        item._id.day === dateKey.day
      );

      const newUsers = existingData ? existingData.newUsers : 0;
      cumulativeUsers += newUsers;

      chartData.push({
        date: date.toISOString().split('T')[0],
        newUsers,
        totalUsers: cumulativeUsers
      });
    }

    res.json({
      success: true,
      data: { chartData }
    });
  } catch (error) {
    console.error('Get user growth error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user growth data'
    });
  }
});

// @route   GET /api/dashboard/game-statistics
// @desc    Get game statistics
// @access  Private/Admin
router.get('/game-statistics', verifyToken, requireAdmin, async (req, res) => {
  try {
    const gameStats = await Game.aggregate([
      {
        $facet: {
          statusDistribution: [
            { $group: { _id: '$status', count: { $sum: 1 } } }
          ],
          typeDistribution: [
            { $group: { _id: '$gameType', count: { $sum: 1 } } }
          ],
          revenueByGame: [
            { $match: { status: 'finished' } },
            { 
              $project: { 
                title: 1, 
                revenue: '$statistics.totalRevenue',
                profit: '$statistics.houseProfit',
                players: '$currentPlayers'
              } 
            },
            { $sort: { revenue: -1 } },
            { $limit: 10 }
          ],
          averageStats: [
            { $match: { status: 'finished' } },
            {
              $group: {
                _id: null,
                avgRevenue: { $avg: '$statistics.totalRevenue' },
                avgPlayers: { $avg: '$currentPlayers' },
                avgDuration: { $avg: '$duration' },
                avgProfit: { $avg: '$statistics.houseProfit' }
              }
            }
          ]
        }
      }
    ]);

    const result = gameStats[0];

    res.json({
      success: true,
      data: {
        statusDistribution: result.statusDistribution,
        typeDistribution: result.typeDistribution,
        topGames: result.revenueByGame,
        averageStats: result.averageStats[0] || {}
      }
    });
  } catch (error) {
    console.error('Get game statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching game statistics'
    });
  }
});

// @route   GET /api/dashboard/recent-activities
// @desc    Get recent activities
// @access  Private/Admin
router.get('/recent-activities', verifyToken, requireAdmin, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;

    const [recentUsers, recentGames, recentTransactions] = await Promise.all([
      User.find()
        .select('username email createdAt status')
        .sort({ createdAt: -1 })
        .limit(5),
      
      Game.find()
        .select('title status createdAt operator')
        .populate('operator', 'username')
        .sort({ createdAt: -1 })
        .limit(5),
      
      Transaction.find({ status: 'completed' })
        .select('type amount createdAt userId gameId')
        .populate('userId', 'username')
        .populate('gameId', 'title')
        .sort({ createdAt: -1 })
        .limit(10)
    ]);

    // Combine and sort all activities
    const activities = [];

    recentUsers.forEach(user => {
      activities.push({
        type: 'user_registered',
        message: `New user ${user.username} registered`,
        timestamp: user.createdAt,
        data: { userId: user._id, username: user.username }
      });
    });

    recentGames.forEach(game => {
      activities.push({
        type: 'game_created',
        message: `New game "${game.title}" created by ${game.operator?.username}`,
        timestamp: game.createdAt,
        data: { gameId: game._id, title: game.title, operator: game.operator?.username }
      });
    });

    recentTransactions.forEach(transaction => {
      let message = '';
      switch (transaction.type) {
        case 'purchase':
          message = `${transaction.userId?.username} purchased cartela for $${transaction.amount}`;
          break;
        case 'prize':
          message = `${transaction.userId?.username} won $${transaction.amount}`;
          break;
        case 'deposit':
          message = `${transaction.userId?.username} deposited $${transaction.amount}`;
          break;
        case 'withdrawal':
          message = `${transaction.userId?.username} withdrew $${transaction.amount}`;
          break;
        default:
          message = `${transaction.userId?.username} ${transaction.type} $${transaction.amount}`;
      }

      activities.push({
        type: `transaction_${transaction.type}`,
        message,
        timestamp: transaction.createdAt,
        data: { 
          transactionId: transaction._id, 
          amount: transaction.amount,
          user: transaction.userId?.username,
          game: transaction.gameId?.title
        }
      });
    });

    // Sort by timestamp and limit
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const limitedActivities = activities.slice(0, limit);

    res.json({
      success: true,
      data: { activities: limitedActivities }
    });
  } catch (error) {
    console.error('Get recent activities error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching recent activities'
    });
  }
});

// @route   GET /api/dashboard/top-players
// @desc    Get top players by various metrics
// @access  Private/Admin
router.get('/top-players', verifyToken, requireAdmin, async (req, res) => {
  try {
    const metric = req.query.metric || 'totalBet'; // totalBet, totalWin, totalGames
    const limit = parseInt(req.query.limit) || 10;

    let sortField;
    switch (metric) {
      case 'totalWin':
        sortField = 'gameStats.totalWin';
        break;
      case 'totalGames':
        sortField = 'gameStats.totalGames';
        break;
      case 'totalProfit':
        sortField = 'gameStats.totalProfit';
        break;
      default:
        sortField = 'gameStats.totalBet';
    }

    const topPlayers = await User.find({ 
      'gameStats.totalGames': { $gt: 0 } 
    })
      .select('username email profile gameStats')
      .sort({ [sortField]: -1 })
      .limit(limit);

    res.json({
      success: true,
      data: { 
        topPlayers,
        metric,
        sortedBy: sortField
      }
    });
  } catch (error) {
    console.error('Get top players error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching top players'
    });
  }
});

// @route   GET /api/dashboard/system-health
// @desc    Get system health metrics
// @access  Private/Admin
router.get('/system-health', verifyToken, requireAdmin, async (req, res) => {
  try {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [
      activeGamesCount,
      recentTransactions,
      failedTransactions,
      suspendedUsers,
      recentErrors
    ] = await Promise.all([
      Game.countDocuments({ status: 'active' }),
      Transaction.countDocuments({ 
        createdAt: { $gte: oneHourAgo },
        status: 'completed'
      }),
      Transaction.countDocuments({ 
        createdAt: { $gte: oneDayAgo },
        status: 'failed'
      }),
      User.countDocuments({ status: 'suspended' }),
      Transaction.countDocuments({ 
        createdAt: { $gte: oneDayAgo },
        status: { $in: ['failed', 'cancelled'] }
      })
    ]);

    // Calculate system health score (0-100)
    let healthScore = 100;
    
    if (failedTransactions > 10) healthScore -= 20;
    if (suspendedUsers > 5) healthScore -= 15;
    if (recentErrors > 20) healthScore -= 25;
    if (activeGamesCount === 0) healthScore -= 10;
    if (recentTransactions === 0) healthScore -= 10;

    healthScore = Math.max(0, healthScore);

    let healthStatus = 'excellent';
    if (healthScore < 50) healthStatus = 'critical';
    else if (healthScore < 70) healthStatus = 'warning';
    else if (healthScore < 90) healthStatus = 'good';

    res.json({
      success: true,
      data: {
        healthScore,
        healthStatus,
        metrics: {
          activeGames: activeGamesCount,
          recentTransactions,
          failedTransactions,
          suspendedUsers,
          recentErrors
        },
        timestamp: now
      }
    });
  } catch (error) {
    console.error('Get system health error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching system health'
    });
  }
});

// @route   GET /api/dashboard/financial-summary
// @desc    Get financial summary
// @access  Private/Admin
router.get('/financial-summary', verifyToken, requireAdmin, validateDateRange, async (req, res) => {
  try {
    const startDate = req.query.startDate ? new Date(req.query.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();

    const financialData = await Transaction.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: '$type',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
          avgAmount: { $avg: '$amount' }
        }
      }
    ]);

    // Calculate totals
    let totalRevenue = 0;
    let totalPayouts = 0;
    let totalDeposits = 0;
    let totalWithdrawals = 0;

    financialData.forEach(item => {
      switch (item._id) {
        case 'purchase':
        case 'deposit':
          totalRevenue += item.totalAmount;
          if (item._id === 'deposit') totalDeposits += item.totalAmount;
          break;
        case 'prize':
        case 'withdrawal':
          totalPayouts += item.totalAmount;
          if (item._id === 'withdrawal') totalWithdrawals += item.totalAmount;
          break;
      }
    });

    const netProfit = totalRevenue - totalPayouts;
    const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(2) : 0;

    res.json({
      success: true,
      data: {
        summary: {
          totalRevenue,
          totalPayouts,
          netProfit,
          profitMargin: parseFloat(profitMargin),
          totalDeposits,
          totalWithdrawals
        },
        breakdown: financialData,
        period: {
          startDate,
          endDate,
          days: Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))
        }
      }
    });
  } catch (error) {
    console.error('Get financial summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching financial summary'
    });
  }
});

module.exports = router;
