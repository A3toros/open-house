const { neon } = require('@neondatabase/serverless');
const { validateToken } = require('./validate-token');

exports.handler = async function(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const tokenValidation = validateToken(event);
    if (!tokenValidation.success) {
      return {
        statusCode: tokenValidation.statusCode || 401,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: tokenValidation.error })
      };
    }

    const userInfo = tokenValidation.user;
    if (userInfo.role !== 'teacher') {
      return {
        statusCode: 403,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Access denied. Teacher role required.' })
      };
    }

    const { assignment_id, test_type, test_id } = JSON.parse(event.body) || {};
    
    const sql = neon(process.env.NEON_DATABASE_URL);
    const teacher_id = userInfo.teacher_id;
    let updateResult;

    // Support both assignment_id (new way) and test_type + test_id (old way for backward compatibility)
    if (assignment_id) {
      // New way: Update single assignment by assignment_id
      console.log('Activating single assignment by assignment_id:', assignment_id);
      
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

      // Activate: make visible to students; also clear any completed_at to re-show in teacher cabinet
      updateResult = await sql`
        UPDATE test_assignments
        SET is_active = true, completed_at = NULL, updated_at = NOW()
        WHERE id = ${assignment_id} AND teacher_id = ${teacher_id}
        RETURNING id, test_type, test_id, grade, class, is_active
      `;
    } else if (test_type && test_id) {
      // Old way: Update all assignments for this test (backward compatibility)
      console.log('Activating all assignments for test (backward compatibility)');
      
      updateResult = await sql`
        UPDATE test_assignments
        SET is_active = true, completed_at = NULL, updated_at = NOW()
        WHERE test_type = ${test_type} AND test_id = ${test_id} AND teacher_id = ${teacher_id}
        RETURNING id, test_type, test_id, grade, class, is_active
      `;
    } else {
      return {
        statusCode: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Either assignment_id or (test_type and test_id) are required' })
      };
    }

    if (updateResult.length === 0) {
      return {
        statusCode: 404,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'No assignments found or you do not have permission to modify this assignment/test' })
      };
    }

    return {
      statusCode: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        message: assignment_id 
          ? 'Assignment activated successfully - students can now see this test' 
          : 'Test activated successfully - students can now see this test',
        assignment_id: assignment_id || null,
        test_id: updateResult[0]?.test_id || test_id || null,
        test_type: updateResult[0]?.test_type || test_type || null,
        assignments_activated: updateResult.length
      })
    };
  } catch (error) {
    console.error('Error activating test:', error);
    return {
      statusCode: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal server error', details: error.message })
    };
  }
};


