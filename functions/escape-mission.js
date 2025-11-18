const { ok, badRequest, serverError } = require('./response')
const { chatCompletion } = require('./openrouter')
const { getSql, logEvent } = require('./db')

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return ok()
  if (event.httpMethod !== 'POST') return badRequest('Use POST')

  try {
    const body = JSON.parse(event.body || '{}')
    const { action, sessionId = null, attempt, puzzleId, gameSessionId } = body

    const sql = getSql()

    if (action === 'start-game') {
      // Generate first riddle - simple and bilingual
      const completion = await chatCompletion(
        {
          model: 'anthropic/claude-3-haiku',
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'user',
              content:
                'Create a VERY SIMPLE riddle for ESL students (ages 10-11). Return JSON with keys: riddle_en (English riddle - very easy, 1-2 sentences), riddle_th (Thai translation of the same riddle), answer (one simple English word only - must be easy vocabulary). Make it super easy - think basic vocabulary like: cat, dog, sun, moon, book, pen, water, fire, etc. Example: {"riddle_en": "I am yellow. I am in the sky. What am I?", "riddle_th": "ฉันเป็นสีเหลือง ฉันอยู่ในท้องฟ้า ฉันคืออะไร?", "answer": "sun"}.',
            },
          ],
        },
        { activitySlug: 'escape-mission' },
      )

      const content = completion?.choices?.[0]?.message?.content || '{}'
      let puzzle
      try {
        puzzle = typeof content === 'string' ? JSON.parse(content) : content
        // Ensure we have both English and Thai
        if (!puzzle.riddle_en || !puzzle.riddle_th) {
          throw new Error('Missing bilingual fields')
        }
      } catch {
        puzzle = {
          riddle_en: 'I am yellow. I am in the sky. What am I?',
          riddle_th: 'ฉันเป็นสีเหลือง ฉันอยู่ในท้องฟ้า ฉันคืออะไร?',
          answer: 'sun',
        }
      }

      const inserted = await sql`
        INSERT INTO escape_puzzles (session_id, riddle, answer, attempts, hints_used, solved)
        VALUES (${sessionId}, ${JSON.stringify(puzzle)}, ${puzzle.answer}, 0, 0, false)
        RETURNING id
      `

      // Use session_id as gameSessionId for tracking
      const gameSessionId = sessionId || `game-${Date.now()}`

      await logEvent(sessionId, 'escape-mission', 'game-started', { gameSessionId })

      return ok({
        gameSessionId,
        puzzleId: inserted[0].id,
        puzzle: { riddle_en: puzzle.riddle_en, riddle_th: puzzle.riddle_th, answer: puzzle.answer },
        message: '🎮 Mission started! Solve riddles to earn points!',
      })
    }

    if (action === 'answer') {
      if (!puzzleId || !gameSessionId) return badRequest('puzzleId and gameSessionId required')
      
      const rows = await sql`
        SELECT riddle, answer, attempts, hints_used FROM escape_puzzles WHERE id = ${puzzleId}
      `
      if (rows.length === 0) return badRequest('Puzzle not found')

      const puzzleData = typeof rows[0].riddle === 'string' ? JSON.parse(rows[0].riddle) : rows[0].riddle
      const correctAnswer = rows[0].answer

      // Use AI to evaluate the answer
      const evaluationCompletion = await chatCompletion(
        {
          model: 'anthropic/claude-3-haiku',
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'user',
              content: `A student answered a riddle. Evaluate if their answer is correct.

Riddle (English): ${puzzleData.riddle_en || 'N/A'}
Riddle (Thai): ${puzzleData.riddle_th || 'N/A'}
Correct answer: ${correctAnswer}
Student's answer: "${attempt || ''}"

Return JSON with keys:
- correct (boolean): true if the student's answer is correct (accept variations like "the sun" for "sun", or "a cat" for "cat")
- feedback (string): Short, encouraging feedback in English. If correct, say something positive. If incorrect, gently encourage them to try again.

Be lenient - accept the answer if it contains the correct word or is a reasonable variation.`,
            },
          ],
        },
        { activitySlug: 'escape-mission' },
      )

      const evalContent = evaluationCompletion?.choices?.[0]?.message?.content || '{}'
      let evaluation
      try {
        evaluation = typeof evalContent === 'string' ? JSON.parse(evalContent) : evalContent
      } catch {
        // Fallback to simple string comparison
        const simpleMatch = (attempt || '').trim().toLowerCase() === (correctAnswer || '').trim().toLowerCase()
        evaluation = {
          correct: simpleMatch,
          feedback: simpleMatch ? '✅ Correct! Great job!' : 'Good try! Think again! 💭',
        }
      }

      const correct = evaluation.correct || false

      await sql`
        UPDATE escape_puzzles
        SET attempts = ${rows[0].attempts + 1}, solved = ${correct}
        WHERE id = ${puzzleId}
      `

      let pointsEarned = 0
      let totalPoints = 0
      let nextRiddle = null
      let message = ''

      if (correct) {
        // Calculate points (more points for faster answers)
        const timeBonus = Math.max(1, Math.floor(Math.random() * 5) + 5) // 5-10 points
        pointsEarned = 10 + timeBonus

        // Get current game stats from solved puzzles in this session
        const solvedCount = await sql`
          SELECT COUNT(*) as count FROM escape_puzzles 
          WHERE session_id = ${sessionId} AND solved = true
        `
        const currentPoints = await sql`
          SELECT COALESCE(SUM(CASE WHEN solved = true THEN 10 ELSE 0 END), 0) as total
          FROM escape_puzzles 
          WHERE session_id = ${sessionId}
        `
        totalPoints = (currentPoints[0]?.total || 0) + pointsEarned

        // Get previous riddles to avoid duplicates
        const previousRiddles = await sql`
          SELECT riddle, answer FROM escape_puzzles 
          WHERE session_id = ${sessionId}
          ORDER BY created_at DESC
          LIMIT 5
        `
        
        const previousRiddlesList = previousRiddles.map((r) => {
          const rData = typeof r.riddle === 'string' ? JSON.parse(r.riddle) : r.riddle
          return `- "${rData.riddle_en}" (answer: ${r.answer})`
        }).join('\n')

        // Generate next riddle - simple and bilingual
        const completion = await chatCompletion(
          {
            model: 'anthropic/claude-3-haiku',
            response_format: { type: 'json_object' },
            messages: [
              {
                role: 'user',
                content: `Create a VERY SIMPLE riddle for ESL students (ages 10-11). Return JSON with keys: riddle_en (English riddle - very easy, 1-2 sentences), riddle_th (Thai translation of the same riddle), answer (one simple English word only - must be easy vocabulary). Make it super easy - think basic vocabulary like: cat, dog, sun, moon, book, pen, water, fire, tree, bird, etc.

IMPORTANT: Do NOT use these previous riddles:
${previousRiddlesList || 'None yet'}

Create a completely different riddle with a different answer.`,
              },
            ],
          },
          { activitySlug: 'escape-mission', cache: false },
        )

        const content = completion?.choices?.[0]?.message?.content || '{}'
        let puzzle
        try {
          puzzle = typeof content === 'string' ? JSON.parse(content) : content
          // Ensure we have both English and Thai
          if (!puzzle.riddle_en || !puzzle.riddle_th) {
            throw new Error('Missing bilingual fields')
          }
        } catch {
          puzzle = {
            riddle_en: 'I am white. You drink me. What am I?',
            riddle_th: 'ฉันเป็นสีขาว คุณดื่มฉัน ฉันคืออะไร?',
            answer: 'milk',
          }
        }

        const nextPuzzle = await sql`
          INSERT INTO escape_puzzles (session_id, riddle, answer, attempts, hints_used, solved)
          VALUES (${sessionId}, ${JSON.stringify(puzzle)}, ${puzzle.answer}, 0, 0, false)
          RETURNING id
        `

        nextRiddle = {
          puzzleId: nextPuzzle[0].id,
          riddle_en: puzzle.riddle_en,
          riddle_th: puzzle.riddle_th,
          answer: puzzle.answer,
        }

        const messages = [
          '🎯 Excellent! You got it!',
          '🌟 Perfect answer!',
          '💪 Great job! Keep going!',
          '⭐ Brilliant! You\'re amazing!',
        ]
        message = evaluation.feedback || messages[Math.floor(Math.random() * messages.length)]
      } else {
        // Get current game session points from solved puzzles
        const currentPoints = await sql`
          SELECT COALESCE(SUM(CASE WHEN solved = true THEN 10 ELSE 0 END), 0) as total
          FROM escape_puzzles 
          WHERE session_id = ${sessionId}
        `
        totalPoints = currentPoints[0]?.total || 0

        message = evaluation.feedback || 'Good try! Think again! 💭'
      }

      await logEvent(sessionId, 'escape-mission', 'answer-submitted', { puzzleId, correct, gameSessionId })

      return ok({
        correct,
        points: pointsEarned,
        totalPoints,
        message,
        nextRiddle,
      })
    }

    if (action === 'end-game') {
      // Calculate final stats from solved puzzles
      const stats = await sql`
        SELECT 
          COUNT(*) FILTER (WHERE solved = true) as riddles_solved,
          COALESCE(SUM(CASE WHEN solved = true THEN 10 ELSE 0 END), 0) as points
        FROM escape_puzzles 
        WHERE session_id = ${sessionId}
      `
      
      const riddlesSolved = parseInt(stats[0]?.riddles_solved || 0)
      const points = parseInt(stats[0]?.points || 0)

      await logEvent(sessionId, 'escape-mission', 'game-ended', {
        gameSessionId,
        points,
        riddlesSolved,
      })

      return ok({
        points,
        riddlesSolved,
        message: '🎉 Congratulations! You completed the mission!',
      })
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

