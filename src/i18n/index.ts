import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enBoard from './resources/en/board.json';
import enError from './resources/en/error.json';
import enLanding from './resources/en/landing.json';
import enRoom from './resources/en/room.json';
import enUi from './resources/en/ui.json';
import enValidation from './resources/en/validation.json';
import jaBoard from './resources/ja/board.json';
import jaError from './resources/ja/error.json';
import jaLanding from './resources/ja/landing.json';
import jaRoom from './resources/ja/room.json';
import jaUi from './resources/ja/ui.json';
import jaValidation from './resources/ja/validation.json';

export const supportedLanguages = ['ja', 'en'] as const;
export type SupportedLanguage = (typeof supportedLanguages)[number];

const resources = {
  ja: {
    ui: jaUi,
    board: jaBoard,
    landing: jaLanding,
    room: jaRoom,
    error: jaError,
    validation: jaValidation,
  },
  en: {
    ui: enUi,
    board: enBoard,
    landing: enLanding,
    room: enRoom,
    error: enError,
    validation: enValidation,
  },
};

void i18n.use(LanguageDetector).init({
  resources,
  fallbackLng: 'ja',
  supportedLngs: supportedLanguages,

  ns: ['ui', 'board', 'landing', 'room', 'error', 'validation'],
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
