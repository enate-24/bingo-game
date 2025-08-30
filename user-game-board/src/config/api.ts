// API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  WS_URL: import.meta.env.VITE_WS_URL || 'ws://localhost:5000',
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
};

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    PROFILE: '/auth/me',
  },
  
  // Dashboard
  DASHBOARD: {
    OVERVIEW: '/dashboard/overview',
    REVENUE_CHART: '/dashboard/revenue-chart',
    USER_GROWTH: '/dashboard/user-growth',
    GAME_STATISTICS: '/dashboard/game-statistics',
    RECENT_ACTIVITIES: '/dashboard/recent-activities',
    TOP_PLAYERS: '/dashboard/top-players',
    SYSTEM_HEALTH: '/dashboard/system-health',
    FINANCIAL_SUMMARY: '/dashboard/financial-summary',
  },
  
  // Users
  USERS: {
    LIST: '/users',
    CREATE: '/users',
    UPDATE: '/users',
    DELETE: '/users',
    SUSPEND: '/users/suspend',
    ACTIVATE: '/users/activate',
  },
  
  // Games
  GAMES: {
    LIST: '/games',
    CREATE: '/games',
    UPDATE: '/games',
    DELETE: '/games',
    START: '/games/start',
    PAUSE: '/games/pause',
    FINISH: '/games/finish',
    CURRENT: '/games/current',
    ACTIVE: '/games/active',
  },
  
  // Transactions
  TRANSACTIONS: {
    LIST: '/transactions',
    CREATE: '/transactions',
    UPDATE: '/transactions',
    REFUND: '/transactions/refund',
    USER_TRANSACTIONS: '/transactions/user',
  },
  
  // Cartelas
  CARTELAS: {
    LIST: '/cartelas',
    CREATE: '/cartelas',
    UPDATE: '/cartelas',
    DELETE: '/cartelas',
    USER_CARTELAS: '/cartelas/user',
  },
  
  // Health Check
  HEALTH: '/health',
  WS_STATUS: '/websocket/status',
};

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
};
