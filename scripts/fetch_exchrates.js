import cfg from '../src/config.js';
import fetchExchRates from '../src/exchrates.js';

await fetchExchRates(cfg.exchangerateApiKey, cfg.currencyUnit);
