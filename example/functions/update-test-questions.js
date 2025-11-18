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

    const body = JSON.parse(event.body) || {};
    const { test_type, test_id, questions } = body;
    
    console.log('Received update request:', {
      test_type,
      test_id,
      questions_count: Array.isArray(questions) ? questions.length : 0,
      first_question: Array.isArray(questions) && questions.length > 0 ? questions[0] : null
    });
    
    if (!test_type || !test_id || !Array.isArray(questions)) {
      return {
        statusCode: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'test_type, test_id, and questions array are required' })
      };
    }

    const sql = neon(process.env.NEON_DATABASE_URL);
    const teacher_id = userInfo.teacher_id;

    // Verify teacher owns this test
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

    let testCheck = [];
    let subjectId = null;
    if (test_type === 'multiple_choice') {
      testCheck = await sql`
        SELECT id, subject_id FROM multiple_choice_tests
        WHERE id = ${test_id} AND teacher_id = ${teacher_id}
      `;
      subjectId = testCheck[0]?.subject_id || null;
    } else if (test_type === 'true_false') {
      testCheck = await sql`
        SELECT id, subject_id FROM true_false_tests
        WHERE id = ${test_id} AND teacher_id = ${teacher_id}
      `;
      subjectId = testCheck[0]?.subject_id || null;
    } else if (test_type === 'input') {
      testCheck = await sql`
        SELECT id, subject_id FROM input_tests
        WHERE id = ${test_id} AND teacher_id = ${teacher_id}
      `;
      subjectId = testCheck[0]?.subject_id || null;
    } else if (test_type === 'word_matching') {
      testCheck = await sql`
        SELECT id, subject_id FROM word_matching_tests
        WHERE id = ${test_id} AND teacher_id = ${teacher_id}
      `;
      subjectId = testCheck[0]?.subject_id || null;
    } else if (test_type === 'fill_blanks') {
      testCheck = await sql`
        SELECT id, subject_id FROM fill_blanks_tests
        WHERE id = ${test_id} AND teacher_id = ${teacher_id}
      `;
      subjectId = testCheck[0]?.subject_id || null;
    }

    if (testCheck.length === 0) {
      return {
        statusCode: 404,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Test not found or access denied' })
      };
    }

    // Update questions one by one
    let updatedCount = 0;
    for (const question of questions) {
      // Use primary key 'id' if available, otherwise fall back to question_id
      const questionPrimaryId = question.id;
      const questionId = question.question_id;
      
      if (!questionPrimaryId && !questionId) {
        console.error('Question missing ID:', question);
        continue;
      }

      console.log(`Updating question - Primary ID: ${questionPrimaryId}, Question ID: ${questionId}, Test ID: ${test_id}`);

      try {
        switch (test_type) {
          case 'multiple_choice': {
            let result;
            if (questionPrimaryId) {
              result = await sql`
                UPDATE multiple_choice_test_questions
                SET 
                  question = ${question.question},
                  option_a = ${question.option_a || null},
                  option_b = ${question.option_b || null},
                  option_c = ${question.option_c || null},
                  option_d = ${question.option_d || null},
                  option_e = ${question.option_e || null},
                  option_f = ${question.option_f || null},
                  correct_answer = ${question.correct_answer}
                WHERE id = ${questionPrimaryId} AND teacher_id = ${teacher_id}
              `;
            } else {
              result = await sql`
                UPDATE multiple_choice_test_questions
                SET 
                  question = ${question.question},
                  option_a = ${question.option_a || null},
                  option_b = ${question.option_b || null},
                  option_c = ${question.option_c || null},
                  option_d = ${question.option_d || null},
                  option_e = ${question.option_e || null},
                  option_f = ${question.option_f || null},
                  correct_answer = ${question.correct_answer}
                WHERE question_id = ${questionId} AND test_id = ${test_id} AND teacher_id = ${teacher_id}
              `;
            }

            console.log(`Updated multiple choice question ${questionId}, rows affected:`, result);
            updatedCount++;
            break;
          }
          
          case 'true_false': {
            let result;
            if (questionPrimaryId) {
              result = await sql`
                UPDATE true_false_test_questions
                SET 
                  question = ${question.question},
                  correct_answer = ${question.correct_answer}
                WHERE id = ${questionPrimaryId} AND teacher_id = ${teacher_id}
              `;
            } else {
              result = await sql`
                UPDATE true_false_test_questions
                SET 
                  question = ${question.question},
                  correct_answer = ${question.correct_answer}
                WHERE question_id = ${questionId} AND test_id = ${test_id} AND teacher_id = ${teacher_id}
              `;
            }
            console.log(`Updated true/false question ${questionId}, rows affected:`, result);
            updatedCount++;
            break;
          }
          
          case 'input': {
            // Handle both question and question_text fields
            const questionText = question.question || question.question_text || '';
            const correctAnswersRaw = Array.isArray(question.correct_answers)
              ? question.correct_answers
              : [question.correct_answer || question.correct_answers || ''];
            const correctAnswers = correctAnswersRaw.filter(ans => ans !== undefined && ans !== null);

            let result;
            if (questionPrimaryId) {
              result = await sql`
                UPDATE input_test_questions
                SET 
                  question = ${questionText},
                  correct_answers = ${correctAnswers}
                WHERE id = ${questionPrimaryId} AND teacher_id = ${teacher_id}
              `;
            } else {
              result = await sql`
                UPDATE input_test_questions
                SET 
                  question = ${questionText},
                  correct_answers = ${correctAnswers}
                WHERE question_id = ${questionId} AND test_id = ${test_id} AND teacher_id = ${teacher_id}
              `;
            }
            console.log(`Updated input question ${questionId}, rows affected:`, result);
            updatedCount++;
            break;
          }
          
          case 'word_matching': {
            const leftWord = question.left_word || '';
            const rightWord = question.right_word || '';
            if (questionPrimaryId) {
              const result = await sql`
                UPDATE word_matching_questions
                SET 
                  left_word = ${leftWord},
                  right_word = ${rightWord}
                WHERE id = ${questionPrimaryId} AND teacher_id = ${teacher_id}
              `;
              console.log(`Updated word matching question ${questionId}, rows affected:`, result);
            } else {
              let questionIdValue = Number(question.question_id);
              if (!Number.isFinite(questionIdValue)) {
                const nextIdResult = await sql`
                  SELECT COALESCE(MAX(question_id), 0) + 1 AS next_id
                  FROM word_matching_questions
                  WHERE test_id = ${test_id}
                `;
                questionIdValue = nextIdResult[0]?.next_id || 1;
              }

              const insertResult = await sql`
                INSERT INTO word_matching_questions (
                  test_id,
                  teacher_id,
                  subject_id,
                  question_id,
                  left_word,
                  right_word
                )
                VALUES (
                  ${test_id},
                  ${teacher_id},
                  ${subjectId},
                  ${questionIdValue},
                  ${leftWord},
                  ${rightWord}
                )
                RETURNING id, question_id
              `;
              console.log('Inserted new word matching question:', insertResult[0]);
            }
            updatedCount++;
            break;
          }
          
          case 'fill_blanks': {
            // Validate that required JSONB fields are present
            if (!question.question_json || !question.blank_positions || !question.correct_answers) {
              throw new Error('Fill blanks question must have question_json, blank_positions, and correct_answers');
            }
            
            // Ensure correct_answers is an array
            const correctAnswers = Array.isArray(question.correct_answers) 
              ? question.correct_answers 
              : [question.correct_answers];
            
            // Ensure blank_options is an array (can be empty)
            const blankOptions = Array.isArray(question.blank_options) 
              ? question.blank_options 
              : (question.blank_options ? [question.blank_options] : []);
            
            let result;
            if (questionPrimaryId) {
              result = await sql`
                UPDATE fill_blanks_test_questions
                SET 
                  question_json = ${JSON.stringify(question.question_json)}::jsonb,
                  blank_positions = ${JSON.stringify(question.blank_positions)}::jsonb,
                  blank_options = ${JSON.stringify(blankOptions)}::jsonb,
                  correct_answers = ${JSON.stringify(correctAnswers)}::jsonb,
                  updated_at = NOW()
                WHERE id = ${questionPrimaryId} AND teacher_id = ${teacher_id}
              `;
            } else {
              result = await sql`
                UPDATE fill_blanks_test_questions
                SET 
                  question_json = ${JSON.stringify(question.question_json)}::jsonb,
                  blank_positions = ${JSON.stringify(question.blank_positions)}::jsonb,
                  blank_options = ${JSON.stringify(blankOptions)}::jsonb,
                  correct_answers = ${JSON.stringify(correctAnswers)}::jsonb,
                  updated_at = NOW()
                WHERE question_id = ${questionId} AND test_id = ${test_id} AND teacher_id = ${teacher_id}
              `;
            }
            console.log(`Updated fill blanks question ${questionId}, rows affected:`, result);
            updatedCount++;
            break;
          }
          
          default:
            throw new Error(`Invalid test type: ${test_type}`);
        }
      } catch (questionError) {
        console.error(`Error updating question ${questionId}:`, questionError);
        throw new Error(`Failed to update question ${questionId}: ${questionError.message}`);
      }
    }

    console.log(`Successfully updated ${updatedCount} out of ${questions.length} questions`);

    return {
      statusCode: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        message: 'Questions updated successfully',
        updated_count: updatedCount
      })
    };
  } catch (error) {
    console.error('Error updating questions:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      code: error.code
    });
    return {
      statusCode: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'Internal server error',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    };
  }
};

