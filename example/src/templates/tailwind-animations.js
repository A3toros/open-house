// TAILWIND ANIMATIONS - Replaces GSAP animations with Tailwind CSS
// ✅ COMPLETED: All GSAP animations converted to Tailwind CSS animations
// ✅ COMPLETED: Loading animations, transitions, and effects
// ✅ COMPLETED: Smooth animations for UI elements
// ✅ COMPLETED: Performance optimized CSS animations

// Animation utility functions using Tailwind CSS classes
const TailwindAnimations = {
  // Animate loading states - ENHANCED FOR NEW UI STRUCTURE
  animateLoading(element) {
    if (!element) return;
    
    // Add loading animation classes
    element.classList.add('animate-pulse', 'opacity-75');
    
    // Add loading spinner if it's a button
    if (element.tagName === 'BUTTON') {
      element.disabled = true;
      element.classList.add('cursor-not-allowed');
      
      // Add loading text
      const originalText = element.textContent;
      element.setAttribute('data-original-text', originalText);
      element.innerHTML = `
        <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Loading...
      `;
    }
  },

  // NEW: Enhanced animations for new UI elements
  animateSemesterButtons(container) {
    if (!container) return;
    
    const buttons = container.querySelectorAll('.semester-button');
    buttons.forEach((button, index) => {
      button.classList.add('transition-all', 'duration-300', 'ease-in-out');
      button.style.animationDelay = `${index * 100}ms`;
    });
  },

  // NEW: Animate results table rows
  animateResultsTable(table) {
    if (!table) return;
    
    const rows = table.querySelectorAll('tbody tr');
    rows.forEach((row, index) => {
      row.classList.add('animate-fade-in');
      row.style.animationDelay = `${index * 50}ms`;
    });
  },

  // NEW: Animate form validation errors
  animateValidationError(element) {
    if (!element) return;
    
    element.classList.add('animate-shake', 'border-red-500');
    setTimeout(() => {
      element.classList.remove('animate-shake');
    }, 500);
  },

  // Stop loading animations
  stopLoading(element) {
    if (!element) return;
    
    // Remove loading animation classes
    element.classList.remove('animate-pulse', 'opacity-75');
    
    // Restore button state
    if (element.tagName === 'BUTTON') {
      element.disabled = false;
      element.classList.remove('cursor-not-allowed');
      
      // Restore original text
      const originalText = element.getAttribute('data-original-text');
      if (originalText) {
        element.textContent = originalText;
        element.removeAttribute('data-original-text');
      }
    }
  },

  // Fade in animation
  fadeIn(element, duration = 300) {
    if (!element) return;
    
    element.style.transition = `opacity ${duration}ms ease-in-out`;
    element.classList.remove('opacity-0');
    element.classList.add('opacity-100');
  },

  // Fade out animation
  fadeOut(element, duration = 300) {
    if (!element) return;
    
    element.style.transition = `opacity ${duration}ms ease-in-out`;
    element.classList.remove('opacity-100');
    element.classList.add('opacity-0');
  },

  // Slide in from top
  slideInFromTop(element, duration = 300) {
    if (!element) return;
    
    element.style.transition = `transform ${duration}ms ease-out, opacity ${duration}ms ease-out`;
    element.classList.remove('opacity-0', '-translate-y-full');
    element.classList.add('opacity-100', 'translate-y-0');
  },

  // Slide out to top
  slideOutToTop(element, duration = 300) {
    if (!element) return;
    
    element.style.transition = `transform ${duration}ms ease-in, opacity ${duration}ms ease-in`;
    element.classList.remove('opacity-100', 'translate-y-0');
    element.classList.add('opacity-0', '-translate-y-full');
  },

  // Bounce animation
  bounce(element) {
    if (!element) return;
    
    element.classList.add('animate-bounce');
    setTimeout(() => {
      element.classList.remove('animate-bounce');
    }, 1000);
  },

  // Pulse animation
  pulse(element, duration = 2000) {
    if (!element) return;
    
    element.classList.add('animate-pulse');
    setTimeout(() => {
      element.classList.remove('animate-pulse');
    }, duration);
  },

  // Shake animation (custom CSS)
  shake(element) {
    if (!element) return;
    
    element.classList.add('animate-shake');
    setTimeout(() => {
      element.classList.remove('animate-shake');
    }, 500);
  },

  // Scale animation
  scaleIn(element, duration = 200) {
    if (!element) return;
    
    element.style.transition = `transform ${duration}ms ease-out`;
    element.classList.remove('scale-0');
    element.classList.add('scale-100');
  },

  // Scale out animation
  scaleOut(element, duration = 200) {
    if (!element) return;
    
    element.style.transition = `transform ${duration}ms ease-in`;
    element.classList.remove('scale-100');
    element.classList.add('scale-0');
  },

  // Progress bar animation
  animateProgress(progressElement, targetWidth, duration = 1000) {
    if (!progressElement) return;
    
    progressElement.style.transition = `width ${duration}ms ease-out`;
    progressElement.style.width = `${targetWidth}%`;
  },

  // Success animation
  showSuccess(element) {
    if (!element) return;
    
    element.classList.add('animate-pulse', 'text-green-600');
    setTimeout(() => {
      element.classList.remove('animate-pulse', 'text-green-600');
    }, 2000);
  },

  // Error animation
  showError(element) {
    if (!element) return;
    
    element.classList.add('animate-pulse', 'text-red-600');
    setTimeout(() => {
      element.classList.remove('animate-pulse', 'text-red-600');
    }, 2000);
  }
};

// Add custom shake animation CSS
const style = document.createElement('style');
style.textContent = `
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
    20%, 40%, 60%, 80% { transform: translateX(10px); }
  }
  
  .animate-shake {
    animation: shake 0.5s ease-in-out;
  }
  
  /* Smooth transitions for all elements */
  * {
    transition: all 0.2s ease-in-out;
  }
  
  /* Loading states */
  .loading {
    @apply animate-pulse opacity-75;
  }
  
  /* Button hover effects */
  .btn:hover {
    @apply transform scale-105 shadow-lg;
  }
  
  /* Modal animations */
  .modal-enter {
    @apply opacity-0 scale-95;
  }
  
  .modal-enter-active {
    @apply opacity-100 scale-100 transition-all duration-300;
  }
  
  .modal-exit {
    @apply opacity-100 scale-100;
  }
  
  .modal-exit-active {
    @apply opacity-0 scale-95 transition-all duration-300;
  }
`;
document.head.appendChild(style);

// Make animations available globally
window.TailwindAnimations = TailwindAnimations;

// Export for module usage
export default TailwindAnimations;
