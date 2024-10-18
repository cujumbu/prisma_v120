import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslations from './locales/en.json';
import esTranslations from './locales/es.json';
import nlTranslations from './locales/nl.json';
import daTranslations from './locales/da.json';
import svTranslations from './locales/sv.json';
import fiTranslations from './locales/fi.json';
import noTranslations from './locales/no.json';
import etTranslations from './locales/et.json';
import plTranslations from './locales/pl.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslations },
      es: { translation: esTranslations },
      nl: { translation: nlTranslations },
      da: { translation: daTranslations },
      sv: { translation: svTranslations },
      fi: { translation: fiTranslations },
      no: { translation: noTranslations },
      et: { translation: etTranslations },
      pl: { translation: plTranslations },
    },
    fallbackLng: 'en',
    detection: {
      order: ['querystring', 'localStorage', 'navigator'],
      lookupQuerystring: 'lang',
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;