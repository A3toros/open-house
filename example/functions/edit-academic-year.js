const { neon } = require('@neondatabase/serverless');
const { validateToken } = require('./validate-token');
require('dotenv').config();

exports.handler = async function(event, context) {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || 'https://mathayomwatsing.netlify.app',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

    const { action, academic_year_id, academic_year, semester, term, start_date, end_date } = JSON.parse(event.body);

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
          if (!academic_year || !semester || !term || !start_date || !end_date) {
            throw new Error('All fields are required for adding academic year');
          }
          await sql`
            INSERT INTO academic_year (academic_year, semester, term, start_date, end_date) 
            VALUES (${academic_year}, ${semester}, ${term}, ${start_date}, ${end_date})
          `;
          break;

        case 'edit':
          if (!academic_year_id || !academic_year || !semester || !term || !start_date || !end_date) {
            throw new Error('All fields are required for editing academic year');
          }
          await sql`
            UPDATE academic_year 
            SET academic_year = ${academic_year}, semester = ${semester}, term = ${term}, 
                start_date = ${start_date}, end_date = ${end_date}
            WHERE id = ${academic_year_id}
          `;
          break;

        case 'delete':
          if (!academic_year_id) {
            throw new Error('Academic year ID is required for deletion');
          }
          // Check if academic year is referenced in test results
          const testResults = await sql`SELECT COUNT(*) as count FROM multiple_choice_test_results WHERE academic_period_id = ${academic_year_id}`;
          const tfResults = await sql`SELECT COUNT(*) as count FROM true_false_test_results WHERE academic_period_id = ${academic_year_id}`;
          const inputResults = await sql`SELECT COUNT(*) as count FROM input_test_results WHERE academic_period_id = ${academic_year_id}`;
          
          const totalResults = testResults[0].count + tfResults[0].count + inputResults[0].count;
          
          if (totalResults > 0) {
            throw new Error('Cannot delete academic year that has test results');
          }
          
          await sql`DELETE FROM academic_year WHERE id = ${academic_year_id}`;
          break;
      }

      // Commit transaction
      await sql`COMMIT`;

      return {
        statusCode: 200,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          success: true, 
          message: `Academic year ${action}ed successfully`
        })
      };

    } catch (error) {
      // Rollback transaction on error
      await sql`ROLLBACK`;
      throw error;
    }

  } catch (error) {
    console.error('Error editing academic year:', error);
    
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
