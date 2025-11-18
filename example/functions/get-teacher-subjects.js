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
      // Admin can access all subjects - no teacher_id required
      // If teacher_id is provided, filter by that teacher, otherwise show all
      teacher_id = event.queryStringParameters?.teacher_id || null;
    } else {
      // Regular teacher uses their own ID
      teacher_id = userInfo.teacher_id;
    }

            const sql = neon(process.env.NEON_DATABASE_URL);
    
    // Query the database for teacher subjects
    let teacherSubjects;
    if (userInfo.role === 'admin' && teacher_id === null) {
      // Admin gets all subjects from all teachers
      teacherSubjects = await sql`
        SELECT ts.subject_id, ts.grade, ts.class, s.subject, ts.teacher_id
        FROM teacher_subjects ts
        JOIN subjects s ON ts.subject_id = s.subject_id
        ORDER BY s.subject, ts.grade, ts.class
      `;
    } else {
      // Teacher gets only their subjects
      teacherSubjects = await sql`
        SELECT ts.subject_id, ts.grade, ts.class, s.subject
        FROM teacher_subjects ts
        JOIN subjects s ON ts.subject_id = s.subject_id
        WHERE ts.teacher_id = ${teacher_id}
        ORDER BY s.subject, ts.grade, ts.class
      `;
    }

    // Group subjects by subject_id
    const subjectsMap = new Map();
    teacherSubjects.forEach(row => {
      if (!subjectsMap.has(row.subject_id)) {
        subjectsMap.set(row.subject_id, {
          subject_id: row.subject_id,
          subject: row.subject,
          classes: []
        });
      }
      subjectsMap.get(row.subject_id).classes.push({
        grade: row.grade,
        class: row.class
      });
    });

    const subjects = Array.from(subjectsMap.values());

    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        subjects: subjects
      })
    };
  } catch (error) {
    console.error('Get teacher subjects error:', error);
    
    return {
      statusCode: 500,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        message: 'Failed to retrieve teacher subjects',
        error: error.message
      })
    };
  }
};
