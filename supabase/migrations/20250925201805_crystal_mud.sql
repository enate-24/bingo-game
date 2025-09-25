/*
  # Create default admin user

  1. New Data
    - Insert default admin user for system access
    - Username: admin
    - Password: admin123 (hashed)
    - Role: admin

  2. Security
    - Password is properly hashed using crypt function
    - Admin has full system access
*/

-- Insert default admin user
INSERT INTO users (
  username,
  password,
  role,
  profile,
  status
) VALUES (
  'admin',
  crypt('admin123', gen_salt('bf')),
  'admin',
  '{
    "firstName": "Admin",
    "lastName": "User",
    "phone": "+1234567890"
  }',
  'active'
) ON CONFLICT (username) DO NOTHING;

-- Insert sample chaser user
INSERT INTO users (
  username,
  password,
  role,
  shop_name,
  profile,
  status
) VALUES (
  'chaser1',
  crypt('chaser123', gen_salt('bf')),
  'chaser',
  'Downtown Bingo Hall',
  '{
    "firstName": "John",
    "lastName": "Chaser",
    "phone": "+1234567891"
  }',
  'active'
) ON CONFLICT (username) DO NOTHING;

-- Insert sample player users
INSERT INTO users (
  username,
  password,
  role,
  profile,
  game_stats,
  status
) VALUES 
(
  'player1',
  crypt('player123', gen_salt('bf')),
  'player',
  '{
    "firstName": "Alice",
    "lastName": "Player",
    "phone": "+1234567892"
  }',
  '{
    "totalGames": 15,
    "totalBet": 150.00,
    "totalWin": 75.00,
    "totalProfit": -75.00,
    "lastGameDate": null
  }',
  'active'
),
(
  'player2',
  crypt('player123', gen_salt('bf')),
  'player',
  '{
    "firstName": "Bob",
    "lastName": "Gamer",
    "phone": "+1234567893"
  }',
  '{
    "totalGames": 25,
    "totalBet": 300.00,
    "totalWin": 240.00,
    "totalProfit": -60.00,
    "lastGameDate": null
  }',
  'active'
),
(
  'player3',
  crypt('player123', gen_salt('bf')),
  'player',
  '{
    "firstName": "Carol",
    "lastName": "Winner",
    "phone": "+1234567894"
  }',
  '{
    "totalGames": 40,
    "totalBet": 500.00,
    "totalWin": 450.00,
    "totalProfit": -50.00,
    "lastGameDate": null
  }',
  'active'
) ON CONFLICT (username) DO NOTHING;