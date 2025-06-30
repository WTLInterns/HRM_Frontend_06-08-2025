import React, { Component } from 'react';
import { FaExclamationTriangle } from 'react-icons/fa';

class ErrorCatcher extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Report the error to the parent component
    if (this.props.onError) {
      this.props.onError(error.message || "An unexpected error occurred");
    }
    
    // Log the error to console
    console.error("Component error caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="p-4 bg-red-800/20 border border-red-900/50 rounded-lg shadow-md">
          <div className="flex items-center">
            <FaExclamationTriangle className="text-red-500 mr-3 text-xl" />
            <h3 className="text-red-300 font-medium">Component Error</h3>
          </div>
          <p className="mt-2 text-sm text-gray-300">
            {this.state.error?.message || "Something went wrong. Please try refreshing the page."}
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorCatcher; 