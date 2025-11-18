const { neon } = require('@neondatabase/serverless');
const { validateToken } = require('./validate-token');

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
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
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Validate JWT token and extract user information
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

    const sql = neon(process.env.NEON_DATABASE_URL);
    const { teacher_id, grade, class: className, academic_period_id } = event.queryStringParameters;
    
    // Validate required parameters
    if (!grade || !className || !academic_period_id) {
      return {
        statusCode: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing required parameters: grade, class, academic_period_id' })
      };
    }

    // Extract class number from className (e.g., "1/15" -> 15)
    const classNumber = className.split('/')[1];
    if (!classNumber || isNaN(parseInt(classNumber))) {
      return {
        statusCode: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid class format. Expected format: grade/class (e.g., 1/15)' })
      };
    }

    // Extract grade number from grade (e.g., "M1" -> 1)
    const gradeNumber = grade.replace('M', '');
    if (!gradeNumber || isNaN(parseInt(gradeNumber))) {
      return {
        statusCode: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid grade format. Expected format: M1, M2, etc.' })
      };
    }

    // Handle admin vs regular teacher
    let actualTeacherId;
    if (userInfo.role === 'admin') {
      // Admin can access any teacher's data if teacher_id is provided
      actualTeacherId = teacher_id || userInfo.teacher_id;
    } else {
      // Regular teacher uses their own ID
      actualTeacherId = userInfo.teacher_id;
    }

    if (!actualTeacherId) {
      return {
        statusCode: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Teacher ID is required' })
      };
    }

    console.log('Fetching teacher student results:', {
      teacher_id: actualTeacherId,
      grade,
      class: className,
      academic_period_id
    });

    // Get all students in this grade and class
    const students = await sql`
      SELECT student_id, name, surname, nickname, number
      FROM users 
      WHERE grade = ${parseInt(gradeNumber)} AND class = ${parseInt(classNumber)}
      ORDER BY CAST(number AS INTEGER)
    `;
    
    console.log(`Found ${students.length} students in grade ${grade} class ${className}`);

    // Get specific academic period for the requested term
    const academicPeriods = await sql`
      SELECT id, academic_year, semester, term, start_date, end_date
      FROM academic_year 
      WHERE id = ${academic_period_id}
    `;
    
    if (academicPeriods.length === 0) {
      return {
        statusCode: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: `No academic period found for ID ${academic_period_id}` })
      };
    }
    
    console.log('Academic period for term ID', academic_period_id, ':', academicPeriods[0]);
    
    // Use specific academic period ID for the query
    const academicPeriodIds = [academic_period_id];
    console.log('Academic period ID to query:', academicPeriodIds);
    
    // Query consolidated view for comprehensive results (no pagination)
    const results = await sql`
      SELECT *
      FROM teacher_student_results_view
      WHERE teacher_id = ${actualTeacherId}
        AND grade = ${parseInt(gradeNumber)}
        AND class = ${parseInt(classNumber)}
        AND academic_period_id = ANY(${academicPeriodIds})
      ORDER BY created_at DESC, id DESC
    `;
    
    console.log(`Found ${results.length} test results for teacher ${actualTeacherId} in academic period ${academic_period_id}`);
    
    // Debug: Check if there are any results at all for this teacher
    if (results.length === 0) {
      console.log('🔍 Debugging: No results found, checking if teacher has any results...');
      
      // Check for any results for this teacher across all academic periods using the consolidated view
      const debugResults = await sql`
        SELECT 
          test_type,
          test_id,
          test_name,
          academic_period_id,
          grade,
          class,
          COUNT(*) as result_count
        FROM teacher_student_results_view
        WHERE teacher_id = ${actualTeacherId}
        GROUP BY test_type, test_id, test_name, academic_period_id, grade, class
        ORDER BY test_type, test_id
      `;
      
      console.log('🔍 Debug: All results for this teacher:', debugResults);
    }
    
    // Extract unique subjects from results
    const uniqueSubjects = [...new Set(results.map(result => result.subject).filter(subject => subject))];
    

    // Generate ETag for caching
    const dataString = JSON.stringify({ results, students, subjects: uniqueSubjects, count: results.length });
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
        results,
        students,
        subjects: uniqueSubjects,
        count: results.length,
        student_count: students.length,
        teacher_id: actualTeacherId,
        grade,
        class: className,
        academic_period_id
      })
    };
  } catch (error) {
    console.error('Error fetching teacher student results:', error);
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
