import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import en from './locales/en.json';
import hi from './locales/hi.json';
import mr from './locales/mr.json';

const resources = {
  en: {
    translation: en
  },
  hi: {
    translation: hi
  },
  mr: {
    translation: mr
  }
};

// Get saved language from localStorage or default to 'en'
const savedLanguage = localStorage.getItem('i18nextLng') || 'en';

// Ensure the saved language is valid
const validLanguages = ['en', 'hi', 'mr'];
const initialLanguage = validLanguages.includes(savedLanguage) ? savedLanguage : 'en';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    lng: initialLanguage, // Set initial language explicitly
    fallbackLng: 'en',
    debug: false,

    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
      checkWhitelist: true, // Only use languages from supportedLngs
    },

    supportedLngs: ['en', 'hi', 'mr'], // Explicitly define supported languages

    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },

    react: {
      useSuspense: false,
      bindI18n: 'languageChanged', // Re-render on language change
      bindI18nStore: false,
      transEmptyNodeValue: '', // Return empty string for missing translations
      transSupportBasicHtmlNodes: true,
      transKeepBasicHtmlNodesFor: ['br', 'strong', 'i', 'em'],
    },

    // Ensure language changes are saved immediately
    saveMissing: false,
    updateMissing: false,

    // Namespace configuration
    defaultNS: 'translation',
    ns: ['translation'],
  });

// Add event listener to save language changes
i18n.on('languageChanged', (lng) => {
  console.log('Language changed to:', lng);
  localStorage.setItem('i18nextLng', lng);
  document.documentElement.lang = lng;
});

// Set initial HTML lang attribute
document.documentElement.lang = initialLanguage;

export default i18n;
