import React, { createContext, useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const { i18n: i18nInstance } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState(i18nInstance.language || 'en');
  const [isChanging, setIsChanging] = useState(false);

  const languages = [
    {
      code: 'en',
      name: 'English',
      flag: '🇺🇸',
      nativeName: 'English'
    },
    {
      code: 'hi',
      name: 'Hindi',
      flag: '🇮🇳',
      nativeName: 'हिंदी'
    },
    {
      code: 'mr',
      name: 'Marathi',
      flag: '🇮🇳',
      nativeName: 'मराठी'
    }
  ];

  const changeLanguage = async (languageCode) => {
    if (languageCode === currentLanguage || isChanging) {
      return false;
    }

    try {
      setIsChanging(true);

      // Use the safe change language method if available
      const success = i18nInstance.safeChangeLanguage
        ? await i18nInstance.safeChangeLanguage(languageCode)
        : await i18nInstance.changeLanguage(languageCode);

      if (success !== false) {
        // Update local state
        setCurrentLanguage(languageCode);

        // Ensure localStorage is updated
        localStorage.setItem('i18nextLng', languageCode);

        // Update HTML lang attribute
        document.documentElement.lang = languageCode;

        console.log('Language successfully changed to:', languageCode);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error changing language:', error);
      return false;
    } finally {
      setIsChanging(false);
    }
  };

  const getCurrentLanguage = () => {
    return languages.find(lang => lang.code === currentLanguage) || languages[0];
  };

  // Listen for language changes from i18n
  useEffect(() => {
    const handleLanguageChange = (lng) => {
      if (lng !== currentLanguage) {
        setCurrentLanguage(lng);
      }
    };

    i18nInstance.on('languageChanged', handleLanguageChange);

    // Initialize with current i18n language
    if (i18nInstance.language && i18nInstance.language !== currentLanguage) {
      setCurrentLanguage(i18nInstance.language);
    }

    return () => {
      i18nInstance.off('languageChanged', handleLanguageChange);
    };
  }, [i18nInstance, currentLanguage]);

  // Listen for custom language change events
  useEffect(() => {
    const handleCustomLanguageChange = (event) => {
      const { language } = event.detail;
      if (language !== currentLanguage) {
        setCurrentLanguage(language);
      }
    };

    window.addEventListener('languageChanged', handleCustomLanguageChange);

    return () => {
      window.removeEventListener('languageChanged', handleCustomLanguageChange);
    };
  }, [currentLanguage]);

  // Ensure language is loaded on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('i18nextLng');
    const validLanguages = ['en', 'hi', 'mr'];

    if (savedLanguage &&
        validLanguages.includes(savedLanguage) &&
        savedLanguage !== currentLanguage &&
        savedLanguage !== i18nInstance.language) {
      changeLanguage(savedLanguage);
    }
  }, []);

  const value = {
    currentLanguage,
    languages,
    changeLanguage,
    getCurrentLanguage,
    isChanging,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};
