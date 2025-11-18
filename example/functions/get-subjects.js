const { neon } = require('@neondatabase/serverless');

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
            const sql = neon(process.env.NEON_DATABASE_URL);
    
    // Query the database for all subjects
    const subjects = await sql`
      SELECT subject_id, subject
      FROM subjects 
      ORDER BY subject
    `;

    // Generate ETag for caching (static data - long cache time)
    const dataString = JSON.stringify({ subjects });
    const etag = `"${Buffer.from(dataString).toString('base64').slice(0, 16)}"`;

    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=7200', // 1 hour + 2 hour stale
        'ETag': etag,
        'Vary': 'Authorization'
      },
      body: JSON.stringify({
        success: true,
        subjects: subjects
      })
    };
  } catch (error) {
    console.error('Get subjects error:', error);
    
    return {
      statusCode: 500,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        message: 'Failed to retrieve subjects',
        error: error.message
      })
    };
  }
};
