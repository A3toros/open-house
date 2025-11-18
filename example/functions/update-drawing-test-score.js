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
    
    const { resultId, score, maxScore } = parsedBody;
    
    if (!resultId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'resultId is required' })
      };
    }
    
    const sql = neon(process.env.NEON_DATABASE_URL);
    
    // Get current values and context (student, test, retest)
    const currentResult = await sql`
      SELECT id, test_id, student_id, score, max_score, retest_assignment_id, attempt_number
      FROM drawing_test_results WHERE id = ${resultId}
    `;
    
    if (currentResult.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Result not found' })
      };
    }
    
    const row = currentResult[0];
    const currentScore = row.score;
    const currentMaxScore = row.max_score;
    
    // Use provided values or keep current ones
    const newScore = score !== undefined ? score : currentScore;
    const newMaxScore = maxScore !== undefined ? maxScore : currentMaxScore;
    
    // Validate score input - only check for negative values
    if (newScore < 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Score cannot be negative' })
      };
    }
    
    // Update drawing test result with new values
    await sql`
      UPDATE drawing_test_results 
      SET score = ${newScore}, 
          max_score = ${newMaxScore}
      WHERE id = ${resultId}
    `;

    // Compute percentage if possible
    if (newMaxScore && newMaxScore > 0) {
      const percentage = Math.round((Number(newScore) / Number(newMaxScore)) * 10000) / 100;

      // Only write to test_attempts for retests (not for original tests)
      if (row.retest_assignment_id) {
        const effectiveParentTestId = row.test_id; // parent or original; we don't persist parent separately
        const attemptNumber = row.attempt_number || 1;
        
        // For retests, create separate records for each attempt
        await sql`
          INSERT INTO test_attempts (student_id, test_id, attempt_number, score, max_score, percentage, submitted_at, is_completed)
          VALUES (${row.student_id}, ${effectiveParentTestId}, ${attemptNumber}, ${newScore}, ${newMaxScore}, ${percentage}, NOW(), ${true})
        `;
      }
      // For original tests, we don't write to test_attempts - only to drawing_test_results

      // If part of a retest, set target status according to assignment threshold
      if (row.retest_assignment_id) {
        // Get threshold
        const ra = await sql`SELECT passing_threshold FROM retest_assignments WHERE id = ${row.retest_assignment_id}`;
        const threshold = (ra && ra.length > 0 && ra[0].passing_threshold != null) ? Number(ra[0].passing_threshold) : 50;
        const passed = percentage >= threshold;
        await sql`
          UPDATE retest_targets
          SET status = ${passed ? 'PASSED' : 'FAILED'}, last_attempt_at = NOW()
          WHERE retest_assignment_id = ${row.retest_assignment_id} AND student_id = ${row.student_id}
        `;
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true,
        score: newScore,
        maxScore: newMaxScore
      })
    };
  } catch (error) {
    console.error('Error updating drawing test score:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal server error',
        details: error.message
      })
    };
  }
};
