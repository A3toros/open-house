const { neon } = require('@neondatabase/serverless');
const { validateToken } = require('./validate-token');

exports.handler = async function(event, context) {
  // CORS headers with Authorization support
  const allowedOrigins = [
    'https://mathayomwatsing.netlify.app',
    'http://localhost:8081',
    'http://localhost:3000',
    'http://localhost:19006',
    'http://localhost:19000'
  ];
  
  const origin = event.headers?.origin || event.headers?.Origin;
  const corsOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  
  const headers = {
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
    'Cache-Control': 'public, max-age=300' // Cache for 5 minutes
  };

  // Handle preflight request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Only allow GET method
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, error: 'Method not allowed' })
    };
  }

  try {
    // Validate JWT token and extract user information
    const tokenValidation = validateToken(event);
    
    if (!tokenValidation.success) {
      return {
        statusCode: tokenValidation.statusCode || 401,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          error: tokenValidation.error
        })
      };
    }

    const userInfo = tokenValidation.user;
    
    // Validate role - must be student
    if (userInfo.role !== 'student') {
      return {
        statusCode: 403,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          error: 'Access denied. Student role required.'
        })
      };
    }

    // Extract grade, class, and student_id from JWT token
    const grade = userInfo.grade;
    const className = userInfo.class;
    const student_id = userInfo.student_id;

    // Convert class format if needed (e.g., "1/15" -> 15)
    let classNumber = className;
    if (typeof className === 'string' && className.includes('/')) {
      classNumber = parseInt(className.split('/')[1]);
    } else {
      classNumber = parseInt(className) || className;
    }

    // Convert grade format if needed (e.g., "M1" -> 1)
    let gradeNumber = grade;
    if (typeof grade === 'string' && grade.startsWith('M')) {
      gradeNumber = parseInt(grade.replace('M', ''));
    } else {
      gradeNumber = parseInt(grade) || grade;
    }

    if (!gradeNumber || !classNumber || !student_id) {
      return {
        statusCode: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          error: 'Missing grade, class, or student_id in token'
        })
      };
    }

    const sql = neon(process.env.NEON_DATABASE_URL);

    // Query leaderboard using optimized SQL
    const leaderboard = await sql`
      WITH student_stats AS (
        SELECT 
          v.student_id,
          v.number,
          v.nickname,
          SUM(CASE 
            WHEN v.max_score > 0 AND (v.score::DECIMAL / v.max_score::DECIMAL * 100) >= 10
            THEN FLOOR((v.score::DECIMAL / v.max_score::DECIMAL * 100) / 10)
            ELSE 0
          END) as xp,
          COUNT(*) * 10 as max_xp
        FROM teacher_student_results_view v
        WHERE v.grade = ${gradeNumber}
          AND v.class = ${classNumber}
          AND v.is_completed = true
        GROUP BY v.student_id, v.number, v.nickname
      )
      SELECT 
        u.number,
        u.nickname,
        COALESCE(ss.xp, 0) as xp,
        COALESCE(ss.max_xp, 0) as max_xp,
        CASE 
          WHEN COALESCE(ss.max_xp, 0) > 0 
          THEN COALESCE(ss.xp, 0)::DECIMAL / ss.max_xp::DECIMAL
          ELSE 0
        END as ratio,
        CASE
          WHEN COALESCE(ss.max_xp, 0) > 0 AND (COALESCE(ss.xp, 0)::DECIMAL / ss.max_xp::DECIMAL) >= 0.95 THEN 'Lord of Magic'
          WHEN COALESCE(ss.max_xp, 0) > 0 AND (COALESCE(ss.xp, 0)::DECIMAL / ss.max_xp::DECIMAL) >= 0.9 THEN 'Archimage'
          WHEN COALESCE(ss.max_xp, 0) > 0 AND (COALESCE(ss.xp, 0)::DECIMAL / ss.max_xp::DECIMAL) >= 0.8 THEN 'Grand Sorcerer'
          WHEN COALESCE(ss.max_xp, 0) > 0 AND (COALESCE(ss.xp, 0)::DECIMAL / ss.max_xp::DECIMAL) >= 0.7 THEN 'High Cleric'
          WHEN COALESCE(ss.max_xp, 0) > 0 AND (COALESCE(ss.xp, 0)::DECIMAL / ss.max_xp::DECIMAL) >= 0.6 THEN 'Adept Mage'
          WHEN COALESCE(ss.max_xp, 0) > 0 AND (COALESCE(ss.xp, 0)::DECIMAL / ss.max_xp::DECIMAL) >= 0.5 THEN 'Apprentice Mage'
          WHEN COALESCE(ss.max_xp, 0) > 0 AND (COALESCE(ss.xp, 0)::DECIMAL / ss.max_xp::DECIMAL) >= 0.4 THEN 'Initiate'
          ELSE 'Muggle'
        END as rank_title,
        CASE WHEN u.student_id = ${student_id} THEN true ELSE false END as is_current_student
      FROM users u
      LEFT JOIN student_stats ss ON u.student_id = ss.student_id
      WHERE u.grade = ${gradeNumber} 
        AND u.class = ${classNumber}
        AND u.is_active = true
      ORDER BY 
        CASE 
          WHEN COALESCE(ss.max_xp, 0) > 0 
          THEN COALESCE(ss.xp, 0)::DECIMAL / ss.max_xp::DECIMAL
          ELSE 0
        END DESC,
        u.number ASC
    `;

    return {
      statusCode: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        leaderboard: leaderboard
      })
    };

  } catch (error) {
    console.error('Error fetching class leaderboard:', error);
    
    return {
      statusCode: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        error: 'Failed to fetch class leaderboard',
        message: error.message
      })
    };
  }
};

