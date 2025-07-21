import cfg from '../src/config.js';
import {getProductsWithStripePrices, getProductWithStripePrices} from '../src/products.js';
import Stripe from 'stripe';

//
// Usage:
//     node scripts/check_prices.js --product=<product-handle>
//     node scripts/check_prices.js
//

const pk = process.argv.find((a) => a.startsWith('--product='))?.replace('--product=', '') ?? process.argv.find((a) => a.startsWith('-p='))?.replace('-p=', '');

if (pk) {
  const product = getProductWithStripePrices(pk);
  const stripe = new Stripe(cfg.stripeApiSecretKey);

  await checkProductStripePricesAreActive(product, stripe);
} else {
  const products = getProductsWithStripePrices();
  const stripe = new Stripe(cfg.stripeApiSecretKey);

  for (const product of products) {
    await checkProductStripePricesAreActive(product, stripe);
  }
}

async function checkProductStripePricesAreActive(product, stripe) {
  // console.log('price', product.price);
  // console.log('price', product.stripePrices);
  for (const pvk in product.stripePrices) {
    console.log('pvk', pvk);
    const stripePrices = product.stripePrices[pvk];
    for (const currency in stripePrices) {
      console.log('currency', currency);
      console.log('price', product.price[currency]);
      const unitAmount = Math.round(product.price[currency] * 100);

      const stripePrice = await stripe.prices.retrieve(stripePrices[currency]);
      console.log('stripePrice.active', stripePrice.active);
      console.log('stripePrice.unit_amount', stripePrice.unit_amount);

      if (!stripePrice.active && unitAmount === stripePrice.unit_amount) {
        console.log('Stripe price is Archived AND Correct. Unarchiving....');
        await stripe.prices.update(stripePrice.id, {active: true});
      }
    }
  }
}
