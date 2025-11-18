const { neon } = require('@neondatabase/serverless');
const jwt = require('jsonwebtoken');

exports.handler = async function(event, context) {
  // Enable CORS with Authorization header support
  const allowedOrigins = [
    'https://mathayomwatsing.netlify.app',
    'http://localhost:8081',
    'http://localhost:3000',
    'http://localhost:19006',
    'http://localhost:19000'
  ];
  
  const origin = event.headers?.origin || event.headers?.Origin;
  const corsOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  
  const headers = {
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Credentials': 'true'
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Extract and validate JWT token
    const authHeader = event.headers.authorization || event.headers.Authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          message: 'Authorization header missing or invalid'
        })
      };
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return {
          statusCode: 401,
          headers: {
            ...headers,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            success: false,
            message: 'Token expired',
            error: 'TOKEN_EXPIRED'
          })
        };
      } else {
        return {
          statusCode: 401,
          headers: {
            ...headers,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            success: false,
            message: 'Invalid token'
          })
        };
      }
    }

    // Validate role
    if (decoded.role !== 'student') {
      return {
        statusCode: 403,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          message: 'Access denied. Student role required.'
        })
      };
    }

    // Parse request body with new fields
    const { test_id, test_name, teacher_id, subject_id, score, maxScore, answers, time_taken, started_at, submitted_at, caught_cheating, visibility_change_times, is_completed, answers_by_id, question_order, retest_assignment_id, parent_test_id } = JSON.parse(event.body);
    
    // Extract student info from JWT token
    const studentId = decoded.sub;
    const grade = decoded.grade;
    const className = decoded.class;
    const number = decoded.number;
    const name = decoded.name;
    const surname = decoded.surname;
    const nickname = decoded.nickname;

    // Debug: Log cheating data
    console.log('🛡️ [MULTIPLE_CHOICE] Cheating data received:', {
      caught_cheating,
      visibility_change_times,
      test_id,
      student_id: studentId
    });

    // Validate required fields (handle 0 values properly)
    if (test_id === undefined || test_id === null || 
        !test_name || 
        !teacher_id || !subject_id ||
        score === undefined || score === null || 
        maxScore === undefined || maxScore === null || 
        !answers) {
      return {
        statusCode: 400,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          error: 'Missing required fields: test_id, test_name, teacher_id, subject_id, score, maxScore, answers' 
        })
      };
    }

    // Convert class format for database (1/15 -> 15)
    let convertedClass;
    const classNameStr = String(className || '');
    if (classNameStr && classNameStr.includes('/')) {
      convertedClass = parseInt(classNameStr.split('/')[1]);
    } else {
      convertedClass = parseInt(classNameStr) || null;
    }

    // Connect to database using @neondatabase/serverless
    const sql = neon(process.env.NEON_DATABASE_URL);// Get academic period ID from frontend (no database query needed)
    const { academic_period_id } = JSON.parse(event.body);
    const academicPeriodId = academic_period_id;

    // Use frontend calculated score directly - frontend calculation is correct
    const actualScore = score;
    const totalQuestions = maxScore;
    
    // Store answers as-is from frontend (already validated)
    // Prefer order-agnostic answers_by_id if provided
    const validatedAnswers = answers_by_id ? { answers_by_id, question_order: question_order || [] } : answers;

    // Determine completion: finalized if submitted_at present or client marks completed
    const completedFlag = Boolean(submitted_at) || is_completed === true;

    // Insert test result with frontend calculated score and new fields
    // If this is a retest submission, validate eligibility and compute attempt number
    let attemptNumber = null;
    let effectiveParentTestId = parent_test_id || test_id;
    let retestAssignment = null;
    if (retest_assignment_id) {
      const target = await sql`
        SELECT tgt.attempt_number, tgt.max_attempts, tgt.is_completed, ra.max_attempts as ra_max_attempts, ra.window_start, ra.window_end, ra.passing_threshold
        FROM retest_targets tgt
        JOIN retest_assignments ra ON ra.id = tgt.retest_assignment_id
        WHERE tgt.retest_assignment_id = ${retest_assignment_id} AND tgt.student_id = ${studentId}
      `;
      if (target.length === 0) {
        return {
          statusCode: 400,
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ success: false, message: 'Retest not found or not assigned to this student' })
        };
      }
      const row = target[0];
      retestAssignment = row;
      const nowTs = new Date();
      if (!(new Date(row.window_start) <= nowTs && nowTs <= new Date(row.window_end))) {
        return {
          statusCode: 400,
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ success: false, message: 'Retest window is not active' })
        };
      }
      if (row.is_completed) {
        return {
          statusCode: 400,
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ success: false, message: 'Retest is already completed' })
        };
      }
      const maxAttempts = row.max_attempts || row.ra_max_attempts || 1;
      if ((row.attempt_number || 0) >= maxAttempts) {
        return {
          statusCode: 400,
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ success: false, message: 'Maximum retest attempts reached' })
        };
      }
      attemptNumber = Number(row.attempt_number || 0) + 1;
    }

    // For retests, write detailed data to test_attempts only
    // For regular tests, write to both test result table and test_attempts
    let responseId = null;
    
    console.log('🔍 Writing test result - retest_assignment_id:', retest_assignment_id, 'isRetest:', !!retest_assignment_id);
    
    if (retest_assignment_id) {
      // Retest: Write detailed data to test_attempts only
      console.log('🔍 Writing to test_attempts only (retest)');
      const percentage = Math.round((actualScore / totalQuestions) * 10000) / 100;

      // Early-pass simplification: pass locks to last attempt slot
      // Determine attemptNumberToWrite using both DB existing max and retest_targets.attempt_count
      let attemptNumberToWrite;
      const existingAttempts = await sql`
        SELECT COALESCE(MAX(attempt_number), 0) as max_attempt 
        FROM test_attempts 
        WHERE student_id = ${studentId} AND test_id = ${effectiveParentTestId}
      `;
      const dbNext = Number(existingAttempts?.[0]?.max_attempt || 0) + 1;
      const targetForMax = await sql`
        SELECT tgt.attempt_count, ra.max_attempts 
        FROM retest_targets tgt
        JOIN retest_assignments ra ON ra.id = tgt.retest_assignment_id
        WHERE tgt.retest_assignment_id = ${retest_assignment_id} AND tgt.student_id = ${studentId}
      `;
      const tgtRow = targetForMax?.[0] || { attempt_count: 0, max_attempts: 1 };
      const counterNext = Number(tgtRow.attempt_count || 0) + 1;
      if (percentage >= 50) {
        attemptNumberToWrite = Number(tgtRow.max_attempts || 1);
      } else {
        attemptNumberToWrite = Math.max(dbNext, counterNext);
      }

      // If a row already exists for this attempt number (e.g., resubmission), reuse it
      const existingRowSameAttempt = await sql`
        SELECT id FROM test_attempts 
        WHERE student_id = ${studentId} AND test_id = ${effectiveParentTestId} AND attempt_number = ${attemptNumberToWrite}
      `;

      if (existingRowSameAttempt.length > 0) {
        responseId = existingRowSameAttempt[0].id;
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
            ${studentId}, ${effectiveParentTestId}, ${attemptNumberToWrite}, ${actualScore}, ${totalQuestions}, ${percentage},
            ${time_taken || null}, ${started_at || null}, ${submitted_at || null}, ${completedFlag},
            ${JSON.stringify(validatedAnswers)}, ${JSON.stringify(answers_by_id || {})}, ${JSON.stringify(question_order || [])}, 
            ${caught_cheating || false}, ${visibility_change_times || 0},
            ${retest_assignment_id}, ${test_name}, ${teacher_id}, ${subject_id}, ${grade}, ${convertedClass}, ${number},
            ${name}, ${surname}, ${nickname}, ${academicPeriodId}
          )
          RETURNING id
        `;
        responseId = insertedAttempt[0].id;
      }

      // Update retest_targets with new columns: attempt_number, is_completed, passed
      const passingThreshold = retestAssignment?.passing_threshold || 50;
      const passed = percentage >= passingThreshold;
      const currentAttempt = retestAssignment?.attempt_number || 0;
      
      console.log('🎓 Retest completion calculation:', {
        percentage,
        passingThreshold,
        passed,
        currentAttempt,
        max_attempts: retestAssignment?.max_attempts,
        ra_max_attempts: retestAssignment?.ra_max_attempts
      });
      
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
      const maxAttempts = retestAssignment?.max_attempts || retestAssignment?.ra_max_attempts || 1;
      const attemptsExhausted = nextAttemptNumber >= maxAttempts;
      const shouldComplete = attemptsExhausted || passed;
      
      console.log('🎓 Retest completion decision:', {
        nextAttemptNumber,
        maxAttempts,
        attemptsExhausted,
        shouldComplete,
        passed
      });
      
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
          AND student_id = ${studentId}
        RETURNING *
      `;
      
      if (updateResult.length === 0) {
        console.error('⚠️ Failed to update retest_targets - no rows matched', {
          retest_assignment_id,
          studentId,
          test_id: effectiveParentTestId
        });
      } else {
        console.log('✅ Updated retest_targets:', {
          retest_assignment_id,
          studentId,
          attempt_number: updateResult[0].attempt_number,
          is_completed: updateResult[0].is_completed,
          passed: updateResult[0].passed
        });
      }
      
      // Persist best retest values into results
      await sql`SELECT update_best_retest_values(${studentId}, ${effectiveParentTestId})`;
    } else {
      // Regular test: Write to test result table first
      console.log('🔍 Writing to multiple_choice_test_results (regular test)');
      const result = await sql`
        INSERT INTO multiple_choice_test_results 
        (test_id, test_name, teacher_id, subject_id, grade, class, number, student_id, name, surname, nickname, score, max_score, answers, time_taken, started_at, submitted_at, caught_cheating, visibility_change_times, is_completed, academic_period_id, created_at)
        VALUES (${test_id}, ${test_name}, ${teacher_id}, ${subject_id}, ${grade}, ${convertedClass}, ${number}, ${studentId}, ${name}, ${surname}, ${nickname}, ${actualScore}, ${totalQuestions}, ${JSON.stringify(validatedAnswers)}, ${time_taken || null}, ${started_at || null}, ${submitted_at || null}, ${caught_cheating || false}, ${visibility_change_times || 0}, ${completedFlag}, ${academicPeriodId}, NOW())
        RETURNING id
      `;
      responseId = result[0].id;
      
      // Regular tests no longer write a summary row into test_attempts
    }

    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        success: true, 
        result_id: responseId,
        score: actualScore,
        max_score: totalQuestions,
        percentage_score: Math.round((actualScore / totalQuestions) * 100),
        message: 'Multiple choice test submitted successfully' 
      })
    };

  } catch (error) {
    console.error('Database error:', error);
    
    return {
      statusCode: 500,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        error: 'Internal server error', 
        details: process.env.NODE_ENV === 'development' ? error.message : 'Database error' 
      })
    };
  }
};
