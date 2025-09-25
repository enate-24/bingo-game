/*
  # Create transactions table

  1. New Tables
    - `transactions`
      - `id` (uuid, primary key)
      - `transaction_id` (text, unique identifier)
      - `user_id` (uuid, foreign key to users)
      - `game_id` (uuid, foreign key to games, optional)
      - `cartela_id` (uuid, foreign key to cartelas, optional)
      - `type` (text, enum: purchase, prize, refund, deposit, withdrawal)
      - `amount` (decimal)
      - `currency` (text)
      - `status` (text, enum: pending, completed, failed, cancelled, refunded)
      - `description` (text)
      - `payment_method` (text)
      - `payment_details` (jsonb)
      - `balance_before` (decimal)
      - `balance_after` (decimal)
      - `metadata` (jsonb)
      - `processed_by` (uuid, foreign key to users, optional)
      - `processed_at` (timestamp)
      - `failure_reason` (text)
      - `refund_details` (jsonb)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `transactions` table
    - Add policies for users to read their own transactions
    - Add policies for admins to read all transactions
*/

CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id text UNIQUE NOT NULL DEFAULT 'TXN_' || extract(epoch from now()) || '_' || substr(gen_random_uuid()::text, 1, 8),
  user_id uuid REFERENCES users(id) NOT NULL,
  game_id uuid REFERENCES games(id),
  cartela_id uuid REFERENCES cartelas(id),
  type text NOT NULL CHECK (type IN ('purchase', 'prize', 'refund', 'deposit', 'withdrawal')),
  amount decimal(10,2) NOT NULL CHECK (amount >= 0.01),
  currency text NOT NULL DEFAULT 'USD' CHECK (currency IN ('USD', 'EUR', 'GBP', 'KES', 'NGN')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled', 'refunded')),
  description text NOT NULL,
  payment_method text DEFAULT 'wallet' CHECK (payment_method IN ('credit_card', 'debit_card', 'paypal', 'bank_transfer', 'mobile_money', 'cash', 'wallet')),
  payment_details jsonb DEFAULT '{}',
  balance_before decimal(10,2) DEFAULT 0,
  balance_after decimal(10,2) DEFAULT 0,
  metadata jsonb DEFAULT '{}',
  processed_by uuid REFERENCES users(id),
  processed_at timestamptz,
  failure_reason text,
  refund_details jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Users can read their own transactions
CREATE POLICY "Users can read own transactions"
  ON transactions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can insert their own transactions
CREATE POLICY "Users can insert own transactions"
  ON transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Admins can read all transactions
CREATE POLICY "Admins can read all transactions"
  ON transactions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update all transactions
CREATE POLICY "Admins can update all transactions"
  ON transactions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can insert transactions
CREATE POLICY "Admins can insert transactions"
  ON transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_transactions_transaction_id ON transactions(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_game_id ON transactions(game_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_payment_method ON transactions(payment_method);

-- Create trigger for updated_at
CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();