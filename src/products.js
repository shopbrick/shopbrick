import fs from 'fs-extra';
import path from 'path';
import yaml from 'js-yaml';
import {writeYamlFile, convertDescriptionTxtToHtml} from './utils.js';
import config from './config.js';

const {company, baseCurrency, supportedCurrencies} = config;
const dataDir = path.join(process.cwd(), 'data');

export function getProducts() {
  const productDirs = fs.readdirSync(dataDir);

  return productDirs.map((pk) => getProduct(pk)).filter(Boolean);
}

export function getProduct(pk) {
  const filePath = path.join(dataDir, pk, 'info.yml');
  if (!fs.existsSync(filePath)) return;

  const fileContent = fs.readFileSync(filePath, 'utf8');
  const productData = yaml.load(fileContent);
  const brandedTitle = `${company}™ ${productData.title}`;
  const name = productData.branded && productData.title.indexOf('™') === -1 ? `${company}™ ${productData.title}` : productData.title;
  const images = getProductImages(pk, 'main');
  const description = getProductDescription(pk);
  const reviews = getProductReviews(pk);
  if (reviews.length > 0) {
    productData.review_count ||= reviews.length;
    productData.star_rating ||= Number(
      (reviews.reduce((sum, r) => sum + (r.score || 0), 0) / reviews.length).toFixed(1)
    );
  }

  if (doesPriceDependOnSize(productData)) {
    productData.isSizeBasedPrice = true;
    productData.size = productData.sizes[0];
    // productData.price = {...productData.price[productData.size], ...productData.price};
  }

  return {handle: pk, pk, ...productData, brandedTitle, name, images, description, reviews};
}

function doesPriceDependOnSize(productData) {
  return !(baseCurrency in productData.price) && Array.isArray(productData.sizes) && productData.sizes[0] && productData.price[productData.sizes[0]][baseCurrency];
}

const imageExtensions = /\.(png|jpe?g|webp|gif|bmp|svg)$/i;

function getProductImages(pk, folder = 'main') {
  const imagesChildDir = path.join(process.cwd(), 'data', pk, 'images', folder);

  if (!fs.existsSync(imagesChildDir)) return [];

  const images = fs.readdirSync(imagesChildDir)
    .filter((filename) => imageExtensions.test(filename))
    .map((filename) => `/img/products/${pk}/${folder}/${filename}`);

  if (images.length === 0 && folder === 'main')
    return ['/img/noimg.webp'];

  return images;
};

function getProductDescription(pk) {
  const filePath = path.join(dataDir, pk, 'description.html');
  if (!fs.existsSync(filePath)) return getProductDescriptionTxt(pk);

  const description = fs.readFileSync(filePath, 'utf8');
  return description;
}

function getProductDescriptionTxt(pk) {
  let filePath = path.join(dataDir, pk, 'description.txt');
  if (!fs.existsSync(filePath)) filePath = path.join(dataDir, pk, 'desc.txt');
  if (!fs.existsSync(filePath)) return;

  const descriptionTxt = fs.readFileSync(filePath, 'utf8');
  const imageSrcs = getProductImages(pk, 'description');
  return convertDescriptionTxtToHtml(descriptionTxt, imageSrcs);
}

export function getProductPrice(product, currency = baseCurrency, size = product.size) {
  // return Math.floor(product.price[currency] + 0.5) * 2;
  return product.isSizeBasedPrice ? product.price[size][currency] : product.price[currency];
}

export function getProductOldPrice(product) {
  // return Math.floor(product.price[currency] + 0.5) * 2;
  return getProductPrice(product) * 2;
}

function getProductReviews(pk) {
  try {
    const filePath = path.join(dataDir, pk, 'reviews.yml');
    if (!fs.existsSync(filePath)) return [];
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const reviews = yaml.load(fileContents);

    if (Array.isArray(reviews)) {
      return reviews;
    } else {
      console.warn(`Expected array in ${filePath}, got:`, typeof reviews);
      return [];
    }
  } catch (err) {
    console.error(`Failed to read reviews for ${pk}:`, err.message);
    return [];
  }
}

export function getProductVariants(product) {
  const variants = {};
  for (const color of product.colors || [undefined]) {
    for (const size of product.sizes || [undefined]) {
      const pvk = [product.pk, color, size].filter(Boolean).map((v) => v.toLowerCase()).join('-').replaceAll(' ', '_');
      variants[pvk] = {
        name: [product.name, color, size].filter(Boolean).join(' / '),
        color,
        size,
      };
    }
  }
  return variants;
}

export function updateAllProductsPrices(exchRates) {
  const productDirs = fs.readdirSync(dataDir, {withFileTypes: true})
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

  productDirs.forEach((pk) => updateProductPrices(pk, exchRates));
}

export function updateProductPrices(pk, exchRates) {
  const filePath = path.join(dataDir, pk, 'info.yml');
  if (!fs.existsSync(filePath)) {
    console.log(`File ${filePath} doesn't exist. Ignoring folder.`)
    return;
  }

  const fileContent = fs.readFileSync(filePath, 'utf8');
  const productData = yaml.load(fileContent);

  if (doesPriceDependOnSize(productData)) {
    for (const size of productData.sizes) {
      const baseSizePrice = productData.price[size][baseCurrency];

      for (const currency of supportedCurrencies) {
        if (currency !== baseCurrency) {
          productData.price[size][currency] = Math.floor(exchRates[currency] * baseSizePrice * 1.01 + 0.5) - 0.01;
        }
      }
    }
  } else {
    const basePrice = productData.price[baseCurrency];
    if (!basePrice) {
      console.log(`Base price for product ${pk} doesn't exist.`)
      return;
    }

    for (const currency of supportedCurrencies) {
      if (currency !== baseCurrency) {
        productData.price[currency] = Math.floor(exchRates[currency] * basePrice * 1.01 + 0.5) - 0.01;
      }
    }
  }
  console.log(`Writing ${filePath}...`);
  writeYamlFile(filePath, productData);
}

export function getProductsWithStripePrices() {
  const productDirs = fs.readdirSync(dataDir);

  return productDirs.map((pk) => getProductWithStripePrices(pk)).filter(Boolean);
}

export function getProductWithStripePrices(pk) {
  const product = getProduct(pk);
  if (product) {
    product.stripePrices = getStripePrices(pk);
    return product;
  }
}

function getStripePrices(pk) {
  const filePath = path.join(dataDir, pk, 'stripe.yml');
  if (!fs.existsSync(filePath)) return {};

  const stripeData = yaml.load(fs.readFileSync(filePath, 'utf8'));
  const res = {};
  for (const pvk in stripeData) {
    const pvData = {};
    for (const curr in stripeData[pvk].stripe_prices) {
      pvData[curr] = stripeData[pvk].stripe_prices[curr].id;
    }
    res[pvk] = pvData;
  }
  return res;
}
