## EP & AI Open House – React + Tailwind + Framer Motion + Vite Plan

> **Stack lock-in:** React 18 + Vite + Tailwind CSS + Framer Motion for the frontend, Netlify Functions + Neon Postgres for backend, AssemblyAI for speech-to-text, OpenRouter for all AI completions (text, photo/vision, audio feedback). *No deviations allowed.*

### 1. Source References Reviewed
- `example/vite.config.js` – confirms Root Vite config (React plugin, alias `@`, port 5174).  
- `example/netlify.toml` – shows Netlify build/dev settings, redirects, security headers.  
- `example/functions/process-speaking-audio-ai.js` – canonical pattern for Netlify functions using AssemblyAI + OpenRouter + Neon.  
- `example/database/*.sql` & `views/*.sql` – provide templates for Neon schema + analytics views.

### 2. Project Structure (planned files)
```
open-house/
├─ docs/
│  ├─ ep-ai-open-house-stack-plan.md      # THIS FILE
│  ├─ ep-ai-open-house-plan.md            # feature expansions
│  └─ booth-wireframes/*.md
├─ netlify.toml                           # from example with minor edits
├─ vite.config.js                         # alias + dev server config
├─ tailwind.config.js
├─ postcss.config.js
├─ package.json
├─ src/
│  ├─ main.jsx
│  ├─ App.jsx
│  ├─ styles/
│  │  └─ globals.css                      # Tailwind base + motion-safe helpers
│  ├─ assets/                             # icons, confetti sprites
│  ├─ routes/                             # React Router pages
│  │  ├─ Home.jsx
│  │  └─ booths/
│  │     ├─ VoiceChallenge.jsx
│  │     ├─ PhotoBooth.jsx
│  │     ├─ StoryForge.jsx
│  │     ├─ CultureTranslator.jsx
│  │     ├─ EscapeMission.jsx
│  │     ├─ DebateArena.jsx
│  │     ├─ PersonaBuilder.jsx
│  │     ├─ VocabularyRPG.jsx
│  │     └─ ParentCorner.jsx
│  ├─ components/
│  │  ├─ layout/{HeroSection,ActivityCarousel,AIStatusPanel}.jsx
│  │  ├─ shared/{MicButton,LanguageToggle,RecordingTimer,BilingualCard}.jsx
│  │  └─ modals/{CelebrationModal,PhotoPreviewModal,StoryCoachModal,...}.jsx
│  ├─ contexts/{SessionContext,AudioContext,AIRequestContext}.jsx
│  ├─ hooks/{useRecorder,useAssemblyAI,useOpenRouter,useConfetti}.js
│  ├─ services/{apiClient,assemblyAiService,openRouterService,storageClient}.js
│  ├─ state/{aiStore.ts,escapeMissionMachine.js}
│  └─ utils/{validators,prompts,formatters,latency.js}
├─ public/{favicon.svg,booth-assets/**}
└─ netlify/
   └─ functions/
      ├─ shared/{assemblyai.js,openrouter.js,neon.js,email.js,response.js}
      ├─ voice-challenge.js
      ├─ photo-booth.js
      ├─ send-photo-email.js
      ├─ story-forge.js
      ├─ story-ending.js
      ├─ culture-translator.js
      ├─ escape-mission.js
      ├─ debate-arena.js
      ├─ persona-builder.js
      ├─ persona-chat.js
      ├─ vocabulary-rpg.js
      ├─ parent-corner.js
      └─ cleanup-media.js   # scheduled
```

### 3. Core Technologies (no substitutions)
- **Frontend:** React 18 + Vite, Tailwind CSS, Framer Motion, React Router, React Query.
- **Backend Runtime:** Netlify Functions (Node 18) using CommonJS modules, pattern identical to `process-speaking-audio-ai.js`.
- **Database:** Neon serverless Postgres via `@neondatabase/serverless`; use SQL templates from `example/database`.
- **AI Services:** OpenRouter API (single key) for all inference types; AssemblyAI API for transcription before GPT calls; optional lightweight TTS via OpenRouter speech models.
- **Storage:** Netlify Large Media or S3-compatible bucket for photo/audio blobs (links persisted in Neon).

### 4. Environment Variables
```
VITE_OPENROUTER_API_KEY=***
VITE_ASSEMBLYAI_API_KEY=***
VITE_NEON_DB_URL=postgres://...
VITE_API_BASE=/api
OPENROUTER_API_KEY=***          # used inside Netlify functions
ASSEMBLYAI_API_KEY=***
NEON_DATABASE_URL=postgres://...
EMAIL_PROVIDER_KEY=***
STORAGE_BUCKET_URL=***
```
- `.env` for local Vite, `.env.production` managed by Netlify for functions.

### 5. AI Model Selection (low latency)
- **Text/Reasoning:** `mistralai/mistral-nemo-mini` and `meta-llama/llama-3.1-8b-instruct` via OpenRouter for <2 s responses.
- **Speech Analysis:** `openai/gpt-4o-mini` (already proven in `process-speaking-audio-ai.js`) for rubric-heavy scoring.
- **Vision/Photo Stylization:** `flux/dev` or `stability/illustration-diffusion` for fast stylized portraits.
- **Story/Creative Variations:** `google/gemini-flash-1.5` via OpenRouter when streaming is needed; fallback to `mistral-small-latest`.
- **TTS / Audio Feedback:** `elevenlabs/eleven-monolingual-v1` equivalent or OpenRouter’s lightweight TTS offerings; cache outputs per session.

### 6. Shared AI Pipeline
1. React booth captures media (mic/photo/text) using browser APIs.
2. Client sends payload to Netlify Function via `/api/*` (proxy defined in `netlify.toml`).
3. Function uploads audio to AssemblyAI, polls transcript (reuse logic from `process-speaking-audio-ai.js`).
4. Feed transcript + metadata into OpenRouter model; for photos, send prompt + image data to selected vision model.
5. Persist request + response (JSONB) to Neon, return structured payload to frontend.
6. Frontend reacts with Framer Motion (celebrations, bilingual cards) and caches results locally (React Query).

### 7. Database Schema Highlights
```
visitors(id PK, name, guardian_email, locale, created_at)
sessions(id PK, visitor_id FK, booth_slug, status, metadata, started_at, completed_at)
activity_events(id PK, session_id FK, activity, input_type, payload JSONB, ai_response JSONB, latency_ms, created_at)
transcripts(id PK, session_id FK, activity, transcript, confidence, locale, assemblyai_job_id, created_at)
voice_predictions(id PK, session_id FK, profession_en, profession_th, suggested_skills JSONB, overall_score, rubric JSONB, created_at)
stories(id PK, session_id FK, genre, traits, plot, base_story, ending_variations JSONB, grammar_tips JSONB, created_at)
photos(id PK, session_id FK, original_url, styled_url, profession, email_sent, created_at)
debates(id PK, session_id FK, prompt, student_position, ai_feedback JSONB, rebuttal_audio_url, scores JSONB, created_at)
escape_puzzles(id PK, session_id FK, riddle JSONB, answer, solved, attempts, hints_used, created_at)
vocabulary_runs(id PK, session_id FK, level, definition, expected_word, user_answer, correct, xp_earned, created_at)
```
- Use Neon views for aggregated stats; reference `example/database/views/*.sql` for formatting.

### 8. Netlify Function Contracts
| File | Route | Payload | AI Calls | Notes |
| --- | --- | --- | --- | --- |
| `voice-challenge.js` | `POST /api/voice-challenge` | `{ audioBlob, locale, prompt }` | AssemblyAI, OpenRouter | Returns bilingual profession + rubric. |
| `photo-booth.js` | `POST /api/photo-booth` | `{ photoDataUrl, profession }` | OpenRouter vision | Stores image URLs in Neon/storage. |
| `send-photo-email.js` | `POST /api/send-photo-email` | `{ photoId, email }` | Email provider | Links styled portrait + story. |
| `story-forge.js` | `POST /api/story-forge` | `{ sliders, starterText|audio }` | AssemblyAI (optional), OpenRouter | Returns 6–8 sentence story + grammar tips. |
| `story-ending.js` | `POST /api/story-ending` | `{ storyId, mood }` | OpenRouter | Rewrites ending only. |
| `culture-translator.js` | `POST /api/culture-translator` | `{ audioBlob }` | AssemblyAI, OpenRouter | Finds global analog + TTS audio. |
| `escape-mission.js` | `POST /api/escape-mission` | `{ sessionId, action, answer? }` | OpenRouter | Generates riddles, validates answers. |
| `debate-arena.js` | `POST /api/debate-arena` | `{ audioBlob, promptId }` | AssemblyAI, OpenRouter | Returns rebuttal text + optional audio. |
| `persona-builder.js` | `POST /api/persona-builder` | `{ sliders }` | OpenRouter | Generates persona spec. |
| `persona-chat.js` | `POST /api/persona-chat` | `{ personaId, message }` | OpenRouter | Streams chat responses. |
| `vocabulary-rpg.js` | `POST /api/vocabulary-rpg` | `{ action, answer? }` | OpenRouter | Delivers definitions, scores guesses. |
| `parent-corner.js` | `GET /api/parent-corner` | N/A | Neon | Returns rotating safety content. |
| `cleanup-media.js` | Scheduled | N/A | Storage, Neon | Deletes old media, anonymizes data. |

### 9. Frontend Interaction Patterns
- **React Router** for booth navigation; each booth is a route under `/booth/:slug`.
- **Tailwind** for rapid styling with custom theme tokens; configure `motion-safe` classes to guard animations.
- **Framer Motion** for hero waves, card hover, confetti, random compliment ticker, slider transitions, radar charts.
- **React Query** for API state + caching; `AIRequestContext` handles streaming updates and exposes latency metrics to UI badges.
- **Audio & Media Handling**: `useRecorder` hook wraps MediaRecorder; `useAssemblyAI` handles status updates (recording → uploading → transcribing).

### 10. Performance & Latency Strategy
- Use low-parameter models (≤8B) except when rubric quality demands `gpt-4o-mini`.
- Stream story/debate text via SSE for better perceived responsiveness.
- Preload booth data & UI assets using Vite’s dynamic imports.
- Cache AssemblyAI transcripts keyed by audio hash to avoid duplicate billings.
- Instrument Netlify functions with latency logs (`console.log('latency', Date.now() - start)`), push to Neon `activity_events`.

### 11. Milestones
1. **Scaffold & Config (React/Vite/Tailwind/Framer Motion)** – align with `example/vite.config.js`.
2. **Netlify Function Template** – clone `process-speaking-audio-ai.js` into `netlify/functions/shared`.
3. **AssemblyAI + OpenRouter Wrapper** – shared module with retries/backoff.
4. **Neon Schema Migration** – run SQL above using Neon console.
5. **Booth Implementations** – build in order: Voice Challenge, Story Forge, Photo Booth, Debate Arena, Escape Mission, Persona Builder, Vocabulary RPG, Culture Translator, Parent Corner.
6. **QA & Deployment** – Netlify preview, real-device tests, fallback flows.

### 12. Acceptance Criteria
- Entire stack uses **React + Tailwind + Framer Motion + Vite**; no other frontend framework introduced.
- All AI invocations route through OpenRouter (single API key) except transcription through AssemblyAI.
- Each booth delivers bilingual feedback, low-latency responses, and celebratory animations.
- Netlify functions adhere 1:1 with plan; `.toml` rewrites ensure `/api/*` hits functions locally & in production.
- Neon stores every AI interaction for later analysis; scheduled cleanup keeps storage within budget.

### 13. Environment & Deployment Guide
1. **Local prerequisites**  
   - Node 20+, npm 10+, Netlify CLI (`npm i -g netlify-cli`).  
   - `cp .env.example .env` then populate:  
     ```
     VITE_OPENROUTER_API_KEY=...       # for Vite dev server
     VITE_ASSEMBLYAI_API_KEY=...
     VITE_NEON_DB_URL=postgres://...   # read-only if needed
     VITE_API_BASE=/api
     
     # Functions (.env or Netlify dashboard)
     OPENROUTER_API_KEY=...
     ASSEMBLYAI_API_KEY=...
     NEON_DATABASE_URL=postgres://...  # full access
     RESEND_API_KEY=...                # email sender
     EMAIL_PROVIDER_KEY=...
     STORAGE_BUCKET_URL=...
     ```
2. **Running locally**  
   - `npm install`  
   - `netlify dev` (proxies Vite:5173 -> 8888 and `/api/*` -> local functions).  
   - `npm run build && npm run preview` for production check.  
3. **Deploying to Netlify**  
   - `netlify login`, `netlify init` (if not already connected).  
   - Set environment variables in Netlify UI or via `netlify env:set`.  
   - `git push` triggers build; fallback: `netlify deploy --build` (preview) then `netlify deploy --prod`.  
4. **Post-deploy checks**  
   - Verify environment variables on Netlify match `.env` values (OpenRouter/AssemblyAI/Neon keys).  
   - Ensure `functions/package.json` dependencies are installed automatically by Netlify.

### 14. Testing & QA Checklist
- **Voice Challenge**: record 5‑second clip, confirm transcript, bilingual feedback card, confetti, Neon entry in `voice_predictions`.  
- **Photo Booth**: start camera, capture image, generate stylized portrait, send email via `/api/send-photo-email`.  
- **Story Forge**: adjust sliders + starter text, validate grammar tips + alternate endings, test "Change ending" moods.  
- **Culture Translator**: input Thai custom, ensure paired global tradition + history log, verify narration button.  
- **Escape Mission**: start mission, timer counts down, hints reduce lives, API validates answers.  
- **Debate Arena**: submit transcript stub (or typed text), check score bars + polite rebuttal text.  
- **Persona Builder**: generate persona, chat window logs AI/student messages, new persona saved in Neon.  
- **Vocabulary RPG**: confirm XP/lives/streak updates, history list refreshes, API awards XP.  
- **Parent Corner**: carousel pulls Netlify/Neon content; fallback tips render offline.  
- **System checks**:  
  - `npm run lint && npm run build` before every deploy.  
  - Netlify logs show latency + event logging; scheduler cleans media per plan.  
  - Kiosk mode: run in Chromium full-screen with OS sleep disabled; ensure mouse/keyboard shortcuts are accessible for staff.

