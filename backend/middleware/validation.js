const { body, param, query, validationResult } = require('express-validator');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  next();
};

// User validation rules
const validateUserRegistration = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  
  body('role')
    .optional()
    .isIn(['user', 'admin', 'chaser', 'player'])
    .withMessage('Invalid role'),
  
  body('shopName')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Shop name cannot exceed 100 characters'),
  
  body('profile.firstName')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('First name cannot exceed 50 characters'),
  
  body('profile.lastName')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Last name cannot exceed 50 characters'),
  
  body('profile.phone')
    .optional()
    .matches(/^\+?[\d\s-()]+$/)
    .withMessage('Please provide a valid phone number'),
  
  handleValidationErrors
];

const validateUserLogin = [
  body('username')
    .trim()
    .isLength({ min: 3 })
    .withMessage('Username is required'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  handleValidationErrors
];

const validateUserUpdate = [
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  
  body('shopName')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Shop name cannot exceed 100 characters'),
  
  body('profile.firstName')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('First name cannot exceed 50 characters'),
  
  body('profile.lastName')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Last name cannot exceed 50 characters'),
  
  body('profile.phone')
    .optional()
    .matches(/^\+?[\d\s-()]+$/)
    .withMessage('Please provide a valid phone number'),
  
  handleValidationErrors
];

// Game validation rules
const validateGameCreation = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Game title is required and cannot exceed 100 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Game description cannot exceed 500 characters'),
  
  body('gameType')
    .optional()
    .isIn(['traditional', 'speed', 'pattern', 'blackout'])
    .withMessage('Invalid game type'),
  
  body('maxPlayers')
    .optional()
    .isInt({ min: 1, max: 500 })
    .withMessage('Maximum players must be between 1 and 500'),
  
  body('cartelaPrice')
    .isFloat({ min: 0.01 })
    .withMessage('Cartela price must be at least 0.01'),
  
  body('prizes')
    .optional()
    .isArray()
    .withMessage('Prizes must be an array'),
  
  body('prizes.*.position')
    .optional()
    .isIn(['1st', '2nd', '3rd', 'consolation'])
    .withMessage('Invalid prize position'),
  
  body('prizes.*.percentage')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Prize percentage must be between 0 and 100'),
  
  body('winningPattern')
    .optional()
    .isIn(['line', 'full_house', 'four_corners', 'cross', 'custom'])
    .withMessage('Invalid winning pattern'),
  
  body('gameSettings.autoCallInterval')
    .optional()
    .isInt({ min: 1000, max: 30000 })
    .withMessage('Auto call interval must be between 1000 and 30000 milliseconds'),
  
  body('gameSettings.maxCartelasPerPlayer')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Max cartelas per player must be between 1 and 50'),
  
  body('scheduledStartTime')
    .optional()
    .isISO8601()
    .withMessage('Scheduled start time must be a valid date'),
  
  handleValidationErrors
];

const validateGameUpdate = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Game title cannot exceed 100 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Game description cannot exceed 500 characters'),
  
  body('status')
    .optional()
    .isIn(['waiting', 'active', 'paused', 'finished', 'cancelled'])
    .withMessage('Invalid game status'),
  
  body('gameSettings.autoCallInterval')
    .optional()
    .isInt({ min: 1000, max: 30000 })
    .withMessage('Auto call interval must be between 1000 and 30000 milliseconds'),
  
  handleValidationErrors
];

// Cartela validation rules
const validateCartelaPurchase = [
  body('gameId')
    .isMongoId()
    .withMessage('Invalid game ID'),
  
  body('quantity')
    .isInt({ min: 1, max: 50 })
    .withMessage('Quantity must be between 1 and 50'),
  
  body('paymentMethod')
    .optional()
    .isIn(['credit_card', 'debit_card', 'paypal', 'bank_transfer', 'mobile_money', 'cash', 'wallet'])
    .withMessage('Invalid payment method'),
  
  handleValidationErrors
];

const validateCartelaNumbers = [
  body('numbers.B')
    .isArray({ min: 5, max: 5 })
    .withMessage('B column must have exactly 5 numbers'),
  
  body('numbers.B.*')
    .isInt({ min: 1, max: 15 })
    .withMessage('B column numbers must be between 1 and 15'),
  
  body('numbers.I')
    .isArray({ min: 5, max: 5 })
    .withMessage('I column must have exactly 5 numbers'),
  
  body('numbers.I.*')
    .isInt({ min: 16, max: 30 })
    .withMessage('I column numbers must be between 16 and 30'),
  
  body('numbers.N')
    .isArray({ min: 4, max: 4 })
    .withMessage('N column must have exactly 4 numbers (center is free)'),
  
  body('numbers.N.*')
    .isInt({ min: 31, max: 45 })
    .withMessage('N column numbers must be between 31 and 45'),
  
  body('numbers.G')
    .isArray({ min: 5, max: 5 })
    .withMessage('G column must have exactly 5 numbers'),
  
  body('numbers.G.*')
    .isInt({ min: 46, max: 60 })
    .withMessage('G column numbers must be between 46 and 60'),
  
  body('numbers.O')
    .isArray({ min: 5, max: 5 })
    .withMessage('O column must have exactly 5 numbers'),
  
  body('numbers.O.*')
    .isInt({ min: 61, max: 75 })
    .withMessage('O column numbers must be between 61 and 75'),
  
  handleValidationErrors
];

// Transaction validation rules
const validateTransaction = [
  body('type')
    .isIn(['purchase', 'prize', 'refund', 'deposit', 'withdrawal'])
    .withMessage('Invalid transaction type'),
  
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Transaction amount must be at least 0.01'),
  
  body('description')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Description is required and cannot exceed 200 characters'),
  
  body('paymentMethod')
    .optional()
    .isIn(['credit_card', 'debit_card', 'paypal', 'bank_transfer', 'mobile_money', 'cash', 'wallet'])
    .withMessage('Invalid payment method'),
  
  body('currency')
    .optional()
    .isIn(['USD', 'EUR', 'GBP', 'KES', 'NGN'])
    .withMessage('Invalid currency'),
  
  handleValidationErrors
];

// Parameter validation rules
const validateMongoId = (paramName) => [
  param(paramName)
    .isMongoId()
    .withMessage(`Invalid ${paramName}`),
  
  handleValidationErrors
];

const validateBingoNumber = [
  body('number')
    .isInt({ min: 1, max: 75 })
    .withMessage('Bingo number must be between 1 and 75'),
  
  handleValidationErrors
];

// Query validation rules
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  handleValidationErrors
];

const validateDateRange = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date'),
  
  handleValidationErrors
];

// Password validation rules
const validatePasswordChange = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one lowercase letter, one uppercase letter, and one number'),
  
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Password confirmation does not match new password');
      }
      return true;
    }),
  
  handleValidationErrors
];

const validatePasswordReset = [
  body('username')
    .trim()
    .isLength({ min: 3 })
    .withMessage('Username is required'),
  
  handleValidationErrors
];

const validatePasswordResetConfirm = [
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Password confirmation does not match password');
      }
      return true;
    }),
  
  handleValidationErrors
];

// Custom validation middleware
const validateGameStatus = (allowedStatuses) => {
  return (req, res, next) => {
    if (req.game && !allowedStatuses.includes(req.game.status)) {
      return res.status(400).json({
        success: false,
        message: `Game must be in one of these statuses: ${allowedStatuses.join(', ')}`
      });
    }
    next();
  };
};

const validateCartelaOwnership = async (req, res, next) => {
  try {
    const { cartelaId } = req.params;
    const Cartela = require('../models/Cartela');
    
    const cartela = await Cartela.findById(cartelaId);
    if (!cartela) {
      return res.status(404).json({
        success: false,
        message: 'Cartela not found'
      });
    }

    // Admin can access all cartelas
    if (req.user.role === 'admin') {
      req.cartela = cartela;
      return next();
    }

    // Users can only access their own cartelas
    if (cartela.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this cartela'
      });
    }

    req.cartela = cartela;
    next();
  } catch (error) {
    console.error('Cartela ownership validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during cartela validation'
    });
  }
};

module.exports = {
  handleValidationErrors,
  validateUserRegistration,
  validateUserLogin,
  validateUserUpdate,
  validateGameCreation,
  validateGameUpdate,
  validateCartelaPurchase,
  validateCartelaNumbers,
  validateTransaction,
  validateMongoId,
  validateBingoNumber,
  validatePagination,
  validateDateRange,
  validatePasswordChange,
  validatePasswordReset,
  validatePasswordResetConfirm,
  validateGameStatus,
  validateCartelaOwnership
};
