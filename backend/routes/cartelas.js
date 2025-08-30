const express = require('express');
const Cartela = require('../models/Cartela');
const Game = require('../models/Game');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const { verifyToken } = require('../middleware/auth');
const { 
  validateCartelaPurchase, 
  validateCartelaNumbers, 
  validateMongoId, 
  validatePagination,
  validateCartelaOwnership
} = require('../middleware/validation');

const router = express.Router();

// @route   POST /api/cartelas/purchase
// @desc    Purchase cartelas for a game
// @access  Private
router.post('/purchase', verifyToken, validateCartelaPurchase, async (req, res) => {
  try {
    const { gameId, quantity, paymentMethod } = req.body;
    const userId = req.user._id;

    // Check if game exists and is available for purchase
    const game = await Game.findById(gameId);
    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }

    if (game.status !== 'waiting') {
      return res.status(400).json({
        success: false,
        message: 'Cannot purchase cartelas for this game. Game must be in waiting status.'
      });
    }

    // Check if user already has maximum cartelas for this game
    const userCartelaCount = await Cartela.countDocuments({ gameId, userId });
    const maxCartelas = game.gameSettings.maxCartelasPerPlayer;
    
    if (userCartelaCount + quantity > maxCartelas) {
      return res.status(400).json({
        success: false,
        message: `Cannot purchase ${quantity} cartelas. Maximum ${maxCartelas} cartelas per player. You already have ${userCartelaCount}.`
      });
    }

    // Check if game has space for more players
    if (game.currentPlayers >= game.maxPlayers) {
      return res.status(400).json({
        success: false,
        message: 'Game is full. Cannot purchase more cartelas.'
      });
    }

    const totalCost = quantity * game.cartelaPrice;

    // Create purchase transaction
    const transaction = Transaction.createPurchaseTransaction(
      userId,
      gameId,
      null, // Will be updated after cartela creation
      totalCost,
      `Purchase of ${quantity} cartela${quantity > 1 ? 's' : ''} for game: ${game.title}`,
      paymentMethod
    );

    // In a real application, you would process payment here
    // For now, we'll assume payment is successful
    await transaction.complete();

    // Create cartelas
    const cartelas = await Cartela.createMultipleCartelas(gameId, userId, quantity, game.cartelaPrice);

    // Update transaction with cartela references
    for (let i = 0; i < cartelas.length; i++) {
      if (i === 0) {
        // Update the main transaction with the first cartela
        transaction.cartelaId = cartelas[i]._id;
        await transaction.save();
      } else {
        // Create additional transactions for other cartelas
        const additionalTransaction = Transaction.createPurchaseTransaction(
          userId,
          gameId,
          cartelas[i]._id,
          game.cartelaPrice,
          `Purchase of cartela for game: ${game.title}`,
          paymentMethod
        );
        await additionalTransaction.complete();
      }
    }

    // Update game statistics
    game.currentPlayers = await Cartela.distinct('userId', { gameId }).then(users => users.length);
    game.statistics.totalCartelasSold += quantity;
    game.statistics.totalRevenue += totalCost;
    game.prizePool += totalCost;
    
    // Calculate prize amounts based on percentages
    game.prizes.forEach(prize => {
      prize.amount = (game.prizePool * prize.percentage) / 100;
    });

    await game.save();

    // Update user game stats
    req.user.updateGameStats({ bet: totalCost });
    await req.user.save();

    res.status(201).json({
      success: true,
      message: `Successfully purchased ${quantity} cartela${quantity > 1 ? 's' : ''}`,
      data: {
        cartelas,
        transaction: {
          id: transaction._id,
          amount: totalCost,
          status: transaction.status
        },
        game: {
          id: game._id,
          title: game.title,
          prizePool: game.prizePool,
          currentPlayers: game.currentPlayers
        }
      }
    });
  } catch (error) {
    console.error('Purchase cartelas error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while purchasing cartelas'
    });
  }
});

// @route   POST /api/cartelas/custom
// @desc    Create a custom cartela with specific numbers
// @access  Private
router.post('/custom', verifyToken, validateCartelaNumbers, async (req, res) => {
  try {
    const { gameId, numbers } = req.body;
    const userId = req.user._id;

    // Check if game exists and allows custom cartelas
    const game = await Game.findById(gameId);
    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }

    if (game.status !== 'waiting') {
      return res.status(400).json({
        success: false,
        message: 'Cannot create cartelas for this game. Game must be in waiting status.'
      });
    }

    // Check if user already has maximum cartelas for this game
    const userCartelaCount = await Cartela.countDocuments({ gameId, userId });
    const maxCartelas = game.gameSettings.maxCartelasPerPlayer;
    
    if (userCartelaCount >= maxCartelas) {
      return res.status(400).json({
        success: false,
        message: `Cannot create more cartelas. Maximum ${maxCartelas} cartelas per player.`
      });
    }

    // Validate that numbers are unique within each column
    const columns = ['B', 'I', 'N', 'G', 'O'];
    for (const column of columns) {
      const columnNumbers = numbers[column];
      const uniqueNumbers = [...new Set(columnNumbers)];
      
      if (columnNumbers.length !== uniqueNumbers.length) {
        return res.status(400).json({
          success: false,
          message: `Duplicate numbers found in column ${column}`
        });
      }
    }

    // Create custom cartela
    const cartela = new Cartela({
      gameId,
      userId,
      numbers,
      purchasePrice: game.cartelaPrice
    });

    await cartela.save();

    // Create purchase transaction
    const transaction = Transaction.createPurchaseTransaction(
      userId,
      gameId,
      cartela._id,
      game.cartelaPrice,
      `Purchase of custom cartela for game: ${game.title}`
    );
    await transaction.complete();

    // Update game statistics
    game.currentPlayers = await Cartela.distinct('userId', { gameId }).then(users => users.length);
    game.statistics.totalCartelasSold += 1;
    game.statistics.totalRevenue += game.cartelaPrice;
    game.prizePool += game.cartelaPrice;
    
    // Calculate prize amounts based on percentages
    game.prizes.forEach(prize => {
      prize.amount = (game.prizePool * prize.percentage) / 100;
    });

    await game.save();

    // Update user game stats
    req.user.updateGameStats({ bet: game.cartelaPrice });
    await req.user.save();

    res.status(201).json({
      success: true,
      message: 'Custom cartela created successfully',
      data: {
        cartela,
        transaction: {
          id: transaction._id,
          amount: game.cartelaPrice,
          status: transaction.status
        }
      }
    });
  } catch (error) {
    console.error('Create custom cartela error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating custom cartela'
    });
  }
});

// @route   GET /api/cartelas
// @desc    Get user's cartelas
// @access  Private
router.get('/', verifyToken, validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const gameId = req.query.gameId;
    const status = req.query.status;

    const query = { userId: req.user._id };
    
    if (gameId) query.gameId = gameId;
    if (status) query.status = status;

    const cartelas = await Cartela.find(query)
      .populate('gameId', 'title status gameType cartelaPrice')
      .sort({ purchasedAt: -1 })
      .limit(limit)
      .skip(skip);

    const total = await Cartela.countDocuments(query);

    res.json({
      success: true,
      data: {
        cartelas,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalCartelas: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get cartelas error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching cartelas'
    });
  }
});

// @route   GET /api/cartelas/:id
// @desc    Get cartela by ID
// @access  Private (own cartelas only)
router.get('/:id', verifyToken, validateMongoId('id'), validateCartelaOwnership, async (req, res) => {
  try {
    const cartela = req.cartela;
    await cartela.populate('gameId', 'title status gameType winningPattern drawnNumbers');
    await cartela.populate('userId', 'username email profile');

    res.json({
      success: true,
      data: { cartela }
    });
  } catch (error) {
    console.error('Get cartela error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching cartela'
    });
  }
});

// @route   PUT /api/cartelas/:id/mark
// @desc    Mark a number on cartela (for manual play)
// @access  Private (own cartelas only)
router.put('/:id/mark', verifyToken, validateMongoId('id'), validateCartelaOwnership, async (req, res) => {
  try {
    const { number } = req.body;
    const cartela = req.cartela;

    if (!number || number < 1 || number > 75) {
      return res.status(400).json({
        success: false,
        message: 'Invalid number. Must be between 1 and 75.'
      });
    }

    // Check if the game is active
    const game = await Game.findById(cartela.gameId);
    if (!game || game.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Cannot mark numbers. Game is not active.'
      });
    }

    // Check if the number has been drawn
    const isNumberDrawn = game.drawnNumbers.some(drawn => drawn.number === number);
    if (!isNumberDrawn) {
      return res.status(400).json({
        success: false,
        message: 'This number has not been drawn yet.'
      });
    }

    // Mark the number
    const result = await cartela.markNumber(number);
    
    if (result === false) {
      return res.status(400).json({
        success: false,
        message: 'Number already marked on this cartela.'
      });
    }

    // Check for winning pattern
    const winResult = cartela.checkWinningPattern(game.winningPattern);

    res.json({
      success: true,
      message: `Number ${number} marked successfully`,
      data: {
        cartela,
        isWinner: winResult.isWinner,
        winningPattern: winResult.isWinner ? winResult.pattern : null
      }
    });
  } catch (error) {
    console.error('Mark cartela number error:', error);
    
    if (error.message === 'Number not found on this cartela') {
      return res.status(400).json({
        success: false,
        message: 'This number is not on your cartela.'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while marking number'
    });
  }
});

// @route   PUT /api/cartelas/:id/auto-play
// @desc    Toggle auto-play for cartela
// @access  Private (own cartelas only)
router.put('/:id/auto-play', verifyToken, validateMongoId('id'), validateCartelaOwnership, async (req, res) => {
  try {
    const { isAutoPlay } = req.body;
    const cartela = req.cartela;

    if (typeof isAutoPlay !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isAutoPlay must be a boolean value.'
      });
    }

    cartela.isAutoPlay = isAutoPlay;
    cartela.updatedAt = new Date();
    await cartela.save();

    res.json({
      success: true,
      message: `Auto-play ${isAutoPlay ? 'enabled' : 'disabled'} for cartela`,
      data: { cartela }
    });
  } catch (error) {
    console.error('Toggle auto-play error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while toggling auto-play'
    });
  }
});

// @route   GET /api/cartelas/:id/check-winner
// @desc    Check if cartela is a winner
// @access  Private (own cartelas only)
router.get('/:id/check-winner', verifyToken, validateMongoId('id'), validateCartelaOwnership, async (req, res) => {
  try {
    const cartela = req.cartela;
    const game = await Game.findById(cartela.gameId);

    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }

    const winResult = cartela.checkWinningPattern(game.winningPattern);

    res.json({
      success: true,
      data: {
        isWinner: winResult.isWinner,
        winningPattern: winResult.isWinner ? winResult.pattern : null,
        gamePattern: game.winningPattern,
        markedNumbers: cartela.markedNumbers,
        totalMarked: cartela.markedNumbers.length
      }
    });
  } catch (error) {
    console.error('Check winner error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while checking winner status'
    });
  }
});

// @route   GET /api/cartelas/game/:gameId
// @desc    Get user's cartelas for a specific game
// @access  Private
router.get('/game/:gameId', verifyToken, validateMongoId('gameId'), async (req, res) => {
  try {
    const { gameId } = req.params;
    const userId = req.user._id;

    const cartelas = await Cartela.getUserCartelasForGame(userId, gameId);

    res.json({
      success: true,
      data: { cartelas }
    });
  } catch (error) {
    console.error('Get user cartelas for game error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching cartelas for game'
    });
  }
});

// @route   DELETE /api/cartelas/:id
// @desc    Cancel/refund cartela (only before game starts)
// @access  Private (own cartelas only)
router.delete('/:id', verifyToken, validateMongoId('id'), validateCartelaOwnership, async (req, res) => {
  try {
    const cartela = req.cartela;
    const game = await Game.findById(cartela.gameId);

    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }

    if (game.status !== 'waiting') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel cartela. Game has already started or finished.'
      });
    }

    // Create refund transaction
    const refundTransaction = new Transaction({
      userId: cartela.userId,
      gameId: cartela.gameId,
      cartelaId: cartela._id,
      type: 'refund',
      amount: cartela.purchasePrice,
      description: `Refund for cancelled cartela in game: ${game.title}`,
      status: 'completed',
      processedAt: new Date()
    });
    await refundTransaction.save();

    // Update game statistics
    game.statistics.totalCartelasSold -= 1;
    game.statistics.totalRevenue -= cartela.purchasePrice;
    game.prizePool -= cartela.purchasePrice;
    
    // Recalculate prize amounts
    game.prizes.forEach(prize => {
      prize.amount = (game.prizePool * prize.percentage) / 100;
    });

    // Update current players count
    await Cartela.findByIdAndDelete(cartela._id);
    game.currentPlayers = await Cartela.distinct('userId', { gameId }).then(users => users.length);
    
    await game.save();

    // Update user game stats
    req.user.gameStats.totalBet -= cartela.purchasePrice;
    await req.user.save();

    res.json({
      success: true,
      message: 'Cartela cancelled and refunded successfully',
      data: {
        refundTransaction: {
          id: refundTransaction._id,
          amount: refundTransaction.amount,
          status: refundTransaction.status
        }
      }
    });
  } catch (error) {
    console.error('Cancel cartela error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while cancelling cartela'
    });
  }
});

// @route   GET /api/cartelas/stats/summary
// @desc    Get user's cartela statistics summary
// @access  Private
router.get('/stats/summary', verifyToken, async (req, res) => {
  try {
    const userId = req.user._id;

    const stats = await Cartela.aggregate([
      { $match: { userId: userId } },
      {
        $group: {
          _id: null,
          totalCartelas: { $sum: 1 },
          totalSpent: { $sum: '$purchasePrice' },
          winningCartelas: {
            $sum: { $cond: [{ $eq: ['$status', 'winner'] }, 1, 0] }
          },
          totalWinnings: { $sum: '$winningDetails.prizeAmount' }
        }
      }
    ]);

    const result = stats[0] || {
      totalCartelas: 0,
      totalSpent: 0,
      winningCartelas: 0,
      totalWinnings: 0
    };

    result.winRate = result.totalCartelas > 0 ? 
      ((result.winningCartelas / result.totalCartelas) * 100).toFixed(2) : 0;
    result.netProfit = result.totalWinnings - result.totalSpent;

    res.json({
      success: true,
      data: { statistics: result }
    });
  } catch (error) {
    console.error('Get cartela stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching cartela statistics'
    });
  }
});

module.exports = router;
