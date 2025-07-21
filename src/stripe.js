import fs from 'fs-extra';
import path from 'path';
import yaml from 'js-yaml';
import Stripe from 'stripe';
import {writeYamlFile} from './utils.js';
import {getProduct, getProductVariants, getProductPrice} from './products.js';
import site from './config.js';

const dataDir = path.join(process.cwd(), 'data');
const stripeArchive = 'stripe_archive';

export function getStripeProductVariants(pk) {
  const filePath = path.join(dataDir, pk, 'stripe.yml');
  if (!fs.existsSync(filePath)) return {};

  return yaml.load(fs.readFileSync(filePath, 'utf8'));
}

export function saveStripeProductVariants(pk, data) {
  const filePath = path.join(dataDir, pk, 'stripe.yml');

  writeYamlFile(filePath, data);
}

export async function createStripePrice(stripeProductVariant, stripe, currency, unit_amount) {
  const stripePrice = await stripe.prices.create({
    currency: currency.toLowerCase(),
    unit_amount,
    product: stripeProductVariant.stripe_id,
  });
  stripeProductVariant.stripe_prices[currency] = {id: stripePrice.id, unit_amount};
}

export function getArchivedPrices(pk, pvk) {
  const filePath = path.join(dataDir, pk, stripeArchive, `${pvk}.yml`);
  if (!fs.existsSync(filePath)) return {};

  return yaml.load(fs.readFileSync(filePath, 'utf8'));
}

export function saveArchivedPrices(pk, pvk, data) {
  const dir = path.join(dataDir, pk, stripeArchive);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);
  const filePath = path.join(dir, `${pvk}.yml`);
  for (const currency in data) {
    data[currency].sort(comparePricesUnitAmountFn);
  }
  writeYamlFile(filePath, data);
}

function comparePricesUnitAmountFn(a, b) {
  return a.unit_amount - b.unit_amount;
}

export function searchArchivedPrice(sortedPrices, unitAmount) {
  let l = 0, r = sortedPrices.length - 1, m;
  while (l < r) {
    m = Math.floor((l + r) / 2);
    if (unitAmount <= sortedPrices[m].unit_amount) {
      r = m;
    } else {
      l = m + 1;
    }
  }
  if (sortedPrices.length && sortedPrices[r].unit_amount === unitAmount)
    return sortedPrices[r];
}

export async function updateAllStripeProductPrices() {
  const dataDir = path.join(process.cwd(), 'data');
  const productDirs = fs.readdirSync(dataDir, {withFileTypes: true})
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);

  await Promise.all(productDirs.map((pk) => updateStripeProductPrices(pk)))
}

export async function updateStripeProductPrices(pk) {
  const product = getProduct(pk);
  const variants = getProductVariants(product);
  const stripeVariants = getStripeProductVariants(pk);
  const stripe = new Stripe(site.stripeApiSecretKey);

  for (const pvk in variants) {
    const variant = variants[pvk];
    const data = {
      name: variant.name,
      images: product.images.slice(0, 8).map((i) => `https://${site.domain}${i}`),
      statement_descriptor: site.company,
      url: `https://${site.domain}/products/${pk}.html`,
    };

    const stripeVariant = stripeVariants[pvk];
    if (stripeVariant) {
      console.log('Updating Stripe product variant:', stripeVariant);
      const stripeResponse = await stripe.products.update(stripeVariant.stripe_id, data);
      console.log('Updated Stripe product variant:', stripeResponse.id);
      const archivedPrices = getArchivedPrices(pk, pvk);
      console.log('archivedPrices:', archivedPrices);

      for (const currency of site.supportedCurrencies) {
        const unit_amount = Math.round(getProductPrice(product, currency, variant.size) * 100);
        console.log(`PRODUCT PRICE: ${currency}:`, getProductPrice(product, currency, variant.size));
        console.log(`PRICE: ${currency} unit_amount:`, unit_amount);

        if (currency in stripeVariant.stripe_prices) {
          console.log('currency in stripeVariant.stripe_prices:', currency)
          console.log('stripeVariant.stripe_prices[currency]:', stripeVariant.stripe_prices[currency])
          const stripePrice = stripeVariant.stripe_prices[currency];

          if (stripePrice.unit_amount !== unit_amount) {
            archivedPrices[currency] ||= [];
            archivedPrices[currency].push(stripePrice);
            await stripe.prices.update(stripePrice.id, {active: false});

            const matchedArchivedPrice = searchArchivedPrice(archivedPrices[currency] || [], unit_amount);
            if (matchedArchivedPrice) {
              await stripe.prices.update(matchedArchivedPrice.id, {active: true});
              stripeVariant.stripe_prices[currency] = matchedArchivedPrice;
            } else {
              await createStripePrice(stripeVariant, stripe, currency, unit_amount);
            }
          }

        } else {
          await createStripePrice(stripeVariant, stripe, currency, unit_amount);
        }
      };

      saveArchivedPrices(pk, pvk, archivedPrices);

    } else {
      const productVariant = await stripe.products.create(data);
      const pvData = {};
      if (variant.color) {
        pvData.color = variant.color;
      }
      if (variant.size) {
        pvData.size = variant.size;
      }
      pvData.stripe_id = productVariant.id;

      pvData.stripe_prices = {}
      for (const currency of site.supportedCurrencies) {
        const unit_amount = Math.round(getProductPrice(product, currency, variant.size) * 100);
        await createStripePrice(pvData, stripe, currency, unit_amount);
      };

      stripeVariants[pvk] = pvData;
    }
  };

  saveStripeProductVariants(pk, stripeVariants);
}
