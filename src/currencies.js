import config from './config.js';

const currencies = [
  {"currency": "AUD", "symbol": "$"},
  {"currency": "EUR", "symbol": "€"},
  {"currency": "BGN", "symbol": "лв"},
  {"currency": "CAD", "symbol": "$"},
  {"currency": "CZK", "symbol": "Kč"},
  {"currency": "DKK", "symbol": "kr"},
  {"currency": "HKD", "symbol": "$"},
  {"currency": "HUF", "symbol": "Ft"},
  {"currency": "ILS", "symbol": "₪"},
  {"currency": "JPY", "symbol": "¥"},
  {"currency": "MYR", "symbol": "RM"},
  {"currency": "NZD", "symbol": "$"},
  {"currency": "NOK", "symbol": "kr"},
  {"currency": "PLN", "symbol": "zł"},
  {"currency": "RON", "symbol": "Lei"},
  {"currency": "SGD", "symbol": "$"},
  {"currency": "KRW", "symbol": "₩"},
  {"currency": "SEK", "symbol": "kr"},
  {"currency": "CHF", "symbol": "CHF"},
  {"currency": "AED", "symbol": "د.إ"},
  {"currency": "GBP", "symbol": "£"},
  {"currency": "USD", "symbol": "$"}
];

const filterdCur = currencies.filter(val => checkCurrency(val.currency));

function checkCurrency(c) {
  return config.supportedCurrencies.includes(c);
}

export default filterdCur;
