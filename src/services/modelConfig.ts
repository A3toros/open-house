export type ActivityModelConfig = {
  primary: string
  fallback?: string
}

export const activityModels: Record<string, ActivityModelConfig> = {
  'voice-challenge': {
    primary: 'openai/gpt-4o-mini',
    fallback: 'anthropic/claude-3-haiku',
  },
  'photo-booth': {
    primary: 'google/gemini-2.5-flash-image-preview',
    fallback: 'stability/illustration-diffusion',
  },
  'story-forge': {
    primary: 'anthropic/claude-3-haiku',
    fallback: 'mistralai/mistral-nemo-mini',
  },
  'story-ending': {
    primary: 'anthropic/claude-3-haiku',
  },
  'culture-translator': {
    primary: 'nousresearch/nous-hermes-2-vision-7b',
    fallback: 'allenai/molmo-7b-d',
  },
  'escape-mission': {
    primary: 'anthropic/claude-3-haiku',
    fallback: 'meta-llama/llama-3.1-8b-instruct',
  },
  'debate-arena': {
    primary: 'anthropic/claude-3-haiku',
    fallback: 'meta-llama/llama-3.1-8b-instruct',
  },
  'persona-builder': {
    primary: 'anthropic/claude-3-haiku',
    fallback: 'mistralai/mistral-nemo-mini',
  },
  'vocabulary-rpg': {
    primary: 'anthropic/claude-3-haiku',
  },
  'parent-corner': {
    primary: 'anthropic/claude-3-haiku',
  },
}

export const getModelForActivity = (activitySlug: string) => {
  const envOverride = import.meta?.env?.[`VITE_MODEL_${activitySlug.toUpperCase().replace(/-/g, '_')}`]
  if (envOverride) {
    return { primary: envOverride }
  }
  return activityModels[activitySlug] || { primary: 'anthropic/claude-3-haiku' }
}

