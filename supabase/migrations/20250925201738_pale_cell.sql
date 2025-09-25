/*
  # Create cartelas table

  1. New Tables
    - `cartelas`
      - `id` (uuid, primary key)
      - `cartela_id` (text, unique identifier)
      - `game_id` (uuid, foreign key to games)
      - `user_id` (uuid, foreign key to users)
      - `numbers` (jsonb, bingo numbers organized by columns)
      - `marked_numbers` (jsonb array)
      - `free_space` (boolean, center space)
      - `status` (text, enum: active, winner, expired)
      - `purchase_price` (decimal)
      - `purchased_at` (timestamp)
      - `winning_details` (jsonb)
      - `is_auto_play` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `cartelas` table
    - Add policies for users to manage their own cartelas
*/

CREATE TABLE IF NOT EXISTS cartelas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cartela_id text UNIQUE NOT NULL DEFAULT 'CARD_' || extract(epoch from now()) || '_' || substr(gen_random_uuid()::text, 1, 8),
  game_id uuid REFERENCES games(id) NOT NULL,
  user_id uuid REFERENCES users(id) NOT NULL,
  numbers jsonb NOT NULL,
  marked_numbers jsonb DEFAULT '[]',
  free_space boolean DEFAULT true,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'winner', 'expired')),
  purchase_price decimal(10,2) NOT NULL CHECK (purchase_price >= 0.01),
  purchased_at timestamptz DEFAULT now(),
  winning_details jsonb DEFAULT '{
    "position": null,
    "prizeAmount": 0,
    "winningPattern": null,
    "winningNumbers": [],
    "verifiedAt": null
  }',
  is_auto_play boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE cartelas ENABLE ROW LEVEL SECURITY;

-- Users can read their own cartelas
CREATE POLICY "Users can read own cartelas"
  ON cartelas
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can insert their own cartelas
CREATE POLICY "Users can insert own cartelas"
  ON cartelas
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can update their own cartelas
CREATE POLICY "Users can update own cartelas"
  ON cartelas
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Admins and chasers can read cartelas for their games
CREATE POLICY "Admins and chasers can read game cartelas"
  ON cartelas
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    ) OR
    EXISTS (
      SELECT 1 FROM games g
      JOIN users u ON g.chaser = u.id
      WHERE g.id = cartelas.game_id AND u.id = auth.uid()
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_cartelas_cartela_id ON cartelas(cartela_id);
CREATE INDEX IF NOT EXISTS idx_cartelas_game_id ON cartelas(game_id);
CREATE INDEX IF NOT EXISTS idx_cartelas_user_id ON cartelas(user_id);
CREATE INDEX IF NOT EXISTS idx_cartelas_status ON cartelas(status);
CREATE INDEX IF NOT EXISTS idx_cartelas_purchased_at ON cartelas(purchased_at);

-- Create trigger for updated_at
CREATE TRIGGER update_cartelas_updated_at
  BEFORE UPDATE ON cartelas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();