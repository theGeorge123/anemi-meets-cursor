import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';

const supportedLngs = ['en', 'nl'];
const namespaces = ['common', 'auth', 'account', 'meetup', 'signup', 'toast', 'dashboard', 'home', 'login'];

// Custom postProcessor for robust fallback
const fallbackPostProcessor = {
  type: 'postProcessor',
  name: 'fallbackKey',
  process: function(value: any, key: string, options: any) {
    if (value === key) {
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.warn(`[i18n] Missing translation for key: "${key}" in ns: "${options.ns || ''}" lang: "${options.lng || ''}"`);
      }
      return `[missing: ${key}]`;
    }
    return value;
  }
};

i18n.use(HttpBackend)
  .use(fallbackPostProcessor as any)
  .use(initReactI18next)
  .init({
    lng: 'en',
    fallbackLng: 'en',
    supportedLngs,
    ns: namespaces,
    defaultNS: 'common',
    fallbackNS: 'common',
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    interpolation: {
      escapeValue: false,
    },
    missingKeyHandler: function(lng, ns, key) {
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.warn(`[i18n] Missing translation for key: "${key}" in namespace: "${ns}" and language: "${lng}"`);
      }
    },
    postProcess: ['fallbackKey'],
    saveMissing: true,
    react: {
      useSuspense: false
    }
  });

export default i18n; 