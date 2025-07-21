import cfg from '../src/config.js';
import fetchExchRates from '../src/exchrates.js';
import {updateAllProductsPrices, updateProductPrices} from '../src/products.js';

//
// Usage:
//     node scripts/update_prices.js --product=<product-handle>
//     node scripts/update_prices.js
//
const exchRates = await fetchExchRates(cfg.exchangerateApiKey, cfg.currencyUnit);
if (!exchRates) throw new Error(`Cannot get exchRates`) ;

const pk = process.argv.find((a) => a.startsWith('--product='))?.replace('--product=', '') ?? process.argv.find((a) => a.startsWith('-p='))?.replace('-p=', '');

if (pk) {
  updateProductPrices(pk, exchRates);
} else {
  updateAllProductsPrices(exchRates);
}
