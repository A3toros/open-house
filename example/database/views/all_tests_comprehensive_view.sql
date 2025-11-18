-- ========================================
-- ALL TESTS COMPREHENSIVE VIEW
-- Comprehensive view for get-all-tests.js function
-- Includes all test types with teacher, subject, and assignment information
-- ========================================

CREATE OR REPLACE VIEW all_tests_comprehensive_view AS
-- Multiple Choice Tests
SELECT 
    'multiple_choice' as test_type,
    mct.id as test_id,
    mct.test_name,
    mct.num_questions,
    mct.created_at,
    mct.teacher_id,
    t.username as teacher_name,
    COALESCE(
        STRING_AGG(DISTINCT CONCAT(ta.grade, '/', ta.class), ', '), 
        'Not Assigned'
    ) as classes,
    COALESCE(
        STRING_AGG(DISTINCT s.subject, ', '), 
        'Not Assigned'
    ) as subjects
FROM multiple_choice_tests mct
LEFT JOIN teachers t ON mct.teacher_id = t.teacher_id
LEFT JOIN test_assignments ta ON ta.test_id = mct.id AND ta.test_type = 'multiple_choice'
LEFT JOIN subjects s ON ta.subject_id = s.subject_id
GROUP BY mct.id, mct.test_name, mct.num_questions, mct.created_at, mct.teacher_id, t.username

UNION ALL

-- True/False Tests
SELECT 
    'true_false' as test_type,
    tft.id as test_id,
    tft.test_name,
    tft.num_questions,
    tft.created_at,
    tft.teacher_id,
    t.username as teacher_name,
    COALESCE(
        STRING_AGG(DISTINCT CONCAT(ta.grade, '/', ta.class), ', '), 
        'Not Assigned'
    ) as classes,
    COALESCE(
        STRING_AGG(DISTINCT s.subject, ', '), 
        'Not Assigned'
    ) as subjects
FROM true_false_tests tft
LEFT JOIN teachers t ON tft.teacher_id = t.teacher_id
LEFT JOIN test_assignments ta ON ta.test_id = tft.id AND ta.test_type = 'true_false'
LEFT JOIN subjects s ON ta.subject_id = s.subject_id
GROUP BY tft.id, tft.test_name, tft.num_questions, tft.created_at, tft.teacher_id, t.username

UNION ALL

-- Input Tests
SELECT 
    'input' as test_type,
    it.id as test_id,
    it.test_name,
    it.num_questions,
    it.created_at,
    it.teacher_id,
    t.username as teacher_name,
    COALESCE(
        STRING_AGG(DISTINCT CONCAT(ta.grade, '/', ta.class), ', '), 
        'Not Assigned'
    ) as classes,
    COALESCE(
        STRING_AGG(DISTINCT s.subject, ', '), 
        'Not Assigned'
    ) as subjects
FROM input_tests it
LEFT JOIN teachers t ON it.teacher_id = t.teacher_id
LEFT JOIN test_assignments ta ON ta.test_id = it.id AND ta.test_type = 'input'
LEFT JOIN subjects s ON ta.subject_id = s.subject_id
GROUP BY it.id, it.test_name, it.num_questions, it.created_at, it.teacher_id, t.username

UNION ALL

-- Matching Type Tests
SELECT 
    'matching_type' as test_type,
    mtt.id as test_id,
    mtt.test_name,
    mtt.num_blocks as num_questions,
    mtt.created_at,
    mtt.teacher_id,
    t.username as teacher_name,
    COALESCE(
        STRING_AGG(DISTINCT CONCAT(ta.grade, '/', ta.class), ', '), 
        'Not Assigned'
    ) as classes,
    COALESCE(
        STRING_AGG(DISTINCT s.subject, ', '), 
        'Not Assigned'
    ) as subjects
FROM matching_type_tests mtt
LEFT JOIN teachers t ON mtt.teacher_id = t.teacher_id
LEFT JOIN test_assignments ta ON ta.test_id = mtt.id AND ta.test_type = 'matching_type'
LEFT JOIN subjects s ON ta.subject_id = s.subject_id
GROUP BY mtt.id, mtt.test_name, mtt.num_blocks, mtt.created_at, mtt.teacher_id, t.username

UNION ALL

-- Word Matching Tests
SELECT 
    'word_matching' as test_type,
    wmt.id as test_id,
    wmt.test_name,
    wmt.num_questions,
    wmt.created_at,
    wmt.teacher_id,
    t.username as teacher_name,
    COALESCE(
        STRING_AGG(DISTINCT CONCAT(ta.grade, '/', ta.class), ', '), 
        'Not Assigned'
    ) as classes,
    COALESCE(
        STRING_AGG(DISTINCT s.subject, ', '), 
        'Not Assigned'
    ) as subjects
FROM word_matching_tests wmt
LEFT JOIN teachers t ON wmt.teacher_id = t.teacher_id
LEFT JOIN test_assignments ta ON ta.test_id = wmt.id AND ta.test_type = 'word_matching'
LEFT JOIN subjects s ON ta.subject_id = s.subject_id
GROUP BY wmt.id, wmt.test_name, wmt.num_questions, wmt.created_at, wmt.teacher_id, t.username

UNION ALL

-- Drawing Tests
SELECT 
    'drawing' as test_type,
    dt.id as test_id,
    dt.test_name,
    dt.num_questions,
    dt.created_at,
    dt.teacher_id,
    t.username as teacher_name,
    COALESCE(
        STRING_AGG(DISTINCT CONCAT(ta.grade, '/', ta.class), ', '), 
        'Not Assigned'
    ) as classes,
    COALESCE(
        STRING_AGG(DISTINCT s.subject, ', '), 
        'Not Assigned'
    ) as subjects
FROM drawing_tests dt
LEFT JOIN teachers t ON dt.teacher_id = t.teacher_id
LEFT JOIN test_assignments ta ON ta.test_id = dt.id AND ta.test_type = 'drawing'
LEFT JOIN subjects s ON ta.subject_id = s.subject_id
GROUP BY dt.id, dt.test_name, dt.num_questions, dt.created_at, dt.teacher_id, t.username

UNION ALL

-- Fill Blanks Tests
SELECT 
    'fill_blanks' as test_type,
    fbt.id as test_id,
    fbt.test_name,
    fbt.num_blanks as num_questions,
    fbt.created_at,
    fbt.teacher_id,
    t.username as teacher_name,
    COALESCE(
        STRING_AGG(DISTINCT CONCAT(ta.grade, '/', ta.class), ', '), 
        'Not Assigned'
    ) as classes,
    COALESCE(
        STRING_AGG(DISTINCT s.subject, ', '), 
        'Not Assigned'
    ) as subjects
FROM fill_blanks_tests fbt
LEFT JOIN teachers t ON fbt.teacher_id = t.teacher_id
LEFT JOIN test_assignments ta ON ta.test_id = fbt.id AND ta.test_type = 'fill_blanks'
LEFT JOIN subjects s ON ta.subject_id = s.subject_id
GROUP BY fbt.id, fbt.test_name, fbt.num_blanks, fbt.created_at, fbt.teacher_id, t.username

UNION ALL

-- Speaking Tests
SELECT 
    'speaking' as test_type,
    st.id as test_id,
    st.test_name,
    st.min_words as num_questions,
    st.created_at,
    st.teacher_id,
    t.username as teacher_name,
    'Not Assigned' as classes,
    'Not Assigned' as subjects
FROM speaking_tests st
LEFT JOIN teachers t ON st.teacher_id = t.teacher_id
ORDER BY created_at DESC;
