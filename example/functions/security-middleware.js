/**
 * Security Middleware for Netlify Functions
 * Simple brute force protection
 */

// Simple rate limiting against brute force
const rateLimit = new Map();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 200; // Simple limit per IP

/**
 * Simple rate limit check against brute force
 * @param {string} ip - IP address
 * @returns {boolean} - true if within limit, false if exceeded
 */
function checkRateLimit(ip) {
  const now = Date.now();
  const requests = rateLimit.get(ip) || [];
  const recentRequests = requests.filter(time => now - time < RATE_LIMIT_WINDOW);
  
  if (recentRequests.length >= MAX_REQUESTS) {
    return false;
  }
  
  recentRequests.push(now);
  rateLimit.set(ip, recentRequests);
  return true;
}

/**
 * Get client IP address from event
 * @param {Object} event - Netlify function event
 * @returns {string} - Client IP address
 */
function getClientIP(event) {
  return event.headers['x-forwarded-for'] || 
         event.headers['x-real-ip'] || 
         event.headers['client-ip'] || 
         event.headers['cf-connecting-ip'] || 
         'unknown';
}


/**
 * Validate input data against schema
 * @param {Object} data - Input data to validate
 * @param {Object} schema - Validation schema
 * @returns {Object} - Validation result
 */
function validateInput(data, schema) {
  const errors = [];
  
  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Invalid input data'] };
  }
  
  // Check required fields
  if (schema.required) {
    for (const field of schema.required) {
      if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
        errors.push(`Field '${field}' is required`);
      }
    }
  }
  
  // Check field types
  if (schema.fields) {
    for (const [field, rules] of Object.entries(schema.fields)) {
      if (data[field] !== undefined) {
        if (rules.type && typeof data[field] !== rules.type) {
          errors.push(`Field '${field}' must be of type ${rules.type}`);
        }
        
        if (rules.minLength && data[field].length < rules.minLength) {
          errors.push(`Field '${field}' must be at least ${rules.minLength} characters`);
        }
        
        if (rules.maxLength && data[field].length > rules.maxLength) {
          errors.push(`Field '${field}' must be no more than ${rules.maxLength} characters`);
        }
        
        if (rules.pattern && !rules.pattern.test(data[field])) {
          errors.push(`Field '${field}' format is invalid`);
        }
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Sanitize string input to prevent XSS
 * @param {string} input - Input string
 * @returns {string} - Sanitized string
 */
function sanitizeString(input) {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
}

/**
 * Enhanced CORS headers with security improvements
 * @param {string} origin - Allowed origin
 * @returns {Object} - CORS headers
 */
function getCORSHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin || process.env.ALLOWED_ORIGIN || 'https://mathayomwatsing.netlify.app',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400', // Cache preflight for 24 hours
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block'
  };
}

/**
 * Security middleware wrapper
 * @param {Function} handler - Function handler
 * @param {Object} options - Security options
 * @returns {Function} - Wrapped handler
 */
function withSecurity(handler, options = {}) {
  return async function(event, context) {
    try {
      // Get client IP
      const clientIP = getClientIP(event);
      
      // Simple brute force protection
      if (!checkRateLimit(clientIP)) {
        return {
          statusCode: 429,
          headers: getCORSHeaders(),
          body: JSON.stringify({
            success: false,
            message: 'Too many requests. Please try again later.',
            error: 'RATE_LIMIT_EXCEEDED'
          })
        };
      }
      
      // Validate request size
      if (event.body && event.body.length > (options.maxBodySize || 10 * 1024 * 1024)) { // 10MB default
        return {
          statusCode: 413,
          headers: getCORSHeaders(),
          body: JSON.stringify({
            success: false,
            message: 'Request too large',
            error: 'REQUEST_TOO_LARGE'
          })
        };
      }
      
      // Parse and validate JSON body if present
      if (event.body && event.headers['content-type']?.includes('application/json')) {
        try {
          const bodyData = JSON.parse(event.body);
          
          // Sanitize string fields
          if (options.sanitize !== false) {
            sanitizeObject(bodyData);
          }
          
          // Validate input if schema provided
          if (options.schema) {
            const validation = validateInput(bodyData, options.schema);
            if (!validation.valid) {
              return {
                statusCode: 400,
                headers: getCORSHeaders(),
                body: JSON.stringify({
                  success: false,
                  message: 'Invalid input data',
                  errors: validation.errors,
                  error: 'VALIDATION_ERROR'
                })
              };
            }
          }
          
          // Add sanitized data to event
          event.parsedBody = bodyData;
        } catch (parseError) {
          return {
            statusCode: 400,
            headers: getCORSHeaders(),
            body: JSON.stringify({
              success: false,
              message: 'Invalid JSON in request body',
              error: 'INVALID_JSON'
            })
          };
        }
      }
      
      // Call the original handler
      const result = await handler(event, context);
      
      // Ensure CORS headers are included in response
      if (result.headers) {
        result.headers = { ...getCORSHeaders(), ...result.headers };
      } else {
        result.headers = getCORSHeaders();
      }
      
      return result;
      
    } catch (error) {
      console.error('Security middleware error:', error);
      
      return {
        statusCode: 500,
        headers: getCORSHeaders(),
        body: JSON.stringify({
          success: false,
          message: 'Internal server error',
          error: 'INTERNAL_ERROR'
        })
      };
    }
  };
}

/**
 * Recursively sanitize object properties
 * @param {Object} obj - Object to sanitize
 */
function sanitizeObject(obj) {
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }
  
  if (obj && typeof obj === 'object') {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        obj[key] = sanitizeObject(obj[key]);
      }
    }
  }
  
  return obj;
}

// Common validation schemas
const schemas = {
  login: {
    required: ['username', 'password'],
    fields: {
      username: { type: 'string', minLength: 1, maxLength: 50 },
      password: { type: 'string', minLength: 1, maxLength: 100 }
    }
  },
  
  studentLogin: {
    required: ['studentId', 'password'],
    fields: {
      studentId: { type: 'string', minLength: 1, maxLength: 20 },
      password: { type: 'string', minLength: 1, maxLength: 100 }
    }
  },
  
  testSubmission: {
    required: ['testId', 'answers'],
    fields: {
      testId: { type: 'string', minLength: 1, maxLength: 50 },
      answers: { type: 'object' }
    }
  }
};

module.exports = {
  withSecurity,
  validateInput,
  sanitizeString,
  sanitizeObject,
  checkRateLimit,
  getClientIP,
  getCORSHeaders,
  schemas
};
