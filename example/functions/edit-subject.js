const { neon } = require('@neondatabase/serverless');
const { validateToken } = require('./validate-token');
require('dotenv').config();

exports.handler = async function(event, context) {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Handle preflight request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Only allow POST method
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Validate admin token
    const tokenValidation = validateToken(event);
    if (!tokenValidation.success) {
      return {
        statusCode: tokenValidation.statusCode || 401,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: tokenValidation.error })
      };
    }

    const userInfo = tokenValidation.user;
    
    // Check if user is admin
    if (userInfo.role !== 'admin') {
      return {
        statusCode: 403,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Access denied. Admin role required.' })
      };
    }

    const { action, subject_id, subject_name } = JSON.parse(event.body);

    // Validate input
    if (!action || !['add', 'edit', 'delete'].includes(action)) {
      return {
        statusCode: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid action' })
      };
    }

    const sql = neon(process.env.NEON_DATABASE_URL);

    // Begin transaction
    await sql`BEGIN`;

    try {
      switch (action) {
        case 'add':
          if (!subject_name) {
            throw new Error('Subject name is required for adding');
          }
          await sql`INSERT INTO subjects (subject) VALUES (${subject_name})`;
          break;

        case 'edit':
          if (!subject_id || !subject_name) {
            throw new Error('Subject ID and name are required for editing');
          }
          await sql`UPDATE subjects SET subject = ${subject_name} WHERE subject_id = ${subject_id}`;
          break;

        case 'delete':
          if (!subject_id) {
            throw new Error('Subject ID is required for deletion');
          }
          // Check if subject is assigned to any teachers
          const assignments = await sql`SELECT COUNT(*) as count FROM teacher_subjects WHERE subject_id = ${subject_id}`;
          if (assignments[0].count > 0) {
            throw new Error('Cannot delete subject that is assigned to teachers');
          }
          await sql`DELETE FROM subjects WHERE subject_id = ${subject_id}`;
          break;
      }

      // Commit transaction
      await sql`COMMIT`;

      return {
        statusCode: 200,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          success: true, 
          message: `Subject ${action}ed successfully`
        })
      };

    } catch (error) {
      // Rollback transaction on error
      await sql`ROLLBACK`;
      throw error;
    }

  } catch (error) {
    console.error('Error editing subject:', error);
    
    return {
      statusCode: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      })
    };
  }
};
