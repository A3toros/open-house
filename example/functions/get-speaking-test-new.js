const { neon } = require('@neondatabase/serverless');
const { validateToken } = require('./validate-token');
const { createClient } = require('@supabase/supabase-js');

exports.handler = async function(event, context) {
  console.log('=== get-speaking-test-new consolidated function called ===');
  
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, message: 'Method not allowed' })
    };
  }

  try {
    const { action, test_id, student_id, file_path, result_id, audio_url, bucket, expires_in } = event.queryStringParameters || {};

    // Handle sign-audio action without authentication (public endpoint)
    if (action === 'sign-audio') {
      const bucketParam = bucket || 'audio';
      const filePath = file_path;
      const expiresIn = Math.min(parseInt(expires_in || '600', 10) || 600, 3600); // max 1h

      console.log('Sign-audio request:', { bucketParam, filePath, expiresIn });

      if (!filePath) {
        return {
          statusCode: 400,
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Missing file_path' })
        };
      }

      const SUPABASE_URL = process.env.SUPABASE_URL;
      const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
      if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
        console.error('Supabase env not configured');
        return {
          statusCode: 500,
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Supabase env not configured' })
        };
      }

      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
      console.log('Creating signed URL for:', { bucket: bucketParam, filePath });
      
      const { data, error } = await supabase
        .storage
        .from(bucketParam)
        .createSignedUrl(filePath, expiresIn);

      if (error) {
        console.error('Supabase signed URL error:', error);
        return {
          statusCode: 400,
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: error.message })
        };
      }

      console.log('Signed URL created successfully');
      return {
        statusCode: 200,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: data.signedUrl })
      };
    }

    // For all other actions, validate token
    const tokenValidation = validateToken(event);
    if (!tokenValidation.success) {
      return {
        statusCode: tokenValidation.statusCode || 401,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: tokenValidation.error })
      };
    }

    const userInfo = tokenValidation.user;

    // Handle different actions
    switch (action) {
      case 'tests':
        // Get speaking tests for teacher/admin
        if (userInfo.role !== 'teacher' && userInfo.role !== 'admin') {
          return {
            statusCode: 403,
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Access denied. Teacher or admin role required.' })
          };
        }

        const sql = neon(process.env.NEON_DATABASE_URL);
        
        // Parse pagination parameters
        const limit = Math.min(parseInt(event.queryStringParameters?.limit) || 50, 200);
        const cursor = event.queryStringParameters?.cursor;
        
        // Parse cursor (format: "created_at,id")
        let cursorCreatedAt, cursorId;
        if (cursor) {
          const [createdAtStr, idStr] = cursor.split(',');
          cursorCreatedAt = new Date(createdAtStr);
          cursorId = parseInt(idStr);
        }

        const teacherId = userInfo.role === 'admin' ? (event.queryStringParameters?.teacher_id || userInfo.teacher_id) : userInfo.teacher_id;
        
        let tests;
        if (cursor) {
          tests = await sql`
            SELECT 
              st.id, st.test_name, st.teacher_id, st.subject_id, 
              st.time_limit, st.min_duration, st.max_duration,
              st.min_words, st.passing_score, st.created_at, st.updated_at,
              s.subject, t.first_name as teacher_name,
              COUNT(stq.id) as question_count
            FROM speaking_tests st
            LEFT JOIN subjects s ON st.subject_id = s.subject_id
            LEFT JOIN teachers t ON st.teacher_id = t.teacher_id
            LEFT JOIN speaking_test_questions stq ON st.id = stq.test_id
            WHERE st.teacher_id = ${teacherId}
              AND (st.created_at, st.id) < (${cursorCreatedAt}, ${cursorId})
            GROUP BY st.id, st.test_name, st.teacher_id, st.subject_id, 
                     st.time_limit, st.min_duration, st.max_duration,
                     st.min_words, st.passing_score, st.created_at, st.updated_at,
                     s.subject, t.first_name, t.last_name
            ORDER BY st.created_at DESC, st.id DESC
            LIMIT ${limit}
          `;
        } else {
          tests = await sql`
            SELECT 
              st.id, st.test_name, st.teacher_id, st.subject_id, 
              st.time_limit, st.min_duration, st.max_duration,
              st.min_words, st.passing_score, st.created_at, st.updated_at,
              s.subject, t.first_name as teacher_name,
              COUNT(stq.id) as question_count
            FROM speaking_tests st
            LEFT JOIN subjects s ON st.subject_id = s.subject_id
            LEFT JOIN teachers t ON st.teacher_id = t.teacher_id
            LEFT JOIN speaking_test_questions stq ON st.id = stq.test_id
            WHERE st.teacher_id = ${teacherId}
            GROUP BY st.id, st.test_name, st.teacher_id, st.subject_id, 
                     st.time_limit, st.min_duration, st.max_duration,
                     st.min_words, st.passing_score, st.created_at, st.updated_at,
                     s.subject, t.first_name, t.last_name
            ORDER BY st.created_at DESC, st.id DESC
            LIMIT ${limit}
          `;
        }

        // Generate next cursor for pagination
        let nextCursor = null;
        if (tests.length === limit && tests.length > 0) {
          const lastTest = tests[tests.length - 1];
          nextCursor = `${lastTest.created_at.toISOString()},${lastTest.id}`;
        }

        return {
          statusCode: 200,
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            success: true,
            tests: tests,
            pagination: {
              limit,
              has_more: tests.length === limit,
              next_cursor: nextCursor
            }
          })
        };

      case 'test':
        // Get specific speaking test
        if (!test_id) {
          return {
            statusCode: 400,
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              success: false,
              message: 'test_id parameter is required'
            })
          };
        }

        if (!['student', 'teacher', 'admin'].includes(userInfo.role)) {
          return {
            statusCode: 403,
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Access denied. Student, teacher, or admin role required.' })
          };
        }

        const sql2 = neon(process.env.NEON_DATABASE_URL);
        const testData = await sql2`
          SELECT 
            st.id, st.test_name, st.teacher_id, st.subject_id, 
            st.time_limit, st.min_duration, st.max_duration,
            st.max_attempts, st.min_words, st.passing_score, st.allowed_time,
            st.created_at, st.updated_at,
            s.subject, t.first_name as teacher_name
          FROM speaking_tests st
          LEFT JOIN subjects s ON st.subject_id = s.subject_id
          LEFT JOIN teachers t ON st.teacher_id = t.teacher_id
          WHERE st.id = ${test_id}
        `;

        if (testData.length === 0) {
          return {
            statusCode: 404,
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              success: false,
              message: 'Speaking test not found'
            })
          };
        }

        return {
          statusCode: 200,
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            success: true,
            test: testData[0]
          })
        };

      case 'questions':
        // Get speaking test questions
        if (!test_id) {
          return {
            statusCode: 400,
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              success: false,
              message: 'test_id parameter is required'
            })
          };
        }

        if (!['student', 'teacher', 'admin'].includes(userInfo.role)) {
          return {
            statusCode: 403,
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Access denied. Student, teacher, or admin role required.' })
          };
        }

        const sql3 = neon(process.env.NEON_DATABASE_URL);
        const questions = await sql3`
          SELECT 
            stq.id, stq.test_id, stq.question_number, stq.prompt, 
            stq.expected_duration, stq.difficulty_level, stq.created_at,
            st.test_name, st.time_limit, st.min_duration, st.max_duration,
            st.min_words, st.passing_score, st.allowed_time
          FROM speaking_test_questions stq
          LEFT JOIN speaking_tests st ON stq.test_id = st.id
          WHERE stq.test_id = ${test_id}
          ORDER BY stq.question_number ASC
        `;

        return {
          statusCode: 200,
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            success: true,
            questions: questions
          })
        };

      case 'audio':
        // Get speaking audio URL
        if (!file_path && !result_id) {
          return {
            statusCode: 400,
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              success: false,
              message: 'Missing required parameters: file_path or result_id'
            })
          };
        }

        if (!['student', 'teacher', 'admin'].includes(userInfo.role)) {
          return {
            statusCode: 403,
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Access denied. Student, teacher, or admin role required.' })
          };
        }

        let audioUrl;
        
        if (file_path) {
          // Direct file path provided
          const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_KEY
          );
          
          const { data: urlData } = supabase.storage
            .from('speaking-audio')
            .getPublicUrl(file_path);
            
          audioUrl = urlData.publicUrl;
        } else if (result_id) {
          // Get file path from database using result_id
          const sql4 = neon(process.env.NEON_DATABASE_URL);
          
          const result = await sql4`
            SELECT audio_url FROM speaking_test_results 
            WHERE id = ${result_id}
          `;
          
          if (result.length === 0) {
            return {
              statusCode: 404,
              headers: { ...headers, 'Content-Type': 'application/json' },
              body: JSON.stringify({
                success: false,
                message: 'Speaking test result not found'
              })
            };
          }
          
          const audioUrlFromDb = result[0].audio_url;
          if (!audioUrlFromDb) {
            return {
              statusCode: 404,
              headers: { ...headers, 'Content-Type': 'application/json' },
              body: JSON.stringify({
                success: false,
                message: 'No audio file found for this result'
              })
            };
          }
          
          audioUrl = audioUrlFromDb;
        }

        return {
          statusCode: 200,
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            success: true,
            audio_url: audioUrl
          })
        };

      case 'transcript':
        // Get speaking test transcript
        if (userInfo.role !== 'teacher' && userInfo.role !== 'admin') {
          return {
            statusCode: 403,
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Access denied. Teacher or admin role required.' })
          };
        }

        const testId = test_id ? parseInt(test_id, 10) : null;
        const studentId = student_id || null;
        const audioUrlParam = audio_url || null;
        
        if ((!testId || !studentId) && !audioUrlParam) {
          return {
            statusCode: 400,
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Missing test_id+student_id or audio_url' })
          };
        }

        const sql5 = neon(process.env.NEON_DATABASE_URL);
        let rows;
        
        if (audioUrlParam) {
          rows = await sql5`
            SELECT transcript
            FROM speaking_test_results
            WHERE audio_url = ${audioUrlParam}
            ORDER BY submitted_at DESC NULLS LAST, created_at DESC
            LIMIT 1
          `;
        } else {
          rows = await sql5`
            SELECT transcript
            FROM speaking_test_results
            WHERE test_id = ${testId} AND student_id = ${studentId}
            ORDER BY submitted_at DESC NULLS LAST, created_at DESC
            LIMIT 1
          `;
        }

        const transcript = rows[0]?.transcript || '';
        return {
          statusCode: 200,
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ success: true, transcript })
        };

      default:
        return {
          statusCode: 400,
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            success: false,
            message: 'Invalid action. Supported actions: tests, test, questions, audio, transcript, sign-audio'
          })
        };
    }

  } catch (error) {
    console.error('Get speaking test new error:', error);
    console.error('Error stack:', error.stack);
    
    return {
      statusCode: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        message: 'Failed to process speaking test request',
        error: error.message
      })
    };
  }
};
