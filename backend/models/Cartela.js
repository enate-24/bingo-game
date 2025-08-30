const mongoose = require('mongoose');

const cartelaSchema = new mongoose.Schema({
  cartelaId: {
    type: String,
    required: true,
    unique: true,
    default: () => `CARD_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  },
  gameId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Game',
    required: [true, 'Game ID is required']
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  numbers: {
    B: {
      type: [Number],
      required: true,
      validate: {
        validator: function(arr) {
          return arr.length === 5 && arr.every(num => num >= 1 && num <= 15);
        },
        message: 'B column must have 5 numbers between 1-15'
      }
    },
    I: {
      type: [Number],
      required: true,
      validate: {
        validator: function(arr) {
          return arr.length === 5 && arr.every(num => num >= 16 && num <= 30);
        },
        message: 'I column must have 5 numbers between 16-30'
      }
    },
    N: {
      type: [Number],
      required: true,
      validate: {
        validator: function(arr) {
          return arr.length === 4 && arr.every(num => num >= 31 && num <= 45);
        },
        message: 'N column must have 4 numbers between 31-45 (center is free)'
      }
    },
    G: {
      type: [Number],
      required: true,
      validate: {
        validator: function(arr) {
          return arr.length === 5 && arr.every(num => num >= 46 && num <= 60);
        },
        message: 'G column must have 5 numbers between 46-60'
      }
    },
    O: {
      type: [Number],
      required: true,
      validate: {
        validator: function(arr) {
          return arr.length === 5 && arr.every(num => num >= 61 && num <= 75);
        },
        message: 'O column must have 5 numbers between 61-75'
      }
    }
  },
  markedNumbers: {
    type: [Number],
    default: []
  },
  freeSpace: {
    type: Boolean,
    default: true // Center space is always free
  },
  status: {
    type: String,
    enum: ['active', 'winner', 'expired'],
    default: 'active'
  },
  purchasePrice: {
    type: Number,
    required: [true, 'Purchase price is required'],
    min: [0.01, 'Purchase price must be at least 0.01']
  },
  purchasedAt: {
    type: Date,
    default: Date.now
  },
  winningDetails: {
    position: {
      type: String,
      enum: ['1st', '2nd', '3rd', 'consolation'],
      default: null
    },
    prizeAmount: {
      type: Number,
      default: 0
    },
    winningPattern: {
      type: String,
      default: null
    },
    winningNumbers: {
      type: [Number],
      default: []
    },
    verifiedAt: {
      type: Date,
      default: null
    }
  },
  isAutoPlay: {
    type: Boolean,
    default: false
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
cartelaSchema.index({ cartelaId: 1 });
cartelaSchema.index({ gameId: 1 });
cartelaSchema.index({ userId: 1 });
cartelaSchema.index({ status: 1 });
cartelaSchema.index({ purchasedAt: -1 });

// Virtual for all numbers in a flat array
cartelaSchema.virtual('allNumbers').get(function() {
  const allNums = [];
  allNums.push(...this.numbers.B);
  allNums.push(...this.numbers.I);
  allNums.push(...this.numbers.N);
  allNums.push(...this.numbers.G);
  allNums.push(...this.numbers.O);
  return allNums.sort((a, b) => a - b);
});

// Virtual for cartela grid (5x5 matrix)
cartelaSchema.virtual('grid').get(function() {
  const grid = [];
  for (let row = 0; row < 5; row++) {
    const gridRow = [];
    gridRow.push(this.numbers.B[row] || null);
    gridRow.push(this.numbers.I[row] || null);
    
    // Center space (N column, row 2) is free
    if (row === 2) {
      gridRow.push('FREE');
    } else {
      const nIndex = row > 2 ? row - 1 : row;
      gridRow.push(this.numbers.N[nIndex] || null);
    }
    
    gridRow.push(this.numbers.G[row] || null);
    gridRow.push(this.numbers.O[row] || null);
    grid.push(gridRow);
  }
  return grid;
});

// Method to generate random cartela numbers
cartelaSchema.statics.generateRandomNumbers = function() {
  const getRandomNumbers = (min, max, count) => {
    const numbers = [];
    const available = [];
    
    for (let i = min; i <= max; i++) {
      available.push(i);
    }
    
    for (let i = 0; i < count; i++) {
      const randomIndex = Math.floor(Math.random() * available.length);
      numbers.push(available.splice(randomIndex, 1)[0]);
    }
    
    return numbers.sort((a, b) => a - b);
  };

  return {
    B: getRandomNumbers(1, 15, 5),
    I: getRandomNumbers(16, 30, 5),
    N: getRandomNumbers(31, 45, 4), // Only 4 numbers, center is free
    G: getRandomNumbers(46, 60, 5),
    O: getRandomNumbers(61, 75, 5)
  };
};

// Method to mark a number
cartelaSchema.methods.markNumber = function(number) {
  // Check if number exists on this cartela
  const allNumbers = this.allNumbers;
  if (!allNumbers.includes(number)) {
    throw new Error('Number not found on this cartela');
  }

  // Check if already marked
  if (this.markedNumbers.includes(number)) {
    return false; // Already marked
  }

  this.markedNumbers.push(number);
  this.updatedAt = new Date();
  return this.save();
};

// Method to check for winning patterns
cartelaSchema.methods.checkWinningPattern = function(pattern = 'full_house') {
  const grid = this.grid;
  const isMarked = (row, col) => {
    const value = grid[row][col];
    if (value === 'FREE') return true;
    return this.markedNumbers.includes(value);
  };

  switch (pattern) {
    case 'line':
      // Check horizontal lines
      for (let row = 0; row < 5; row++) {
        if (grid[row].every((_, col) => isMarked(row, col))) {
          return { isWinner: true, pattern: 'horizontal_line', line: row };
        }
      }
      
      // Check vertical lines
      for (let col = 0; col < 5; col++) {
        if (grid.every((_, row) => isMarked(row, col))) {
          return { isWinner: true, pattern: 'vertical_line', line: col };
        }
      }
      
      // Check diagonal lines
      if (grid.every((_, i) => isMarked(i, i))) {
        return { isWinner: true, pattern: 'diagonal_line', line: 'main' };
      }
      if (grid.every((_, i) => isMarked(i, 4 - i))) {
        return { isWinner: true, pattern: 'diagonal_line', line: 'anti' };
      }
      break;

    case 'full_house':
      // Check if all numbers are marked
      const allMarked = grid.every((row, rowIndex) => 
        row.every((_, colIndex) => isMarked(rowIndex, colIndex))
      );
      if (allMarked) {
        return { isWinner: true, pattern: 'full_house' };
      }
      break;

    case 'four_corners':
      // Check four corners
      if (isMarked(0, 0) && isMarked(0, 4) && isMarked(4, 0) && isMarked(4, 4)) {
        return { isWinner: true, pattern: 'four_corners' };
      }
      break;

    case 'cross':
      // Check cross pattern (middle row and middle column)
      const middleRowWin = grid[2].every((_, col) => isMarked(2, col));
      const middleColWin = grid.every((_, row) => isMarked(row, 2));
      if (middleRowWin && middleColWin) {
        return { isWinner: true, pattern: 'cross' };
      }
      break;

    default:
      return { isWinner: false };
  }

  return { isWinner: false };
};

// Method to set as winner
cartelaSchema.methods.setAsWinner = function(position, prizeAmount, winningPattern, winningNumbers) {
  this.status = 'winner';
  this.winningDetails = {
    position,
    prizeAmount,
    winningPattern,
    winningNumbers,
    verifiedAt: new Date()
  };
  this.updatedAt = new Date();
  return this.save();
};

// Static method to create multiple cartelas for a user
cartelaSchema.statics.createMultipleCartelas = async function(gameId, userId, quantity, price) {
  const cartelas = [];
  
  for (let i = 0; i < quantity; i++) {
    const numbers = this.generateRandomNumbers();
    const cartela = new this({
      gameId,
      userId,
      numbers,
      purchasePrice: price
    });
    cartelas.push(cartela);
  }
  
  return await this.insertMany(cartelas);
};

// Static method to get user's cartelas for a game
cartelaSchema.statics.getUserCartelasForGame = function(userId, gameId) {
  return this.find({ userId, gameId })
    .populate('gameId', 'title status')
    .sort({ purchasedAt: -1 });
};

// Static method to get winning cartelas for a game
cartelaSchema.statics.getWinningCartelas = function(gameId) {
  return this.find({ gameId, status: 'winner' })
    .populate('userId', 'username email profile')
    .sort({ 'winningDetails.verifiedAt': 1 });
};

// Pre-save middleware to validate unique numbers within each column
cartelaSchema.pre('save', function(next) {
  const columns = ['B', 'I', 'N', 'G', 'O'];
  
  for (const column of columns) {
    const numbers = this.numbers[column];
    const uniqueNumbers = [...new Set(numbers)];
    
    if (numbers.length !== uniqueNumbers.length) {
      return next(new Error(`Duplicate numbers found in column ${column}`));
    }
  }
  
  next();
});

module.exports = mongoose.model('Cartela', cartelaSchema);
