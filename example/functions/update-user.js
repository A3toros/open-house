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

    const { userId, fieldName, newValue } = JSON.parse(event.body);

    // Validate required fields
    if (!userId || !fieldName || newValue === undefined) {
      return {
        statusCode: 400,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          message: 'userId, fieldName, and newValue are required'
        })
      };
    }

    // Validate field name
    const allowedFields = ['grade', 'class', 'number', 'student_id', 'name', 'surname', 'nickname', 'password', 'is_active'];
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

    // Check if user exists
    const existingUser = await sql`
      SELECT student_id FROM users 
      WHERE student_id = ${userId}
    `;

    if (existingUser.length === 0) {
      return {
        statusCode: 404,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          message: 'User not found'
        })
      };
    }

    // Update user field using template literal syntax
    try {
      if (fieldName === 'name') {
        await sql`UPDATE users SET name = ${newValue}, updated_at = NOW() WHERE student_id = ${userId}`;
      } else if (fieldName === 'surname') {
        await sql`UPDATE users SET surname = ${newValue}, updated_at = NOW() WHERE student_id = ${userId}`;
      } else if (fieldName === 'grade') {
        await sql`UPDATE users SET grade = ${newValue}, updated_at = NOW() WHERE student_id = ${userId}`;
      } else if (fieldName === 'class') {
        await sql`UPDATE users SET class = ${newValue}, updated_at = NOW() WHERE student_id = ${userId}`;
      } else if (fieldName === 'number') {
        await sql`UPDATE users SET number = ${newValue}, updated_at = NOW() WHERE student_id = ${userId}`;
      } else if (fieldName === 'student_id') {
        // Note: Updating student_id requires updating foreign key references
        // For now, we'll prevent this to avoid data integrity issues
        return {
          statusCode: 400,
          headers: {
            ...headers,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            success: false,
            message: 'Cannot update student_id as it would break foreign key references'
          })
        };
      } else if (fieldName === 'nickname') {
        await sql`UPDATE users SET nickname = ${newValue}, updated_at = NOW() WHERE student_id = ${userId}`;
      } else if (fieldName === 'password') {
        await sql`UPDATE users SET password = ${newValue}, updated_at = NOW() WHERE student_id = ${userId}`;
      } else if (fieldName === 'is_active') {
        await sql`UPDATE users SET is_active = ${newValue}, updated_at = NOW() WHERE student_id = ${userId}`;
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
          message: 'Failed to update user in database',
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
        message: 'User updated successfully',
        userId,
        fieldName,
        newValue
      })
    };

  } catch (error) {
    console.error('Update user error:', error);
    
    return {
      statusCode: 500,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        message: 'Failed to update user',
        error: error.message
      })
    };
  }
};
