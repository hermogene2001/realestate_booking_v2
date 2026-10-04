'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

import en from '@/locales/en.json';
import rw from '@/locales/rw.json';
import fr from '@/locales/fr.json';
import sw from '@/locales/sw.json';
import ar from '@/locales/ar.json';

type Translations = typeof en;
type NestedKeyOf<T, Prefix extends string = ''> = T extends object
  ? { [K in keyof T]: K extends string
      ? T[K] extends object
        ? NestedKeyOf<T[K], `${Prefix}${Prefix extends '' ? '' : '.'}${K}`>
        : `${Prefix}${Prefix extends '' ? '' : '.'}${K}`
      : never
    }[keyof T]
  : never;

type TranslationKey = NestedKeyOf<Translations>;

const locales: Record<string, Translations> = { en, rw, fr, sw, ar };

const LANGUAGE_KEY = 'kigali_re_language';

interface LanguageContextType {
  locale: string;
  setLocale: (locale: string) => void;
  t: (key: TranslationKey | string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  locale: 'en',
  setLocale: () => {},
  t: (key: string) => key,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState('en');

  useEffect(() => {
    const saved = localStorage.getItem(LANGUAGE_KEY);
    if (saved && locales[saved]) {
      setLocaleState(saved);
    }
  }, []);

  const setLocale = useCallback((newLocale: string) => {
    if (locales[newLocale]) {
      setLocaleState(newLocale);
      localStorage.setItem(LANGUAGE_KEY, newLocale);
      document.documentElement.lang = newLocale;
    }
  }, []);

  const t = useCallback((key: string): string => {
    const keys = key.split('.');
    let value: unknown = locales[locale];

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = (value as Record<string, unknown>)[k];
      } else {
        // Fallback to English
        let fallback: unknown = locales.en;
        for (const fk of keys) {
          if (fallback && typeof fallback === 'object' && fk in fallback) {
            fallback = (fallback as Record<string, unknown>)[fk];
          } else {
            return key;
          }
        }
        return typeof fallback === 'string' ? fallback : key;
      }
    }

    return typeof value === 'string' ? value : key;
  }, [locale]);

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useTranslation = () => useContext(LanguageContext);
