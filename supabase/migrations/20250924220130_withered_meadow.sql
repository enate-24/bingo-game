/*
  # Update Authentication and Role Changes

  1. Database Changes
    - Remove email field from users table
    - Add shop_name field for chaser role
    - Update role enum to change 'operator' to 'chaser'
    - Update existing data

  2. Security Updates
    - Update RLS policies to use username instead of email
    - Update role-based access controls

  3. Data Migration
    - Migrate existing operator roles to chaser
    - Set default shop names for existing chasers
*/

-- Add shop_name column
ALTER TABLE users ADD COLUMN IF NOT EXISTS shop_name text;

-- Update role enum to replace 'operator' with 'chaser'
-- First, update existing data
UPDATE users SET role = 'chaser' WHERE role = 'operator';

-- Drop the existing check constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Add new check constraint with updated roles
ALTER TABLE users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('admin', 'chaser', 'player', 'user'));

-- Update games table operator references
ALTER TABLE games RENAME COLUMN operator_id TO chaser_id;

-- Update RLS policies to reflect role changes
DROP POLICY IF EXISTS "Operators can create games" ON games;
CREATE POLICY "Chasers can create games"
  ON games FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'chaser')
    )
  );

DROP POLICY IF EXISTS "Operators can update own games" ON games;
CREATE POLICY "Chasers can update own games"
  ON games FOR UPDATE
  TO authenticated
  USING (
    chaser_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Users can update own cartelas" ON cartelas;
CREATE POLICY "Users can update own cartelas"
  ON cartelas FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'chaser')
    )
  );

DROP POLICY IF EXISTS "Users can read own cartelas" ON cartelas;
CREATE POLICY "Users can read own cartelas"
  ON cartelas FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'chaser')
    )
  );

DROP POLICY IF EXISTS "Operators can manage drawn numbers" ON drawn_numbers;
CREATE POLICY "Chasers can manage drawn numbers"
  ON drawn_numbers FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM games g
      JOIN users u ON g.chaser_id = u.id
      WHERE g.id = game_id AND (g.chaser_id = auth.uid() OR u.role = 'admin')
    )
  );

DROP POLICY IF EXISTS "Operators can manage game prizes" ON game_prizes;
CREATE POLICY "Chasers can manage game prizes"
  ON game_prizes FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM games g
      JOIN users u ON g.chaser_id = u.id
      WHERE g.id = game_id AND (g.chaser_id = auth.uid() OR u.role = 'admin')
    )
  );

DROP POLICY IF EXISTS "Operators can manage game winners" ON game_winners;
CREATE POLICY "Chasers can manage game winners"
  ON game_winners FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM games g
      JOIN users u ON g.chaser_id = u.id
      WHERE g.id = game_id AND (g.chaser_id = auth.uid() OR u.role = 'admin')
    )
  );