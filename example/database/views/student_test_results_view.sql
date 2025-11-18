-- ========================================
-- STUDENT TEST RESULTS VIEW
-- Comprehensive view for get-student-test-results.js function
-- Combines all test result types for a specific student
-- 
-- ⚠️ CRITICAL: Follow the EXACT original Neon SQL structure and logic
-- Do NOT modify the data structure or add/remove fields without checking original
-- This view must match the original get-student-test-results.js SQL queries exactly
-- ========================================

DROP VIEW IF EXISTS student_test_results_view;

CREATE VIEW student_test_results_view (
  id,
  test_id,
  test_type,
  test_name,
  score,
  max_score,
  best_retest_score,
  best_retest_max_score,
  best_retest_percentage,
  percentage,
  caught_cheating,
  visibility_change_times,
  is_completed,
  submitted_at,
  academic_period_id,
  student_id,
  subject,
  teacher_name
) AS
-- Multiple Choice Test Results
SELECT 
    m.id,
    m.test_id,
    'multiple_choice' as test_type,
    m.test_name,
    m.score,
    m.max_score,
    m.best_retest_score,
    m.best_retest_max_score,
    m.best_retest_percentage,
    m.percentage,
    m.caught_cheating,
    m.visibility_change_times,
    m.is_completed,
    m.created_at as submitted_at,
    m.academic_period_id,
    m.student_id,
    s.subject,
    t.first_name as teacher_name
FROM multiple_choice_test_results m
LEFT JOIN subjects s ON m.subject_id = s.subject_id
LEFT JOIN teachers t ON m.teacher_id = t.teacher_id

UNION ALL

-- True/False Test Results
SELECT 
    t.id,
    t.test_id,
    'true_false' as test_type,
    t.test_name,
    t.score,
    t.max_score,
    t.best_retest_score,
    t.best_retest_max_score,
    t.best_retest_percentage,
    t.percentage,
    t.caught_cheating,
    t.visibility_change_times,
    t.is_completed,
    t.created_at as submitted_at,
    t.academic_period_id,
    t.student_id,
    s.subject,
    te.first_name as teacher_name
FROM true_false_test_results t
LEFT JOIN subjects s ON t.subject_id = s.subject_id
LEFT JOIN teachers te ON t.teacher_id = te.teacher_id

UNION ALL

-- Input Test Results
SELECT 
    i.id,
    i.test_id,
    'input' as test_type,
    i.test_name,
    i.score,
    i.max_score,
    i.best_retest_score,
    i.best_retest_max_score,
    i.best_retest_percentage,
    i.percentage,
    i.caught_cheating,
    i.visibility_change_times,
    i.is_completed,
    i.created_at as submitted_at,
    i.academic_period_id,
    i.student_id,
    s.subject,
    t.first_name as teacher_name
FROM input_test_results i
LEFT JOIN subjects s ON i.subject_id = s.subject_id
LEFT JOIN teachers t ON i.teacher_id = t.teacher_id

UNION ALL

-- Matching Type Test Results
SELECT 
    m.id,
    m.test_id,
    'matching_type' as test_type,
    m.test_name,
    m.score,
    m.max_score,
    m.best_retest_score,
    m.best_retest_max_score,
    m.best_retest_percentage,
    m.percentage,
    m.caught_cheating,
    m.visibility_change_times,
    m.is_completed,
    m.created_at as submitted_at,
    m.academic_period_id,
    m.student_id,
    s.subject,
    t.first_name as teacher_name
FROM matching_type_test_results m
LEFT JOIN subjects s ON m.subject_id = s.subject_id
LEFT JOIN teachers t ON m.teacher_id = t.teacher_id

UNION ALL

-- Word Matching Test Results
SELECT 
    w.id,
    w.test_id,
    'word_matching' as test_type,
    w.test_name,
    w.score,
    w.max_score,
    w.best_retest_score,
    w.best_retest_max_score,
    w.best_retest_percentage,
    w.percentage,
    w.caught_cheating,
    w.visibility_change_times,
    w.is_completed,
    w.created_at as submitted_at,
    w.academic_period_id,
    w.student_id,
    s.subject,
    t.first_name as teacher_name
FROM word_matching_test_results w
LEFT JOIN subjects s ON w.subject_id = s.subject_id
LEFT JOIN teachers t ON w.teacher_id = t.teacher_id

UNION ALL

-- Drawing Test Results
SELECT 
    d.id,
    d.test_id,
    'drawing' as test_type,
    d.test_name,
    d.score,
    d.max_score,
    d.best_retest_score,
    d.best_retest_max_score,
    d.best_retest_percentage,
    d.percentage,
    d.caught_cheating,
    d.visibility_change_times,
    d.is_completed,
    d.created_at as submitted_at,
    d.academic_period_id,
    d.student_id,
    s.subject,
    t.first_name as teacher_name
FROM drawing_test_results d
LEFT JOIN subjects s ON d.subject_id = s.subject_id
LEFT JOIN teachers t ON d.teacher_id = t.teacher_id

UNION ALL

-- Fill Blanks Test Results
SELECT 
    f.id,
    f.test_id,
    'fill_blanks' as test_type,
    f.test_name,
    f.score,
    f.max_score,
    f.best_retest_score,
    f.best_retest_max_score,
    f.best_retest_percentage,
    f.percentage,
    f.caught_cheating,
    f.visibility_change_times,
    true as is_completed,
    f.created_at as submitted_at,
    f.academic_period_id,
    f.student_id,
    s.subject,
    te.first_name as teacher_name
FROM fill_blanks_test_results f
LEFT JOIN subjects s ON f.subject_id = s.subject_id
LEFT JOIN teachers te ON f.teacher_id = te.teacher_id

UNION ALL

-- Speaking Test Results
SELECT 
    str.id,
    str.test_id,
    'speaking' as test_type,
    str.test_name,
    str.score,
    str.max_score,
    str.best_retest_score,
    str.best_retest_max_score,
    str.best_retest_percentage,
    str.overall_score as percentage,
    str.caught_cheating,
    str.visibility_change_times,
    str.is_completed,
    str.submitted_at,
    str.academic_period_id,
    str.student_id,
    s.subject,
    te.first_name as teacher_name
FROM speaking_test_results str
LEFT JOIN subjects s ON str.subject_id = s.subject_id
LEFT JOIN teachers te ON str.teacher_id = te.teacher_id

ORDER BY submitted_at DESC;