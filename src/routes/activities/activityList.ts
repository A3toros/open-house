import VoiceChallenge from './VoiceChallenge'
import PhotoBooth from './PhotoBooth'
import StoryForge from './StoryForge'
import CultureTranslator from './CultureTranslator'
import EscapeMission from './EscapeMission'
import DebateArena from './DebateArena'
import PersonaBuilder from './PersonaBuilder'
import VocabularyRPG from './VocabularyRPG'
import ParentCorner from './ParentCorner'

export const activities = [
  {
    slug: 'voice-challenge',
    title: 'AI Voice Challenge',
    description: 'Record a short self-intro and receive bilingual career predictions with instant confetti feedback.',
    component: VoiceChallenge,
  },
  {
    slug: 'photo-booth',
    title: 'AI Photo Booth',
    description: 'Snap a photo, pick a future job, and let image generation style your portrait for printing or email.',
    component: PhotoBooth,
  },
  {
    slug: 'story-forge',
    title: 'AI Story Forge',
    description: 'Mix genres, character traits, and plots to co-write a 6–8 sentence story with grammar coaching.',
    component: StoryForge,
  },
  {
    slug: 'culture-translator',
    title: 'AI Culture Translator',
    description: 'Explain a Thai custom, then discover a matching global tradition plus audio narration.',
    component: CultureTranslator,
  },
  {
    slug: 'escape-mission',
    title: 'AI Escape Mission',
    description: 'Solve AI-generated riddles by speaking answers and racing the countdown in a digital escape room.',
    component: EscapeMission,
  },
  {
    slug: 'debate-arena',
    title: 'AI Debate Arena',
    description: 'Respond to hot-topic prompts and receive argument scores, rebuttals, and optional TTS playback.',
    component: DebateArena,
  },
  {
    slug: 'persona-builder',
    title: 'Build Your AI Persona',
    description: 'Design an AI friend with personality sliders and chat for a minute using streaming responses.',
    component: PersonaBuilder,
  },
  {
    slug: 'vocabulary-rpg',
    title: 'AI Vocabulary RPG',
    description: 'Level up ESL vocabulary by guessing words from definitions and tracking XP progress.',
    component: VocabularyRPG,
  },
  {
    slug: 'parent-corner',
    title: 'Parent Corner',
    description: 'Browse looping mini-talks on AI literacy, safety, and English practice tips for families.',
    component: ParentCorner,
  },
] as const

export type ActivityConfig = (typeof activities)[number]

