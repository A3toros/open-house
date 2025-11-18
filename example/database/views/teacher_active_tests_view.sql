-- ========================================
-- TEACHER ACTIVE TESTS VIEW
-- Comprehensive view for get-teacher-active-tests.js function
-- Combines all test types with their active assignments
-- 
-- ⚠️ CRITICAL: Follow the EXACT original Neon SQL structure and logic
-- Do NOT modify the data structure or add/remove fields without checking original
-- This view must match the original get-teacher-active-tests.js SQL queries exactly
-- ========================================
DROP VIEW IF EXISTS teacher_active_tests_view;
CREATE VIEW teacher_active_tests_view AS
-- Multiple Choice Tests
SELECT 
    'multiple_choice' as test_type,
    mct.id as test_id,
    mct.test_name,
    mct.num_questions,
    mct.created_at,
    mct.teacher_id,
    ta.subject_id,
    s.subject,
    COUNT(ta.id) as assignment_count,
    ARRAY_AGG(
        JSON_BUILD_OBJECT(
            'assignment_id', ta.id,
            'grade', ta.grade,
            'class', ta.class,
            'assigned_at', ta.assigned_at,
            'is_active', ta.is_active,
            'days_remaining', EXTRACT(DAY FROM (ta.assigned_at + INTERVAL '7 days') - CURRENT_TIMESTAMP)
        )
    ) FILTER (WHERE ta.id IS NOT NULL) as assignments
FROM multiple_choice_tests mct
INNER JOIN test_assignments ta ON mct.id = ta.test_id AND ta.test_type = 'multiple_choice'
LEFT JOIN subjects s ON ta.subject_id = s.subject_id
WHERE ta.completed_at IS NULL
GROUP BY mct.id, mct.test_name, mct.num_questions, mct.created_at, mct.teacher_id, ta.subject_id, s.subject

UNION ALL

-- True/False Tests
SELECT 
    'true_false' as test_type,
    tft.id as test_id,
    tft.test_name,
    tft.num_questions,
    tft.created_at,
    tft.teacher_id,
    ta.subject_id,
    s.subject,
    COUNT(ta.id) as assignment_count,
    ARRAY_AGG(
        JSON_BUILD_OBJECT(
            'assignment_id', ta.id,
            'grade', ta.grade,
            'class', ta.class,
            'assigned_at', ta.assigned_at,
            'is_active', ta.is_active,
            'days_remaining', EXTRACT(DAY FROM (ta.assigned_at + INTERVAL '7 days') - CURRENT_TIMESTAMP)
        )
    ) FILTER (WHERE ta.id IS NOT NULL) as assignments
FROM true_false_tests tft
INNER JOIN test_assignments ta ON tft.id = ta.test_id AND ta.test_type = 'true_false'
LEFT JOIN subjects s ON ta.subject_id = s.subject_id
WHERE ta.completed_at IS NULL
GROUP BY tft.id, tft.test_name, tft.num_questions, tft.created_at, tft.teacher_id, ta.subject_id, s.subject

UNION ALL

-- Input Tests
SELECT 
    'input' as test_type,
    it.id as test_id,
    it.test_name,
    it.num_questions,
    it.created_at,
    it.teacher_id,
    ta.subject_id,
    s.subject,
    COUNT(ta.id) as assignment_count,
    ARRAY_AGG(
        JSON_BUILD_OBJECT(
            'assignment_id', ta.id,
            'grade', ta.grade,
            'class', ta.class,
            'assigned_at', ta.assigned_at,
            'is_active', ta.is_active,
            'days_remaining', EXTRACT(DAY FROM (ta.assigned_at + INTERVAL '7 days') - CURRENT_TIMESTAMP)
        )
    ) FILTER (WHERE ta.id IS NOT NULL) as assignments
FROM input_tests it
INNER JOIN test_assignments ta ON it.id = ta.test_id AND ta.test_type = 'input'
LEFT JOIN subjects s ON ta.subject_id = s.subject_id
WHERE ta.completed_at IS NULL
GROUP BY it.id, it.test_name, it.num_questions, it.created_at, it.teacher_id, ta.subject_id, s.subject

UNION ALL

-- Matching Type Tests
SELECT 
    'matching_type' as test_type,
    mtt.id as test_id,
    mtt.test_name,
    mtt.num_blocks as num_questions,
    mtt.created_at,
    mtt.teacher_id,
    ta.subject_id,
    s.subject,
    COUNT(ta.id) as assignment_count,
    ARRAY_AGG(
        JSON_BUILD_OBJECT(
            'assignment_id', ta.id,
            'grade', ta.grade,
            'class', ta.class,
            'assigned_at', ta.assigned_at,
            'is_active', ta.is_active,
            'days_remaining', EXTRACT(DAY FROM (ta.assigned_at + INTERVAL '7 days') - CURRENT_TIMESTAMP)
        )
    ) FILTER (WHERE ta.id IS NOT NULL) as assignments
FROM matching_type_tests mtt
INNER JOIN test_assignments ta ON mtt.id = ta.test_id AND ta.test_type = 'matching_type'
LEFT JOIN subjects s ON ta.subject_id = s.subject_id
WHERE ta.completed_at IS NULL
GROUP BY mtt.id, mtt.test_name, mtt.num_blocks, mtt.created_at, mtt.teacher_id, ta.subject_id, s.subject

UNION ALL

-- Word Matching Tests
SELECT 
    'word_matching' as test_type,
    wmt.id as test_id,
    wmt.test_name,
    wmt.num_questions,
    wmt.created_at,
    wmt.teacher_id,
    ta.subject_id,
    s.subject,
    COUNT(ta.id) as assignment_count,
    ARRAY_AGG(
        JSON_BUILD_OBJECT(
            'assignment_id', ta.id,
            'grade', ta.grade,
            'class', ta.class,
            'assigned_at', ta.assigned_at,
            'is_active', ta.is_active,
            'days_remaining', EXTRACT(DAY FROM (ta.assigned_at + INTERVAL '7 days') - CURRENT_TIMESTAMP)
        )
    ) FILTER (WHERE ta.id IS NOT NULL) as assignments
FROM word_matching_tests wmt
INNER JOIN test_assignments ta ON wmt.id = ta.test_id AND ta.test_type = 'word_matching'
LEFT JOIN subjects s ON ta.subject_id = s.subject_id
WHERE ta.completed_at IS NULL
GROUP BY wmt.id, wmt.test_name, wmt.num_questions, wmt.created_at, wmt.teacher_id, ta.subject_id, s.subject

UNION ALL

-- Drawing Tests
SELECT 
    'drawing' as test_type,
    dt.id as test_id,
    dt.test_name,
    dt.num_questions,
    dt.created_at,
    dt.teacher_id,
    ta.subject_id,
    s.subject,
    COUNT(ta.id) as assignment_count,
    ARRAY_AGG(
        JSON_BUILD_OBJECT(
            'assignment_id', ta.id,
            'grade', ta.grade,
            'class', ta.class,
            'assigned_at', ta.assigned_at,
            'is_active', ta.is_active,
            'days_remaining', EXTRACT(DAY FROM (ta.assigned_at + INTERVAL '7 days') - CURRENT_TIMESTAMP)
        )
    ) FILTER (WHERE ta.id IS NOT NULL) as assignments
FROM drawing_tests dt
INNER JOIN test_assignments ta ON dt.id = ta.test_id AND ta.test_type = 'drawing'
LEFT JOIN subjects s ON ta.subject_id = s.subject_id
WHERE ta.completed_at IS NULL
GROUP BY dt.id, dt.test_name, dt.num_questions, dt.created_at, dt.teacher_id, ta.subject_id, s.subject

UNION ALL

-- Fill Blanks Tests
SELECT 
    'fill_blanks' as test_type,
    fbt.id as test_id,
    fbt.test_name,
    fbt.num_blanks as num_questions,
    fbt.created_at,
    fbt.teacher_id,
    ta.subject_id,
    s.subject,
    COUNT(ta.id) as assignment_count,
    ARRAY_AGG(
        JSON_BUILD_OBJECT(
            'assignment_id', ta.id,
            'grade', ta.grade,
            'class', ta.class,
            'assigned_at', ta.assigned_at,
            'is_active', ta.is_active,
            'days_remaining', EXTRACT(DAY FROM (ta.assigned_at + INTERVAL '7 days') - CURRENT_TIMESTAMP)
        )
    ) FILTER (WHERE ta.id IS NOT NULL) as assignments
FROM fill_blanks_tests fbt
INNER JOIN test_assignments ta ON fbt.id = ta.test_id AND ta.test_type = 'fill_blanks'
LEFT JOIN subjects s ON ta.subject_id = s.subject_id
WHERE ta.completed_at IS NULL
GROUP BY fbt.id, fbt.test_name, fbt.num_blanks, fbt.created_at, fbt.teacher_id, ta.subject_id, s.subject

UNION ALL

-- Speaking Tests
SELECT 
    'speaking' as test_type,
    st.id as test_id,
    st.test_name,
    st.min_words as num_questions,
    st.created_at,
    st.teacher_id,
    ta.subject_id,
    s.subject,
    COUNT(ta.id) as assignment_count,
    ARRAY_AGG(
        JSON_BUILD_OBJECT(
            'assignment_id', ta.id,
            'grade', ta.grade,
            'class', ta.class,
            'assigned_at', ta.assigned_at,
            'is_active', ta.is_active,
            'days_remaining', EXTRACT(DAY FROM (ta.assigned_at + INTERVAL '7 days') - CURRENT_TIMESTAMP)
        )
    ) FILTER (WHERE ta.id IS NOT NULL) as assignments
FROM speaking_tests st
INNER JOIN test_assignments ta ON st.id = ta.test_id AND ta.test_type = 'speaking'
LEFT JOIN subjects s ON ta.subject_id = s.subject_id
WHERE ta.completed_at IS NULL
GROUP BY st.id, st.test_name, st.min_words, st.created_at, st.teacher_id, ta.subject_id, s.subject

ORDER BY created_at DESC;
