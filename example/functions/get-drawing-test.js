const { neon } = require('@neondatabase/serverless');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { testId } = event.queryStringParameters;

    if (!testId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Test ID is required' }) };
    }

    const sql = neon(process.env.NEON_DATABASE_URL);
    
    // Get drawing test data
    const testResult = await sql`
      SELECT 
        dt.id,
        dt.teacher_id,
        dt.subject_id,
        dt.test_name,
        dt.num_questions,
        dt.passing_score,
        dt.created_at,
        t.name as teacher_name,
        s.name as subject_name
      FROM drawing_tests dt
      LEFT JOIN teachers t ON dt.teacher_id = t.teacher_id
      LEFT JOIN subjects s ON dt.subject_id = s.subject_id
      WHERE dt.id = ${testId}
    `;

    if (testResult.length === 0) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Test not found' }) };
    }

    const test = testResult[0];

    // Get drawing questions
    const questionsResult = await sql`
      SELECT question_id, question_json, canvas_width, canvas_height, max_canvas_width, max_canvas_height
      FROM drawing_test_questions
      WHERE test_id = ${testId}
      ORDER BY question_id
    `;

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        data: {
          id: test.id,
          test_id: test.id,
          teacher_id: test.teacher_id,
          subject_id: test.subject_id,
          test_name: test.test_name,
          num_questions: test.num_questions,
          passing_score: test.passing_score,
          created_at: test.created_at,
          teacher_name: test.teacher_name,
          subject: test.subject_name,
          questions: questionsResult
        }
      })
    };
  } catch (error) {
    console.error('Error getting drawing test:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
