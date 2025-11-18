const { neon } = require('@neondatabase/serverless');
const jwt = require('jsonwebtoken');

exports.handler = async function(event, context) {
  console.log('=== UPDATED FUNCTION RUNNING ===');
  console.log('=== CLASS FORMAT CONVERSION FIX IS ACTIVE ===');
  console.log('=== TIMESTAMP: ' + new Date().toISOString() + ' ===');
  console.log('=== THIS IS A TEST - IF YOU SEE THIS, THE FUNCTION IS RUNNING ===');
  
  // CORS headers with Authorization support
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
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Credentials': 'true'
  };

  // Handle preflight request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Only allow GET method
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
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

    // Extract student_id from JWT token
    const student_id = decoded.sub;
    
    console.log('get-student-active-tests called with student_id (from JWT):', student_id);

    const sql = neon(process.env.NEON_DATABASE_URL);
    
    console.log('Database connection established');

    // Use optimized view for student active tests (no pagination)
    console.log('Querying student_active_tests_view for student_id:', student_id);
    
    const viewRows = await sql`
      SELECT * FROM student_active_tests_view
      WHERE student_id = ${student_id}
      ORDER BY assigned_at DESC, test_id DESC
    `;
    
    console.log('student_active_tests_view rows:', viewRows.length);

    if (viewRows.length === 0) {
      console.log('No active tests found for student');
      return {
        statusCode: 200,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          tests: [],
          student_grade: null,
          student_class: null,
          debug_message: "No active tests found",
          has_retests: false
        })
      };
    }

    // Build response from view data
    const activeTests = [];
    let overallHasRetests = false;
    
    for (const row of viewRows) {
      try {
        console.log('Processing view row:', row);
        if (row.retest_is_completed === true) {
          console.log('Skipping row because retest is already completed (from view flag):', {
            test_type: row.test_type,
            test_id: row.test_id,
            retest_assignment_id: row.retest_assignment_id,
            retest_target_id: row.retest_target_id
          });
          continue;
        }
        
        // All data is already available from the view
        const testInfo = {
          test_name: row.test_name,
          num_questions: row.num_questions,
          teacher_id: row.teacher_id,
          subject_id: row.subject_id,
          created_at: row.created_at,
          updated_at: row.updated_at
        };
        
        const teacherName = row.teacher_name || 'Unknown Teacher';
        const subjectName = row.subject_name || 'Unknown Subject';
        
        // Check retest availability and completion status for this student and test
        let retestAvailable = false;
        let retestKey = null;
        let retestAttemptsLeft = null;
        let retestAssignmentId = null;
        let retestCompleted = false;
        let retestPassed = false;
        let retestAttemptNumber = 0;
        let retestMaxAttempts = null;
        try {
          console.log('Checking retest availability for', row.test_type, row.test_id, 'student:', student_id);
          const retestRows = await sql`
            SELECT rt.id as retest_target_id, 
                   rt.attempt_number, 
                   rt.max_attempts,
                   rt.is_completed,
                   rt.passed,
                   ra.id as retest_assignment_id, 
                   ra.max_attempts as ra_max_attempts, 
                   ra.window_start, 
                   ra.window_end, 
                   rt.status
            FROM retest_targets rt
            JOIN retest_assignments ra ON ra.id = rt.retest_assignment_id
            WHERE rt.student_id = ${student_id}
              AND ra.test_type = ${row.test_type}
              AND ra.test_id = ${row.test_id}
              AND NOW() BETWEEN ra.window_start AND ra.window_end
          `;
          
          if (retestRows.length > 0) {
            const retestRow = retestRows[0];
            retestAssignmentId = retestRow.retest_assignment_id;
            retestCompleted = retestRow.is_completed === true;
            retestPassed = retestRow.passed === true;
            retestAttemptNumber = retestRow.attempt_number || 0;
            retestMaxAttempts = retestRow.max_attempts || retestRow.ra_max_attempts || null;
            
            // Retest is available if not completed
            retestAvailable = !retestCompleted;
            
            if (retestMaxAttempts != null) {
              retestAttemptsLeft = Math.max(0, retestMaxAttempts - retestAttemptNumber);
            }
            
            if (retestAvailable) {
              retestKey = `retest1_${student_id}_${row.test_type}_${row.test_id}`;
              overallHasRetests = true;
            }
          }
          
          console.log('Retest status:', {
            available: retestAvailable,
            completed: retestCompleted,
            passed: retestPassed,
            attemptNumber: retestAttemptNumber,
            maxAttempts: retestMaxAttempts,
            attemptsLeft: retestAttemptsLeft
          });
        } catch (e) {
          console.warn('Retest availability check failed for', row.test_type, row.test_id, e.message);
        }

        if (retestCompleted) {
          console.log('Skipping row because retest is already completed (runtime check):', {
            test_type: row.test_type,
            test_id: row.test_id,
            retest_assignment_id: retestAssignmentId,
            retest_target_id: row.retest_target_id
          });
          continue;
        }

        // Check if test is completed (result_id will be NOT NULL if completed)
        const isCompleted = row.result_id !== null && row.result_id !== undefined;

        // Guard fallback: if the student already completed the original test and no active retest remains,
        // skip the entry to avoid showing completed assignments.
        if (isCompleted && !(retestAvailable && !retestCompleted)) {
          console.log('Skipping row because test already completed and no active retest:', {
            test_type: row.test_type,
            test_id: row.test_id,
            assignment_id: row.assignment_id,
            retest_available: retestAvailable,
            retest_completed: retestCompleted
          });
          continue;
        }

        activeTests.push({
          test_id: row.test_id,
          test_name: testInfo.test_name || 'Unknown Test',
          test_type: row.test_type,
          num_questions: testInfo.num_questions || 0,
          created_at: row.assigned_at,
          assigned_at: row.assigned_at,
          subject_name: subjectName || 'Unknown Subject',
          grade: row.grade,
          class: row.class,
          teacher_name: teacherName || 'Unknown Teacher',
          assignment_id: row.assignment_id,
          retest_available: retestAvailable && !retestCompleted,
          retest_key: retestKey,
          retest_attempts_left: retestAttemptsLeft,
          retest_assignment_id: retestAssignmentId,
          retest_is_completed: retestCompleted,
          retest_passed: retestPassed,
          retest_attempt_number: retestAttemptNumber,
          retest_max_attempts: retestMaxAttempts
        });
        
        console.log('Added test to activeTests:', activeTests[activeTests.length - 1]);
        
      } catch (error) {
        console.error('Error processing view row:', row, error);
        // Continue with other rows
      }
    }

    console.log('Final activeTests array:', activeTests);
    
    // Comprehensive debugging information
    const debugInfo = {
      request_parameters: {
        student_id: student_id
      },
      view_query: {
        view_name: 'student_active_tests_view',
        filters: `student_id = ${student_id}`,
        found_count: viewRows.length,
        sample_row: viewRows.length > 0 ? viewRows[0] : null
      },
      processing_results: {
        total_view_rows_processed: viewRows.length,
        successful_processing: activeTests.length,
        failed_processing: viewRows.length - activeTests.length,
        test_type_breakdown: {
          multiple_choice: activeTests.filter(t => t.test_type === 'multiple_choice').length,
          true_false: activeTests.filter(t => t.test_type === 'true_false').length,
          input: activeTests.filter(t => t.test_type === 'input').length,
          matching_type: activeTests.filter(t => t.test_type === 'matching_type').length,
          word_matching: activeTests.filter(t => t.test_type === 'word_matching').length,
          fill_blanks: activeTests.filter(t => t.test_type === 'fill_blanks').length,
          speaking: activeTests.filter(t => t.test_type === 'speaking').length
        }
      },
      final_output: {
        tests_returned: activeTests.length,
        student_grade: viewRows.length > 0 ? viewRows[0].grade : null,
        student_class: viewRows.length > 0 ? viewRows[0].class : null,
        sample_test: activeTests.length > 0 ? activeTests[0] : null
      }
    };
    
    console.log('=== COMPREHENSIVE DEBUG INFO ===');
    console.log(JSON.stringify(debugInfo, null, 2));
    console.log('=== END DEBUG INFO ===');
    

    // Generate ETag for caching
    const dataString = JSON.stringify({ tests: activeTests, student_grade: viewRows.length > 0 ? viewRows[0].grade : null, student_class: viewRows.length > 0 ? viewRows[0].class : null });
    const etag = `"${Buffer.from(dataString).toString('base64').slice(0, 16)}"`;

    return {
      statusCode: 200,
      headers: { 
        ...headers, 
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
        'ETag': etag,
        'Vary': 'Authorization'
      },
      body: JSON.stringify({
        success: true,
        tests: activeTests,
        student_grade: viewRows.length > 0 ? viewRows[0].grade : null,
        student_class: viewRows.length > 0 ? viewRows[0].class : null,
        debug_message: "FUNCTION IS RUNNING WITH VIEW-BASED OPTIMIZATION",
        has_retests: overallHasRetests,
        debug_info: debugInfo
      })
    };

  } catch (error) {
    console.error('Error getting student active tests:', error);
    
    return {
      statusCode: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      })
    };
  }
};
