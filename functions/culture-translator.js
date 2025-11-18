const { ok, badRequest, serverError } = require('./response')
const { chatCompletion } = require('./openrouter')
const { getSql, logEvent } = require('./db')
const { transcribeAudio } = require('./assemblyai')

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return ok()
  if (event.httpMethod !== 'POST') return badRequest('Use POST')

  try {
    const body = JSON.parse(event.body || '{}')
    const { thaiCustom, audioBlob, mimeType = 'audio/webm', sessionId = null } = body

    let resolvedCustom = thaiCustom

    if (!resolvedCustom && audioBlob) {
      const transcription = await transcribeAudio(audioBlob, mimeType)
      resolvedCustom = transcription?.text
    }

    if (!resolvedCustom) return badRequest('thaiCustom or audioBlob is required')

    const completion = await chatCompletion(
      {
        model: 'anthropic/claude-3-haiku',
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'user',
            content: `A student described this Thai custom: "${resolvedCustom}". Return JSON with keys: global_custom, explanation, cultural_takeaway, narration_script.`,
          },
        ],
      },
      { activitySlug: 'culture-translator', retries: 3 },
    )

    const rawContent = completion?.choices?.[0]?.message?.content || '{}'
    let result
    try {
      result = typeof rawContent === 'string' ? JSON.parse(rawContent) : rawContent
    } catch {
      result = {
        global_custom: 'Dia de los Muertos (Mexico)',
        explanation: rawContent,
        cultural_takeaway: 'Families honor ancestors with joyful rituals.',
      }
    }

    const sql = getSql()
    await sql`
      INSERT INTO culture_matches (session_id, thai_custom, global_custom, explanation, tts_audio_url)
      VALUES (${sessionId}, ${thaiCustom}, ${result.global_custom}, ${result.explanation}, ${null})
    `

    await logEvent(sessionId, 'culture-translator', 'match-generated', {
        thaiCustom: resolvedCustom,
      globalCustom: result.global_custom,
    })

    return ok({ match: result, transcript: resolvedCustom })
  } catch (error) {
    console.error('culture-translator error', error)
    return serverError('Culture translator failed', error.message)
  }
}

