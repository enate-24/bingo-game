export interface User {
  _id?: string;
  username: string;
  email: string;
  role: 'user' | 'admin' | 'operator' | 'player';
  profile: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    avatar?: string;
  };
  gameStats: {
    totalGames: number;
    totalBet: number;
    totalWin: number;
    totalProfit: number;
    lastGameDate?: Date;
  };
  status: 'active' | 'inactive' | 'suspended';
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  fullName?: string;
  balance?: number; // For compatibility with existing components
}

export interface GameStats {
  dailyProfit: number;
  dailyTotal: number;
  weeklyTotal: number;
  weeklyProfit: number;
  fifteenDayProfit: number;
  todayHouseJackpot: number;
  todayPlayersJackpot: number;
  // Additional stats from backend
  totalGames?: number;
  totalRevenue?: number;
  totalPrizesAwarded?: number;
  totalHouseProfit?: number;
  averageGameDuration?: number;
  totalCartelasSold?: number;
}

export interface GameData {
  date: string;
  games: number;
  playersBet: string;
  playersWon: string;
  houseProfit: string;
  // Additional fields for compatibility
  revenue?: number;
  transactions?: number;
}

export interface Game {
  _id?: string;
  gameId: string;
  title: string;
  description?: string;
  gameType: 'traditional' | 'speed' | 'pattern' | 'blackout';
  status: 'waiting' | 'active' | 'paused' | 'finished' | 'cancelled';
  maxPlayers: number;
  currentPlayers: number;
  cartelaPrice: number;
  prizePool: number;
  prizes: Array<{
    position: '1st' | '2nd' | '3rd' | 'consolation';
    amount: number;
    percentage: number;
  }>;
  drawnNumbers: Array<{
    number: number;
    drawnAt: Date;
    ballLetter: 'B' | 'I' | 'N' | 'G' | 'O';
  }>;
  winningPattern: 'line' | 'full_house' | 'four_corners' | 'cross' | 'custom';
  customPattern?: boolean[][];
  winners: Array<{
    userId: string;
    cartelaId: string;
    position: '1st' | '2nd' | '3rd' | 'consolation';
    prizeAmount: number;
    winningNumbers: number[];
    verifiedAt: Date;
  }>;
  gameSettings: {
    autoCallInterval: number;
    allowLateBuying: boolean;
    maxCartelasPerPlayer: number;
  };
  operator: string;
  scheduledStartTime?: Date;
  actualStartTime?: Date;
  endTime?: Date;
  duration?: number;
  statistics: {
    totalCartelasSold: number;
    totalRevenue: number;
    totalPrizesAwarded: number;
    houseProfit: number;
  };
  createdAt: Date;
  updatedAt: Date;
  
  // Legacy fields for compatibility
  id?: number;
  betMoney?: number;
  winMoney?: number;
  cartelaSelected?: number;
  calledNumbers?: number[];
  selectedNumbers?: number[];
}

export interface Cartela {
  _id?: string;
  userId?: string;
  gameId?: string;
  numbers: number[];
  isActive: boolean;
  purchasePrice: number;
  purchasedAt: Date;
  isWinner?: boolean;
  winningPattern?: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Legacy fields for compatibility
  id?: number;
  selected?: boolean;
}

export interface Transaction {
  _id?: string;
  userId: string;
  gameId?: string;
  cartelaId?: string;
  type: 'purchase' | 'prize' | 'deposit' | 'withdrawal' | 'refund';
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  description?: string;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface DashboardOverview {
  overview: {
    totalUsers: number;
    activeUsers: number;
    totalGames: number;
    activeGames: number;
    totalTransactions: number;
    totalRevenue: number;
  };
  recent30Days: {
    newUsers: number;
    newGames: number;
    newTransactions: number;
    revenue: number;
  };
  lastWeek: {
    newUsers: number;
    newGames: number;
    newTransactions: number;
    revenue: number;
  };
}

export interface FinancialSummary {
  summary: {
    totalRevenue: number;
    totalPayouts: number;
    netProfit: number;
    profitMargin: number;
    totalDeposits: number;
    totalWithdrawals: number;
  };
  breakdown: Array<{
    _id: string;
    totalAmount: number;
    count: number;
    avgAmount: number;
  }>;
  period: {
    startDate: Date;
    endDate: Date;
    days: number;
  };
}
