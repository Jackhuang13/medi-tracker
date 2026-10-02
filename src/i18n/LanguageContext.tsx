import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Language, SUPPORTED_LANGUAGES, LanguageOption } from './types';
import { TRANSLATIONS, TranslationKey } from './translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
  languages: LanguageOption[];
}

const STORAGE_LANG_KEY = 'MEDITRACKER_LANG_V1';

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_LANG_KEY) as Language;
      if (saved && (saved === 'zh-TW' || saved === 'zh-CN' || saved === 'en' || saved === 'ja')) {
        return saved;
      }
      // 依據瀏覽器預設語言做適當偵測
      const navLang = navigator.language.toLowerCase();
      if (navLang.startsWith('zh-cn') || navLang.startsWith('zh-sg') || navLang.startsWith('zh-hans')) {
        return 'zh-CN';
      }
      if (navLang.startsWith('zh')) {
        return 'zh-TW';
      }
      if (navLang.startsWith('ja')) {
        return 'ja';
      }
      if (navLang.startsWith('en')) {
        return 'en';
      }
    } catch {
      // ignore
    }
    return 'zh-TW';
  });

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_LANG_KEY, lang);
      document.documentElement.lang = lang;
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>): string => {
      const langDict = TRANSLATIONS[language] || TRANSLATIONS['zh-TW'];
      let str: string = (langDict as Record<string, string>)[key] || (TRANSLATIONS['zh-TW'] as Record<string, string>)[key] || key;

      if (params) {
        Object.entries(params).forEach(([pKey, pVal]) => {
          str = str.replace(new RegExp(`\\{${pKey}\\}`, 'g'), String(pVal));
        });
      }

      return str;
    },
    [language]
  );

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        languages: SUPPORTED_LANGUAGES,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

export function useTranslation() {
  return useLanguage();
}
