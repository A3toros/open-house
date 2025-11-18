const { neon } = require('@neondatabase/serverless');
const jwt = require('jsonwebtoken');
const path = require('path');
const { withSecurity, schemas } = require('./security-middleware');

// Load environment variables from parent directory
const envPath = path.join(__dirname, '..', '.env');
const result = require('dotenv').config({ path: envPath });
if (result.error) {
  console.log('Error loading .env file:', result.error.message);
}

const handler = async function(event, context) {
  // Enable CORS with Authorization header support
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
      headers,
      body: JSON.stringify({ success: false, message: 'Method not allowed' })
    };
  }

  try {
    const { username, password } = JSON.parse(event.body);

    if (!username || !password) {
      return {
        statusCode: 400,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          message: 'Username and password are required'
        })
      };
    }

            const sql = neon(process.env.NEON_DATABASE_URL);
    
    // Step 1: Check if username exists
    const teacherExists = await sql`
      SELECT teacher_id FROM teachers WHERE username = ${username}
    `;

    if (teacherExists.length === 0) {
      return {
        statusCode: 401,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          message: 'Username not found. Please check your username.',
          error: 'USERNAME_NOT_FOUND'
        })
      };
    }

    // Step 2: Check password for existing teacher
    const teachers = await sql`
      SELECT teacher_id, username, first_name, last_name, is_active
      FROM teachers 
      WHERE username = ${username} AND password = ${password}
    `;

    if (teachers.length === 0) {
      return {
        statusCode: 401,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          message: 'Incorrect password for this username. Please check your password.',
          error: 'PASSWORD_INCORRECT'
        })
      };
    }

    const teacher = teachers[0];

    // Generate JWT tokens
    const accessToken = jwt.sign(
      {
        sub: teacher.teacher_id,
        role: 'teacher',
        username: teacher.username
      },
      process.env.JWT_SECRET,
      { expiresIn: '30m' }
    );

    const refreshToken = jwt.sign(
      {
        sub: teacher.teacher_id,
        role: 'teacher',
        type: 'refresh'
      },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        message: 'Login successful',
        role: 'teacher',
        accessToken: accessToken,
        refreshToken: refreshToken,
        teacher: {
          teacher_id: teacher.teacher_id,
          username: teacher.username,
          first_name: teacher.first_name,
          last_name: teacher.last_name,
          is_active: teacher.is_active
        }
      })
    };
  } catch (error) {
    console.error('Teacher login error:', error);
    
    return {
      statusCode: 500,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        message: 'Login failed',
        error: error.message
      })
    };
  }
};

// Export with security middleware
exports.handler = withSecurity(handler, {
  schema: schemas.login,
  maxBodySize: 1024 * 1024 // 1MB limit for login requests
});
