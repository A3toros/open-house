const { neon } = require('@neondatabase/serverless');
const { validateToken } = require('./validate-token');
require('dotenv').config();

exports.handler = async function(event, context) {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
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
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ success: false, message: 'Method not allowed' })
    };
  }

  try {
    // Validate token and extract user information
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

    const requestBody = JSON.parse(event.body);
    console.log('Delete teacher subject request body:', requestBody);
    
    const { subjectId, grade, class: classNumber } = requestBody;
    console.log('Parsed fields:', { subjectId, grade, classNumber });
    
    // Handle admin vs regular teacher
    let teacher_id;
    if (result.user.role === 'admin') {
      // Admin can delete subjects for any teacher - get from request body
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

    // Validate required fields
    if (!subjectId || !grade || !classNumber) {
      return {
        statusCode: 400,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          message: 'subjectId, grade, and class are required'
        })
      };
    }

    const sql = neon(process.env.NEON_DATABASE_URL);

    // Check if teacher-subject combination exists
    const existingTeacherSubject = await sql`
      SELECT id FROM teacher_subjects 
      WHERE teacher_id = ${teacher_id} 
      AND subject_id = ${subjectId} 
      AND grade = ${grade} 
      AND class = ${classNumber}
    `;

    if (existingTeacherSubject.length === 0) {
      return {
        statusCode: 404,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          message: 'Teacher subject assignment not found'
        })
      };
    }

    // Delete the specific teacher-subject assignment
    await sql`
      DELETE FROM teacher_subjects 
      WHERE teacher_id = ${teacher_id} 
      AND subject_id = ${subjectId} 
      AND grade = ${grade} 
      AND class = ${classNumber}
    `;

    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        message: 'Teacher subject assignment deleted successfully',
        deletedAssignment: {
          teacher_id,
          subject_id: subjectId,
          grade,
          class: classNumber
        }
      })
    };

  } catch (error) {
    console.error('Delete teacher subject error:', error);
    
    return {
      statusCode: 500,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        message: 'Failed to delete teacher subject assignment',
        error: error.message
      })
    };
  }
};
