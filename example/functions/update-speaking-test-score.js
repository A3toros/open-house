const { neon } = require('@neondatabase/serverless');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'PUT') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    let parsedBody;
    try {
      parsedBody = JSON.parse(event.body);
    } catch (parseError) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid JSON in request body' })
      };
    }
    
    const { resultId, score } = parsedBody;
    
    if (!resultId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'resultId is required' })
      };
    }
    
    if (score === undefined || score === null) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'score is required' })
      };
    }
    
    const sql = neon(process.env.NEON_DATABASE_URL);
    
    // Get current result to validate max score
    const currentResult = await sql`
      SELECT id, max_score FROM speaking_test_results WHERE id = ${resultId}
    `;
    
    if (currentResult.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Result not found' })
      };
    }
    
    const currentMaxScore = currentResult[0].max_score;
    
    // Validate score input
    if (score < 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Score cannot be negative' })
      };
    }
    
    if (score > currentMaxScore) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: `Score cannot exceed max score of ${currentMaxScore}` })
      };
    }
    
    // Update speaking test result with new score
    await sql`
      UPDATE speaking_test_results 
      SET score = ${score}
      WHERE id = ${resultId}
    `;
    
    // Calculate percentage for response
    const percentage = currentMaxScore > 0 ? Math.round((Number(score) / Number(currentMaxScore)) * 10000) / 100 : 0;
    
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true,
        score: score,
        maxScore: currentMaxScore,
        percentage: percentage
      })
    };
  } catch (error) {
    console.error('Error updating speaking test score:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal server error',
        details: error.message
      })
    };
  }
};
