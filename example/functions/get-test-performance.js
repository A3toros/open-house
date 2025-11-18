const { neon } = require('@neondatabase/serverless');

// Initialize Neon serverless client
const sql = neon(process.env.NEON_DATABASE_URL);

/**
 * Get Test Performance Data
 * 
 * Returns test performance data for a teacher in the current academic period.
 * Uses the test_performance_by_test view to get aggregated test scores.
 */
exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    // Get query parameters
    const { teacher_id, academic_period_id, grade, class: className } = event.queryStringParameters || {};

    if (!teacher_id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'teacher_id parameter is required'
        })
      };
    }

    if (!academic_period_id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'academic_period_id parameter is required'
        })
      };
    }

    console.log(`📊 Fetching test performance for teacher ${teacher_id}, period ${academic_period_id}, class: ${grade}/${className || 'all'}`);

    // Use template literal syntax for Neon
    let data;
    if (grade && className) {
      // Handle grade format: M1 -> 1, M2 -> 2, etc.
      const parsedGrade = grade.startsWith('M') ? parseInt(grade.substring(1)) : parseInt(grade);
      const parsedClass = parseInt(className);
      console.log(`📊 Parsed values: grade=${grade} -> ${parsedGrade}, class=${className} -> ${parsedClass}`);
      console.log(`📊 Filtering by class: grade=${parsedGrade}, class=${parsedClass}`);
      
      data = await sql`
        SELECT * FROM test_performance_by_test 
        WHERE teacher_id = ${teacher_id} AND academic_period_id = ${academic_period_id}
        AND grade = ${parsedGrade} AND class = ${parsedClass}
        ORDER BY submitted_at ASC
      `;
    } else {
      console.log('📊 No class filtering - getting all classes for teacher');
      
      data = await sql`
        SELECT * FROM test_performance_by_test 
        WHERE teacher_id = ${teacher_id} AND academic_period_id = ${academic_period_id}
        ORDER BY submitted_at ASC
      `;
    }

    console.log(`📊 Found ${data?.length || 0} test performance records`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: data || [],
        count: data?.length || 0,
        teacher_id,
        academic_period_id
      })
    };

  } catch (error) {
    console.error('📊 Error in get-test-performance:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Internal server error',
        details: error.message
      })
    };
  }
};
