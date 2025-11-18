const { neon } = require('@neondatabase/serverless');
const { validateToken } = require('./validate-token');
require('dotenv').config();



exports.handler = async function(event, context) {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE'
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
    // Validate admin token
    const tokenValidation = validateToken(event);
    if (!tokenValidation.success) {
      return {
        statusCode: tokenValidation.statusCode || 401,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: tokenValidation.error })
      };
    }

    const userInfo = tokenValidation.user;
    
    // Check if user is admin
    if (userInfo.role !== 'admin') {
      return {
        statusCode: 403,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Access denied. Admin role required.' })
      };
    }

    const sql = neon(process.env.NEON_DATABASE_URL);
    
    console.log('🔍 Fetching all tests from all_tests_comprehensive_view...');

    // Parse pagination parameters
    const limit = Math.min(parseInt(event.queryStringParameters?.limit) || 50, 200);
    const cursor = event.queryStringParameters?.cursor;
    
    // Parse cursor (format: "created_at,test_id")
    let cursorCreatedAt, cursorId;
    if (cursor) {
      const [createdAtStr, idStr] = cursor.split(',');
      cursorCreatedAt = new Date(createdAtStr);
      cursorId = parseInt(idStr);
    }

    // Optional filter by teacher_id for admins
    const teacherIdFilter = event.queryStringParameters?.teacher_id || null;

    let tests;
    if (teacherIdFilter) {
      if (cursor) {
        tests = await sql`
          SELECT *
          FROM all_tests_comprehensive_view
          WHERE teacher_id = ${teacherIdFilter}
            AND (created_at, test_id) < (${cursorCreatedAt}, ${cursorId})
          ORDER BY created_at DESC, test_id DESC
          LIMIT ${limit}
        `;
      } else {
        tests = await sql`
          SELECT *
          FROM all_tests_comprehensive_view
          WHERE teacher_id = ${teacherIdFilter}
          ORDER BY created_at DESC, test_id DESC
          LIMIT ${limit}
        `;
      }
    } else {
      if (cursor) {
        tests = await sql`
          SELECT *
          FROM all_tests_comprehensive_view
          WHERE (created_at, test_id) < (${cursorCreatedAt}, ${cursorId})
          ORDER BY created_at DESC, test_id DESC
          LIMIT ${limit}
        `;
      } else {
        tests = await sql`
          SELECT *
          FROM all_tests_comprehensive_view
          ORDER BY created_at DESC, test_id DESC
          LIMIT ${limit}
        `;
      }
    }

    // Generate next cursor for pagination
    let nextCursor = null;
    if (tests.length === limit && tests.length > 0) {
      const lastTest = tests[tests.length - 1];
      nextCursor = `${lastTest.created_at.toISOString()},${lastTest.test_id}`;
    }

    // Generate ETag for caching
    const dataString = JSON.stringify({ tests, total: tests.length });
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
        tests,
        total: tests.length,
        pagination: {
          limit,
          has_more: tests.length === limit,
          next_cursor: nextCursor
        }
      })
    };
  } catch (error) {
    console.error('❌ Get all tests error:', error);
    console.error('❌ Error stack:', error.stack);
    
    return {
      statusCode: 500,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        message: 'Failed to retrieve tests',
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    };
  }
};
