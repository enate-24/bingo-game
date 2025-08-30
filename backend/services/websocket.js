const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Game = require('../models/Game');
const Cartela = require('../models/Cartela');

class WebSocketService {
  constructor(server) {
    this.io = socketIo(server, {
      cors: {
        origin: process.env.CLIENT_URL || "http://localhost:3001",
        methods: ["GET", "POST"],
        credentials: true
      }
    });

    this.gameRooms = new Map(); // gameId -> Set of socketIds
    this.userSockets = new Map(); // userId -> socketId
    this.socketUsers = new Map(); // socketId -> userId

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  setupMiddleware() {
    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
        
        if (!token) {
          return next(new Error('Authentication error: No token provided'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        
        if (!user) {
          return next(new Error('Authentication error: User not found'));
        }

        socket.userId = user._id.toString();
        socket.user = user;
        next();
      } catch (error) {
        next(new Error('Authentication error: Invalid token'));
      }
    });
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`User ${socket.user.username} connected: ${socket.id}`);
      
      // Store user-socket mapping
      this.userSockets.set(socket.userId, socket.id);
      this.socketUsers.set(socket.id, socket.userId);

      // Join user to their personal room for notifications
      socket.join(`user:${socket.userId}`);

      // Handle game room joining
      socket.on('join-game', async (gameId) => {
        try {
          const game = await Game.findById(gameId);
          if (!game) {
            socket.emit('error', { message: 'Game not found' });
            return;
          }

          // Check if user has cartelas for this game
          const userCartelas = await Cartela.find({ gameId, userId: socket.userId });
          if (userCartelas.length === 0 && socket.user.role !== 'admin') {
            socket.emit('error', { message: 'You must have cartelas to join this game' });
            return;
          }

          socket.join(`game:${gameId}`);
          
          if (!this.gameRooms.has(gameId)) {
            this.gameRooms.set(gameId, new Set());
          }
          this.gameRooms.get(gameId).add(socket.id);

          socket.emit('joined-game', { 
            gameId, 
            game: game.toObject(),
            userCartelas 
          });

          // Notify others in the game room
          socket.to(`game:${gameId}`).emit('player-joined', {
            userId: socket.userId,
            username: socket.user.username
          });

          console.log(`User ${socket.user.username} joined game ${gameId}`);
        } catch (error) {
          console.error('Join game error:', error);
          socket.emit('error', { message: 'Failed to join game' });
        }
      });

      // Handle leaving game room
      socket.on('leave-game', (gameId) => {
        socket.leave(`game:${gameId}`);
        
        if (this.gameRooms.has(gameId)) {
          this.gameRooms.get(gameId).delete(socket.id);
          if (this.gameRooms.get(gameId).size === 0) {
            this.gameRooms.delete(gameId);
          }
        }

        socket.to(`game:${gameId}`).emit('player-left', {
          userId: socket.userId,
          username: socket.user.username
        });

        console.log(`User ${socket.user.username} left game ${gameId}`);
      });

      // Handle cartela marking (for manual play)
      socket.on('mark-number', async (data) => {
        try {
          const { cartelaId, number } = data;
          
          const cartela = await Cartela.findById(cartelaId);
          if (!cartela || cartela.userId.toString() !== socket.userId) {
            socket.emit('error', { message: 'Cartela not found or access denied' });
            return;
          }

          const game = await Game.findById(cartela.gameId);
          if (!game || game.status !== 'active') {
            socket.emit('error', { message: 'Game is not active' });
            return;
          }

          // Check if number was drawn
          const isNumberDrawn = game.drawnNumbers.some(drawn => drawn.number === number);
          if (!isNumberDrawn) {
            socket.emit('error', { message: 'Number has not been drawn yet' });
            return;
          }

          // Mark the number
          const result = await cartela.markNumber(number);
          if (result === false) {
            socket.emit('error', { message: 'Number already marked' });
            return;
          }

          // Check for winning pattern
          const winResult = cartela.checkWinningPattern(game.winningPattern);

          socket.emit('number-marked', {
            cartelaId,
            number,
            markedNumbers: cartela.markedNumbers,
            isWinner: winResult.isWinner
          });

          // If winner, notify the game room
          if (winResult.isWinner) {
            this.io.to(`game:${cartela.gameId}`).emit('winner-declared', {
              userId: socket.userId,
              username: socket.user.username,
              cartelaId,
              winningPattern: winResult.pattern
            });
          }
        } catch (error) {
          console.error('Mark number error:', error);
          socket.emit('error', { message: 'Failed to mark number' });
        }
      });

      // Handle chat messages in game room
      socket.on('game-chat', (data) => {
        const { gameId, message } = data;
        
        if (!message || message.trim().length === 0) {
          return;
        }

        const chatMessage = {
          userId: socket.userId,
          username: socket.user.username,
          message: message.trim(),
          timestamp: new Date()
        };

        this.io.to(`game:${gameId}`).emit('game-chat', chatMessage);
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        console.log(`User ${socket.user.username} disconnected: ${socket.id}`);
        
        // Clean up mappings
        this.userSockets.delete(socket.userId);
        this.socketUsers.delete(socket.id);

        // Remove from all game rooms
        for (const [gameId, sockets] of this.gameRooms.entries()) {
          if (sockets.has(socket.id)) {
            sockets.delete(socket.id);
            socket.to(`game:${gameId}`).emit('player-left', {
              userId: socket.userId,
              username: socket.user.username
            });
            
            if (sockets.size === 0) {
              this.gameRooms.delete(gameId);
            }
          }
        }
      });
    });
  }

  // Broadcast game updates
  broadcastGameUpdate(gameId, updateType, data) {
    this.io.to(`game:${gameId}`).emit('game-update', {
      type: updateType,
      data,
      timestamp: new Date()
    });
  }

  // Broadcast number draw
  broadcastNumberDraw(gameId, drawnNumber) {
    this.io.to(`game:${gameId}`).emit('number-drawn', {
      number: drawnNumber.number,
      letter: drawnNumber.letter,
      timestamp: drawnNumber.timestamp,
      totalDrawn: drawnNumber.sequence
    });
  }

  // Broadcast game status change
  broadcastGameStatusChange(gameId, status, data = {}) {
    this.io.to(`game:${gameId}`).emit('game-status-changed', {
      gameId,
      status,
      ...data,
      timestamp: new Date()
    });
  }

  // Send notification to specific user
  sendUserNotification(userId, notification) {
    this.io.to(`user:${userId}`).emit('notification', {
      ...notification,
      timestamp: new Date()
    });
  }

  // Send notification to all users
  broadcastNotification(notification) {
    this.io.emit('notification', {
      ...notification,
      timestamp: new Date()
    });
  }

  // Get connected users count for a game
  getGamePlayersCount(gameId) {
    return this.gameRooms.get(gameId)?.size || 0;
  }

  // Get all connected users
  getConnectedUsersCount() {
    return this.userSockets.size;
  }

  // Check if user is online
  isUserOnline(userId) {
    return this.userSockets.has(userId.toString());
  }

  // Broadcast winner announcement
  broadcastWinner(gameId, winnerData) {
    this.io.to(`game:${gameId}`).emit('winner-announced', {
      ...winnerData,
      timestamp: new Date()
    });
  }

  // Broadcast game finished
  broadcastGameFinished(gameId, gameResults) {
    this.io.to(`game:${gameId}`).emit('game-finished', {
      gameId,
      results: gameResults,
      timestamp: new Date()
    });
  }

  // Auto-mark numbers for cartelas with auto-play enabled
  async autoMarkNumbers(gameId, drawnNumber) {
    try {
      const autoPlayCartelas = await Cartela.find({
        gameId,
        isAutoPlay: true,
        status: 'active'
      }).populate('userId', 'username');

      for (const cartela of autoPlayCartelas) {
        // Check if the cartela has this number
        const hasNumber = this.cartelaHasNumber(cartela.numbers, drawnNumber.number);
        
        if (hasNumber && !cartela.markedNumbers.includes(drawnNumber.number)) {
          // Mark the number
          await cartela.markNumber(drawnNumber.number);
          
          // Check for winning pattern
          const game = await Game.findById(gameId);
          const winResult = cartela.checkWinningPattern(game.winningPattern);

          // Notify the user
          this.sendUserNotification(cartela.userId._id, {
            type: 'number_auto_marked',
            message: `Number ${drawnNumber.number} auto-marked on your cartela`,
            data: {
              cartelaId: cartela._id,
              number: drawnNumber.number,
              isWinner: winResult.isWinner
            }
          });

          // If winner, broadcast to game room
          if (winResult.isWinner) {
            this.broadcastWinner(gameId, {
              userId: cartela.userId._id,
              username: cartela.userId.username,
              cartelaId: cartela._id,
              winningPattern: winResult.pattern,
              isAutoPlay: true
            });
          }
        }
      }
    } catch (error) {
      console.error('Auto mark numbers error:', error);
    }
  }

  // Helper method to check if cartela has a specific number
  cartelaHasNumber(cartelaNumbers, number) {
    const columns = ['B', 'I', 'N', 'G', 'O'];
    for (const column of columns) {
      if (cartelaNumbers[column] && cartelaNumbers[column].includes(number)) {
        return true;
      }
    }
    return false;
  }
}

module.exports = WebSocketService;
