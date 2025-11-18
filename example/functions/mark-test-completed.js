const { neon } = require('@neondatabase/serverless');
const { validateToken } = require('./validate-token');

exports.handler = async function(event, context) {
  console.log('=== mark-test-completed function called ===');
  console.log('Event:', event);
  
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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
    // Validate token
    const tokenValidation = validateToken(event);
    if (!tokenValidation.success) {
      return {
        statusCode: tokenValidation.statusCode || 401,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: tokenValidation.error })
      };
    }

    const userInfo = tokenValidation.user;
    
    // Check if user is teacher
    if (userInfo.role !== 'teacher') {
      return {
        statusCode: 403,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Access denied. Teacher role required.' })
      };
    }

    const { assignment_id, test_type, test_id } = JSON.parse(event.body) || {};
    
    console.log('Extracted params - assignment_id:', assignment_id, 'test_type:', test_type, 'test_id:', test_id);

    const sql = neon(process.env.NEON_DATABASE_URL);
    console.log('Database connection established');

    const teacher_id = userInfo.teacher_id;
    let updateResult;

    // Support both assignment_id (new way) and test_type + test_id (old way for backward compatibility)
    if (assignment_id) {
      // New way: Update single assignment by assignment_id
      console.log('Updating single assignment by assignment_id');

      // First verify the teacher owns this assignment
      const assignmentCheck = await sql`
        SELECT id, test_type, test_id, grade, class
        FROM test_assignments
        WHERE id = ${assignment_id} AND teacher_id = ${teacher_id}
      `;

      if (assignmentCheck.length === 0) {
        return {
          statusCode: 404,
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Assignment not found or you do not have permission to modify this assignment' })
        };
      }

      // Update the single assignment
      updateResult = await sql`
        UPDATE test_assignments 
        SET is_active = false, completed_at = NOW(), updated_at = NOW()
        WHERE id = ${assignment_id} AND teacher_id = ${teacher_id}
        RETURNING id, test_type, test_id, grade, class
      `;
    } else if (test_type && test_id) {
      // Old way: Update all assignments for this test (backward compatibility)
      console.log('Updating all assignments for test (backward compatibility)');
      
      updateResult = await sql`
        UPDATE test_assignments 
        SET is_active = false, completed_at = NOW(), updated_at = NOW()
        WHERE test_type = ${test_type} AND test_id = ${test_id} AND teacher_id = ${teacher_id}
        RETURNING id, test_type, test_id, grade, class
      `;
    } else {
      return {
        statusCode: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Either assignment_id or (test_type and test_id) are required' })
      };
    }

    if (updateResult.length === 0) {
      console.log('No assignments found or teacher does not own this assignment/test');
      return {
        statusCode: 404,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'No assignments found or you do not have permission to modify this assignment/test' })
      };
    }

    console.log('Assignment(s) marked as completed successfully:', updateResult);

    return {
      statusCode: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        message: assignment_id 
          ? 'Assignment marked as completed successfully' 
          : 'Test assignments marked as completed successfully',
        assignment_id: assignment_id || null,
        test_id: updateResult[0]?.test_id || test_id || null,
        test_type: updateResult[0]?.test_type || test_type || null,
        assignments_completed: updateResult.length,
        assignments: updateResult
      })
    };

  } catch (error) {
    console.error('Error marking test as completed:', error);
    console.error('Error stack:', error.stack);
    
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
