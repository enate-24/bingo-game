/*
  # Create sample games

  1. New Data
    - Insert sample games for testing
    - Different game types and statuses
    - Proper relationships with chasers

  2. Sample Games
    - Evening Jackpot Bingo (waiting)
    - Quick Play Bingo (finished)
    - Weekend Special (active)
*/

-- Insert sample games
DO $$
DECLARE
  chaser_id uuid;
  admin_id uuid;
BEGIN
  -- Get chaser and admin IDs
  SELECT id INTO chaser_id FROM users WHERE username = 'chaser1' LIMIT 1;
  SELECT id INTO admin_id FROM users WHERE username = 'admin' LIMIT 1;

  -- Insert Evening Jackpot Bingo
  INSERT INTO games (
    title,
    description,
    game_type,
    status,
    max_players,
    cartela_price,
    prizes,
    winning_pattern,
    chaser,
    scheduled_start_time
  ) VALUES (
    'Evening Jackpot Bingo',
    'Join our evening jackpot game with amazing prizes!',
    'traditional',
    'waiting',
    100,
    10.00,
    '[
      {"position": "1st", "percentage": 50, "amount": 0},
      {"position": "2nd", "percentage": 30, "amount": 0},
      {"position": "3rd", "percentage": 15, "amount": 0},
      {"position": "consolation", "percentage": 5, "amount": 0}
    ]',
    'full_house',
    chaser_id,
    now() + interval '2 hours'
  );

  -- Insert Quick Play Bingo (finished game)
  INSERT INTO games (
    title,
    description,
    game_type,
    status,
    max_players,
    current_players,
    cartela_price,
    prize_pool,
    prizes,
    winning_pattern,
    chaser,
    actual_start_time,
    end_time,
    duration,
    statistics,
    drawn_numbers
  ) VALUES (
    'Quick Play Bingo',
    'Fast-paced bingo game for quick wins!',
    'speed',
    'finished',
    50,
    35,
    5.00,
    157.50,
    '[
      {"position": "1st", "percentage": 70, "amount": 110.25},
      {"position": "2nd", "percentage": 30, "amount": 47.25}
    ]',
    'line',
    admin_id,
    now() - interval '3 hours',
    now() - interval '2.5 hours',
    30,
    '{
      "totalCartelasSold": 45,
      "totalRevenue": 225.00,
      "totalPrizesAwarded": 157.50,
      "houseProfit": 67.50
    }',
    '[
      {"number": 7, "ballLetter": "B", "drawnAt": "2024-01-15T10:00:00Z"},
      {"number": 23, "ballLetter": "I", "drawnAt": "2024-01-15T10:02:00Z"},
      {"number": 34, "ballLetter": "N", "drawnAt": "2024-01-15T10:04:00Z"},
      {"number": 52, "ballLetter": "G", "drawnAt": "2024-01-15T10:06:00Z"},
      {"number": 68, "ballLetter": "O", "drawnAt": "2024-01-15T10:08:00Z"}
    ]'
  );

  -- Insert Weekend Special (active game)
  INSERT INTO games (
    title,
    description,
    game_type,
    status,
    max_players,
    current_players,
    cartela_price,
    prize_pool,
    prizes,
    winning_pattern,
    chaser,
    actual_start_time,
    statistics,
    drawn_numbers
  ) VALUES (
    'Weekend Special',
    'Special weekend game with bonus prizes!',
    'traditional',
    'active',
    200,
    87,
    15.00,
    1175.25,
    '[
      {"position": "1st", "percentage": 50, "amount": 587.63},
      {"position": "2nd", "percentage": 30, "amount": 352.58},
      {"position": "3rd", "percentage": 20, "amount": 235.05}
    ]',
    'full_house',
    admin_id,
    now() - interval '45 minutes',
    '{
      "totalCartelasSold": 95,
      "totalRevenue": 1425.00,
      "totalPrizesAwarded": 0,
      "houseProfit": 249.75
    }',
    '[
      {"number": 12, "ballLetter": "B", "drawnAt": "2024-01-15T14:00:00Z"},
      {"number": 28, "ballLetter": "I", "drawnAt": "2024-01-15T14:02:00Z"},
      {"number": 45, "ballLetter": "N", "drawnAt": "2024-01-15T14:04:00Z"},
      {"number": 61, "ballLetter": "G", "drawnAt": "2024-01-15T14:06:00Z"},
      {"number": 74, "ballLetter": "O", "drawnAt": "2024-01-15T14:08:00Z"}
    ]'
  );
END $$;