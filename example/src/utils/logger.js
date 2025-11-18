/**
 * Deployment-aware logging utility
 * - Shows logs during local Vite builds (development/testing)
 * - No logs in deployed production environment
 * - Always logs errors for debugging
 */

// Detect if we're in a deployed production environment
// Only suppress logs on the actual production domain, not on preview/staging domains
const isDeployed = window.location.hostname === 'mathayomwatsing.netlify.app';

// Override console methods globally in production to suppress all logs
if (isDeployed) {
  console.log = () => {};
  console.debug = () => {};
  console.info = () => {};
  console.warn = () => {};
  // Keep console.error for critical debugging
}

export const logger = {
  /**
   * Debug logging - only in local development
   * @param {string} message - Log message
   * @param {...any} args - Additional arguments
   */
  debug: (message, ...args) => {
    if (!isDeployed) {
      console.log(message, ...args);
    }
  },

  /**
   * Warning logging - only in local development
   * @param {string} message - Log message
   * @param {...any} args - Additional arguments
   */
  warn: (message, ...args) => {
    if (!isDeployed) {
      console.warn(message, ...args);
    }
  },

  /**
   * Error logging - always logs, even in production
   * @param {string} message - Log message
   * @param {...any} args - Additional arguments
   */
  error: (message, ...args) => {
    // Always log errors, even in deployed production
    console.error(message, ...args);
  },

  /**
   * Info logging - only in local development
   * @param {string} message - Log message
   * @param {...any} args - Additional arguments
   */
  info: (message, ...args) => {
    if (!isDeployed) {
      console.info(message, ...args);
    }
  },

  /**
   * Check if logging is enabled (for conditional logic)
   * @returns {boolean} - True if logging is enabled
   */
  isEnabled: () => !isDeployed
};
