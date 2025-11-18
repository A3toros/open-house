const { neon } = require('@neondatabase/serverless');
const axios = require('axios');
const OpenAI = require('openai');

// Import helper functions directly (avoiding path issues)
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

// Environment variables
const ASSEMBLYAI_API_KEY = process.env.ASSEMBLYAI_API_KEY;
const ASSEMBLYAI_BASE_URL = process.env.ASSEMBLYAI_BASE_URL || 'https://api.assemblyai.com';
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// Initialize OpenAI client for GPT-4o Mini
const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: OPENROUTER_API_KEY,
  defaultHeaders: {
    'HTTP-Referer': process.env.URL || 'http://localhost:8888',
    'X-Title': 'Mathayom Watsing Testing System'
  }
});

const sql = neon(process.env.NEON_DATABASE_URL);

exports.handler = async (event, context) => {
  console.log('=== AI FEEDBACK PROCESSING WITH GPT-4O MINI ===');
  let debugMode = false;
  let audioBlobForDebug = null;

  try {
    // Parse request body
    const body = JSON.parse(event.body);
    const { test_id, audio_blob, question_id, debug, audio_mime_type } = body;
    debugMode = process.env.DEBUG_SPEAKING_AUDIO === 'true' && Boolean(debug);
    audioBlobForDebug = audio_blob;

    console.log('AI Feedback request data:', {
      test_id,
      question_id,
      has_audio_blob: !!audio_blob,
      audio_blob_size: audio_blob ? audio_blob.length : 0
    });

    // Get test configuration and question details
    const testConfig = await sql`
      SELECT st.min_words, st.time_limit, st.min_duration, st.max_duration, st.passing_score,
             stq.prompt, stq.difficulty_level
      FROM speaking_tests st
      LEFT JOIN speaking_test_questions stq ON st.id = stq.test_id
      WHERE st.id = ${test_id} AND stq.id = ${question_id}
    `;

    if (testConfig.length === 0) {
      throw new Error('Speaking test or question not found');
    }

    const config = testConfig[0];
    console.log('Test configuration:', config);

    // Process audio with AssemblyAI for transcription
    console.log('Processing audio with AssemblyAI...');
    const transcriptionResult = await transcribeAudioWithAssemblyAI(audio_blob);
    console.log('Transcription result:', transcriptionResult);

    if (!transcriptionResult.text || transcriptionResult.text.trim().length === 0) {
      throw new Error('Your speech was not recognized, please speak louder');
    }

    // Analyze with GPT-4o Mini (enhanced with word confidence)
    console.log('Analyzing with GPT-4o Mini...');
    const analysis = await analyzeWithGPT4oMiniEnhanced(
      transcriptionResult.text, 
      transcriptionResult.words, 
      config.prompt, 
      config.difficulty_level
    );
    console.log('GPT-4o Mini analysis:', analysis);

    // Calculate overall score
    const overallScore = calculateOverallScore(analysis);
    console.log('Overall score:', overallScore);

    // Build complete AI feedback payload for storage
    const aiFeedback = {
      overall_score: overallScore,
      word_count: analysis.word_count,
      feedback: analysis.feedback,
      improved_transcript: analysis.improved_transcript,
      grammar_score: analysis.grammar_score,
      vocabulary_score: analysis.vocabulary_score,
      pronunciation_score: analysis.pronunciation_score,
      fluency_score: analysis.fluency_score,
      content_score: analysis.content_score,
      grammar_mistakes: analysis.grammar_mistakes,
      vocabulary_mistakes: analysis.vocabulary_mistakes,
      language_use_mistakes: analysis.language_use_mistakes,
      grammar_corrections: analysis.grammar_corrections || [],
      vocabulary_corrections: analysis.vocabulary_corrections || [],
      language_use_corrections: analysis.language_use_corrections || [],
      pronunciation_corrections: analysis.pronunciation_corrections || [], // NEW: Enhanced pronunciation feedback
      prompt: config.prompt,
      difficulty_level: config.difficulty_level
    };
    const responseBody = {
      success: true,
      transcript: transcriptionResult.text,
      // Use existing columns only
      grammar_mistakes: analysis.grammar_mistakes,
      vocabulary_mistakes: analysis.vocabulary_mistakes,
      language_use_mistakes: analysis.language_use_mistakes,
      word_count: analysis.word_count,
      overall_score: overallScore,
      // Store detailed feedback in transcript or as JSON in existing fields
      feedback: analysis.feedback,
      improved_transcript: analysis.improved_transcript,
      grammar_corrections: analysis.grammar_corrections || [],
      vocabulary_corrections: analysis.vocabulary_corrections || [],
      language_use_corrections: analysis.language_use_corrections || [],
      pronunciation_corrections: analysis.pronunciation_corrections || [], // NEW: Enhanced pronunciation feedback
      // Add individual category scores for frontend display
      grammar_score: analysis.grammar_score,
      vocabulary_score: analysis.vocabulary_score,
      pronunciation_score: analysis.pronunciation_score,
      fluency_score: analysis.fluency_score,
      content_score: analysis.content_score,
      passed: overallScore >= config.passing_score,
      // Complete AI feedback payload for database storage
      ai_feedback: aiFeedback
    };

    if (debugMode) {
      responseBody.debug = {
        base64Length: audioBlobForDebug ? audioBlobForDebug.length : 0,
        base64Prefix: audioBlobForDebug ? audioBlobForDebug.slice(0, 128) : null,
        timestamp: new Date().toISOString(),
        mimeType: audio_mime_type || 'audio/webm'
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify(responseBody)
    };

  } catch (error) {
    console.error('AI Feedback processing error:', error);
    const responseBody = {
      success: false,
      message: error.message,
      error: error.message
    };

    if (debugMode) {
      responseBody.debug = {
        base64Length: audioBlobForDebug ? audioBlobForDebug.length : 0,
        base64Prefix: audioBlobForDebug ? audioBlobForDebug.slice(0, 128) : null,
        timestamp: new Date().toISOString(),
        mimeType: audio_mime_type || 'audio/webm'
      };
    }

    return {
      statusCode: debugMode ? 200 : 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify(responseBody)
    };
  }
};

async function transcribeAudioWithAssemblyAI(audioBlob) {
  try {
    // Convert base64 to buffer
    const audioBuffer = Buffer.from(audioBlob, 'base64');
    
    // Upload audio to AssemblyAI
    const uploadResponse = await axios.post(`${ASSEMBLYAI_BASE_URL}/v2/upload`, audioBuffer, {
      headers: {
        'Authorization': ASSEMBLYAI_API_KEY,
        'Content-Type': 'application/octet-stream'
      }
    });

    const audioUrl = uploadResponse.data.upload_url;
    console.log('Audio uploaded to AssemblyAI:', audioUrl);

    // Start transcription
    const transcriptionResponse = await axios.post(`${ASSEMBLYAI_BASE_URL}/v2/transcript`, {
      audio_url: audioUrl,
      language_detection: true,
      punctuate: true,
      format_text: true
    }, {
      headers: {
        'Authorization': ASSEMBLYAI_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    const transcriptId = transcriptionResponse.data.id;
    console.log('Transcription started, ID:', transcriptId);

    // Poll for completion
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds max

    while (attempts < maxAttempts) {
      const statusResponse = await axios.get(`${ASSEMBLYAI_BASE_URL}/v2/transcript/${transcriptId}`, {
        headers: {
          'Authorization': ASSEMBLYAI_API_KEY
        }
      });

      const status = statusResponse.data.status;
      console.log(`Transcription status: ${status} (attempt ${attempts + 1})`);

      if (status === 'completed') {
        return {
          text: statusResponse.data.text,
          words: statusResponse.data.words, // Word-level data with confidence
          confidence: statusResponse.data.confidence // Overall confidence
        };
      } else if (status === 'error') {
        throw new Error(`Transcription failed: ${statusResponse.data.error}`);
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
    }

    throw new Error('Transcription timeout');

  } catch (error) {
    console.error('AssemblyAI error:', error);
    throw new Error(`Transcription failed: ${error.message}`);
  }
}

async function analyzeWithGPT4oMiniEnhanced(transcript, words, prompt, difficultyLevel) {
  try {
    const analysisPrompt = `
You are a language evaluation assistant. 
Evaluate spoken transcripts for grammar, vocabulary, pronunciation, fluency, and content accuracy. 

Rules:
- Do NOT evaluate inclusivity, cultural, or stylistic preferences. 
- Do NOT correct capitalization, casing, spelling, or punctuation from speech transcripts. 
- The transcript represents spoken language, not written text.
- Ignore punctuation, capitalization, and spelling completely — these are artifacts of transcription, not speech.
- Do not merge or split sentences based on writing conventions.
- Sentence fragments like "Because…" or "So…" are natural in conversation and should not be corrected unless they make the meaning unclear.
- Accept multiple valid variants (gerund vs. infinitive, tense variations, dialectal differences like US/UK English). 
- Do NOT mark something as incorrect just because one form is more common or "sounds more natural." 
- Do NOT rewrite correct sentences or offer stylistic alternatives. Only correct actual errors in grammar, vocabulary, or clarity. 
- Provide clear, constructive feedback focused ONLY on language learning improvement. 

PROMPT: "${prompt}"
STUDENT RESPONSE: "${transcript}"
STUDENT LEVEL: ${difficultyLevel} (${getCEFRDescription(difficultyLevel)})

Word Confidence Data (AssemblyAI format):
${JSON.stringify(words, null, 2)}

Each word object contains:
- text: The word text
- confidence: 0.0-1.0 (low confidence = potential pronunciation issues)
- start/end: Timing in milliseconds

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
  "pronunciation_score": 0-15,  // GPT-4 calculates based on transcript + word confidence
  "fluency_score": 0-20,        // Pace, pauses, flow appropriate for ${difficultyLevel} level
  "content_score": 0-20,        // How well they addressed the prompt (appropriate for ${difficultyLevel} level)
  "grammar_mistakes": number,   // Count of grammar errors for ${difficultyLevel} level
  "vocabulary_mistakes": number, // Count of vocabulary issues for ${difficultyLevel} level
  "language_use_mistakes": number, // Count of unnatural/awkward usage issues for ${difficultyLevel} level
  "word_count": number,         // Total words spoken
  "feedback": "string",         // Structured feedback with one paragraph per skill (Grammar, Vocabulary, Pronunciation, Fluency, Content) appropriate for ${difficultyLevel} level
  "improved_transcript": "string", // Corrected version of the transcript with grammar and vocabulary improvements
  "grammar_corrections": [      // Array of specific grammar mistakes with explanations
    {
      "mistake": "original incorrect phrase",
      "correction": "corrected phrase", 
      "explanation": "why this is wrong and how to fix it"
    }
  ],
  "vocabulary_corrections": [   // Array of specific vocabulary issues with explanations
    {
      "mistake": "original word/phrase",
      "correction": "better word/phrase",
      "explanation": "why this is better and when to use it"
    }
  ],
  "language_use_corrections": [   // Array of natural/idiomatic usage suggestions (not errors) appropriate for ${difficultyLevel} level
    {
      "mistake": "original correct but awkward phrase",
      "suggestion": "more natural/idiomatic phrase",
      "explanation": "why the suggestion sounds more natural or clearer in English"
    }
  ],
  "pronunciation_corrections": [   // NEW: Enhanced pronunciation feedback
    {
      "word": "problematic word",
      "correction": "Simple correction tip"
    }
  ]
}

For "pronunciation_score":
- Analyze pronunciation accuracy based on transcript content and word confidence scores
- Use word confidence data to identify potentially mispronounced words:
  * confidence > 0.9 = excellent pronunciation
  * confidence 0.7-0.9 = good pronunciation  
  * confidence 0.5-0.7 = potential pronunciation issues
  * confidence < 0.5 = likely pronunciation problems
- Focus ONLY on actual sound substitutions or omissions that affect intelligibility (e.g., /TH/→/T/, /R/→/L/, /V/→/B/)
- Consider overall clarity, stress, rhythm, and syllable emphasis appropriate for the student's proficiency level
- Do NOT penalize minor accent-related variations if they do not reduce intelligibility
- If multiple pronunciations are acceptable (e.g., American vs British), do NOT treat differences as errors
- Provide clear, actionable feedback describing specific mispronunciations and how to improve them
- Output score based on overall clarity and intelligibility, not accent neutrality or native-likeness

For "vocabulary_score":
- Score "range" based on the variety of words and phrases used appropriately for the student's CEFR level.
  * A1–A2: Basic everyday words are fine; limited range is expected.
  * B1: Some repetition is acceptable; occasional use of topic-related or descriptive words expected.
  * B2: Should include some idiomatic or less common words; repetition lowers score.
  * C1–C2: Wide lexical range; precise and flexible use of vocabulary.

- Score "accuracy" based on the correctness and appropriacy of words used.
  * Only mark as wrong if the word choice makes the meaning unclear or inappropriate for the context.
  * Do NOT penalize if a simpler but correct word is used at lower levels.

- Vocabulary feedback must describe both:
  * what the student does well (e.g., "Good use of descriptive vocabulary related to acting.")
  * and what could be improved (e.g., "Try using more varied adjectives instead of repeating 'behaves'.")

Focus on actual pronunciation errors and provide specific, actionable feedback for improvement.

FEEDBACK FORMAT:
Provide structured feedback with one paragraph per skill area:
- Grammar: Comment on accuracy and common issues for the student's level
- Vocabulary: Note range, accuracy, and specific suggestions for improvement  
- Pronunciation: Mention clarity, specific sounds, and rhythm/flow
- Fluency: Comment on pace, pauses, and overall delivery
- Content: Assess how well the student addressed the prompt

Example format (MUST be a single string, not an object):
"Grammar: Generally accurate with one article issue. 
Vocabulary: Good range for B1 level; could use more varied adjectives (e.g., 'dedicated', 'intense'). 
Pronunciation: Clear and easy to understand with minor rhythm issues. 
Fluency: Smooth delivery with only brief pauses. 
Content: Fully addresses the topic."

IMPORTANT: The feedback field must be a single string, not an object with separate keys. Format it as one continuous string with line breaks between sections.

SCORING GUIDELINES FOR ${difficultyLevel}:
${getScoringGuidelines(difficultyLevel)}
`;

    const maxAttempts = 3;
    let lastError = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
    const response = await openai.chat.completions.create({
      model: "openai/gpt-4o-mini",
      messages: [{ role: "user", content: analysisPrompt }],
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content);
      } catch (err) {
        lastError = err;
        const status = err?.status || err?.code;
        const isTimeout = err?.name === 'TimeoutError' || err?.code === 'ETIMEDOUT';
        const isRetryableStatus = [408, 409, 425, 429, 500, 502, 503, 504].includes(Number(status));
        const shouldRetry = attempt < maxAttempts && (isRetryableStatus || isTimeout || status === undefined);

        console.warn(`GPT-4o Mini analysis retry ${attempt}/${maxAttempts}`, {
          status,
          code: err?.code,
          name: err?.name,
          message: err?.message
        });

        if (!shouldRetry) {
          throw err;
        }

        const backoffMs = Math.min(1000, 250 * Math.pow(2, attempt - 1));
        await new Promise(resolve => setTimeout(resolve, backoffMs));
      }
    }

    throw lastError;
  } catch (error) {
    console.error('GPT-4o Mini analysis error:', error);
    throw new Error(`AI analysis failed: ${error.message}`);
  }
}

function calculateOverallScore(analysis) {
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