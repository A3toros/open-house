const axios = require('axios')

const ASSEMBLYAI_API_KEY = process.env.ASSEMBLYAI_API_KEY
const ASSEMBLYAI_BASE_URL = process.env.ASSEMBLYAI_BASE_URL || 'https://api.assemblyai.com'

if (!ASSEMBLYAI_API_KEY) {
  console.warn('ASSEMBLYAI_API_KEY is not set. AssemblyAI calls will fail.')
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function transcribeAudio(base64Audio, mimeType = 'audio/webm', { retries = 3 } = {}) {
  if (!ASSEMBLYAI_API_KEY) {
    throw new Error('ASSEMBLYAI_API_KEY environment variable is required')
  }

  const audioBuffer = Buffer.from(base64Audio, 'base64')
  const uploadResponse = await axios({
    method: 'post',
    url: `${ASSEMBLYAI_BASE_URL}/v2/upload`,
    headers: {
      Authorization: ASSEMBLYAI_API_KEY,
      'Content-Type': 'application/octet-stream',
      'Content-Length': audioBuffer.length,
    },
    data: audioBuffer,
    maxBodyLength: Infinity,
  })

  const { upload_url: uploadUrl } = uploadResponse.data

  const transcriptResponse = await axios.post(
    `${ASSEMBLYAI_BASE_URL}/v2/transcript`,
    {
      audio_url: uploadUrl,
      language_detection: true,
      speaker_labels: false,
      auto_highlights: false,
      punctuate: true,
      format_text: true,
    },
    {
      headers: {
        Authorization: ASSEMBLYAI_API_KEY,
        'Content-Type': 'application/json',
      },
    },
  )

  const transcriptId = transcriptResponse.data.id

  for (let attempt = 0; attempt < 40; attempt += 1) {
    const statusResponse = await axios.get(`${ASSEMBLYAI_BASE_URL}/v2/transcript/${transcriptId}`, {
      headers: {
        Authorization: ASSEMBLYAI_API_KEY,
      },
    })

    if (statusResponse.data.status === 'completed') {
      return {
        text: statusResponse.data.text,
        words: statusResponse.data.words,
        confidence: statusResponse.data.confidence,
      }
    }

    if (statusResponse.data.status === 'error') {
      throw new Error(statusResponse.data.error || 'AssemblyAI transcription failed')
    }

    await sleep(1500)
  }

  if (retries > 0) {
    await sleep(1000)
    return transcribeAudio(base64Audio, mimeType, { retries: retries - 1 })
  }

  throw new Error('AssemblyAI transcription timeout')
}

module.exports = {
  transcribeAudio,
}

