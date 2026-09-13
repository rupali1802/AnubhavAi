import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en.json';
import hi from './hi.json';
import ta from './ta.json';

const savedLang = localStorage.getItem('anubhavai_lang') || 'en';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      hi: { translation: hi },
      ta: { translation: ta },
    },
    lng: savedLang,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;

export const changeLanguage = (lang: string) => {
  localStorage.setItem('anubhavai_lang', lang);
  i18n.changeLanguage(lang);
};

export const getCurrentLang = () => i18n.language || 'en';
