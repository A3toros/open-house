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
    
    const { resultId, score, testType } = parsedBody;
    
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
    
    if (!testType) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'testType is required' })
      };
    }
    
    const sql = neon(process.env.NEON_DATABASE_URL);
    
    // Map test type to table name
    const tableMap = {
      'multiple_choice': 'multiple_choice_test_results',
      'true_false': 'true_false_test_results',
      'input': 'input_test_results',
      'fill_blanks': 'fill_blanks_test_results',
      'matching_type': 'matching_type_test_results',
      'word_matching': 'word_matching_test_results'
    };
    
    const tableName = tableMap[testType];
    if (!tableName) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: `Unsupported test type: ${testType}` })
      };
    }
    
    // Get current result to validate max score - use raw SQL for dynamic table name
    let currentResult;
    if (testType === 'multiple_choice') {
      currentResult = await sql`
        SELECT id, max_score FROM multiple_choice_test_results WHERE id = ${resultId}
      `;
    } else if (testType === 'true_false') {
      currentResult = await sql`
        SELECT id, max_score FROM true_false_test_results WHERE id = ${resultId}
      `;
    } else if (testType === 'input') {
      currentResult = await sql`
        SELECT id, max_score FROM input_test_results WHERE id = ${resultId}
      `;
    } else if (testType === 'fill_blanks') {
      currentResult = await sql`
        SELECT id, max_score FROM fill_blanks_test_results WHERE id = ${resultId}
      `;
    } else if (testType === 'matching_type') {
      currentResult = await sql`
        SELECT id, max_score FROM matching_type_test_results WHERE id = ${resultId}
      `;
    } else if (testType === 'word_matching') {
      currentResult = await sql`
        SELECT id, max_score FROM word_matching_test_results WHERE id = ${resultId}
      `;
    }
    
    if (!currentResult || currentResult.length === 0) {
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
    
    // Update test result with new score - use raw SQL for dynamic table name
    if (testType === 'multiple_choice') {
      await sql`
        UPDATE multiple_choice_test_results
        SET score = ${score}
        WHERE id = ${resultId}
      `;
    } else if (testType === 'true_false') {
      await sql`
        UPDATE true_false_test_results
        SET score = ${score}
        WHERE id = ${resultId}
      `;
    } else if (testType === 'input') {
      await sql`
        UPDATE input_test_results
        SET score = ${score}
        WHERE id = ${resultId}
      `;
    } else if (testType === 'fill_blanks') {
      await sql`
        UPDATE fill_blanks_test_results
        SET score = ${score}
        WHERE id = ${resultId}
      `;
    } else if (testType === 'matching_type') {
      await sql`
        UPDATE matching_type_test_results
        SET score = ${score}
        WHERE id = ${resultId}
      `;
    } else if (testType === 'word_matching') {
      await sql`
        UPDATE word_matching_test_results
        SET score = ${score}
        WHERE id = ${resultId}
      `;
    }
    
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
    console.error('Error updating test score:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal server error',
        details: error.message
      })
    };
  }
};

