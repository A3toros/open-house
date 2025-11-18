const { neon } = require('@neondatabase/serverless');
const jwt = require('jsonwebtoken');
const { withSecurity, schemas } = require('./security-middleware');

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
    const { studentId, password } = JSON.parse(event.body);

    if (!studentId || !password) {
      return {
        statusCode: 400,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          message: 'Student ID and password are required'
        })
      };
    }

            const sql = neon(process.env.NEON_DATABASE_URL);
    
    // Step 1: Check if student ID exists
    const studentExists = await sql`
      SELECT student_id FROM users WHERE student_id = ${studentId}
    `;

    if (studentExists.length === 0) {
      return {
        statusCode: 401,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          message: 'Student ID not found. Please check your student ID.',
          error: 'USERNAME_NOT_FOUND'
        })
      };
    }

    // Step 2: Check password for existing student
    const students = await sql`
      SELECT student_id, name, surname, nickname, grade, class, number, password
      FROM users 
      WHERE student_id = ${studentId} AND password = ${password}
    `;

    if (students.length === 0) {
      return {
        statusCode: 401,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          message: 'Incorrect password for this student ID. Please check your password.',
          error: 'PASSWORD_INCORRECT'
        })
      };
    }

    const student = students[0];

    // Generate JWT tokens
    const accessToken = jwt.sign(
      {
        sub: student.student_id,
        role: 'student',
        name: student.name,
        surname: student.surname,
        nickname: student.nickname,
        grade: student.grade,
        class: student.class,
        number: student.number
      },
      process.env.JWT_SECRET,
      { expiresIn: '30m' }
    );

    const refreshToken = jwt.sign(
      {
        sub: student.student_id,
        role: 'student',
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
        role: 'student',
        accessToken: accessToken,
        refreshToken: refreshToken,
        student: {
          student_id: student.student_id,
          name: student.name,
          surname: student.surname,
          nickname: student.nickname,
          grade: student.grade,
          class: student.class,
          number: student.number
        }
      })
    };
  } catch (error) {
    console.error('Student login error:', error);
    
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
  schema: schemas.studentLogin,
  maxBodySize: 1024 * 1024 // 1MB limit for login requests
});
