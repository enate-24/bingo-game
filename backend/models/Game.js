const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
  gameId: {
    type: String,
    required: true,
    unique: true,
    default: () => `GAME_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  },
  title: {
    type: String,
    required: [true, 'Game title is required'],
    trim: true,
    maxlength: [100, 'Game title cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Game description cannot exceed 500 characters']
  },
  gameType: {
    type: String,
    enum: ['traditional', 'speed', 'pattern', 'blackout'],
    default: 'traditional'
  },
  status: {
    type: String,
    enum: ['waiting', 'active', 'paused', 'finished', 'cancelled'],
    default: 'waiting'
  },
  maxPlayers: {
    type: Number,
    default: 100,
    min: [1, 'Maximum players must be at least 1'],
    max: [500, 'Maximum players cannot exceed 500']
  },
  currentPlayers: {
    type: Number,
    default: 0
  },
  cartelaPrice: {
    type: Number,
    required: [true, 'Cartela price is required'],
    min: [0.01, 'Cartela price must be at least 0.01']
  },
  prizePool: {
    type: Number,
    default: 0
  },
  prizes: [{
    position: {
      type: String,
      enum: ['1st', '2nd', '3rd', 'consolation'],
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    percentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    }
  }],
  drawnNumbers: [{
    number: {
      type: Number,
      required: true,
      min: 1,
      max: 75
    },
    drawnAt: {
      type: Date,
      default: Date.now
    },
    ballLetter: {
      type: String,
      enum: ['B', 'I', 'N', 'G', 'O'],
      required: true
    }
  }],
  winningPattern: {
    type: String,
    enum: ['line', 'full_house', 'four_corners', 'cross', 'custom'],
    default: 'full_house'
  },
  customPattern: {
    type: [[Boolean]], // 5x5 grid for custom patterns
    default: null
  },
  winners: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    cartelaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cartela',
      required: true
    },
    position: {
      type: String,
      enum: ['1st', '2nd', '3rd', 'consolation'],
      required: true
    },
    prizeAmount: {
      type: Number,
      required: true
    },
    winningNumbers: [Number],
    verifiedAt: {
      type: Date,
      default: Date.now
    }
  }],
  gameSettings: {
    autoCallInterval: {
      type: Number,
      default: 5000, // milliseconds
      min: 1000,
      max: 30000
    },
    allowLateBuying: {
      type: Boolean,
      default: false
    },
    maxCartelasPerPlayer: {
      type: Number,
      default: 10,
      min: 1,
      max: 50
    }
  },
  operator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  scheduledStartTime: {
    type: Date,
    default: null
  },
  actualStartTime: {
    type: Date,
    default: null
  },
  endTime: {
    type: Date,
    default: null
  },
  duration: {
    type: Number, // in minutes
    default: null
  },
  statistics: {
    totalCartelasSold: {
      type: Number,
      default: 0
    },
    totalRevenue: {
      type: Number,
      default: 0
    },
    totalPrizesAwarded: {
      type: Number,
      default: 0
    },
    houseProfit: {
      type: Number,
      default: 0
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
gameSchema.index({ gameId: 1 });
gameSchema.index({ status: 1 });
gameSchema.index({ operator: 1 });
gameSchema.index({ scheduledStartTime: 1 });
gameSchema.index({ createdAt: -1 });

// Virtual for game duration in human readable format
gameSchema.virtual('formattedDuration').get(function() {
  if (!this.duration) return null;
  const hours = Math.floor(this.duration / 60);
  const minutes = this.duration % 60;
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
});

// Method to start the game
gameSchema.methods.startGame = function() {
  this.status = 'active';
  this.actualStartTime = new Date();
  this.updatedAt = new Date();
  return this.save();
};

// Method to end the game
gameSchema.methods.endGame = function() {
  this.status = 'finished';
  this.endTime = new Date();
  if (this.actualStartTime) {
    this.duration = Math.round((this.endTime - this.actualStartTime) / (1000 * 60));
  }
  this.updatedAt = new Date();
  return this.save();
};

// Method to draw a number
gameSchema.methods.drawNumber = function(number) {
  // Determine the ball letter based on number range
  let ballLetter;
  if (number >= 1 && number <= 15) ballLetter = 'B';
  else if (number >= 16 && number <= 30) ballLetter = 'I';
  else if (number >= 31 && number <= 45) ballLetter = 'N';
  else if (number >= 46 && number <= 60) ballLetter = 'G';
  else if (number >= 61 && number <= 75) ballLetter = 'O';
  else throw new Error('Invalid bingo number');

  // Check if number already drawn
  if (this.drawnNumbers.some(drawn => drawn.number === number)) {
    throw new Error('Number already drawn');
  }

  this.drawnNumbers.push({
    number,
    ballLetter,
    drawnAt: new Date()
  });

  this.updatedAt = new Date();
  return this.save();
};

// Method to add winner
gameSchema.methods.addWinner = function(userId, cartelaId, position, prizeAmount, winningNumbers) {
  this.winners.push({
    userId,
    cartelaId,
    position,
    prizeAmount,
    winningNumbers,
    verifiedAt: new Date()
  });

  this.statistics.totalPrizesAwarded += prizeAmount;
  this.updatedAt = new Date();
  return this.save();
};

// Method to calculate statistics
gameSchema.methods.calculateStatistics = function() {
  this.statistics.houseProfit = this.statistics.totalRevenue - this.statistics.totalPrizesAwarded;
  this.updatedAt = new Date();
  return this.save();
};

// Static method to get active games
gameSchema.statics.getActiveGames = function() {
  return this.find({ status: { $in: ['waiting', 'active', 'paused'] } })
    .populate('operator', 'username email')
    .sort({ createdAt: -1 });
};

// Static method to get game statistics
gameSchema.statics.getGameStatistics = function(startDate, endDate) {
  const matchStage = {
    status: 'finished',
    createdAt: {
      $gte: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Default to last 30 days
      $lte: endDate || new Date()
    }
  };

  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalGames: { $sum: 1 },
        totalRevenue: { $sum: '$statistics.totalRevenue' },
        totalPrizesAwarded: { $sum: '$statistics.totalPrizesAwarded' },
        totalHouseProfit: { $sum: '$statistics.houseProfit' },
        averageGameDuration: { $avg: '$duration' },
        totalCartelasSold: { $sum: '$statistics.totalCartelasSold' }
      }
    }
  ]);
};

module.exports = mongoose.model('Game', gameSchema);
