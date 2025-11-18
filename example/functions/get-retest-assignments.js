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
    const teacherId = (user.role === 'admin' ? (event.queryStringParameters?.teacher_id || user.teacher_id) : user.teacher_id);
    if (!teacherId) {
      return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: 'teacher_id required' }) };
    }

    const sql = neon(process.env.NEON_DATABASE_URL);

    // Parse pagination parameters
    const limit = Math.min(parseInt(event.queryStringParameters?.limit) || 50, 200);
    const cursor = event.queryStringParameters?.cursor;
    
    // Parse cursor (format: "created_at,id")
    let cursorCreatedAt, cursorId;
    if (cursor) {
      const [createdAtStr, idStr] = cursor.split(',');
      cursorCreatedAt = new Date(createdAtStr);
      cursorId = parseInt(idStr);
    }

    let rows;
    if (cursor) {
      rows = await sql`
        SELECT ra.*, 
               COALESCE(SUM(CASE WHEN rt.status = 'PENDING' THEN 1 ELSE 0 END),0) AS pending_count,
               COALESCE(SUM(CASE WHEN rt.status = 'IN_PROGRESS' THEN 1 ELSE 0 END),0) AS in_progress_count,
               COALESCE(SUM(CASE WHEN rt.status = 'PASSED' THEN 1 ELSE 0 END),0) AS passed_count,
               COALESCE(SUM(CASE WHEN rt.status = 'FAILED' THEN 1 ELSE 0 END),0) AS failed_count,
               COALESCE(SUM(CASE WHEN rt.status = 'EXPIRED' THEN 1 ELSE 0 END),0) AS expired_count
        FROM retest_assignments ra
        LEFT JOIN retest_targets rt ON rt.retest_assignment_id = ra.id
        WHERE ra.teacher_id = ${teacherId}
          AND (ra.created_at, ra.id) < (${cursorCreatedAt}, ${cursorId})
        GROUP BY ra.id
        ORDER BY ra.created_at DESC, ra.id DESC
        LIMIT ${limit}
      `;
    } else {
      rows = await sql`
        SELECT ra.*, 
               COALESCE(SUM(CASE WHEN rt.status = 'PENDING' THEN 1 ELSE 0 END),0) AS pending_count,
               COALESCE(SUM(CASE WHEN rt.status = 'IN_PROGRESS' THEN 1 ELSE 0 END),0) AS in_progress_count,
               COALESCE(SUM(CASE WHEN rt.status = 'PASSED' THEN 1 ELSE 0 END),0) AS passed_count,
               COALESCE(SUM(CASE WHEN rt.status = 'FAILED' THEN 1 ELSE 0 END),0) AS failed_count,
               COALESCE(SUM(CASE WHEN rt.status = 'EXPIRED' THEN 1 ELSE 0 END),0) AS expired_count
        FROM retest_assignments ra
        LEFT JOIN retest_targets rt ON rt.retest_assignment_id = ra.id
        WHERE ra.teacher_id = ${teacherId}
        GROUP BY ra.id
        ORDER BY ra.created_at DESC, ra.id DESC
        LIMIT ${limit}
      `;
    }

    // Generate next cursor for pagination
    let nextCursor = null;
    if (rows.length === limit && rows.length > 0) {
      const lastRow = rows[rows.length - 1];
      nextCursor = `${lastRow.created_at.toISOString()},${lastRow.id}`;
    }

    // Generate ETag for caching
    const dataString = JSON.stringify({ retests: rows });
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
        retests: rows,
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


