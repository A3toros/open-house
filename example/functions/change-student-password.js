const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

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

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, message: 'Method not allowed' })
    };
  }

  try {
    const { studentId, currentPassword, newPassword } = JSON.parse(event.body);

    if (!studentId || !currentPassword || !newPassword) {
      return {
        statusCode: 400,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          message: 'Student ID, current password, and new password are required'
        })
      };
    }

    const sql = neon(process.env.NEON_DATABASE_URL);
    
    // First, verify the current password
    const student = await sql`
      SELECT student_id, password
      FROM users 
      WHERE student_id = ${studentId} AND password = ${currentPassword}
    `;

    if (student.length === 0) {
      return {
        statusCode: 401,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          message: 'Invalid student ID or current password'
        })
      };
    }

    // Update the password
    await sql`
      UPDATE users 
      SET password = ${newPassword}, updated_at = NOW()
      WHERE student_id = ${studentId}
    `;

    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        message: 'Password changed successfully'
      })
    };
  } catch (error) {
    console.error('Change student password error:', error);
    
    return {
      statusCode: 500,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        message: 'Failed to change password',
        error: error.message
      })
    };
  }
};
