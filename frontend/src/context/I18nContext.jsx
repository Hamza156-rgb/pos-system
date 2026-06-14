import { createContext, useContext, useState, useMemo } from 'react';
import { translations } from '../locales/index.js';

const I18nContext = createContext();

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'en');
  const value = useMemo(() => ({
    lang,
    dir: lang === 'ur' ? 'rtl' : 'ltr',
    t: (key) => translations[lang]?.[key] || translations.en[key] || key,
    toggleLang: () => setLang((p) => {
      const next = p === 'en' ? 'ur' : 'en';
      localStorage.setItem('lang', next);
      return next;
    }),
  }), [lang]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export const useI18n = () => useContext(I18nContext);
