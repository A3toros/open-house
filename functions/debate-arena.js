const { ok, badRequest, serverError } = require('./response')
const { chatCompletion } = require('./openrouter')
const { getSql, logEvent } = require('./db')
const { transcribeAudio } = require('./assemblyai')

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return ok()
  if (event.httpMethod !== 'POST') return badRequest('Use POST')

  try {
    const body = JSON.parse(event.body || '{}')
    const { transcript, audioBlob, mimeType = 'audio/webm', prompt, sessionId = null } = body

    if (!prompt) return badRequest('prompt is required')

    let resolvedTranscript = transcript

    if (!resolvedTranscript && audioBlob) {
      const transcription = await transcribeAudio(audioBlob, mimeType)
      resolvedTranscript = transcription?.text
    }

    if (!resolvedTranscript) return badRequest('transcript or audioBlob is required')

    const completion = await chatCompletion(
      {
        model: 'anthropic/claude-3-haiku',
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'user',
            content: `Evaluate this debate response for prompt "${prompt}". Transcript: "${resolvedTranscript}".
Return JSON with keys:
- rebuttal (one sentence counter-argument, polite and encouraging).`,
          },
        ],
      },
      { activitySlug: 'debate-arena' },
    )

    const rawContent = completion?.choices?.[0]?.message?.content || '{}'
    let result
    try {
      result = typeof rawContent === 'string' ? JSON.parse(rawContent) : rawContent
    } catch {
      result = {
        feedback: rawContent,
        scores: { clarity: 70, evidence: 60, creativity: 65, tone: 80 },
        rebuttal: 'Consider adding more concrete examples to support your position.',
      }
    }

    const sql = getSql()
    await sql`
      INSERT INTO debate_sessions (session_id, prompt, student_summary, ai_feedback, rebuttal_audio_url, scores)
      VALUES (${sessionId}, ${prompt}, ${resolvedTranscript}, ${JSON.stringify(result)}, ${null}, ${JSON.stringify(result.scores || {})})
    `

    await logEvent(sessionId, 'debate-arena', 'analysis', { prompt })

    return ok({ result, transcript: resolvedTranscript })
  } catch (error) {
    console.error('debate-arena error', error)
    return serverError('Debate analysis failed', error.message)
  }
}

