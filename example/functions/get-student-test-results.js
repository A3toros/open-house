const { neon } = require('@neondatabase/serverless');
const jwt = require('jsonwebtoken');

exports.handler = async function(event, context) {
  console.log('=== get-student-test-results function called ===');
  
  // CORS headers with Authorization support
  const headers = {
    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || 'https://mathayomwatsing.netlify.app',
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
      headers: { ...headers, 'Content-Type': 'application/json' },
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
    
    console.log('Student ID (from JWT):', student_id);

    const sql = neon(process.env.NEON_DATABASE_URL);
    console.log('Database connection established');

    // Use academic period from frontend (term id)
    const qs = event.queryStringParameters || {};
    const currentPeriodId = qs.academic_period_id ? parseInt(qs.academic_period_id, 10) : null;
    if (currentPeriodId) {
      console.log('Academic period ID from frontend:', currentPeriodId);
    } else {
      console.log('No academic_period_id provided; returning all results for student');
    }

    // Query consolidated view for student results (no pagination)
    let results = [];
    try {
      console.log('Querying student_test_results_view for student:', student_id);
      if (currentPeriodId) {
        results = await sql`
          SELECT *
          FROM student_test_results_view
          WHERE student_id = ${student_id}
            AND academic_period_id = ${currentPeriodId}
          ORDER BY submitted_at DESC, id DESC
        `;
      } else {
        results = await sql`
          SELECT *
          FROM student_test_results_view
          WHERE student_id = ${student_id}
          ORDER BY submitted_at DESC, id DESC
        `;
      }
      console.log('Student results query successful, found:', results.length, 'results');
    } catch (error) {
      console.log('Student results view query failed:', error.message);
      results = [];
    }

    // Format results for frontend
    const formattedResults = results.map(result => ({
      id: result.id,
      test_id: result.test_id,
      test_name: result.test_name,
      test_type: result.test_type,
      score: result.score,
      max_score: result.max_score,
      best_retest_score: result.best_retest_score,
      best_retest_max_score: result.best_retest_max_score,
      best_retest_percentage: result.best_retest_percentage,
      percentage: result.percentage,
      improvement_from_last: result.improvement_from_last,
      caught_cheating: result.caught_cheating,
      visibility_change_times: result.visibility_change_times,
      is_completed: result.is_completed,
      submitted_at: result.submitted_at,
      academic_period_id: result.academic_period_id,
      subject: result.subject,
      teacher_name: result.teacher_name
    }));


    // Generate ETag for caching
    const dataString = JSON.stringify({ results: formattedResults, count: formattedResults.length });
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
        results: formattedResults,
        count: formattedResults.length
      })
    };

  } catch (error) {
    console.error('Error in get-student-test-results:', error);
    return {
      statusCode: 500,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        message: 'Internal server error',
        error: error.message
      })
    };
  }
};