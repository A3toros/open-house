const { neon } = require('@neondatabase/serverless');
const { validateToken } = require('./validate-token');
require('dotenv').config();

// ⚠️ CRITICAL REMINDER: We reference subjects from test_assignments table, NOT from test tables!
// The relationship is: test_assignments.subject_id → subjects.subject_id
// NOT: multiple_choice_tests.subject_id → subjects.subject_id
// ⚠️ CRITICAL REMINDER: The subjects table has a 'subject' column, NOT 'subject_name'!

// ⚠️ CRITICAL REMINDER: We get teacher_id from test_results tables, NOT from test tables!
// The relationship is: 
// - multiple_choice_test_results.multiple_choice_test → multiple_choice_tests.id → multiple_choice_tests.teacher_id
// - input_test_results.input_test → input_tests.id → input_tests.teacher_id  
// - true_false_test_results.true_false_test → true_false_tests.id → true_false_tests.teacher_id

// ⚠️ CRITICAL REMINDER: We get test_name from test_results tables, NOT from test tables!
// The relationship is: 
// - multiple_choice_test_results.multiple_choice_test → multiple_choice_tests.id → multiple_choice_tests.test_name
// - input_test_results.input_test → input_tests.id → input_tests.test_name  
// - true_false_test_results.true_false_test → true_false_tests.id → true_false_tests.test_name

// ⚠️ CRITICAL REMINDER: The expandable columns in test_results tables are:
// - multiple_choice_test_results.multiple_choice_test (expandable)
// - input_test_results.input_test (expandable)  
// - true_false_test_results.true_false_test (expandable)

exports.handler = async function(event, context) {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, message: 'Method not allowed' })
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

    const sql = neon(process.env.NEON_DATABASE_URL);
    
    console.log('🔍 Starting to fetch test assignments...');
    
    // Let's also check what's in the test_assignments table
    try {
      const tableCheck = await sql`SELECT COUNT(*) as count FROM test_assignments`;
      console.log('🔍 Test assignments table count:', tableCheck[0]?.count);
      
      if (tableCheck[0]?.count > 0) {
        // Let's see a sample of what's in the table
        const sampleData = await sql`
          SELECT * FROM test_assignments LIMIT 3
        `;
        console.log('🔍 Sample test assignments data:', sampleData);
        
        // Let's also check the structure of the table
        const tableStructure = await sql`
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns 
          WHERE table_name = 'test_assignments'
          ORDER BY ordinal_position
        `;
        console.log('🔍 Test assignments table structure:', tableStructure);
        
        // Let's also try a very simple query to see if we can get basic data
        const simpleData = await sql`
          SELECT id, test_type, test_id, grade, class FROM test_assignments LIMIT 3
        `;
        console.log('🔍 Simple query result:', simpleData);
      } else {
        console.log('🔍 Test assignments table is empty');
      }
    } catch (error) {
      console.log('⚠️ Could not check test_assignments table:', error.message);
      console.log('⚠️ Error details:', error);
    }
    
    // Parse pagination parameters
    const limit = Math.min(parseInt(event.queryStringParameters?.limit) || 50, 200);
    const cursor = event.queryStringParameters?.cursor;
    
    // Parse cursor (format: "assigned_at,id")
    let cursorAssignedAt, cursorId;
    if (cursor) {
      const [assignedAtStr, idStr] = cursor.split(',');
      cursorAssignedAt = new Date(assignedAtStr);
      cursorId = parseInt(idStr);
    }

    // Use optimized view for test assignments with keyset pagination
    console.log('🔍 Using test_assignments_comprehensive_view...');
    
    let assignments;
    if (cursor) {
      assignments = await sql`
        SELECT * FROM test_assignments_comprehensive_view
        WHERE (assigned_at, assignment_id) < (${cursorAssignedAt}, ${cursorId})
        ORDER BY assigned_at DESC, assignment_id DESC
        LIMIT ${limit}
      `;
    } else {
      assignments = await sql`
        SELECT * FROM test_assignments_comprehensive_view
        ORDER BY assigned_at DESC, assignment_id DESC
        LIMIT ${limit}
      `;
    }
    
    console.log('🔍 Test assignments found:', assignments.length);
    
    if (assignments.length > 0) {
      console.log('🔍 Sample assignment:', assignments[0]);
    }

    // Generate next cursor for pagination
    let nextCursor = null;
    if (assignments.length === limit && assignments.length > 0) {
      const lastAssignment = assignments[assignments.length - 1];
      nextCursor = `${lastAssignment.assigned_at.toISOString()},${lastAssignment.assignment_id}`;
    }

    // Generate ETag for caching
    const dataString = JSON.stringify({ assignments, total: assignments.length });
    const etag = `"${Buffer.from(dataString).toString('base64').slice(0, 16)}"`;

    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
        'ETag': etag,
        'Vary': 'Authorization'
      },
      body: JSON.stringify({
        success: true,
        assignments: assignments,
        total: assignments.length,
        pagination: {
          limit,
          has_more: assignments.length === limit,
          next_cursor: nextCursor
        },
        by_subject: assignments.reduce((acc, a) => {
          const subject = a.subject_name || 'Unknown';
          acc[subject] = (acc[subject] || 0) + 1;
          return acc;
        }, {}),
        by_test_type: assignments.reduce((acc, a) => {
          acc[a.test_type] = (acc[a.test_type] || 0) + 1;
          return acc;
        }, {})
      })
    };
  } catch (error) {
    console.error('Get test assignments error:', error);
    
    return {
      statusCode: 500,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        message: 'Failed to retrieve test assignments',
        error: error.message
      })
    };
  }
};
