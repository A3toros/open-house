const { ok, badRequest, serverError } = require('./response')
const { chatCompletion } = require('./openrouter')
const { getSql, logEvent } = require('./db')
const { transcribeAudio } = require('./assemblyai')

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

exports.handler = async (event, retryCount = 0) => {
  if (event.httpMethod === 'OPTIONS') return ok()
  if (event.httpMethod !== 'POST') return badRequest('Use POST')

  const MAX_RETRIES = 2

  try {
    const body = JSON.parse(event.body || '{}')
    const { thaiCustom, audioBlob, mimeType = 'audio/webm', sessionId = null } = body

    let resolvedCustom = thaiCustom

    if (!resolvedCustom && audioBlob) {
      try {
        const transcription = await transcribeAudio(audioBlob, mimeType)
        resolvedCustom = transcription?.text || ''
      } catch (transcriptionError) {
        console.error('Transcription failed:', transcriptionError)
        // Retry transcription if we haven't exceeded retries
        if (retryCount < MAX_RETRIES) {
          console.log(`Retrying transcription (attempt ${retryCount + 1}/${MAX_RETRIES})...`)
          await sleep(1000 * (retryCount + 1)) // Exponential backoff
          return exports.handler(event, retryCount + 1)
        }
        return badRequest('Failed to transcribe audio. Please try again or type your custom directly.')
      }
    }

    if (!resolvedCustom || resolvedCustom.trim() === '') {
      return badRequest('thaiCustom or audioBlob is required')
    }

    let completion
    try {
      completion = await chatCompletion(
        {
          model: 'anthropic/claude-3-haiku',
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'user',
              content: `A student described this Thai custom: "${resolvedCustom}". Find a SIMILAR tradition from a DIFFERENT country (NOT Thailand). Return JSON with keys: global_custom (name of the tradition from another country), country (country name, must NOT be Thailand), place (specific location/region), what_people_do (description of what people do in this tradition), narration_script (for TTS). IMPORTANT: The country must be different from Thailand.`,
            },
          ],
        },
        { activitySlug: 'culture-translator', retries: 3 },
      )
    } catch (completionError) {
      console.error('Chat completion failed:', completionError)
      // Retry if we haven't exceeded retries
      if (retryCount < MAX_RETRIES) {
        console.log(`Retrying chat completion (attempt ${retryCount + 1}/${MAX_RETRIES})...`)
        await sleep(1000 * (retryCount + 1)) // Exponential backoff
        return exports.handler(event, retryCount + 1)
      }
      throw completionError
    }

    const rawContent = completion?.choices?.[0]?.message?.content || '{}'
    let result
    try {
      result = typeof rawContent === 'string' ? JSON.parse(rawContent) : rawContent
    } catch {
      result = {
        global_custom: 'Dia de los Muertos (Mexico)',
      }
    }

    // Filter out results where country is Thailand (should be a different country)
    if (result.country && result.country.toLowerCase().includes('thailand')) {
      console.log('Filtered out result with Thailand as country, retrying...')
      if (retryCount < MAX_RETRIES) {
        await sleep(1000 * (retryCount + 1))
        return exports.handler(event, retryCount + 1)
      }
      // If all retries exhausted, return a default result
      result = {
        global_custom: 'Dia de los Muertos (Mexico)',
        country: 'Mexico',
        place: 'Throughout Mexico',
        what_people_do: 'Families build altars, visit graves, and celebrate with food and music to honor deceased loved ones.',
        narration_script: 'In Mexico, families celebrate Dia de los Muertos, or Day of the Dead, by creating beautiful altars with photos, flowers, and favorite foods of their loved ones who have passed away.',
      }
    }

    const sql = getSql()
    try {
      await sql`
        INSERT INTO culture_matches (session_id, thai_custom, global_custom, explanation, tts_audio_url)
        VALUES (${sessionId}, ${resolvedCustom}, ${result.global_custom}, ${result.what_people_do || ''}, ${null})
      `
    } catch (dbError) {
      console.error('Database insert failed:', dbError)
      // Don't retry DB errors, just log and continue
    }

    try {
      await logEvent(sessionId, 'culture-translator', 'match-generated', {
        thaiCustom: resolvedCustom,
        globalCustom: result.global_custom,
      })
    } catch (logError) {
      console.error('Log event failed:', logError)
      // Don't retry log errors, just continue
    }

    return ok({ match: result, transcript: resolvedCustom })
  } catch (error) {
    console.error('culture-translator error', error)
    // Retry the entire handler if we haven't exceeded retries
    if (retryCount < MAX_RETRIES) {
      console.log(`Retrying handler (attempt ${retryCount + 1}/${MAX_RETRIES})...`)
      await sleep(1000 * (retryCount + 1)) // Exponential backoff
      return exports.handler(event, retryCount + 1)
    }
    return serverError('Culture translator failed', error.message)
  }
}

