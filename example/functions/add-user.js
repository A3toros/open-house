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

    const { grade, class: classNum, number, student_id, name, surname, nickname, password } = JSON.parse(event.body);

    // Validate required fields
    if (!grade || !classNum || !number || !student_id || !name || !surname || !nickname || !password) {
      return {
        statusCode: 400,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          message: 'All fields are required'
        })
      };
    }

    const sql = neon(process.env.NEON_DATABASE_URL);

    // Check if student already exists
    const existingStudent = await sql`
      SELECT student_id FROM users 
      WHERE student_id = ${student_id}
    `;

    if (existingStudent.length > 0) {
      return {
        statusCode: 409,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          message: 'Student with this ID already exists'
        })
      };
    }

    // Insert new user
    await sql`
      INSERT INTO users (grade, class, number, student_id, name, surname, nickname, password, is_active, created_at, updated_at)
      VALUES (${grade}, ${classNum}, ${number}, ${student_id}, ${name}, ${surname}, ${nickname}, ${password}, true, NOW(), NOW())
    `;

    return {
      statusCode: 201,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        message: 'User created successfully',
        user: {
          grade,
          class: classNum,
          number,
          student_id,
          name,
          surname,
          nickname
        }
      })
    };

  } catch (error) {
    console.error('Add user error:', error);
    
    return {
      statusCode: 500,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        message: 'Failed to create user',
        error: error.message
      })
    };
  }
};
