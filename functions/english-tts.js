const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args))
const { ok, badRequest, serverError } = require('./response')

const OPENAI_API_KEY = process.env.OPENAI_API_KEY

// OpenAI TTS API for English
// Model options: 'tts-1' (faster) or 'tts-1-hd' (higher quality)
const TTS_MODEL = 'tts-1'

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return ok()
  if (event.httpMethod !== 'POST') return badRequest('Use POST')

  try {
    const { text, voice = 'nova' } = JSON.parse(event.body || '{}')

    if (!text || !text.trim()) {
      return badRequest('Text is required')
    }

    // Voice options: alloy, echo, fable, onyx, nova, shimmer
    // For English, 'nova' (caring, joyful, young female voice)
    const selectedVoice = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'].includes(voice) 
      ? voice 
      : 'nova'

    if (!OPENAI_API_KEY) {
      return serverError('OPENAI_API_KEY is required for TTS')
    }

    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: TTS_MODEL,
        input: text,
        voice: selectedVoice,
        response_format: 'mp3',
        speed: 1.0,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('OpenAI TTS API error:', errorText)
      throw new Error(`TTS API error: ${errorText}`)
    }

    const audioBuffer = await response.arrayBuffer()
    const base64Audio = Buffer.from(audioBuffer).toString('base64')

    return ok({
      audioUrl: `data:audio/mp3;base64,${base64Audio}`,
      success: true,
      voice: selectedVoice,
      model: TTS_MODEL,
    })
  } catch (error) {
    console.error('TTS function error:', error)
    return serverError('TTS failed', error.message)
  }
}

