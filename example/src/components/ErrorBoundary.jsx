import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to console for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Check if it's the specific React error #300
    if (error.message && error.message.includes('Minified React error #300')) {
      console.warn('React error #300 caught and handled by ErrorBoundary');
      // Don't re-throw this error, just log it
      return;
    }
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <h3 className="text-red-800 font-medium">Something went wrong</h3>
          <p className="text-red-600 text-sm mt-1">
            An error occurred while rendering this component.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
