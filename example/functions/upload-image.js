const crypto = require('crypto');
const { validateToken } = require('./validate-token');

exports.handler = async function(event, context) {
  console.log('=== upload-image function called ===');
  console.log('Event method:', event.httpMethod);
  console.log('Event body length:', event.body ? event.body.length : 0);
  console.log('Event body preview:', event.body ? event.body.substring(0, 100) + '...' : 'null');
  
  const headers = {
    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || 'https://mathayomwatsing.netlify.app',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400' // Cache preflight for 24 hours
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ success: false, message: 'Method not allowed' }) };
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
    
    // Check if user is admin or teacher
    if (userInfo.role !== 'admin' && userInfo.role !== 'teacher') {
      return {
        statusCode: 403,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Access denied. Admin or teacher role required.' })
      };
    }

    console.log('Checking environment variables...');
    const cloudinaryUrl = process.env.CLOUDINARY_URL;
    console.log('CLOUDINARY_URL exists:', !!cloudinaryUrl);
    console.log('CLOUDINARY_URL length:', cloudinaryUrl ? cloudinaryUrl.length : 0);
    
    if (!cloudinaryUrl) {
      console.error('CLOUDINARY_URL not configured');
      return { statusCode: 500, headers, body: JSON.stringify({ success: false, message: 'CLOUDINARY_URL not configured' }) };
    }

    // CLOUDINARY_URL format: cloudinary://<api_key>:<api_secret>@<cloud_name>
    console.log('Parsing CLOUDINARY_URL...');
    const match = cloudinaryUrl.match(/^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/);
    if (!match) {
      console.error('Invalid CLOUDINARY_URL format:', cloudinaryUrl);
      return { statusCode: 500, headers, body: JSON.stringify({ success: false, message: 'Invalid CLOUDINARY_URL format' }) };
    }
    const apiKey = match[1];
    const apiSecret = match[2];
    const cloudName = match[3];
    
    console.log('Cloudinary config parsed:', {
      cloudName,
      apiKey: apiKey ? '***' + apiKey.slice(-4) : 'undefined',
      apiSecret: apiSecret ? '***' + apiSecret.slice(-4) : 'undefined'
    });

    console.log('Parsing request body...');
    let requestBody;
    try {
      requestBody = JSON.parse(event.body || '{}');
      console.log('Request body parsed successfully');
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          message: 'Invalid JSON in request body',
          error: parseError.message
        })
      };
    }

    const { dataUrl, folder = 'matching_tests' } = requestBody;
    console.log('Request data extracted:', {
      hasDataUrl: !!dataUrl,
      dataUrlType: typeof dataUrl,
      dataUrlLength: dataUrl ? dataUrl.length : 0,
      dataUrlStartsWithData: dataUrl ? dataUrl.startsWith('data:') : false,
      folder
    });
    
    if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:')) {
      console.error('Invalid dataUrl:', { dataUrl: !!dataUrl, type: typeof dataUrl, startsWithData: dataUrl ? dataUrl.startsWith('data:') : false });
      return { statusCode: 400, headers, body: JSON.stringify({ success: false, message: 'Invalid payload: dataUrl required' }) };
    }

    // Prepare upload params
    console.log('Preparing upload parameters...');
    const timestamp = Math.floor(Date.now() / 1000);
    // Signature: sha1 of the params (alphabetical) joined with & and api_secret appended
    // We'll sign folder and timestamp
    const toSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
    const signature = crypto.createHash('sha1').update(toSign).digest('hex');
    
    console.log('Upload parameters prepared:', {
      timestamp,
      folder,
      signature: signature ? '***' + signature.slice(-8) : 'undefined'
    });

    const form = new URLSearchParams();
    form.append('file', dataUrl);
    form.append('api_key', apiKey);
    form.append('timestamp', String(timestamp));
    form.append('folder', folder);
    form.append('signature', signature);

    const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
    console.log('Uploading to Cloudinary endpoint:', endpoint);
    
    const uploadRes = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString()
    });
    
    console.log('Cloudinary response status:', uploadRes.status);
    console.log('Cloudinary response ok:', uploadRes.ok);

    // Parse response
    let uploadJson;
    try {
      uploadJson = await uploadRes.json();
      console.log('Cloudinary response parsed successfully');
    } catch (parseError) {
      console.error('Failed to parse Cloudinary response:', parseError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          success: false,
          message: 'Failed to process upload response. Please try again.',
          error: 'Response parsing failed'
        })
      };
    }
    
    // Check for upload errors
    if (!uploadRes.ok) {
      console.error('Cloudinary upload failed:', uploadJson);
      return { statusCode: 500, headers, body: JSON.stringify({ success: false, message: 'Cloudinary upload failed', details: uploadJson }) };
    }

    // Success response
    const imageUrl = uploadJson.secure_url || uploadJson.url;
    console.log('Upload successful. Image URL:', imageUrl);
    
    return {
      statusCode: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        url: imageUrl,
        public_id: uploadJson.public_id,
        width: uploadJson.width,
        height: uploadJson.height,
        format: uploadJson.format,
        size: uploadJson.bytes
      })
    };
  } catch (err) {
    console.error('Unexpected error in upload-image function:', err);
    console.error('Error stack:', err.stack);
    
    return { 
      statusCode: 500, 
      headers, 
      body: JSON.stringify({ 
        success: false, 
        message: 'An unexpected error occurred. Please try again.',
        error: err.message,
        type: err.constructor.name
      }) 
    };
  }
};


