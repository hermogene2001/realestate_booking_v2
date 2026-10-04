import { Role } from '../types/user';

export const SUPPORTED_LANGUAGES = ['en', 'rw', 'fr', 'sw'] as const;
export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

export const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  en: 'English',
  rw: 'Kinyarwanda',
  fr: 'Fran\u00e7ais',
  sw: 'Kiswahili',
};

export { Role };
