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
    // Validate admin token
    const tokenValidation = validateToken(event);
    if (!tokenValidation.success) {
      return {
        statusCode: tokenValidation.statusCode || 401,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          message: tokenValidation.error
        })
      };
    }

    const userInfo = tokenValidation.user;
    
    // Check if user is admin
    if (userInfo.role !== 'admin') {
      return {
        statusCode: 403,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          message: 'Access denied. Admin role required.'
        })
      };
    }

    const { teacherId, fieldName, newValue } = JSON.parse(event.body);

    // Validate required fields
    if (!teacherId || !fieldName || newValue === undefined) {
      return {
        statusCode: 400,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          message: 'teacherId, fieldName, and newValue are required'
        })
      };
    }

    // Validate field name
    const allowedFields = ['teacher_id', 'username', 'password', 'first_name', 'last_name', 'is_active'];
    if (!allowedFields.includes(fieldName)) {
      return {
        statusCode: 400,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          message: 'Invalid field name'
        })
      };
    }

    const sql = neon(process.env.NEON_DATABASE_URL);

    // Check if teacher exists
    const existingTeacher = await sql`
      SELECT teacher_id FROM teachers 
      WHERE teacher_id = ${teacherId}
    `;

    if (existingTeacher.length === 0) {
      return {
        statusCode: 404,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          message: 'Teacher not found'
        })
      };
    }

    // Update teacher field using template literal syntax
    try {
      if (fieldName === 'teacher_id') {
        // Note: Updating teacher_id requires updating foreign key references
        // For now, we'll prevent this to avoid data integrity issues
        return {
          statusCode: 400,
          headers: {
            ...headers,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            success: false,
            message: 'Cannot update teacher_id as it would break foreign key references'
          })
        };
      } else if (fieldName === 'username') {
        await sql`UPDATE teachers SET username = ${newValue}, updated_at = NOW() WHERE teacher_id = ${teacherId}`;
      } else if (fieldName === 'password') {
        await sql`UPDATE teachers SET password = ${newValue}, updated_at = NOW() WHERE teacher_id = ${teacherId}`;
      } else if (fieldName === 'first_name') {
        await sql`UPDATE teachers SET first_name = ${newValue}, updated_at = NOW() WHERE teacher_id = ${teacherId}`;
      } else if (fieldName === 'last_name') {
        await sql`UPDATE teachers SET last_name = ${newValue}, updated_at = NOW() WHERE teacher_id = ${teacherId}`;
      } else if (fieldName === 'is_active') {
        await sql`UPDATE teachers SET is_active = ${newValue}, updated_at = NOW() WHERE teacher_id = ${teacherId}`;
      } else {
        return {
          statusCode: 400,
          headers: {
            ...headers,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            success: false,
            message: 'Invalid field name for update'
          })
        };
      }
    } catch (updateError) {
      console.error('Database update error:', updateError);
      return {
        statusCode: 500,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          message: 'Failed to update teacher in database',
          error: updateError.message
        })
      };
    }

    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        message: 'Teacher updated successfully',
        teacherId,
        fieldName,
        newValue
      })
    };

  } catch (error) {
    console.error('Update teacher error:', error);
    
    return {
      statusCode: 500,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        message: 'Failed to update teacher',
        error: error.message
      })
    };
  }
};
