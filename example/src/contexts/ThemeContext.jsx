import React, { createContext, useState, useEffect } from 'react';
import { getThemeClasses } from '../utils/themeUtils';
import { applyThemeToDocument } from '../utils/themeUtils';

const ThemeContext = createContext({
  theme: 'cyberpunk', // 'light' | 'cyberpunk'
  setTheme: (theme) => {},
  isCyberpunk: true,
  isLight: false,
  themeClasses: {}, // Helper object for theme-aware classes
});

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(() => {
    // Load from localStorage on mount
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('student_theme_preference');
      return saved === 'light' ? 'light' : 'cyberpunk';
    }
    return 'cyberpunk';
  });

  // Apply theme to document on mount and when theme changes
  useEffect(() => {
    applyThemeToDocument(theme);
  }, [theme]);

  const setTheme = (newTheme) => {
    if (newTheme !== 'light' && newTheme !== 'cyberpunk') {
      console.warn(`Invalid theme: ${newTheme}. Defaulting to cyberpunk.`);
      newTheme = 'cyberpunk';
    }
    
    setThemeState(newTheme);
    
    // Persist to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('student_theme_preference', newTheme);
    }
    
    // Apply theme to document root
    applyThemeToDocument(newTheme);
  };

  const value = {
    theme,
    setTheme,
    isCyberpunk: theme === 'cyberpunk',
    isLight: theme === 'light',
    themeClasses: getThemeClasses(theme),
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;


