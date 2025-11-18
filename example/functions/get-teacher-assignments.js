const { neon } = require('@neondatabase/serverless');
const { validateToken } = require('./validate-token');

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
    // Validate JWT token and extract teacher information
    const result = validateToken(event);
    
    if (!result.success) {
      return {
        statusCode: result.statusCode || 401,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          message: result.error
        })
      };
    }

    const userInfo = result.user;
    
    // Check if user is teacher or admin
    if (userInfo.role !== 'teacher' && userInfo.role !== 'admin') {
      return {
        statusCode: 403,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          message: 'Access denied. Teacher or admin role required.'
        })
      };
    }

    // Handle admin vs regular teacher
    let teacher_id;
    if (userInfo.role === 'admin') {
      // Admin can access all assignments - no teacher_id required
      // If teacher_id is provided, filter by that teacher, otherwise show all
      teacher_id = event.queryStringParameters?.teacher_id || null;
    } else {
      // Regular teacher uses their own ID
      teacher_id = userInfo.teacher_id;
    }

    console.log('get-teacher-assignments called with teacher_id:', teacher_id);

    const sql = neon(process.env.NEON_DATABASE_URL);




    
    // Use consolidated view for teacher assignments overview
    let rows;
    if (userInfo.role === 'admin' && teacher_id === null) {
      rows = await sql`
        SELECT *
        FROM teacher_assignments_overview_view
        ORDER BY assigned_at DESC
      `;
    } else {
      rows = await sql`
        SELECT *
        FROM teacher_assignments_overview_view
        WHERE teacher_id = ${teacher_id}
        ORDER BY assigned_at DESC
      `;
    }

    console.log('Assignments from view:', rows.length);

    // Generate ETag for caching
    const dataString = JSON.stringify({ assignments: rows });
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
        assignments: rows
      })
    };
  } catch (error) {
    console.error('Get teacher assignments error:', error);
    
    return {
      statusCode: 500,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        message: 'Failed to retrieve teacher assignments',
        error: error.message
      })
    };
  }
};
