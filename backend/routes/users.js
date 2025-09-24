const express = require('express');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const { 
  validateUserUpdate, 
  validateMongoId, 
  validatePagination,
  validateDateRange
} = require('../middleware/validation');

const router = express.Router();

// @route   GET /api/users
// @desc    Get all users (Admin only)
// @access  Private/Admin
router.get('/', verifyToken, requireAdmin, validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const status = req.query.status;
    const role = req.query.role;

    // Build query
    const query = {};
    
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { shopName: { $regex: search, $options: 'i' } },
        { 'profile.firstName': { $regex: search, $options: 'i' } },
        { 'profile.lastName': { $regex: search, $options: 'i' } }
      ];
    }

    if (status) {
      query.status = status;
    }

    if (role) {
      query.role = role;
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalUsers: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching users'
    });
  }
});

// @route   GET /api/users/stats
// @desc    Get user statistics (Admin only)
// @access  Private/Admin
router.get('/stats', verifyToken, requireAdmin, validateDateRange, async (req, res) => {
  try {
    const startDate = req.query.startDate ? new Date(req.query.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();

    const stats = await User.aggregate([
      {
        $facet: {
          totalUsers: [{ $count: "count" }],
          activeUsers: [
            { $match: { status: 'active' } },
            { $count: "count" }
          ],
          newUsers: [
            { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
            { $count: "count" }
          ],
          usersByRole: [
            { $group: { _id: '$role', count: { $sum: 1 } } }
          ],
          usersByStatus: [
            { $group: { _id: '$status', count: { $sum: 1 } } }
          ],
          topGamers: [
            { $sort: { 'gameStats.totalGames': -1 } },
            { $limit: 10 },
            { 
              $project: { 
                username: 1, 
                'gameStats.totalGames': 1, 
                'gameStats.totalBet': 1,
                'gameStats.totalWin': 1 
              } 
            }
          ]
        }
      }
    ]);

    const result = stats[0];

    res.json({
      success: true,
      data: {
        totalUsers: result.totalUsers[0]?.count || 0,
        activeUsers: result.activeUsers[0]?.count || 0,
        newUsers: result.newUsers[0]?.count || 0,
        usersByRole: result.usersByRole,
        usersByStatus: result.usersByStatus,
        topGamers: result.topGamers
      }
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user statistics'
    });
  }
});

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private (Admin or own profile)
router.get('/:id', verifyToken, validateMongoId('id'), async (req, res) => {
  try {
    const { id } = req.params;

    // Users can only view their own profile unless they're admin
    if (req.user.role !== 'admin' && req.user._id.toString() !== id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const user = await User.findById(id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user'
    });
  }
});

// @route   PUT /api/users/:id
// @desc    Update user
// @access  Private (Admin or own profile)
router.put('/:id', verifyToken, validateMongoId('id'), validateUserUpdate, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Users can only update their own profile unless they're admin
    if (req.user.role !== 'admin' && req.user._id.toString() !== id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Non-admin users cannot change role or status
    if (req.user.role !== 'admin') {
      delete updates.role;
      delete updates.status;
    }

    // Check if username or email already exists (if being updated)
    if (updates.username) {
      const existingUser = await User.findOne({
        _id: { $ne: id },
        username: updates.username
        return res.status(400).json({
          success: false,
          message: 'Username already taken'
    }

    const user = await User.findByIdAndUpdate(
      id,
      { ...updates, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User updated successfully',
      data: { user }
    });
  } catch (error) {
    console.error('Update user error:', error);
    
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while updating user'
    });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete user (Admin only)
// @access  Private/Admin
router.delete('/:id', verifyToken, requireAdmin, validateMongoId('id'), async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent admin from deleting themselves
    if (req.user._id.toString() === id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    const user = await User.findByIdAndDelete(id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting user'
    });
  }
});

// @route   PUT /api/users/:id/status
// @desc    Update user status (Admin only)
// @access  Private/Admin
router.put('/:id/status', verifyToken, requireAdmin, validateMongoId('id'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'inactive', 'suspended'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be active, inactive, or suspended'
      });
    }

    // Prevent admin from suspending themselves
    if (req.user._id.toString() === id && status === 'suspended') {
      return res.status(400).json({
        success: false,
        message: 'Cannot suspend your own account'
      });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { status, updatedAt: new Date() },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: `User status updated to ${status}`,
      data: { user }
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating user status'
    });
  }
});

// @route   GET /api/users/:id/transactions
// @desc    Get user transactions
// @access  Private (Admin or own transactions)
router.get('/:id/transactions', verifyToken, validateMongoId('id'), validatePagination, async (req, res) => {
  try {
    const { id } = req.params;

    // Users can only view their own transactions unless they're admin
    if (req.user.role !== 'admin' && req.user._id.toString() !== id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const type = req.query.type;
    const status = req.query.status;

    const query = { userId: id };
    
    if (type) query.type = type;
    if (status) query.status = status;

    const transactions = await Transaction.getUserTransactions(id, limit, (page - 1) * limit);
    const total = await Transaction.countDocuments(query);

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalTransactions: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get user transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user transactions'
    });
  }
});

// @route   GET /api/users/:id/game-history
// @desc    Get user game history
// @access  Private (Admin or own history)
router.get('/:id/game-history', verifyToken, validateMongoId('id'), validatePagination, async (req, res) => {
  try {
    const { id } = req.params;

    // Users can only view their own history unless they're admin
    if (req.user.role !== 'admin' && req.user._id.toString() !== id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const Cartela = require('../models/Cartela');
    
    const cartelas = await Cartela.find({ userId: id })
      .populate('gameId', 'title status actualStartTime endTime')
      .sort({ purchasedAt: -1 })
      .limit(limit)
      .skip(skip);

    const total = await Cartela.countDocuments({ userId: id });

    res.json({
      success: true,
      data: {
        gameHistory: cartelas,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalGames: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get user game history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user game history'
    });
  }
});

// @route   PUT /api/users/:id/role
// @desc    Update user role (Admin only)
// @access  Private/Admin
router.put('/:id/role', verifyToken, requireAdmin, validateMongoId('id'), async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be user or admin'
      });
    }

    // Prevent admin from changing their own role
    if (req.user._id.toString() === id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot change your own role'
      });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { role, updatedAt: new Date() },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: `User role updated to ${role}`,
      data: { user }
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating user role'
    });
  }
});

module.exports = router;
