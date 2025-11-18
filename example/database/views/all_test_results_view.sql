-- ========================================
-- ALL TEST RESULTS VIEW
-- Comprehensive view for get-test-results.js function
-- Combines all test result types with user and test information
-- 
-- ⚠️ CRITICAL: Follow the EXACT original Neon SQL structure and logic
-- Do NOT modify the data structure or add/remove fields without checking original
-- This view must match the original get-test-results.js SQL queries exactly
-- ========================================

CREATE OR REPLACE VIEW all_test_results_view AS
-- Multiple Choice Test Results
SELECT 
    'multiple_choice' as test_type,
    mcr.id,
    mcr.test_id,
    mcr.student_id,
    COALESCE(mcr.best_retest_score, mcr.score) as score,
    COALESCE(mcr.best_retest_max_score, mcr.max_score) as max_score,
    mcr.created_at as submitted_at,
    mcr.name as student_name,
    mcr.surname as student_surname,
    mcr.grade as student_grade,
    mcr.class as student_class,
    mcr.number as student_number,
    mcr.nickname as student_nickname,
    mcr.test_name,
    mcr.percentage,
    mcr.time_taken,
    mcr.started_at,
    mcr.submitted_at as result_submitted_at,
    mcr.caught_cheating,
    mcr.visibility_change_times,
    mcr.is_completed,
    mcr.retest_offered,
    mcr.retest_assignment_id,
    mcr.attempt_number,
    mcr.best_retest_score,
    mcr.best_retest_max_score,
    mcr.best_retest_percentage,
    mcr.academic_period_id
FROM multiple_choice_test_results mcr

UNION ALL

-- True/False Test Results
SELECT 
    'true_false' as test_type,
    tfr.id,
    tfr.test_id,
    tfr.student_id,
    COALESCE(tfr.best_retest_score, tfr.score) as score,
    COALESCE(tfr.best_retest_max_score, tfr.max_score) as max_score,
    tfr.created_at as submitted_at,
    tfr.name as student_name,
    tfr.surname as student_surname,
    tfr.grade as student_grade,
    tfr.class as student_class,
    tfr.number as student_number,
    tfr.nickname as student_nickname,
    tfr.test_name,
    tfr.percentage,
    tfr.time_taken,
    tfr.started_at,
    tfr.submitted_at as result_submitted_at,
    tfr.caught_cheating,
    tfr.visibility_change_times,
    tfr.is_completed,
    tfr.retest_offered,
    tfr.retest_assignment_id,
    tfr.attempt_number,
    tfr.best_retest_score,
    tfr.best_retest_max_score,
    tfr.best_retest_percentage,
    tfr.academic_period_id
FROM true_false_test_results tfr

UNION ALL

-- Input Test Results
SELECT 
    'input' as test_type,
    itr.id,
    itr.test_id,
    itr.student_id,
    COALESCE(itr.best_retest_score, itr.score) as score,
    COALESCE(itr.best_retest_max_score, itr.max_score) as max_score,
    itr.created_at as submitted_at,
    itr.name as student_name,
    itr.surname as student_surname,
    itr.grade as student_grade,
    itr.class as student_class,
    itr.number as student_number,
    itr.nickname as student_nickname,
    itr.test_name,
    itr.percentage,
    itr.time_taken,
    itr.started_at,
    itr.submitted_at as result_submitted_at,
    itr.caught_cheating,
    itr.visibility_change_times,
    itr.is_completed,
    itr.retest_offered,
    itr.retest_assignment_id,
    itr.attempt_number,
    itr.best_retest_score,
    itr.best_retest_max_score,
    itr.best_retest_percentage,
    itr.academic_period_id
FROM input_test_results itr

UNION ALL

-- Matching Type Test Results
SELECT 
    'matching_type' as test_type,
    mtr.id,
    mtr.test_id,
    mtr.student_id,
    COALESCE(mtr.best_retest_score, mtr.score) as score,
    COALESCE(mtr.best_retest_max_score, mtr.max_score) as max_score,
    mtr.created_at as submitted_at,
    mtr.name as student_name,
    mtr.surname as student_surname,
    mtr.grade as student_grade,
    mtr.class as student_class,
    mtr.number as student_number,
    mtr.nickname as student_nickname,
    mtr.test_name,
    mtr.percentage,
    mtr.time_taken,
    mtr.started_at,
    mtr.submitted_at as result_submitted_at,
    mtr.caught_cheating,
    mtr.visibility_change_times,
    mtr.is_completed,
    mtr.retest_offered,
    mtr.retest_assignment_id,
    mtr.attempt_number,
    mtr.best_retest_score,
    mtr.best_retest_max_score,
    mtr.best_retest_percentage,
    mtr.academic_period_id
FROM matching_type_test_results mtr

UNION ALL

-- Word Matching Test Results
SELECT 
    'word_matching' as test_type,
    wmtr.id,
    wmtr.test_id,
    wmtr.student_id,
    COALESCE(wmtr.best_retest_score, wmtr.score) as score,
    COALESCE(wmtr.best_retest_max_score, wmtr.max_score) as max_score,
    wmtr.created_at as submitted_at,
    wmtr.name as student_name,
    wmtr.surname as student_surname,
    wmtr.grade as student_grade,
    wmtr.class as student_class,
    wmtr.number as student_number,
    wmtr.nickname as student_nickname,
    wmtr.test_name,
    wmtr.percentage,
    wmtr.time_taken,
    wmtr.started_at,
    wmtr.submitted_at as result_submitted_at,
    wmtr.caught_cheating,
    wmtr.visibility_change_times,
    wmtr.is_completed,
    wmtr.retest_offered,
    wmtr.retest_assignment_id,
    wmtr.attempt_number,
    wmtr.best_retest_score,
    wmtr.best_retest_max_score,
    wmtr.best_retest_percentage,
    wmtr.academic_period_id
FROM word_matching_test_results wmtr

UNION ALL

-- Drawing Test Results
SELECT 
    'drawing' as test_type,
    dtr.id,
    dtr.test_id,
    dtr.student_id,
    COALESCE(dtr.best_retest_score, dtr.score) as score,
    COALESCE(dtr.best_retest_max_score, dtr.max_score) as max_score,
    dtr.created_at as submitted_at,
    dtr.name as student_name,
    dtr.surname as student_surname,
    dtr.grade as student_grade,
    dtr.class as student_class,
    dtr.number as student_number,
    dtr.nickname as student_nickname,
    dtr.test_name,
    dtr.percentage,
    dtr.time_taken,
    dtr.started_at,
    dtr.submitted_at as result_submitted_at,
    dtr.caught_cheating,
    dtr.visibility_change_times,
    dtr.is_completed,
    dtr.retest_offered,
    dtr.retest_assignment_id,
    dtr.attempt_number,
    dtr.best_retest_score,
    dtr.best_retest_max_score,
    dtr.best_retest_percentage,
    dtr.academic_period_id
FROM drawing_test_results dtr

UNION ALL

-- Fill Blanks Test Results
SELECT 
    'fill_blanks' as test_type,
    fbtr.id,
    fbtr.test_id,
    fbtr.student_id,
    COALESCE(fbtr.best_retest_score, fbtr.score) as score,
    COALESCE(fbtr.best_retest_max_score, fbtr.max_score) as max_score,
    fbtr.created_at as submitted_at,
    fbtr.name as student_name,
    fbtr.surname as student_surname,
    fbtr.grade as student_grade,
    fbtr.class as student_class,
    fbtr.number as student_number,
    fbtr.nickname as student_nickname,
    fbtr.test_name,
    fbtr.percentage,
    fbtr.time_taken,
    fbtr.started_at,
    fbtr.submitted_at as result_submitted_at,
    fbtr.caught_cheating,
    fbtr.visibility_change_times,
    fbtr.is_completed,
    fbtr.retest_offered,
    fbtr.retest_assignment_id,
    fbtr.attempt_number,
    fbtr.best_retest_score,
    fbtr.best_retest_max_score,
    fbtr.best_retest_percentage,
    fbtr.academic_period_id
FROM fill_blanks_test_results fbtr

UNION ALL

-- Speaking Test Results
SELECT 
    'speaking' as test_type,
    str.id,
    str.test_id,
    str.student_id,
    COALESCE(str.best_retest_score, str.score) as score,
    COALESCE(str.best_retest_max_score, str.max_score) as max_score,
    str.created_at as submitted_at,
    str.name as student_name,
    str.surname as student_surname,
    str.grade as student_grade,
    str.class as student_class,
    str.number as student_number,
    str.nickname as student_nickname,
    str.test_name,
    str.percentage,
    str.time_taken,
    str.started_at,
    str.submitted_at as result_submitted_at,
    str.caught_cheating,
    str.visibility_change_times,
    str.is_completed,
    str.retest_offered,
    str.retest_assignment_id,
    NULL as attempt_number,
    str.best_retest_score,
    str.best_retest_max_score,
    str.best_retest_percentage,
    str.academic_period_id
FROM speaking_test_results str

ORDER BY submitted_at DESC;