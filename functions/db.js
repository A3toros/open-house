const { neon } = require('@neondatabase/serverless')

let cachedSql

const getSql = () => {
  const dbUrl = process.env.NEON_DB_URL
  if (!dbUrl) {
    console.error('NEON_DB_URL environment variable is required')
    throw new Error('NEON_DB_URL environment variable is required')
  }
  if (!cachedSql) {
    try {
      cachedSql = neon(dbUrl)
    } catch (error) {
      console.error('Failed to initialize Neon database connection:', error.message)
      throw new Error(`Database connection failed: ${error.message}`)
    }
  }
  return cachedSql
}

const logEvent = async (sessionId, activitySlug, eventType, payload = {}) => {
  if (!sessionId) {
    return
  }

  try {
    const sql = getSql()
    await sql`
      INSERT INTO activity_events (session_id, activity_slug, event_type, payload)
      VALUES (${sessionId}, ${activitySlug}, ${eventType}, ${JSON.stringify(payload)})
    `
  } catch (error) {
    console.error('Failed to log event (non-fatal):', error.message)
    // Don't throw - logging is optional, function should continue
  }
}

module.exports = {
  getSql,
  logEvent,
}

