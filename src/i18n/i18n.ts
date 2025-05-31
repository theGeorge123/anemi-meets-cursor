import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';

const supportedLngs = ['en', 'nl'];
const namespaces = ['common', 'auth', 'account', 'meetup', 'signup', 'toast'];

i18n
  .use(HttpBackend)
  .use(initReactI18next)
  .init({
    lng: 'en',
    fallbackLng: 'en',
    supportedLngs,
    ns: namespaces,
    defaultNS: 'common',
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    interpolation: {
      escapeValue: false,
    },
    missingKeyHandler: function(lng, ns, key, fallbackValue) {
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.warn(`[i18n] Missing translation for key: "${key}" in namespace: "${ns}" and language: "${lng}"`);
      }
    }
  });

export default i18n; 