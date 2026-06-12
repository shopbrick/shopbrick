import fs from 'fs-extra';
import path from 'path';
import Stripe from 'stripe';
import site, {env} from '../src/config.js';
import {getStripeProductVariants} from '../src/stripe.js';

const productsDir = path.join(process.cwd(), 'products');

const stripe = new Stripe(
  site.stripeApiSecretKey,
  {maxNetworkRetries: 3}
);

async function getAllProducts() {
  const result = [];

  let starting_after;

  while (true) {
    const page = await stripe.products.list({
      limit: 100,
      starting_after,
    });

    result.push(...page.data);

    if (!page.has_more) break;

    starting_after = page.data.at(-1).id;
  }

  return result;
}

async function getAllPrices() {
  const result = [];

  let starting_after;

  while (true) {
    const page = await stripe.prices.list({
      limit: 100,
      starting_after,
    });

    result.push(...page.data);

    if (!page.has_more) break;

    starting_after = page.data.at(-1).id;
  }

  return result;
}

async function main() {
  const knownProducts = new Set();
  const knownPrices = new Set();

  const productDirs = fs
    .readdirSync(productsDir, {withFileTypes: true})
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  for (const pk of productDirs) {
    const stripeVariants =
      getStripeProductVariants(pk);

    for (const pvk in stripeVariants) {
      const variant = stripeVariants[pvk];

      if (variant.stripe_id) {
        knownProducts.add(variant.stripe_id);
      }

      for (const currency in variant.stripe_prices) {
        knownPrices.add(
          variant.stripe_prices[currency].id
        );
      }
    }
  }

  const stripeProducts =
    await getAllProducts();

  const stripePrices =
    await getAllPrices();

  const productIds =
    new Set(stripeProducts.map((p) => p.id));

  const priceIds =
    new Set(stripePrices.map((p) => p.id));

  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Environment: ${env}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━');

  console.log('');
  console.log(
    `Local products: ${knownProducts.size}`
  );

  console.log(
    `Stripe products: ${stripeProducts.length}`
  );

  console.log(
    `Local prices: ${knownPrices.size}`
  );

  console.log(
    `Stripe prices: ${stripePrices.length}`
  );

  //
  // orphan products
  //

  const orphanProducts =
    stripeProducts.filter(
      (p) => !knownProducts.has(p.id)
    );

  //
  // orphan prices
  //

  const orphanPrices =
    stripePrices.filter(
      (p) => !knownPrices.has(p.id)
    );

  //
  // missing products
  //

  const missingProducts =
    [...knownProducts]
      .filter((id) => !productIds.has(id));

  //
  // missing prices
  //

  const missingPrices =
    [...knownPrices]
      .filter((id) => !priceIds.has(id));

  //
  // inactive prices referenced by YAML
  //

  const inactiveReferencedPrices =
    stripePrices.filter(
      (p) =>
        knownPrices.has(p.id) &&
        !p.active
    );

  console.log('');
  console.log(
    `Orphan products: ${orphanProducts.length}`
  );

  for (const p of orphanProducts) {
    console.log(
      `  ${p.id} (${p.name})`
    );
  }

  console.log('');
  console.log(
    `Orphan prices: ${orphanPrices.length}`
  );

  for (const p of orphanPrices) {
    console.log(
      `  ${p.id} ${p.currency.toUpperCase()} ${(p.unit_amount / 100).toFixed(2)}`
    );
  }

  console.log('');
  console.log(
    `Missing products: ${missingProducts.length}`
  );

  for (const id of missingProducts) {
    console.log(`  ${id}`);
  }

  console.log('');
  console.log(
    `Missing prices: ${missingPrices.length}`
  );

  for (const id of missingPrices) {
    console.log(`  ${id}`);
  }

  console.log('');
  console.log(
    `Inactive prices referenced by YAML: ${inactiveReferencedPrices.length}`
  );

  for (const p of inactiveReferencedPrices) {
    console.log(`  ${p.id}`);
  }

  console.log('');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
