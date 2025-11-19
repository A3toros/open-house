const { ok, badRequest, serverError } = require('./response')
const { transcribeAudio } = require('./assemblyai')
const { getSql, logEvent } = require('./db')
const { randomUUID } = require('crypto')

// Pre-defined riddles with answers
const RIDDLES = [
  { riddle: 'I have four legs but do not walk. I hold things up. What am I?', answer: 'table' },
  { riddle: 'I have a face and two hands but no arms or legs. What am I?', answer: 'clock' },
  { riddle: 'I am round and bright at night. I change shape over the month. What am I?', answer: 'moon' },
  { riddle: 'I have leaves but I am not a tree. You read me. What am I?', answer: 'book' },
  { riddle: 'I can be opened and closed. I keep food cold. What am I?', answer: 'refrigerator' },
  { riddle: 'I come from a chicken and you can eat me. I am often broken to cook. What am I?', answer: 'egg' },
  { riddle: 'I am yellow and long. Monkeys like me. What am I?', answer: 'banana' },
  { riddle: 'I have wheels and you drive me on the road. I can carry people. What am I?', answer: 'car' },
  { riddle: 'I am soft. You sleep on me. I stay on the bed. What am I?', answer: 'pillow' },
  { riddle: 'I am small and can show the time on your wrist. What am I?', answer: 'watch' },
  { riddle: 'People use me to write. I can be sharp or soft. What am I?', answer: 'pencil' },
  { riddle: 'I am warm and you wear me when it is cold. What am I?', answer: 'jacket' },
  { riddle: 'I ring when someone calls you. What am I?', answer: 'phone' },
  { riddle: 'I have keys but not doors. You press me to make music. What am I?', answer: 'piano' },
  { riddle: 'I fly in the sky and make nests in trees. What am I?', answer: 'bird' },
  { riddle: 'I am liquid and people drink me. What am I?', answer: 'water' },
  { riddle: 'I am bright and warm. I come up in the morning. What am I?', answer: 'sun' },
  { riddle: 'I am a small animal with whiskers. I like milk. What am I?', answer: 'cat' },
  { riddle: 'I clean your teeth. You use me in the morning and night. What am I?', answer: 'toothbrush' },
  { riddle: 'I move on rails and take many people in a city. What am I?', answer: 'train' },
  { riddle: 'I can cut paper. I have two sharp sides. What am I?', answer: 'scissors' },
  { riddle: 'I have a trunk and a long nose. I am very big. What am I?', answer: 'elephant' },
  { riddle: 'I fall from the sky in winter. I am white and soft. What am I?', answer: 'snow' },
  { riddle: 'I can take pictures. I have a lens. What am I?', answer: 'camera' },
  { riddle: 'I am a cold sweet food. You eat me with a spoon or cone. What am I?', answer: 'ice cream' },
  { riddle: 'I have a handle and you use me to drink hot tea. What am I?', answer: 'cup' },
  { riddle: 'I can open a lock. I am small and made of metal. What am I?', answer: 'key' },
  { riddle: 'I have numbers and you use me to add and subtract. What am I?', answer: 'calculator' },
  { riddle: 'I am a small green vegetable that looks like a ball. What am I?', answer: 'pea' },
  { riddle: 'I am a place with many books. You can read and borrow books here. What am I?', answer: 'library' },
  { riddle: 'I have pages and you use me to write notes at school. What am I?', answer: 'notebook' },
  { riddle: 'I am a machine that cleans clothes. What am I?', answer: 'washing machine' },
  { riddle: 'I have a long neck and I eat leaves from tall trees. What am I?', answer: 'giraffe' },
  { riddle: 'I am used to cook food and have a flame or heat. What am I?', answer: 'stove' },
  { riddle: 'I am round and you kick me in many sports. What am I?', answer: 'ball' },
  { riddle: 'I am a sweet food made from milk and sugar, often in bars. What am I?', answer: 'chocolate' },
  { riddle: 'I have a screen and you can watch movies on me. What am I?', answer: 'television' },
  { riddle: 'I live in water and can swim. What am I?', answer: 'fish' },
  { riddle: 'I am hot and spicy in some dishes. I am long and red or green. What am I?', answer: 'chili' },
  { riddle: 'I open and close. I let people enter a house. What am I?', answer: 'door' },
  { riddle: 'I am green and grow on trees. People eat me and sometimes make juice. What am I?', answer: 'apple' },
  { riddle: 'I am small, round, red and delicious. What am I?', answer: 'strawberry' },
  { riddle: 'I am used to carry many books to school. What am I?', answer: 'backpack' },
  { riddle: 'I am used for writing on a whiteboard. What am I?', answer: 'marker' },
  { riddle: 'I am used to protect your head when you ride a bike. What am I?', answer: 'helmet' },
  { riddle: 'I give light and I hang on the ceiling. What am I?', answer: 'lamp' },
  { riddle: 'I am small and live in a house. I help with the computer and give tasks. What am I?', answer: 'mouse' },
  { riddle: 'I am a cold, white food made from milk, often on pizza. What am I?', answer: 'cheese' },
  { riddle: 'I am used to see far away things, like stars or birds. What am I?', answer: 'telescope' },
  { riddle: 'I am yellow and bright in the sky. I give light in the day. What am I?', answer: 'sun' },
  { riddle: 'I am used to write in ink and I have a cap or click top. What am I?', answer: 'pen' },
  { riddle: 'I am used to hold water and drink from. What am I?', answer: 'bottle' },
  { riddle: 'I am a group of students and a teacher in a room. What am I?', answer: 'class' },
  { riddle: 'I move on a road and I have many seats for people. What am I?', answer: 'bus' },
  { riddle: 'I am a small, round vegetable: orange and sweet. What am I?', answer: 'carrot' },
  { riddle: 'I am made of glass and you wear me for better sight. What am I?', answer: 'glasses' },
  { riddle: 'I move in the sky and bring rain sometimes. I am white and soft. What am I?', answer: 'cloud' },
  { riddle: 'I am used to dry your hands. I am soft and made of cloth. What am I?', answer: 'towel' },
  { riddle: 'I am a green vegetable that is long and thin. What am I?', answer: 'cucumber' },
  { riddle: 'I have a big mouth and sharp teeth. I live in the sea. What am I?', answer: 'shark' },
  { riddle: 'I am hard and round and grow inside the ground. People eat me boiled or fried. What am I?', answer: 'potato' },
  { riddle: 'I am a fast animal with black and white stripes. What am I?', answer: 'zebra' },
  { riddle: 'I am white, sweet food you put in tea or coffee. What am I?', answer: 'sugar' },
  { riddle: 'I have many colors and you see me after rain. What am I?', answer: 'rainbow' },
  { riddle: 'I am a sport with a net and a round ball. You score by putting the ball in the net. What am I?', answer: 'basketball' },
]

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
  if (userNoSpaces.includes(correctNoSpaces) || correctNoSpaces.includes(userNoSpaces)) return true
  
  // Check for common variations
  const variations = {
    refrigerator: ['fridge', 'freezer'],
    'ice cream': ['icecream', 'ice-cream'],
    piano: ['keyboard'],
    cup: ['mug'],
    calculator: ['calc'],
    pea: ['peas'],
    stove: ['cooker'],
    television: ['tv', 'television'],
    chili: ['pepper'],
    apple: ['fruit'],
    marker: ['whiteboard pen', 'pen'],
    lamp: ['ceiling light', 'light'],
    mouse: ['computer mouse'],
    telescope: ['binoculars'],
    glasses: ['spectacles'],
    class: ['classroom'],
  }
  
  if (variations[correct]) {
    for (const variant of variations[correct]) {
      if (user.includes(variant) || variant.includes(user)) return true
    }
  }
  
  // Check root words (simple stemming)
  const userWords = user.split(/\s+/)
  const correctWords = correct.split(/\s+/)
  
  for (const userWord of userWords) {
    for (const correctWord of correctWords) {
      // Check if words share a common root (at least 4 characters match)
      if (userWord.length >= 4 && correctWord.length >= 4) {
        const minLen = Math.min(userWord.length, correctWord.length)
        let matchCount = 0
        for (let i = 0; i < minLen; i++) {
          if (userWord[i] === correctWord[i]) matchCount++
        }
        if (matchCount >= Math.min(4, minLen * 0.7)) return true
      }
    }
  }
  
  return false
}

// In-memory store for game sessions (selected riddle indices)
// In production, consider using a database or cache service
const gameSessions = new Map()

// Helper to randomly select 5 unique riddles
const selectRandomRiddles = (count = 5) => {
  const indices = []
  const available = Array.from({ length: RIDDLES.length }, (_, i) => i)
  
  for (let i = 0; i < count && available.length > 0; i++) {
    const randomIndex = Math.floor(Math.random() * available.length)
    indices.push(available[randomIndex])
    available.splice(randomIndex, 1)
  }
  
  return indices
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return ok()
  if (event.httpMethod !== 'POST') return badRequest('Use POST')

  try {
    const body = JSON.parse(event.body || '{}')
    const { action, sessionId = null, attempt, audioBlob, gameSessionId, currentRiddleIndex } = body
    const sql = getSql()

    if (action === 'start-game') {
      const newGameSessionId = randomUUID()
      // Select 5 random riddles for this session
      const selectedIndices = selectRandomRiddles(5)
      
      // Store the selected riddle indices for this session
      gameSessions.set(newGameSessionId, {
        selectedIndices,
        currentIndex: 0,
      })
      
      const firstRiddleIndex = selectedIndices[0]
      const firstRiddle = RIDDLES[firstRiddleIndex]
      
      await logEvent(sessionId, 'riddles', 'game-started', { 
        gameSessionId: newGameSessionId,
        selectedIndices,
      })

      return ok({
        gameSessionId: newGameSessionId,
        riddle: firstRiddle.riddle,
        currentRiddleIndex: 0,
        totalRiddles: 5,
      })
    }

    if (action === 'transcribe') {
      if (!audioBlob) return badRequest('audioBlob required')
      
      const transcript = await transcribeAudio(audioBlob, 'audio/webm')
      return ok({ transcript: transcript?.text || '' })
    }

    if (action === 'check-answer') {
      if (!gameSessionId) return badRequest('gameSessionId required')
      if (typeof currentRiddleIndex !== 'number' || currentRiddleIndex < 0 || currentRiddleIndex >= 5) {
        return badRequest('Invalid currentRiddleIndex')
      }
      if (!attempt) return badRequest('attempt required')
      
      // Get the selected riddle indices for this session
      const session = gameSessions.get(gameSessionId)
      if (!session) {
        return badRequest('Game session not found. Please start a new game.')
      }
      
      const { selectedIndices } = session
      const actualRiddleIndex = selectedIndices[currentRiddleIndex]
      const currentRiddle = RIDDLES[actualRiddleIndex]
      
      const correct = matchAnswer(attempt, currentRiddle.answer)
      
      const nextIndex = currentRiddleIndex + 1
      const hasNext = nextIndex < 5
      
      await logEvent(sessionId, 'riddles', 'answer-submitted', {
        gameSessionId,
        currentRiddleIndex,
        actualRiddleIndex,
        correct,
        attempt,
      })

      let nextRiddle = null
      if (hasNext) {
        const nextActualIndex = selectedIndices[nextIndex]
        nextRiddle = RIDDLES[nextActualIndex].riddle
      } else {
        // Session complete - clear the session data
        gameSessions.delete(gameSessionId)
      }

      return ok({
        correct,
        correctAnswer: currentRiddle.answer,
        nextRiddle,
        nextIndex: hasNext ? nextIndex : null,
        points: correct ? 1 : 0,
      })
    }

    if (action === 'end-game') {
      if (gameSessionId) {
        // Clear session data
        gameSessions.delete(gameSessionId)
        await logEvent(sessionId, 'riddles', 'game-ended', { gameSessionId })
      }
      return ok({ message: 'Game ended' })
    }

    return badRequest('Unsupported action')
  } catch (error) {
    console.error('riddles error', error)
    return serverError('Riddles failed', error.message)
  }
}

