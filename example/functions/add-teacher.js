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

    const { teacher_id, username, password, first_name, last_name, is_active } = JSON.parse(event.body);

    // Validate required fields
    if (!teacher_id || !username || !password) {
      return {
        statusCode: 400,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          message: 'teacher_id, username, and password are required'
        })
      };
    }

    const sql = neon(process.env.NEON_DATABASE_URL);

    // Check if teacher already exists
    const existingTeacher = await sql`
      SELECT teacher_id FROM teachers 
      WHERE teacher_id = ${teacher_id}
    `;

    if (existingTeacher.length > 0) {
      return {
        statusCode: 409,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          message: 'Teacher with this ID already exists'
        })
      };
    }

    // Insert new teacher
    await sql`
      INSERT INTO teachers (teacher_id, username, password, first_name, last_name, is_active, created_at, updated_at)
      VALUES (${teacher_id}, ${username}, ${password}, ${first_name || null}, ${last_name || null}, ${is_active !== false}, NOW(), NOW())
    `;

    return {
      statusCode: 201,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        message: 'Teacher created successfully',
        teacher: {
          teacher_id,
          username,
          first_name: first_name || null,
          last_name: last_name || null,
          email: email || null,
          phone: phone || null,
          is_active: is_active !== false
        }
      })
    };

  } catch (error) {
    console.error('Add teacher error:', error);
    
    return {
      statusCode: 500,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        message: 'Failed to create teacher',
        error: error.message
      })
    };
  }
};
