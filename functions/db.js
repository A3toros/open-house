const { neon } = require('@neondatabase/serverless')

let cachedSql

const getSql = () => {
  const dbUrl = process.env.NEON_DB_URL
  if (!dbUrl) {
    throw new Error('NEON_DB_URL environment variable is required')
  }
  if (!cachedSql) {
    cachedSql = neon(dbUrl)
  }
  return cachedSql
}

const logEvent = async (sessionId, activitySlug, eventType, payload = {}) => {
  if (!sessionId) {
    return
  }

  const sql = getSql()
  await sql`
    INSERT INTO activity_events (session_id, activity_slug, event_type, payload)
    VALUES (${sessionId}, ${activitySlug}, ${eventType}, ${JSON.stringify(payload)})
  `
}

module.exports = {
  getSql,
  logEvent,
}

