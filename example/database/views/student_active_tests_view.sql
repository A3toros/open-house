-- ========================================
-- STUDENT ACTIVE TESTS VIEW
-- Comprehensive view for get-student-active-tests.js function
-- Combines test assignments with detailed test information for students
-- 
-- ⚠️ CRITICAL: Follow the EXACT original Neon SQL structure and logic
-- Do NOT modify the data structure or add/remove fields without checking original
-- This view must match the original get-student-active-tests.js SQL queries exactly
-- ========================================

DROP VIEW IF EXISTS student_active_tests_view;
CREATE VIEW student_active_tests_view AS
WITH latest_assignments AS (
  SELECT
    ta.*,
    ROW_NUMBER() OVER (
      PARTITION BY ta.test_type, ta.test_id, ta.grade, ta.class
      ORDER BY ta.assigned_at DESC, ta.due_date DESC, ta.id DESC
    ) AS rn
  FROM test_assignments ta
  WHERE ta.is_active = true
)
SELECT * FROM (
  SELECT DISTINCT ON (u.student_id, mct.id)
      'multiple_choice' as test_type,
      mct.id as test_id,
      mct.test_name,
      mct.num_questions,
      mct.created_at,
      mct.updated_at,
      la.id as assignment_id,
      la.teacher_id,
      la.subject_id,
      la.grade,
      la.class,
      la.academic_period_id,
      la.assigned_at,
      la.due_date,
      la.is_active,
      u.student_id,
      s.subject as subject_name,
      t.username as teacher_name,
      mcr.id as result_id,
      ra_mc.id as retest_assignment_id,
      rt_mc.id as retest_target_id,
      rt_mc.is_completed as retest_is_completed,
      rt_mc.passed as retest_passed,
      rt_mc.attempt_number as retest_attempt_number,
      ra_mc.max_attempts as retest_max_attempts,
      rt_mc.last_attempt_at
  FROM multiple_choice_tests mct
  INNER JOIN latest_assignments la ON mct.id = la.test_id AND la.test_type = 'multiple_choice' AND la.rn = 1
  LEFT JOIN subjects s ON la.subject_id = s.subject_id
  LEFT JOIN users u ON u.grade = la.grade AND u.class = la.class
  LEFT JOIN teachers t ON mct.teacher_id = t.teacher_id
  LEFT JOIN LATERAL (
      SELECT mcr_inner.id
      FROM multiple_choice_test_results mcr_inner
      WHERE mcr_inner.student_id = u.student_id
        AND mcr_inner.test_id = mct.id
        AND mcr_inner.is_completed = true
      ORDER BY mcr_inner.submitted_at DESC NULLS LAST, mcr_inner.id DESC
      LIMIT 1
  ) mcr ON true
  LEFT JOIN LATERAL (
      SELECT ra_inner.id,
             ra_inner.max_attempts,
             ra_inner.window_start,
             ra_inner.window_end,
             ra_inner.passing_threshold,
             ra_inner.created_at
      FROM retest_assignments ra_inner
      WHERE ra_inner.test_type = 'multiple_choice'
        AND ra_inner.test_id = mct.id
        AND NOW() BETWEEN ra_inner.window_start AND ra_inner.window_end
      ORDER BY ra_inner.window_start DESC NULLS LAST, ra_inner.created_at DESC NULLS LAST, ra_inner.id DESC
      LIMIT 1
  ) ra_mc ON true
  LEFT JOIN retest_targets rt_mc ON 
      rt_mc.retest_assignment_id = ra_mc.id
      AND rt_mc.student_id = u.student_id
  WHERE (
      mcr.id IS NULL
      OR ra_mc.id IS NOT NULL
    )
    AND (
      rt_mc.id IS NULL
      OR rt_mc.is_completed = FALSE
    )
    AND NOT (
      mcr.id IS NOT NULL
      AND rt_mc.id IS NOT NULL
      AND rt_mc.is_completed = TRUE
    )
  ORDER BY
      u.student_id,
      mct.id,
      CASE
        WHEN ra_mc.id IS NOT NULL AND (rt_mc.id IS NULL OR rt_mc.is_completed = FALSE) THEN 0
        ELSE 1
      END,
      COALESCE(rt_mc.last_attempt_at, la.assigned_at) DESC
) multiple_choice
UNION ALL
SELECT * FROM (
  SELECT DISTINCT ON (u.student_id, tft.id)
      'true_false' as test_type,
      tft.id as test_id,
      tft.test_name,
      tft.num_questions,
      tft.created_at,
      tft.updated_at,
      la.id as assignment_id,
      la.teacher_id,
      la.subject_id,
      la.grade,
      la.class,
      la.academic_period_id,
      la.assigned_at,
      la.due_date,
      la.is_active,
      u.student_id,
      s.subject as subject_name,
      t.username as teacher_name,
      tfr.id as result_id,
      ra_tf.id as retest_assignment_id,
      rt_tf.id as retest_target_id,
      rt_tf.is_completed as retest_is_completed,
      rt_tf.passed as retest_passed,
      rt_tf.attempt_number as retest_attempt_number,
      ra_tf.max_attempts as retest_max_attempts,
      rt_tf.last_attempt_at
  FROM true_false_tests tft
  INNER JOIN latest_assignments la ON tft.id = la.test_id AND la.test_type = 'true_false' AND la.rn = 1
  LEFT JOIN subjects s ON la.subject_id = s.subject_id
  LEFT JOIN users u ON u.grade = la.grade AND u.class = la.class
  LEFT JOIN teachers t ON tft.teacher_id = t.teacher_id
  LEFT JOIN LATERAL (
      SELECT tfr_inner.id
      FROM true_false_test_results tfr_inner
      WHERE tfr_inner.student_id = u.student_id
        AND tfr_inner.test_id = tft.id
        AND tfr_inner.is_completed = true
      ORDER BY tfr_inner.submitted_at DESC NULLS LAST, tfr_inner.id DESC
      LIMIT 1
  ) tfr ON true
  LEFT JOIN LATERAL (
      SELECT ra_inner.id,
             ra_inner.max_attempts,
             ra_inner.window_start,
             ra_inner.window_end,
             ra_inner.passing_threshold,
             ra_inner.created_at
      FROM retest_assignments ra_inner
      WHERE ra_inner.test_type = 'true_false'
        AND ra_inner.test_id = tft.id
        AND NOW() BETWEEN ra_inner.window_start AND ra_inner.window_end
      ORDER BY ra_inner.window_start DESC NULLS LAST, ra_inner.created_at DESC NULLS LAST, ra_inner.id DESC
      LIMIT 1
  ) ra_tf ON true
  LEFT JOIN retest_targets rt_tf ON 
      rt_tf.retest_assignment_id = ra_tf.id
      AND rt_tf.student_id = u.student_id
  WHERE (
      tfr.id IS NULL
      OR ra_tf.id IS NOT NULL
    )
    AND (
      rt_tf.id IS NULL
      OR rt_tf.is_completed = FALSE
    )
    AND NOT (
      tfr.id IS NOT NULL
      AND rt_tf.id IS NOT NULL
      AND rt_tf.is_completed = TRUE
    )
  ORDER BY
      u.student_id,
      tft.id,
      CASE
        WHEN ra_tf.id IS NOT NULL AND (rt_tf.id IS NULL OR rt_tf.is_completed = FALSE) THEN 0
        ELSE 1
      END,
      COALESCE(rt_tf.last_attempt_at, la.assigned_at) DESC
) true_false
UNION ALL
SELECT * FROM (
  SELECT DISTINCT ON (u.student_id, it.id)
      'input' as test_type,
      it.id as test_id,
      it.test_name,
      it.num_questions,
      it.created_at,
      it.updated_at,
      la.id as assignment_id,
      la.teacher_id,
      la.subject_id,
      la.grade,
      la.class,
      la.academic_period_id,
      la.assigned_at,
      la.due_date,
      la.is_active,
      u.student_id,
      s.subject as subject_name,
      t.username as teacher_name,
      itr.id as result_id,
      ra_in.id as retest_assignment_id,
      rt_in.id as retest_target_id,
      rt_in.is_completed as retest_is_completed,
      rt_in.passed as retest_passed,
      rt_in.attempt_number as retest_attempt_number,
      ra_in.max_attempts as retest_max_attempts,
      rt_in.last_attempt_at
  FROM input_tests it
  INNER JOIN latest_assignments la ON it.id = la.test_id AND la.test_type = 'input' AND la.rn = 1
  LEFT JOIN subjects s ON la.subject_id = s.subject_id
  LEFT JOIN users u ON u.grade = la.grade AND u.class = la.class
  LEFT JOIN teachers t ON it.teacher_id = t.teacher_id
  LEFT JOIN LATERAL (
      SELECT itr_inner.id
      FROM input_test_results itr_inner
      WHERE itr_inner.student_id = u.student_id
        AND itr_inner.test_id = it.id
        AND itr_inner.is_completed = true
      ORDER BY itr_inner.submitted_at DESC NULLS LAST, itr_inner.id DESC
      LIMIT 1
  ) itr ON true
  LEFT JOIN LATERAL (
      SELECT ra_inner.id,
             ra_inner.max_attempts,
             ra_inner.window_start,
             ra_inner.window_end,
             ra_inner.passing_threshold,
             ra_inner.created_at
      FROM retest_assignments ra_inner
      WHERE ra_inner.test_type = 'input'
        AND ra_inner.test_id = it.id
        AND NOW() BETWEEN ra_inner.window_start AND ra_inner.window_end
      ORDER BY ra_inner.window_start DESC NULLS LAST, ra_inner.created_at DESC NULLS LAST, ra_inner.id DESC
      LIMIT 1
  ) ra_in ON true
  LEFT JOIN retest_targets rt_in ON 
      rt_in.retest_assignment_id = ra_in.id
      AND rt_in.student_id = u.student_id
  WHERE (
      itr.id IS NULL
      OR ra_in.id IS NOT NULL
    )
    AND (
      rt_in.id IS NULL
      OR rt_in.is_completed = FALSE
    )
    AND NOT (
      itr.id IS NOT NULL
      AND rt_in.id IS NOT NULL
      AND rt_in.is_completed = TRUE
    )
  ORDER BY
      u.student_id,
      it.id,
      CASE
        WHEN ra_in.id IS NOT NULL AND (rt_in.id IS NULL OR rt_in.is_completed = FALSE) THEN 0
        ELSE 1
      END,
      COALESCE(rt_in.last_attempt_at, la.assigned_at) DESC
) input_tests
UNION ALL
SELECT * FROM (
  SELECT DISTINCT ON (u.student_id, mtt.id)
      'matching_type' as test_type,
      mtt.id as test_id,
      mtt.test_name,
      mtt.num_blocks as num_questions,
      mtt.created_at,
      mtt.updated_at,
      la.id as assignment_id,
      la.teacher_id,
      la.subject_id,
      la.grade,
      la.class,
      la.academic_period_id,
      la.assigned_at,
      la.due_date,
      la.is_active,
      u.student_id,
      s.subject as subject_name,
      t.username as teacher_name,
      mttr.id as result_id,
      ra_mt.id as retest_assignment_id,
      rt_mt.id as retest_target_id,
      rt_mt.is_completed as retest_is_completed,
      rt_mt.passed as retest_passed,
      rt_mt.attempt_number as retest_attempt_number,
      ra_mt.max_attempts as retest_max_attempts,
      rt_mt.last_attempt_at
  FROM matching_type_tests mtt
  INNER JOIN latest_assignments la ON mtt.id = la.test_id AND la.test_type = 'matching_type' AND la.rn = 1
  LEFT JOIN subjects s ON la.subject_id = s.subject_id
  LEFT JOIN users u ON u.grade = la.grade AND u.class = la.class
  LEFT JOIN teachers t ON mtt.teacher_id = t.teacher_id
  LEFT JOIN LATERAL (
      SELECT mttr_inner.id
      FROM matching_type_test_results mttr_inner
      WHERE mttr_inner.student_id = u.student_id
        AND mttr_inner.test_id = mtt.id
        AND mttr_inner.is_completed = true
      ORDER BY mttr_inner.submitted_at DESC NULLS LAST, mttr_inner.id DESC
      LIMIT 1
  ) mttr ON true
  LEFT JOIN LATERAL (
      SELECT ra_inner.id,
             ra_inner.max_attempts,
             ra_inner.window_start,
             ra_inner.window_end,
             ra_inner.passing_threshold,
             ra_inner.created_at
      FROM retest_assignments ra_inner
      WHERE ra_inner.test_type = 'matching_type'
        AND ra_inner.test_id = mtt.id
        AND NOW() BETWEEN ra_inner.window_start AND ra_inner.window_end
      ORDER BY ra_inner.window_start DESC NULLS LAST, ra_inner.created_at DESC NULLS LAST, ra_inner.id DESC
      LIMIT 1
  ) ra_mt ON true
  LEFT JOIN retest_targets rt_mt ON 
      rt_mt.retest_assignment_id = ra_mt.id
      AND rt_mt.student_id = u.student_id
  WHERE (
      mttr.id IS NULL
      OR ra_mt.id IS NOT NULL
    )
    AND (
      rt_mt.id IS NULL
      OR rt_mt.is_completed = FALSE
    )
    AND NOT (
      mttr.id IS NOT NULL
      AND rt_mt.id IS NOT NULL
      AND rt_mt.is_completed = TRUE
    )
  ORDER BY
      u.student_id,
      mtt.id,
      CASE
        WHEN ra_mt.id IS NOT NULL AND (rt_mt.id IS NULL OR rt_mt.is_completed = FALSE) THEN 0
        ELSE 1
      END,
      COALESCE(rt_mt.last_attempt_at, la.assigned_at) DESC
) matching_tests
UNION ALL
SELECT * FROM (
  SELECT DISTINCT ON (u.student_id, wmt.id)
      'word_matching' as test_type,
      wmt.id as test_id,
      wmt.test_name,
      wmt.num_questions,
      wmt.created_at,
      wmt.updated_at,
      la.id as assignment_id,
      la.teacher_id,
      la.subject_id,
      la.grade,
      la.class,
      la.academic_period_id,
      la.assigned_at,
      la.due_date,
      la.is_active,
      u.student_id,
      s.subject as subject_name,
      t.username as teacher_name,
      wmtr.id as result_id,
      ra_wm.id as retest_assignment_id,
      rt_wm.id as retest_target_id,
      rt_wm.is_completed as retest_is_completed,
      rt_wm.passed as retest_passed,
      rt_wm.attempt_number as retest_attempt_number,
      ra_wm.max_attempts as retest_max_attempts,
      rt_wm.last_attempt_at
  FROM word_matching_tests wmt
  INNER JOIN latest_assignments la ON wmt.id = la.test_id AND la.test_type = 'word_matching' AND la.rn = 1
  LEFT JOIN subjects s ON la.subject_id = s.subject_id
  LEFT JOIN users u ON u.grade = la.grade AND u.class = la.class
  LEFT JOIN teachers t ON wmt.teacher_id = t.teacher_id
  LEFT JOIN LATERAL (
      SELECT wmtr_inner.id
      FROM word_matching_test_results wmtr_inner
      WHERE wmtr_inner.student_id = u.student_id
        AND wmtr_inner.test_id = wmt.id
        AND wmtr_inner.is_completed = true
      ORDER BY wmtr_inner.submitted_at DESC NULLS LAST, wmtr_inner.id DESC
      LIMIT 1
  ) wmtr ON true
  LEFT JOIN LATERAL (
      SELECT ra_inner.id,
             ra_inner.max_attempts,
             ra_inner.window_start,
             ra_inner.window_end,
             ra_inner.passing_threshold,
             ra_inner.created_at
      FROM retest_assignments ra_inner
      WHERE ra_inner.test_type = 'word_matching'
        AND ra_inner.test_id = wmt.id
        AND NOW() BETWEEN ra_inner.window_start AND ra_inner.window_end
      ORDER BY ra_inner.window_start DESC NULLS LAST, ra_inner.created_at DESC NULLS LAST, ra_inner.id DESC
      LIMIT 1
  ) ra_wm ON true
  LEFT JOIN retest_targets rt_wm ON 
      rt_wm.retest_assignment_id = ra_wm.id
      AND rt_wm.student_id = u.student_id
  WHERE (
      wmtr.id IS NULL
      OR ra_wm.id IS NOT NULL
    )
    AND (
      rt_wm.id IS NULL
      OR rt_wm.is_completed = FALSE
    )
    AND NOT (
      wmtr.id IS NOT NULL
      AND rt_wm.id IS NOT NULL
      AND rt_wm.is_completed = TRUE
    )
  ORDER BY
      u.student_id,
      wmt.id,
      CASE
        WHEN ra_wm.id IS NOT NULL AND (rt_wm.id IS NULL OR rt_wm.is_completed = FALSE) THEN 0
        ELSE 1
      END,
      COALESCE(rt_wm.last_attempt_at, la.assigned_at) DESC
) word_matching
UNION ALL
SELECT * FROM (
  SELECT DISTINCT ON (u.student_id, dt.id)
      'drawing' as test_type,
      dt.id as test_id,
      dt.test_name,
      dt.num_questions,
      dt.created_at,
      dt.updated_at,
      la.id as assignment_id,
      la.teacher_id,
      la.subject_id,
      la.grade,
      la.class,
      la.academic_period_id,
      la.assigned_at,
      la.due_date,
      la.is_active,
      u.student_id,
      s.subject as subject_name,
      t.username as teacher_name,
      dtr.id as result_id,
      ra_dr.id as retest_assignment_id,
      rt_dr.id as retest_target_id,
      rt_dr.is_completed as retest_is_completed,
      rt_dr.passed as retest_passed,
      rt_dr.attempt_number as retest_attempt_number,
      ra_dr.max_attempts as retest_max_attempts,
      rt_dr.last_attempt_at
  FROM drawing_tests dt
  INNER JOIN latest_assignments la ON dt.id = la.test_id AND la.test_type = 'drawing' AND la.rn = 1
  LEFT JOIN subjects s ON la.subject_id = s.subject_id
  LEFT JOIN users u ON u.grade = la.grade AND u.class = la.class
  LEFT JOIN teachers t ON dt.teacher_id = t.teacher_id
  LEFT JOIN LATERAL (
      SELECT dtr_inner.id
      FROM drawing_test_results dtr_inner
      WHERE dtr_inner.student_id = u.student_id
        AND dtr_inner.test_id = dt.id
        AND dtr_inner.is_completed = true
      ORDER BY dtr_inner.submitted_at DESC NULLS LAST, dtr_inner.id DESC
      LIMIT 1
  ) dtr ON true
  LEFT JOIN LATERAL (
      SELECT ra_inner.id,
             ra_inner.max_attempts,
             ra_inner.window_start,
             ra_inner.window_end,
             ra_inner.passing_threshold,
             ra_inner.created_at
      FROM retest_assignments ra_inner
      WHERE ra_inner.test_type = 'drawing'
        AND ra_inner.test_id = dt.id
        AND NOW() BETWEEN ra_inner.window_start AND ra_inner.window_end
      ORDER BY ra_inner.window_start DESC NULLS LAST, ra_inner.created_at DESC NULLS LAST, ra_inner.id DESC
      LIMIT 1
  ) ra_dr ON true
  LEFT JOIN retest_targets rt_dr ON 
      rt_dr.retest_assignment_id = ra_dr.id
      AND rt_dr.student_id = u.student_id
  WHERE (
      dtr.id IS NULL
      OR ra_dr.id IS NOT NULL
    )
    AND (
      rt_dr.id IS NULL
      OR rt_dr.is_completed = FALSE
    )
    AND NOT (
      dtr.id IS NOT NULL
      AND rt_dr.id IS NOT NULL
      AND rt_dr.is_completed = TRUE
    )
  ORDER BY
      u.student_id,
      dt.id,
      CASE
        WHEN ra_dr.id IS NOT NULL AND (rt_dr.id IS NULL OR rt_dr.is_completed = FALSE) THEN 0
        ELSE 1
      END,
      COALESCE(rt_dr.last_attempt_at, la.assigned_at) DESC
) drawing_tests
UNION ALL
SELECT * FROM (
  SELECT DISTINCT ON (u.student_id, fbt.id)
      'fill_blanks' as test_type,
      fbt.id as test_id,
      fbt.test_name,
      fbt.num_blanks as num_questions,
      fbt.created_at,
      fbt.updated_at,
      la.id as assignment_id,
      la.teacher_id,
      la.subject_id,
      la.grade,
      la.class,
      la.academic_period_id,
      la.assigned_at,
      la.due_date,
      la.is_active,
      u.student_id,
      s.subject as subject_name,
      t.username as teacher_name,
      fbtr.id as result_id,
      ra_fb.id as retest_assignment_id,
      rt_fb.id as retest_target_id,
      rt_fb.is_completed as retest_is_completed,
      rt_fb.passed as retest_passed,
      rt_fb.attempt_number as retest_attempt_number,
      ra_fb.max_attempts as retest_max_attempts,
      rt_fb.last_attempt_at
  FROM fill_blanks_tests fbt
  INNER JOIN latest_assignments la ON fbt.id = la.test_id AND la.test_type = 'fill_blanks' AND la.rn = 1
  LEFT JOIN subjects s ON la.subject_id = s.subject_id
  LEFT JOIN users u ON u.grade = la.grade AND u.class = la.class
  LEFT JOIN teachers t ON fbt.teacher_id = t.teacher_id
  LEFT JOIN LATERAL (
      SELECT fbtr_inner.id
      FROM fill_blanks_test_results fbtr_inner
      WHERE fbtr_inner.student_id = u.student_id
        AND fbtr_inner.test_id = fbt.id
        AND fbtr_inner.is_completed = true
      ORDER BY fbtr_inner.submitted_at DESC NULLS LAST, fbtr_inner.id DESC
      LIMIT 1
  ) fbtr ON true
  LEFT JOIN LATERAL (
      SELECT ra_inner.id,
             ra_inner.max_attempts,
             ra_inner.window_start,
             ra_inner.window_end,
             ra_inner.passing_threshold,
             ra_inner.created_at
      FROM retest_assignments ra_inner
      WHERE ra_inner.test_type = 'fill_blanks'
        AND ra_inner.test_id = fbt.id
        AND NOW() BETWEEN ra_inner.window_start AND ra_inner.window_end
      ORDER BY ra_inner.window_start DESC NULLS LAST, ra_inner.created_at DESC NULLS LAST, ra_inner.id DESC
      LIMIT 1
  ) ra_fb ON true
  LEFT JOIN retest_targets rt_fb ON 
      rt_fb.retest_assignment_id = ra_fb.id
      AND rt_fb.student_id = u.student_id
  WHERE (
      fbtr.id IS NULL
      OR ra_fb.id IS NOT NULL
    )
    AND (
      rt_fb.id IS NULL
      OR rt_fb.is_completed = FALSE
    )
    AND NOT (
      fbtr.id IS NOT NULL
      AND rt_fb.id IS NOT NULL
      AND rt_fb.is_completed = TRUE
    )
  ORDER BY
      u.student_id,
      fbt.id,
      CASE
        WHEN ra_fb.id IS NOT NULL AND (rt_fb.id IS NULL OR rt_fb.is_completed = FALSE) THEN 0
        ELSE 1
      END,
      COALESCE(rt_fb.last_attempt_at, la.assigned_at) DESC
) fill_blanks
UNION ALL
SELECT * FROM (
  SELECT DISTINCT ON (u.student_id, st.id)
      'speaking' as test_type,
      st.id as test_id,
      st.test_name,
      st.min_words as num_questions,
      st.created_at,
      st.updated_at,
      la.id as assignment_id,
      la.teacher_id,
      la.subject_id,
      la.grade,
      la.class,
      la.academic_period_id,
      la.assigned_at,
      la.due_date,
      la.is_active,
      u.student_id,
      s.subject as subject_name,
      t.username as teacher_name,
      str.id as result_id,
      ra_sp.id as retest_assignment_id,
      rt_sp.id as retest_target_id,
      rt_sp.is_completed as retest_is_completed,
      rt_sp.passed as retest_passed,
      rt_sp.attempt_number as retest_attempt_number,
      ra_sp.max_attempts as retest_max_attempts,
      rt_sp.last_attempt_at
  FROM speaking_tests st
  INNER JOIN latest_assignments la ON st.id = la.test_id AND la.test_type = 'speaking' AND la.rn = 1
  LEFT JOIN subjects s ON la.subject_id = s.subject_id
  LEFT JOIN users u ON u.grade = la.grade AND u.class = la.class
  LEFT JOIN teachers t ON st.teacher_id = t.teacher_id
  LEFT JOIN LATERAL (
      SELECT str_inner.id
      FROM speaking_test_results str_inner
      WHERE str_inner.student_id = u.student_id
        AND str_inner.test_id = st.id
        AND str_inner.is_completed = true
      ORDER BY str_inner.submitted_at DESC NULLS LAST, str_inner.id DESC
      LIMIT 1
  ) str ON true
  LEFT JOIN LATERAL (
      SELECT ra_inner.id,
             ra_inner.max_attempts,
             ra_inner.window_start,
             ra_inner.window_end,
             ra_inner.passing_threshold,
             ra_inner.created_at
      FROM retest_assignments ra_inner
      WHERE ra_inner.test_type = 'speaking'
        AND ra_inner.test_id = st.id
        AND NOW() BETWEEN ra_inner.window_start AND ra_inner.window_end
      ORDER BY ra_inner.window_start DESC NULLS LAST, ra_inner.created_at DESC NULLS LAST, ra_inner.id DESC
      LIMIT 1
  ) ra_sp ON true
  LEFT JOIN retest_targets rt_sp ON 
      rt_sp.retest_assignment_id = ra_sp.id
      AND rt_sp.student_id = u.student_id
  WHERE (
      str.id IS NULL
      OR ra_sp.id IS NOT NULL
    )
    AND (
      rt_sp.id IS NULL
      OR rt_sp.is_completed = FALSE
    )
    AND NOT (
      str.id IS NOT NULL
      AND rt_sp.id IS NOT NULL
      AND rt_sp.is_completed = TRUE
    )
  ORDER BY
      u.student_id,
      st.id,
      CASE
        WHEN ra_sp.id IS NOT NULL AND (rt_sp.id IS NULL OR rt_sp.is_completed = FALSE) THEN 0
        ELSE 1
      END,
      COALESCE(rt_sp.last_attempt_at, la.assigned_at) DESC
) speaking_tests
ORDER BY assigned_at DESC, test_id DESC;
