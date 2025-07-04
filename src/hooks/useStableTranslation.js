import { useTranslation } from 'react-i18next';
import { useCallback, useMemo } from 'react';

/**
 * A stable translation hook that prevents unnecessary re-renders
 * and ensures consistent language state across components
 */
export const useStableTranslation = () => {
  const { t, i18n } = useTranslation();

  // Memoize the translation function to prevent unnecessary re-renders
  const stableT = useCallback((key, options) => {
    return t(key, options);
  }, [t]);

  // Memoize language information
  const languageInfo = useMemo(() => ({
    currentLanguage: i18n.language,
    isReady: i18n.isInitialized,
    languages: ['en', 'hi', 'mr'],
  }), [i18n.language, i18n.isInitialized]);

  // Stable change language function
  const changeLanguage = useCallback(async (lng) => {
    if (lng !== i18n.language && languageInfo.languages.includes(lng)) {
      try {
        await i18n.changeLanguage(lng);
        localStorage.setItem('i18nextLng', lng);
        document.documentElement.lang = lng;
        return true;
      } catch (error) {
        console.error('Error changing language:', error);
        return false;
      }
    }
    return false;
  }, [i18n, languageInfo.languages]);

  return {
    t: stableT,
    i18n,
    ...languageInfo,
    changeLanguage,
  };
};

export default useStableTranslation;
