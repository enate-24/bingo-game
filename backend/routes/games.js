const express = require('express');
const Game = require('../models/Game');
const Cartela = require('../models/Cartela');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const { verifyToken, requireAdmin, requireChaser, checkGameAccess } = require('../middleware/auth');
const { 
  validateGameCreation, 
  validateGameUpdate, 
  validateMongoId, 
  validateBingoNumber,
  validatePagination,
  validateDateRange,
  validateGameStatus
} = require('../middleware/validation');

const router = express.Router();

// @route   GET /api/games
// @desc    Get all games
// @access  Public
router.get('/', validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const status = req.query.status;
    const gameType = req.query.gameType;
    const search = req.query.search || '';

    // Build query
    const query = {};
    
    if (status) {
      query.status = status;
    }

    if (gameType) {
      query.gameType = gameType;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const games = await Game.find(query)
      .populate('operator', 'username email')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    const total = await Game.countDocuments(query);

    res.json({
      success: true,
      data: {
        games,
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
    console.error('Get games error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching games'
    });
  }
});

// @route   GET /api/games/active
// @desc    Get active games
// @access  Public
router.get('/active', async (req, res) => {
  try {
    const games = await Game.getActiveGames();

    res.json({
      success: true,
      data: { games }
    });
  } catch (error) {
    console.error('Get active games error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching active games'
    });
  }
});

// @route   GET /api/games/stats
// @desc    Get game statistics
// @access  Private/Admin
router.get('/stats', verifyToken, requireAdmin, validateDateRange, async (req, res) => {
  try {
    const startDate = req.query.startDate ? new Date(req.query.startDate) : null;
    const endDate = req.query.endDate ? new Date(req.query.endDate) : null;

    const stats = await Game.getGameStatistics(startDate, endDate);

    res.json({
      success: true,
      data: { statistics: stats[0] || {} }
    });
  } catch (error) {
    console.error('Get game stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching game statistics'
    });
  }
});

// @route   POST /api/games
// @desc    Create a new game
// @access  Private/Operator
router.post('/', verifyToken, requireChaser, validateGameCreation, async (req, res) => {
  try {
    const gameData = {
      ...req.body,
      operator: req.user._id
    };

    // Set default prizes if not provided
    if (!gameData.prizes || gameData.prizes.length === 0) {
      gameData.prizes = [
        { position: '1st', percentage: 50, amount: 0 },
        { position: '2nd', percentage: 30, amount: 0 },
        { position: '3rd', percentage: 15, amount: 0 },
        { position: 'consolation', percentage: 5, amount: 0 }
      ];
    }

    const game = new Game(gameData);
    await game.save();

    await game.populate('operator', 'username email');

    res.status(201).json({
      success: true,
      message: 'Game created successfully',
      data: { game }
    });
  } catch (error) {
    console.error('Create game error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating game'
    });
  }
});

// @route   GET /api/games/:id
// @desc    Get game by ID
// @access  Public
router.get('/:id', validateMongoId('id'), async (req, res) => {
  try {
    const game = await Game.findById(req.params.id)
      .populate('operator', 'username email')
      .populate('winners.userId', 'username email profile')
      .populate('winners.cartelaId', 'cartelaId');

    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }

    res.json({
      success: true,
      data: { game }
    });
  } catch (error) {
    console.error('Get game error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching game'
    });
  }
});

// @route   PUT /api/games/:id
// @desc    Update game
// @access  Private/Chaser (own games) or Admin
router.put('/:id', verifyToken, validateMongoId('id'), checkGameAccess, validateGameUpdate, async (req, res) => {
  try {
    const updates = req.body;
    const game = req.game;

    // Only allow certain updates based on game status
    if (game.status === 'active') {
      // During active game, only allow limited updates
      const allowedUpdates = ['gameSettings'];
      const updateKeys = Object.keys(updates);
      const hasInvalidUpdate = updateKeys.some(key => !allowedUpdates.includes(key));
      
      if (hasInvalidUpdate) {
        return res.status(400).json({
          success: false,
          message: 'Only game settings can be updated during an active game'
        });
      }
    }

    if (game.status === 'finished') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update a finished game'
      });
    }

    const updatedGame = await Game.findByIdAndUpdate(
      req.params.id,
      { ...updates, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).populate('operator', 'username email');

    res.json({
      success: true,
      message: 'Game updated successfully',
      data: { game: updatedGame }
    });
  } catch (error) {
    console.error('Update game error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating game'
    });
  }
});

// @route   DELETE /api/games/:id
// @desc    Delete game
// @access  Private/Admin
router.delete('/:id', verifyToken, requireAdmin, validateMongoId('id'), async (req, res) => {
  try {
    const game = await Game.findById(req.params.id);
    
    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }

    if (game.status === 'active') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete an active game'
      });
    }

    // Check if there are any cartelas sold for this game
    const cartelaCount = await Cartela.countDocuments({ gameId: req.params.id });
    if (cartelaCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete game with sold cartelas'
      });
    }

    await Game.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Game deleted successfully'
    });
  } catch (error) {
    console.error('Delete game error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting game'
    });
  }
});

// @route   POST /api/games/:id/start
// @desc    Start a game
// @access  Private/Chaser (own games) or Admin
router.post('/:id/start', verifyToken, validateMongoId('id'), checkGameAccess, validateGameStatus(['waiting']), async (req, res) => {
  try {
    const game = req.game;

    // Check if there are any cartelas sold
    const cartelaCount = await Cartela.countDocuments({ gameId: game._id });
    if (cartelaCount === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot start game without any cartelas sold'
      });
    }

    await game.startGame();

    res.json({
      success: true,
      message: 'Game started successfully',
      data: { game }
    });
  } catch (error) {
    console.error('Start game error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while starting game'
    });
  }
});

// @route   POST /api/games/:id/pause
// @desc    Pause a game
// @access  Private/Chaser (own games) or Admin
router.post('/:id/pause', verifyToken, validateMongoId('id'), checkGameAccess, validateGameStatus(['active']), async (req, res) => {
  try {
    const game = req.game;
    game.status = 'paused';
    game.updatedAt = new Date();
    await game.save();

    res.json({
      success: true,
      message: 'Game paused successfully',
      data: { game }
    });
  } catch (error) {
    console.error('Pause game error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while pausing game'
    });
  }
});

// @route   POST /api/games/:id/resume
// @desc    Resume a paused game
// @access  Private/Chaser (own games) or Admin
router.post('/:id/resume', verifyToken, validateMongoId('id'), checkGameAccess, validateGameStatus(['paused']), async (req, res) => {
  try {
    const game = req.game;
    game.status = 'active';
    game.updatedAt = new Date();
    await game.save();

    res.json({
      success: true,
      message: 'Game resumed successfully',
      data: { game }
    });
  } catch (error) {
    console.error('Resume game error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while resuming game'
    });
  }
});

// @route   POST /api/games/:id/end
// @desc    End a game
// @access  Private/Chaser (own games) or Admin
router.post('/:id/end', verifyToken, validateMongoId('id'), checkGameAccess, validateGameStatus(['active', 'paused']), async (req, res) => {
  try {
    const game = req.game;
    
    await game.endGame();
    await game.calculateStatistics();

    res.json({
      success: true,
      message: 'Game ended successfully',
      data: { game }
    });
  } catch (error) {
    console.error('End game error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while ending game'
    });
  }
});

// @route   POST /api/games/:id/draw-number
// @desc    Draw a bingo number
// @access  Private/Chaser (own games) or Admin
router.post('/:id/draw-number', verifyToken, validateMongoId('id'), checkGameAccess, validateGameStatus(['active']), validateBingoNumber, async (req, res) => {
  try {
    const { number } = req.body;
    const game = req.game;

    await game.drawNumber(number);

    // Check for winners after drawing number
    const cartelas = await Cartela.find({ gameId: game._id, status: 'active' });
    const winners = [];

    for (const cartela of cartelas) {
      // Mark the number if it exists on the cartela
      if (cartela.allNumbers.includes(number)) {
        await cartela.markNumber(number);
      }

      // Check for winning pattern
      const winResult = cartela.checkWinningPattern(game.winningPattern);
      if (winResult.isWinner) {
        winners.push({
          cartelaId: cartela._id,
          userId: cartela.userId,
          pattern: winResult.pattern
        });
      }
    }

    res.json({
      success: true,
      message: `Number ${number} drawn successfully`,
      data: { 
        game,
        drawnNumber: {
          number,
          ballLetter: number >= 1 && number <= 15 ? 'B' :
                     number >= 16 && number <= 30 ? 'I' :
                     number >= 31 && number <= 45 ? 'N' :
                     number >= 46 && number <= 60 ? 'G' : 'O'
        },
        winners: winners.length > 0 ? winners : null
      }
    });
  } catch (error) {
    console.error('Draw number error:', error);
    
    if (error.message === 'Number already drawn') {
      return res.status(400).json({
        success: false,
        message: 'This number has already been drawn'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while drawing number'
    });
  }
});

// @route   POST /api/games/:id/verify-winner
// @desc    Verify a winner
// @access  Private/Chaser (own games) or Admin
router.post('/:id/verify-winner', verifyToken, validateMongoId('id'), checkGameAccess, async (req, res) => {
  try {
    const { cartelaId, position, prizeAmount } = req.body;
    const game = req.game;

    if (!cartelaId || !position || !prizeAmount) {
      return res.status(400).json({
        success: false,
        message: 'Cartela ID, position, and prize amount are required'
      });
    }

    const cartela = await Cartela.findById(cartelaId);
    if (!cartela) {
      return res.status(404).json({
        success: false,
        message: 'Cartela not found'
      });
    }

    if (cartela.gameId.toString() !== game._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cartela does not belong to this game'
      });
    }

    // Verify the winning pattern
    const winResult = cartela.checkWinningPattern(game.winningPattern);
    if (!winResult.isWinner) {
      return res.status(400).json({
        success: false,
        message: 'Cartela does not have a winning pattern'
      });
    }

    // Set cartela as winner
    await cartela.setAsWinner(position, prizeAmount, winResult.pattern, cartela.markedNumbers);

    // Add winner to game
    await game.addWinner(cartela.userId, cartelaId, position, prizeAmount, cartela.markedNumbers);

    // Create prize transaction
    const transaction = Transaction.createPrizeTransaction(
      cartela.userId,
      game._id,
      cartelaId,
      prizeAmount,
      `Prize for ${position} place in game: ${game.title}`
    );
    await transaction.save();

    // Update user game stats
    const user = await User.findById(cartela.userId);
    if (user) {
      user.updateGameStats({ win: prizeAmount });
      await user.save();
    }

    res.json({
      success: true,
      message: 'Winner verified successfully',
      data: { 
        cartela,
        transaction
      }
    });
  } catch (error) {
    console.error('Verify winner error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while verifying winner'
    });
  }
});

// @route   GET /api/games/:id/cartelas
// @desc    Get all cartelas for a game
// @access  Private/Chaser (own games) or Admin
router.get('/:id/cartelas', verifyToken, validateMongoId('id'), checkGameAccess, validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const cartelas = await Cartela.find({ gameId: req.params.id })
      .populate('userId', 'username email profile')
      .sort({ purchasedAt: -1 })
      .limit(limit)
      .skip(skip);

    const total = await Cartela.countDocuments({ gameId: req.params.id });

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
    console.error('Get game cartelas error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching game cartelas'
    });
  }
});

// @route   GET /api/games/:id/winners
// @desc    Get winners for a game
// @access  Public
router.get('/:id/winners', validateMongoId('id'), async (req, res) => {
  try {
    const winners = await Cartela.getWinningCartelas(req.params.id);

    res.json({
      success: true,
      data: { winners }
    });
  } catch (error) {
    console.error('Get game winners error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching game winners'
    });
  }
});

// @route   GET /api/games/:id/transactions
// @desc    Get transactions for a game
// @access  Private/Chaser (own games) or Admin
router.get('/:id/transactions', verifyToken, validateMongoId('id'), checkGameAccess, async (req, res) => {
  try {
    const transactions = await Transaction.getGameTransactions(req.params.id);

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

module.exports = router;