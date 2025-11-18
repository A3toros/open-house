/**
 * History Management Utilities for Drawing Interface
 * Handles drawing history, undo/redo operations, and memory management
 */

import { HISTORY_CONFIG } from './constants';

/**
 * Calculate the memory usage of drawing data in KB
 * @param {Array} drawingData - The drawing data array
 * @returns {number} Memory usage in KB
 */
export const calculateMemoryUsage = (drawingData) => {
  try {
    const jsonString = JSON.stringify(drawingData);
    const bytes = new Blob([jsonString]).size;
    return bytes / 1024; // Convert to KB
  } catch (error) {
    console.warn('Error calculating memory usage:', error);
    return 0;
  }
};

/**
 * Compress drawing data to reduce memory usage
 * @param {Array} drawingData - The drawing data to compress
 * @returns {Array} Compressed drawing data
 */
export const compressDrawingData = (drawingData) => {
  if (!Array.isArray(drawingData)) return drawingData;
  
  return drawingData.map(item => {
    if (Array.isArray(item)) {
      // Compress line data by removing intermediate points
      return compressLineData(item);
    }
    return item;
  });
};

/**
 * Compress line data by removing intermediate points
 * @param {Array} lineData - Array of line points
 * @returns {Array} Compressed line data
 */
const compressLineData = (lineData) => {
  if (lineData.length <= 2) return lineData;
  
  const compressed = [lineData[0]]; // Keep first point
  const threshold = 2; // Minimum distance between points
  
  for (let i = 1; i < lineData.length - 1; i++) {
    const prev = lineData[i - 1];
    const current = lineData[i];
    const next = lineData[i + 1];
    
    // Calculate distance from previous point
    const distance = Math.sqrt(
      Math.pow(current.x - prev.x, 2) + Math.pow(current.y - prev.y, 2)
    );
    
    // Keep point if distance is significant
    if (distance > threshold) {
      compressed.push(current);
    }
  }
  
  compressed.push(lineData[lineData.length - 1]); // Keep last point
  return compressed;
};

/**
 * Create a new history entry
 * @param {Array} drawingData - Current drawing data
 * @param {number} timestamp - Optional timestamp
 * @returns {Object} History entry
 */
export const createHistoryEntry = (drawingData, timestamp = Date.now()) => {
  const memoryUsage = calculateMemoryUsage(drawingData);
  
  return {
    data: [...drawingData],
    timestamp,
    memoryUsage,
    compressed: memoryUsage > HISTORY_CONFIG.COMPRESSION_THRESHOLD
  };
};

/**
 * Save drawing data to history with memory management
 * @param {Array} history - Current history array
 * @param {Array} drawingData - Drawing data to save
 * @param {number} currentIndex - Current history index
 * @returns {Object} Updated history state
 */
export const saveToHistory = (history, drawingData, currentIndex) => {
  const newEntry = createHistoryEntry(drawingData);
  const memoryUsage = calculateMemoryUsage(drawingData);
  
  // Remove future history if we're not at the end
  const newHistory = history.slice(0, currentIndex + 1);
  
  // Add new entry
  newHistory.push(newEntry);
  
  // Check memory limits and compress if needed
  let finalHistory = newHistory;
  if (memoryUsage > HISTORY_CONFIG.MAX_MEMORY_KB) {
    finalHistory = compressHistory(newHistory);
  }
  
  // Limit history size
  if (finalHistory.length > HISTORY_CONFIG.MAX_ENTRIES) {
    finalHistory = finalHistory.slice(-HISTORY_CONFIG.MAX_ENTRIES);
  }
  
  return {
    history: finalHistory,
    index: finalHistory.length - 1
  };
};

/**
 * Compress history entries to reduce memory usage
 * @param {Array} history - History array to compress
 * @returns {Array} Compressed history
 */
export const compressHistory = (history) => {
  return history.map(entry => {
    if (entry.memoryUsage > HISTORY_CONFIG.COMPRESSION_THRESHOLD) {
      return {
        ...entry,
        data: compressDrawingData(entry.data),
        compressed: true
      };
    }
    return entry;
  });
};

/**
 * Get drawing data from history at specific index
 * @param {Array} history - History array
 * @param {number} index - History index
 * @returns {Array} Drawing data
 */
export const getHistoryData = (history, index) => {
  if (index < 0 || index >= history.length) return [];
  
  const entry = history[index];
  if (!entry) return [];
  
  return entry.compressed ? 
    decompressDrawingData(entry.data) : 
    [...entry.data];
};

/**
 * Decompress drawing data
 * @param {Array} compressedData - Compressed drawing data
 * @returns {Array} Decompressed drawing data
 */
export const decompressDrawingData = (compressedData) => {
  // For now, return as-is since compression is lossy
  // In a real implementation, you might want to interpolate points
  return [...compressedData];
};

/**
 * Check if undo is possible
 * @param {number} currentIndex - Current history index
 * @returns {boolean} Can undo
 */
export const canUndo = (currentIndex) => {
  return currentIndex > 0;
};

/**
 * Check if redo is possible
 * @param {number} currentIndex - Current history index
 * @param {number} historyLength - Total history length
 * @returns {boolean} Can redo
 */
export const canRedo = (currentIndex, historyLength) => {
  return currentIndex < historyLength - 1;
};

/**
 * Get history statistics
 * @param {Array} history - History array
 * @returns {Object} History statistics
 */
export const getHistoryStats = (history) => {
  const totalMemory = history.reduce((sum, entry) => sum + entry.memoryUsage, 0);
  const compressedEntries = history.filter(entry => entry.compressed).length;
  
  return {
    totalEntries: history.length,
    totalMemoryKB: Math.round(totalMemory),
    compressedEntries,
    averageMemoryKB: Math.round(totalMemory / history.length) || 0
  };
};

/**
 * Clear all history
 * @returns {Object} Empty history state
 */
export const clearHistory = () => {
  return {
    history: [],
    index: -1
  };
};
