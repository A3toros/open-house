const { neon } = require('@neondatabase/serverless');
const { validateToken } = require('./validate-token');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers, body: JSON.stringify({ success: false, error: 'Method not allowed' }) };
  }

  try {
    const result = validateToken(event);
    if (!result.success) {
      return { statusCode: result.statusCode || 401, headers, body: JSON.stringify({ success: false, error: result.error }) };
    }
    const user = result.user;
    if (user.role !== 'teacher' && user.role !== 'admin') {
      return { statusCode: 403, headers, body: JSON.stringify({ success: false, error: 'Forbidden' }) };
    }

    const qs = event.queryStringParameters || {};
    const retestId = parseInt(qs.retest_id);
    if (!retestId) {
      return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: 'retest_id is required' }) };
    }

    // Parse pagination parameters
    const limit = Math.min(parseInt(event.queryStringParameters?.limit) || 50, 200);
    const cursor = event.queryStringParameters?.cursor;
    
    // Parse cursor (format: "surname,name,id")
    let cursorSurname, cursorName, cursorId;
    if (cursor) {
      const [surnameStr, nameStr, idStr] = cursor.split(',');
      cursorSurname = surnameStr;
      cursorName = nameStr;
      cursorId = parseInt(idStr);
    }

    const sql = neon(process.env.NEON_DATABASE_URL);

    let rows;
    if (cursor) {
      rows = await sql`
        SELECT rt.*, u.name, u.surname, u.nickname
        FROM retest_targets rt
        JOIN users u ON u.student_id = rt.student_id
        WHERE rt.retest_assignment_id = ${retestId}
          AND (u.surname, u.name, rt.id) > (${cursorSurname}, ${cursorName}, ${cursorId})
        ORDER BY u.surname, u.name, rt.id
        LIMIT ${limit}
      `;
    } else {
      rows = await sql`
        SELECT rt.*, u.name, u.surname, u.nickname
        FROM retest_targets rt
        JOIN users u ON u.student_id = rt.student_id
        WHERE rt.retest_assignment_id = ${retestId}
        ORDER BY u.surname, u.name, rt.id
        LIMIT ${limit}
      `;
    }

    // Generate next cursor for pagination
    let nextCursor = null;
    if (rows.length === limit && rows.length > 0) {
      const lastRow = rows[rows.length - 1];
      nextCursor = `${lastRow.surname},${lastRow.name},${lastRow.id}`;
    }

    return { 
      statusCode: 200, 
      headers: { ...headers, 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ 
        success: true, 
        targets: rows,
        pagination: {
          limit,
          has_more: rows.length === limit,
          next_cursor: nextCursor
        }
      }) 
    };
  } catch (error) {
    return { statusCode: 500, headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ success: false, error: error.message }) };
  }
};


