import config from './config.js';

const allLanguages = [
  {lang: 'en', label: 'English'},
  {lang: 'de', label: 'Deutsch'},
  {lang: 'fr', label: 'Français'},
  {lang: 'nl', label: 'Nederlands'},
  {lang: 'es', label: 'Español'},
  {lang: 'it', label: 'Italiano'},
  {lang: 'pt', label: 'Português'},
  {lang: 'pl', label: 'Polski'},
  {lang: 'uk', label: 'Українська'},
  {lang: 'ro', label: 'Română'},
  {lang: 'bg', label: 'Български'},
  {lang: 'hr', label: 'Hrvatski'},
  {lang: 'cs', label: 'Čeština'},
  {lang: 'sk', label: 'Slovenčina'},
  {lang: 'sl', label: 'Slovenščina'},
  {lang: 'hu', label: 'Magyar'},
  {lang: 'el', label: 'Ελληνικά'},
  {lang: 'tr', label: 'Türkçe'},
  {lang: 'da', label: 'Dansk'},
  {lang: 'sv', label: 'Svenska'},
  {lang: 'fi', label: 'Suomi'},
  {lang: 'et', label: 'Eesti'},
  {lang: 'lv', label: 'Latviešu'},
  {lang: 'lt', label: 'Lietuvių'},
  {lang: 'lb', label: 'Lëtzebuergesch'},
  {lang: 'mt', label: 'Malti'},
  {lang: 'ga', label: 'Gaeilge'},
];

export const LANGUAGES = allLanguages.filter(({lang}) =>
  config.supportedLanguages.includes(lang) || lang === config.defaultLanguage
);

export const LANGS = LANGUAGES.map((l) => l.lang);
