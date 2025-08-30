const express = require('express');
const Transaction = require('../models/Transaction');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const { 
  validateTransaction, 
  validateMongoId, 
  validatePagination,
  validateDateRange
} = require('../middleware/validation');

const router = express.Router();

// @route   GET /api/transactions
// @desc    Get transactions (Admin: all, User: own)
// @access  Private
router.get('/', verifyToken, validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const type = req.query.type;
    const status = req.query.status;
    const userId = req.query.userId;

    // Build query based on user role
    let query = {};
    
    if (req.user.role === 'admin') {
      // Admin can see all transactions
      if (userId) query.userId = userId;
    } else {
      // Regular users can only see their own transactions
      query.userId = req.user._id;
    }

    if (type) query.type = type;
    if (status) query.status = status;

    const transactions = await Transaction.find(query)
      .populate('userId', 'username email profile')
      .populate('gameId', 'title gameId')
      .populate('cartelaId', 'cartelaId')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

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
    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching transactions'
    });
  }
});

// @route   GET /api/transactions/stats
// @desc    Get transaction statistics
// @access  Private/Admin
router.get('/stats', verifyToken, requireAdmin, validateDateRange, async (req, res) => {
  try {
    const startDate = req.query.startDate ? new Date(req.query.startDate) : null;
    const endDate = req.query.endDate ? new Date(req.query.endDate) : null;
    const type = req.query.type;

    const stats = await Transaction.getTransactionStatistics(startDate, endDate, type);

    res.json({
      success: true,
      data: { statistics: stats }
    });
  } catch (error) {
    console.error('Get transaction stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching transaction statistics'
    });
  }
});

// @route   GET /api/transactions/daily-summary
// @desc    Get daily transaction summary
// @access  Private/Admin
router.get('/daily-summary', verifyToken, requireAdmin, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const summary = await Transaction.getDailyTransactionSummary(days);

    res.json({
      success: true,
      data: { dailySummary: summary }
    });
  } catch (error) {
    console.error('Get daily transaction summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching daily transaction summary'
    });
  }
});

// @route   GET /api/transactions/:id
// @desc    Get transaction by ID
// @access  Private (Admin: all, User: own)
router.get('/:id', verifyToken, validateMongoId('id'), async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('userId', 'username email profile')
      .populate('gameId', 'title gameId')
      .populate('cartelaId', 'cartelaId')
      .populate('processedBy', 'username email');

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Users can only view their own transactions unless they're admin
    if (req.user.role !== 'admin' && transaction.userId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: { transaction }
    });
  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching transaction'
    });
  }
});

// @route   POST /api/transactions
// @desc    Create a new transaction (Admin only)
// @access  Private/Admin
router.post('/', verifyToken, requireAdmin, validateTransaction, async (req, res) => {
  try {
    const transactionData = {
      ...req.body,
      processedBy: req.user._id
    };

    const transaction = new Transaction(transactionData);
    await transaction.save();

    await transaction.populate('userId', 'username email profile');
    await transaction.populate('gameId', 'title gameId');
    await transaction.populate('cartelaId', 'cartelaId');

    res.status(201).json({
      success: true,
      message: 'Transaction created successfully',
      data: { transaction }
    });
  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating transaction'
    });
  }
});

// @route   PUT /api/transactions/:id/complete
// @desc    Complete a pending transaction
// @access  Private/Admin
router.put('/:id/complete', verifyToken, requireAdmin, validateMongoId('id'), async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    if (transaction.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending transactions can be completed'
      });
    }

    await transaction.complete(req.user._id);

    res.json({
      success: true,
      message: 'Transaction completed successfully',
      data: { transaction }
    });
  } catch (error) {
    console.error('Complete transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while completing transaction'
    });
  }
});

// @route   PUT /api/transactions/:id/fail
// @desc    Fail a pending transaction
// @access  Private/Admin
router.put('/:id/fail', verifyToken, requireAdmin, validateMongoId('id'), async (req, res) => {
  try {
    const { reason } = req.body;
    
    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Failure reason is required'
      });
    }

    const transaction = await Transaction.findById(req.params.id);
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    if (transaction.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending transactions can be failed'
      });
    }

    await transaction.fail(reason, req.user._id);

    res.json({
      success: true,
      message: 'Transaction failed successfully',
      data: { transaction }
    });
  } catch (error) {
    console.error('Fail transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while failing transaction'
    });
  }
});

// @route   PUT /api/transactions/:id/cancel
// @desc    Cancel a pending transaction
// @access  Private/Admin
router.put('/:id/cancel', verifyToken, requireAdmin, validateMongoId('id'), async (req, res) => {
  try {
    const { reason } = req.body;
    
    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Cancellation reason is required'
      });
    }

    const transaction = await Transaction.findById(req.params.id);
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    if (transaction.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending transactions can be cancelled'
      });
    }

    await transaction.cancel(reason, req.user._id);

    res.json({
      success: true,
      message: 'Transaction cancelled successfully',
      data: { transaction }
    });
  } catch (error) {
    console.error('Cancel transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while cancelling transaction'
    });
  }
});

// @route   POST /api/transactions/:id/refund
// @desc    Create a refund transaction
// @access  Private/Admin
router.post('/:id/refund', verifyToken, requireAdmin, validateMongoId('id'), async (req, res) => {
  try {
    const { reason } = req.body;
    
    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Refund reason is required'
      });
    }

    const originalTransaction = await Transaction.findById(req.params.id);
    
    if (!originalTransaction) {
      return res.status(404).json({
        success: false,
        message: 'Original transaction not found'
      });
    }

    if (originalTransaction.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Only completed transactions can be refunded'
      });
    }

    if (originalTransaction.type === 'refund') {
      return res.status(400).json({
        success: false,
        message: 'Cannot refund a refund transaction'
      });
    }

    // Check if already refunded
    const existingRefund = await Transaction.findOne({
      'refundDetails.originalTransactionId': originalTransaction.transactionId
    });

    if (existingRefund) {
      return res.status(400).json({
        success: false,
        message: 'Transaction has already been refunded'
      });
    }

    // Create refund transaction
    const refundTransaction = new Transaction({
      userId: originalTransaction.userId,
      gameId: originalTransaction.gameId,
      cartelaId: originalTransaction.cartelaId,
      type: 'refund',
      amount: originalTransaction.amount,
      description: `Refund for transaction ${originalTransaction.transactionId}: ${reason}`,
      status: 'completed',
      processedBy: req.user._id,
      processedAt: new Date(),
      refundDetails: {
        originalTransactionId: originalTransaction.transactionId,
        refundReason: reason,
        refundedAt: new Date(),
        refundedBy: req.user._id
      }
    });

    await refundTransaction.save();

    // Mark original transaction as refunded
    await originalTransaction.refund(originalTransaction.transactionId, reason, req.user._id);

    await refundTransaction.populate('userId', 'username email profile');
    await refundTransaction.populate('gameId', 'title gameId');
    await refundTransaction.populate('cartelaId', 'cartelaId');

    res.status(201).json({
      success: true,
      message: 'Refund transaction created successfully',
      data: { 
        refundTransaction,
        originalTransaction
      }
    });
  } catch (error) {
    console.error('Create refund transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating refund transaction'
    });
  }
});

// @route   GET /api/transactions/user/:userId
// @desc    Get transactions for a specific user (Admin only)
// @access  Private/Admin
router.get('/user/:userId', verifyToken, requireAdmin, validateMongoId('userId'), validatePagination, async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const transactions = await Transaction.getUserTransactions(userId, limit, (page - 1) * limit);
    const total = await Transaction.countDocuments({ userId });

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

// @route   GET /api/transactions/game/:gameId
// @desc    Get transactions for a specific game (Admin only)
// @access  Private/Admin
router.get('/game/:gameId', verifyToken, requireAdmin, validateMongoId('gameId'), async (req, res) => {
  try {
    const { gameId } = req.params;
    const transactions = await Transaction.getGameTransactions(gameId);

    res.json({
      success: true,
      data: { transactions }
    });
  } catch (error) {
    console.error('Get game transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching game transactions'
    });
  }
});

// @route   GET /api/transactions/export
// @desc    Export transactions to CSV (Admin only)
// @access  Private/Admin
router.get('/export', verifyToken, requireAdmin, validateDateRange, async (req, res) => {
  try {
    const startDate = req.query.startDate ? new Date(req.query.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();
    const type = req.query.type;
    const status = req.query.status;

    const query = {
      createdAt: { $gte: startDate, $lte: endDate }
    };

    if (type) query.type = type;
    if (status) query.status = status;

    const transactions = await Transaction.find(query)
      .populate('userId', 'username email')
      .populate('gameId', 'title gameId')
      .populate('cartelaId', 'cartelaId')
      .sort({ createdAt: -1 });

    // Convert to CSV format
    const csvHeader = 'Transaction ID,User,Email,Game,Cartela,Type,Amount,Currency,Status,Payment Method,Created At,Processed At\n';
    const csvRows = transactions.map(t => {
      return [
        t.transactionId,
        t.userId?.username || 'N/A',
        t.userId?.email || 'N/A',
        t.gameId?.title || 'N/A',
        t.cartelaId?.cartelaId || 'N/A',
        t.type,
        t.amount,
        t.currency,
        t.status,
        t.paymentMethod,
        t.createdAt.toISOString(),
        t.processedAt ? t.processedAt.toISOString() : 'N/A'
      ].join(',');
    }).join('\n');

    const csvContent = csvHeader + csvRows;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=transactions_${startDate.toISOString().split('T')[0]}_to_${endDate.toISOString().split('T')[0]}.csv`);
    res.send(csvContent);
  } catch (error) {
    console.error('Export transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while exporting transactions'
    });
  }
});

module.exports = router;
