import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { t, type Lang, type TranslationKeys } from './translations';

interface LanguageCtx {
  lang: Lang;
  toggleLang: () => void;
  tr: (key: TranslationKeys, vars?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageCtx | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('en');

  const toggleLang = useCallback(() => {
    setLang(prev => (prev === 'en' ? 'zh' : 'en'));
  }, []);

  const tr = useCallback(
    (key: TranslationKeys, vars?: Record<string, string | number>) => {
      let text = t[lang][key] ?? t.en[key];
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          text = text.replace(`{${k}}`, String(v));
        }
      }
      return text;
    },
    [lang],
  );

  return (
    <LanguageContext.Provider value={{ lang, toggleLang, tr }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLang must be used within LanguageProvider');
  return ctx;
}
