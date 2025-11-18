# Student Cabinet Theme Settings Plan

## Overview
Add a Settings menu item to the student cabinet with a popup/modal that allows users to toggle between Light and Cyberpunk themes.

## Current State
- Student cabinet has a menu with:
  - Change Password
  - Logout
- Menu is accessible via a menu button in the header
- No theme settings currently available

## Requirements

### 1. Menu Item Addition
- Add a "Settings" menu item between "Change Password" and "Logout"
- Settings item should open a settings modal/popup

### 2. Settings Modal/Popup
- Create a new `SettingsModal` component
- Modal should display theme options
- Should match the cyberpunk aesthetic when in cyberpunk mode
- Should have clean styling when in light mode

### 3. Theme Toggle System
- Two theme options:
  - **Light Theme**: **Original styling that existed before cyberpunk was added** (restore pre-cyberpunk appearance)
  - **Cyberpunk Theme**: Current cyberpunk styling (black backgrounds, cyan/yellow/purple accents)
- Each theme should have a toggle switch
- Only one theme can be active at a time (mutually exclusive)
- Theme preference should be saved to localStorage/AsyncStorage
- Theme should persist across app sessions
- **Important**: Light theme must restore the exact original appearance before cyberpunk styles were implemented

### 4. Theme Implementation
- Check if theme system already exists in the codebase
- If not, create a theme context/provider
- Apply theme globally to all student pages
- Ensure theme changes are reflected immediately

## Implementation Steps

### Phase 1: Theme System Setup
1. **Identify Original Light Theme Styles**
   - Review git history or backup to find original styling before cyberpunk
   - Document original classes and styles for:
     - Background colors (likely `bg-white` or `bg-gray-50`)
     - Text colors (likely `text-gray-900`, `text-gray-700`)
     - Border colors (likely `border-gray-300`, `border-gray-200`)
     - Header styles (likely white/gray backgrounds)
     - Button styles (likely blue/standard colors)
     - Card/container styles (likely white backgrounds with gray borders)
   - Note: Light theme should be **exactly** as it was before cyberpunk was added

2. **Check existing theme implementation**
   - Search for theme context, theme provider, or theme utilities
   - Check if there's already a theme management system
   - Identify how themes are currently applied
   - Review mobile app's ThemeContext implementation for reference

2. **Create Theme Context**
   - Create `src/contexts/ThemeContext.jsx`
   - Structure:
     ```javascript
     const ThemeContext = createContext({
       theme: 'cyberpunk', // 'light' | 'cyberpunk'
       setTheme: (theme) => {},
       isCyberpunk: true,
       isLight: false,
       themeClasses: {}, // Helper object for theme-aware classes
     });
     ```
   - Support 'light' and 'cyberpunk' themes
   - Persist theme preference to localStorage with key `student_theme_preference`
   - Default to 'cyberpunk' if no preference saved

3. **Create Theme Provider Component**
   - Create `ThemeProvider` component in `ThemeContext.jsx`
   - Wrap student app with ThemeProvider
   - Initialize theme from localStorage on mount
   - Provide theme state and setter function
   - Handle theme persistence on change

4. **Create useTheme Hook**
   - Create `src/hooks/useTheme.js`
   - Hook structure:
     ```javascript
     export const useTheme = () => {
       const context = useContext(ThemeContext);
       if (!context) {
         throw new Error('useTheme must be used within ThemeProvider');
       }
       return context;
     };
     ```
   - Returns: `{ theme, setTheme, isCyberpunk, isLight, themeClasses }`
   - Provides helper functions for theme-aware styling

5. **Create Theme Wrapper Utilities**
   - Create `src/utils/themeUtils.js` or add to existing utils
   - Functions:
     - `getThemeClasses(theme)`: Returns theme-specific class mappings
     - `getThemeStyles(theme)`: Returns theme-specific inline style objects
     - `applyTheme(theme)`: Applies theme to document root (for CSS variables if needed)
   - Theme class mappings:
     ```javascript
     {
       light: {
         background: 'bg-white',
         text: 'text-gray-900',
         border: 'border-gray-300',
         // ... more mappings
       },
       cyberpunk: {
         background: 'bg-black',
         text: 'text-cyan-400',
         border: 'border-cyan-400',
         // ... more mappings
       }
     }
     ```

6. **Wrap Student App with ThemeProvider**
   - Update `src/student/student-index.jsx` or `src/App.jsx`
   - Wrap student routes with `<ThemeProvider>`
   - Ensure theme context is available to all student components

### Phase 2: Settings Modal Component
1. **Create `SettingsModal.tsx` component**
   - Location: `src/components/modals/SettingsModal.tsx` or `src/components/dashboard/SettingsModal.tsx`
   - Props: `visible`, `onClose`
   - Structure:
     - Header: "Settings" title
     - Section: "Theme" with two toggle switches
     - Footer: Close button

2. **Theme Toggle Switches**
   - Light Theme toggle
   - Cyberpunk Theme toggle
   - Only one can be active (radio button behavior with toggle UI)
   - Visual feedback when theme is active
   - Apply theme immediately on toggle

3. **Styling**
   - Support both themes (light and cyberpunk)
   - Use theme-aware colors
   - Match existing modal styling patterns

### Phase 3: Menu Integration
1. **Add Settings Menu Item**
   - Location: Student cabinet menu (where Change Password and Logout are)
   - Add "Settings" option
   - Icon: Settings/gear icon (optional)

2. **Menu Item Handler**
   - Open SettingsModal when clicked
   - Close menu when opening settings

3. **State Management**
   - Add `showSettings` state to StudentCabinet
   - Add `handleOpenSettings` function
   - Add `handleCloseSettings` function

### Phase 4: Theme Application
1. **Create Theme Wrapper Components** (Optional but recommended)
   - Create `ThemeWrapper` component for consistent theme application
   - Wrapper applies theme classes/styles to children
   - Can be used to wrap entire pages or sections
   - Example:
     ```javascript
     const ThemeWrapper = ({ children, className = '' }) => {
       const { theme, themeClasses } = useTheme();
       const backgroundClass = theme === 'cyberpunk' 
         ? 'bg-gradient-to-br from-black via-gray-900 to-purple-900'
         : 'bg-gray-50';
       const backgroundStyle = theme === 'cyberpunk' 
         ? getThemeStyles('cyberpunk').background
         : {};
       
       return (
         <div className={`${backgroundClass} ${className}`} style={backgroundStyle}>
           {children}
         </div>
       );
     };
     ```

2. **Apply Theme to Components**
   - Update all student pages to use `useTheme` hook
   - Replace hardcoded cyberpunk styles with theme-aware styles
   - Use `themeClasses` helper for conditional class application
   - Use `getThemeStyles()` for conditional inline styles
   - Example usage:
     ```javascript
     const { theme, isCyberpunk, themeClasses } = useTheme();
     
     // In JSX:
     <div className={isCyberpunk ? 'bg-black border-cyan-400' : 'bg-white border-gray-300'}>
     // Or using themeClasses:
     <div className={`${themeClasses.background} ${themeClasses.border}`}>
     ```

3. **Theme-Aware Components to Update**
   - Background containers (use ThemeWrapper or conditional classes)
   - Headers (conditional text colors, borders, glows)
   - Buttons (conditional colors and styles)
   - Cards (conditional backgrounds and borders)
   - Input fields (conditional borders and text colors)
   - Modals (conditional backgrounds and borders)
   - Progress bars (conditional colors)
   - All test headers and components

4. **Component Update Pattern**
   - Import `useTheme` hook
   - Destructure theme properties
   - Replace hardcoded styles with theme-aware conditionals
   - Test both themes after updates

5. **Theme Wrapper Component Usage**
   - Create reusable `ThemeWrapper` component in `src/components/wrappers/ThemeWrapper.jsx`
   - Wrapper automatically applies theme background and styles
   - Usage example:
     ```javascript
     // Wrap entire page
     <ThemeWrapper className="min-h-screen">
       {/* Page content */}
     </ThemeWrapper>
     
     // Or wrap specific sections
     <ThemeWrapper className="p-6 rounded-lg">
       {/* Section content */}
     </ThemeWrapper>
     ```
   - Wrapper handles:
     - Background colors/gradients
     - Theme-specific styling
     - Consistent theme application
   - Benefits:
     - Reduces code duplication
     - Ensures consistent theme application
     - Easy to update theme styling in one place

### Phase 5: Testing
1. **Theme Switching**
   - Test switching between light and cyberpunk
   - Verify theme persists on page refresh
   - Verify theme applies to all student pages

2. **Settings Modal**
   - Test opening/closing modal
   - Test theme toggles
   - Test visual feedback

3. **Menu Integration**
   - Test Settings menu item appears
   - Test Settings opens modal
   - Test menu closes when Settings opens

## File Structure

```
src/
├── components/
│   ├── modals/
│   │   └── SettingsModal.jsx (new)
│   ├── dashboard/
│   │   └── SettingsModal.jsx (alternative location)
│   └── wrappers/
│       └── ThemeWrapper.jsx (new - optional but recommended)
├── contexts/
│   └── ThemeContext.jsx (new)
├── hooks/
│   └── useTheme.js (new)
├── utils/
│   └── themeUtils.js (new)
├── student/
│   ├── student-index.jsx (update - wrap with ThemeProvider)
│   └── StudentCabinet.jsx (update - add Settings menu item)
└── App.jsx (update - wrap student routes with ThemeProvider if needed)
```

## Technical Details

### Theme Storage
- **Key**: `student_theme_preference` or `app_theme`
- **Values**: `'light'` | `'cyberpunk'`
- **Location**: localStorage (web) or AsyncStorage (mobile)

### Theme Context Structure
```javascript
// ThemeContext.jsx
const ThemeContext = createContext({
  theme: 'cyberpunk', // 'light' | 'cyberpunk'
  setTheme: (theme) => {},
  isCyberpunk: true,
  isLight: false,
  themeClasses: {
    background: 'bg-black',
    text: 'text-cyan-400',
    border: 'border-cyan-400',
    // ... more theme-aware classes
  }
});
```

### Theme Provider Implementation
```javascript
// ThemeContext.jsx - ThemeProvider component
export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(() => {
    // Load from localStorage on mount
    const saved = localStorage.getItem('student_theme_preference');
    return saved === 'light' ? 'light' : 'cyberpunk';
  });

  const setTheme = (newTheme) => {
    setThemeState(newTheme);
    localStorage.setItem('student_theme_preference', newTheme);
    // Optionally apply theme to document root for CSS variables
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
```

### useTheme Hook Implementation
```javascript
// hooks/useTheme.js
import { useContext } from 'react';
import { ThemeContext } from '../contexts/ThemeContext';

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
```

### Theme Wrapper Utilities
```javascript
// utils/themeUtils.js
export const getThemeClasses = (theme) => {
  const themes = {
    light: {
      // ORIGINAL PRE-CYBERPUNK STYLING - restore exact original appearance
      background: 'bg-white', // Original: likely bg-white or bg-gray-50
      backgroundSecondary: 'bg-gray-50',
      text: 'text-gray-900', // Original: standard dark text
      textSecondary: 'text-gray-600',
      border: 'border-gray-300', // Original: standard gray borders
      headerBg: 'bg-white', // Original: white header background
      headerText: 'text-gray-900', // Original: dark text in headers
      buttonPrimary: 'bg-blue-500 text-white', // Original: standard blue buttons
      buttonSecondary: 'bg-gray-200 text-gray-700', // Original: gray secondary buttons
      cardBg: 'bg-white', // Original: white card backgrounds
      cardBorder: 'border-gray-200', // Original: light gray borders
      // No glow effects, no neon colors, no special fonts
    },
    cyberpunk: {
      // CURRENT CYBERPUNK STYLING
      background: 'bg-black',
      backgroundSecondary: 'bg-gray-900',
      text: 'text-cyan-400',
      textSecondary: 'text-yellow-400',
      border: 'border-cyan-400',
      headerBg: 'bg-black',
      headerText: 'text-cyan-400',
      buttonPrimary: 'bg-cyan-400 text-black',
      buttonSecondary: 'bg-gray-800 text-cyan-400 border-cyan-400',
      cardBg: 'bg-black',
      cardBorder: 'border-cyan-400',
    }
  };
  return themes[theme] || themes.cyberpunk;
};

export const getThemeStyles = (theme) => {
  if (theme === 'cyberpunk') {
    return {
      background: {
        backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255, 215, 0, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(0, 255, 255, 0.1) 0%, transparent 50%), radial-gradient(circle at 40% 20%, rgba(147, 51, 234, 0.1) 0%, transparent 50%)'
      },
      glow: {
        boxShadow: '0 0 20px rgba(0, 255, 255, 0.5), 0 0 40px rgba(0, 255, 255, 0.3)'
      },
      textShadow: {
        textShadow: '0 0 10px rgba(0, 255, 255, 0.5), 0 0 20px rgba(0, 255, 255, 0.3)'
      }
    };
  }
  // Light theme: NO special styles - return empty object to use default/standard styling
  // This ensures we restore the original appearance without any cyberpunk effects
  return {};
};

export const applyThemeToDocument = (theme) => {
  // Optionally set CSS variables on document root
  if (theme === 'cyberpunk') {
    document.documentElement.setAttribute('data-theme', 'cyberpunk');
  } else {
    document.documentElement.setAttribute('data-theme', 'light');
  }
};
```

### Theme Wrapper Component Implementation
```javascript
// components/wrappers/ThemeWrapper.jsx
import React from 'react';
import { useTheme } from '../../hooks/useTheme';
import { getThemeStyles } from '../../utils/themeUtils';

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
```

### Usage Examples

#### Example 1: Wrapping a Page
```javascript
// student/StudentCabinet.jsx
import { ThemeWrapper } from '@/components/wrappers/ThemeWrapper';

return (
  <ThemeWrapper asBackground={true}>
    {/* Page content */}
  </ThemeWrapper>
);
```

#### Example 2: Using useTheme Hook Directly
```javascript
// components/test/TestHeader.jsx
import { useTheme } from '@/hooks/useTheme';
import { getThemeStyles } from '@/utils/themeUtils';

const TestHeader = ({ testName }) => {
  const { theme, isCyberpunk, themeClasses } = useTheme();
  const themeStyles = getThemeStyles(theme);
  
  return (
    <div 
      className={`${isCyberpunk ? 'bg-black border-cyan-400' : 'bg-white border-gray-300'} rounded-lg p-6`}
      style={isCyberpunk ? themeStyles.glow : {}}
    >
      <h1 
        className={isCyberpunk ? 'text-cyan-400' : 'text-gray-900'}
        style={isCyberpunk ? themeStyles.textShadow : {}}
      >
        {testName}
      </h1>
    </div>
  );
};
```

#### Example 3: Using themeClasses Helper
```javascript
// components/ui/Button.jsx
import { useTheme } from '@/hooks/useTheme';

const Button = ({ children, variant = 'primary' }) => {
  const { themeClasses } = useTheme();
  
  const buttonClass = variant === 'primary'
    ? themeClasses.buttonPrimary
    : themeClasses.buttonSecondary;
  
  return (
    <button className={buttonClass}>
      {children}
    </button>
  );
};
```

### Settings Modal Structure
```typescript
interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
}
```

### Theme Toggle Component
- Two toggle switches (or radio buttons styled as toggles)
- Light Theme toggle
- Cyberpunk Theme toggle
- Active state visual indicator
- Click handler to switch theme

## Styling Considerations

### Light Theme (Original Pre-Cyberpunk Styling)
- **Must restore exact original appearance before cyberpunk was added**
- Background: White/light gray (likely `bg-white`, `bg-gray-50`)
- Text: Dark gray/black (likely `text-gray-900`, `text-gray-700`)
- Borders: Gray (likely `border-gray-300`, `border-gray-200`)
- Accents: Blue (standard blue colors, no glow effects)
- Headers: White/gray backgrounds with standard text
- Buttons: Standard blue buttons (`bg-blue-500`, `text-white`)
- Cards: White backgrounds with gray borders
- **No cyberpunk effects**: No glows, no neon colors, no gradients, no special fonts
- **Note**: Review git history or original code to ensure exact restoration

### Cyberpunk Theme (Current)
- Background: Black with gradient
- Text: Cyan, yellow, purple
- Borders: Cyan with glow
- Accents: Cyan, yellow, purple with glow effects

## Dependencies
- React Context API (for theme management)
- localStorage/AsyncStorage (for persistence)
- Existing modal components (if any)
- Existing UI components (Button, Card, etc.)

## Edge Cases
1. **First-time user**: Default to cyberpunk theme
2. **Theme not found in storage**: Default to cyberpunk
3. **Invalid theme value**: Default to cyberpunk
4. **Theme change during test**: Should apply immediately but not disrupt test flow
5. **Multiple tabs**: Theme should sync across tabs (optional enhancement)

## Future Enhancements (Optional)
- Dark theme (separate from cyberpunk)
- Theme preview before applying
- Auto theme based on system preference
- Theme customization (custom colors)
- Theme animations/transitions

## Notes
- **Light theme must restore exact original appearance** before cyberpunk was added
- Review git history or original code to identify pre-cyberpunk styling
- Light theme should have:
  - No glow effects
  - No neon colors (cyan, yellow, purple)
  - No special fonts (monospace)
  - No gradient backgrounds
  - Standard white/gray backgrounds
  - Standard blue buttons
  - Standard dark text
- Ensure theme changes don't break existing functionality
- Maintain accessibility in both themes
- Test on all student pages
- Consider mobile app compatibility if theme system needs to work there too
- When implementing, verify light theme matches original by comparing with git history or backup

