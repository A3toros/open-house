type TranscriptResponse = {
  text: string
  confidence?: number
  words?: Array<{ text: string; confidence: number; start: number; end: number }>
}

const ASSEMBLYAI_PROXY = '/api/transcribe' // placeholder endpoint

export const assemblyAiService = {
  async transcribeAudio(base64Audio: string, mime: string): Promise<TranscriptResponse> {
    const response = await fetch(ASSEMBLYAI_PROXY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ audioBlob: base64Audio, mime }),
    })

    if (!response.ok) {
      throw new Error('AssemblyAI transcription failed')
    }

    return response.json()
  },
}

