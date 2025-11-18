const { createClient } = require('@supabase/supabase-js');
const { validateToken } = require('./validate-token');

exports.handler = async function(event, context) {
  console.log('=== upload-speaking-audio function called ===');
  
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
    
    // Check if user is student, teacher, or admin
    if (!['student', 'teacher', 'admin'].includes(userInfo.role)) {
      return {
        statusCode: 403,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Access denied. Student, teacher, or admin role required.' })
      };
    }

    const { 
      audio_blob, // Base64 encoded audio data
      test_id,
      student_id,
      file_name
    } = JSON.parse(event.body);
    
    console.log('Parsed request data:', {
      test_id,
      student_id: student_id || userInfo.student_id,
      file_name: file_name || 'Not provided'
    });

    // Validate input
    if (!audio_blob || !test_id) {
      return {
        statusCode: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          message: 'Missing required fields: audio_blob, test_id'
        })
      };
    }

    // Initialize Supabase client with service key for server-side operations
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    // Generate file path
    const effectiveStudentId = student_id || userInfo.student_id;
    const timestamp = Date.now();
    const fileName = file_name || `${timestamp}-speaking-test.webm`;
    const filePath = `student-uploads/${effectiveStudentId}/${test_id}/${fileName}`;
    
    console.log('Uploading audio to Supabase:', filePath);

    // Convert base64 to buffer
    const audioBuffer = Buffer.from(audio_blob, 'base64');
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('speaking-audio')
      .upload(filePath, audioBuffer, {
        contentType: 'audio/webm',
        cacheControl: '3600',
        upsert: false
      });
      
    if (error) {
      console.error('Supabase upload error:', error);
      throw new Error(`Audio upload failed: ${error.message}`);
    }
    
    console.log('Audio uploaded successfully:', data.path);

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('speaking-audio')
      .getPublicUrl(filePath);
      
    return {
      statusCode: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        message: 'Audio uploaded successfully',
        file_path: data.path,
        public_url: urlData.publicUrl,
        file_name: fileName
      })
    };

  } catch (error) {
    console.error('Upload speaking audio error:', error);
    console.error('Error stack:', error.stack);
    
    return {
      statusCode: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        message: 'Failed to upload speaking audio',
        error: error.message
      })
    };
  }
};
