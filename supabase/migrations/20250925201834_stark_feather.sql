/*
  # Create sample transactions

  1. New Data
    - Insert sample transactions for testing
    - Different transaction types
    - Proper relationships with users and games

  2. Sample Transactions
    - Purchase transactions for cartelas
    - Prize transactions for winners
    - Deposit transactions for users
*/

-- Insert sample transactions
DO $$
DECLARE
  player1_id uuid;
  player2_id uuid;
  player3_id uuid;
  finished_game_id uuid;
  active_game_id uuid;
BEGIN
  -- Get user IDs
  SELECT id INTO player1_id FROM users WHERE username = 'player1' LIMIT 1;
  SELECT id INTO player2_id FROM users WHERE username = 'player2' LIMIT 1;
  SELECT id INTO player3_id FROM users WHERE username = 'player3' LIMIT 1;

  -- Get game IDs
  SELECT id INTO finished_game_id FROM games WHERE title = 'Quick Play Bingo' LIMIT 1;
  SELECT id INTO active_game_id FROM games WHERE title = 'Weekend Special' LIMIT 1;

  -- Purchase transactions for finished game
  INSERT INTO transactions (
    user_id,
    game_id,
    type,
    amount,
    currency,
    description,
    status,
    payment_method,
    processed_at
  ) VALUES 
  (
    player1_id,
    finished_game_id,
    'purchase',
    5.00,
    'USD',
    'Purchase cartela for game: Quick Play Bingo',
    'completed',
    'credit_card',
    now() - interval '3 hours'
  ),
  (
    player2_id,
    finished_game_id,
    'purchase',
    5.00,
    'USD',
    'Purchase cartela for game: Quick Play Bingo',
    'completed',
    'credit_card',
    now() - interval '3 hours'
  ),
  (
    player3_id,
    finished_game_id,
    'purchase',
    10.00,
    'USD',
    'Purchase 2 cartelas for game: Quick Play Bingo',
    'completed',
    'credit_card',
    now() - interval '3 hours'
  );

  -- Purchase transactions for active game
  INSERT INTO transactions (
    user_id,
    game_id,
    type,
    amount,
    currency,
    description,
    status,
    payment_method,
    processed_at
  ) VALUES 
  (
    player1_id,
    active_game_id,
    'purchase',
    15.00,
    'USD',
    'Purchase cartela for game: Weekend Special',
    'completed',
    'credit_card',
    now() - interval '50 minutes'
  ),
  (
    player2_id,
    active_game_id,
    'purchase',
    30.00,
    'USD',
    'Purchase 2 cartelas for game: Weekend Special',
    'completed',
    'credit_card',
    now() - interval '50 minutes'
  ),
  (
    player3_id,
    active_game_id,
    'purchase',
    45.00,
    'USD',
    'Purchase 3 cartelas for game: Weekend Special',
    'completed',
    'credit_card',
    now() - interval '50 minutes'
  );

  -- Prize transactions for finished game
  INSERT INTO transactions (
    user_id,
    game_id,
    type,
    amount,
    currency,
    description,
    status,
    processed_at
  ) VALUES 
  (
    player1_id,
    finished_game_id,
    'prize',
    110.25,
    'USD',
    'Prize winnings from game: Quick Play Bingo',
    'completed',
    now() - interval '2.5 hours'
  ),
  (
    player2_id,
    finished_game_id,
    'prize',
    47.25,
    'USD',
    'Prize winnings from game: Quick Play Bingo',
    'completed',
    now() - interval '2.5 hours'
  );

  -- Deposit transactions
  INSERT INTO transactions (
    user_id,
    type,
    amount,
    currency,
    description,
    status,
    payment_method,
    processed_at
  ) VALUES 
  (
    player1_id,
    'deposit',
    100.00,
    'USD',
    'Account deposit',
    'completed',
    'credit_card',
    now() - interval '1 day'
  ),
  (
    player2_id,
    'deposit',
    150.00,
    'USD',
    'Account deposit',
    'completed',
    'credit_card',
    now() - interval '2 days'
  ),
  (
    player3_id,
    'deposit',
    200.00,
    'USD',
    'Account deposit',
    'completed',
    'credit_card',
    now() - interval '3 days'
  );
END $$;