/**
 * Theme utility functions for managing theme classes and styles
 */

/**
 * Cyberpunk color palette from cyberpunk.css
 */
export const CYBERPUNK_COLORS = {
  yellow: '#f8ef02',
  cyan: '#00ffd2',
  red: '#ff003c',
  blue: '#136377',
  green: '#446d44',
  purple: 'purple',
  black: '#000',
  white: '#fff',
  dark: '#333',
};

/**
 * Converts hex color to rgba
 */
const hexToRgba = (hex, alpha = 1) => {
  if (hex.startsWith('#')) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return hex; // Return as-is if not hex
};

/**
 * Converts named color to rgba (for 'purple')
 */
export const colorToRgba = (color, alpha = 1) => {
  if (color === 'purple') {
    return `rgba(128, 0, 128, ${alpha})`;
  }
  return hexToRgba(color, alpha);
};

/**
 * Returns a varied cyberpunk card background color with pure colors
 * Uses exact cyberpunk.css colors: red, yellow, purple, and cyan
 * Pure colors - no opacity, solid backgrounds
 * @param {number} index - Optional index to determine color (for consistent coloring)
 * @returns {Object} Object with className and style for card background
 */
export const getCyberpunkCardBg = (index = null) => {
  const colorConfigs = [
    { bg: CYBERPUNK_COLORS.red, border: CYBERPUNK_COLORS.red }, // Red
    { bg: CYBERPUNK_COLORS.yellow, border: CYBERPUNK_COLORS.yellow }, // Yellow
    { bg: CYBERPUNK_COLORS.purple, border: CYBERPUNK_COLORS.purple }, // Purple
    { bg: CYBERPUNK_COLORS.cyan, border: CYBERPUNK_COLORS.cyan }, // Cyan
    { bg: CYBERPUNK_COLORS.red, border: CYBERPUNK_COLORS.red }, // Red (variant)
    { bg: CYBERPUNK_COLORS.yellow, border: CYBERPUNK_COLORS.yellow }, // Yellow (variant)
    { bg: CYBERPUNK_COLORS.purple, border: CYBERPUNK_COLORS.purple }, // Purple (variant)
  ];
  
  const selected = index !== null 
    ? colorConfigs[index % colorConfigs.length]
    : colorConfigs[Math.floor(Math.random() * colorConfigs.length)];
  
  // Pure colors - solid black background with colored border
  return {
    className: 'border-2',
    style: {
      backgroundColor: CYBERPUNK_COLORS.black, // Pure black background
      borderColor: selected.border, // Pure color border - no opacity
      borderWidth: '2px',
    }
  };
};

/**
 * Returns theme-specific Tailwind CSS class mappings
 * @param {string} theme - 'light' | 'cyberpunk'
 * @returns {Object} Object with theme-specific class names
 */
export const getThemeClasses = (theme) => {
  const themes = {
    light: {
      // ORIGINAL PRE-CYBERPUNK STYLING - restore exact original appearance
      background: 'bg-white', // Original: simple white background
      backgroundSecondary: 'bg-gray-50',
      text: 'text-gray-900', // Original: standard dark text
      textSecondary: 'text-gray-600',
      border: 'border-gray-300', // Original: standard gray borders
      headerBg: 'bg-blue-600', // Original: blue header background
      headerText: 'text-white', // Original: white text in headers
      headerBorder: 'border-blue-700', // Original: darker blue border
      buttonPrimary: 'bg-blue-500 text-white hover:bg-blue-600', // Original: standard blue buttons
      buttonSecondary: 'bg-gray-200 text-gray-700 hover:bg-gray-300', // Original: gray secondary buttons
      buttonOutline: 'border-gray-300 text-gray-700 hover:bg-gray-50', // Original: outline buttons
      cardBg: 'bg-white', // Original: white card backgrounds
      cardBorder: 'border-gray-200', // Original: light gray borders
      inputBg: 'bg-white', // Original: white input backgrounds
      inputBorder: 'border-gray-300', // Original: gray input borders
      inputText: 'text-gray-900', // Original: dark input text
      progressBg: 'bg-gray-200', // Original: gray progress background
      progressFill: 'bg-blue-500', // Original: blue progress fill
      // No glow effects, no neon colors, no special fonts
    },
    cyberpunk: {
      // ENHANCED CYBERPUNK STYLING WITH EXACT CYBERPUNK.CSS COLORS
      background: 'bg-black',
      backgroundSecondary: 'bg-gray-900',
      // Text colors - components should use inline styles with CYBERPUNK_COLORS
      text: '', // Use inline style: { color: CYBERPUNK_COLORS.cyan }
      textSecondary: '', // Use inline style: { color: CYBERPUNK_COLORS.yellow }
      border: '', // Use inline style: { borderColor: CYBERPUNK_COLORS.cyan }
      headerBg: 'bg-black',
      headerText: '', // Use inline style: { color: CYBERPUNK_COLORS.cyan }
      headerBorder: '', // Use inline style: { borderColor: CYBERPUNK_COLORS.cyan }
      buttonPrimary: '', // Use inline style
      buttonSecondary: 'bg-gray-800', // Use inline style for text and border
      buttonOutline: '', // Use inline style
      // Varied card backgrounds - use getCyberpunkCardBg() for individual cards
      cardBg: '', // Use getCyberpunkCardBg() instead
      cardBorder: '', // Use getCyberpunkCardBg() instead
      inputBg: 'bg-black',
      inputBorder: '', // Use inline style: { borderColor: CYBERPUNK_COLORS.yellow }
      inputText: '', // Use inline style: { color: CYBERPUNK_COLORS.yellow }
      progressBg: 'bg-gray-800',
      progressFill: '', // Use inline style with gradient
      // Additional color variants for buttons and accents
      buttonRed: '', // Use inline style
      buttonYellow: '', // Use inline style
      buttonPurple: '', // Use inline style
    }
  };
  return themes[theme] || themes.cyberpunk;
};

/**
 * Returns theme-specific inline style objects
 * @param {string} theme - 'light' | 'cyberpunk'
 * @returns {Object} Object with theme-specific inline styles
 */

export const getThemeStyles = (theme) => {
  if (theme === 'cyberpunk') {
    return {
      background: {
        backgroundColor: CYBERPUNK_COLORS.black // Pure black background - no gradients
      },
      glow: {
        boxShadow: `0 0 8px ${CYBERPUNK_COLORS.cyan}, 0 0 12px ${CYBERPUNK_COLORS.cyan}`
      },
      glowRed: {
        boxShadow: `0 0 8px ${CYBERPUNK_COLORS.red}, 0 0 12px ${CYBERPUNK_COLORS.red}`
      },
      glowYellow: {
        boxShadow: `0 0 6px ${CYBERPUNK_COLORS.yellow}, 0 0 10px ${CYBERPUNK_COLORS.yellow}`
      },
      glowPurple: {
        boxShadow: `0 0 8px ${CYBERPUNK_COLORS.purple}, 0 0 12px ${CYBERPUNK_COLORS.purple}`
      },
      glowGreen: {
        boxShadow: `0 0 8px ${CYBERPUNK_COLORS.green}, 0 0 12px ${CYBERPUNK_COLORS.green}`
      },
      textShadow: {
        textShadow: `0 0 10px ${CYBERPUNK_COLORS.cyan}, 0 0 20px ${CYBERPUNK_COLORS.cyan}, 0 0 30px ${CYBERPUNK_COLORS.cyan}`
      },
      textShadowYellow: {
        textShadow: `0 0 8px ${CYBERPUNK_COLORS.yellow}, 0 0 16px ${CYBERPUNK_COLORS.yellow}`
      },
      textShadowRed: {
        textShadow: `0 0 8px ${CYBERPUNK_COLORS.red}, 0 0 16px ${CYBERPUNK_COLORS.red}`
      },
      textShadowPurple: {
        textShadow: `0 0 8px ${CYBERPUNK_COLORS.purple}, 0 0 16px ${CYBERPUNK_COLORS.purple}`
      },
      textShadowGreen: {
        textShadow: `0 0 8px ${CYBERPUNK_COLORS.green}, 0 0 16px ${CYBERPUNK_COLORS.green}`
      },
      // Neon text colors for direct use - pure colors, no opacity
      textCyan: {
        color: CYBERPUNK_COLORS.cyan,
        textShadow: `0 0 10px ${CYBERPUNK_COLORS.cyan}, 0 0 20px ${CYBERPUNK_COLORS.cyan}, 0 0 30px ${CYBERPUNK_COLORS.cyan}`
      },
      textYellow: {
        color: CYBERPUNK_COLORS.yellow,
        textShadow: `0 0 8px ${CYBERPUNK_COLORS.yellow}, 0 0 16px ${CYBERPUNK_COLORS.yellow}`
      },
      textRed: {
        color: CYBERPUNK_COLORS.red,
        textShadow: `0 0 8px ${CYBERPUNK_COLORS.red}, 0 0 16px ${CYBERPUNK_COLORS.red}`
      },
      textPurple: {
        color: CYBERPUNK_COLORS.purple,
        textShadow: `0 0 8px ${CYBERPUNK_COLORS.purple}, 0 0 16px ${CYBERPUNK_COLORS.purple}`
      },
      textGreen: {
        color: CYBERPUNK_COLORS.green,
        textShadow: `0 0 8px ${CYBERPUNK_COLORS.green}, 0 0 16px ${CYBERPUNK_COLORS.green}`
      }
    };
  }
  // Light theme: NO special styles - return empty object to use default/standard styling
  // This ensures we restore the original appearance without any cyberpunk effects
  return {};
};

/**
 * Applies theme to document root (for CSS variables or data attributes)
 * @param {string} theme - 'light' | 'cyberpunk'
 */
export const applyThemeToDocument = (theme) => {
  if (typeof document === 'undefined') return;
  
  // Set data-theme attribute on document root
  if (theme === 'cyberpunk') {
    document.documentElement.setAttribute('data-theme', 'cyberpunk');
  } else {
    document.documentElement.setAttribute('data-theme', 'light');
  }
};

