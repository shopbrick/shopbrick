import cfg, {env} from '../src/config.js';
import fetchExchRates from '../src/exchrates.js';
import {updateProductPrices, updateAllProductsPrices} from '../src/products.js';
import {updateStripeProductPrices, updateAllStripeProductPrices} from '../src/stripe.js';

const envRaw = process.env.ENV;
if (!envRaw) throw new Error('ENV variable is not set. Please set it to "test" or "production" (aliases: "prod", "live").');

// Usage:
//     ENV=test node scripts/upload_stripe_prices.js --product=<product-handle>
//     ENV=prod node scripts/upload_stripe_prices.js
//
const exchRates = await fetchExchRates(cfg.exchangerateApiKey, cfg.currencyUnit);
if (!exchRates) throw new Error('Cannot get exchRates') ;

const pk = process.argv.find((a) => a.startsWith('--product='))?.replace('--product=', '') ?? process.argv.find((a) => a.startsWith('-p='))?.replace('-p=', '');

if (pk) {
  updateProductPrices(pk, exchRates);
  await updateStripeProductPrices(pk);
} else {
  updateAllProductsPrices(exchRates);
  await updateAllStripeProductPrices();
}
