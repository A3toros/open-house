const { ok, serverError } = require('./response')
const { getSql } = require('./db')

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return ok()

  try {
    const sql = getSql()
    let tips = []

    try {
      tips = await sql`
        SELECT title, description
        FROM parent_corner
        ORDER BY sort_order NULLS LAST, created_at DESC
        LIMIT 6
      `
    } catch {
      tips = []
    }

    if (tips.length === 0) {
      tips = [
        {
          title: 'AI Literacy',
          description: 'Ask kids to explain AI answers in their own words to build healthy skepticism.',
        },
        {
          title: 'English at Home',
          description: 'Use short daily prompts (“What was fun today?”) and record them with AI feedback tools.',
        },
        {
          title: 'Future Careers',
          description: 'Discuss how English unlocks robotics, design, green tech, and creative jobs.',
        },
      ]
    }

    return ok({ tips })
  } catch (error) {
    console.error('parent-corner error', error)
    return serverError('Failed to load parent content', error.message)
  }
}

