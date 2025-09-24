# Bingo Game Management System - Backend

A complete backend implementation for a Bingo Game Management System built with Node.js, Express.js, MongoDB, and WebSocket for real-time functionality.

## Features

### Core Functionality
- **User Management**: Registration, authentication, profile management
- **Game Management**: Create, manage, and operate bingo games
- **Cartela System**: Purchase, manage, and play with bingo cartelas
- **Real-time Gaming**: WebSocket-based real-time game experience
- **Transaction System**: Complete financial transaction management
- **Admin Dashboard**: Comprehensive analytics and management tools

### Technical Features
- **Authentication & Authorization**: JWT-based with role-based access control
- **Real-time Communication**: Socket.IO for live game updates
- **Data Validation**: Comprehensive input validation and sanitization
- **Error Handling**: Robust error handling and logging
- **Security**: Helmet.js, CORS, rate limiting, and input validation
- **Database**: MongoDB with Mongoose ODM
- **API Documentation**: RESTful API design with comprehensive endpoints

## Tech Stack

- **Runtime**: Node.js (>=16.0.0)
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Real-time**: Socket.IO
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Joi, Express-validator
- **Security**: Helmet.js, bcryptjs
- **Utilities**: Lodash, Moment.js, UUID

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the backend directory:
   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   CLIENT_URL=http://localhost:3000

   # Database
   MONGODB_URI=mongodb://localhost:27017/bingo-game

   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-here
   JWT_EXPIRE=7d

   # Email Configuration (Optional)
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password

   # Game Configuration
   DEFAULT_CARTELA_PRICE=5.00
   HOUSE_EDGE_PERCENTAGE=10
   MAX_CARTELAS_PER_PLAYER=10
   ```

4. **Start MongoDB**
   Make sure MongoDB is running on your system.

5. **Run the application**
   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm start
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### Users
- `GET /api/users` - Get all users (Admin)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (Admin)
- `PUT /api/users/:id/suspend` - Suspend user (Admin)
- `PUT /api/users/:id/activate` - Activate user (Admin)

### Games
- `GET /api/games` - Get all games
- `POST /api/games` - Create new game (Admin/Operator)
- `GET /api/games/:id` - Get game by ID
- `PUT /api/games/:id` - Update game
- `DELETE /api/games/:id` - Delete game (Admin)
- `POST /api/games/:id/start` - Start game
- `POST /api/games/:id/pause` - Pause game
- `POST /api/games/:id/resume` - Resume game
- `POST /api/games/:id/finish` - Finish game
- `POST /api/games/:id/draw-number` - Draw next number

### Cartelas
- `GET /api/cartelas` - Get user's cartelas
- `POST /api/cartelas/purchase` - Purchase cartelas
- `POST /api/cartelas/custom` - Create custom cartela
- `GET /api/cartelas/:id` - Get cartela by ID
- `PUT /api/cartelas/:id/mark` - Mark number on cartela
- `PUT /api/cartelas/:id/auto-play` - Toggle auto-play
- `DELETE /api/cartelas/:id` - Cancel cartela (before game starts)

### Transactions
- `GET /api/transactions` - Get transactions
- `POST /api/transactions` - Create transaction (Admin)
- `GET /api/transactions/:id` - Get transaction by ID
- `PUT /api/transactions/:id/complete` - Complete transaction (Admin)
- `PUT /api/transactions/:id/fail` - Fail transaction (Admin)
- `POST /api/transactions/:id/refund` - Create refund (Admin)

### Dashboard (Admin)
- `GET /api/dashboard/overview` - Dashboard overview
- `GET /api/dashboard/revenue-chart` - Revenue chart data
- `GET /api/dashboard/user-growth` - User growth data
- `GET /api/dashboard/game-statistics` - Game statistics
- `GET /api/dashboard/recent-activities` - Recent activities
- `GET /api/dashboard/top-players` - Top players
- `GET /api/dashboard/system-health` - System health metrics
- `GET /api/dashboard/financial-summary` - Financial summary

### Health Check
- `GET /api/health` - Server health check
- `GET /api/websocket/status` - WebSocket status

## WebSocket Events

### Client to Server
- `join-game` - Join a game room
- `leave-game` - Leave a game room
- `mark-number` - Mark a number on cartela
- `game-chat` - Send chat message

### Server to Client
- `joined-game` - Confirmation of joining game
- `player-joined` - Another player joined
- `player-left` - Player left the game
- `number-drawn` - New number was drawn
- `number-marked` - Number marked on cartela
- `winner-declared` - Winner found
- `winner-announced` - Official winner announcement
- `game-finished` - Game completed
- `game-status-changed` - Game status update
- `game-chat` - Chat message received
- `notification` - System notification
- `error` - Error message

## Database Models

### User
- Authentication and profile information
- Game statistics and preferences
- Role-based permissions

### Game
- Game configuration and settings
- Current state and drawn numbers
- Prize pool and statistics

### Cartela
- Bingo card with numbers
- Marked numbers and status
- Auto-play configuration

### Transaction
- Financial transactions
- Purchase, prize, deposit, withdrawal records
- Audit trail and status tracking

## Security Features

- **Authentication**: JWT-based authentication
- **Authorization**: Role-based access control (Admin, Chaser, Player)
- **Input Validation**: Comprehensive validation using Joi and express-validator
- **Rate Limiting**: API rate limiting to prevent abuse
- **CORS**: Configured for specific origins
- **Helmet**: Security headers and protection
- **Password Hashing**: bcryptjs for secure password storage

## Error Handling

The API uses consistent error response format:
```json
{
  "success": false,
  "message": "Error description",
  "errors": ["Detailed error messages"]
}
```

## Development

### Scripts
- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm test` - Run tests (when implemented)

### Code Structure
```
backend/
├── models/          # Mongoose models
├── routes/          # Express routes
├── middleware/      # Custom middleware
├── services/        # Business logic services
├── utils/           # Utility functions
├── config/          # Configuration files
└── server.js        # Main server file
```

## Deployment

### Environment Variables
Ensure all required environment variables are set in production:
- `NODE_ENV=production`
- `MONGODB_URI` - Production MongoDB connection string
- `JWT_SECRET` - Strong secret key
- `CLIENT_URL` - Production client URL

### Production Considerations
- Use a process manager like PM2
- Set up MongoDB replica set for high availability
- Configure reverse proxy (nginx)
- Enable SSL/TLS certificates
- Set up monitoring and logging
- Configure backup strategies

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please contact the development team or create an issue in the repository.