const { neon } = require('@neondatabase/serverless');
const { validateToken } = require('./validate-token');

exports.handler = async function(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'PUT, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'PUT') {
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

    const { test_type, test_id, is_shuffled, allowed_time } = JSON.parse(event.body) || {};
    
    if (!test_type || !test_id) {
      return {
        statusCode: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'test_type and test_id are required' })
      };
    }

    const sql = neon(process.env.NEON_DATABASE_URL);
    const teacher_id = userInfo.teacher_id;

    // Map test type to table
    const tableMap = {
      'multiple_choice': 'multiple_choice_tests',
      'true_false': 'true_false_tests',
      'input': 'input_tests',
      'word_matching': 'word_matching_tests',
      'fill_blanks': 'fill_blanks_tests'
    };

    const testTable = tableMap[test_type];
    if (!testTable) {
      return {
        statusCode: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid test type' })
      };
    }

    // Verify teacher owns this test
    let testCheck = [];
    if (test_type === 'multiple_choice') {
      testCheck = await sql`
        SELECT id FROM multiple_choice_tests
        WHERE id = ${test_id} AND teacher_id = ${teacher_id}
      `;
    } else if (test_type === 'true_false') {
      testCheck = await sql`
        SELECT id FROM true_false_tests
        WHERE id = ${test_id} AND teacher_id = ${teacher_id}
      `;
    } else if (test_type === 'input') {
      testCheck = await sql`
        SELECT id FROM input_tests
        WHERE id = ${test_id} AND teacher_id = ${teacher_id}
      `;
    } else if (test_type === 'word_matching') {
      testCheck = await sql`
        SELECT id FROM word_matching_tests
        WHERE id = ${test_id} AND teacher_id = ${teacher_id}
      `;
    } else if (test_type === 'fill_blanks') {
      testCheck = await sql`
        SELECT id FROM fill_blanks_tests
        WHERE id = ${test_id} AND teacher_id = ${teacher_id}
      `;
    }

    if (testCheck.length === 0) {
      return {
        statusCode: 404,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Test not found or access denied' })
      };
    }

    const hasShuffle = is_shuffled !== undefined;
    const hasAllowedTime = allowed_time !== undefined;

    const requiresUpdate = (test_type === 'word_matching' || test_type === 'fill_blanks')
      ? hasAllowedTime
      : (hasShuffle || hasAllowedTime);

    if (!requiresUpdate) {
      return {
        statusCode: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'No settings to update' })
      };
    }

    // Update test
    if (test_type === 'multiple_choice') {
      if (hasShuffle && hasAllowedTime) {
        await sql`
          UPDATE multiple_choice_tests
          SET is_shuffled = ${is_shuffled}, allowed_time = ${allowed_time}, updated_at = NOW()
          WHERE id = ${test_id} AND teacher_id = ${teacher_id}
        `;
      } else if (hasShuffle) {
        await sql`
          UPDATE multiple_choice_tests
          SET is_shuffled = ${is_shuffled}, updated_at = NOW()
          WHERE id = ${test_id} AND teacher_id = ${teacher_id}
        `;
      } else {
        await sql`
          UPDATE multiple_choice_tests
          SET allowed_time = ${allowed_time}, updated_at = NOW()
          WHERE id = ${test_id} AND teacher_id = ${teacher_id}
        `;
      }
    } else if (test_type === 'true_false') {
      if (hasShuffle && hasAllowedTime) {
        await sql`
          UPDATE true_false_tests
          SET is_shuffled = ${is_shuffled}, allowed_time = ${allowed_time}, updated_at = NOW()
          WHERE id = ${test_id} AND teacher_id = ${teacher_id}
        `;
      } else if (hasShuffle) {
        await sql`
          UPDATE true_false_tests
          SET is_shuffled = ${is_shuffled}, updated_at = NOW()
          WHERE id = ${test_id} AND teacher_id = ${teacher_id}
        `;
      } else {
        await sql`
          UPDATE true_false_tests
          SET allowed_time = ${allowed_time}, updated_at = NOW()
          WHERE id = ${test_id} AND teacher_id = ${teacher_id}
        `;
      }
    } else if (test_type === 'input') {
      if (hasShuffle && hasAllowedTime) {
        await sql`
          UPDATE input_tests
          SET is_shuffled = ${is_shuffled}, allowed_time = ${allowed_time}, updated_at = NOW()
          WHERE id = ${test_id} AND teacher_id = ${teacher_id}
        `;
      } else if (hasShuffle) {
        await sql`
          UPDATE input_tests
          SET is_shuffled = ${is_shuffled}, updated_at = NOW()
          WHERE id = ${test_id} AND teacher_id = ${teacher_id}
        `;
      } else {
        await sql`
          UPDATE input_tests
          SET allowed_time = ${allowed_time}, updated_at = NOW()
          WHERE id = ${test_id} AND teacher_id = ${teacher_id}
        `;
      }
    } else if (test_type === 'word_matching') {
      if (is_shuffled === true) {
        return {
          statusCode: 400,
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Shuffle setting is not supported for word matching tests' })
        };
      }

      if (hasAllowedTime) {
        await sql`
          UPDATE word_matching_tests
          SET allowed_time = ${allowed_time}, updated_at = NOW()
          WHERE id = ${test_id} AND teacher_id = ${teacher_id}
        `;
      }
    } else if (test_type === 'fill_blanks') {
      if (is_shuffled === true) {
        return {
          statusCode: 400,
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Shuffle setting is not supported for fill in the blanks tests' })
        };
      }

      if (hasAllowedTime) {
        await sql`
          UPDATE fill_blanks_tests
          SET allowed_time = ${allowed_time}, updated_at = NOW()
          WHERE id = ${test_id} AND teacher_id = ${teacher_id}
        `;
      }
    }

    return {
      statusCode: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        message: 'Test settings updated successfully'
      })
    };
  } catch (error) {
    console.error('Error updating test settings:', error);
    return {
      statusCode: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      })
    };
  }
};

