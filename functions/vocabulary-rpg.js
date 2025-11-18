const { ok, badRequest, serverError } = require('./response')
const { chatCompletion } = require('./openrouter')
const { getSql, logEvent } = require('./db')
const { nanoid } = require('nanoid')

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return ok()
  if (event.httpMethod !== 'POST') return badRequest('Use POST')

  try {
    const body = JSON.parse(event.body || '{}')
    const { action, sessionId = null, runId, answer } = body
    const sql = getSql()

    if (action === 'generate') {
      const completion = await chatCompletion(
        {
          model: 'anthropic/claude-3-haiku',
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'user',
              content: 'Generate JSON with keys definition (simple ESL level A2) and word (lowercase).',
            },
          ],
        },
        { activitySlug: 'vocabulary-rpg' },
      )

      const content = completion?.choices?.[0]?.message?.content || '{}'
      let card
      try {
        card = typeof content === 'string' ? JSON.parse(content) : content
      } catch {
        card = { definition: 'A person who learns at school.', word: 'student' }
      }

      const id = nanoid()
      await sql`
        INSERT INTO vocabulary_runs (id, session_id, level, definition, expected_word, correct, xp_earned)
        VALUES (${id}, ${sessionId}, 'A2', ${card.definition}, ${card.word}, false, 0)
      `

      await logEvent(sessionId, 'vocabulary-rpg', 'card-generated', { runId: id })

      return ok({ runId: id, card })
    }

    if (action === 'answer') {
      if (!runId || !answer) return badRequest('runId and answer required')
      const rows = await sql`
        SELECT expected_word FROM vocabulary_runs WHERE id = ${runId}
      `
      if (rows.length === 0) return badRequest('Run not found')

      const correct =
        rows[0].expected_word.trim().toLowerCase() === answer.trim().toLowerCase()

      await sql`
        UPDATE vocabulary_runs
        SET user_answer = ${answer}, correct = ${correct}, xp_earned = ${correct ? 10 : 0}
        WHERE id = ${runId}
      `

      await logEvent(sessionId, 'vocabulary-rpg', 'answer-submitted', { runId, correct })

      return ok({ correct, xpEarned: correct ? 10 : 0 })
    }

    return badRequest('Unsupported action')
  } catch (error) {
    console.error('vocabulary-rpg error', error)
    return serverError('Vocabulary RPG failed', error.message)
  }
}

