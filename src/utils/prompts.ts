export const prompts = {
  voiceChallenge: (prompt: string) =>
    `You are an encouraging bilingual AI mentor. Listen to the student's description and suggest a future profession.\nPrompt: ${prompt}`,
  storyForge: (genre: string, traits: string, plot: string) =>
    `Co-write a 6-8 sentence ${genre} story. Main character traits: ${traits}. Plot: ${plot}. Return JSON with story, grammar_tips, alternate_endings.`,
}

