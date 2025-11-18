const { neon } = require('@neondatabase/serverless');
const { validateToken } = require('./validate-token');

exports.handler = async function(event, context) {
  console.log('=== submit-matching-type-test function called ===');
  
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, message: 'Method not allowed' })
    };
  }

  try {
    // Validate token
    const tokenValidation = validateToken(event);
    if (!tokenValidation.success) {
      return {
        statusCode: tokenValidation.statusCode || 401,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: tokenValidation.error })
      };
    }

    const userInfo = tokenValidation.user;
    

    // Check if user is student
    if (userInfo.role !== 'student') {
      return {
        statusCode: 403,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Access denied. Student role required.' })
      };
    }

    const { 
      test_id, 
      test_name, 
      teacher_id, 
      subject_id, 
      answers, 
      score, 
      maxScore, 
      time_taken, 
      started_at, 
      submitted_at, 
      caught_cheating, 
      visibility_change_times, 
      is_completed,
      retest_assignment_id,
      parent_test_id
    } = JSON.parse(event.body);
    
    console.log('Parsed submission data:', {
      test_id,
      test_name,
      student_id: userInfo.student_id,
      score,
      maxScore,
      answers_count: Object.keys(answers || {}).length,
      time_taken: time_taken,
      started_at: started_at,
      submitted_at: submitted_at
    });

    // Validate input
    if (!test_id || !test_name || !answers || score === undefined || maxScore === undefined) {
      return {
        statusCode: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          message: 'Missing required fields: test_id, test_name, answers, score, maxScore'
        })
      };
    }

    console.log('Connecting to database...');
    const sql = neon(process.env.NEON_DATABASE_URL);
    console.log('Database connection established');
    
    // Begin transaction
    console.log('Starting database transaction...');
    await sql`BEGIN`;
    console.log('Transaction started successfully');
    
    try {
      // Get academic period ID from frontend (no database query needed)
      const { academic_period_id } = JSON.parse(event.body);
      const academicPeriodId = academic_period_id;
      console.log('Academic period ID from frontend:', academicPeriodId);
      
      // Retest checks
      let attemptNumber = null;
      let effectiveParentTestId = parent_test_id || test_id;
      let retestAssignment = null;
      if (retest_assignment_id) {
        const target = await sql`
          SELECT tgt.attempt_number, tgt.max_attempts, tgt.is_completed, ra.max_attempts as ra_max_attempts, ra.window_start, ra.window_end, ra.passing_threshold
          FROM retest_targets tgt
          JOIN retest_assignments ra ON ra.id = tgt.retest_assignment_id
          WHERE tgt.retest_assignment_id = ${retest_assignment_id} AND tgt.student_id = ${userInfo.student_id}
        `;
        if (target.length === 0) {
          throw new Error('Retest not found or not assigned to this student');
        }
        const row = target[0];
        retestAssignment = row;
        const nowTs = new Date();
        if (!(new Date(row.window_start) <= nowTs && nowTs <= new Date(row.window_end))) {
          throw new Error('Retest window is not active');
        }
        if (row.is_completed) {
          throw new Error('Retest is already completed');
        }
        const maxAttempts = row.max_attempts || row.ra_max_attempts || 1;
        if ((row.attempt_number || 0) >= maxAttempts) {
          throw new Error('Maximum retest attempts reached');
        }
        attemptNumber = Number(row.attempt_number || 0) + 1;
      }

      let result;
      let resultId = null;
      let insertedPercentage = null;
      let insertedIsCompleted = null;
      let attemptRecordId = null;
      
      if (!retest_assignment_id) {
        // Regular test: fixed-column insert into results table
        result = await sql`
          INSERT INTO matching_type_test_results (
            test_id, test_name, teacher_id, subject_id, grade, class, number,
            student_id, name, surname, nickname, score, max_score,
            answers, time_taken, started_at, submitted_at, caught_cheating,
            visibility_change_times, is_completed, academic_period_id, created_at
          )
          VALUES (
            ${test_id}, ${test_name}, ${teacher_id}, ${subject_id}, 
            ${userInfo.grade}, ${userInfo.class}, ${userInfo.number},
            ${userInfo.student_id}, ${userInfo.name}, ${userInfo.surname}, ${userInfo.nickname},
            ${score}, ${maxScore},
            ${JSON.stringify(answers)}, ${time_taken || null}, ${started_at || null}, 
            ${submitted_at || new Date().toISOString()}, ${caught_cheating || false},
            ${visibility_change_times || 0}, ${is_completed || true}, ${academicPeriodId}, NOW()
          )
          RETURNING id, percentage, is_completed
        `;
        resultId = result[0].id;
        insertedPercentage = result[0].percentage;
        insertedIsCompleted = result[0].is_completed;
      }
      console.log(`Test result inserted successfully with ID: ${resultId}`);
      console.log(`Inserted percentage: ${insertedPercentage}, is_completed: ${insertedIsCompleted}`);
      
      // Upsert attempt and update retest target
      const percentageVal = Math.round((Number(score) / Number(maxScore)) * 10000) / 100;
      const attemptNumForAttempts = attemptNumber || 1;
      // For retests, we want to create separate records for each attempt
      // Don't use ON CONFLICT for retests - let each attempt be a separate record
      if (retest_assignment_id) {
        // Determine safe attempt number
        const target = await sql`
          SELECT tgt.attempt_number, tgt.max_attempts, ra.max_attempts as ra_max_attempts
          FROM retest_targets tgt
          JOIN retest_assignments ra ON ra.id = tgt.retest_assignment_id
          WHERE tgt.retest_assignment_id = ${retest_assignment_id} AND tgt.student_id = ${userInfo.student_id}
        `;
        const row = target?.[0] || {};
        const maxAttempts = Number(row.max_attempts || row.ra_max_attempts || 1);
        const nextFromTarget = Number(row.attempt_number || 0) + 1;
        const existingAttempts = await sql`
          SELECT COALESCE(MAX(attempt_number), 0) AS max_attempt
          FROM test_attempts
          WHERE student_id = ${userInfo.student_id} AND test_id = ${effectiveParentTestId}
        `;
        const nextFromDb = Number(existingAttempts?.[0]?.max_attempt || 0) + 1;
        let attemptNumberToWrite = (percentageVal >= 50) ? maxAttempts : Math.max(nextFromDb, nextFromTarget);

        // Reuse existing row if attempt number exists
        const existingSame = await sql`
          SELECT id FROM test_attempts
          WHERE student_id = ${userInfo.student_id} AND test_id = ${effectiveParentTestId} AND attempt_number = ${attemptNumberToWrite}
          LIMIT 1
        `;
        if (existingSame.length > 0) {
          await sql`
            UPDATE test_attempts
            SET score = ${score}, max_score = ${maxScore}, percentage = ${percentageVal},
                time_taken = ${time_taken || null}, started_at = ${started_at || null}, submitted_at = ${submitted_at || new Date().toISOString()},
                is_completed = ${is_completed || true},
                retest_assignment_id = ${retest_assignment_id},
                answers = ${JSON.stringify(answers)},
                answers_by_id = ${JSON.stringify({})},
                question_order = ${JSON.stringify([])},
                caught_cheating = ${caught_cheating || false},
                visibility_change_times = ${visibility_change_times || 0},
                test_name = ${test_name},
                teacher_id = ${teacher_id},
                subject_id = ${subject_id}
            WHERE id = ${existingSame[0].id}
          `;
          attemptRecordId = existingSame[0].id;
        } else {
          const insertedAttempt = await sql`
            INSERT INTO test_attempts (
              student_id, test_id, attempt_number, score, max_score, percentage,
              time_taken, started_at, submitted_at, is_completed,
              answers, answers_by_id, question_order, caught_cheating, visibility_change_times,
              retest_assignment_id, test_name, teacher_id, subject_id, grade, class, number,
              name, surname, nickname, academic_period_id
            )
            VALUES (
              ${userInfo.student_id}, ${effectiveParentTestId}, ${attemptNumberToWrite}, ${score}, ${maxScore}, ${percentageVal},
              ${time_taken || null}, ${started_at || null}, ${submitted_at || new Date().toISOString()}, ${is_completed || true},
              ${JSON.stringify(answers)}, ${JSON.stringify({})}, ${JSON.stringify([])}, ${caught_cheating || false}, ${visibility_change_times || 0},
              ${retest_assignment_id}, ${test_name}, ${teacher_id}, ${subject_id}, ${userInfo.grade}, ${userInfo.class}, ${userInfo.number},
              ${userInfo.name}, ${userInfo.surname}, ${userInfo.nickname}, ${academicPeriodId}
            )
            RETURNING id
          `;
          attemptRecordId = insertedAttempt[0].id;
        }

        // Update retest_targets with new columns: attempt_number, is_completed, passed
        const passingThreshold = retestAssignment?.passing_threshold || 50;
        const passed = percentageVal >= passingThreshold;
        const currentAttempt = retestAssignment?.attempt_number || 0;
        
        // Determine next attempt number
        let nextAttemptNumber;
        if (passed) {
          // Early pass: jump to max_attempts slot
          nextAttemptNumber = retestAssignment?.max_attempts || retestAssignment?.ra_max_attempts || 1;
        } else {
          // Increment attempt
          nextAttemptNumber = currentAttempt + 1;
        }
        
        // Check if retest should be marked as completed
        const maxAttemptsForCompletion = retestAssignment?.max_attempts || retestAssignment?.ra_max_attempts || 1;
        const attemptsExhausted = nextAttemptNumber >= maxAttemptsForCompletion;
        const shouldComplete = attemptsExhausted || passed;
        
        // Update retest_targets in single transaction
        const updateResult = await sql`
          UPDATE retest_targets
          SET 
            attempt_number = ${nextAttemptNumber},
            attempt_count = ${nextAttemptNumber},
            last_attempt_at = NOW(),
            passed = ${passed},
            is_completed = ${shouldComplete},
            completed_at = CASE
              WHEN ${shouldComplete} AND completed_at IS NULL THEN NOW()
              ELSE completed_at
            END,
            status = CASE
              WHEN ${passed} THEN 'PASSED'
              WHEN ${attemptsExhausted} THEN 'FAILED'
              ELSE 'IN_PROGRESS'
            END,
            updated_at = NOW()
          WHERE retest_assignment_id = ${retest_assignment_id}
            AND student_id = ${userInfo.student_id}
          RETURNING *
        `;
        
        if (updateResult.length === 0) {
          console.error('⚠️ Failed to update retest_targets - no rows matched', {
            retest_assignment_id,
            studentId: userInfo.student_id,
            test_id: effectiveParentTestId
          });
        } else {
          console.log('✅ Updated retest_targets:', {
            retest_assignment_id,
            studentId: userInfo.student_id,
            attempt_number: updateResult[0].attempt_number,
            is_completed: updateResult[0].is_completed,
            passed: updateResult[0].passed
          });
        }
        
        // Persist best retest values
        await sql`SELECT update_best_retest_values(${userInfo.student_id}, ${effectiveParentTestId})`;
      } else {
        // Regular tests no longer write a summary row into test_attempts
      }

      

      // Commit transaction
      console.log('Committing transaction...');
      await sql`COMMIT`;
      console.log('Transaction committed successfully');
      
      return {
        statusCode: 200,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          message: 'Test submitted successfully',
          result_id: resultId || attemptRecordId,
          score: score,
          max_score: maxScore,
          percentage: Math.round((score / maxScore) * 100)
        })
      };
      
    } catch (error) {
      // Rollback transaction on error
      console.error('Error during database operations, rolling back transaction...');
      console.error('Error details:', error);
      await sql`ROLLBACK`;
      console.log('Transaction rolled back');
      throw error;
    }
    
  } catch (error) {
    console.error('Submit matching type test error:', error);
    console.error('Error stack:', error.stack);
    
    return {
      statusCode: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        message: 'Failed to submit test',
        error: error.message
      })
    };
  }
};