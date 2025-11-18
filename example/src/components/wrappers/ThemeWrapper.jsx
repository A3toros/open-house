import React from 'react';
import { useTheme } from '../../hooks/useTheme';
import { getThemeStyles } from '../../utils/themeUtils';

/**
 * ThemeWrapper component for consistent theme application
 * Automatically applies theme background and styles to children
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components to wrap
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.asBackground - If true, applies full-screen background styling
 */
export const ThemeWrapper = ({ children, className = '', asBackground = false }) => {
  const { theme, isCyberpunk } = useTheme();
  
  // Background classes based on theme
  // Light theme: Original white/light gray background (no gradients)
  // Cyberpunk theme: Dark gradient background
  const backgroundClass = isCyberpunk
    ? 'bg-gradient-to-br from-black via-gray-900 to-purple-900'
    : 'bg-white'; // ORIGINAL: Simple white background, no gradients
  
  // Background styles (only for cyberpunk - gradient overlay)
  // Light theme: NO special styles, use default
  const backgroundStyle = isCyberpunk
    ? getThemeStyles('cyberpunk').background
    : {}; // Light theme: empty object = no special styling
  
  // If asBackground is true, apply full-screen background styling
  const wrapperClass = asBackground
    ? `${backgroundClass} min-h-screen ${className}`
    : className;
  
  return (
    <div className={wrapperClass} style={backgroundStyle}>
      {children}
    </div>
  );
};

export default ThemeWrapper;


