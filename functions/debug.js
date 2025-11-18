const GLOBAL_DEBUG = process.env.DEBUG_FUNCTIONS === 'true'

const normalizeScope = (scope = '') =>
  String(scope)
    .replace(/[^a-z0-9]+/gi, '_')
    .replace(/^_+|_+$/g, '')
    .toUpperCase()

const shouldEnable = (scope, requestFlag) => {
  if (requestFlag === true) return true
  if (GLOBAL_DEBUG) return true
  const envFlag = process.env[`DEBUG_${normalizeScope(scope)}`]
  return envFlag === 'true'
}

const createDebugger = (scope = 'APP', options = {}) => {
  const { requestDebugFlag = false } = options
  const enabled = shouldEnable(scope, requestDebugFlag)
  const entries = []

  const log = (message, meta) => {
    const entry = {
      ts: new Date().toISOString(),
      message,
      ...(meta !== undefined ? { meta } : {}),
    }
    entries.push(entry)
    if (enabled) {
      if (meta !== undefined) {
        console.log(`[${scope}] ${message}`, meta)
      } else {
        console.log(`[${scope}] ${message}`)
      }
    }
  }

  const attachPayload = (payload = {}) => {
    if (!enabled || entries.length === 0) return payload
    return {
      ...payload,
      debug: {
        scope,
        entries,
      },
    }
  }

  return {
    enabled,
    log,
    attachPayload,
    entries,
  }
}

module.exports = { createDebugger }

