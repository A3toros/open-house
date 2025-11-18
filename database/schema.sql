-- EP & AI – Empowering Future Minds
-- Neon Postgres schema (run separately via user)

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS visitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name TEXT,
  guardian_email TEXT,
  locale TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id UUID REFERENCES visitors(id) ON DELETE CASCADE,
  current_activity TEXT,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_sessions_visitor ON sessions(visitor_id);
CREATE INDEX IF NOT EXISTS idx_sessions_started_at ON sessions(started_at DESC);

CREATE TABLE IF NOT EXISTS activity_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  activity_slug TEXT,
  event_type TEXT,
  payload JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_activity_events_session ON activity_events(session_id);
CREATE INDEX IF NOT EXISTS idx_activity_events_slug ON activity_events(activity_slug);
CREATE INDEX IF NOT EXISTS idx_activity_events_created_at ON activity_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_events_payload_gin ON activity_events USING gin(payload);

CREATE TABLE IF NOT EXISTS media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  activity_slug TEXT,
  media_type TEXT,
  original_url TEXT,
  processed_url TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_media_assets_session ON media_assets(session_id);
CREATE INDEX IF NOT EXISTS idx_media_assets_activity ON media_assets(activity_slug);

CREATE TABLE IF NOT EXISTS voice_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  profession_en TEXT,
  profession_th TEXT,
  suggested_skills JSONB,
  rubric JSONB,
  overall_score NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_voice_predictions_session ON voice_predictions(session_id);

CREATE TABLE IF NOT EXISTS photo_creations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  profession TEXT,
  original_url TEXT,
  styled_url TEXT,
  email_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_photo_creations_session ON photo_creations(session_id);

CREATE TABLE IF NOT EXISTS stories (
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
CREATE INDEX IF NOT EXISTS idx_stories_session ON stories(session_id);
CREATE INDEX IF NOT EXISTS idx_stories_genre ON stories(genre);

CREATE TABLE IF NOT EXISTS culture_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  thai_custom TEXT,
  global_custom TEXT,
  explanation TEXT,
  tts_audio_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_culture_matches_session ON culture_matches(session_id);

CREATE TABLE IF NOT EXISTS escape_puzzles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  riddle JSONB,
  answer TEXT,
  solved BOOLEAN DEFAULT false,
  attempts INTEGER DEFAULT 0,
  hints_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_escape_puzzles_session ON escape_puzzles(session_id);
CREATE INDEX IF NOT EXISTS idx_escape_puzzles_solved ON escape_puzzles(solved);
CREATE INDEX IF NOT EXISTS idx_escape_puzzles_riddle_gin ON escape_puzzles USING gin(riddle);

CREATE TABLE IF NOT EXISTS debate_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  prompt TEXT,
  student_summary TEXT,
  ai_feedback JSONB,
  rebuttal_audio_url TEXT,
  scores JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_debate_sessions_session ON debate_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_debate_sessions_prompt ON debate_sessions(prompt);

CREATE TABLE IF NOT EXISTS personas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  persona_spec JSONB,
  conversation_log JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_personas_session ON personas(session_id);
CREATE INDEX IF NOT EXISTS idx_personas_persona_spec_gin ON personas USING gin(persona_spec);

CREATE TABLE IF NOT EXISTS vocabulary_runs (
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
CREATE INDEX IF NOT EXISTS idx_vocabulary_runs_session ON vocabulary_runs(session_id);
CREATE INDEX IF NOT EXISTS idx_vocabulary_runs_correct ON vocabulary_runs(correct);

CREATE TABLE IF NOT EXISTS ai_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_hash TEXT UNIQUE,
  activity_slug TEXT,
  payload JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ai_cache_slug ON ai_cache(activity_slug);

-- Example daily aggregation (view)
CREATE OR REPLACE VIEW activity_events_daily AS
SELECT
  DATE(created_at) AS event_date,
  activity_slug,
  COUNT(*) AS total_events
FROM activity_events
GROUP BY event_date, activity_slug;

-- Example view to aggregate recent activity results
CREATE OR REPLACE VIEW activity_overview AS
SELECT
  s.id AS session_id,
  s.current_activity,
  v.display_name,
  a.created_at AS event_time,
  a.event_type,
  a.payload
FROM sessions s
JOIN activity_events a ON a.session_id = s.id
LEFT JOIN visitors v ON v.id = s.visitor_id;

