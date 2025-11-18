const { neon } = require('@neondatabase/serverless');

exports.handler = async function(event, context) {
  console.log('=== get-word-matching-test function called ===');
  console.log('Event:', event);
  
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
    // Extract and validate JWT token
    const authHeader = event.headers.authorization || event.headers.Authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Authorization token required' })
      };
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    console.log('JWT token extracted, length:', token.length);

    const { test_id } = event.queryStringParameters || {};
    
    console.log('Requested test ID:', test_id);

    if (!test_id) {
      return {
        statusCode: 400,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          message: 'test_id parameter is required'
        })
      };
    }

    console.log('Connecting to database...');
    const sql = neon(process.env.NEON_DATABASE_URL);
    console.log('Database connection established');
    
    // Get test information
    console.log('Fetching test data...');
    const testResult = await sql`
      SELECT id, teacher_id, subject_id, test_name, num_questions, interaction_type, passing_score, allowed_time, created_at, updated_at
      FROM word_matching_tests
      WHERE id = ${test_id}
    `;
    
    if (testResult.length === 0) {
      return {
        statusCode: 404,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          message: 'Test not found'
        })
      };
    }
    
    const testData = testResult[0];
    console.log('Test data retrieved:', testData);
    
    // Get word pairs
    console.log('Fetching word pairs...');
    const questionsResult = await sql`
      SELECT id, question_id, left_word, right_word
      FROM word_matching_questions
      WHERE test_id = ${test_id}
      ORDER BY question_id
    `;
    
    console.log('Word pairs retrieved:', questionsResult.length);
    
    // Process word pairs for display (randomize order)
    const originalData = questionsResult.map(q => ({
      question_id: q.question_id,
      left_word: q.left_word,
      right_word: q.right_word
    }));
    
    // Randomize display order
    const leftWords = originalData.map(item => item.left_word);
    const rightWords = originalData.map(item => item.right_word);
    
    const shuffledLeft = [...leftWords].sort(() => Math.random() - 0.5);
    const shuffledRight = [...rightWords].sort(() => Math.random() - 0.5);
    
    // Create mapping from display indices to correct pairs
    const correctPairs = {};
    const originalPairs = {};
    
    originalData.forEach((item, originalIndex) => {
      const leftDisplayIndex = shuffledLeft.indexOf(item.left_word);
      const rightDisplayIndex = shuffledRight.indexOf(item.right_word);
      
      correctPairs[leftDisplayIndex] = rightDisplayIndex;
      originalPairs[originalIndex] = { left: leftDisplayIndex, right: rightDisplayIndex };
    });
    
    const responseData = {
      test_id: testData.id,
      teacher_id: testData.teacher_id,
      subject_id: testData.subject_id,
      test_name: testData.test_name,
      num_questions: testData.num_questions,
      interaction_type: testData.interaction_type,
      passing_score: testData.passing_score,
      allowed_time: testData.allowed_time || null,
      created_at: testData.created_at,
      updated_at: testData.updated_at,
      leftWords: shuffledLeft,
      rightWords: shuffledRight,
      correctPairs: correctPairs,
      originalPairs: originalPairs
    };
    
    console.log('Response data prepared successfully');
    
    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        data: responseData
      })
    };
    
  } catch (error) {
    console.error('Get word matching test error:', error);
    console.error('Error stack:', error.stack);
    
    return {
      statusCode: 500,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        message: 'Failed to retrieve word matching test',
        error: error.message
      })
    };
  }
};
