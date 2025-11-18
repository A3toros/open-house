-- View: teacher_classes_summary_view
-- Purpose: Summarize classes per teacher/subject with count of active students

CREATE OR REPLACE VIEW teacher_classes_summary_view AS
SELECT
    ts.teacher_id,
    ts.subject_id,
    s.subject as subject_name,
    ts.grade,
    ts.class,
    COUNT(*) FILTER (WHERE u.is_active) AS active_students
FROM teacher_subjects ts
JOIN users u
  ON u.grade = ts.grade
 AND u.class = ts.class
LEFT JOIN subjects s ON ts.subject_id = s.subject_id
GROUP BY ts.teacher_id, ts.subject_id, s.subject, ts.grade, ts.class;


