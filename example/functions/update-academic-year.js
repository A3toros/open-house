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

    const { academicYearId, fieldName, newValue } = JSON.parse(event.body);

    // Validate required fields
    if (!academicYearId || !fieldName || newValue === undefined) {
      return {
        statusCode: 400,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          message: 'academicYearId, fieldName, and newValue are required'
        })
      };
    }

    // Validate field name
    const allowedFields = ['academic_year', 'semester', 'start_date', 'end_date'];
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

    // Check if academic year exists
    const existingAcademicYear = await sql`
      SELECT id FROM academic_year 
      WHERE id = ${academicYearId}
    `;

    if (existingAcademicYear.length === 0) {
      return {
        statusCode: 404,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          message: 'Academic year not found'
        })
      };
    }

    // Update academic year field
    const updateQuery = `UPDATE academic_year SET ${fieldName} = $1, updated_at = NOW() WHERE id = $2`;
    await sql.unsafe(updateQuery, [newValue, academicYearId]);

    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        message: 'Academic year updated successfully',
        academicYearId,
        fieldName,
        newValue
      })
    };

  } catch (error) {
    console.error('Update academic year error:', error);
    
    return {
      statusCode: 500,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        message: 'Failed to update academic year',
        error: error.message
      })
    };
  }
};
