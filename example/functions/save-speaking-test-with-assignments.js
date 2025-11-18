const { neon } = require('@neondatabase/serverless');
const { validateToken } = require('./validate-token');

exports.handler = async function(event, context) {
  console.log('=== save-speaking-test-with-assignments function called ===');
  console.log('Event body:', event.body);
  
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, message: 'Method not allowed' })
    };
  }

  try {
    // Validate token
    const tokenValidation = validateToken(event);
    if (!tokenValidation.success) {
      return {
        statusCode: tokenValidation.statusCode || 401,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: tokenValidation.error })
      };
    }

    const userInfo = tokenValidation.user;
    
    // Check if user is teacher
    if (userInfo.role !== 'teacher') {
      return {
        statusCode: 403,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Access denied. Teacher role required.' })
      };
    }

    const { 
      teacher_id, 
      test_name, 
      questions,
      assignments,
      // Speaking test specific fields
      time_limit,
      min_duration,
      max_duration,
      max_attempts,
      min_words,
      passing_score,
      allowed_time
    } = JSON.parse(event.body);
    
    console.log('Parsed request data:', {
      teacher_id,
      test_name,
      questions_count: questions ? questions.length : 0,
      assignments_count: assignments ? assignments.length : 0,
      time_limit: time_limit || 'Not provided',
      min_duration: min_duration || 'Not provided',
      max_duration: max_duration || 'Not provided',
      max_attempts: max_attempts || 'Not provided',
      min_words: min_words || 'Not provided',
      passing_score: passing_score || 'Not provided',
      allowed_time: allowed_time || 'Not provided'
    });

    // Validate input
    if (!teacher_id || !test_name || !questions || !assignments) {
      return {
        statusCode: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          message: 'Missing required fields: teacher_id, test_name, questions, assignments'
        })
      };
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      return {
        statusCode: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          message: 'Questions array is required and cannot be empty'
        })
      };
    }

    if (!Array.isArray(assignments) || assignments.length === 0) {
      return {
        statusCode: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          message: 'Assignments array is required and cannot be empty'
        })
      };
    }

    console.log('Connecting to database...');
    const sql = neon(process.env.NEON_DATABASE_URL);
    console.log('Database connection established');
    
    // Begin transaction
    console.log('Starting database transaction...');
    await sql`BEGIN`;
    console.log('Transaction started successfully');
    
    try {
      // Insert speaking test
      console.log('Inserting speaking test...');
      const speakingTestResult = await sql`
        INSERT INTO speaking_tests (
          teacher_id, subject_id, test_name, num_questions, time_limit, min_duration, max_duration, 
          max_attempts, min_words, passing_score, allowed_time, created_at, updated_at
        )
        VALUES (
          ${teacher_id}, ${assignments[0].subject_id}, ${test_name}, ${questions.length},
          ${time_limit || 300}, ${min_duration || 30}, ${max_duration || 600},
          ${max_attempts || 3}, ${min_words || 50}, ${passing_score || null}, 
          ${allowed_time || null}, NOW(), NOW()
        )
        RETURNING id
      `;
      
      const testId = speakingTestResult[0].id;
      console.log(`Speaking test inserted successfully with ID: ${testId}`);
      
      // Insert speaking test questions
      console.log('Inserting speaking test questions...');
      for (let i = 0; i < questions.length; i++) {
        const question = questions[i];
        
        await sql`
          INSERT INTO speaking_test_questions (
            test_id, question_number, prompt, expected_duration, difficulty_level, created_at
          )
          VALUES (
            ${testId}, ${i + 1}, ${question.prompt}, 
            ${question.expected_duration || null}, 
            ${question.difficulty_level || 'medium'}, 
            NOW()
          )
        `;
        console.log(`Speaking question ${i + 1} inserted: ${question.prompt.substring(0, 50)}...`);
      }
      console.log('All speaking questions inserted successfully');
      
      // Insert assignments
      console.log('Inserting assignments...');
      for (const assignment of assignments) {
        const { grade, class: className, subject_id, due_date, academic_period_id } = assignment;
        
        // Set default due date to 7 days from now if not provided
        const defaultDueDate = new Date();
        defaultDueDate.setDate(defaultDueDate.getDate() + 7);
        const finalDueDate = due_date || defaultDueDate;
        
        await sql`
          INSERT INTO test_assignments (
            test_type, test_id, teacher_id, grade, class, subject_id, 
            academic_period_id, assigned_at, due_date, is_active, created_at, updated_at
          )
          VALUES (
            'speaking', ${testId}, ${teacher_id}, ${grade}, ${className}, ${subject_id},
            ${academic_period_id}, CURRENT_TIMESTAMP, ${finalDueDate}, false, NOW(), NOW()
          )
        `;
        console.log(`Assignment created for ${grade}/${className} with subject ${subject_id}, academic_period: ${academic_period_id}, due: ${finalDueDate}`);
      }
      console.log('All assignments inserted successfully');
      
      // Commit transaction
      console.log('Committing transaction...');
      await sql`COMMIT`;
      console.log('Transaction committed successfully');
      
      return {
        statusCode: 200,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          message: `Speaking test "${test_name}" created and assigned to ${assignments.length} class(es) successfully`,
          test_id: testId,
          assignments_count: assignments.length
        })
      };
      
    } catch (error) {
      // Rollback transaction on error
      console.error('Error during database operations, rolling back transaction...');
      console.error('Error details:', error);
      await sql`ROLLBACK`;
      console.log('Transaction rolled back');
      throw error;
    }
    
  } catch (error) {
    console.error('Save speaking test with assignments error:', error);
    console.error('Error stack:', error.stack);
    
    return {
      statusCode: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        message: 'Failed to save speaking test with assignments',
        error: error.message
      })
    };
  }
};
