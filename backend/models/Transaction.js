const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    required: true,
    unique: true,
    default: () => `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  gameId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Game',
    default: null
  },
  cartelaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cartela',
    default: null
  },
  type: {
    type: String,
    enum: ['purchase', 'prize', 'refund', 'deposit', 'withdrawal'],
    required: [true, 'Transaction type is required']
  },
  amount: {
    type: Number,
    required: [true, 'Transaction amount is required'],
    min: [0.01, 'Transaction amount must be at least 0.01']
  },
  currency: {
    type: String,
    default: 'USD',
    enum: ['USD', 'EUR', 'GBP', 'KES', 'NGN']
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled', 'refunded'],
    default: 'pending'
  },
  description: {
    type: String,
    required: [true, 'Transaction description is required'],
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'debit_card', 'paypal', 'bank_transfer', 'mobile_money', 'cash', 'wallet'],
    default: 'wallet'
  },
  paymentDetails: {
    gateway: {
      type: String,
      default: null
    },
    gatewayTransactionId: {
      type: String,
      default: null
    },
    gatewayResponse: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    }
  },
  balanceBefore: {
    type: Number,
    default: 0
  },
  balanceAfter: {
    type: Number,
    default: 0
  },
  metadata: {
    ipAddress: {
      type: String,
      default: null
    },
    userAgent: {
      type: String,
      default: null
    },
    location: {
      type: String,
      default: null
    },
    deviceInfo: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    }
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  processedAt: {
    type: Date,
    default: null
  },
  failureReason: {
    type: String,
    default: null
  },
  refundDetails: {
    originalTransactionId: {
      type: String,
      default: null
    },
    refundReason: {
      type: String,
      default: null
    },
    refundedAt: {
      type: Date,
      default: null
    },
    refundedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better performance
transactionSchema.index({ transactionId: 1 });
transactionSchema.index({ userId: 1 });
transactionSchema.index({ gameId: 1 });
transactionSchema.index({ type: 1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ createdAt: -1 });
transactionSchema.index({ paymentMethod: 1 });
transactionSchema.index({ 'paymentDetails.gatewayTransactionId': 1 });

// Virtual for formatted amount
transactionSchema.virtual('formattedAmount').get(function() {
  return `${this.currency} ${this.amount.toFixed(2)}`;
});

// Virtual for transaction age
transactionSchema.virtual('age').get(function() {
  const now = new Date();
  const diffMs = now - this.createdAt;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffMinutes > 0) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
  return 'Just now';
});

// Method to complete transaction
transactionSchema.methods.complete = function(processedBy = null) {
  this.status = 'completed';
  this.processedAt = new Date();
  this.processedBy = processedBy;
  this.updatedAt = new Date();
  return this.save();
};

// Method to fail transaction
transactionSchema.methods.fail = function(reason, processedBy = null) {
  this.status = 'failed';
  this.failureReason = reason;
  this.processedAt = new Date();
  this.processedBy = processedBy;
  this.updatedAt = new Date();
  return this.save();
};

// Method to cancel transaction
transactionSchema.methods.cancel = function(reason, processedBy = null) {
  this.status = 'cancelled';
  this.failureReason = reason;
  this.processedAt = new Date();
  this.processedBy = processedBy;
  this.updatedAt = new Date();
  return this.save();
};

// Method to refund transaction
transactionSchema.methods.refund = function(originalTransactionId, reason, refundedBy) {
  this.status = 'refunded';
  this.refundDetails = {
    originalTransactionId,
    refundReason: reason,
    refundedAt: new Date(),
    refundedBy
  };
  this.processedAt = new Date();
  this.processedBy = refundedBy;
  this.updatedAt = new Date();
  return this.save();
};

// Static method to create purchase transaction
transactionSchema.statics.createPurchaseTransaction = function(userId, gameId, cartelaId, amount, description, paymentMethod = 'wallet') {
  return new this({
    userId,
    gameId,
    cartelaId,
    type: 'purchase',
    amount,
    description,
    paymentMethod,
    status: 'pending'
  });
};

// Static method to create prize transaction
transactionSchema.statics.createPrizeTransaction = function(userId, gameId, cartelaId, amount, description) {
  return new this({
    userId,
    gameId,
    cartelaId,
    type: 'prize',
    amount,
    description,
    paymentMethod: 'wallet',
    status: 'completed',
    processedAt: new Date()
  });
};

// Static method to get user transactions
transactionSchema.statics.getUserTransactions = function(userId, limit = 50, offset = 0) {
  return this.find({ userId })
    .populate('gameId', 'title gameId')
    .populate('cartelaId', 'cartelaId')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(offset);
};

// Static method to get game transactions
transactionSchema.statics.getGameTransactions = function(gameId) {
  return this.find({ gameId })
    .populate('userId', 'username email')
    .populate('cartelaId', 'cartelaId')
    .sort({ createdAt: -1 });
};

// Static method to get transaction statistics
transactionSchema.statics.getTransactionStatistics = function(startDate, endDate, type = null) {
  const matchStage = {
    status: 'completed',
    createdAt: {
      $gte: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Default to last 30 days
      $lte: endDate || new Date()
    }
  };

  if (type) {
    matchStage.type = type;
  }

  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$type',
        totalAmount: { $sum: '$amount' },
        totalTransactions: { $sum: 1 },
        averageAmount: { $avg: '$amount' },
        minAmount: { $min: '$amount' },
        maxAmount: { $max: '$amount' }
      }
    },
    { $sort: { totalAmount: -1 } }
  ]);
};

// Static method to get daily transaction summary
transactionSchema.statics.getDailyTransactionSummary = function(days = 30) {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  return this.aggregate([
    {
      $match: {
        status: 'completed',
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' },
          type: '$type'
        },
        totalAmount: { $sum: '$amount' },
        totalTransactions: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: {
          year: '$_id.year',
          month: '$_id.month',
          day: '$_id.day'
        },
        transactions: {
          $push: {
            type: '$_id.type',
            totalAmount: '$totalAmount',
            totalTransactions: '$totalTransactions'
          }
        },
        dailyTotal: { $sum: '$totalAmount' },
        dailyCount: { $sum: '$totalTransactions' }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
  ]);
};

// Pre-save middleware to set balance fields
transactionSchema.pre('save', async function(next) {
  if (this.isNew && this.userId) {
    try {
      // Get user's current balance (this would typically come from a wallet/balance system)
      // For now, we'll calculate from previous transactions
      const lastTransaction = await this.constructor
        .findOne({ userId: this.userId })
        .sort({ createdAt: -1 });
      
      this.balanceBefore = lastTransaction ? lastTransaction.balanceAfter : 0;
      
      // Calculate new balance based on transaction type
      if (this.type === 'purchase' || this.type === 'withdrawal') {
        this.balanceAfter = this.balanceBefore - this.amount;
      } else if (this.type === 'prize' || this.type === 'deposit' || this.type === 'refund') {
        this.balanceAfter = this.balanceBefore + this.amount;
      } else {
        this.balanceAfter = this.balanceBefore;
      }
    } catch (error) {
      return next(error);
    }
  }
  next();
});

module.exports = mongoose.model('Transaction', transactionSchema);
