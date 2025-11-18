const { neon } = require('@neondatabase/serverless');
const jwt = require('jsonwebtoken');

exports.handler = async function(event, context) {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || 'https://mathayomwatsing.netlify.app',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Credentials': 'true'
  };

  // Handle preflight request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Only allow GET method
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Extract and validate JWT token
    const authHeader = event.headers.authorization || event.headers.Authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          message: 'Authorization header missing or invalid'
        })
      };
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return {
          statusCode: 401,
          headers: {
            ...headers,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            success: false,
            message: 'Token expired',
            error: 'TOKEN_EXPIRED'
          })
        };
      } else {
        return {
          statusCode: 401,
          headers: {
            ...headers,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            success: false,
            message: 'Invalid token'
          })
        };
      }
    }

    // Validate role
    if (decoded.role !== 'student') {
      return {
        statusCode: 403,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          message: 'Access denied. Student role required.'
        })
      };
    }

    // Get parameters
    const { test_id, test_type } = event.queryStringParameters || {};
    
    if (!test_id || !test_type) {
      return {
        statusCode: 400,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          message: 'Missing required parameters: test_id, test_type'
        })
      };
    }

    // Connect to database
    const sql = neon(process.env.DATABASE_URL || process.env.POSTGRES_URL);

    // Check if test is completed based on test type
    let isCompleted = false;
    let completionData = null;

    if (test_type === 'speaking') {
      // Check speaking test completion
      const result = await sql`
        SELECT id, overall_score, created_at
        FROM speaking_test_results 
        WHERE test_id = ${parseInt(test_id)} 
        AND student_id = ${decoded.student_id}
        ORDER BY created_at DESC
        LIMIT 1
      `;
      
      if (result.length > 0) {
        isCompleted = true;
        completionData = {
          score: result[0].overall_score,
          completed_at: result[0].created_at
        };
      }
    } else {
      // For other test types, check test_attempts table
      const result = await sql`
        SELECT id, score, completed_at
        FROM test_attempts 
        WHERE test_id = ${parseInt(test_id)} 
        AND test_type = ${test_type}
        AND student_id = ${decoded.student_id}
        AND is_completed = true
        ORDER BY completed_at DESC
        LIMIT 1
      `;
      
      if (result.length > 0) {
        isCompleted = true;
        completionData = {
          score: result[0].score,
          completed_at: result[0].completed_at
        };
      }
    }

    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        is_completed: isCompleted,
        completion_data: completionData
      })
    };

  } catch (error) {
    console.error('Error checking test completion:', error);
    return {
      statusCode: 500,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        message: 'Internal server error',
        error: error.message
      })
    };
  }
};