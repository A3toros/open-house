-- ========================================
-- TEST ASSIGNMENTS COMPREHENSIVE VIEW
-- Comprehensive view for get-test-assignments.js function
-- Combines all test assignment types with test names and subject information
-- 
-- ⚠️ CRITICAL: Follow the EXACT original Neon SQL structure and logic
-- Do NOT modify the data structure or add/remove fields without checking original
-- This view must match the original get-test-assignments.js SQL queries exactly
-- ========================================

CREATE OR REPLACE VIEW test_assignments_comprehensive_view AS
-- Multiple Choice Test Assignments
SELECT 
    ta.id as assignment_id,
    ta.test_type,
    ta.test_id,
    ta.teacher_id,
    ta.grade,
    ta.class,
    ta.subject_id,
    ta.academic_period_id,
    ta.assigned_at,
    ta.due_date,
    ta.is_active,
    ta.created_at,
    ta.updated_at,
    s.subject as subject_name,
    mct.test_name,
    mct.num_questions as num_questions,
    mct.created_at as test_created_at,
    mct.updated_at as test_updated_at
FROM test_assignments ta
INNER JOIN subjects s ON ta.subject_id = s.subject_id
INNER JOIN multiple_choice_tests mct ON ta.test_id = mct.id
WHERE ta.test_type = 'multiple_choice'

UNION ALL

-- True/False Test Assignments
SELECT 
    ta.id as assignment_id,
    ta.test_type,
    ta.test_id,
    ta.teacher_id,
    ta.grade,
    ta.class,
    ta.subject_id,
    ta.academic_period_id,
    ta.assigned_at,
    ta.due_date,
    ta.is_active,
    ta.created_at,
    ta.updated_at,
    s.subject as subject_name,
    tft.test_name,
    tft.num_questions as num_questions,
    tft.created_at as test_created_at,
    tft.updated_at as test_updated_at
FROM test_assignments ta
INNER JOIN subjects s ON ta.subject_id = s.subject_id
INNER JOIN true_false_tests tft ON ta.test_id = tft.id
WHERE ta.test_type = 'true_false'

UNION ALL

-- Input Test Assignments
SELECT 
    ta.id as assignment_id,
    ta.test_type,
    ta.test_id,
    ta.teacher_id,
    ta.grade,
    ta.class,
    ta.subject_id,
    ta.academic_period_id,
    ta.assigned_at,
    ta.due_date,
    ta.is_active,
    ta.created_at,
    ta.updated_at,
    s.subject as subject_name,
    it.test_name,
    it.num_questions as num_questions,
    it.created_at as test_created_at,
    it.updated_at as test_updated_at
FROM test_assignments ta
INNER JOIN subjects s ON ta.subject_id = s.subject_id
INNER JOIN input_tests it ON ta.test_id = it.id
WHERE ta.test_type = 'input'

UNION ALL

-- Matching Type Test Assignments
SELECT 
    ta.id as assignment_id,
    ta.test_type,
    ta.test_id,
    ta.teacher_id,
    ta.grade,
    ta.class,
    ta.subject_id,
    ta.academic_period_id,
    ta.assigned_at,
    ta.due_date,
    ta.is_active,
    ta.created_at,
    ta.updated_at,
    s.subject as subject_name,
    mtt.test_name,
    mtt.num_blocks as num_questions,
    mtt.created_at as test_created_at,
    mtt.updated_at as test_updated_at
FROM test_assignments ta
INNER JOIN subjects s ON ta.subject_id = s.subject_id
INNER JOIN matching_type_tests mtt ON ta.test_id = mtt.id
WHERE ta.test_type = 'matching_type'

UNION ALL

-- Word Matching Test Assignments
SELECT 
    ta.id as assignment_id,
    ta.test_type,
    ta.test_id,
    ta.teacher_id,
    ta.grade,
    ta.class,
    ta.subject_id,
    ta.academic_period_id,
    ta.assigned_at,
    ta.due_date,
    ta.is_active,
    ta.created_at,
    ta.updated_at,
    s.subject as subject_name,
    wmt.test_name,
    wmt.num_questions as num_questions,
    wmt.created_at as test_created_at,
    wmt.updated_at as test_updated_at
FROM test_assignments ta
INNER JOIN subjects s ON ta.subject_id = s.subject_id
INNER JOIN word_matching_tests wmt ON ta.test_id = wmt.id
WHERE ta.test_type = 'word_matching'

UNION ALL

-- Fill Blanks Test Assignments
SELECT 
    ta.id as assignment_id,
    ta.test_type,
    ta.test_id,
    ta.teacher_id,
    ta.grade,
    ta.class,
    ta.subject_id,
    ta.academic_period_id,
    ta.assigned_at,
    ta.due_date,
    ta.is_active,
    ta.created_at,
    ta.updated_at,
    s.subject as subject_name,
    fbt.test_name,
    fbt.num_blanks as num_questions,
    fbt.created_at as test_created_at,
    fbt.updated_at as test_updated_at
FROM test_assignments ta
INNER JOIN subjects s ON ta.subject_id = s.subject_id
INNER JOIN fill_blanks_tests fbt ON ta.test_id = fbt.id
WHERE ta.test_type = 'fill_blanks'

UNION ALL

-- Drawing Test Assignments
SELECT 
    ta.id as assignment_id,
    ta.test_type,
    ta.test_id,
    ta.teacher_id,
    ta.grade,
    ta.class,
    ta.subject_id,
    ta.academic_period_id,
    ta.assigned_at,
    ta.due_date,
    ta.is_active,
    ta.created_at,
    ta.updated_at,
    s.subject as subject_name,
    dt.test_name,
    dt.num_questions as num_questions,
    dt.created_at as test_created_at,
    dt.updated_at as test_updated_at
FROM test_assignments ta
INNER JOIN subjects s ON ta.subject_id = s.subject_id
INNER JOIN drawing_tests dt ON ta.test_id = dt.id
WHERE ta.test_type = 'drawing'

UNION ALL

-- Speaking Test Assignments
SELECT 
    ta.id as assignment_id,
    ta.test_type,
    ta.test_id,
    ta.teacher_id,
    ta.grade,
    ta.class,
    ta.subject_id,
    ta.academic_period_id,
    ta.assigned_at,
    ta.due_date,
    ta.is_active,
    ta.created_at,
    ta.updated_at,
    s.subject as subject_name,
    st.test_name,
    st.min_words as num_questions,
    st.created_at as test_created_at,
    st.updated_at as test_updated_at
FROM test_assignments ta
INNER JOIN subjects s ON ta.subject_id = s.subject_id
INNER JOIN speaking_tests st ON ta.test_id = st.id
WHERE ta.test_type = 'speaking'

ORDER BY assigned_at DESC;
