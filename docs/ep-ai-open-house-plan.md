## EP & AI – Empowering Future Minds Web App Plan

### 1. Goal & Theme Alignment
- Launch a Vite-powered React + Tailwind + Framer Motion experience that walks families through nine AI activities (all running on a single showcase PC) demonstrating English mastery and creativity.
- Keep every interaction bilingual (EN/TH) while emphasizing fast, lightweight AI feedback powered by OpenRouter models and a single multi-modal API surface.
- Showcase AssemblyAI → GPT pipelines so visitors understand how voice, photo, text, and video inputs are analyzed in real time.

### 2. Confirmed Tech Stack (do not deviate)
- Frontend: React 18 + Vite (`example/vite.config.js`), Tailwind CSS (`src/styles/globals.css`), Framer Motion for animations, React Router + carousel navigation for activities.
- Backend: Netlify Functions (`exports.handler` style seen in `example/functions/process-speaking-audio-ai.js`), Neon serverless Postgres via `@neondatabase/serverless`.
- AI & Media: AssemblyAI for transcription, OpenRouter (single API key) for text + vision + audio feedback, lightweight diffusion/vision models for photo output, email agent via Netlify function + provider (Resend/Brevo).
- Deployment: Netlify (`example/netlify.toml` redirects / API proxy), environment variables via Netlify dashboard or local `.env`.

### 3. Environment & Configuration
- `.env` template: `VITE_OPENROUTER_API_KEY`, `VITE_ASSEMBLYAI_API_KEY`, `VITE_API_BASE=/api`, `VITE_NEON_DB_URL`, `NETLIFY_DEV=1`.
- Netlify Dev mirrors Vite server (port 5174) with `/api/*` rewrites to `.netlify/functions/:splat`.
- Tailwind setup: enforce base layers in `src/styles/globals.css`, add motion-safe utilities for Framer Motion triggers.
- Version control: keep plan + future features in `docs/` for traceability.

### 4. Project Structure & Files (planned)
```
open-house/
├─ docs/
│  ├─ ep-ai-open-house-plan.md
│  └─ wireframes/*.md (per activity)
├─ netlify.toml
├─ vite.config.js
├─ tailwind.config.js
├─ postcss.config.js
├─ package.json
├─ src/
│  ├─ main.jsx
│  ├─ App.jsx
│  ├─ index.css
│  ├─ styles/globals.css
│  ├─ assets/ (icons, confetti sprites)
│  ├─ routes/
│  │  ├─ Home.jsx
│  │  ├─ ActivityLayout.jsx
│  │  ├─ activities/
│  │  │  ├─ VoiceChallenge.jsx
│  │  │  ├─ PhotoBooth.jsx
│  │  │  ├─ StoryForge.jsx
│  │  │  ├─ CultureTranslator.jsx
│  │  │  ├─ EscapeMission.jsx
│  │  │  ├─ DebateArena.jsx
│  │  │  ├─ PersonaBuilder.jsx
│  │  │  ├─ VocabularyRPG.jsx
│  │  │  └─ ParentCorner.jsx
│  ├─ components/
│  │  ├─ layout/
│  │  │  ├─ HeroSection.jsx
│  │  │  ├─ ActivityCarousel.jsx
│  │  │  └─ ParentCornerLoop.jsx
│  │  ├─ shared/
│  │  │  ├─ MicButton.jsx
│  │  │  ├─ RecordingTimer.jsx
│  │  │  ├─ LanguageToggle.jsx
│  │  │  ├─ StatusBadge.jsx
│  │  │  ├─ LoadingSpinner.jsx
│  │  │  ├─ BilingualCard.jsx
│  │  │  └─ EmailForm.jsx
│  │  └─ modals/
│  │     ├─ CelebrationModal.jsx
|  |     ├─ PhotoPreviewModal.jsx
|  |     ├─ StoryCoachModal.jsx
|  |     ├─ HintModal.jsx
|  |     ├─ DebateFeedbackModal.jsx
|  |     ├─ PersonaChatModal.jsx
|  |     ├─ VocabularyLevelUpModal.jsx
|  |     └─ ParentResourcesModal.jsx
│  ├─ contexts/
│  │  ├─ SessionContext.jsx
│  │  ├─ AudioContext.jsx
│  │  └─ AIRequestContext.jsx
│  ├─ hooks/
│  │  ├─ useRecorder.js
│  │  ├─ useAssemblyAI.js
│  │  ├─ useOpenRouter.js
│  │  ├─ useConfetti.js
│  │  └─ useBilingualText.js
│  ├─ services/
│  │  ├─ apiClient.js
│  │  ├─ storageClient.js
│  │  ├─ assemblyAiService.js
│  │  └─ openRouterService.js
│  ├─ state/
│  │  ├─ aiStore.ts (Zustand or simple context)
│  │  └─ escapeMissionMachine.js (XState)
│  └─ utils/
│     ├─ formatters.js
│     ├─ scoring.js
│     ├─ prompts.js
│     └─ validators.js
├─ public/
│  ├─ favicon.svg
│  └─ activity-assets/**
└─ netlify/
   └─ functions/
      ├─ shared/
      │  ├─ assemblyai.js
      │  ├─ openrouter.js
      │  ├─ neon.js
      │  └─ email.js
      ├─ voice-challenge.js
      ├─ photo-booth.js
      ├─ send-photo-email.js
      ├─ story-forge.js
      ├─ culture-translator.js
      ├─ escape-mission.js
      ├─ debate-arena.js
      ├─ persona-builder.js
      ├─ vocabulary-rpg.js
      ├─ parent-corner.js
      └─ cleanup-media.js (scheduled)
```
- The `netlify/functions` directory will mirror the conventions demonstrated in `example/functions/process-speaking-audio-ai.js` (same logging, retry, headers).
- Add `scripts/generate-sample-data.js` for seeding Neon with activity prompts.

### 5. Component & Modal Inventory
- **Layout Components**: `HeroSection`, `ActivityCarousel`, `ActivityLayout`, `AIStatusPanel`, `ParentCornerLoop`.
- **Shared Controls**: `MicButton`, `LanguageToggle`, `RecordingTimer`, `StatusBadge`, `StepperDots`, `AudioWaveform`, `StorySliderGroup`, `GenreSelect`, `PersonaSlider`.
- **Modals (all React + Tailwind + Framer Motion)**:
  - `CelebrationModal` – triggered after recordings, runs confetti animation + random compliment word sequence.
  - `PhotoPreviewModal` – shows captured image, retake + accept, plus email input section.
  - `StoryCoachModal` – surfaces grammar suggestions + “Change Ending” CTA.
  - `HintModal` – used by Escape Mission for AI hints (with countdown lock).
  - `DebateFeedbackModal` – radar chart + audio playback for rebuttal.
  - `PersonaChatModal` – floating window for persona conversations with streaming text bubbles.
  - `VocabularyLevelUpModal` – gamified badge animation.
  - `ParentResourcesModal` – PDF links, QR code, schedule sign-up.
- **Booth-Specific Components**: `VoiceComplimentTicker`, `ProfessionCard`, `FuturePhotoCard`, `StoryVariantList`, `CultureComparisonCard`, `EscapePuzzleBoard`, `DebatePromptCard`, `PersonaProfileCard`, `VocabularyProgressBar`.

### 6. Database Schema (Neon Postgres)
> Keep a shared backbone (`visitors`, `sessions`, `activity_events`, `media_assets`) plus purpose-built tables for each activity so educators can query results independently.
```
CREATE TABLE visitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name TEXT,
  guardian_email TEXT,
  locale TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id UUID REFERENCES visitors(id) ON DELETE CASCADE,
  current_activity TEXT,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE activity_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  activity_slug TEXT,
  event_type TEXT,
  payload JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  activity_slug TEXT,
  media_type TEXT,
  original_url TEXT,
  processed_url TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE voice_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  profession_en TEXT,
  profession_th TEXT,
  suggested_skills JSONB,
  rubric JSONB,
  overall_score NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  genre TEXT,
  traits TEXT,
  plot TEXT,
  base_story TEXT,
  ending_variations JSONB,
  grammar_tips JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE culture_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  thai_custom TEXT,
  global_custom TEXT,
  explanation TEXT,
  tts_audio_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE photo_creations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  profession TEXT,
  original_url TEXT,
  styled_url TEXT,
  email_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE escape_puzzles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  riddle JSONB,
  answer TEXT,
  solved BOOLEAN DEFAULT false,
  attempts INTEGER DEFAULT 0,
  hints_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE debate_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  prompt TEXT,
  student_summary TEXT,
  ai_feedback JSONB,
  rebuttal_audio_url TEXT,
  scores JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE personas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  persona_spec JSONB,
  conversation_log JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE vocabulary_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  level TEXT,
  definition TEXT,
  expected_word TEXT,
  user_answer TEXT,
  correct BOOLEAN,
  xp_earned INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);
```
- Aggregation views (modeled on `example/database/views/*`) can summarize per-activity stats across these tables.

### 7. API Surface (Netlify Functions)
| Endpoint | Function | Purpose | External Calls |
| --- | --- | --- | --- |
| `POST /api/voice-challenge` | `voice-challenge.js` | Accept base64 audio, run AssemblyAI transcription, call OpenRouter for profession feedback, persist `voice_predictions` | AssemblyAI, OpenRouter, Neon |
| `POST /api/voice-challenge/status` | `voice-challenge-status.js` | Poll long-running jobs (if queued) | Neon |
| `POST /api/photo-booth` | `photo-booth.js` | Upload photo to storage, call vision/diffusion model, store `photos` | Storage bucket, OpenRouter |
| `POST /api/send-photo-email` | `send-photo-email.js` | Trigger email with links/printables | Email provider, Neon |
| `POST /api/story-forge` | `story-forge.js` | Generate base story + grammar tips from sliders/text | AssemblyAI (optional), OpenRouter, Neon |
| `POST /api/story-ending` | `story-ending.js` | Request alternate ending | OpenRouter, Neon |
| `POST /api/culture-translator` | `culture-translator.js` | Transcribe Thai custom, fetch matching tradition + TTS audio | AssemblyAI, OpenRouter |
| `POST /api/escape-mission` | `escape-mission.js` | Generate riddles and validate spoken answers | OpenRouter, Neon |
| `POST /api/debate-arena` | `debate-arena.js` | Score debate responses + produce rebuttal text/audio | AssemblyAI, OpenRouter |
| `POST /api/persona-builder` | `persona-builder.js` | Build persona spec + stream responses | OpenRouter |
| `POST /api/persona-chat` | `persona-chat.js` | Continue persona conversation | OpenRouter |
| `POST /api/vocabulary-rpg` | `vocabulary-rpg.js` | Provide definitions, validate guesses, track XP | OpenRouter, Neon |
| `GET /api/parent-corner` | `parent-corner.js` | Serve rotating safety content | Neon |
| `POST /api/log-event` | `log-event.js` | Generic analytics logging for `activity_events` | Neon |
| `POST /api/cleanup-media` | `cleanup-media.js` | Scheduled cleanup of stale media | Storage bucket, Neon |
- All functions follow Netlify pattern in `example/functions/process-speaking-audio-ai.js`: parse body, validate, call `shared` helpers, return CORS-friendly responses.

### 8. High-Level Architecture
1. **Client (Vite app)**  
   - Layout split: `Hero`, `ActivityCarousel`, `ActivityDetail`, `AIStatusPanel`, `ParentCorner`.  
   - Runs entirely on one event PC; visitors cycle through activities via the carousel/tabs rather than moving between physical booths.  
   - Global contexts: `SessionContext` (visitor id, language), `AudioContext` (mic permissions), `AIRequestContext` (status, latency metrics).
2. **Single API Gateway (Netlify Functions)**  
   - Endpoint pattern: `/api/{activity}`; each function handles validation, Neon persistence, AssemblyAI upload, OpenRouter inference, email dispatch, etc.  
   - Reuse helper modules for AssemblyAI polling, OpenRouter fetch, Neon SQL queries (reference `process-speaking-audio-ai.js` for structure, retries, logging).
3. **Database (Neon)**  
   - Use JSONB columns for AI payloads to avoid schema churn.  
   - Views + analytics for booth performance dashboards.
4. **Media Storage**  
   - Temporary assets (photos/audio) stored in Netlify Large Media or S3-compatible bucket; store signed URLs in Neon.

### 9. Shared AI Workflow
1. Capture input (mic/photo/text) in React.  
2. Upload raw media to AssemblyAI (audio) or storage bucket (images).  
3. Netlify Function orchestrates:  
   - For voice: `AssemblyAI -> transcript -> OpenRouter (GPT-4o-mini or Mistral)`.  
   - For text/photo/video: send structured prompts to OpenRouter (vision or instruction models).  
4. Persist transcripts + feedback in Neon; stream partial results to client via SSE for responsiveness.  
5. Emit UI states: `recording`, `transcribing`, `analyzing`, `celebrate`.

### 10. Model Selection (low latency & lightweight)
- **Text conversation, debate, story writing:**  
  - `anthropic/claude-3-haiku` for fast instruction-following chats (Story Forge, Persona Builder, Debate Arena tips).  
  - `inclusionai/ling-1t` for richer story variants or advanced writing when latency budget allows.  
  - `mistralai/mistral-nemo-mini` or `meta-llama/llama-3.1-8b-instruct` remain fallbacks for ultra-low latency prompts.
- **Voice feedback & pronunciation:** `openai/gpt-4o-mini` (per `process-speaking-audio-ai.js`) after AssemblyAI transcripts, ensuring rubric-scoring quality.  
- **Vision & image generation:**  
  - `google/gemini-2.5-flash-image-preview` for AI Photo Booth (text → image).  
  - `stability/illustration-diffusion` or `flux/dev` as cost-effective fallbacks when we need alternate styles.  
- **Vision understanding / captions:** `nousresearch/nous-hermes-2-vision-7b` or `allenai/molmo-7b-d` for interpreting photos/drawings, e.g., culture comparisons or persona inspiration.  
- **Audio / speech:** Continue uploading raw audio to AssemblyAI for transcription; any OpenRouter model supporting `input_audio` can also be explored for future direct pipelines.  
- **Audio playback:** Stream ready-made speech from OpenRouter TTS-capable models (no local synthesis), caching returned audio URLs per session for replay.

### 11. UI & Interaction Plan
- **Routing**: hero page introduces theme, CTA buttons per activity; each activity is a nested route (and part of the single ActivityCarousel) with shared HUD (timer, AI status, bilingual toggle).  
- **Design System**: Tailwind utility classes + custom tokens (`--ep-primary`, `--ep-accent`). Use `motion.div` wrappers for hero waves, confetti, slider transitions.  
- **State Machines**: XState or React hooks to coordinate recording statuses and AI fetch states, ensuring consistent spinner + celebration sequences.  
- **Accessibility**: Provide captions, high-contrast mode, keyboard triggers for non-mic interactions.

### 12. Activity Blueprints
1. **AI Voice Challenge – “Speak to the Future”**  
   - Component: `VoiceChallenge.tsx` with mic controls, bilingual prompt, live waveform (Tailwind + canvas).  
   - Flow: record → upload → show celebratory Framer Motion confetti → random compliment word transition (keyframes) → display English + Thai predictions (two-column card).  
   - OpenRouter prompt: request student profile + future profession + bilingual feedback; store `profession_en/th`, `suggested_skills`, `confidence`.  

2. **AI Photo Booth – “Me in the Future Career”**  
   - Capture via `MediaDevices.getUserMedia`; allow retakes.  
   - Inputs: photo, desired profession text.  
   - Netlify function composites prompt for quick diffusion model to stylize portrait; store CDN URL.  
   - Provide `Print` (window.print) + `Email me` button (calls `/api/send-photo-email`). Email agent uses provider API and attaches image link + career story.  

3. **AI Story Forge – “Write With the Machine”**  
   - Sliders built with Tailwind + `@headlessui/react`.  
   - Flow: user picks genre/traits/plot, writes starter sentence or records audio that we transcribe.  
   - OpenRouter generates 6–8 sentence story + grammar coach tips; `Change Ending` button resubmits with existing story + slider state to request new ending variant (funny/scary/sad/nonsense).  
   - Save story + endings in Neon for printouts.

4. **AI Culture Translator – “English Around the World”**  
   - Prompt: share Thai custom; AssemblyAI transcribes.  
   - AI returns summary + matching global tradition, plus short mp3 via TTS for playback.  
   - UI displays side-by-side comparison cards, includes “Play audio” button.

5. **AI Escape Mission – Digital Puzzle Race**  
   - Build React mini-game screens with riddles delivered via OpenRouter (JSON { riddle, answer }).  
   - Students respond by speech; transcript checked against answer (fuzzy match Levenshtein).  
   - Timer + hint button (Framer Motion pulse).  
   - Persist progress to Neon to show leaderboard.

6. **AI Debate Arena**  
   - Random prompt card with Framer Motion flip animation.  
   - Student speaks; AI scores argument quality and returns polite rebuttal text + optional audio TTS.  
   - Display radar chart (Tailwind + `react-chartjs`) for persuasiveness, clarity, evidence, tone.

7. **Build Your AI Persona**  
   - Slider controls for personality/purpose; chat interface uses streaming responses.  
   - Persona spec stored in Neon and reused for 1-minute chat session.  
   - Provide “Continue” mic button to send follow-ups without resetting context.

8. **AI Vocabulary RPG**  
   - Play button triggers definition speech bubble; student speaks guessed word.  
   - Compare transcript word with answer (case-insensitive) and track XP; show level badges.  
   - Provide hints (synonym, first letter) for middle-school ESL difficulty.

9. **Parent Corner – “AI Safety & Future Careers”**  
   - Autoplay loop using React carousel; content fetched from Neon or static JSON.  
   - Provide downloadable PDF + QR code to school resources.  
   - Include CTA to sign up for AI literacy newsletter (Netlify form submission).

### 13. Data Persistence & Background Jobs
- **Common payload**: `{ activityId, visitorId, mediaUrl?, transcript?, userSelections, locale }`.  
- **Responses** include `status`, `feedback`, `displayBlocks` (structured text), `audioUrl` if TTS generated, `meta.latencyMs`.  
- Implement Neon stored procedures for logging events (SQL templates from `example/database/views`).  
- Add background job (Netlify Scheduled Function) to purge media older than 24h and anonymize stale visitor data.

### 14. Animations & Feedback Patterns
- Use Framer Motion variants for: hero entrance, booth cards hover, mic pulse, confetti explosion, random compliment fade.  
- Tailwind `motion-safe` classes ensure reduced-motion compliance.  
- For loading states, show radial progress that transitions to celebration state once `feedback` ready; keep spinner if API pending.

### 15. Performance & Reliability
- Prefetch Netlify function endpoints via React Query; use optimistic UI for compliments/animations before AI returns.  
- Cache AssemblyAI + OpenRouter responses per session to prevent duplicate billing.  
- Use streaming text responses for stories/debates to keep engagement.  
- Monitor function logs; enable retries/backoff similar to sample `process-speaking-audio-ai.js`.  
- Provide offline fallback messages (static prompt suggestions) if API fails.

### 16. Milestones
1. **Week 1**: Set up Vite/Tailwind/Framer Motion scaffold, routing, shared contexts, Netlify dev flow.  
2. **Week 2**: Implement AssemblyAI + OpenRouter pipeline wrapper, Neon schema migrations, base Voice Challenge + Story Forge.  
3. **Week 3**: Build remaining booths (Photo Booth with email, Escape Mission, Debate Arena, Persona, Vocabulary RPG).  
4. **Week 4**: Polish animations, bilingual content, parent corner, QA, deploy on Netlify, rehearse demo scripts.

### 17. Next Steps
- Confirm API quotas (AssemblyAI, OpenRouter) and pick final model IDs.  
- Flesh out UI wireframes per booth; attach to this doc.  
- Begin implementing shared Netlify function template reusing transcription + analysis utilities.

