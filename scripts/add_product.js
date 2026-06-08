import fs from 'fs';
import path from 'path';

const productsFolder = 'products';

//
// Usage:
//     node scripts/add_product.js foldable-cat-hammock
//     npm run add-product small-breaks-strong-habits-t-shirt
//
const productName = process.argv.slice(2).join('-');

if (!productName) {
  console.error("Error: product name parameter is required\nUsage:\nnpm run add-product my-product-name");
  process.exit(1);
}

const pk = productName.toLowerCase();
const folderPath = path.join(productsFolder, pk);

fs.mkdirSync(folderPath, {recursive: true});

const productTitle = pk
  .split('-')
  .map(word => word.charAt(0).toUpperCase() + word.slice(1))
  .join(' ');

const infoYmlContent = `title: ${productTitle}
sale: true
featuring_product: false
star_rating: 4.8
review_count: 9
colors:
  - Black
  - Navy
  - Irish Green
  - Natural
sizes:
  - S
  - M
  - L
  - XL
  - 2XL
  - 3XL
price:
  S:
    GBP: 24.99
  M:
    GBP: 24.99
  L:
    GBP: 24.99
  XL:
    GBP: 24.99
  2XL:
    GBP: 26.99
  3XL:
    GBP: 27.99
compare_at_price_offset: 5
price_rounding_cents: [49, 99]
`;

fs.writeFileSync(path.join(folderPath, 'info.yml'), infoYmlContent);
fs.writeFileSync(path.join(folderPath, 'description.txt'), '');

const imagesDirPath = path.join(productsFolder, pk, 'images');
fs.mkdirSync(imagesDirPath);

// const descImagesDirPath = path.join(productsFolder, pk, 'images', 'description');
// fs.mkdirSync(descImagesDirPath, {recursive: true});

console.log(`Created folder and files for productKey: ${pk}`);
