const { ok, badRequest, serverError } = require('./response')
const { chatCompletion } = require('./openrouter')
const { getSql, logEvent } = require('./db')
const { transcribeAudio } = require('./assemblyai')

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return ok()
  if (event.httpMethod !== 'POST') return badRequest('Use POST')

  try {
    const body = JSON.parse(event.body || '{}')
    const { action } = body

    // Handle transcription
    if (action === 'transcribe') {
      const { audioBlob } = body
      if (!audioBlob) {
        return badRequest('audioBlob is required')
      }
      const transcript = await transcribeAudio(audioBlob, 'audio/webm')
      return ok({ transcript: transcript?.text || '' })
    }

    // Handle ending change
    if (action === 'change-ending') {
      const { story, mood, sessionId = null } = body
      if (!story || !mood) {
        return badRequest('story and mood are required')
      }

      try {
        const completion = await chatCompletion(
          {
            model: 'anthropic/claude-3-haiku',
            messages: [
              {
                role: 'user',
                content: `Rewrite the entire story with a ${mood} ending. Keep the same characters and plot, but change ONLY the ending to be ${mood}. IMPORTANT: Keep the story exactly 6-8 sentences total (same length as original). Do not include any diversity, equity, inclusion (DEI), or political content. Keep stories neutral and focused purely on storytelling for kids. Return the complete rewritten story:\n\n${story}`,
              },
            ],
          },
          { activitySlug: 'story-forge', retries: 3 },
        )

        const newStory = completion?.choices?.[0]?.message?.content?.trim() || story
        await logEvent(sessionId, 'story-forge', 'ending-changed', { mood })

        return ok({ story: newStory })
      } catch (error) {
        console.error('story-forge change-ending error', error)
        return serverError('Failed to change ending', error.message)
      }
    }

    const {
      genre = 'fantasy',
      traits = 'kind + curious',
      plot = 'world in danger',
      starter = 'Once upon a time...',
      sessionId = null,
    } = body

    const completion = await chatCompletion(
      {
        model: 'anthropic/claude-3-haiku',
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'user',
            content: `You are a creative partner for middle-school writers. Return JSON with keys: story (6-8 sentences string), grammarTips (array), writingTips (array of writing improvement suggestions). Details: Genre=${genre}, Traits=${traits}, Plot=${plot}, Starter="${starter}". IMPORTANT: Do not include any diversity, equity, inclusion (DEI), or political content. Keep stories neutral, fun, and focused purely on storytelling for kids.`,
          },
        ],
      },
      { activitySlug: 'story-forge', retries: 3 },
    )

    const rawContent = completion?.choices?.[0]?.message?.content || '{}'
    let storyPayload
    try {
      storyPayload = typeof rawContent === 'string' ? JSON.parse(rawContent) : rawContent
    } catch {
      storyPayload = { story: rawContent, grammarTips: [], writingTips: [] }
    }

    const sql = getSql()
    await sql`
      INSERT INTO stories (session_id, genre, traits, plot, base_story, ending_variations, grammar_tips)
      VALUES (
        ${sessionId},
        ${genre},
        ${traits},
        ${plot},
        ${storyPayload.story || ''},
        ${JSON.stringify([])},
        ${JSON.stringify(storyPayload.grammarTips || [])}
      )
    `

    await logEvent(sessionId, 'story-forge', 'story-generated', { genre, traits, plot })

    return ok({
      story: storyPayload.story,
      grammarTips: storyPayload.grammarTips || [],
      writingTips: storyPayload.writingTips || [],
    })
  } catch (error) {
    console.error('story-forge error', error)
    return serverError('Story Forge failed', error.message)
  }
}

