const jwt = require('jsonwebtoken');
require('dotenv').config();

/**
 * Token validation middleware
 * Extracts JWT from Authorization header and validates it
 * Returns decoded user info for use in other functions
 */
exports.handler = async function(event, context) {
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
    // Extract token from Authorization header
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

    // Verify token
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
      } else if (error.name === 'JsonWebTokenError') {
        return {
          statusCode: 401,
          headers: {
            ...headers,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            success: false,
            message: 'Invalid token',
            error: 'INVALID_TOKEN'
          })
        };
      } else {
        throw error;
      }
    }

    // Extract user information based on role
    const userInfo = {
      role: decoded.role,
      name: decoded.name,
      surname: decoded.surname,
      nickname: decoded.nickname,
      grade: decoded.grade,
      class: decoded.class,
      number: decoded.number,
      username: decoded.username
    };

    // Add role-specific ID field
    if (decoded.role === 'student') {
      userInfo.student_id = decoded.sub;
    } else if (decoded.role === 'teacher') {
      userInfo.teacher_id = decoded.sub; // Regular teacher
    } else if (decoded.role === 'admin') {
      userInfo.admin_id = decoded.admin_id; // Admin ID
    }

    // Remove undefined values
    Object.keys(userInfo).forEach(key => {
      if (userInfo[key] === undefined) {
        delete userInfo[key];
      }
    });

    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        message: 'Token validated successfully',
        user: userInfo
      })
    };

  } catch (error) {
    console.error('Token validation error:', error);
    
    return {
      statusCode: 500,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        message: 'Token validation failed',
        error: error.message
      })
    };
  }
};

/**
 * Helper function to validate token in other functions
 * This can be imported and used as middleware
 */
function validateToken(event) {
  try {
    // Extract token from Authorization header
    const authHeader = event.headers.authorization || event.headers.Authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        success: false,
        error: 'Authorization header missing or invalid',
        statusCode: 401
      };
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Extract user information based on role
    const userInfo = {
      role: decoded.role,
      name: decoded.name,
      surname: decoded.surname,
      nickname: decoded.nickname,
      grade: decoded.grade,
      class: decoded.class,
      number: decoded.number,
      username: decoded.username
    };

    // Add role-specific ID field
    if (decoded.role === 'student') {
      userInfo.student_id = decoded.sub;
    } else if (decoded.role === 'teacher') {
      userInfo.teacher_id = decoded.sub; // Regular teacher
    } else if (decoded.role === 'admin') {
      userInfo.admin_id = decoded.admin_id; // Admin ID
    }

    return {
      success: true,
      user: userInfo
    };
    
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return {
        success: false,
        error: 'Token expired',
        statusCode: 401
      };
    } else {
      return {
        success: false,
        error: 'Invalid token',
        statusCode: 401
      };
    }
  }
}

// Export helper function
module.exports.validateToken = validateToken;
