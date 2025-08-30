const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Game = require('../models/Game');
const Cartela = require('../models/Cartela');
const Transaction = require('../models/Transaction');

// Connect to MongoDB
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bingo-game';
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Clear existing data
const clearDatabase = async () => {
  try {
    await User.deleteMany({});
    await Game.deleteMany({});
    await Cartela.deleteMany({});
    await Transaction.deleteMany({});
    console.log('Database cleared successfully');
  } catch (error) {
    console.error('Error clearing database:', error);
  }
};

// Create sample users
const createUsers = async () => {
  try {
    const users = [
      {
        username: 'admin',
        email: 'admin@bingo.com',
        password: await bcrypt.hash('admin123', 12),
        role: 'admin',
        status: 'active',
        profile: {
          firstName: 'Admin',
          lastName: 'User',
          phone: '+1234567890',
          dateOfBirth: new Date('1990-01-01'),
          address: {
            street: '123 Admin St',
            city: 'Admin City',
            state: 'AC',
            zipCode: '12345',
            country: 'USA'
          }
        },
        preferences: {
          notifications: {
            email: true,
            sms: false,
            push: true
          },
          autoPlay: false,
          theme: 'light'
        }
      },
      {
        username: 'operator1',
        email: 'operator1@bingo.com',
        password: await bcrypt.hash('operator123', 12),
        role: 'operator',
        status: 'active',
        profile: {
          firstName: 'John',
          lastName: 'Operator',
          phone: '+1234567891',
          dateOfBirth: new Date('1985-05-15'),
          address: {
            street: '456 Operator Ave',
            city: 'Game City',
            state: 'GC',
            zipCode: '54321',
            country: 'USA'
          }
        }
      },
      {
        username: 'player1',
        email: 'player1@bingo.com',
        password: await bcrypt.hash('player123', 12),
        role: 'player',
        status: 'active',
        profile: {
          firstName: 'Alice',
          lastName: 'Player',
          phone: '+1234567892',
          dateOfBirth: new Date('1992-08-20'),
          address: {
            street: '789 Player Rd',
            city: 'Player Town',
            state: 'PT',
            zipCode: '67890',
            country: 'USA'
          }
        },
        gameStats: {
          totalGames: 15,
          totalWins: 3,
          totalBet: 150.00,
          totalWin: 75.00,
          totalProfit: -75.00,
          winRate: 20.00,
          averageBet: 10.00,
          biggestWin: 50.00,
          currentStreak: 0,
          longestWinStreak: 2,
          longestLoseStreak: 8
        }
      },
      {
        username: 'player2',
        email: 'player2@bingo.com',
        password: await bcrypt.hash('player123', 12),
        role: 'player',
        status: 'active',
        profile: {
          firstName: 'Bob',
          lastName: 'Gamer',
          phone: '+1234567893',
          dateOfBirth: new Date('1988-12-10'),
          address: {
            street: '321 Gamer Blvd',
            city: 'Bingo City',
            state: 'BC',
            zipCode: '13579',
            country: 'USA'
          }
        },
        gameStats: {
          totalGames: 25,
          totalWins: 8,
          totalBet: 300.00,
          totalWin: 240.00,
          totalProfit: -60.00,
          winRate: 32.00,
          averageBet: 12.00,
          biggestWin: 100.00,
          currentStreak: 2,
          longestWinStreak: 4,
          longestLoseStreak: 6
        }
      },
      {
        username: 'player3',
        email: 'player3@bingo.com',
        password: await bcrypt.hash('player123', 12),
        role: 'player',
        status: 'active',
        profile: {
          firstName: 'Carol',
          lastName: 'Winner',
          phone: '+1234567894',
          dateOfBirth: new Date('1995-03-25'),
          address: {
            street: '654 Winner Way',
            city: 'Lucky Town',
            state: 'LT',
            zipCode: '24680',
            country: 'USA'
          }
        },
        gameStats: {
          totalGames: 40,
          totalWins: 12,
          totalBet: 500.00,
          totalWin: 450.00,
          totalProfit: -50.00,
          winRate: 30.00,
          averageBet: 12.50,
          biggestWin: 150.00,
          currentStreak: 1,
          longestWinStreak: 5,
          longestLoseStreak: 10
        }
      }
    ];

    const createdUsers = await User.insertMany(users);
    console.log(`Created ${createdUsers.length} users`);
    return createdUsers;
  } catch (error) {
    console.error('Error creating users:', error);
    return [];
  }
};

// Create sample games
const createGames = async (users) => {
  try {
    const admin = users.find(u => u.role === 'admin');
    const operator = users.find(u => u.role === 'operator');

    const games = [
      {
        title: 'Evening Jackpot Bingo',
        description: 'Join our evening jackpot game with amazing prizes!',
        gameType: 'traditional',
        status: 'waiting',
        operator: operator._id,
        maxPlayers: 100,
        currentPlayers: 0,
        cartelaPrice: 10.00,
        prizePool: 0,
        winningPattern: 'full-house',
        gameSettings: {
          drawInterval: 5000,
          maxCartelasPerPlayer: 5,
          autoMarkNumbers: true,
          allowLateEntry: false,
          pauseBetweenNumbers: 3000
        },
        prizes: [
          {
            type: 'full-house',
            name: 'Jackpot Winner',
            percentage: 60,
            amount: 0,
            description: 'Complete all numbers on your cartela'
          },
          {
            type: 'line',
            name: 'Line Winner',
            percentage: 25,
            amount: 0,
            description: 'Complete any horizontal line'
          },
          {
            type: 'corners',
            name: 'Four Corners',
            percentage: 15,
            amount: 0,
            description: 'Mark all four corner numbers'
          }
        ],
        scheduledStartTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
        statistics: {
          totalCartelasSold: 0,
          totalRevenue: 0,
          houseProfit: 0,
          averagePlayTime: 0
        }
      },
      {
        title: 'Quick Play Bingo',
        description: 'Fast-paced bingo game for quick wins!',
        gameType: 'speed',
        status: 'finished',
        operator: operator._id,
        maxPlayers: 50,
        currentPlayers: 35,
        cartelaPrice: 5.00,
        prizePool: 157.50,
        winningPattern: 'line',
        gameSettings: {
          drawInterval: 2000,
          maxCartelasPerPlayer: 3,
          autoMarkNumbers: true,
          allowLateEntry: false,
          pauseBetweenNumbers: 1000
        },
        prizes: [
          {
            type: 'line',
            name: 'Line Winner',
            percentage: 70,
            amount: 110.25,
            description: 'Complete any horizontal line'
          },
          {
            type: 'corners',
            name: 'Four Corners',
            percentage: 30,
            amount: 47.25,
            description: 'Mark all four corner numbers'
          }
        ],
        startedAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
        finishedAt: new Date(Date.now() - 2.5 * 60 * 60 * 1000), // 2.5 hours ago
        duration: 30 * 60 * 1000, // 30 minutes
        statistics: {
          totalCartelasSold: 45,
          totalRevenue: 225.00,
          houseProfit: 67.50,
          averagePlayTime: 25 * 60 * 1000
        },
        drawnNumbers: [
          { number: 7, letter: 'B', timestamp: new Date(), sequence: 1 },
          { number: 23, letter: 'I', timestamp: new Date(), sequence: 2 },
          { number: 34, letter: 'N', timestamp: new Date(), sequence: 3 },
          { number: 52, letter: 'G', timestamp: new Date(), sequence: 4 },
          { number: 68, letter: 'O', timestamp: new Date(), sequence: 5 },
          { number: 15, letter: 'B', timestamp: new Date(), sequence: 6 },
          { number: 29, letter: 'I', timestamp: new Date(), sequence: 7 },
          { number: 41, letter: 'N', timestamp: new Date(), sequence: 8 },
          { number: 56, letter: 'G', timestamp: new Date(), sequence: 9 },
          { number: 72, letter: 'O', timestamp: new Date(), sequence: 10 }
        ]
      },
      {
        title: 'Weekend Special',
        description: 'Special weekend game with bonus prizes!',
        gameType: 'progressive',
        status: 'active',
        operator: admin._id,
        maxPlayers: 200,
        currentPlayers: 87,
        cartelaPrice: 15.00,
        prizePool: 1175.25,
        winningPattern: 'full-house',
        gameSettings: {
          drawInterval: 4000,
          maxCartelasPerPlayer: 8,
          autoMarkNumbers: true,
          allowLateEntry: true,
          pauseBetweenNumbers: 2000
        },
        prizes: [
          {
            type: 'full-house',
            name: 'Progressive Jackpot',
            percentage: 50,
            amount: 587.63,
            description: 'Complete all numbers on your cartela'
          },
          {
            type: 'line',
            name: 'Line Bonus',
            percentage: 30,
            amount: 352.58,
            description: 'Complete any horizontal line'
          },
          {
            type: 'corners',
            name: 'Corner Bonus',
            percentage: 20,
            amount: 235.05,
            description: 'Mark all four corner numbers'
          }
        ],
        startedAt: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
        statistics: {
          totalCartelasSold: 95,
          totalRevenue: 1425.00,
          houseProfit: 249.75,
          averagePlayTime: 0
        },
        drawnNumbers: [
          { number: 12, letter: 'B', timestamp: new Date(), sequence: 1 },
          { number: 28, letter: 'I', timestamp: new Date(), sequence: 2 },
          { number: 45, letter: 'N', timestamp: new Date(), sequence: 3 },
          { number: 61, letter: 'G', timestamp: new Date(), sequence: 4 },
          { number: 74, letter: 'O', timestamp: new Date(), sequence: 5 }
        ]
      }
    ];

    const createdGames = await Game.insertMany(games);
    console.log(`Created ${createdGames.length} games`);
    return createdGames;
  } catch (error) {
    console.error('Error creating games:', error);
    return [];
  }
};

// Create sample transactions
const createTransactions = async (users, games) => {
  try {
    const players = users.filter(u => u.role === 'player');
    const finishedGame = games.find(g => g.status === 'finished');
    const activeGame = games.find(g => g.status === 'active');

    const transactions = [];

    // Create purchase transactions for finished game
    for (let i = 0; i < players.length; i++) {
      const player = players[i];
      const numCartelas = Math.floor(Math.random() * 3) + 1; // 1-3 cartelas
      
      for (let j = 0; j < numCartelas; j++) {
        transactions.push({
          userId: player._id,
          gameId: finishedGame._id,
          type: 'purchase',
          amount: finishedGame.cartelaPrice,
          currency: 'USD',
          description: `Purchase cartela for game: ${finishedGame.title}`,
          status: 'completed',
          paymentMethod: 'credit_card',
          processedAt: new Date(Date.now() - 3 * 60 * 60 * 1000)
        });
      }
    }

    // Create purchase transactions for active game
    for (let i = 0; i < players.length; i++) {
      const player = players[i];
      const numCartelas = Math.floor(Math.random() * 4) + 1; // 1-4 cartelas
      
      for (let j = 0; j < numCartelas; j++) {
        transactions.push({
          userId: player._id,
          gameId: activeGame._id,
          type: 'purchase',
          amount: activeGame.cartelaPrice,
          currency: 'USD',
          description: `Purchase cartela for game: ${activeGame.title}`,
          status: 'completed',
          paymentMethod: 'credit_card',
          processedAt: new Date(Date.now() - 50 * 60 * 1000)
        });
      }
    }

    // Create some prize transactions for finished game
    transactions.push({
      userId: players[0]._id,
      gameId: finishedGame._id,
      type: 'prize',
      amount: 110.25,
      currency: 'USD',
      description: `Prize winnings from game: ${finishedGame.title}`,
      status: 'completed',
      processedAt: new Date(Date.now() - 2.5 * 60 * 60 * 1000)
    });

    transactions.push({
      userId: players[1]._id,
      gameId: finishedGame._id,
      type: 'prize',
      amount: 47.25,
      currency: 'USD',
      description: `Prize winnings from game: ${finishedGame.title}`,
      status: 'completed',
      processedAt: new Date(Date.now() - 2.5 * 60 * 60 * 1000)
    });

    // Create some deposit transactions
    for (let i = 0; i < players.length; i++) {
      const player = players[i];
      transactions.push({
        userId: player._id,
        type: 'deposit',
        amount: Math.floor(Math.random() * 200) + 50, // $50-$250
        currency: 'USD',
        description: 'Account deposit',
        status: 'completed',
        paymentMethod: 'credit_card',
        processedAt: new Date(Date.now() - Math.floor(Math.random() * 7) * 24 * 60 * 60 * 1000)
      });
    }

    const createdTransactions = await Transaction.insertMany(transactions);
    console.log(`Created ${createdTransactions.length} transactions`);
    return createdTransactions;
  } catch (error) {
    console.error('Error creating transactions:', error);
    return [];
  }
};

// Main seed function
const seedDatabase = async () => {
  try {
    console.log('Starting database seeding...');
    
    await connectDB();
    await clearDatabase();
    
    const users = await createUsers();
    const games = await createGames(users);
    const transactions = await createTransactions(users, games);
    
    console.log('\n=== Database Seeding Complete ===');
    console.log(`Users created: ${users.length}`);
    console.log(`Games created: ${games.length}`);
    console.log(`Transactions created: ${transactions.length}`);
    
    console.log('\n=== Login Credentials ===');
    console.log('Admin: admin@bingo.com / admin123');
    console.log('Operator: operator1@bingo.com / operator123');
    console.log('Player 1: player1@bingo.com / player123');
    console.log('Player 2: player2@bingo.com / player123');
    console.log('Player 3: player3@bingo.com / player123');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

// Run the seed function
seedDatabase();
