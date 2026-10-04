import { useTranslation } from '../context/LanguageContext';

const RTL_LANGUAGES = ['ar', 'he', 'fa', 'ur'];

export function useRTL() {
  const { locale } = useTranslation();
  const isRTL = RTL_LANGUAGES.includes(locale);

  return {
    isRTL,
    direction: isRTL ? 'rtl' : 'ltr',
    locale,
  };
}
