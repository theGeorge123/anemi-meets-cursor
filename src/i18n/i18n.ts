import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { en } from '../locales/en/index';
import { nl } from '../locales/nl/index';

const supportedLngs = ['en', 'nl'];

const resources = {
  en: { translation: en },
  nl: { translation: nl },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    supportedLngs,
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;
