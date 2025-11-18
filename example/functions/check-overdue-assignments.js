const { neon } = require('@neondatabase/serverless');
const { validateToken } = require('./validate-token');

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || 'https://mathayomwatsing.netlify.app',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE'
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
    // Validate token
    const result = validateToken(event);
    if (!result.success) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ success: false, message: 'Unauthorized' })
      };
    }

    const sql = neon(process.env.NEON_DATABASE_URL);
    
    console.log('🔍 Checking for overdue assignments...');
    
    // Find assignments that are 7+ days old and still active
    const overdueAssignments = await sql`
      SELECT 
        ta.id,
        ta.test_type,
        ta.test_id,
        ta.teacher_id,
        ta.grade,
        ta.class,
        ta.assigned_at,
        ta.due_date,
        s.subject,
        t.first_name,
        t.last_name
      FROM test_assignments ta
      LEFT JOIN subjects s ON ta.subject_id = s.subject_id
      LEFT JOIN teachers t ON ta.teacher_id = t.teacher_id
      WHERE ta.is_active = true 
      AND ta.assigned_at <= CURRENT_TIMESTAMP - INTERVAL '7 days'
      ORDER BY ta.assigned_at ASC
    `;
    
    console.log(`Found ${overdueAssignments.length} overdue assignments`);
    
    if (overdueAssignments.length === 0) {
      return {
        statusCode: 200,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: true,
          message: 'No overdue assignments found',
          overdue_count: 0,
          updated_assignments: []
        })
      };
    }
    
    // Mark overdue assignments as inactive
    const assignmentIds = overdueAssignments.map(a => a.id);
    
    const updateResult = await sql`
      UPDATE test_assignments 
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = ANY(${assignmentIds})
    `;
    
    console.log(`✅ Marked ${assignmentIds.length} assignments as inactive`);
    
    // Get updated assignment details for response
    const updatedAssignments = await sql`
      SELECT 
        ta.id,
        ta.test_type,
        ta.test_id,
        ta.teacher_id,
        ta.grade,
        ta.class,
        ta.assigned_at,
        ta.due_date,
        ta.is_active,
        s.subject,
        t.first_name,
        t.last_name
      FROM test_assignments ta
      LEFT JOIN subjects s ON ta.subject_id = s.subject_id
      LEFT JOIN teachers t ON ta.teacher_id = t.teacher_id
      WHERE ta.id = ANY(${assignmentIds})
      ORDER BY ta.assigned_at ASC
    `;
    
    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        message: `Marked ${assignmentIds.length} overdue assignments as inactive`,
        overdue_count: overdueAssignments.length,
        updated_assignments: updatedAssignments,
        processed_at: new Date().toISOString()
      })
    };
    
  } catch (error) {
    console.error('Check overdue assignments error:', error);
    
    return {
      statusCode: 500,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        message: 'Failed to check overdue assignments',
        error: error.message
      })
    };
  }
};
