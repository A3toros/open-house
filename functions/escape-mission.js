const { ok, badRequest, serverError } = require('./response')
const { chatCompletion } = require('./openrouter')
const { getSql, logEvent } = require('./db')

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return ok()
  if (event.httpMethod !== 'POST') return badRequest('Use POST')

  try {
    const body = JSON.parse(event.body || '{}')
    const { action, sessionId = null, attempt, puzzleId } = body

    const sql = getSql()

    if (action === 'generate') {
      const completion = await chatCompletion(
        {
          model: 'anthropic/claude-3-haiku',
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'user',
              content:
                'Create JSON with keys riddle, answer, hint. Riddle should be short, clever, suitable for middle school ESL.',
            },
          ],
        },
        { activitySlug: 'escape-mission' },
      )

      const content = completion?.choices?.[0]?.message?.content || '{}'
      let puzzle
      try {
        puzzle = typeof content === 'string' ? JSON.parse(content) : content
      } catch {
        puzzle = {
          riddle: 'I speak without a mouth and hear without ears. Who am I?',
          answer: 'echo',
          hint: 'You can hear it in caves.',
        }
      }

      const inserted = await sql`
        INSERT INTO escape_puzzles (session_id, riddle, answer, attempts, hints_used, solved)
        VALUES (${sessionId}, ${JSON.stringify(puzzle)}, ${puzzle.answer}, 0, 0, false)
        RETURNING id
      `

      await logEvent(sessionId, 'escape-mission', 'riddle-generated', { puzzleId: inserted[0].id })

      return ok({ puzzleId: inserted[0].id, puzzle })
    }

    if (action === 'answer') {
      if (!puzzleId) return badRequest('puzzleId required')
      const rows = await sql`
        SELECT answer, attempts, hints_used FROM escape_puzzles WHERE id = ${puzzleId}
      `
      if (rows.length === 0) return badRequest('Puzzle not found')

      const correct =
        (attempt || '').trim().toLowerCase() === (rows[0].answer || '').trim().toLowerCase()

      await sql`
        UPDATE escape_puzzles
        SET attempts = ${rows[0].attempts + 1}, solved = ${correct}
        WHERE id = ${puzzleId}
      `

      await logEvent(sessionId, 'escape-mission', 'answer-submitted', { puzzleId, correct })

      return ok({ correct })
    }

    if (action === 'hint') {
      if (!puzzleId) return badRequest('puzzleId required')
      await sql`
        UPDATE escape_puzzles SET hints_used = hints_used + 1 WHERE id = ${puzzleId}
      `
      await logEvent(sessionId, 'escape-mission', 'hint-used', { puzzleId })
      return ok({ hint: 'Think about echoes and sound bouncing back.' })
    }

    return badRequest('Unsupported action')
  } catch (error) {
    console.error('escape-mission error', error)
    return serverError('Escape mission failed', error.message)
  }
}

