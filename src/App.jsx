import React, { Component, useEffect } from "react";
import { useLocation } from "react-router-dom";

import RouterNavbar from "./Router/RouterNavbar";
import { AppProvider, useApp } from "./context/AppContext";
import { LanguageProvider } from "./context/LanguageContext";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import firebaseService from "./services/firebaseService";
import './i18n'; // Import i18n configuration

// Error boundary component to catch rendering errors
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', color: 'white', background: '#333', borderRadius: '8px', margin: '20px' }}>
          <h2>Something went wrong.</h2>
          <details style={{ whiteSpace: 'pre-wrap', margin: '10px 0' }}>
            <summary>Show error details</summary>
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

// Theme wrapper component to apply theme consistently
const ThemeWrapper = ({ children }) => {
  const { isDarkMode } = useApp();
  const location = useLocation();
  useEffect(() => {
    // Apply the appropriate theme class to the html element
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
    }
  }, [isDarkMode]);

  useEffect(() => {
    // Only dismiss toasts when actually changing to a different page
    // Don't dismiss on same page operations (like adding/updating employees)
    const currentPath = location.pathname;
    const previousPath = sessionStorage.getItem('previousPath');

    if (previousPath && previousPath !== currentPath) {
      // Dismiss all toasts only on actual route change
      if (window.toastify) {
        window.toastify.dismiss();
      }
      if (window.ReactToastify) {
        window.ReactToastify.toast.dismiss();
      }
      if (window.toast) {
        window.toast.dismiss && window.toast.dismiss();
      }
    }

    // Store current path for next comparison
    sessionStorage.setItem('previousPath', currentPath);
  }, [location]);

  useEffect(() => {
    // Initialize Firebase messaging
    const initializeFirebase = async () => {
      // Request permission
      const permissionGranted = await firebaseService.requestPermission();
      
      if (permissionGranted) {
        // Setup foreground message listener
        firebaseService.setupForegroundMessageListener();
        
        // Register token if user is logged in
        const userData = localStorage.getItem('user');
        if (userData && userData !== 'null') {
          try {
            const user = JSON.parse(userData);
            const userType = user.role === 'SUB_ADMIN' ? 'SUBADMIN' : 'EMPLOYEE';
            await firebaseService.registerTokenWithBackend(user.id, userType);
          } catch (error) {
            console.error('Error parsing user data:', error);
          }
        }
      }
    };

    initializeFirebase();
  }, []);


  return (
    <div className={isDarkMode ? 'dark-mode' : 'light-mode'}>
      {children}
      <ToastContainer
        position="top-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
        style={{ zIndex: 9999 }}
      />
    </div>
  );
};

const App = () => {
  return (
    <div className="min-h-screen transition-all duration-300">
      <ErrorBoundary>
        <LanguageProvider>
          <AppProvider>
            <ThemeWrapper>
              <RouterNavbar />
            </ThemeWrapper>
          </AppProvider>
        </LanguageProvider>
      </ErrorBoundary>
    </div>
  );
};

export default App;
