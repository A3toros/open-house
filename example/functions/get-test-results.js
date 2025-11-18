const { neon } = require('@neondatabase/serverless');
const { validateToken } = require('./validate-token');
require('dotenv').config();

// ⚠️ CRITICAL REMINDER: We get teacher_id from test_results tables, NOT from test tables!
// The relationship is: 
// - multiple_choice_test_results.multiple_choice_test → multiple_choice_tests.id → multiple_choice_tests.teacher_id
// - input_test_results.input_test → input_tests.id → input_tests.teacher_id  
// - true_false_test_results.true_false_test → true_false_tests.id → true_false_tests.teacher_id

// ⚠️ CRITICAL REMINDER: We get test_name from the _tests tables, NOT from test_results tables!
// The relationship is: 
// - multiple_choice_test_results.test_id → multiple_choice_tests.id → multiple_choice_tests.test_name
// - input_test_results.test_id → input_tests.id → input_tests.test_name  
// - true_false_test_results.test_id → true_false_tests.id → true_false_tests.test_name

// ⚠️ CRITICAL REMINDER: The test_results tables have test_id that references the _tests tables.
// We need to JOIN with the _tests tables to get the actual test names.

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
    
    console.log('🔍 Starting to fetch test results...');
    
    // Let's check what's actually in the test results tables
    try {
      const mcResultsCheck = await sql`SELECT COUNT(*) as count FROM multiple_choice_test_results`;
      const tfResultsCheck = await sql`SELECT COUNT(*) as count FROM true_false_test_results`;
      const inputResultsCheck = await sql`SELECT COUNT(*) as count FROM input_test_results`;
      const matchingResultsCheck = await sql`SELECT COUNT(*) as count FROM matching_type_test_results`;
      const wordMatchingResultsCheck = await sql`SELECT COUNT(*) as count FROM word_matching_test_results`;
      
      console.log('🔍 Test results counts:', {
        multiple_choice: mcResultsCheck[0]?.count,
        true_false: tfResultsCheck[0]?.count,
        input: inputResultsCheck[0]?.count,
        matching_type: matchingResultsCheck[0]?.count,
        word_matching: wordMatchingResultsCheck[0]?.count
      });
      
      if (mcResultsCheck[0]?.count > 0) {
        const sampleMC = await sql`SELECT test_name, test_id FROM multiple_choice_test_results LIMIT 2`;
        console.log('🔍 Sample multiple choice results:', sampleMC);
      }
      
      if (tfResultsCheck[0]?.count > 0) {
        const sampleTF = await sql`SELECT test_name, test_id FROM true_false_test_results LIMIT 2`;
        console.log('🔍 Sample true/false results:', sampleTF);
      }
      
      if (inputResultsCheck[0]?.count > 0) {
        const sampleInput = await sql`SELECT test_name, test_id FROM input_test_results LIMIT 2`;
        console.log('🔍 Sample input results:', sampleInput);
      }
      
      if (matchingResultsCheck[0]?.count > 0) {
        const sampleMatching = await sql`SELECT test_name, test_id FROM matching_type_test_results LIMIT 2`;
        console.log('🔍 Sample matching type results:', sampleMatching);
      }
      
      if (wordMatchingResultsCheck[0]?.count > 0) {
        const sampleWordMatching = await sql`SELECT test_name, test_id FROM word_matching_test_results LIMIT 2`;
        console.log('🔍 Sample word matching results:', sampleWordMatching);
      }
      
    } catch (error) {
      console.log('⚠️ Could not check test results tables:', error.message);
    }
    
    // Use optimized view for all test results
    console.log('🔍 Using all_test_results_view...');
    
    const results = await sql`
      SELECT * FROM all_test_results_view
      ORDER BY submitted_at DESC
    `;
    
    console.log('🔍 Test results found:', results.length);
    if (results.length > 0) {
      console.log('🔍 Sample result:', results[0]);
    }

    // Sort by submission date (newest first)
    results.sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at));

    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        results: results,
        total: results.length,
        average_score: results.length > 0 ? 
          (results.reduce((sum, r) => sum + (r.score || 0), 0) / results.length).toFixed(2) : 0,
        score_distribution: {
          perfect: results.filter(r => r.score === r.max_score).length,
          high: results.filter(r => r.score >= (r.max_score * 0.8)).length,
          medium: results.filter(r => r.score >= (r.max_score * 0.6) && r.score < (r.max_score * 0.8)).length,
          low: results.filter(r => r.score < (r.max_score * 0.6)).length
        }
      })
    };
  } catch (error) {
    console.error('Get test results error:', error);
    
    return {
      statusCode: 500,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        message: 'Failed to retrieve test results',
        error: error.message
      })
    };
  }
};
