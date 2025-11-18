-- ========================================
-- FIX TEST PERFORMANCE VIEW - SINGLE DOT PER TEST
-- ========================================
-- 
-- This SQL file fixes the Test Performance Overview to show exactly 1 dot per test
-- instead of multiple dots for each student attempt.
--
-- Problem: Current view groups by submitted_at, creating separate data points
-- for each student attempt, resulting in multiple dots for the same test.
--
-- Solution: Group by test_id + test_type, use first submission date,
-- and show average performance across all student attempts.

-- ========================================
-- DROP EXISTING VIEW
-- ========================================

DROP VIEW IF EXISTS test_performance_by_test;

-- ========================================
-- CREATE FIXED VIEW
-- ========================================

CREATE OR REPLACE VIEW test_performance_by_test AS
WITH all_test_results AS (
    -- Union all test result tables with test_type identifier
    SELECT 
        teacher_id, test_id, test_name, percentage, submitted_at, 
        academic_period_id, grade, class, student_id, 
        'multiple_choice' as test_type
    FROM multiple_choice_test_results 
    WHERE is_completed = true
    
    UNION ALL
    
    SELECT 
        teacher_id, test_id, test_name, percentage, submitted_at, 
        academic_period_id, grade, class, student_id, 
        'true_false' as test_type
    FROM true_false_test_results 
    WHERE is_completed = true
    
    UNION ALL
    
    SELECT 
        teacher_id, test_id, test_name, percentage, submitted_at, 
        academic_period_id, grade, class, student_id, 
        'input' as test_type
    FROM input_test_results 
    WHERE is_completed = true
    
    UNION ALL
    
    SELECT 
        teacher_id, test_id, test_name, percentage, submitted_at, 
        academic_period_id, grade, class, student_id, 
        'matching' as test_type
    FROM matching_type_test_results 
    WHERE is_completed = true
    
    UNION ALL
    
    SELECT 
        teacher_id, test_id, test_name, percentage, submitted_at, 
        academic_period_id, grade, class, student_id, 
        'word_matching' as test_type
    FROM word_matching_test_results 
    WHERE is_completed = true
    
    UNION ALL
    
    SELECT 
        teacher_id, test_id, test_name, percentage, submitted_at, 
        academic_period_id, grade, class, student_id, 
        'drawing' as test_type
    FROM drawing_test_results 
    WHERE is_completed = true
    
    UNION ALL
    
    SELECT 
        teacher_id, test_id, test_name, percentage, submitted_at, 
        academic_period_id, grade, class, student_id, 
        'fill_blanks' as test_type
    FROM fill_blanks_test_results 
    WHERE is_completed = true
    
    UNION ALL
    
    SELECT 
        teacher_id, test_id, test_name, percentage, submitted_at, 
        academic_period_id, grade, class, student_id, 
        'speaking' as test_type
    FROM speaking_test_results 
    WHERE is_completed = true
)
SELECT 
    teacher_id, 
    test_id, 
    test_name, 
    test_type,
    AVG(percentage) as average_score, 
    COUNT(DISTINCT student_id) as total_students,
    MIN(submitted_at) as submitted_at,  -- First submission date
    academic_period_id, 
    grade, 
    class
FROM all_test_results
GROUP BY 
    teacher_id, 
    test_id, 
    test_name, 
    test_type, 
    academic_period_id, 
    grade, 
    class
-- ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
-- KEY FIX: Group by test_id + test_type, NOT submitted_at!
-- This ensures exactly 1 dot per test regardless of student attempts
ORDER BY submitted_at ASC;

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Check that the view works correctly
-- This should show one row per test, not multiple rows for the same test
SELECT 
    teacher_id, 
    test_id, 
    test_name, 
    test_type,
    average_score,
    total_students,
    submitted_at
FROM test_performance_by_test 
ORDER BY teacher_id, submitted_at;

-- ========================================
-- EXPECTED RESULTS
-- ========================================
--
-- Before Fix:
-- - Test A (ID: 1) → Multiple dots (one for each student attempt)
-- - Test B (ID: 2) → Multiple dots (one for each student attempt)
-- - Result: Many dots for few tests
--
-- After Fix:
-- - Test A (ID: 1) → 1 dot (first submission date, average performance)
-- - Test B (ID: 2) → 1 dot (first submission date, average performance)
-- - Result: 1 dot per test, clean timeline
--
-- ========================================
-- NOTES
-- ========================================
--
-- 1. This view groups by test_id + test_type to ensure one dot per test
-- 2. Uses MIN(submitted_at) to get the first submission date for timeline
-- 3. Uses AVG(percentage) to show average performance across all attempts
-- 4. Uses COUNT(DISTINCT student_id) to count unique students who took the test
-- 5. Removes submitted_at from GROUP BY to prevent multiple data points
--
-- ========================================
-- TESTING
-- ========================================
--
-- To test this fix:
-- 1. Run this SQL file to update the view
-- 2. Check the Test Performance Overview in the teacher dashboard
-- 3. Verify that each test appears as exactly 1 dot
-- 4. Verify that the timeline shows first submission dates
-- 5. Verify that performance shows average scores across all attempts
