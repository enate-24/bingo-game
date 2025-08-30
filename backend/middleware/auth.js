const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT token
const verifyToken = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. User not found.'
      });
    }

    if (user.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'Account is not active.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired.'
      });
    }

    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during authentication.'
    });
  }
};

// Check if user is admin
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }
  next();
};

// Check if user is operator or admin
const requireOperator = (req, res, next) => {
  if (!['admin', 'operator'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Operator privileges required.'
    });
  }
  next();
};

// Optional authentication (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');
      
      if (user && user.status === 'active') {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

// Rate limiting middleware
const createRateLimiter = (windowMs = 15 * 60 * 1000, max = 100) => {
  const requests = new Map();
  
  return (req, res, next) => {
    const key = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Clean old entries
    for (const [ip, timestamps] of requests.entries()) {
      const validTimestamps = timestamps.filter(timestamp => timestamp > windowStart);
      if (validTimestamps.length === 0) {
        requests.delete(ip);
      } else {
        requests.set(ip, validTimestamps);
      }
    }
    
    // Check current IP
    const userRequests = requests.get(key) || [];
    const recentRequests = userRequests.filter(timestamp => timestamp > windowStart);
    
    if (recentRequests.length >= max) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
    
    // Add current request
    recentRequests.push(now);
    requests.set(key, recentRequests);
    
    next();
  };
};

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// Verify password reset token
const verifyResetToken = async (req, res, next) => {
  try {
    const { token } = req.params;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Reset token is required.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reset token.'
      });
    }

    req.user = user;
    req.resetToken = token;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token.'
      });
    }

    console.error('Reset token verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during token verification.'
    });
  }
};

// Check game access permissions
const checkGameAccess = async (req, res, next) => {
  try {
    const { gameId } = req.params;
    const Game = require('../models/Game');
    
    const game = await Game.findById(gameId);
    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found.'
      });
    }

    // Admin can access all games
    if (req.user.role === 'admin') {
      req.game = game;
      return next();
    }

    // Operators can only access their own games
    if (req.user.role === 'operator' && game.operator.toString() === req.user._id.toString()) {
      req.game = game;
      return next();
    }

    // Regular users can access games they have cartelas in
    if (req.user.role === 'user') {
      const Cartela = require('../models/Cartela');
      const userCartela = await Cartela.findOne({ gameId, userId: req.user._id });
      
      if (userCartela) {
        req.game = game;
        return next();
      }
    }

    return res.status(403).json({
      success: false,
      message: 'Access denied to this game.'
    });
  } catch (error) {
    console.error('Game access check error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during game access check.'
    });
  }
};

// Log user activity
const logActivity = (action) => {
  return (req, res, next) => {
    // Store activity info in request for later logging
    req.activityLog = {
      action,
      userId: req.user?._id,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      timestamp: new Date()
    };
    
    // You could save this to a separate ActivityLog model
    console.log(`Activity: ${action} by user ${req.user?.username || 'anonymous'} from ${req.activityLog.ip}`);
    
    next();
  };
};

module.exports = {
  verifyToken,
  requireAdmin,
  requireOperator,
  optionalAuth,
  createRateLimiter,
  generateToken,
  verifyResetToken,
  checkGameAccess,
  logActivity
};
