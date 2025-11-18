const defaultHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

const json = (statusCode, body = {}, headers = {}) => ({
  statusCode,
  headers: { ...defaultHeaders, ...headers },
  body: JSON.stringify(body),
})

const ok = (body = {}) => json(200, { success: true, ...body })
const created = (body = {}) => json(201, { success: true, ...body })
const badRequest = (message = 'Invalid request') => json(400, { success: false, message })
const serverError = (message = 'Server error', error) =>
  json(500, {
    success: false,
    message,
    error: process.env.NODE_ENV === 'development' ? error : undefined,
  })

module.exports = {
  json,
  ok,
  created,
  badRequest,
  serverError,
}

