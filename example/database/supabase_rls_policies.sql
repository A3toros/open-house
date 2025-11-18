-- ========================================
-- SUPABASE ROW LEVEL SECURITY (RLS) POLICIES
-- ========================================
-- This file contains all RLS policies for the Mathayomwatsing system
-- Enables database-level security with Supabase Auth integration

-- ========================================
-- 1. ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- ========================================

-- Core user tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_year ENABLE ROW LEVEL SECURITY;

-- Test result tables
ALTER TABLE multiple_choice_test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE true_false_test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE input_test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE matching_type_test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE word_matching_test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE drawing_test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE fill_blanks_test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE speaking_test_results ENABLE ROW LEVEL SECURITY;

-- Test tables
ALTER TABLE multiple_choice_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE true_false_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE input_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE matching_type_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE word_matching_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE drawing_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE fill_blanks_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE speaking_tests ENABLE ROW LEVEL SECURITY;

-- Test question tables
ALTER TABLE multiple_choice_test_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE true_false_test_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE input_test_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE matching_type_test_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE matching_type_test_arrows ENABLE ROW LEVEL SECURITY;
ALTER TABLE word_matching_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE drawing_test_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE drawing_test_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE fill_blanks_test_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE speaking_test_questions ENABLE ROW LEVEL SECURITY;

-- Test management tables
ALTER TABLE test_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_subjects ENABLE ROW LEVEL SECURITY;

-- Retest system tables
ALTER TABLE retest_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE retest_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_attempts ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 2. STUDENT POLICIES
-- ========================================

-- Students can view their own user data
CREATE POLICY "Students can view own user data" ON users
  FOR SELECT USING (auth.uid()::text = student_id);

-- Students can view their own test results
CREATE POLICY "Students can view own multiple choice results" ON multiple_choice_test_results
  FOR SELECT USING (auth.uid()::text = student_id);

CREATE POLICY "Students can view own true false results" ON true_false_test_results
  FOR SELECT USING (auth.uid()::text = student_id);

CREATE POLICY "Students can view own input results" ON input_test_results
  FOR SELECT USING (auth.uid()::text = student_id);

CREATE POLICY "Students can view own matching results" ON matching_type_test_results
  FOR SELECT USING (auth.uid()::text = student_id);

CREATE POLICY "Students can view own word matching results" ON word_matching_test_results
  FOR SELECT USING (auth.uid()::text = student_id);

CREATE POLICY "Students can view own drawing results" ON drawing_test_results
  FOR SELECT USING (auth.uid()::text = student_id);

CREATE POLICY "Students can view own fill blanks results" ON fill_blanks_test_results
  FOR SELECT USING (auth.uid()::text = student_id);

CREATE POLICY "Students can view own speaking results" ON speaking_test_results
  FOR SELECT USING (auth.uid()::text = student_id);

-- Students can view subjects (read-only)
CREATE POLICY "Students can view subjects" ON subjects
  FOR SELECT USING (true);

-- Note: academic_periods table is for convenience only, not actively used

-- Students can view test assignments for their grade/class
CREATE POLICY "Students can view own grade class tests" ON test_assignments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.student_id = auth.uid()::text 
      AND users.grade = test_assignments.grade 
      AND users.class = test_assignments.class
    )
  );

-- Students can view tests assigned to their grade/class
CREATE POLICY "Students can view assigned multiple choice tests" ON multiple_choice_tests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM test_assignments ta
      JOIN users u ON u.grade = ta.grade AND u.class = ta.class
      WHERE ta.test_id = multiple_choice_tests.id 
      AND ta.test_type = 'multiple_choice'
      AND u.student_id = auth.uid()::text
    )
  );

CREATE POLICY "Students can view assigned true false tests" ON true_false_tests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM test_assignments ta
      JOIN users u ON u.grade = ta.grade AND u.class = ta.class
      WHERE ta.test_id = true_false_tests.id 
      AND ta.test_type = 'true_false'
      AND u.student_id = auth.uid()::text
    )
  );

CREATE POLICY "Students can view assigned input tests" ON input_tests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM test_assignments ta
      JOIN users u ON u.grade = ta.grade AND u.class = ta.class
      WHERE ta.test_id = input_tests.id 
      AND ta.test_type = 'input'
      AND u.student_id = auth.uid()::text
    )
  );

CREATE POLICY "Students can view assigned matching type tests" ON matching_type_tests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM test_assignments ta
      JOIN users u ON u.grade = ta.grade AND u.class = ta.class
      WHERE ta.test_id = matching_type_tests.id 
      AND ta.test_type = 'matching_type'
      AND u.student_id = auth.uid()::text
    )
  );

CREATE POLICY "Students can view assigned word matching tests" ON word_matching_tests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM test_assignments ta
      JOIN users u ON u.grade = ta.grade AND u.class = ta.class
      WHERE ta.test_id = word_matching_tests.id 
      AND ta.test_type = 'word_matching'
      AND u.student_id = auth.uid()::text
    )
  );

CREATE POLICY "Students can view assigned drawing tests" ON drawing_tests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM test_assignments ta
      JOIN users u ON u.grade = ta.grade AND u.class = ta.class
      WHERE ta.test_id = drawing_tests.id 
      AND ta.test_type = 'drawing'
      AND u.student_id = auth.uid()::text
    )
  );

CREATE POLICY "Students can view assigned fill blanks tests" ON fill_blanks_tests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM test_assignments ta
      JOIN users u ON u.grade = ta.grade AND u.class = ta.class
      WHERE ta.test_id = fill_blanks_tests.id 
      AND ta.test_type = 'fill_blanks'
      AND u.student_id = auth.uid()::text
    )
  );

CREATE POLICY "Students can view assigned speaking tests" ON speaking_tests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM test_assignments ta
      JOIN users u ON u.grade = ta.grade AND u.class = ta.class
      WHERE ta.test_id = speaking_tests.id 
      AND ta.test_type = 'speaking'
      AND u.student_id = auth.uid()::text
    )
  );

-- Students can view questions for assigned tests
CREATE POLICY "Students can view questions for assigned multiple choice tests" ON multiple_choice_test_questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM test_assignments ta
      JOIN users u ON u.grade = ta.grade AND u.class = ta.class
      WHERE ta.test_id = multiple_choice_test_questions.test_id 
      AND ta.test_type = 'multiple_choice'
      AND u.student_id = auth.uid()::text
    )
  );

CREATE POLICY "Students can view questions for assigned true false tests" ON true_false_test_questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM test_assignments ta
      JOIN users u ON u.grade = ta.grade AND u.class = ta.class
      WHERE ta.test_id = true_false_test_questions.test_id 
      AND ta.test_type = 'true_false'
      AND u.student_id = auth.uid()::text
    )
  );

CREATE POLICY "Students can view questions for assigned input tests" ON input_test_questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM test_assignments ta
      JOIN users u ON u.grade = ta.grade AND u.class = ta.class
      WHERE ta.test_id = input_test_questions.test_id 
      AND ta.test_type = 'input'
      AND u.student_id = auth.uid()::text
    )
  );

CREATE POLICY "Students can view questions for assigned matching type tests" ON matching_type_test_questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM test_assignments ta
      JOIN users u ON u.grade = ta.grade AND u.class = ta.class
      WHERE ta.test_id = matching_type_test_questions.test_id 
      AND ta.test_type = 'matching_type'
      AND u.student_id = auth.uid()::text
    )
  );

CREATE POLICY "Students can view arrows for assigned matching type tests" ON matching_type_test_arrows
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM matching_type_test_questions mtq
      JOIN test_assignments ta ON ta.test_id = mtq.test_id AND ta.test_type = 'matching_type'
      JOIN users u ON u.grade = ta.grade AND u.class = ta.class
      WHERE mtq.id = matching_type_test_arrows.question_id
      AND u.student_id = auth.uid()::text
    )
  );

CREATE POLICY "Students can view questions for assigned word matching tests" ON word_matching_questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM test_assignments ta
      JOIN users u ON u.grade = ta.grade AND u.class = ta.class
      WHERE ta.test_id = word_matching_questions.test_id 
      AND ta.test_type = 'word_matching'
      AND u.student_id = auth.uid()::text
    )
  );

CREATE POLICY "Students can view questions for assigned drawing tests" ON drawing_test_questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM test_assignments ta
      JOIN users u ON u.grade = ta.grade AND u.class = ta.class
      WHERE ta.test_id = drawing_test_questions.test_id 
      AND ta.test_type = 'drawing'
      AND u.student_id = auth.uid()::text
    )
  );

CREATE POLICY "Students can view questions for assigned fill blanks tests" ON fill_blanks_test_questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM test_assignments ta
      JOIN users u ON u.grade = ta.grade AND u.class = ta.class
      WHERE ta.test_id = fill_blanks_test_questions.test_id 
      AND ta.test_type = 'fill_blanks'
      AND u.student_id = auth.uid()::text
    )
  );

CREATE POLICY "Students can view questions for assigned speaking tests" ON speaking_test_questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM test_assignments ta
      JOIN users u ON u.grade = ta.grade AND u.class = ta.class
      WHERE ta.test_id = speaking_test_questions.test_id 
      AND ta.test_type = 'speaking'
      AND u.student_id = auth.uid()::text
    )
  );

-- Students can view retest targets for themselves
CREATE POLICY "Students can view own retest targets" ON retest_targets
  FOR SELECT USING (auth.uid()::text = student_id);

-- ========================================
-- 3. TEACHER POLICIES
-- ========================================

-- Teachers can view their own teacher data
CREATE POLICY "Teachers can view own teacher data" ON teachers
  FOR SELECT USING (auth.uid()::text = teacher_id);

-- Teachers can view students in their classes
CREATE POLICY "Teachers can view students in their classes" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM teacher_subjects ts
      WHERE ts.teacher_id = auth.uid()::text
      AND ts.grade = users.grade
      AND ts.class = users.class
    )
  );

-- Teachers can view all test results for their students
CREATE POLICY "Teachers can view student multiple choice results" ON multiple_choice_test_results
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM teacher_subjects ts
      JOIN users u ON u.grade = ts.grade AND u.class = ts.class
      WHERE ts.teacher_id = auth.uid()::text
      AND u.student_id = multiple_choice_test_results.student_id
    )
  );

CREATE POLICY "Teachers can view student true false results" ON true_false_test_results
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM teacher_subjects ts
      JOIN users u ON u.grade = ts.grade AND u.class = ts.class
      WHERE ts.teacher_id = auth.uid()::text
      AND u.student_id = true_false_test_results.student_id
    )
  );

CREATE POLICY "Teachers can view student input results" ON input_test_results
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM teacher_subjects ts
      JOIN users u ON u.grade = ts.grade AND u.class = ts.class
      WHERE ts.teacher_id = auth.uid()::text
      AND u.student_id = input_test_results.student_id
    )
  );

CREATE POLICY "Teachers can view student matching results" ON matching_type_test_results
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM teacher_subjects ts
      JOIN users u ON u.grade = ts.grade AND u.class = ts.class
      WHERE ts.teacher_id = auth.uid()::text
      AND u.student_id = matching_type_test_results.student_id
    )
  );

CREATE POLICY "Teachers can view student word matching results" ON word_matching_test_results
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM teacher_subjects ts
      JOIN users u ON u.grade = ts.grade AND u.class = ts.class
      WHERE ts.teacher_id = auth.uid()::text
      AND u.student_id = word_matching_test_results.student_id
    )
  );

CREATE POLICY "Teachers can view student drawing results" ON drawing_test_results
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM teacher_subjects ts
      JOIN users u ON u.grade = ts.grade AND u.class = ts.class
      WHERE ts.teacher_id = auth.uid()::text
      AND u.student_id = drawing_test_results.student_id
    )
  );

CREATE POLICY "Teachers can view student fill blanks results" ON fill_blanks_test_results
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM teacher_subjects ts
      JOIN users u ON u.grade = ts.grade AND u.class = ts.class
      WHERE ts.teacher_id = auth.uid()::text
      AND u.student_id = fill_blanks_test_results.student_id
    )
  );

CREATE POLICY "Teachers can view student speaking results" ON speaking_test_results
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM teacher_subjects ts
      JOIN users u ON u.grade = ts.grade AND u.class = ts.class
      WHERE ts.teacher_id = auth.uid()::text
      AND u.student_id = speaking_test_results.student_id
    )
  );

-- Teachers can manage their own test assignments
CREATE POLICY "Teachers can view own test assignments" ON test_assignments
  FOR SELECT USING (auth.uid()::text = teacher_id);

CREATE POLICY "Teachers can create test assignments" ON test_assignments
  FOR INSERT WITH CHECK (auth.uid()::text = teacher_id);

CREATE POLICY "Teachers can update own test assignments" ON test_assignments
  FOR UPDATE USING (auth.uid()::text = teacher_id);

CREATE POLICY "Teachers can delete own test assignments" ON test_assignments
  FOR DELETE USING (auth.uid()::text = teacher_id);

-- Teachers can manage their own subjects
CREATE POLICY "Teachers can view own subjects" ON teacher_subjects
  FOR SELECT USING (auth.uid()::text = teacher_id);

CREATE POLICY "Teachers can manage own subjects" ON teacher_subjects
  FOR ALL USING (auth.uid()::text = teacher_id);

-- Teachers can manage their own classes
-- Note: teacher_classes table is for convenience only, not actively used

-- Teachers can view subjects (read-only)
CREATE POLICY "Teachers can view subjects" ON subjects
  FOR SELECT USING (true);

-- Teachers can manage their own tests
CREATE POLICY "Teachers can view own tests" ON multiple_choice_tests
  FOR SELECT USING (auth.uid()::text = teacher_id);

CREATE POLICY "Teachers can manage own multiple choice tests" ON multiple_choice_tests
  FOR ALL USING (auth.uid()::text = teacher_id);

CREATE POLICY "Teachers can manage own true false tests" ON true_false_tests
  FOR ALL USING (auth.uid()::text = teacher_id);

CREATE POLICY "Teachers can manage own input tests" ON input_tests
  FOR ALL USING (auth.uid()::text = teacher_id);

CREATE POLICY "Teachers can manage own matching type tests" ON matching_type_tests
  FOR ALL USING (auth.uid()::text = teacher_id);

CREATE POLICY "Teachers can manage own word matching tests" ON word_matching_tests
  FOR ALL USING (auth.uid()::text = teacher_id);

CREATE POLICY "Teachers can manage own drawing tests" ON drawing_tests
  FOR ALL USING (auth.uid()::text = teacher_id);

CREATE POLICY "Teachers can manage own fill blanks tests" ON fill_blanks_tests
  FOR ALL USING (auth.uid()::text = teacher_id);

CREATE POLICY "Teachers can manage own speaking tests" ON speaking_tests
  FOR ALL USING (auth.uid()::text = teacher_id);

-- Teachers can manage test questions
CREATE POLICY "Teachers can manage multiple choice questions" ON multiple_choice_test_questions
  FOR ALL USING (auth.uid()::text = teacher_id);

CREATE POLICY "Teachers can manage true false questions" ON true_false_test_questions
  FOR ALL USING (auth.uid()::text = teacher_id);

CREATE POLICY "Teachers can manage input questions" ON input_test_questions
  FOR ALL USING (auth.uid()::text = teacher_id);

CREATE POLICY "Teachers can manage matching type questions" ON matching_type_test_questions
  FOR ALL USING (auth.uid()::text = teacher_id);

CREATE POLICY "Teachers can manage matching type arrows" ON matching_type_test_arrows
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM matching_type_test_questions mtq
      WHERE mtq.id = matching_type_test_arrows.question_id
      AND mtq.teacher_id = auth.uid()::text
    )
  );

CREATE POLICY "Teachers can manage word matching questions" ON word_matching_questions
  FOR ALL USING (auth.uid()::text = teacher_id);

CREATE POLICY "Teachers can manage drawing questions" ON drawing_test_questions
  FOR ALL USING (auth.uid()::text = teacher_id);

CREATE POLICY "Teachers can manage drawing images" ON drawing_test_images
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM drawing_test_results dtr
      WHERE dtr.id = drawing_test_images.result_id
      AND dtr.teacher_id = auth.uid()::text
    )
  );

CREATE POLICY "Teachers can manage fill blanks questions" ON fill_blanks_test_questions
  FOR ALL USING (auth.uid()::text = teacher_id);

CREATE POLICY "Teachers can manage speaking questions" ON speaking_test_questions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM speaking_tests st
      WHERE st.id = speaking_test_questions.test_id
      AND st.teacher_id = auth.uid()::text
    )
  );

-- Teachers can manage retest system
CREATE POLICY "Teachers can manage own retest assignments" ON retest_assignments
  FOR ALL USING (auth.uid()::text = teacher_id);

CREATE POLICY "Teachers can view retest targets for own assignments" ON retest_targets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM retest_assignments ra
      WHERE ra.id = retest_targets.retest_assignment_id
      AND ra.teacher_id = auth.uid()::text
    )
  );

CREATE POLICY "Teachers can update retest targets for own assignments" ON retest_targets
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM retest_assignments ra
      WHERE ra.id = retest_targets.retest_assignment_id
      AND ra.teacher_id = auth.uid()::text
    )
  );

CREATE POLICY "Teachers can view test attempts for own students" ON test_attempts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM teacher_subjects ts
      JOIN users u ON u.grade = ts.grade AND u.class = ts.class
      WHERE ts.teacher_id = auth.uid()::text
      AND u.student_id = test_attempts.student_id
    )
  );

-- Students can view their own test attempts
CREATE POLICY "Students can view own test attempts" ON test_attempts
  FOR SELECT USING (auth.uid()::text = student_id);

CREATE POLICY "Students can create test attempts" ON test_attempts
  FOR INSERT WITH CHECK (auth.uid()::text = student_id);

CREATE POLICY "Students can update own test attempts" ON test_attempts
  FOR UPDATE USING (auth.uid()::text = student_id);

-- Note: academic_periods table is for convenience only, not actively used

-- ========================================
-- 4. ADMIN POLICIES
-- ========================================

-- Admins can view all data
CREATE POLICY "Admins can view all users" ON users
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can view all teachers" ON teachers
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can view all subjects" ON subjects
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Note: academic_periods table is for convenience only, not actively used

-- Admins can view all test results
CREATE POLICY "Admins can view all multiple choice results" ON multiple_choice_test_results
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can view all true false results" ON true_false_test_results
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can view all input results" ON input_test_results
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can view all matching results" ON matching_type_test_results
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can view all word matching results" ON word_matching_test_results
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can view all drawing results" ON drawing_test_results
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can view all fill blanks results" ON fill_blanks_test_results
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can view all speaking results" ON speaking_test_results
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Admins can manage all test assignments
CREATE POLICY "Admins can manage all test assignments" ON test_assignments
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can manage all teacher subjects" ON teacher_subjects
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Admins can manage all tests
CREATE POLICY "Admins can manage all multiple choice tests" ON multiple_choice_tests
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can manage all true false tests" ON true_false_tests
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can manage all input tests" ON input_tests
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can manage all matching type tests" ON matching_type_tests
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can manage all word matching tests" ON word_matching_tests
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can manage all drawing tests" ON drawing_tests
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can manage all fill blanks tests" ON fill_blanks_tests
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can manage all speaking tests" ON speaking_tests
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Admins can manage all test questions
CREATE POLICY "Admins can manage all multiple choice questions" ON multiple_choice_test_questions
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can manage all true false questions" ON true_false_test_questions
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can manage all input questions" ON input_test_questions
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can manage all matching type questions" ON matching_type_test_questions
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can manage all matching type arrows" ON matching_type_test_arrows
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can manage all word matching questions" ON word_matching_questions
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can manage all drawing questions" ON drawing_test_questions
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can manage all drawing images" ON drawing_test_images
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can manage all fill blanks questions" ON fill_blanks_test_questions
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can manage all speaking questions" ON speaking_test_questions
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Admins can manage retest system
CREATE POLICY "Admins can manage all retest assignments" ON retest_assignments
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can manage all retest targets" ON retest_targets
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can manage all test attempts" ON test_attempts
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Admins can manage academic year
CREATE POLICY "Admins can manage academic year" ON academic_year
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Note: teacher_classes table is for convenience only, not actively used

-- ========================================
-- 5. STORAGE POLICIES (for audio files)
-- ========================================

-- Students can upload their own audio files
CREATE POLICY "Students can upload own audio files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'audio' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Students can view their own audio files
CREATE POLICY "Students can view own audio files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'audio' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Teachers can view audio files from their students
CREATE POLICY "Teachers can view student audio files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'audio' 
    AND EXISTS (
      SELECT 1 FROM teacher_subjects ts
      JOIN users u ON u.grade = ts.grade AND u.class = ts.class
      WHERE ts.teacher_id = auth.uid()::text
      AND u.student_id = (storage.foldername(name))[1]
    )
  );

-- Admins can view all audio files
CREATE POLICY "Admins can view all audio files" ON storage.objects
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

-- ========================================
-- 6. VIEW POLICIES (for database views)
-- ========================================

-- Enable RLS on views (if they exist as tables)
-- Note: Views inherit RLS from their base tables automatically
-- No need to create policies on views - they use the base table policies

-- ========================================
-- 7. HELPER FUNCTIONS FOR RLS
-- ========================================

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN auth.jwt() ->> 'role' = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is teacher
CREATE OR REPLACE FUNCTION is_teacher()
RETURNS boolean AS $$
BEGIN
  RETURN auth.jwt() ->> 'role' = 'teacher';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is student
CREATE OR REPLACE FUNCTION is_student()
RETURNS boolean AS $$
BEGIN
  RETURN auth.jwt() ->> 'role' = 'student';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current user ID
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS text AS $$
BEGIN
  RETURN auth.uid()::text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if teacher has access to student
CREATE OR REPLACE FUNCTION teacher_has_student_access(student_id_param text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM teacher_subjects ts
    JOIN users u ON u.grade = ts.grade AND u.class = ts.class
    WHERE ts.teacher_id = auth.uid()::text
    AND u.student_id = student_id_param
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 8. PERFORMANCE OPTIMIZATION
-- ========================================

-- Create indexes for RLS performance
CREATE INDEX IF NOT EXISTS idx_users_student_id_auth ON users(student_id) WHERE student_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_teachers_teacher_id_auth ON teachers(teacher_id) WHERE teacher_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_test_results_student_id_auth ON multiple_choice_test_results(student_id);
CREATE INDEX IF NOT EXISTS idx_test_assignments_teacher_id_auth ON test_assignments(teacher_id);
-- Note: teacher_classes table is for convenience only, not actively used

-- ========================================
-- 9. VERIFICATION QUERIES
-- ========================================

-- Check RLS is enabled on all tables
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
  'users', 'teachers', 'admin', 'subjects', 'academic_year',
  'multiple_choice_test_results', 'true_false_test_results',
  'input_test_results', 'matching_type_test_results',
  'word_matching_test_results', 'drawing_test_results',
  'fill_blanks_test_results', 'speaking_test_results',
  'multiple_choice_tests', 'true_false_tests', 'input_tests',
  'matching_type_tests', 'word_matching_tests', 'drawing_tests',
  'fill_blanks_tests', 'speaking_tests',
  'multiple_choice_test_questions', 'true_false_test_questions',
  'input_test_questions', 'matching_type_test_questions',
  'matching_type_test_arrows', 'word_matching_questions',
  'drawing_test_questions', 'drawing_test_images',
  'fill_blanks_test_questions', 'speaking_test_questions',
  'test_assignments', 'teacher_subjects',
  'retest_assignments', 'retest_targets', 'test_attempts'
)
ORDER BY tablename;

-- Check policies are created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ========================================
-- 10. TESTING RLS POLICIES
-- ========================================

-- Test student access (run as student user)
-- SELECT * FROM users WHERE student_id = auth.uid()::text;
-- SELECT * FROM multiple_choice_test_results WHERE student_id = auth.uid()::text;

-- Test teacher access (run as teacher user)
-- SELECT * FROM teachers WHERE teacher_id = auth.uid()::text;
-- SELECT * FROM test_assignments WHERE teacher_id = auth.uid()::text;

-- Test admin access (run as admin user)
-- SELECT * FROM users; -- Should see all users
-- SELECT * FROM multiple_choice_test_results; -- Should see all results

-- ========================================
-- END OF RLS POLICIES
-- ========================================
