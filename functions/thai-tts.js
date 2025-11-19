const axios = require('axios')

// Using Google Cloud Text-to-Speech API (free tier available)
// Alternative: Can use iApp Technology Thai TTS API or other services
const GOOGLE_TTS_API_KEY = process.env.GOOGLE_TTS_API_KEY || process.env.GOOGLE_CLOUD_API_KEY

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: '',
    }
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'Method not allowed' }),
    }
  }

  try {
    const { text, language = 'th' } = JSON.parse(event.body || '{}')

    if (!text || !text.trim()) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Text is required' }),
      }
    }

    // Option 1: Use Google Cloud TTS (requires API key)
    if (GOOGLE_TTS_API_KEY) {
      try {
        const response = await axios.post(
          `https://texttospeech.googleapis.com/v1/text:synthesize?key=${GOOGLE_TTS_API_KEY}`,
          {
            input: { text },
            voice: {
              languageCode: language === 'th' ? 'th-TH' : 'en-US',
              name: language === 'th' ? 'th-TH-Standard-A' : 'en-US-Wavenet-F',
              ssmlGender: 'FEMALE',
            },
            audioConfig: {
              audioEncoding: 'MP3',
              speakingRate: 0.9,
              pitch: 0,
            },
          },
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        )

        return {
          statusCode: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            audioUrl: `data:audio/mp3;base64,${response.data.audioContent}`,
            success: true,
          }),
        }
      } catch (googleError) {
        console.error('Google TTS error:', googleError.message)
        // Fall through to alternative method
      }
    }

    // Option 2: Use iApp Technology Thai TTS API (if API key is available)
    const IAPP_API_KEY = process.env.IAPP_TTS_API_KEY
    if (IAPP_API_KEY && language === 'th') {
      try {
        const response = await axios.get(
          `https://api.iapp.co.th/thai-tts-kaitom/tts`,
          {
            params: {
              text: text,
              language: 'TH',
            },
            headers: {
              apikey: IAPP_API_KEY,
            },
            responseType: 'arraybuffer',
          }
        )

        const base64Audio = Buffer.from(response.data).toString('base64')
        return {
          statusCode: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            audioUrl: `data:audio/mp3;base64,${base64Audio}`,
            success: true,
          }),
        }
      } catch (iappError) {
        console.error('iApp TTS error:', iappError.message)
      }
    }

    // Fallback: Return error if no TTS service is configured
    return {
      statusCode: 503,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        error: 'Thai TTS service not configured. Please set GOOGLE_TTS_API_KEY or IAPP_TTS_API_KEY environment variable.',
        success: false,
      }),
    }
  } catch (error) {
    console.error('TTS function error:', error)
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        error: error.message || 'Internal server error',
        success: false,
      }),
    }
  }
}

