import React, { useState, useRef, useEffect } from 'react';
import { FaGlobe, FaChevronDown } from 'react-icons/fa';
import { useLanguage } from '../context/LanguageContext';

const LanguageToggle = ({ position = 'auto' }) => {
  const { currentLanguage, languages, changeLanguage, getCurrentLanguage, isChanging } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState('left');
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  const currentLang = getCurrentLanguage();

  // Auto-detect dropdown position based on button location
  useEffect(() => {
    if (position === 'auto' && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const windowWidth = window.innerWidth;
      const rightSpace = windowWidth - rect.right;
      const leftSpace = rect.left;

      // If there's more space on the left, position dropdown to the right
      // If there's more space on the right, position dropdown to the left
      if (rightSpace < 250 && leftSpace > rightSpace) {
        setDropdownPosition('right');
      } else {
        setDropdownPosition('left');
      }
    } else if (position !== 'auto') {
      setDropdownPosition(position);
    }
  }, [position, isOpen]);

  const handleLanguageChange = async (languageCode) => {
    if (languageCode !== currentLanguage && !isChanging) {
      await changeLanguage(languageCode);
      setIsOpen(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Close dropdown on escape key
  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Language Toggle Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        disabled={isChanging}
        className={`flex items-center space-x-1 px-2 py-2 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600 text-gray-100 transition-all duration-300 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${isChanging ? 'opacity-50 cursor-not-allowed' : ''}`}
        aria-label="Select Language"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span className="text-lg">
          {currentLang.flag}
        </span>
        <FaChevronDown
          className={`text-xs transition-transform duration-200 ${isOpen ? 'rotate-180' : ''} ${isChanging ? 'animate-spin' : ''}`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className={`absolute ${dropdownPosition === 'left' ? 'left-0' : 'right-0'} top-full mt-2 w-52 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-[60] animate-fadeIn`}>
          <div className="py-2">
            {languages.map((language) => (
              <button
                key={language.code}
                onClick={() => handleLanguageChange(language.code)}
                className={`w-full text-left px-4 py-3 text-sm transition-all duration-200 flex items-center space-x-3 hover:bg-slate-700 ${
                  currentLanguage === language.code
                    ? 'bg-blue-600/20 text-blue-300 border-r-2 border-blue-400'
                    : 'text-gray-100 hover:text-blue-300'
                } ${isChanging ? 'pointer-events-none opacity-50' : ''}`}
                role="menuitem"
                disabled={isChanging}
              >
                <span className="text-lg">{language.flag}</span>
                <div className="flex flex-col">
                  <span className="font-medium">{language.name}</span>
                  <span className="text-xs text-gray-400">{language.nativeName}</span>
                </div>
                {currentLanguage === language.code && (
                  <div className="ml-auto">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageToggle;
