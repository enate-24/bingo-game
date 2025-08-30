# User Game Board - Backend Integration

This document describes how the user-game-board application has been connected to the backoffice backend to fetch real data and user information.

## Overview

The user-game-board application now integrates with the backend API to provide real-time data instead of using mock data. This includes user authentication, game statistics, cartela management, and transaction data.

## Architecture

### API Integration
- **API Service**: `src/services/apiService.ts` - Centralized service for all backend API calls
- **API Configuration**: `src/config/api.ts` - Configuration for API endpoints and settings
- **Authentication Context**: `src/contexts/AuthContext.tsx` - Manages user authentication state
- **Data Hook**: `src/hooks/useGameData.ts` - Custom hook for fetching and managing game data

### Key Components

#### 1. API Service (`apiService.ts`)
- Handles HTTP requests with retry logic and error handling
- Manages authentication tokens
- Provides methods for all backend endpoints:
  - Authentication (login, logout, profile)
  - Dashboard data (overview, statistics, financial summary)
  - Games (CRUD operations, current game, active games)
  - Cartelas (user cartelas, CRUD operations)
  - Transactions (user transactions, creation)

#### 2. Authentication Context (`AuthContext.tsx`)
- Manages user authentication state
- Provides login/logout functionality
- Handles token management
- Transforms backend user data to frontend format

#### 3. Data Management (`useGameData.ts`)
- Fetches real-time game statistics from backend
- Manages current game state
- Handles cartela data
- Provides data refresh functionality
- Falls back to mock data when backend is unavailable

## Data Flow

```
Backend API ← → API Service ← → Auth Context / useGameData Hook ← → React Components
```

### Data Transformations

The application transforms backend data structures to match the existing frontend interfaces:

#### User Data
```typescript
// Backend User → Frontend User
{
  username: string,
  email: string,
  gameStats: { totalWin, totalBet, ... },
  profile: { firstName, lastName, ... }
} → {
  username: string,
  balance: calculated from gameStats,
  fullName: firstName + lastName || username
}
```

#### Game Data
```typescript
// Backend Game → Frontend Game
{
  gameId: string,
  cartelaPrice: number,
  drawnNumbers: [{ number, ballLetter }],
  statistics: { totalCartelasSold, ... }
} → {
  id: numeric ID,
  betMoney: cartelaPrice,
  calledNumbers: [numbers],
  cartelaSelected: totalCartelasSold
}
```

## Configuration

### Environment Variables
Create a `.env` file in the user-game-board directory:

```env
VITE_API_URL=http://localhost:5000/api
VITE_WS_URL=ws://localhost:5000
VITE_NODE_ENV=development
```

### API Endpoints
The application connects to these backend endpoints:

- **Authentication**: `/auth/login`, `/auth/logout`, `/auth/me`
- **Dashboard**: `/dashboard/overview`, `/dashboard/financial-summary`
- **Games**: `/games/current`, `/games/active`, `/games/*`
- **Cartelas**: `/cartelas/user`, `/cartelas/*`
- **Transactions**: `/transactions/user`, `/transactions/*`

## Features

### Real-time Data
- Dashboard statistics from actual backend data
- Current game information
- User cartelas and transaction history
- Financial summaries and game statistics

### Authentication
- JWT token-based authentication
- Automatic token refresh
- Fallback to development mode when backend unavailable

### Error Handling
- Graceful fallback to mock data
- Retry logic for failed requests
- User-friendly error messages

### Development Mode
- Skip authentication for development
- Mock data fallbacks
- Default user creation when backend unavailable

## Usage

### Starting the Application

1. **Start the Backend** (from backend directory):
```bash
npm install
npm start
```

2. **Start the User Game Board** (from user-game-board directory):
```bash
npm install
npm run dev
```

### Authentication
- Use the login form with backend credentials
- Or click "Skip Login" for development mode
- Default development user is created automatically

### Data Refresh
The application automatically refreshes data and provides manual refresh capabilities through the `refreshData` function.

## API Integration Status

✅ **Completed**:
- API service setup
- Authentication integration
- Dashboard data fetching
- Game statistics
- User profile management
- Cartela management
- Error handling and fallbacks

🔄 **In Progress**:
- Real-time WebSocket integration
- Advanced game state synchronization
- Transaction processing

📋 **Planned**:
- Push notifications
- Advanced analytics
- Multi-language support

## Troubleshooting

### Common Issues

1. **Backend Connection Failed**
   - Check if backend server is running on port 5000
   - Verify API_URL in .env file
   - Check network connectivity

2. **Authentication Errors**
   - Verify user credentials
   - Check if backend auth routes are working
   - Clear localStorage and retry

3. **Data Loading Issues**
   - Check browser console for API errors
   - Verify backend database connection
   - Use development mode as fallback

### Development Tips

- Use browser dev tools to monitor API calls
- Check the Network tab for failed requests
- Enable development mode for testing without backend
- Use the refresh functionality to reload data

## Contributing

When adding new features that require backend integration:

1. Add new API methods to `apiService.ts`
2. Update type definitions in `types/index.ts`
3. Add data transformation logic in `useGameData.ts`
4. Handle errors gracefully with fallbacks
5. Update this documentation

## Security Considerations

- JWT tokens are stored in localStorage
- API calls include authentication headers
- Sensitive data is not logged in production
- CORS is configured for development
