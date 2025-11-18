// This file should only be used in Node.js backend environment
// Frontend should not import this file

const OpenAI = require("openai");

const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

/**
 * Get CEFR level description
 */
function getCEFRDescription(level) {
  const descriptions = {
    'A1': 'Beginner - Basic vocabulary, simple sentences',
    'A2': 'Elementary - Everyday vocabulary, present/past tenses', 
    'B1': 'Intermediate - Varied vocabulary, complex sentences',
    'B2': 'Upper-Intermediate - Advanced vocabulary, sophisticated structures',
    'C1': 'Advanced - Nuanced vocabulary, complex discourse',
    'C2': 'Proficiency - Native-like fluency and accuracy'
  };
  return descriptions[level] || descriptions['B1'];
}

/**
 * Get scoring guidelines for specific CEFR level
 */
function getScoringGuidelines(level) {
  const guidelines = {
    'A1': `A1 LEVEL EXPECTATIONS:
- Grammar: Basic present tense, simple sentences (I am, I like, I have)
- Vocabulary: Basic words (good, bad, big, small, happy, sad)
- Pronunciation: Clear enough to understand basic words
- Fluency: Slow but understandable, many pauses acceptable
- Content: Simple responses to basic questions`,
    
    'A2': `A2 LEVEL EXPECTATIONS:
- Grammar: Present/past tenses, simple future (will), basic conditionals
- Vocabulary: Everyday words, basic adjectives, common verbs
- Pronunciation: Generally clear, some errors acceptable
- Fluency: Steady pace, some hesitation acceptable
- Content: Clear responses to familiar topics`,
    
    'B1': `B1 LEVEL EXPECTATIONS:
- Grammar: Present/past/future, conditionals, passive voice, reported speech
- Vocabulary: Varied vocabulary, some idiomatic expressions
- Pronunciation: Clear pronunciation, minor errors acceptable
- Fluency: Natural pace, occasional hesitation
- Content: Detailed responses with examples and explanations`,
    
    'B2': `B2 LEVEL EXPECTATIONS:
- Grammar: Complex tenses, subjunctive, advanced conditionals, perfect tenses
- Vocabulary: Advanced vocabulary, synonyms, collocations
- Pronunciation: Clear pronunciation, native-like intonation
- Fluency: Natural pace, minimal hesitation
- Content: Sophisticated responses with analysis and evaluation`,
    
    'C1': `C1 LEVEL EXPECTATIONS:
- Grammar: Perfect grammar, complex structures, nuanced tense usage
- Vocabulary: Sophisticated vocabulary, precise word choice, idioms
- Pronunciation: Near-native pronunciation and intonation
- Fluency: Natural, flowing speech with minimal hesitation
- Content: Complex, nuanced responses with critical thinking`,
    
    'C2': `C2 LEVEL EXPECTATIONS:
- Grammar: Perfect grammar, native-like structures
- Vocabulary: Expert-level vocabulary, precise terminology
- Pronunciation: Native-like pronunciation and intonation
- Fluency: Natural, flowing speech without hesitation
- Content: Expert-level responses with sophisticated analysis`
  };
  return guidelines[level] || guidelines['B1'];
}

/**
 * Analyze speaking test transcript using GPT-4o Mini
 */
async function analyzeSpeakingTest(transcript, prompt, difficultyLevel) {
  try {
    const analysisPrompt = `
You are an expert ESL speaking test evaluator. Analyze this student's response:

PROMPT: "${prompt}"
STUDENT RESPONSE: "${transcript}"
STUDENT LEVEL: ${difficultyLevel} (${getCEFRDescription(difficultyLevel)})

IMPORTANT: Evaluate the student based on their CURRENT LEVEL (${difficultyLevel}). 
- For A1 students: Expect basic vocabulary, simple present tense, basic sentence structure
- For A2 students: Expect everyday vocabulary, present/past tenses, simple complex sentences
- For B1 students: Expect varied vocabulary, conditional sentences, some complex structures
- For B2 students: Expect advanced vocabulary, sophisticated grammar, complex discourse
- For C1 students: Expect nuanced vocabulary, complex grammar, native-like structures
- For C2 students: Expect expert-level vocabulary, perfect grammar, native-like fluency

Evaluate on these 5 categories and return JSON:
{
  "grammar_score": 0-25,        // Grammar accuracy appropriate for ${difficultyLevel} level
  "vocabulary_score": 0-20,     // Word choice and variety appropriate for ${difficultyLevel} level
  "pronunciation_score": 0-15,  // Clarity and accuracy appropriate for ${difficultyLevel} level
  "fluency_score": 0-20,        // Pace, pauses, flow appropriate for ${difficultyLevel} level
  "content_score": 0-20,        // How well they addressed the prompt (appropriate for ${difficultyLevel} level)
  "grammar_mistakes": number,   // Count of grammar errors for ${difficultyLevel} level
  "vocabulary_mistakes": number, // Count of vocabulary issues for ${difficultyLevel} level
  "word_count": number,         // Total words spoken
  "feedback": "string"          // Teacher-style feedback message appropriate for ${difficultyLevel} level
}

SCORING GUIDELINES FOR ${difficultyLevel}:
${getScoringGuidelines(difficultyLevel)}
`;

    const response = await client.chat.completions.create({
      model: "openai/gpt-4o-mini",
      messages: [{ role: "user", content: analysisPrompt }],
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error('Error analyzing speaking test:', error);
    throw new Error('Failed to analyze speaking test with AI');
  }
}

/**
 * Calculate overall score from category scores
 */
function calculateScore(analysis) {
  const { 
    grammar_score, 
    vocabulary_score, 
    pronunciation_score, 
    fluency_score, 
    content_score 
  } = analysis;
  
  // Sum all category scores (already weighted by GPT-4o Mini)
  const totalScore = grammar_score + vocabulary_score + pronunciation_score + 
                    fluency_score + content_score;
  
  return Math.max(0, Math.min(100, Math.round(totalScore)));
}

/**
 * CEFR levels for creator UI
 */
const CEFR_LEVELS = [
  { value: 'A1', label: 'A1 (Beginner)', description: 'Basic vocabulary, simple sentences' },
  { value: 'A2', label: 'A2 (Elementary)', description: 'Everyday vocabulary, present/past tenses' },
  { value: 'B1', label: 'B1 (Intermediate)', description: 'Varied vocabulary, complex sentences' },
  { value: 'B2', label: 'B2 (Upper-Intermediate)', description: 'Advanced vocabulary, sophisticated structures' },
  { value: 'C1', label: 'C1 (Advanced)', description: 'Nuanced vocabulary, complex discourse' },
  { value: 'C2', label: 'C2 (Proficiency)', description: 'Native-like fluency and accuracy' }
];

module.exports = {
  analyzeSpeakingTest,
  calculateScore,
  CEFR_LEVELS,
  getCEFRDescription,
  getScoringGuidelines
};
