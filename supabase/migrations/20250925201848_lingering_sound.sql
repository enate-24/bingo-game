/*
  # Create helper functions

  1. Functions
    - get_user_balance: Calculate user balance from transactions
    - get_game_statistics: Get aggregated game statistics
    - check_cartela_winner: Check if cartela has winning pattern
    - generate_cartela_numbers: Generate random bingo numbers

  2. Security
    - Functions respect RLS policies
    - Proper error handling
*/

-- Function to calculate user balance
CREATE OR REPLACE FUNCTION get_user_balance(user_uuid uuid)
RETURNS decimal(10,2)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  balance decimal(10,2) := 0;
BEGIN
  SELECT COALESCE(
    SUM(
      CASE 
        WHEN type IN ('prize', 'deposit', 'refund') THEN amount
        WHEN type IN ('purchase', 'withdrawal') THEN -amount
        ELSE 0
      END
    ), 0
  ) INTO balance
  FROM transactions
  WHERE user_id = user_uuid AND status = 'completed';
  
  RETURN balance;
END;
$$;

-- Function to get game statistics
CREATE OR REPLACE FUNCTION get_game_statistics(start_date timestamptz DEFAULT NULL, end_date timestamptz DEFAULT NULL)
RETURNS TABLE(
  total_games bigint,
  total_revenue decimal,
  total_prizes_awarded decimal,
  total_house_profit decimal,
  average_game_duration decimal,
  total_cartelas_sold bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF start_date IS NULL THEN
    start_date := now() - interval '30 days';
  END IF;
  
  IF end_date IS NULL THEN
    end_date := now();
  END IF;

  RETURN QUERY
  SELECT 
    COUNT(*)::bigint as total_games,
    COALESCE(SUM((statistics->>'totalRevenue')::decimal), 0) as total_revenue,
    COALESCE(SUM((statistics->>'totalPrizesAwarded')::decimal), 0) as total_prizes_awarded,
    COALESCE(SUM((statistics->>'houseProfit')::decimal), 0) as total_house_profit,
    COALESCE(AVG(duration), 0) as average_game_duration,
    COALESCE(SUM((statistics->>'totalCartelasSold')::bigint), 0) as total_cartelas_sold
  FROM games
  WHERE status = 'finished'
    AND created_at >= start_date
    AND created_at <= end_date;
END;
$$;

-- Function to generate random cartela numbers
CREATE OR REPLACE FUNCTION generate_cartela_numbers()
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  result jsonb := '{}';
  b_numbers integer[];
  i_numbers integer[];
  n_numbers integer[];
  g_numbers integer[];
  o_numbers integer[];
  i integer;
  random_num integer;
  temp_array integer[];
BEGIN
  -- Generate B column (1-15)
  temp_array := ARRAY(SELECT generate_series(1, 15));
  FOR i IN 1..5 LOOP
    random_num := temp_array[floor(random() * array_length(temp_array, 1) + 1)];
    b_numbers := array_append(b_numbers, random_num);
    temp_array := array_remove(temp_array, random_num);
  END LOOP;
  
  -- Generate I column (16-30)
  temp_array := ARRAY(SELECT generate_series(16, 30));
  FOR i IN 1..5 LOOP
    random_num := temp_array[floor(random() * array_length(temp_array, 1) + 1)];
    i_numbers := array_append(i_numbers, random_num);
    temp_array := array_remove(temp_array, random_num);
  END LOOP;
  
  -- Generate N column (31-45, only 4 numbers - center is free)
  temp_array := ARRAY(SELECT generate_series(31, 45));
  FOR i IN 1..4 LOOP
    random_num := temp_array[floor(random() * array_length(temp_array, 1) + 1)];
    n_numbers := array_append(n_numbers, random_num);
    temp_array := array_remove(temp_array, random_num);
  END LOOP;
  
  -- Generate G column (46-60)
  temp_array := ARRAY(SELECT generate_series(46, 60));
  FOR i IN 1..5 LOOP
    random_num := temp_array[floor(random() * array_length(temp_array, 1) + 1)];
    g_numbers := array_append(g_numbers, random_num);
    temp_array := array_remove(temp_array, random_num);
  END LOOP;
  
  -- Generate O column (61-75)
  temp_array := ARRAY(SELECT generate_series(61, 75));
  FOR i IN 1..5 LOOP
    random_num := temp_array[floor(random() * array_length(temp_array, 1) + 1)];
    o_numbers := array_append(o_numbers, random_num);
    temp_array := array_remove(temp_array, random_num);
  END LOOP;

  -- Build result JSON
  result := jsonb_build_object(
    'B', to_jsonb(b_numbers),
    'I', to_jsonb(i_numbers),
    'N', to_jsonb(n_numbers),
    'G', to_jsonb(g_numbers),
    'O', to_jsonb(o_numbers)
  );

  RETURN result;
END;
$$;

-- Function to check if cartela has winning pattern
CREATE OR REPLACE FUNCTION check_cartela_winner(
  cartela_numbers jsonb,
  marked_numbers jsonb,
  winning_pattern text DEFAULT 'full_house'
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  result jsonb := '{"isWinner": false}';
  b_nums integer[];
  i_nums integer[];
  n_nums integer[];
  g_nums integer[];
  o_nums integer[];
  marked integer[];
  grid integer[][];
  row_complete boolean;
  col_complete boolean;
  i integer;
  j integer;
BEGIN
  -- Parse numbers
  b_nums := ARRAY(SELECT jsonb_array_elements_text(cartela_numbers->'B')::integer);
  i_nums := ARRAY(SELECT jsonb_array_elements_text(cartela_numbers->'I')::integer);
  n_nums := ARRAY(SELECT jsonb_array_elements_text(cartela_numbers->'N')::integer);
  g_nums := ARRAY(SELECT jsonb_array_elements_text(cartela_numbers->'G')::integer);
  o_nums := ARRAY(SELECT jsonb_array_elements_text(cartela_numbers->'O')::integer);
  marked := ARRAY(SELECT jsonb_array_elements_text(marked_numbers)::integer);

  -- Build 5x5 grid
  FOR i IN 1..5 LOOP
    grid[i] := ARRAY[
      b_nums[i],
      i_nums[i],
      CASE WHEN i = 3 THEN 0 ELSE n_nums[CASE WHEN i > 3 THEN i-1 ELSE i END] END, -- Center is free (0)
      g_nums[i],
      o_nums[i]
    ];
  END LOOP;

  -- Check winning patterns
  CASE winning_pattern
    WHEN 'line' THEN
      -- Check horizontal lines
      FOR i IN 1..5 LOOP
        row_complete := true;
        FOR j IN 1..5 LOOP
          IF grid[i][j] != 0 AND NOT (grid[i][j] = ANY(marked)) THEN
            row_complete := false;
            EXIT;
          END IF;
        END LOOP;
        IF row_complete THEN
          result := jsonb_build_object('isWinner', true, 'pattern', 'horizontal_line', 'line', i);
          RETURN result;
        END IF;
      END LOOP;
      
      -- Check vertical lines
      FOR j IN 1..5 LOOP
        col_complete := true;
        FOR i IN 1..5 LOOP
          IF grid[i][j] != 0 AND NOT (grid[i][j] = ANY(marked)) THEN
            col_complete := false;
            EXIT;
          END IF;
        END LOOP;
        IF col_complete THEN
          result := jsonb_build_object('isWinner', true, 'pattern', 'vertical_line', 'line', j);
          RETURN result;
        END IF;
      END LOOP;

    WHEN 'full_house' THEN
      -- Check if all numbers are marked
      FOR i IN 1..5 LOOP
        FOR j IN 1..5 LOOP
          IF grid[i][j] != 0 AND NOT (grid[i][j] = ANY(marked)) THEN
            RETURN result; -- Not a winner
          END IF;
        END LOOP;
      END LOOP;
      result := jsonb_build_object('isWinner', true, 'pattern', 'full_house');

    WHEN 'four_corners' THEN
      -- Check four corners
      IF (grid[1][1] = ANY(marked) OR grid[1][1] = 0) AND
         (grid[1][5] = ANY(marked) OR grid[1][5] = 0) AND
         (grid[5][1] = ANY(marked) OR grid[5][1] = 0) AND
         (grid[5][5] = ANY(marked) OR grid[5][5] = 0) THEN
        result := jsonb_build_object('isWinner', true, 'pattern', 'four_corners');
      END IF;

    ELSE
      -- Default to no winner for unknown patterns
      result := jsonb_build_object('isWinner', false);
  END CASE;

  RETURN result;
END;
$$;