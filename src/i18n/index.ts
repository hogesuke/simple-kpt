import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enAccount from './resources/en/account.json';
import enAuth from './resources/en/auth.json';
import enBoard from './resources/en/board.json';
import enError from './resources/en/error.json';
import enLanding from './resources/en/landing.json';
import enUi from './resources/en/ui.json';
import enValidation from './resources/en/validation.json';
import jaAccount from './resources/ja/account.json';
import jaAuth from './resources/ja/auth.json';
import jaBoard from './resources/ja/board.json';
import jaError from './resources/ja/error.json';
import jaLanding from './resources/ja/landing.json';
import jaUi from './resources/ja/ui.json';
import jaValidation from './resources/ja/validation.json';

export const supportedLanguages = ['ja', 'en'] as const;
export type SupportedLanguage = (typeof supportedLanguages)[number];

const resources = {
  ja: {
    ui: jaUi,
    auth: jaAuth,
    board: jaBoard,
    account: jaAccount,
    landing: jaLanding,
    validation: jaValidation,
    error: jaError,
  },
  en: {
    ui: enUi,
    auth: enAuth,
    board: enBoard,
    account: enAccount,
    landing: enLanding,
    validation: enValidation,
    error: enError,
  },
};

void i18n.use(LanguageDetector).init({
  resources,
  fallbackLng: 'ja',
  supportedLngs: supportedLanguages,

  ns: ['ui', 'auth', 'board', 'account', 'landing', 'validation', 'error'],
  defaultNS: 'ui',

  detection: {
    order: ['localStorage', 'navigator'],
    lookupLocalStorage: 'language',
    caches: ['localStorage'],
  },

  interpolation: {
    escapeValue: false,
  },

  react: {
    useSuspense: false,
  },
});

i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng;
});

document.documentElement.lang = i18n.language;

export default i18n;
