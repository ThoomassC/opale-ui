import { useCallback, useEffect, useState } from 'react';

import { DEFAULT_LANGUAGE, isLanguage, type Language } from './localization';

const STORAGE_KEY = 'tc-language';

function readStoredLanguage(): Language {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return isLanguage(stored) ? stored : DEFAULT_LANGUAGE;
  } catch {
    return DEFAULT_LANGUAGE;
  }
}

export interface LanguageControl {
  readonly language: Language;
  readonly setLanguage: (language: Language) => void;
}

export function useLanguage(): LanguageControl {
  const [language, updateLanguage] = useState<Language>(readStoredLanguage);

  useEffect(() => {
    document.documentElement.lang = language.toLowerCase();
  }, [language]);

  const setLanguage = useCallback((nextLanguage: Language) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, nextLanguage);
    } catch {
      // Le choix reste actif pour la session même si le stockage est refusé.
    }

    updateLanguage(nextLanguage);
  }, []);

  return { language, setLanguage };
}
