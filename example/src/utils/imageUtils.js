/**
 * Image validation and compression utilities
 * Handles file validation, compression, and format optimization
 */

/**
 * Validate image file
 * @param {File} file - The file to validate
 * @returns {Promise<{valid: boolean, errors: string[], dimensions?: {width: number, height: number}}>}
 */
export const validateImageFile = async (file) => {
  const errors = [];
  
  // File size validation (500KB limit)
  const maxSize = 500 * 1024; // 500KB in bytes
  if (file.size > maxSize) {
    const fileSizeKB = (file.size / 1024).toFixed(1);
    errors.push(`Image is too large (${fileSizeKB}KB). Maximum allowed size is 500KB. Please compress or resize your image.`);
  }
  
  // No format validation needed - Cloudinary handles all supported formats automatically
  
  // Image dimensions validation
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const maxWidth = 4000;
      const maxHeight = 4000;
      
      if (img.width > maxWidth || img.height > maxHeight) {
        errors.push(`Image is too large (${img.width}x${img.height} pixels). Maximum allowed dimensions are 4000x4000 pixels. Please resize your image.`);
      }
      
      resolve({
        valid: errors.length === 0,
        errors: errors,
        dimensions: { width: img.width, height: img.height }
      });
    };
    
    img.onerror = () => {
      errors.push('Invalid image file');
      resolve({
        valid: false,
        errors: errors
      });
    };
    
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Compress image to meet size requirements
 * @param {File} file - The file to compress
 * @param {number} maxSizeKB - Maximum size in KB (default: 500)
 * @returns {Promise<Blob>} - Compressed image blob
 */
export const compressImage = (file, maxSizeKB = 500) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      const maxDimension = 2000; // Max width/height
      
      if (width > maxDimension || height > maxDimension) {
        const ratio = Math.min(maxDimension / width, maxDimension / height);
        width *= ratio;
        height *= ratio;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);
      
      // Try different quality levels to meet size limit
      let quality = 0.8;
      const tryCompress = () => {
        canvas.toBlob((blob) => {
          if (blob.size <= maxSizeKB * 1024 || quality <= 0.1) {
            resolve(blob);
          } else {
            quality -= 0.1;
            tryCompress();
          }
        }, 'image/jpeg', quality);
      };
      
      tryCompress();
    };
    
    img.onerror = () => {
      // If compression fails, return original file
      resolve(file);
    };
    
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Convert file to data URL
 * @param {File} file - The file to convert
 * @returns {Promise<string>} - Data URL string
 */
export const fileToDataUrl = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(file);
  });
};

/**
 * Get mobile-optimized settings
 * @returns {Object} - Mobile settings
 */
export const getMobileOptimizedSettings = () => {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  return {
    blockMinSize: isMobile ? 60 : 40,
    arrowThickness: isMobile ? 4 : 2,
    touchTargetSize: isMobile ? 44 : 32,
    doubleTapDelay: isMobile ? 300 : 200,
    isMobile
  };
};

/**
 * Create mobile-optimized block
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {Object} imageInfo - Image information
 * @returns {Object} - Mobile-optimized block
 */
export const createBlockMobile = (x, y, imageInfo) => {
  const mobileSettings = getMobileOptimizedSettings();
  
  return {
    id: generateId(),
    x: x - mobileSettings.blockMinSize / 2,
    y: y - mobileSettings.blockMinSize / 2,
    width: mobileSettings.blockMinSize,
    height: mobileSettings.blockMinSize,
    // Mobile-specific properties
    touchTarget: mobileSettings.touchTargetSize,
    isMobile: true
  };
};

/**
 * Create mobile-optimized arrow
 * @param {number} startX - Start X coordinate
 * @param {number} startY - Start Y coordinate
 * @param {number} endX - End X coordinate
 * @param {number} endY - End Y coordinate
 * @returns {Object} - Mobile-optimized arrow
 */
export const createArrowMobile = (startX, startY, endX, endY) => {
  const mobileSettings = getMobileOptimizedSettings();
  
  return {
    id: generateId(),
    start: { x: startX, y: startY },
    end: { x: endX, y: endY },
    thickness: mobileSettings.arrowThickness,
    // Enhanced touch targets
    touchStart: {
      x: startX - mobileSettings.touchTargetSize / 2,
      y: startY - mobileSettings.touchTargetSize / 2,
      width: mobileSettings.touchTargetSize,
      height: mobileSettings.touchTargetSize
    },
    touchEnd: {
      x: endX - mobileSettings.touchTargetSize / 2,
      y: endY - mobileSettings.touchTargetSize / 2,
      width: mobileSettings.touchTargetSize,
      height: mobileSettings.touchTargetSize
    }
  };
};

/**
 * Generate unique ID
 * @returns {string} - Unique ID
 */
const generateId = () => {
  return Math.random().toString(36).substr(2, 9);
};
