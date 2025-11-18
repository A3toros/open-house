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

    const { subject } = JSON.parse(event.body);

    // Validate required fields
    if (!subject) {
      return {
        statusCode: 400,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          message: 'Subject name is required'
        })
      };
    }

    const sql = neon(process.env.NEON_DATABASE_URL);

    // Check if subject already exists
    const existingSubject = await sql`
      SELECT subject FROM subjects 
      WHERE subject = ${subject}
    `;

    if (existingSubject.length > 0) {
      return {
        statusCode: 409,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          message: 'Subject with this name already exists'
        })
      };
    }

    // Insert new subject
    const result = await sql`
      INSERT INTO subjects (subject)
      VALUES (${subject})
      RETURNING subject_id
    `;

    return {
      statusCode: 201,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        message: 'Subject created successfully',
        subject: {
          subject_id: result[0].subject_id,
          subject
        }
      })
    };

  } catch (error) {
    console.error('Add subject error:', error);
    
    return {
      statusCode: 500,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        message: 'Failed to create subject',
        error: error.message
      })
    };
  }
};
