-- View: teacher_assignments_overview_view
-- Purpose: Flatten each teacher's test assignments with retest window info and test name

CREATE OR REPLACE VIEW teacher_assignments_overview_view AS
SELECT
    ta.teacher_id,
    ta.test_type,
    ta.test_id,
    ta.subject_id,
    ta.academic_period_id,
    ta.grade,
    ta.class,
    ta.assigned_at,
    ta.due_date,
    ta.is_active,
    ra.id AS retest_assignment_id,
    ra.window_start,
    ra.window_end,
    ra.max_attempts,
    EXTRACT(DAY FROM (ta.assigned_at + INTERVAL '7 days') - CURRENT_TIMESTAMP) AS days_remaining,
    COALESCE(
        mct.test_name,
        tft.test_name,
        it.test_name,
        mtt.test_name,
        wmt.test_name,
        dt.test_name,
        fbt.test_name,
        spt.test_name
    ) AS test_name
FROM test_assignments ta
LEFT JOIN retest_assignments ra
    ON ra.test_type = ta.test_type
   AND ra.test_id   = ta.test_id
LEFT JOIN multiple_choice_tests   mct ON ta.test_type = 'multiple_choice' AND mct.id = ta.test_id
LEFT JOIN true_false_tests        tft ON ta.test_type = 'true_false'      AND tft.id = ta.test_id
LEFT JOIN input_tests              it ON ta.test_type = 'input'            AND it.id  = ta.test_id
LEFT JOIN matching_type_tests     mtt ON ta.test_type = 'matching'         AND mtt.id = ta.test_id
LEFT JOIN word_matching_tests     wmt ON ta.test_type = 'word_matching'    AND wmt.id = ta.test_id
LEFT JOIN drawing_tests            dt ON ta.test_type = 'drawing'          AND dt.id  = ta.test_id
LEFT JOIN fill_blanks_tests       fbt ON ta.test_type = 'fill_blanks'      AND fbt.id = ta.test_id
LEFT JOIN speaking_tests          spt ON ta.test_type = 'speaking'         AND spt.id = ta.test_id
WHERE ta.is_active = true;


