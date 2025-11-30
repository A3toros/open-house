const { ok, badRequest, serverError } = require('./response')
const { getSql, logEvent } = require('./db')
const { randomUUID } = require('crypto')

// Normal level vocabulary list (~150 easy words for 10-year-old ESL kids)
const VOCABULARY_LIST_NORMAL = [
  { word: 'brave', definition: 'Not afraid; the opposite of scared.' },
  { word: 'quick', definition: 'Fast; the opposite of slow.' },
  { word: 'share', definition: 'To give part of something to someone.' },
  { word: 'calm', definition: 'Quiet and relaxed; the opposite of nervous.' },
  { word: 'polite', definition: 'Nice in the way you speak to people; similar to kind.' },
  { word: 'hungry', definition: 'Needing food; the opposite of full.' },
  { word: 'patient', definition: 'Able to wait without getting angry.' },
  { word: 'lazy', definition: 'Not wanting to work; the opposite of hard-working.' },
  { word: 'protect', definition: 'To keep someone or something safe.' },
  { word: 'repair', definition: 'To fix something broken.' },
  { word: 'smart', definition: 'Very clever; good at learning.' },
  { word: 'recycle', definition: 'Use old things to make new things.' },
  { word: 'respect', definition: 'To treat someone well; the opposite of disrespect.' },
  { word: 'happy', definition: 'Feeling good and smiling.' },
  { word: 'normal', definition: 'Regular; usual.' },
  { word: 'famous', definition: 'Known by many people.' },
  { word: 'new', definition: 'Just made; not old.' },
  { word: 'tasty', definition: 'Very good to eat; delicious.' },
  { word: 'erase', definition: 'To remove writing.' },
  { word: 'careful', definition: 'Paying attention; not careless.' },
  { word: 'dangerous', definition: 'Not safe; can hurt you.' },
  { word: 'explain', definition: 'To tell someone how something works.' },
  { word: 'trust', definition: 'To believe someone.' },
  { word: 'strange', definition: 'Not normal; weird.' },
  { word: 'busy', definition: 'Doing many things; not free.' },
  { word: 'scared', definition: 'Feeling afraid.' },
  { word: 'empty', definition: 'With nothing inside.' },
  { word: 'bright', definition: 'Full of light; very light.' },
  { word: 'lucky', definition: 'Having good things happen.' },
  { word: 'unlucky', definition: 'Having bad things happen.' },
  { word: 'warm', definition: 'A little hot; not cold.' },
  { word: 'proud', definition: 'Happy about something you did.' },
  { word: 'curious', definition: 'Wanting to know more.' },
  { word: 'huge', definition: 'Very big.' },
  { word: 'friend', definition: 'A person you like and play with.' },
  { word: 'artist', definition: 'A person who makes pictures or art.' },
  { word: 'teacher', definition: 'A person who helps you learn.' },
  { word: 'winner', definition: 'A person who comes first in a competition.' },
  { word: 'loser', definition: 'A person who does not win in a competition.' },
  { word: 'hero', definition: 'A person who does brave things.' },
  { word: 'bad', definition: 'Not good, opposite to good.' },
  { word: 'captain', definition: 'The leader of a ship.' },
  { word: 'airport', definition: 'A place where planes take off and land.' },
  { word: 'library', definition: 'A place where you borrow books.' },
  { word: 'bakery', definition: 'A place where bread and cakes are made.' },
  { word: 'hospital', definition: 'A place where sick people get help.' },
  { word: 'farm', definition: 'A place where animals and crops are raised.' },
  { word: 'school', definition: 'A place where students learn.' },
  { word: 'planet', definition: 'A large round object in space.' },
  { word: 'good', definition: 'Nice or excellent; opposite of bad.' },
  { word: 'sad', definition: 'Feeling unhappy; opposite of happy.' },
  { word: 'tired', definition: 'Needing rest or sleep.' },
  { word: 'clean', definition: 'Not dirty; opposite of dirty.' },
  { word: 'dirty', definition: 'Not clean; has dirt on it.' },
  { word: 'wet', definition: 'Covered with water; opposite of dry.' },
  { word: 'dry', definition: 'Not wet; opposite of wet.' },
  { word: 'hot', definition: 'Very warm; opposite of cold.' },
  { word: 'cold', definition: 'Not warm; opposite of hot.' },
  { word: 'soft', definition: 'Easy to press; opposite of hard.' },
  { word: 'hard', definition: 'Difficult to break; opposite of soft.' },
  { word: 'heavy', definition: 'Weighs a lot; opposite of light.' },
  { word: 'light', definition: 'Not heavy; easy to carry.' },
  { word: 'slow', definition: 'Not fast; opposite of quick.' },
  { word: 'big', definition: 'Large in size; opposite of small.' },
  { word: 'small', definition: 'Little in size; opposite of big.' },
  { word: 'high', definition: 'Far above the ground; opposite of low.' },
  { word: 'low', definition: 'Close to the ground; opposite of high.' },
  { word: 'round', definition: 'Shaped like a circle or ball.' },
  { word: 'square', definition: 'A fugure shaped with four equal sides.' },
  { word: 'sweet', definition: 'Tastes like sugar; opposite of sour.' },
  { word: 'sour', definition: 'Tastes like lemon; opposite of sweet.' },
  { word: 'bitter', definition: 'Tastes bad, like coffee without sugar.' },
  { word: 'strong', definition: 'Very powerful; opposite of weak.' },
  { word: 'weak', definition: 'Not strong; opposite of strong.' },
  { word: 'rich', definition: 'Has a lot of money; opposite of poor.' },
  { word: 'poor', definition: 'Has little money; opposite of rich.' },
  { word: 'young', definition: 'Not old; a child or teenager.' },
  { word: 'sick', definition: 'Not healthy; feeling ill.' },
  { word: 'fat', definition: 'Has a lot of weight; opposite of thin.' },
  { word: 'beautiful', definition: 'Very pretty; nice to look at' },
  { word: 'pretty', definition: 'Nice to look at; similar to beautiful, kawaii.' },
  { word: 'handsome', definition: 'Good-looking; usually for boys or men.' },
  { word: 'funny', definition: 'Makes you laugh; humorous.' },
  { word: 'serious', definition: 'Not funny; very important.' },
  { word: 'kind', definition: 'Nice and helpful to others.' },
  { word: 'shy', definition: 'Afraid to talk to new people.' },
  { word: 'quiet', definition: 'Makes little noise; opposite of loud.' },
  { word: 'noisy', definition: 'Makes a lot of sound; opposite of quiet.' },
  { word: 'lazy', definition: 'Does not want to work or move.' },
  { word: 'late', definition: 'Arrives after the expected time.' },
  { word: 'early', definition: 'Arrives before the expected time.' },
  { word: 'simple', definition: 'Easy to understand; not complicated.' },
  { word: 'rare', definition: 'Not common; hard to find.' },
  { word: 'open', definition: 'Not closed.' },
  { word: 'closed', definition: 'Not open; shut.' },
  { word: 'friendly', definition: 'Nice and kind.' },
  { word: 'warm', definition: 'A little hot; not cold.' },
  { word: 'close', definition: 'Near; not far away.' },
  { word: 'safe', definition: 'Not dangerous.' },
  { word: 'dangerous', definition: 'Not safe; can hurt you.' }
]

// Difficult level vocabulary list (~100 challenging words for advanced ESL students)
const VOCABULARY_LIST_DIFFICULT = [
  { word: 'brilliant', definition: 'Exceptionally intelligent or talented; extremely bright.' },
  { word: 'moody', definition: 'Having unpredictable changes in mood or temperament.' },
  { word: 'ancient', definition: 'Belonging to a very distant past; extremely old.' },
  { word: 'sophisticated', definition: 'Complex, refined, or advanced in character.' },
  { word: 'predict', definition: 'To forecast or foretell a future event or outcome.' },
  { word: 'destroy', definition: 'To completely ruin or demolish something.' },
  { word: 'frightened', definition: 'Feeling extreme fear or terror.' },
  { word: 'neighbour', definition: 'A person living near or next to another.' },
  { word: 'inventor', definition: 'A person who creates or devises new things or methods.' },
  { word: 'villain', definition: 'A character in a story who opposes the hero; an evil person.' },
  { word: 'theoretical', definition: 'Based on theory rather than practical experience.' },
  { word: 'analytical', definition: 'Relating to or using analysis or logical reasoning.' },
  { word: 'intuitive', definition: 'Based on feeling or instinct rather than conscious reasoning.' },
  { word: 'systematic', definition: 'Done according to a fixed plan or system; methodical.' },
  { word: 'punctual', definition: 'Happening or doing something at the agreed or proper time.' },
  { word: 'competent', definition: 'Having the necessary ability, knowledge, or skill.' },
  { word: 'professional', definition: 'Relating to or connected with a profession; highly skilled.' },
  { word: 'expert', definition: 'A person who has comprehensive knowledge or skill in a particular area.' },
  { word: 'complex', definition: 'Consisting of many different and connected parts; complicated.' },
  { word: 'straightforward', definition: 'Uncomplicated and easy to understand; direct.' },
  { word: 'subtle', definition: 'So delicate or precise as to be difficult to detect or analyze.' },
  { word: 'explicit', definition: 'Stated clearly and in detail, leaving no room for confusion.' },
  { word: 'implicit', definition: 'Suggested though not directly expressed; implied.' },
  { word: 'figurative', definition: 'Using words in a non-literal way; metaphorical.' },
  { word: 'abstract', definition: 'Existing in thought or as an idea but not having a physical existence.' },
  { word: 'vague', definition: 'Unclear or imprecise in meaning or expression.' },
  { word: 'precise', definition: 'Marked by exactness and accuracy of expression or detail.' },
  { word: 'comprehensive', definition: 'Complete and including everything; thorough.' },
  { word: 'partial', definition: 'Existing only in part; incomplete.' },
  { word: 'fraction', definition: 'A numerical quantity that is not a whole number.' },
  { word: 'heterogeneous', definition: 'Diverse in character or content; varied.' },
  { word: 'homogeneous', definition: 'Of the same kind; uniform in structure or composition.' },
  { word: 'standardized', definition: 'Made to conform to a standard; uniform.' },
  { word: 'structured', definition: 'Having a well-defined organization or arrangement.' },
  { word: 'immaculate', definition: 'Perfectly clean, neat, or tidy; flawless.' },
  { word: 'pristine', definition: 'In its original condition; unspoiled.' },
  { word: 'contaminated', definition: 'Made impure by exposure to or addition of a poisonous substance.' },
  { word: 'preserved', definition: 'Maintained in its original or existing state; protected.' },
  { word: 'cultivated', definition: 'Refined and well-educated; developed through care.' },
  { word: 'nurtured', definition: 'Cared for and encouraged the growth or development of.' },
  { word: 'fostered', definition: 'Encouraged or promoted the development of something.' },
  { word: 'mature', definition: 'Fully developed physically; fully grown.' },
  { word: 'juvenile', definition: 'Relating to young people; childish or immature.' },
  { word: 'superior', definition: 'Higher in rank, status, or quality; better than others.' },
  { word: 'inferior', definition: 'Lower in rank, status, or quality; worse than others.' },
  { word: 'optimal', definition: 'Best or most favorable; ideal.' },
  { word: 'suboptimal', definition: 'Below the best possible standard or quality.' },
  { word: 'flawless', definition: 'Without any imperfections or defects; perfect.' },
  { word: 'defective', definition: 'Imperfect or faulty; not working correctly.' },
  { word: 'legitimate', definition: 'Conforming to the law or to rules; valid.' },
  { word: 'illegitimate', definition: 'Not authorized by the law; not valid.' },
  { word: 'compliant', definition: 'Inclined to agree with others or obey rules; conforming.' },
  { word: 'non-compliant', definition: 'Failing to act in accordance with rules or standards.' },
  { word: 'atypical', definition: 'Not representative of a type, group, or class; unusual.' },
  { word: 'extraordinary', definition: 'Very unusual or remarkable; exceptional.' },
  { word: 'inconsistent', definition: 'Not staying the same throughout; having contradictions.' },
  { word: 'variable', definition: 'Not consistent or having a fixed pattern; liable to change.' },
  { word: 'resilient', definition: 'Able to recover quickly from difficulties; tough.' },
  { word: 'enduring', definition: 'Lasting over a long period of time; persistent.' },
  { word: 'finite', definition: 'Having limits or bounds; not infinite.' },
  { word: 'infinite', definition: 'Limitless or endless in space, extent, or size.' },
  { word: 'restricted', definition: 'Limited in extent, number, or scope; confined.' },
  { word: 'unrestricted', definition: 'Not limited or restricted; free from limitations.' },
  { word: 'attainable', definition: 'Able to be achieved or accomplished; reachable.' },
  { word: 'unattainable', definition: 'Not able to be achieved or accomplished; unreachable.' },
  { word: 'feasible', definition: 'Possible to do easily or conveniently; practicable.' },
  { word: 'infeasible', definition: 'Not possible to do easily; impracticable.' },
  { word: 'impractical', definition: 'Not adapted for use or action; unrealistic.' },
  { word: 'unrealistic', definition: 'Not having a sensible understanding of what can be achieved.' },
  { word: 'hospitable', definition: 'Friendly and welcoming to guests or strangers.' },
  { word: 'inhospitable', definition: 'Unfriendly and unwelcoming; harsh environment.' },
  { word: 'cordial', definition: 'Warm and friendly; polite.' },
  { word: 'intimate', definition: 'Closely acquainted; familiar; private.' },
  { word: 'adjacent', definition: 'Next to or adjoining something else; neighboring.' },
  { word: 'proximate', definition: 'Very near or close in space, time, or relationship.' },
  { word: 'gradual', definition: 'Taking place or progressing slowly or by degrees.' },
  { word: 'abrupt', definition: 'Sudden and unexpected; sharp or steep.' },
  { word: 'progressive', definition: 'Happening or developing gradually or in stages.' },
  { word: 'regressive', definition: 'Returning to a former or less developed state.' },
  { word: 'primitive', definition: 'Relating to an early stage in development; basic.' },
  { word: 'refined', definition: 'Elegant and cultured in appearance, manner, or taste.' },
  { word: 'coarse', definition: 'Rough or harsh in texture; lacking refinement.' },
  { word: 'delicate', definition: 'Very fine in texture or structure; easily broken.' },
  { word: 'robust', definition: 'Strong and healthy; vigorous; sturdy.' },
  { word: 'perishable', definition: 'Likely to decay or go bad quickly; not durable.' },
  { word: 'hazardous', definition: 'Risky; dangerous; involving danger.' },
  { word: 'beneficial', definition: 'Favorable or advantageous; resulting in good.' },
  { word: 'detrimental', definition: 'Tending to cause harm; damaging.' },
  { word: 'advantageous', definition: 'Involving or creating favorable circumstances.' },
  { word: 'disadvantageous', definition: 'Involving or creating unfavorable circumstances.' },
  { word: 'constructive', definition: 'Having a positive effect; helpful.' },
  { word: 'destructive', definition: 'Causing great and irreparable damage or harm.' },
  { word: 'counterproductive', definition: 'Having the opposite of the desired effect.' },
  { word: 'fruitful', definition: 'Producing good or helpful results; productive.' },
  { word: 'fruitless', definition: 'Failing to achieve the desired results; unproductive.' },
  { word: 'gratifying', definition: 'Giving pleasure or satisfaction; pleasing.' },
  { word: 'ungratifying', definition: 'Not giving pleasure or satisfaction; disappointing.' },
  { word: 'fulfilling', definition: 'Making someone satisfied or happy through their achievements.' },
  { word: 'unfulfilling', definition: 'Not providing satisfaction or a sense of achievement.' },
  { word: 'agreeable', definition: 'Pleasant or pleasing; willing to agree.' },
  { word: 'disagreeable', definition: 'Unpleasant or unlikable; causing annoyance.' },
  { word: 'engaging', definition: 'Charming and attractive; holding attention.' },
  { word: 'tedious', definition: 'Too long, slow, or dull; tiresome or monotonous.' },
  { word: 'monotonous', definition: 'Dull, tedious, and repetitious; lacking in variety.' },
  { word: 'diverse', definition: 'Showing a great deal of variety; very different.' },
]

// Helper function to get vocabulary list based on difficulty
const getVocabularyList = (difficulty = 'normal') => {
  return difficulty === 'difficult' ? VOCABULARY_LIST_DIFFICULT : VOCABULARY_LIST_NORMAL
}

// In-memory storage for game sessions (which words have been used)
const gameSessions = new Map()

// Shuffle array function
const shuffleArray = (array) => {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return ok()
  if (event.httpMethod !== 'POST') return badRequest('Use POST')

  try {
    const body = JSON.parse(event.body || '{}')
    const { action, sessionId = null, runId, answer, gameSessionId, difficulty = 'normal' } = body
    const sql = getSql()

    // Get the appropriate vocabulary list based on difficulty
    const VOCABULARY_LIST = getVocabularyList(difficulty)

    // Generate a single card from pre-defined list
    const generateCard = async (usedIndices = [], vocabList = VOCABULARY_LIST) => {
      // Get available words (not yet used in this session)
      let availableWords = vocabList.filter((_, index) => !usedIndices.includes(index))
      
      if (availableWords.length === 0) {
        // All words used, reset and use all words
        usedIndices.length = 0
        availableWords = vocabList
      }
      
      const randomIndex = Math.floor(Math.random() * availableWords.length)
      const vocab = availableWords[randomIndex]
      const originalIndex = vocabList.findIndex(v => v.word === vocab.word)
      
      const id = randomUUID()
      const level = difficulty === 'difficult' ? 'B2' : 'A2'
      await sql`
        INSERT INTO vocabulary_runs (id, session_id, level, definition, expected_word, correct, xp_earned)
        VALUES (${id}, ${sessionId}, ${level}, ${vocab.definition}, ${vocab.word}, false, 0)
      `

      return { runId: id, card: { definition: vocab.definition, word: vocab.word }, vocabIndex: originalIndex }
    }

    // Generate 10 cards for a game session (unique words)
    const generateBatch = async (gameSessionId, vocabList = VOCABULARY_LIST) => {
      let sessionData = gameSessions.get(gameSessionId) || { usedIndices: [], difficulty }
      let usedIndices = sessionData.usedIndices || []
      
      // Get available words (not yet used in this session)
      let availableWords = vocabList.filter((_, index) => !usedIndices.includes(index))
      
      if (availableWords.length === 0) {
        // All words used, reset and use all words
        usedIndices = []
        availableWords = vocabList
      }
      
      // Shuffle and select 10 unique words for this game
      const shuffled = shuffleArray(availableWords)
      const selected = shuffled.slice(0, Math.min(10, shuffled.length))
      
      const cards = []
      const level = difficulty === 'difficult' ? 'B2' : 'A2'
      for (const vocab of selected) {
        const originalIndex = vocabList.findIndex(v => v.word === vocab.word)
        const id = randomUUID()
        await sql`
          INSERT INTO vocabulary_runs (id, session_id, level, definition, expected_word, correct, xp_earned)
          VALUES (${id}, ${sessionId}, ${level}, ${vocab.definition}, ${vocab.word}, false, 0)
        `
        cards.push({ runId: id, card: { definition: vocab.definition, word: vocab.word } })
        
        if (!usedIndices.includes(originalIndex)) {
          usedIndices.push(originalIndex)
        }
      }
      
      // Store the game session used indices, card IDs, and difficulty
      const cardIds = cards.map(c => c.runId)
      gameSessions.set(gameSessionId, { 
        usedIndices,
        cardIds,
        difficulty
      })
      return cards
    }

    if (action === 'start-game') {
      const gameSessionId = randomUUID()
      const cards = await generateBatch(gameSessionId, VOCABULARY_LIST)
      
      await logEvent(sessionId, 'vocabulary-rpg', 'game-started', { gameSessionId, cardsCount: cards.length })

      return ok({ gameSessionId, cards })
    }

    if (action === 'get-next') {
      if (!gameSessionId) return badRequest('gameSessionId required')
      
      // Get card IDs for this game session from memory
      const gameSession = gameSessions.get(gameSessionId)
      if (!gameSession || !gameSession.cardIds || gameSession.cardIds.length === 0) {
        return badRequest('Game session not found or no cards available')
      }
      
      // Find an unused card from this game session's card IDs
      // Exclude cards that have been answered or skipped (user_answer = '' with correct = false means skipped)
      const unusedCards = await sql`
        SELECT id, definition, expected_word 
        FROM vocabulary_runs 
        WHERE id = ANY(${gameSession.cardIds})
          AND user_answer IS NULL
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

      // No more cards available for this game session
      return ok({ runId: null, card: null, gameComplete: true })
    }

    if (action === 'generate') {
      const sessionData = gameSessions.get(gameSessionId) || { usedIndices: [], difficulty: 'normal' }
      const usedIndices = sessionData.usedIndices || []
      const sessionDifficulty = sessionData.difficulty || difficulty
      const vocabList = getVocabularyList(sessionDifficulty)
      const cardData = await generateCard(usedIndices, vocabList)
      if (cardData.vocabIndex !== undefined && !usedIndices.includes(cardData.vocabIndex)) {
        usedIndices.push(cardData.vocabIndex)
        gameSessions.set(gameSessionId, { ...sessionData, usedIndices })
      }
      await logEvent(sessionId, 'vocabulary-rpg', 'card-generated', { runId: cardData.runId })
      return ok({ runId: cardData.runId, card: cardData.card })
    }

    // Trim articles (a, an, the) from answers
    const trimArticles = (text) => {
      return text
        .trim()
        .toLowerCase()
        .replace(/^(a|an|the)\s+/i, '')
        .trim()
    }

    // Flexible answer matching - checks if answer contains the correct word or root
    const matchAnswer = (userAnswer, correctAnswer) => {
      // Normalize spaces - replace multiple spaces with single space, remove leading/trailing
      const normalizeSpaces = (text) => text.replace(/\s+/g, ' ').trim()
      
      const user = normalizeSpaces(trimArticles(userAnswer).toLowerCase())
      const correct = normalizeSpaces(trimArticles(correctAnswer).toLowerCase())
      
      // Exact match
      if (user === correct) return true
      
      // Remove spaces for comparison (handles "ice cream" vs "icecream")
      const userNoSpaces = user.replace(/\s+/g, '')
      const correctNoSpaces = correct.replace(/\s+/g, '')
      if (userNoSpaces === correctNoSpaces) return true
      
      // Check if user answer contains the correct word
      if (user.includes(correct) || correct.includes(user)) return true
      
      // Check root words (simple approach: check if one word is contained in the other)
      // For example: "refrigerator" matches "fridge", "freeze" matches "freezing"
      const userWords = user.split(/\s+/)
      const correctWords = correct.split(/\s+/)
      
      // Check if any word from user answer matches any word from correct answer
      for (const userWord of userWords) {
        for (const correctWord of correctWords) {
          // Check if words share a common root (at least 4 characters match)
          const minLength = Math.min(userWord.length, correctWord.length)
          if (minLength >= 4) {
            // Check if one word starts with the other (for root matching)
            if (userWord.startsWith(correctWord.substring(0, Math.min(4, correctWord.length))) ||
                correctWord.startsWith(userWord.substring(0, Math.min(4, userWord.length)))) {
              return true
            }
            // Check if they share a significant portion
            if (userWord.length >= 4 && correctWord.length >= 4) {
              const userRoot = userWord.substring(0, Math.min(5, userWord.length))
              const correctRoot = correctWord.substring(0, Math.min(5, correctWord.length))
              if (userRoot === correctRoot) return true
            }
          }
          // For shorter words, allow exact match only
          if (userWord === correctWord) return true
        }
      }
      
      return false
    }

    if (action === 'skip') {
      if (!runId || !gameSessionId) return badRequest('runId and gameSessionId required')
      
      // Mark current card as skipped
      await sql`
        UPDATE vocabulary_runs
        SET user_answer = '', correct = false, xp_earned = 0
        WHERE id = ${runId}
      `

      await logEvent(sessionId, 'vocabulary-rpg', 'word-skipped', { runId })

      // Get the next card
      const gameSession = gameSessions.get(gameSessionId)
      if (!gameSession || !gameSession.cardIds || gameSession.cardIds.length === 0) {
        return badRequest('Game session not found or no cards available')
      }
      
      const unusedCards = await sql`
        SELECT id, definition, expected_word 
        FROM vocabulary_runs 
        WHERE id = ANY(${gameSession.cardIds})
          AND user_answer IS NULL
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

      // No more cards available
      return ok({ runId: null, card: null, gameComplete: true })
    }

    if (action === 'answer') {
      if (!runId || !answer) return badRequest('runId and answer required')
      const rows = await sql`
        SELECT expected_word FROM vocabulary_runs WHERE id = ${runId}
      `
      if (rows.length === 0) return badRequest('Run not found')

      const correct = matchAnswer(answer, rows[0].expected_word)
      const xpEarned = correct ? 10 : 0

      await sql`
        UPDATE vocabulary_runs
        SET user_answer = ${answer}, correct = ${correct}, xp_earned = ${xpEarned}
        WHERE id = ${runId}
      `

      await logEvent(sessionId, 'vocabulary-rpg', 'answer-submitted', { runId, correct })

      return ok({ 
        correct, 
        xpEarned,
        correctWord: rows[0].expected_word
      })
    }

    return badRequest('Unsupported action')
  } catch (error) {
    console.error('vocabulary-rpg error', error)
    return serverError('Vocabulary RPG failed', error.message)
  }
}

