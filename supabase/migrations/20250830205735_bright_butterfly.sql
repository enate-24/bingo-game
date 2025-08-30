/*
  # Initial Bingo Game Database Schema

  1. New Tables
    - `users` - User accounts and profiles
    - `games` - Bingo games and their configurations
    - `cartelas` - Bingo cards/cartelas for players
    - `transactions` - Financial transactions and payments
    - `game_participants` - Junction table for game participation

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Add admin and operator specific policies

  3. Functions
    - User authentication and profile management
    - Game state management
    - Transaction processing
*/

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  role text NOT NULL DEFAULT 'player' CHECK (role IN ('admin', 'operator', 'player', 'user')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  
  -- Profile information
  first_name text,
  last_name text,
  phone text,
  avatar_url text,
  
  -- Game statistics
  total_games integer DEFAULT 0,
  total_bet numeric(10,2) DEFAULT 0,
  total_win numeric(10,2) DEFAULT 0,
  total_profit numeric(10,2) DEFAULT 0,
  last_game_date timestamptz,
  
  last_login timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Games table
CREATE TABLE IF NOT EXISTS games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id text UNIQUE NOT NULL,
  title text NOT NULL,
  description text,
  game_type text NOT NULL DEFAULT 'traditional' CHECK (game_type IN ('traditional', 'speed', 'pattern', 'blackout')),
  status text NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'paused', 'finished', 'cancelled')),
  
  max_players integer DEFAULT 100,
  current_players integer DEFAULT 0,
  cartela_price numeric(10,2) NOT NULL,
  prize_pool numeric(10,2) DEFAULT 0,
  
  -- Game configuration
  winning_pattern text DEFAULT 'full_house' CHECK (winning_pattern IN ('line', 'full_house', 'four_corners', 'cross', 'custom')),
  custom_pattern jsonb,
  
  -- Game settings
  auto_call_interval integer DEFAULT 5000,
  allow_late_buying boolean DEFAULT false,
  max_cartelas_per_player integer DEFAULT 10,
  
  -- Game timing
  scheduled_start_time timestamptz,
  actual_start_time timestamptz,
  end_time timestamptz,
  duration_minutes integer,
  
  -- Statistics
  total_cartelas_sold integer DEFAULT 0,
  total_revenue numeric(10,2) DEFAULT 0,
  total_prizes_awarded numeric(10,2) DEFAULT 0,
  house_profit numeric(10,2) DEFAULT 0,
  
  operator_id uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Drawn numbers table (separate for better performance)
CREATE TABLE IF NOT EXISTS drawn_numbers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid REFERENCES games(id) ON DELETE CASCADE,
  number integer NOT NULL CHECK (number >= 1 AND number <= 75),
  ball_letter text NOT NULL CHECK (ball_letter IN ('B', 'I', 'N', 'G', 'O')),
  sequence_number integer NOT NULL,
  drawn_at timestamptz DEFAULT now(),
  
  UNIQUE(game_id, number)
);

-- Game prizes table
CREATE TABLE IF NOT EXISTS game_prizes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid REFERENCES games(id) ON DELETE CASCADE,
  position text NOT NULL CHECK (position IN ('1st', '2nd', '3rd', 'consolation')),
  percentage numeric(5,2) NOT NULL,
  amount numeric(10,2) DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Cartelas table
CREATE TABLE IF NOT EXISTS cartelas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cartela_id text UNIQUE NOT NULL,
  game_id uuid REFERENCES games(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  
  -- Bingo numbers (stored as JSONB for flexibility)
  numbers_b integer[] NOT NULL,
  numbers_i integer[] NOT NULL,
  numbers_n integer[] NOT NULL, -- Only 4 numbers (center is free)
  numbers_g integer[] NOT NULL,
  numbers_o integer[] NOT NULL,
  
  marked_numbers integer[] DEFAULT '{}',
  status text DEFAULT 'active' CHECK (status IN ('active', 'winner', 'expired')),
  purchase_price numeric(10,2) NOT NULL,
  is_auto_play boolean DEFAULT false,
  
  -- Winning details
  winning_position text CHECK (winning_position IN ('1st', '2nd', '3rd', 'consolation')),
  prize_amount numeric(10,2) DEFAULT 0,
  winning_pattern text,
  winning_numbers integer[],
  verified_at timestamptz,
  
  purchased_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id text UNIQUE NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  game_id uuid REFERENCES games(id) ON DELETE SET NULL,
  cartela_id uuid REFERENCES cartelas(id) ON DELETE SET NULL,
  
  type text NOT NULL CHECK (type IN ('purchase', 'prize', 'refund', 'deposit', 'withdrawal')),
  amount numeric(10,2) NOT NULL,
  currency text DEFAULT 'USD',
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled', 'refunded')),
  description text NOT NULL,
  
  payment_method text DEFAULT 'wallet' CHECK (payment_method IN ('credit_card', 'debit_card', 'paypal', 'bank_transfer', 'mobile_money', 'cash', 'wallet')),
  
  -- Payment details
  gateway text,
  gateway_transaction_id text,
  gateway_response jsonb,
  
  -- Balance tracking
  balance_before numeric(10,2) DEFAULT 0,
  balance_after numeric(10,2) DEFAULT 0,
  
  -- Metadata
  metadata jsonb DEFAULT '{}',
  
  -- Processing info
  processed_by uuid REFERENCES users(id),
  processed_at timestamptz,
  failure_reason text,
  
  -- Refund details
  original_transaction_id text,
  refund_reason text,
  refunded_at timestamptz,
  refunded_by uuid REFERENCES users(id),
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Game winners table
CREATE TABLE IF NOT EXISTS game_winners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid REFERENCES games(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  cartela_id uuid REFERENCES cartelas(id) ON DELETE CASCADE,
  position text NOT NULL CHECK (position IN ('1st', '2nd', '3rd', 'consolation')),
  prize_amount numeric(10,2) NOT NULL,
  winning_numbers integer[],
  verified_at timestamptz DEFAULT now(),
  
  UNIQUE(game_id, position)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);
CREATE INDEX IF NOT EXISTS idx_games_operator ON games(operator_id);
CREATE INDEX IF NOT EXISTS idx_games_created_at ON games(created_at);
CREATE INDEX IF NOT EXISTS idx_games_game_id ON games(game_id);

CREATE INDEX IF NOT EXISTS idx_cartelas_game_id ON cartelas(game_id);
CREATE INDEX IF NOT EXISTS idx_cartelas_user_id ON cartelas(user_id);
CREATE INDEX IF NOT EXISTS idx_cartelas_status ON cartelas(status);
CREATE INDEX IF NOT EXISTS idx_cartelas_cartela_id ON cartelas(cartela_id);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_game_id ON transactions(game_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);

CREATE INDEX IF NOT EXISTS idx_drawn_numbers_game_id ON drawn_numbers(game_id);
CREATE INDEX IF NOT EXISTS idx_drawn_numbers_sequence ON drawn_numbers(game_id, sequence_number);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE cartelas ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE drawn_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_prizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_winners ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can read own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can read all users"
  ON users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage all users"
  ON users FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for games table
CREATE POLICY "Anyone can read games"
  ON games FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Operators can create games"
  ON games FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'operator')
    )
  );

CREATE POLICY "Operators can update own games"
  ON games FOR UPDATE
  TO authenticated
  USING (
    operator_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for cartelas table
CREATE POLICY "Users can read own cartelas"
  ON cartelas FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'operator')
    )
  );

CREATE POLICY "Users can create own cartelas"
  ON cartelas FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own cartelas"
  ON cartelas FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'operator')
    )
  );

-- RLS Policies for transactions table
CREATE POLICY "Users can read own transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "System can create transactions"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can update transactions"
  ON transactions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for drawn_numbers table
CREATE POLICY "Anyone can read drawn numbers"
  ON drawn_numbers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Operators can manage drawn numbers"
  ON drawn_numbers FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM games g
      JOIN users u ON g.operator_id = u.id
      WHERE g.id = game_id AND (g.operator_id = auth.uid() OR u.role = 'admin')
    )
  );

-- RLS Policies for game_prizes table
CREATE POLICY "Anyone can read game prizes"
  ON game_prizes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Operators can manage game prizes"
  ON game_prizes FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM games g
      JOIN users u ON g.operator_id = u.id
      WHERE g.id = game_id AND (g.operator_id = auth.uid() OR u.role = 'admin')
    )
  );

-- RLS Policies for game_winners table
CREATE POLICY "Anyone can read game winners"
  ON game_winners FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Operators can manage game winners"
  ON game_winners FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM games g
      JOIN users u ON g.operator_id = u.id
      WHERE g.id = game_id AND (g.operator_id = auth.uid() OR u.role = 'admin')
    )
  );

-- Functions for game management
CREATE OR REPLACE FUNCTION generate_game_id()
RETURNS text AS $$
BEGIN
  RETURN 'GAME_' || extract(epoch from now())::bigint || '_' || substr(md5(random()::text), 1, 9);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_cartela_id()
RETURNS text AS $$
BEGIN
  RETURN 'CARD_' || extract(epoch from now())::bigint || '_' || substr(md5(random()::text), 1, 9);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_transaction_id()
RETURNS text AS $$
BEGIN
  RETURN 'TXN_' || extract(epoch from now())::bigint || '_' || substr(md5(random()::text), 1, 9);
END;
$$ LANGUAGE plpgsql;

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_games_updated_at BEFORE UPDATE ON games
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cartelas_updated_at BEFORE UPDATE ON cartelas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate default game_id
CREATE OR REPLACE FUNCTION set_default_game_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.game_id IS NULL OR NEW.game_id = '' THEN
    NEW.game_id = generate_game_id();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_game_id_trigger BEFORE INSERT ON games
  FOR EACH ROW EXECUTE FUNCTION set_default_game_id();

-- Function to generate default cartela_id
CREATE OR REPLACE FUNCTION set_default_cartela_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.cartela_id IS NULL OR NEW.cartela_id = '' THEN
    NEW.cartela_id = generate_cartela_id();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_cartela_id_trigger BEFORE INSERT ON cartelas
  FOR EACH ROW EXECUTE FUNCTION set_default_cartela_id();

-- Function to generate default transaction_id
CREATE OR REPLACE FUNCTION set_default_transaction_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.transaction_id IS NULL OR NEW.transaction_id = '' THEN
    NEW.transaction_id = generate_transaction_id();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_transaction_id_trigger BEFORE INSERT ON transactions
  FOR EACH ROW EXECUTE FUNCTION set_default_transaction_id();