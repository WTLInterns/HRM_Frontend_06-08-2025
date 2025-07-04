import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';

/**
 * Component to ensure language persistence across route changes
 * This component should be placed at the root level to monitor route changes
 */
const LanguagePersistence = ({ children }) => {
  const { i18n } = useTranslation();
  const location = useLocation();

  useEffect(() => {
    // Function to ensure language is properly loaded and persisted
    const ensureLanguagePersistence = () => {
      const savedLanguage = localStorage.getItem('i18nextLng');
      const currentLanguage = i18n.language;
      
      // Valid languages
      const validLanguages = ['en', 'hi', 'mr'];
      
      // If there's a saved language and it's different from current, change to saved
      if (savedLanguage && 
          validLanguages.includes(savedLanguage) && 
          savedLanguage !== currentLanguage) {
        console.log('Restoring saved language:', savedLanguage);
        i18n.changeLanguage(savedLanguage);
      }
      
      // If no saved language or invalid, default to English
      if (!savedLanguage || !validLanguages.includes(savedLanguage)) {
        console.log('Setting default language: en');
        localStorage.setItem('i18nextLng', 'en');
        if (currentLanguage !== 'en') {
          i18n.changeLanguage('en');
        }
      }
      
      // Update HTML lang attribute
      document.documentElement.lang = i18n.language || 'en';
    };

    // Ensure language persistence on route change
    ensureLanguagePersistence();
    
    // Small delay to ensure i18n is fully initialized
    const timeoutId = setTimeout(ensureLanguagePersistence, 100);
    
    return () => clearTimeout(timeoutId);
  }, [location.pathname, i18n]);

  // Listen for i18n language changes and update localStorage
  useEffect(() => {
    const handleLanguageChange = (lng) => {
      console.log('Language changed via i18n:', lng);
      localStorage.setItem('i18nextLng', lng);
      document.documentElement.lang = lng;
    };

    i18n.on('languageChanged', handleLanguageChange);
    
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n]);

  // Prevent rendering until i18n is ready
  if (!i18n.isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return children;
};

export default LanguagePersistence;
