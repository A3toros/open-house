const { neon } = require('@neondatabase/serverless');
const { validateToken } = require('./validate-token');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ success: false, error: 'Method not allowed' }) };
  }

  try {
    const result = validateToken(event);
    if (!result.success) {
      return { statusCode: result.statusCode || 401, headers, body: JSON.stringify({ success: false, error: result.error }) };
    }
    const user = result.user;
    if (user.role !== 'teacher' && user.role !== 'admin') {
      return { statusCode: 403, headers, body: JSON.stringify({ success: false, error: 'Forbidden' }) };
    }

    const payload = JSON.parse(event.body || '{}');
    console.log('[RETEST CREATE] Raw payload:', JSON.stringify(payload));
    console.log('[RETEST CREATE] payload.max_attempts type:', typeof payload.max_attempts, 'value:', payload.max_attempts);
    
    const {
      test_type,
      original_test_id: test_id,
      teacher_id,
      subject_id,
      grade,
      class: className,
      student_ids,
      passing_threshold = 50.0,
      scoring_policy = 'BEST',
      max_attempts = 1,
      window_start,
      window_end
    } = payload;

    console.log('[RETEST CREATE] After destructuring - max_attempts:', max_attempts, 'type:', typeof max_attempts);
    console.log('[RETEST CREATE] payload.max_attempts was:', payload.max_attempts, 'default applied:', payload.max_attempts === undefined);

    if (!test_type || !test_id || !subject_id || !grade || !className || !Array.isArray(student_ids) || student_ids.length === 0 || !window_start || !window_end) {
      return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: 'Missing required fields' }) };
    }

    const effectiveTeacherId = user.role === 'admin' ? (teacher_id || user.teacher_id) : user.teacher_id;
    if (!effectiveTeacherId) {
      return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: 'teacher_id is required' }) };
    }

    const sql = neon(process.env.NEON_DATABASE_URL);

    console.log('[RETEST CREATE] About to insert with max_attempts:', max_attempts, 'type:', typeof max_attempts);
    console.log('[RETEST CREATE] All insert values:', {
      test_type,
      test_id,
      teacher_id: effectiveTeacherId,
      subject_id,
      grade,
      class: className,
      passing_threshold,
      scoring_policy,
      max_attempts,
      window_start,
      window_end
    });

    await sql`BEGIN`;
    const insertAssignment = await sql`
      INSERT INTO retest_assignments(
        test_type, test_id, teacher_id, subject_id, grade, class, passing_threshold, scoring_policy, max_attempts, window_start, window_end
      ) VALUES (
        ${test_type}, ${test_id}, ${effectiveTeacherId}, ${subject_id}, ${grade}, ${className}, ${passing_threshold}, ${scoring_policy}, ${max_attempts}, ${window_start}, ${window_end}
      ) RETURNING id
    `;
    const retestId = insertAssignment[0].id;
    
    console.log('[RETEST CREATE] Inserted retest assignment with id:', retestId);
    
    // Verify what was actually written
    const verifyInsert = await sql`
      SELECT max_attempts FROM retest_assignments WHERE id = ${retestId}
    `;
    console.log('[RETEST CREATE] Verified max_attempts in DB:', verifyInsert[0]?.max_attempts);

    console.log('[RETEST CREATE] Creating retest_targets for', student_ids.length, 'students');
    for (const sid of student_ids) {
      // Insert retest_targets with new columns: max_attempts, attempt_number, is_completed, passed
      await sql`
        INSERT INTO retest_targets (
          retest_assignment_id,
          student_id,
          max_attempts,
          attempt_number,
          attempt_count,
          is_completed,
          passed,
          status
        )
        SELECT 
          ${retestId},
          ${sid},
          ra.max_attempts,
          0,
          0,
          FALSE,
          FALSE,
          'PENDING'
        FROM retest_assignments ra
        WHERE ra.id = ${retestId}
        ON CONFLICT (retest_assignment_id, student_id) DO NOTHING
      `;
      console.log('[RETEST CREATE] Created retest_target for student:', sid);
      
      // Mark retest offered in the student's original result row(s)
      await sql`SELECT set_retest_offered(${sid}, ${test_id}, true)`;
      console.log('[RETEST CREATE] Called set_retest_offered for student:', sid, 'test_id:', test_id);
      
      // CRITICAL: Write retest_assignment_id to ALL 8 test result tables
      // This allows queries to find which retest assignment a result belongs to
      
      // 1. Multiple Choice
      await sql`
        UPDATE multiple_choice_test_results
        SET retest_assignment_id = ${retestId}
        WHERE student_id = ${sid} AND test_id = ${test_id}
      `;
      
      // 2. True/False
      await sql`
        UPDATE true_false_test_results
        SET retest_assignment_id = ${retestId}
        WHERE student_id = ${sid} AND test_id = ${test_id}
      `;
      
      // 3. Input
      await sql`
        UPDATE input_test_results
        SET retest_assignment_id = ${retestId}
        WHERE student_id = ${sid} AND test_id = ${test_id}
      `;
      
      // 4. Matching Type
      await sql`
        UPDATE matching_type_test_results
        SET retest_assignment_id = ${retestId}
        WHERE student_id = ${sid} AND test_id = ${test_id}
      `;
      
      // 5. Word Matching
      await sql`
        UPDATE word_matching_test_results
        SET retest_assignment_id = ${retestId}
        WHERE student_id = ${sid} AND test_id = ${test_id}
      `;
      
      // 6. Drawing
      await sql`
        UPDATE drawing_test_results
        SET retest_assignment_id = ${retestId}
        WHERE student_id = ${sid} AND test_id = ${test_id}
      `;
      
      // 7. Fill Blanks
      await sql`
        UPDATE fill_blanks_test_results
        SET retest_assignment_id = ${retestId}
        WHERE student_id = ${sid} AND test_id = ${test_id}
      `;
      
      // 8. Speaking
      await sql`
        UPDATE speaking_test_results
        SET retest_assignment_id = ${retestId}
        WHERE student_id = ${sid} AND test_id = ${test_id}
      `;
      
      console.log('[RETEST CREATE] Updated retest_assignment_id in all 8 test result tables for student:', sid);
    }

    // Clear completion keys for students who will get retests
    // This allows them to retake the test even if they previously completed it
    console.log('Clearing completion keys for retest students:', student_ids);
    for (const sid of student_ids) {
      // We can't directly clear localStorage from backend, but we can:
      // 1. Set a flag in the database that the frontend can check
      // 2. Or rely on the retest_available flag to override completion status
      // For now, we'll rely on the retest_available flag approach
      console.log(`Retest created for student ${sid} on test ${test_type}_${test_id}`);
    }

    await sql`COMMIT`;
    console.log('[RETEST CREATE] Transaction committed successfully. Retest ID:', retestId);

    return { statusCode: 200, headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ success: true, retest_id: retestId }) };
  } catch (error) {
    console.error('[RETEST CREATE] Error occurred:', error);
    console.error('[RETEST CREATE] Error stack:', error.stack);
    try { const sql = neon(process.env.NEON_DATABASE_URL); await sql`ROLLBACK`; } catch (e) {
      console.error('[RETEST CREATE] Rollback error:', e);
    }
    return { statusCode: 500, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }, body: JSON.stringify({ success: false, error: error.message }) };
  }
};


