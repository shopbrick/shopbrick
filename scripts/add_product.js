import fs from 'fs';
import path from 'path';

//
// Usage:
//     node scripts/add_product.js foldable-cat-hammock
//
const productName = process.argv.slice(2).join('-');

if (!productName) {
  console.error('Error: --productName parameter is required');
  process.exit(1);
}

const pk = productName.toLowerCase();
const folderPath = path.join('data', pk);

fs.mkdirSync(folderPath, {recursive: true});

const productTitle = pk
  .split('-')
  .map(word => word.charAt(0).toUpperCase() + word.slice(1))
  .join(' ');

const infoYmlContent = `title: ${productTitle}
colors:
  - White
  - Gray
price:
  USD: 27.99
`;

fs.writeFileSync(path.join(folderPath, 'info.yml'), infoYmlContent);
fs.writeFileSync(path.join(folderPath, 'description.txt'), '');

const imagesDirPath = path.join('data', pk, 'images');
fs.mkdirSync(imagesDirPath, {recursive: true});

console.log(`Created folder and files for productKey: ${pk}`);
