import katex from 'katex';

/**
 * Renders a LaTeX expression to HTML using KaTeX
 * @param {string} latex - LaTeX expression to render
 * @param {boolean} displayMode - Whether to render in display mode (block) or inline
 * @returns {string} - HTML string with rendered math
 */
export const renderMathExpression = (latex, displayMode = false) => {
  if (!latex || typeof latex !== 'string') return '';
  
  try {
    return katex.renderToString(latex, {
      throwOnError: false,
      displayMode: displayMode,
      strict: false
    });
  } catch (error) {
    console.error('Math rendering error:', error);
    // Return escaped LaTeX as fallback
    return `<span class="math-error" title="Math rendering error">${escapeHtml(latex)}</span>`;
  }
};

/**
 * Renders math expressions within text
 * Supports:
 * - $...$ for inline math
 * - $$...$$ for display math
 * @param {string} text - Text that may contain math expressions
 * @param {boolean} displayMode - Default display mode (for $$...$$)
 * @returns {string} - HTML string with rendered math
 */
export const renderMathInText = (text, displayMode = false) => {
  if (!text || typeof text !== 'string') return '';
  
  let processedText = text;
  
  // First, handle display mode math ($$...$$)
  const displayPattern = /\$\$(.*?)\$\$/g;
  let match;
  const displayMatches = [];
  
  while ((match = displayPattern.exec(text)) !== null) {
    displayMatches.push({
      fullMatch: match[0],
      expression: match[1],
      index: match.index
    });
  }
  
  // Replace display math from end to start to preserve indices
  for (let i = displayMatches.length - 1; i >= 0; i--) {
    const { fullMatch, expression } = displayMatches[i];
    try {
      const rendered = katex.renderToString(expression, {
        throwOnError: false,
        displayMode: true,
        strict: false
      });
      processedText = processedText.replace(fullMatch, rendered);
    } catch (error) {
      console.error('Math rendering error:', error);
      processedText = processedText.replace(fullMatch, escapeHtml(fullMatch));
    }
  }
  
  // Then handle inline math ($...$)
  const inlinePattern = /\$(.*?)\$/g;
  const inlineMatches = [];
  
  while ((match = inlinePattern.exec(processedText)) !== null) {
    // Skip if it's part of a display math that was already processed
    if (match[0].startsWith('$$')) continue;
    
    inlineMatches.push({
      fullMatch: match[0],
      expression: match[1],
      index: match.index
    });
  }
  
  // Replace inline math from end to start
  for (let i = inlineMatches.length - 1; i >= 0; i--) {
    const { fullMatch, expression } = inlineMatches[i];
    try {
      const rendered = katex.renderToString(expression, {
        throwOnError: false,
        displayMode: false,
        strict: false
      });
      processedText = processedText.replace(fullMatch, rendered);
    } catch (error) {
      console.error('Math rendering error:', error);
      processedText = processedText.replace(fullMatch, escapeHtml(fullMatch));
    }
  }
  
  return processedText;
};

/**
 * Enhanced text rendering that supports math and basic formatting
 * Supports: **bold**, *italic*, $math$, $$display math$$, and line breaks
 * @param {string} text - Text with formatting and math
 * @returns {string} - HTML string with rendered formatting and math
 */
export const renderEnhancedText = (text) => {
  if (!text || typeof text !== 'string') return '';
  
  // First, escape HTML to prevent XSS
  let processed = escapeHtml(text);
  
  // Render math expressions first (before other formatting)
  processed = renderMathInText(processed, false);
  
  // Apply basic formatting
  processed = processed
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>');
  
  return processed;
};

/**
 * Validates if a LaTeX expression is well-formed
 * @param {string} expression - LaTeX expression to validate
 * @returns {object} - { valid: boolean, error: string|null }
 */
export const validateMathExpression = (expression) => {
  if (!expression || typeof expression !== 'string') {
    return { valid: true, error: null }; // Empty is valid
  }
  
  try {
    // Try to render the expression
    katex.renderToString(expression, {
      throwOnError: true,
      strict: false
    });
    return { valid: true, error: null };
  } catch (error) {
    return {
      valid: false,
      error: error.message || 'Invalid math expression. Please check your syntax.'
    };
  }
};

/**
 * Automatically wraps LaTeX expressions in $ delimiters while preserving regular text
 * Detects LaTeX commands and math operators, wraps them in $...$
 * @param {string} text - Text that may contain LaTeX mixed with regular text
 * @returns {string} - Text with LaTeX wrapped in $ delimiters
 */
export const autoWrapMath = (text) => {
  if (!text || typeof text !== 'string') return '';
  
  // If already has $ delimiters, return as is
  if (text.includes('$')) return text;
  
  // LaTeX commands and math operators to detect
  const latexCommands = [
    '\\sqrt', '\\frac', '\\times', '\\div', '\\cdot', '\\pm', '\\mp',
    '\\leq', '\\geq', '\\neq', '\\approx', '\\equiv', '\\sum', '\\prod',
    '\\int', '\\lim', '\\sin', '\\cos', '\\tan', '\\log', '\\ln', '\\exp'
  ];
  
  // Math operators and symbols
  const mathOperators = ['^{', '}', '{', '^', '_', '\\times', '\\div', '\\pm', '\\mp'];
  
  // Pattern to match LaTeX expressions: 
  // - LaTeX commands (\command)
  // - Math operators (^, _, {, })
  // - Numbers and variables that are part of math expressions
  const parts = [];
  let currentPart = '';
  let inMath = false;
  let braceDepth = 0;
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1] || '';
    const prevChar = text[i - 1] || '';
    const twoChars = char + nextChar;
    const threeChars = text.substring(i, i + 3);
    
    // Check if we're starting a LaTeX command
    if (char === '\\') {
      // Check if it's a known LaTeX command
      const commandMatch = text.substring(i).match(/^\\([a-zA-Z]+)/);
      if (commandMatch) {
        const command = '\\' + commandMatch[1];
        if (latexCommands.some(cmd => command.startsWith(cmd)) || command.length > 1) {
          // Switch to math mode
          if (!inMath && currentPart.trim()) {
            parts.push({ type: 'text', content: currentPart });
            currentPart = '';
          }
          inMath = true;
          currentPart += char;
          continue;
        }
      }
    }
    
    // Check for math operators
    if (twoChars === '^{' || twoChars === '_{' || char === '^' || char === '_') {
      if (!inMath && currentPart.trim()) {
        parts.push({ type: 'text', content: currentPart });
        currentPart = '';
      }
      inMath = true;
      currentPart += char;
      continue;
    }
    
    // Check for braces
    if (char === '{') {
      if (inMath) {
        braceDepth++;
        currentPart += char;
        continue;
      } else if (prevChar === '^' || prevChar === '_' || prevChar === '\\') {
        inMath = true;
        currentPart += char;
        braceDepth++;
        continue;
      }
    }
    
    if (char === '}') {
      if (inMath) {
        currentPart += char;
        braceDepth--;
        if (braceDepth === 0) {
          // Check if next character is math-related
          const afterBrace = text.substring(i + 1).trim();
          if (!afterBrace || afterBrace.match(/^[\s,.!?;:]/)) {
            // End of math expression
            parts.push({ type: 'math', content: currentPart });
            currentPart = '';
            inMath = false;
          }
        }
        continue;
      }
    }
    
    // Regular character
    if (inMath) {
      currentPart += char;
      // Check if we should exit math mode (space followed by text, or end of string)
      if (char === ' ' && braceDepth === 0) {
        const remaining = text.substring(i + 1).trim();
        if (remaining && !remaining.match(/^[\\^_{]/)) {
          // Exit math mode
          parts.push({ type: 'math', content: currentPart.trim() });
          currentPart = '';
          inMath = false;
          currentPart += char; // Add the space to text
        }
      }
    } else {
      currentPart += char;
    }
  }
  
  // Add remaining part
  if (currentPart) {
    parts.push({ type: inMath ? 'math' : 'text', content: currentPart });
  }
  
  // Build result with $ delimiters around math parts
  let result = '';
  for (const part of parts) {
    if (part.type === 'math') {
      result += `$${part.content}$`;
    } else {
      result += part.content;
    }
  }
  
  return result;
};

/**
 * Escapes HTML special characters
 * @param {string} text - Text to escape
 * @returns {string} - Escaped text
 */
const escapeHtml = (text) => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

