-- ========================================
-- TEACHER STUDENT RESULTS VIEW
-- Comprehensive view for get-teacher-student-results.js function
-- Combines all test result types with simple retest logic
-- 
-- ⚠️ CRITICAL: Simplified structure matching other working views
-- Uses COALESCE for retest logic instead of complex LATERAL joins
-- ========================================

DROP VIEW IF EXISTS teacher_student_results_view;

CREATE OR REPLACE VIEW teacher_student_results_view AS
-- Matching Type Test Results
SELECT 
    'matching_type' as test_type,
    m.id,
    m.test_id,
    m.test_name,
    m.teacher_id,
    m.subject_id,
    m.grade,
    m.class,
    m.number,
    m.student_id,
    m.name,
    m.surname,
    m.nickname,
    COALESCE(m.best_retest_score, m.score) AS score,
    COALESCE(m.best_retest_max_score, m.max_score) AS max_score,
    m.percentage,
    m.answers,
    m.time_taken,
    m.started_at,
    m.submitted_at,
    NULL::text as transcript,
    m.caught_cheating,
    m.visibility_change_times,
    m.is_completed,
    m.retest_offered,
    m.retest_assignment_id,
    m.attempt_number,
    m.best_retest_score,
    m.best_retest_max_score,
    m.best_retest_percentage,
    m.created_at,
    m.academic_period_id,
    NULL::jsonb as ai_feedback,
    s.subject,
    NULL::text as audio_url
FROM matching_type_test_results m
LEFT JOIN subjects s ON m.subject_id = s.subject_id

UNION ALL

-- Multiple Choice Test Results
SELECT 
    'multiple_choice' as test_type,
    mc.id,
    mc.test_id,
    mc.test_name,
    mc.teacher_id,
    mc.subject_id,
    mc.grade,
    mc.class,
    mc.number,
    mc.student_id,
    mc.name,
    mc.surname,
    mc.nickname,
    COALESCE(mc.best_retest_score, mc.score) AS score,
    COALESCE(mc.best_retest_max_score, mc.max_score) AS max_score,
    mc.percentage,
    -- Use retest answers if retest_offered = true and retest exists, otherwise use original
    CASE 
        WHEN mc.retest_offered = true AND ta.answers IS NOT NULL 
        THEN ta.answers 
        ELSE mc.answers 
    END as answers,
    mc.time_taken,
    mc.started_at,
    mc.submitted_at,
    NULL::text as transcript,
    mc.caught_cheating,
    mc.visibility_change_times,
    mc.is_completed,
    mc.retest_offered,
    mc.retest_assignment_id,
    mc.attempt_number,
    mc.best_retest_score,
    mc.best_retest_max_score,
    mc.best_retest_percentage,
    mc.created_at,
    mc.academic_period_id,
    NULL::jsonb as ai_feedback,
    s.subject,
    NULL::text as audio_url
FROM multiple_choice_test_results mc
LEFT JOIN subjects s ON mc.subject_id = s.subject_id
-- LEFT JOIN with test_attempts to get retest answers when retest_offered = true
LEFT JOIN LATERAL (
    SELECT answers
    FROM test_attempts
    WHERE student_id = mc.student_id
      AND test_id = mc.test_id
      AND retest_assignment_id IS NOT NULL
    ORDER BY percentage DESC NULLS LAST, attempt_number DESC
    LIMIT 1
) ta ON mc.retest_offered = true

UNION ALL

-- True/False Test Results
SELECT 
    'true_false' as test_type,
    tf.id,
    tf.test_id,
    tf.test_name,
    tf.teacher_id,
    tf.subject_id,
    tf.grade,
    tf.class,
    tf.number,
    tf.student_id,
    tf.name,
    tf.surname,
    tf.nickname,
    COALESCE(tf.best_retest_score, tf.score) AS score,
    COALESCE(tf.best_retest_max_score, tf.max_score) AS max_score,
    tf.percentage,
    -- Use retest answers if retest_offered = true and retest exists, otherwise use original
    CASE 
        WHEN tf.retest_offered = true AND ta.answers IS NOT NULL 
        THEN ta.answers 
        ELSE tf.answers 
    END as answers,
    tf.time_taken,
    tf.started_at,
    tf.submitted_at,
    NULL::text as transcript,
    tf.caught_cheating,
    tf.visibility_change_times,
    tf.is_completed,
    tf.retest_offered,
    tf.retest_assignment_id,
    tf.attempt_number,
    tf.best_retest_score,
    tf.best_retest_max_score,
    tf.best_retest_percentage,
    tf.created_at,
    tf.academic_period_id,
    NULL::jsonb as ai_feedback,
    s.subject,
    NULL::text as audio_url
FROM true_false_test_results tf
LEFT JOIN subjects s ON tf.subject_id = s.subject_id
-- LEFT JOIN with test_attempts to get retest answers when retest_offered = true
LEFT JOIN LATERAL (
    SELECT answers
    FROM test_attempts
    WHERE student_id = tf.student_id
      AND test_id = tf.test_id
      AND retest_assignment_id IS NOT NULL
    ORDER BY percentage DESC NULLS LAST, attempt_number DESC
    LIMIT 1
) ta ON tf.retest_offered = true

UNION ALL

-- Input Test Results
SELECT 
    'input' as test_type,
    i.id,
    i.test_id,
    i.test_name,
    i.teacher_id,
    i.subject_id,
    i.grade,
    i.class,
    i.number,
    i.student_id,
    i.name,
    i.surname,
    i.nickname,
    COALESCE(i.best_retest_score, i.score) AS score,
    COALESCE(i.best_retest_max_score, i.max_score) AS max_score,
    i.percentage,
    -- Use retest answers if retest_offered = true and retest exists, otherwise use original
    CASE 
        WHEN i.retest_offered = true AND ta.answers IS NOT NULL 
        THEN ta.answers 
        ELSE i.answers 
    END as answers,
    i.time_taken,
    i.started_at,
    i.submitted_at,
    NULL::text as transcript,
    i.caught_cheating,
    i.visibility_change_times,
    i.is_completed,
    i.retest_offered,
    i.retest_assignment_id,
    i.attempt_number,
    i.best_retest_score,
    i.best_retest_max_score,
    i.best_retest_percentage,
    i.created_at,
    i.academic_period_id,
    NULL::jsonb as ai_feedback,
    s.subject,
    NULL::text as audio_url
FROM input_test_results i
LEFT JOIN subjects s ON i.subject_id = s.subject_id
-- LEFT JOIN with test_attempts to get retest answers when retest_offered = true
LEFT JOIN LATERAL (
    SELECT answers
    FROM test_attempts
    WHERE student_id = i.student_id
      AND test_id = i.test_id
      AND retest_assignment_id IS NOT NULL
    ORDER BY percentage DESC NULLS LAST, attempt_number DESC
    LIMIT 1
) ta ON i.retest_offered = true

UNION ALL

-- Word Matching Test Results
SELECT 
    'word_matching' as test_type,
    w.id,
    w.test_id,
    w.test_name,
    w.teacher_id,
    w.subject_id,
    w.grade,
    w.class,
    w.number,
    w.student_id,
    w.name,
    w.surname,
    w.nickname,
    COALESCE(w.best_retest_score, w.score) AS score,
    COALESCE(w.best_retest_max_score, w.max_score) AS max_score,
    w.percentage,
    w.answers,
    w.time_taken,
    w.started_at,
    w.submitted_at,
    NULL::text as transcript,
    w.caught_cheating,
    w.visibility_change_times,
    w.is_completed,
    w.retest_offered,
    w.retest_assignment_id,
    w.attempt_number,
    w.best_retest_score,
    w.best_retest_max_score,
    w.best_retest_percentage,
    w.created_at,
    w.academic_period_id,
    NULL::jsonb as ai_feedback,
    s.subject,
    NULL::text as audio_url
FROM word_matching_test_results w
LEFT JOIN subjects s ON w.subject_id = s.subject_id

UNION ALL

-- Drawing Test Results
SELECT 
    'drawing' as test_type,
    d.id,
    d.test_id,
    d.test_name,
    d.teacher_id,
    d.subject_id,
    d.grade,
    d.class,
    d.number,
    d.student_id,
    d.name,
    d.surname,
    d.nickname,
    COALESCE(d.best_retest_score, d.score) AS score,
    COALESCE(d.best_retest_max_score, d.max_score) AS max_score,
    d.percentage,
    -- Use retest drawing if retest_offered = true and retest exists, otherwise use original
    CASE 
        WHEN d.retest_offered = true AND r.answers IS NOT NULL 
        THEN r.answers 
        ELSE d.answers 
    END as answers,
    d.time_taken,
    d.started_at,
    d.submitted_at,
    NULL::text as transcript,
    d.caught_cheating,
    d.visibility_change_times,
    d.is_completed,
    d.retest_offered,
    d.retest_assignment_id,
    d.attempt_number,
    d.best_retest_score,
    d.best_retest_max_score,
    d.best_retest_percentage,
    d.created_at,
    d.academic_period_id,
    NULL::jsonb as ai_feedback,
    s.subject,
    NULL::text as audio_url
FROM drawing_test_results d
LEFT JOIN subjects s ON d.subject_id = s.subject_id
-- LEFT JOIN with retest result to get retest drawing when retest_offered = true
LEFT JOIN drawing_test_results r ON 
    r.student_id = d.student_id
    AND r.test_id = d.test_id
    AND r.retest_assignment_id IS NOT NULL
    AND r.attempt_number = 1
WHERE (d.retest_assignment_id IS NULL AND (d.attempt_number IS NULL OR d.attempt_number = 0))

UNION ALL

-- Fill Blanks Test Results
SELECT 
    'fill_blanks' as test_type,
    fb.id,
    fb.test_id,
    fb.test_name,
    fb.teacher_id,
    fb.subject_id,
    fb.grade,
    fb.class,
    fb.number,
    fb.student_id,
    fb.name,
    fb.surname,
    fb.nickname,
    COALESCE(fb.best_retest_score, fb.score) AS score,
    COALESCE(fb.best_retest_max_score, fb.max_score) AS max_score,
    fb.percentage,
    fb.answers,
    fb.time_taken,
    fb.started_at,
    fb.submitted_at,
    NULL::text as transcript,
    fb.caught_cheating,
    fb.visibility_change_times,
    fb.is_completed,
    fb.retest_offered,
    fb.retest_assignment_id,
    fb.attempt_number,
    fb.best_retest_score,
    fb.best_retest_max_score,
    fb.best_retest_percentage,
    fb.created_at,
    fb.academic_period_id,
    NULL::jsonb as ai_feedback,
    s.subject,
    NULL::text as audio_url
FROM fill_blanks_test_results fb
LEFT JOIN subjects s ON fb.subject_id = s.subject_id

UNION ALL

-- Speaking Test Results
SELECT 
    'speaking' as test_type,
    s.id,
    s.test_id,
    s.test_name,
    s.teacher_id,
    s.subject_id,
    s.grade,
    s.class,
    s.number,
    s.student_id,
    s.name,
    s.surname,
    s.nickname,
    COALESCE(s.best_retest_score, s.score) AS score,
    COALESCE(s.best_retest_max_score, s.max_score) AS max_score,
    s.percentage,
    json_build_object('audio_url', s.audio_url)::jsonb as answers,
    s.time_taken,
    s.started_at,
    s.submitted_at,
    s.transcript,
    s.caught_cheating,
    s.visibility_change_times,
    s.is_completed,
    s.retest_offered,
    s.retest_assignment_id,
    NULL::integer as attempt_number,
    s.best_retest_score,
    s.best_retest_max_score,
    s.best_retest_percentage,
    s.created_at,
    s.academic_period_id,
    COALESCE(
        s.ai_feedback,
        jsonb_build_object(
            'overall_score', s.overall_score,
            'word_count', s.word_count,
            'grammar_mistakes', s.grammar_mistakes,
            'vocabulary_mistakes', s.vocabulary_mistakes
        )
    ) as ai_feedback,
    subj.subject,
    s.audio_url
FROM speaking_test_results s
LEFT JOIN subjects subj ON s.subject_id = subj.subject_id

ORDER BY student_id, test_name, created_at DESC;
