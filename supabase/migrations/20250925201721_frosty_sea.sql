/*
  # Create games table

  1. New Tables
    - `games`
      - `id` (uuid, primary key)
      - `game_id` (text, unique identifier)
      - `title` (text, game title)
      - `description` (text, optional)
      - `game_type` (text, enum: traditional, speed, pattern, blackout)
      - `status` (text, enum: waiting, active, paused, finished, cancelled)
      - `max_players` (integer)
      - `current_players` (integer)
      - `cartela_price` (decimal)
      - `prize_pool` (decimal)
      - `prizes` (jsonb array)
      - `drawn_numbers` (jsonb array)
      - `winning_pattern` (text)
      - `custom_pattern` (jsonb, optional)
      - `winners` (jsonb array)
      - `game_settings` (jsonb)
      - `chaser` (uuid, foreign key to users)
      - `scheduled_start_time` (timestamp)
      - `actual_start_time` (timestamp)
      - `end_time` (timestamp)
      - `duration` (integer, in minutes)
      - `statistics` (jsonb)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `games` table
    - Add policies for different user roles
*/

CREATE TABLE IF NOT EXISTS games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id text UNIQUE NOT NULL DEFAULT 'GAME_' || extract(epoch from now()) || '_' || substr(gen_random_uuid()::text, 1, 8),
  title text NOT NULL,
  description text,
  game_type text NOT NULL DEFAULT 'traditional' CHECK (game_type IN ('traditional', 'speed', 'pattern', 'blackout')),
  status text NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'paused', 'finished', 'cancelled')),
  max_players integer NOT NULL DEFAULT 100 CHECK (max_players >= 1 AND max_players <= 500),
  current_players integer NOT NULL DEFAULT 0,
  cartela_price decimal(10,2) NOT NULL CHECK (cartela_price >= 0.01),
  prize_pool decimal(10,2) NOT NULL DEFAULT 0,
  prizes jsonb DEFAULT '[]',
  drawn_numbers jsonb DEFAULT '[]',
  winning_pattern text NOT NULL DEFAULT 'full_house' CHECK (winning_pattern IN ('line', 'full_house', 'four_corners', 'cross', 'custom')),
  custom_pattern jsonb,
  winners jsonb DEFAULT '[]',
  game_settings jsonb DEFAULT '{
    "autoCallInterval": 5000,
    "allowLateBuying": false,
    "maxCartelasPerPlayer": 10
  }',
  chaser uuid REFERENCES users(id) NOT NULL,
  scheduled_start_time timestamptz,
  actual_start_time timestamptz,
  end_time timestamptz,
  duration integer,
  statistics jsonb DEFAULT '{
    "totalCartelasSold": 0,
    "totalRevenue": 0,
    "totalPrizesAwarded": 0,
    "houseProfit": 0
  }',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE games ENABLE ROW LEVEL SECURITY;

-- Anyone can read games (public information)
CREATE POLICY "Anyone can read games"
  ON games
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- Chasers can create games
CREATE POLICY "Chasers can create games"
  ON games
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'chaser')
    )
  );

-- Chasers can update their own games, admins can update all
CREATE POLICY "Chasers can update own games"
  ON games
  FOR UPDATE
  TO authenticated
  USING (
    chaser = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Only admins can delete games
CREATE POLICY "Admins can delete games"
  ON games
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_games_game_id ON games(game_id);
CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);
CREATE INDEX IF NOT EXISTS idx_games_chaser ON games(chaser);
CREATE INDEX IF NOT EXISTS idx_games_created_at ON games(created_at);
CREATE INDEX IF NOT EXISTS idx_games_scheduled_start ON games(scheduled_start_time);

-- Create trigger for updated_at
CREATE TRIGGER update_games_updated_at
  BEFORE UPDATE ON games
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();