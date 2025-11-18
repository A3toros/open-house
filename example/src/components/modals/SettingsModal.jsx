import React from 'react';
import { useTheme } from '../../hooks/useTheme';
import { getThemeStyles, getCyberpunkCardBg, CYBERPUNK_COLORS } from '../../utils/themeUtils';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * SettingsModal component for theme selection
 * @param {Object} props
 * @param {boolean} props.visible - Whether the modal is visible
 * @param {Function} props.onClose - Function to call when closing the modal
 */
const SettingsModal = ({ visible, onClose }) => {
  const { theme, setTheme, isCyberpunk, isLight, themeClasses } = useTheme();
  const themeStyles = getThemeStyles(theme);

  const handleThemeChange = (newTheme) => {
    if (newTheme !== theme) {
      setTheme(newTheme);
    }
  };

  if (!visible) return null;

  return (
    <AnimatePresence>
      {visible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black bg-opacity-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={`relative w-full max-w-md mx-4 rounded-lg shadow-xl ${
              isCyberpunk
                ? getCyberpunkCardBg(0).className
                : 'bg-white border border-gray-200'
            }`}
            style={isCyberpunk ? {
              ...getCyberpunkCardBg(0).style,
              ...themeStyles.glow
            } : {}}
          >
            {/* Header */}
            <div
              className={`px-6 py-4 border-b ${
                isCyberpunk
                  ? 'border-cyan-400'
                  : 'border-gray-200'
              }`}
              style={isCyberpunk ? {
                borderColor: CYBERPUNK_COLORS.cyan,
                borderBottomWidth: '2px'
              } : {}}
            >
              <h2
                className={`text-2xl font-bold ${
                  isCyberpunk
                    ? `${themeClasses.headerText} tracking-wider`
                    : 'text-gray-900'
                }`}
                style={isCyberpunk ? themeStyles.textShadow : {}}
              >
                {isCyberpunk ? 'SETTINGS' : 'Settings'}
              </h2>
            </div>

            {/* Content */}
            <div className="px-6 py-6">
              {/* Theme Section */}
              <div>
                <h3
                  className={`text-lg font-semibold mb-4 ${
                    isCyberpunk ? themeClasses.text : 'text-gray-900'
                  }`}
                >
                  {isCyberpunk ? 'THEME' : 'Theme'}
                </h3>

                <div className="space-y-3">
                  {/* Light Theme Toggle */}
                  <button
                    onClick={() => handleThemeChange('light')}
                    className={`w-full p-4 rounded-lg border-2 transition-all ${
                      isLight
                        ? isCyberpunk
                          ? 'border-cyan-400'
                          : 'bg-blue-50 border-blue-500'
                        : isCyberpunk
                        ? 'border-gray-700 hover:border-cyan-400'
                        : 'bg-white border-gray-300 hover:border-gray-400'
                    }`}
                    style={isLight && isCyberpunk ? {
                      backgroundColor: CYBERPUNK_COLORS.black,
                      borderColor: CYBERPUNK_COLORS.cyan,
                      borderWidth: '2px'
                    } : isCyberpunk ? {
                      backgroundColor: CYBERPUNK_COLORS.black,
                      borderColor: CYBERPUNK_COLORS.cyan,
                      borderWidth: '2px'
                    } : {}}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-5 h-5 rounded-full border-2 ${
                            isLight
                              ? isCyberpunk
                                ? 'bg-cyan-400 border-cyan-400'
                                : 'bg-blue-500 border-blue-500'
                              : isCyberpunk
                              ? 'border-gray-600'
                              : 'border-gray-400'
                          }`}
                        >
                          {isLight && (
                            <div
                              className={`w-full h-full rounded-full ${
                                isCyberpunk ? 'bg-cyan-400' : 'bg-blue-500'
                              }`}
                            />
                          )}
                        </div>
                        <span
                          className={`font-medium ${
                            isLight
                              ? isCyberpunk
                                ? 'text-cyan-400'
                                : 'text-blue-600'
                              : isCyberpunk
                              ? 'text-gray-400'
                              : 'text-gray-600'
                          }`}
                        >
                          {isCyberpunk ? 'LIGHT THEME' : 'Light Theme'}
                        </span>
                      </div>
                      {isLight && (
                        <span
                          className={`text-sm ${
                            isCyberpunk ? 'text-cyan-400' : 'text-blue-600'
                          }`}
                        >
                          {isCyberpunk ? 'ACTIVE' : 'Active'}
                        </span>
                      )}
                    </div>
                  </button>

                  {/* Cyberpunk Theme Toggle */}
                  <button
                    onClick={() => handleThemeChange('cyberpunk')}
                    className={`w-full p-4 rounded-lg border-2 transition-all ${
                      isCyberpunk
                        ? 'border-cyan-400'
                        : isLight
                        ? 'bg-gray-50 border-gray-300 hover:border-gray-400'
                        : 'bg-white border-gray-300 hover:border-gray-400'
                    }`}
                    style={isCyberpunk ? {
                      backgroundColor: CYBERPUNK_COLORS.black,
                      borderColor: CYBERPUNK_COLORS.cyan,
                      borderWidth: '2px',
                      ...themeStyles.glow
                    } : {}}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-5 h-5 rounded-full border-2 ${
                            isCyberpunk
                              ? 'bg-cyan-400 border-cyan-400'
                              : 'border-gray-400'
                          }`}
                        >
                          {isCyberpunk && (
                            <div className="w-full h-full rounded-full bg-cyan-400" />
                          )}
                        </div>
                        <span
                          className={`font-medium ${
                            isCyberpunk
                              ? 'text-cyan-400'
                              : isLight
                              ? 'text-gray-600'
                              : 'text-gray-600'
                          }`}
                          style={isCyberpunk ? themeStyles.textShadow : {}}
                        >
                          {isCyberpunk ? 'CYBERPUNK THEME' : 'Cyberpunk Theme'}
                        </span>
                      </div>
                      {isCyberpunk && (
                        <span className="text-sm text-cyan-400">ACTIVE</span>
                      )}
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div
              className={`px-6 py-4 border-t ${
                isCyberpunk
                  ? 'border-cyan-400'
                  : 'border-gray-200'
              }`}
              style={isCyberpunk ? {
                borderColor: CYBERPUNK_COLORS.cyan,
                borderTopWidth: '2px'
              } : {}}
            >
              <button
                onClick={onClose}
                className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                  isCyberpunk
                    ? 'bg-cyan-400 text-black hover:bg-cyan-300'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                {isCyberpunk ? 'CLOSE' : 'Close'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default SettingsModal;


