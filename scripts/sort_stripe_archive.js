import {getProducts, getProduct, getProductVariants} from '../src/products.js';
import {getArchivedPrices, saveArchivedPrices} from '../src/stripe.js';

//
// Usage:
//     node scripts/sort_stripe_archive.js --product=<product-handle>
//     node scripts/sort_stripe_archive.js
//

const pk = process.argv.find((a) => a.startsWith('--product='))?.replace('--product=', '') ?? process.argv.find((a) => a.startsWith('-p='))?.replace('-p=', '');

if (pk) {
  const product = getProduct(pk);
  sortProductStripeArchivePrices(product);
} else {
  const products = getProducts();
  for (const product of products) {
    sortProductStripeArchivePrices(product);
  }
}

function sortProductStripeArchivePrices(product) {
  const productVariants = getProductVariants(product);

  for (const pvk in productVariants) {
    console.log('pvk:', pvk);
    const archivedPrices = getArchivedPrices(product.pk, pvk);
    console.log('archivedPrices:', archivedPrices);
    saveArchivedPrices(product.pk, pvk, archivedPrices);
  }
}
