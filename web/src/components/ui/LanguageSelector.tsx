import React, { useState, useRef, useEffect } from 'react';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { useI18n, Language, languageLabels } from '../../lib/i18n';

interface LanguageSelectorProps {
  compact?: boolean;
}

const languageFlags: Record<Language, string> = {
  en: '🇺🇸',
  es: '🇪🇸',
  fr: '🇫🇷',
};

export function LanguageSelector({ compact = false }: LanguageSelectorProps) {
  const { language, setLanguage, t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on Escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const languages: Language[] = ['en', 'es', 'fr'];

  if (compact) {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1 p-2 rounded-lg text-gray-600 dark:text-slate-400 
                     hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label={t('a11y.selectLanguage')}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        >
          <span className="text-lg" aria-hidden="true">{languageFlags[language]}</span>
          <ChevronDown className="w-3 h-3" aria-hidden="true" />
        </button>

        {isOpen && (
          <div
            role="listbox"
            aria-label={t('settings.language')}
            className="absolute right-0 mt-2 w-40 bg-white dark:bg-slate-800 rounded-lg shadow-lg 
                       border border-gray-200 dark:border-slate-700 py-1 z-50"
          >
            {languages.map((lang) => (
              <button
                key={lang}
                role="option"
                aria-selected={language === lang}
                onClick={() => {
                  setLanguage(lang);
                  setIsOpen(false);
                }}
                className={`
                  w-full flex items-center gap-3 px-4 py-2 text-left transition-colors
                  focus:outline-none focus:bg-blue-50 dark:focus:bg-slate-700
                  ${language === lang 
                    ? 'bg-blue-50 dark:bg-slate-700 text-blue-700 dark:text-blue-300' 
                    : 'text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700'
                  }
                `}
              >
                <span className="text-lg" aria-hidden="true">{languageFlags[lang]}</span>
                <span className="flex-1">{languageLabels[lang]}</span>
                {language === lang && <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" aria-hidden="true" />}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
        {t('settings.language')}
      </label>
      <div className="flex items-center gap-2">
        {languages.map((lang) => (
          <button
            key={lang}
            onClick={() => setLanguage(lang)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              ${language === lang
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                : 'border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-400 hover:border-gray-300 dark:hover:border-slate-500'
              }
            `}
            aria-pressed={language === lang}
          >
            <span className="text-lg" aria-hidden="true">{languageFlags[lang]}</span>
            <span>{languageLabels[lang]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
