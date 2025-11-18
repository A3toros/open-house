-- Create a view that combines all test types for a teacher
-- This replaces the complex UNION query in delete-test-data.js

CREATE OR REPLACE VIEW all_teacher_tests_view AS
SELECT 
  'multiple_choice' as test_type,
  id,
  test_name,
  created_at,
  teacher_id
FROM multiple_choice_tests

UNION ALL

SELECT 
  'true_false' as test_type,
  id,
  test_name,
  created_at,
  teacher_id
FROM true_false_tests

UNION ALL

SELECT 
  'input' as test_type,
  id,
  test_name,
  created_at,
  teacher_id
FROM input_tests

UNION ALL

SELECT 
  'matching' as test_type,
  id,
  test_name,
  created_at,
  teacher_id
FROM matching_type_tests

UNION ALL

SELECT 
  'word_matching' as test_type,
  id,
  test_name,
  created_at,
  teacher_id
FROM word_matching_tests

UNION ALL

SELECT 
  'drawing' as test_type,
  id,
  test_name,
  created_at,
  teacher_id
FROM drawing_tests

UNION ALL

SELECT 
  'fill_blanks' as test_type,
  id,
  test_name,
  created_at,
  teacher_id
FROM fill_blanks_tests

UNION ALL

SELECT 
  'speaking' as test_type,
  id,
  test_name,
  created_at,
  teacher_id
FROM speaking_tests;
