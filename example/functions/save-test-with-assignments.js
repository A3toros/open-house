const { neon } = require('@neondatabase/serverless');
const { validateToken } = require('./validate-token');
const uploadImageHandler = require('./upload-image');

exports.handler = async function(event, context) {
  console.log('=== save-test-with-assignments function called ===');
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
      test_type, 
      test_name, 
      num_questions, 
      num_options, 
      questions, 
      assignments,
      image_url,  // Add image_url for matching tests
      interaction_type,  // Add interaction_type for word matching tests
      passing_score,  // Add passing_score for word matching tests
      allowed_time,   // Optional time limit in seconds
      is_shuffled,    // Optional shuffle flag for MCQ/TF/Input
      test_text,      // Add test_text for fill_blanks tests
      num_blanks,     // Add num_blanks for fill_blanks tests
      separate_type   // Add separate_type for fill_blanks tests
    } = JSON.parse(event.body);
    
    console.log('Parsed request data:', {
      teacher_id,
      test_type,
      test_name,
      num_questions,
      num_options,
      questions_count: questions ? questions.length : 0,
      assignments_count: assignments ? assignments.length : 0,
      image_url: image_url ? 'Present' : 'Not provided',
      interaction_type: interaction_type || 'Not provided',
      passing_score: passing_score || 'Not provided',
      allowed_time: allowed_time || 'Not provided',
      is_shuffled: typeof is_shuffled === 'boolean' ? is_shuffled : 'Not provided',
      test_text: test_text ? 'Present' : 'Not provided',
      num_blanks: num_blanks || 'Not provided',
      separate_type: typeof separate_type === 'boolean' ? separate_type : 'Not provided'
    });

    // Validate input
    if (!teacher_id || !test_type || !test_name || !num_questions || !questions || !assignments) {
      return {
        statusCode: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          message: 'Missing required fields: teacher_id, test_type, test_name, num_questions, questions, assignments'
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
      let testId;
      let testTable;
      
      // Determine test table and create test record
      switch (test_type) {
        case 'multiple_choice':
          testTable = 'multiple_choice_tests';
          if (!num_options) {
            throw new Error('num_options is required for multiple choice tests');
          }
          const mcResult = await sql`
            INSERT INTO multiple_choice_tests (teacher_id, subject_id, test_name, num_questions, num_options, allowed_time, is_shuffled, created_at, updated_at)
            VALUES (${teacher_id}, ${assignments[0].subject_id}, ${test_name}, ${num_questions}, ${num_options}, ${allowed_time || null}, ${is_shuffled === true}, NOW(), NOW())
            RETURNING id
          `;
          testId = mcResult[0].id;
          break;
          
        case 'true_false':
          testTable = 'true_false_tests';
          const tfResult = await sql`
            INSERT INTO true_false_tests (teacher_id, subject_id, test_name, num_questions, allowed_time, is_shuffled, created_at, updated_at)
            VALUES (${teacher_id}, ${assignments[0].subject_id}, ${test_name}, ${num_questions}, ${allowed_time || null}, ${is_shuffled === true}, NOW(), NOW())
            RETURNING id
          `;
          testId = tfResult[0].id;
          break;
          
        case 'input':
          testTable = 'input_tests';
          const inputResult = await sql`
            INSERT INTO input_tests (teacher_id, subject_id, test_name, num_questions, allowed_time, is_shuffled, created_at, updated_at)
            VALUES (${teacher_id}, ${assignments[0].subject_id}, ${test_name}, ${num_questions}, ${allowed_time || null}, ${is_shuffled === true}, NOW(), NOW())
            RETURNING id
          `;
          testId = inputResult[0].id;
          break;
          
        case 'matching_type':
          testTable = 'matching_type_tests';
          
          // Get image URL from the request data
          let finalImageUrl = image_url || '';
          if (finalImageUrl && finalImageUrl.startsWith('data:')) {
            console.log('☁️ Uploading matching test image to Cloudinary...');
            
            // Create a mock event for the upload-image function
            const uploadEvent = {
              httpMethod: 'POST',
              headers: event.headers,
              body: JSON.stringify({
                dataUrl: finalImageUrl,
                folder: 'matching_tests'
              })
            };
            
            try {
              const uploadResult = await uploadImageHandler.handler(uploadEvent, context);
              const uploadData = JSON.parse(uploadResult.body);
              
              if (uploadResult.statusCode === 200 && uploadData.success) {
                finalImageUrl = uploadData.url;
                console.log('☁️ Cloudinary upload successful:', finalImageUrl);
              } else {
                console.error('☁️ Cloudinary upload failed:', uploadData);
                // Keep original data URL as fallback
              }
            } catch (uploadError) {
              console.error('☁️ Cloudinary upload error:', uploadError);
              // Keep original data URL as fallback
            }
          }
          
          const matchingResult = await sql`
            INSERT INTO matching_type_tests (teacher_id, subject_id, test_name, image_url, num_blocks, allowed_time, created_at, updated_at)
            VALUES (${teacher_id}, ${assignments[0].subject_id}, ${test_name}, ${finalImageUrl}, ${num_questions}, ${allowed_time || null}, NOW(), NOW())
            RETURNING id
          `;
          testId = matchingResult[0].id;
          break;
          
        case 'word_matching':
          testTable = 'word_matching_tests';
          
          const wordMatchingResult = await sql`
            INSERT INTO word_matching_tests (teacher_id, subject_id, test_name, num_questions, interaction_type, passing_score, allowed_time, created_at, updated_at)
            VALUES (${teacher_id}, ${assignments[0].subject_id}, ${test_name}, ${num_questions}, ${interaction_type || 'drag'}, ${passing_score || null}, ${allowed_time || null}, NOW(), NOW())
            RETURNING id
          `;
          testId = wordMatchingResult[0].id;
          break;
          
        case 'drawing':
          testTable = 'drawing_tests';
          
          const drawingResult = await sql`
            INSERT INTO drawing_tests (teacher_id, subject_id, test_name, num_questions, passing_score, allowed_time, created_at, updated_at)
            VALUES (${teacher_id}, ${assignments[0].subject_id}, ${test_name}, ${num_questions}, ${passing_score || null}, ${allowed_time || null}, NOW(), NOW())
            RETURNING id
          `;
          testId = drawingResult[0].id;
          break;

        case 'fill_blanks':
          testTable = 'fill_blanks_tests';
          const fbResult = await sql`
            INSERT INTO fill_blanks_tests (teacher_id, subject_id, test_name, test_text, num_questions, num_blanks, separate_type, allowed_time, created_at)
            VALUES (${teacher_id}, ${assignments[0].subject_id}, ${test_name}, ${test_text || ''}, ${num_questions}, ${num_blanks || 0}, ${separate_type === true}, ${allowed_time || null}, NOW())
            RETURNING id
          `;
          testId = fbResult[0].id;
          break;
          
        default:
          throw new Error('Invalid test type');
      }
      
      console.log(`Test inserted successfully with ID: ${testId} in table: ${testTable}`);
      
      // Insert questions based on test type
      console.log('Inserting questions...');
      for (let i = 0; i < questions.length; i++) {
        const question = questions[i];
        
        switch (test_type) {
          case 'multiple_choice':
            // Handle both array and object formats for options
            let options = question.options || [];
            
            // Convert array to object if needed
            if (Array.isArray(options)) {
              const optionsObj = {};
              ['A', 'B', 'C', 'D', 'E', 'F'].forEach((letter, index) => {
                optionsObj[`option_${letter.toLowerCase()}`] = options[index] || null;
              });
              options = optionsObj;
            }
            
            // Auto-fill missing options with underscores based on num_options
            const optionLetters = ['A', 'B', 'C', 'D', 'E', 'F'];
            for (let j = 0; j < num_options; j++) {
              const letter = optionLetters[j];
              const optionKey = `option_${letter.toLowerCase()}`;
              if (!options[optionKey] || options[optionKey].trim() === '') {
                options[optionKey] = '_';
                console.log(`Question ${i + 1}: Auto-filled ${optionKey} with "_"`);
              }
            }
            
            // Ensure we have at least 2 options (option_a and option_b are required)
            if (!options.option_a || !options.option_b) {
              throw new Error(`Question ${i + 1} must have at least option_a and option_b`);
            }
            
            await sql`
              INSERT INTO multiple_choice_test_questions (
                test_id, teacher_id, subject_id, question_id, question, correct_answer,
                option_a, option_b, option_c, option_d, option_e, option_f
              )
              VALUES (
                ${testId}, ${teacher_id}, ${assignments[0].subject_id}, ${question.question_id}, ${question.question}, ${question.correct_answer},
                ${options.option_a || null}, ${options.option_b || null},
                ${options.option_c || null}, ${options.option_d || null},
                ${options.option_e || null}, ${options.option_f || null}
              )
            `;
            break;
            
          case 'true_false':
            await sql`
              INSERT INTO true_false_test_questions (
                test_id, teacher_id, subject_id, question_id, question, correct_answer
              )
              VALUES (
                ${testId}, ${teacher_id}, ${assignments[0].subject_id}, ${question.question_id}, ${question.question}, ${question.correct_answer}
              )
            `;
            break;
            
          case 'input':
            // Handle multiple correct answers for input questions
            const correctAnswers = question.correct_answers || (question.correct_answer ? [question.correct_answer] : []);
            await sql`
              INSERT INTO input_test_questions (
                test_id, teacher_id, subject_id, question_id, question, correct_answers
              )
              VALUES (
                ${testId}, ${teacher_id}, ${assignments[0].subject_id}, ${question.question_id}, ${question.question}, ${correctAnswers}
              )
            `;
            break;
            
          case 'matching_type':
            // Insert the question first
            const questionResult = await sql`
              INSERT INTO matching_type_test_questions (
                test_id, teacher_id, subject_id, question_id, word, block_coordinates, has_arrow
              )
              VALUES (
                ${testId}, ${teacher_id}, ${assignments[0].subject_id}, ${question.question_id}, ${question.word}, ${JSON.stringify(question.block_coordinates)}, ${question.has_arrow || false}
              )
              RETURNING id
            `;
            
            const questionDbId = questionResult[0].id;
            console.log(`Question ${i + 1} inserted with DB ID: ${questionDbId}`);
            
            // Insert arrow if it exists
            if (question.has_arrow && question.arrow) {
              console.log(`Inserting arrow for question ${i + 1}:`, question.arrow);

              // Normalize arrow coordinate keys to snake_case and numbers
              const start_x = Number(question.arrow.start_x ?? question.arrow.startX);
              const start_y = Number(question.arrow.start_y ?? question.arrow.startY);
              const end_x = Number(question.arrow.end_x ?? question.arrow.endX);
              const end_y = Number(question.arrow.end_y ?? question.arrow.endY);

              // Relative and image dimensions if provided by frontend
              const rel_start_x = question.arrow.rel_start_x != null ? Number(question.arrow.rel_start_x) : null;
              const rel_start_y = question.arrow.rel_start_y != null ? Number(question.arrow.rel_start_y) : null;
              const rel_end_x = question.arrow.rel_end_x != null ? Number(question.arrow.rel_end_x) : null;
              const rel_end_y = question.arrow.rel_end_y != null ? Number(question.arrow.rel_end_y) : null;
              const image_width = question.arrow.image_width != null ? Number(question.arrow.image_width) : null;
              const image_height = question.arrow.image_height != null ? Number(question.arrow.image_height) : null;

              // Normalize style to { color, thickness }
              let styleObj = question.arrow.style || {};
              if (styleObj && (styleObj.stroke || styleObj.strokeWidth)) {
                styleObj = {
                  color: styleObj.stroke || '#dc3545',
                  thickness: styleObj.strokeWidth || 3
                };
              }

              await sql`
                INSERT INTO matching_type_test_arrows (
                  question_id, start_x, start_y, end_x, end_y,
                  rel_start_x, rel_start_y, rel_end_x, rel_end_y,
                  image_width, image_height, arrow_style
                )
                VALUES (
                  ${questionDbId}, ${start_x}, ${start_y}, ${end_x}, ${end_y},
                  ${rel_start_x}, ${rel_start_y}, ${rel_end_x}, ${rel_end_y},
                  ${image_width}, ${image_height}, ${JSON.stringify(styleObj)}
                )
              `;
              console.log(`Arrow inserted for question ${i + 1}`);
            }
            break;
            
          case 'word_matching':
            // Insert word pair
            await sql`
              INSERT INTO word_matching_questions (
                test_id, teacher_id, subject_id, question_id, left_word, right_word
              )
              VALUES (
                ${testId}, ${teacher_id}, ${assignments[0].subject_id}, ${question.question_id}, ${question.left_word}, ${question.right_word}
              )
            `;
            console.log(`Word pair ${i + 1} inserted: ${question.left_word} -> ${question.right_word}`);
            break;
            
          case 'drawing':
            // Insert drawing question
            await sql`
              INSERT INTO drawing_test_questions (
                test_id, teacher_id, subject_id, question_id, question_json, 
                canvas_width, canvas_height, max_canvas_width, max_canvas_height
              )
              VALUES (
                ${testId}, ${teacher_id}, ${assignments[0].subject_id}, ${question.question_id}, 
                ${JSON.stringify(question.question_json)}, ${question.canvas_width}, 
                ${question.canvas_height}, ${question.max_canvas_width}, ${question.max_canvas_height}
              )
            `;
            console.log(`Drawing question ${i + 1} inserted`);
            break;

          case 'fill_blanks':
            // Insert fill blanks question
            await sql`
              INSERT INTO fill_blanks_test_questions (
                test_id, teacher_id, subject_id, question_id, question_json, 
                blank_positions, blank_options, correct_answers
              )
              VALUES (
                ${testId}, ${teacher_id}, ${assignments[0].subject_id}, ${question.question_id}, 
                ${JSON.stringify(question.question_json)}, ${JSON.stringify(question.blank_positions || {})}, 
                ${JSON.stringify(question.blank_options || [])}, ${JSON.stringify(question.correct_answers || [])}
              )
            `;
            console.log(`Fill blanks question ${i + 1} inserted`);
            break;
        }
        console.log(`Question ${i + 1} inserted successfully`);
      }
      console.log('All questions inserted successfully');
      
      // Get academic period ID from assignments array (each assignment has its own academic_period_id)
      const currentAcademicPeriodId = assignments[0]?.academic_period_id;
      console.log('Current academic period ID:', currentAcademicPeriodId);

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
            ${test_type}, ${testId}, ${teacher_id}, ${grade}, ${className}, ${subject_id},
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
          message: `Test "${test_name}" created and assigned to ${assignments.length} class(es) successfully`,
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
    console.error('Save test with assignments error:', error);
    console.error('Error stack:', error.stack);
    
    return {
      statusCode: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        message: 'Failed to save test with assignments',
        error: error.message
      })
    };
  }
};
