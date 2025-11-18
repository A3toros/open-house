// Gesture detection utilities
export const GESTURE_THRESHOLDS = {
  SCALE_DELTA: 0.05,      // 5% change = zoom gesture
  CENTER_DELTA: 20,       // 20px movement = pan gesture
  MIN_TOUCH_DISTANCE: 10, // Minimum distance to register
};

// Get touch distance between two fingers
export const getTouchDistance = (touches) => {
  if (touches.length < 2) return 0;
  const touch1 = touches[0];
  const touch2 = touches[1];
  return Math.sqrt(
    Math.pow(touch2.clientX - touch1.clientX, 2) + 
    Math.pow(touch2.clientY - touch1.clientY, 2)
  );
};

// Get touch center between two fingers
export const getTouchCenter = (touches) => {
  if (touches.length < 2) return null;
  const touch1 = touches[0];
  const touch2 = touches[1];
  return {
    x: (touch1.clientX + touch2.clientX) / 2,
    y: (touch1.clientY + touch2.clientY) / 2
  };
};

// Detect gesture type (zoom vs pan)
export const detectGestureType = (touches, lastTouches) => {
  if (touches.length !== 2 || !lastTouches) return null;
  
  const currentDistance = getTouchDistance(touches);
  const lastDistance = getTouchDistance(lastTouches);
  const currentCenter = getTouchCenter(touches);
  const lastCenter = getTouchCenter(lastTouches);
  
  if (lastDistance === 0) return null;
  
  const scaleDelta = Math.abs(currentDistance / lastDistance - 1);
  const centerDelta = Math.sqrt(
    Math.pow(currentCenter.x - lastCenter.x, 2) + 
    Math.pow(currentCenter.y - lastCenter.y, 2)
  );
  
  if (scaleDelta > GESTURE_THRESHOLDS.SCALE_DELTA) {
    return 'zoom';
  } else if (centerDelta > GESTURE_THRESHOLDS.CENTER_DELTA) {
    return 'pan';
  }
  
  return null;
};

// Throttle function for performance
export const throttle = (func, limit) => {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// RequestAnimationFrame throttle
export const rafThrottle = (func) => {
  let rafId;
  return function() {
    const args = arguments;
    const context = this;
    if (rafId) {
      cancelAnimationFrame(rafId);
    }
    rafId = requestAnimationFrame(() => {
      func.apply(context, args);
      rafId = null;
    });
  };
};

// High-DPI support
export const getDevicePixelRatio = () => window.devicePixelRatio || 1;

export const isHighDPI = () => getDevicePixelRatio() > 1.5;

// Adaptive thresholds based on device
export const getAdaptiveThresholds = () => {
  const isHighDPI = getDevicePixelRatio() > 1.5;
  return {
    scaleDelta: isHighDPI ? 0.03 : 0.05,
    centerDelta: isHighDPI ? 15 : 20,
    minTouchDistance: 10,
  };
};
