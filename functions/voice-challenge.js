const { ok, badRequest, serverError } = require('./response')
const { transcribeAudio } = require('./assemblyai')
const { chatCompletion } = require('./openrouter')
const { getSql, logEvent } = require('./db')
const { createDebugger } = require('./debug')

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return ok()
  if (event.httpMethod !== 'POST') return badRequest('Use POST')

  try {
    const body = JSON.parse(event.body || '{}')
    const debug = createDebugger('voice-challenge', {
      requestDebugFlag: Boolean(body.debug),
    })
    const {
      audioBlob,
      mimeType = 'audio/webm',
      visitorId = null,
      sessionId = null,
      prompt = 'Introduce yourself, the things you like, and what you dream of doing.',
    } = body

    if (!audioBlob) return badRequest('audioBlob is required')
    debug.log('Received voice challenge payload', {
      hasAudio: Boolean(audioBlob),
      mimeType,
      visitorId,
      sessionId,
    })

    const transcriptResult = await transcribeAudio(audioBlob, mimeType)
    debug.log('Transcription complete', {
      transcriptLength: transcriptResult?.text?.length || 0,
    })

    const completion = await chatCompletion(
      {
        model: 'anthropic/claude-3-haiku',
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'user',
            content: `You are a friendly bilingual (EN+TH) futurist counselor helping ESL kids imagine exciting FUTURE careers (think AI ethicist, space habitat guide, eco-drone pilot, metaverse teacher, etc.).
Keep responses SHORT, simple, and forward-looking.

Return STRICT JSON with keys:
- compliment: single celebratory word (Great!, Awesome!, Perfect!, Impressive!, Wow!)
- profession_en: probable FUTURE profession in English (max 5 words, must feel futuristic/forward-looking)
- profession_th: same profession translated into Thai
- reason_en: one short sentence (max 18 words) explaining why this future job matches the student
- reason_th: same reasoning in Thai, short and positive

Transcript: """${transcriptResult.text}"""`,
          },
        ],
      },
      { activitySlug: 'voice-challenge', retries: 3 },
    )

    const rawContent = completion?.choices?.[0]?.message?.content || '{}'
    let analysis
    try {
      analysis = typeof rawContent === 'string' ? JSON.parse(rawContent) : rawContent
    } catch {
      analysis = {
        compliment: 'Great!',
        profession_en: 'Eco-drone storyteller',
        profession_th: 'นักเล่าเรื่องด้วยโดรนรักษ์โลก',
        reason_en: 'Your passions sound creative and caring for the future.',
        reason_th: 'งานอดิเรกของคุณสร้างสรรค์และใส่ใจอนาคต',
      }
    }

    const sql = getSql()
    await sql`
      INSERT INTO voice_predictions (
        session_id,
        profession_en,
        profession_th,
        suggested_skills,
        rubric,
        overall_score
      )
      VALUES (
        ${sessionId},
        ${analysis.profession_en || null},
        ${analysis.profession_th || null},
        ${JSON.stringify([])},
        ${JSON.stringify({
          compliment: analysis.compliment || 'Great!',
          reason_en: analysis.reason_en || null,
          reason_th: analysis.reason_th || null,
        })},
        ${null}
      )
    `

    await logEvent(sessionId, 'voice-challenge', 'analysis', {
      visitorId,
      profession_en: analysis.profession_en,
      profession_th: analysis.profession_th,
    })

    debug.log('Analysis ready', {
      profession_en: analysis.profession_en,
      profession_th: analysis.profession_th,
    })

    return ok(
      debug.attachPayload({
        transcript: transcriptResult.text,
        analysis,
      }),
    )
  } catch (error) {
    console.error('voice-challenge error', error)
    return serverError('Voice challenge failed', error.message)
  }
}

