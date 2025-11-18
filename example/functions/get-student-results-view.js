const { neon } = require('@neondatabase/serverless');

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || 'https://mathayomwatsing.netlify.app',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Credentials': 'true'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, error: 'Method not allowed' })
    };
  }

  try {
    const sql = neon(process.env.NEON_DATABASE_URL);
    const { student_id, academic_period_id } = event.queryStringParameters;
    
    if (!student_id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: 'Missing required parameter: student_id' 
        })
      };
    }

    // Build query based on whether academic_period_id is provided (no pagination)
    let results;
    if (academic_period_id) {
      results = await sql`
        SELECT * FROM student_results_view 
        WHERE student_id = ${student_id}
        AND academic_period_id = ${academic_period_id}
        ORDER BY created_at DESC, id DESC
      `;
    } else {
      // If no academic period specified, get all results for the student
      results = await sql`
        SELECT * FROM student_results_view 
        WHERE student_id = ${student_id}
        ORDER BY created_at DESC, id DESC
      `;
    }

    // Generate ETag for caching
    const dataString = JSON.stringify({ results });
    const etag = `"${btoa(dataString).slice(0, 16)}"`;

    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
        'ETag': etag,
        'Vary': 'Authorization'
      },
      body: JSON.stringify({ 
        success: true, 
        results
      })
    };
  } catch (error) {
    console.error('Error fetching student results view:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, error: error.message })
    };
  }
};
