const { neon } = require('@neondatabase/serverless');
const { validateToken } = require('./validate-token');

exports.handler = async function(event, context) {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
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
    // Validate JWT token and extract teacher information
    const result = validateToken(event);
    
    if (!result.success) {
      return {
        statusCode: result.statusCode || 401,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: result.error })
      };
    }

    const userInfo = result.user;
    
    // Check if user is teacher or admin
    if (userInfo.role !== 'teacher' && userInfo.role !== 'admin') {
      return {
        statusCode: 403,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Access denied. Teacher or admin role required.' })
      };
    }

    // Handle admin vs regular teacher
    let teacher_id;
    if (userInfo.role === 'admin') {
      // Admin can access all data - no teacher_id required
      // If teacher_id is provided, filter by that teacher, otherwise show all
      teacher_id = event.queryStringParameters?.teacher_id || null;
    } else {
      // Regular teacher uses their own ID
      teacher_id = userInfo.teacher_id;
    }

    const sql = neon(process.env.NEON_DATABASE_URL);

    // Parse pagination parameters
    const limit = Math.min(parseInt(event.queryStringParameters?.limit) || 50, 200);
    const cursor = event.queryStringParameters?.cursor;
    
    // Parse cursor (format: "created_at,id" or "created_at,test_id")
    let cursorCreatedAt, cursorId;
    if (cursor) {
      const [createdAtStr, idStr] = cursor.split(',');
      cursorCreatedAt = new Date(createdAtStr);
      cursorId = parseInt(idStr);
    }

    // Use optimized view for teacher active tests with keyset pagination
    let activeTests;
    if (userInfo.role === 'admin') {
      // Admin gets ALL tests from ALL teachers
      if (cursor) {
        activeTests = await sql`
          SELECT * FROM teacher_active_tests_view 
          WHERE (created_at, test_id) < (${cursorCreatedAt}, ${cursorId})
          ORDER BY created_at DESC, test_id DESC
          LIMIT ${limit}
        `;
      } else {
        activeTests = await sql`
          SELECT * FROM teacher_active_tests_view 
          ORDER BY created_at DESC, test_id DESC
          LIMIT ${limit}
        `;
      }
    } else {
      // Teacher gets only their own tests
      if (cursor) {
        activeTests = await sql`
          SELECT * FROM teacher_active_tests_view 
          WHERE teacher_id = ${teacher_id}
            AND (created_at, test_id) < (${cursorCreatedAt}, ${cursorId})
          ORDER BY created_at DESC, test_id DESC
          LIMIT ${limit}
        `;
      } else {
        activeTests = await sql`
          SELECT * FROM teacher_active_tests_view 
          WHERE teacher_id = ${teacher_id}
          ORDER BY created_at DESC, test_id DESC
          LIMIT ${limit}
        `;
      }
    }

    // Comprehensive debugging information
    const debugInfo = {
      request_parameters: {
        teacher_id: teacher_id,
        role: userInfo.role
      },
      query_execution: {
        data_source: 'teacher_active_tests_view',
        filter_strategy: userInfo.role === 'admin' ? 'no teacher filter (all teachers)' : 'filtered by teacher_id',
        ordering: 'created_at DESC',
        guarantees: 'View returns only tests that have assignments and are active'
      },
      results_analysis: {
        total_tests_found: activeTests.length,
        test_type_breakdown: {
          multiple_choice: activeTests.filter(t => t.test_type === 'multiple_choice').length,
          true_false: activeTests.filter(t => t.test_type === 'true_false').length,
          input: activeTests.filter(t => t.test_type === 'input').length,
          matching_type: activeTests.filter(t => t.test_type === 'matching_type').length,
          word_matching: activeTests.filter(t => t.test_type === 'word_matching').length,
          drawing: activeTests.filter(t => t.test_type === 'drawing').length,
          fill_blanks: activeTests.filter(t => t.test_type === 'fill_blanks').length
        },
        assignment_statistics: {
          total_assignments: activeTests.reduce((sum, test) => sum + test.assignment_count, 0),
          average_assignments_per_test: activeTests.length > 0 ? 
            (activeTests.reduce((sum, test) => sum + test.assignment_count, 0) / activeTests.length).toFixed(2) : 0
        },
        created_at_range: activeTests.length > 0 ? {
          newest: activeTests.reduce((max, t) => new Date(t.created_at) > new Date(max) ? t.created_at : max, activeTests[0].created_at),
          oldest: activeTests.reduce((min, t) => new Date(t.created_at) < new Date(min) ? t.created_at : min, activeTests[0].created_at)
        } : { newest: null, oldest: null }
      },
      sample_data: {
        first_test: activeTests.length > 0 ? activeTests[0] : null,
        test_with_most_assignments: activeTests.length > 0 ? 
          activeTests.reduce((max, test) => test.assignment_count > max.assignment_count ? test : max) : null
      },
      view_details: {
        name: 'teacher_active_tests_view',
        description: 'Unified, indexed view that consolidates active tests with assignment counts',
        filtering_column: 'teacher_id',
        ordering: 'created_at DESC'
      }
    };
    
    console.log('=== COMPREHENSIVE DEBUG INFO ===');
    console.log(JSON.stringify(debugInfo, null, 2));
    console.log('=== END DEBUG INFO ===');

    // Generate next cursor for pagination
    let nextCursor = null;
    if (activeTests.length === limit && activeTests.length > 0) {
      const lastTest = activeTests[activeTests.length - 1];
      nextCursor = `${lastTest.created_at.toISOString()},${lastTest.test_id}`;
    }

    // Generate ETag for caching
    const dataString = JSON.stringify({ tests: activeTests });
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
        pagination: {
          limit,
          has_more: activeTests.length === limit,
          next_cursor: nextCursor
        },
        debug_info: debugInfo
      })
    };

  } catch (error) {
    console.error('Error getting teacher active tests:', error);
    
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
