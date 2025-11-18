const { ok, badRequest, serverError } = require('./response')
const { chatCompletion } = require('./openrouter')
const { getSql, logEvent } = require('./db')
const { randomUUID } = require('crypto')

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return ok()
  if (event.httpMethod !== 'POST') return badRequest('Use POST')

  try {
    const body = JSON.parse(event.body || '{}')
    const { action, sessionId = null, runId, answer, gameSessionId } = body
    const sql = getSql()

    // Generate a single card
    const generateCard = async () => {
      const completion = await chatCompletion(
        {
          model: 'anthropic/claude-3-haiku',
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'user',
              content: 'Generate JSON with keys definition (simple ESL level A2) and word (lowercase). Make it different from previous words.',
            },
          ],
        },
        { activitySlug: 'vocabulary-rpg', cache: false },
      )

      const content = completion?.choices?.[0]?.message?.content || '{}'
      let card
      try {
        card = typeof content === 'string' ? JSON.parse(content) : content
        if (!card.definition || !card.word) throw new Error('Invalid card format')
      } catch {
        card = { definition: 'A person who learns at school.', word: 'student' }
      }

      const id = randomUUID()
      await sql`
        INSERT INTO vocabulary_runs (id, session_id, level, definition, expected_word, correct, xp_earned)
        VALUES (${id}, ${sessionId}, 'A2', ${card.definition}, ${card.word}, false, 0)
      `

      return { runId: id, card }
    }

    // Generate 20 cards at once
    const generateBatch = async () => {
      const cards = []
      for (let i = 0; i < 20; i++) {
        const cardData = await generateCard()
        cards.push(cardData)
      }
      return cards
    }

    if (action === 'start-game') {
      const cards = await generateBatch()
      const gameSessionId = randomUUID()
      
      await logEvent(sessionId, 'vocabulary-rpg', 'game-started', { gameSessionId, cardsCount: cards.length })

      return ok({ gameSessionId, cards })
    }

    if (action === 'get-next') {
      if (!gameSessionId) return badRequest('gameSessionId required')
      
      // Check if there are unused cards in the session
      const unusedCards = await sql`
        SELECT id, definition, expected_word 
        FROM vocabulary_runs 
        WHERE session_id = ${sessionId} 
          AND user_answer IS NULL 
          AND correct IS NULL
        ORDER BY created_at ASC
        LIMIT 1
      `

      if (unusedCards.length > 0) {
        const card = unusedCards[0]
        return ok({
          runId: card.id,
          card: { definition: card.definition, word: card.expected_word },
        })
      }

      // No unused cards, generate 20 more
      const cards = await generateBatch()
      if (cards.length > 0) {
        return ok({ runId: cards[0].runId, card: cards[0].card })
      }

      // Fallback: generate single card
      const cardData = await generateCard()
      return ok(cardData)
    }

    if (action === 'generate') {
      const cardData = await generateCard()
      await logEvent(sessionId, 'vocabulary-rpg', 'card-generated', { runId: cardData.runId })
      return ok(cardData)
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

