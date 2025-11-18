const { neon } = require('@neondatabase/serverless');
const { validateToken } = require('./validate-token');

exports.handler = async function(event, context) {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, message: 'Method not allowed' })
    };
  }

  try {
    // Validate JWT token and extract user information
    const result = validateToken(event);
    
    if (!result.success) {
      return {
        statusCode: result.statusCode || 401,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          message: result.message || 'Authentication failed'
        })
      };
    }

    // Check if user is teacher or admin
    if (result.user.role !== 'teacher' && result.user.role !== 'admin') {
      return {
        statusCode: 403,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          message: 'Access denied. Teacher or admin role required.'
        })
      };
    }

    const { subjects } = JSON.parse(event.body);
    
    // Handle admin vs regular teacher
    let teacher_id;
    if (result.user.role === 'admin') {
      // Admin can save subjects for any teacher - get from request body
      teacher_id = JSON.parse(event.body).teacher_id;
      if (!teacher_id) {
        return {
          statusCode: 400,
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ success: false, message: 'teacher_id required for admin users' })
        };
      }
    } else {
      // Regular teacher uses their own ID
      teacher_id = result.user.teacher_id;
    }

    if (!subjects || !Array.isArray(subjects)) {
      return {
        statusCode: 400,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          message: 'Subjects array is required'
        })
      };
    }

            const sql = neon(process.env.NEON_DATABASE_URL);
    
    // Begin transaction
    await sql`BEGIN`;
    
    try {
      // Use UPSERT approach: Insert new subjects, ignore duplicates
      for (const subject of subjects) {
        for (const classInfo of subject.classes) {
          // Use INSERT ... ON CONFLICT DO NOTHING to avoid duplicates
          await sql`
            INSERT INTO teacher_subjects (teacher_id, subject_id, grade, class)
            VALUES (${teacher_id}, ${subject.subject_id}, ${classInfo.grade}, ${classInfo.class})
            ON CONFLICT (teacher_id, subject_id, grade, class) DO NOTHING
          `;
        }
      }
      
      // Commit transaction
      await sql`COMMIT`;
      
      return {
        statusCode: 200,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: true,
          message: 'Teacher subjects saved successfully'
        })
      };
    } catch (error) {
      // Rollback transaction on error
      await sql`ROLLBACK`;
      throw error;
    }
  } catch (error) {
    console.error('Save teacher subjects error:', error);
    
    return {
      statusCode: 500,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        message: 'Failed to save teacher subjects',
        error: error.message
      })
    };
  }
};
