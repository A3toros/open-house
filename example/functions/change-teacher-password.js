const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

exports.handler = async function(event, context) {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || 'https://mathayomwatsing.netlify.app',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400' // Cache preflight for 24 hours
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
    const { username, currentPassword, newPassword } = JSON.parse(event.body);

    if (!username || !currentPassword || !newPassword) {
      return {
        statusCode: 400,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          message: 'Username, current password, and new password are required'
        })
      };
    }

    const sql = neon(process.env.NEON_DATABASE_URL);
    
    // First, verify the current password
    const teacher = await sql`
      SELECT teacher_id, username, password
      FROM teachers 
      WHERE username = ${username} AND password = ${currentPassword}
    `;

    if (teacher.length === 0) {
      return {
        statusCode: 401,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          message: 'Invalid username or current password'
        })
      };
    }

    // Update the password
    await sql`
      UPDATE teachers 
      SET password = ${newPassword}, updated_at = NOW()
      WHERE username = ${username}
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
    console.error('Change teacher password error:', error);
    
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
