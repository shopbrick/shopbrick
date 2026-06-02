import fs from 'fs-extra';
import path, { normalize } from 'path';
import yaml from 'js-yaml';
import {writeYamlFile, convertDescriptionTxtToHtml, lowercaseKeys, encryptValues} from './utils.js';
import config, {env} from './config.js';

const {company, baseCurrency, supportedCurrencies} = config;
export const productsDir = path.join(process.cwd(), 'products');

export function getProducts() {
  const productDirs = fs.readdirSync(productsDir);

  return productDirs.map((pk) => getProduct(pk)).filter(Boolean);
}

export function getProductsObject() {
  return Object.fromEntries(getProducts().map((product) => [product.pk, product]));
}

export function getProduct(pk) {
  const filePath = path.join(productsDir, pk, 'info.yml');
  if (!fs.existsSync(filePath)) return;

  const fileContent = fs.readFileSync(filePath, 'utf8');
  const product = yaml.load(fileContent);
  product.brandedTitle = `${company}™ ${product.title}`;
  product.name = product.branded && product.title.indexOf('™') === -1 ? `${company}™ ${product.title}` : product.title;
  product.images = getProductImages(pk, 'main');
  product.imagesByColor = getProductImagesByColor(pk, product.colors);
  product.description = getProductDescription(pk);
  product.reviews = getProductReviews(pk);
  if (product.reviews.length > 0) {
    product.review_count ||= product.reviews.length;
    product.star_rating ||= Number(
      (product.reviews.reduce((sum, r) => sum + (r.score || 0), 0) / product.reviews.length).toFixed(1)
    );
  }
  if (doesPriceDependOnSize(product)) {
    product.isSizeBasedPrice = true;
    product.size = product.sizes[0];
    // product.price = {...product.price[product.size], ...product.price};  
  }
  if (product.colors) {
    const colorHex = lowercaseKeys(product.color_hex); 
    product.colorHex = Object.fromEntries(product.colors.map(color => [color, colorHex[color.toLowerCase()] ?? config.colorHex[color.toLowerCase()]]));
  }

  return {handle: pk, pk, ...product};
}

function doesPriceDependOnSize(product) {
  return !(baseCurrency in product.price) && Array.isArray(product.sizes) && product.sizes[0] && product.price[product.sizes[0]][baseCurrency];
}

const imageExtensions = /\.(png|jpe?g|webp|gif|bmp|svg)$/i;

function isMainImage(filename) {
  return /(^|[_-])main\d*([_.-])/i.test(filename);
}

function imageOrderComparator(a, b) {
  const aMain = isMainImage(a);
  const bMain = isMainImage(b);

  // main images first
  if (aMain && !bMain) return -1;
  if (!aMain && bMain) return 1;

  // fallback: keep stable-ish order (alphabetical)
  return a.localeCompare(b);
}

function getProductImages(pk, folder = 'main') {
  const imagesChildDir = path.join(productsDir, pk, 'images', folder);

  if (!fs.existsSync(imagesChildDir))
    return folder === 'main' ? ['/img/noimg.webp'] : [];

  const images = fs.readdirSync(imagesChildDir)
    .filter((filename) => imageExtensions.test(filename))
    .sort(imageOrderComparator)
    .map((filename) => `/img/products/${pk}/${folder}/${filename}`);

  if (images.length === 0 && folder === 'main')
    return ['/img/noimg.webp'];

  return images;
};

function getProductImagesByColor(pk, colors) {
  const folder = 'main';
  const imagesChildDir = path.join(productsDir, pk, 'images', folder);
  const res = {};
  if (!colors ||!fs.existsSync(imagesChildDir)) return res;

  const allFilenames = fs.readdirSync(imagesChildDir)
    .filter((filename) => imageExtensions.test(filename));

  for (const color of colors) {
    const colorKey = color.toLowerCase().replaceAll(' ', '-');
    const colorImages = allFilenames
      .filter((filename) => filename.toLowerCase().includes(colorKey))
      .sort(imageOrderComparator)
      .map((filename) => `/img/products/${pk}/${folder}/${filename}`)

    res[color] = colorImages;
  }
  return res;
}

function getProductDescription(pk) {
  const filePath = path.join(productsDir, pk, 'description.html');
  if (!fs.existsSync(filePath)) return getProductDescriptionTxt(pk);

  const description = fs.readFileSync(filePath, 'utf8');
  return description;
}

function getProductDescriptionTxt(pk) {
  let filePath = path.join(productsDir, pk, 'description.txt');
  if (!fs.existsSync(filePath)) filePath = path.join(productsDir, pk, 'desc.txt');
  if (!fs.existsSync(filePath)) return;

  const descriptionTxt = fs.readFileSync(filePath, 'utf8');
  const imageSrcs = getProductImages(pk, 'description');
  return convertDescriptionTxtToHtml(descriptionTxt, imageSrcs);
}

export function getProductPrice(product, currency = baseCurrency, size = product.size) {
  return product.isSizeBasedPrice ? product.price[size][currency] : product.price[currency];
}

export function getProductCompareAtPrice(product, currency = baseCurrency, size = product.size) {
  return product.isSizeBasedPrice ? product.compare_at_price?.[size]?.[currency] : product.compare_at_price?.[currency];
}

function getProductReviews(pk) {
  try {
    const filePath = path.join(productsDir, pk, 'reviews.yml');
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
  const productDirs = fs.readdirSync(productsDir, {withFileTypes: true})
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

  productDirs.forEach((pk) => updateProductPrices(pk, exchRates));
}

function roundPrice(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function calculateCompareAtBasePrice(basePrice, compareAtPriceOffset, compareAtPriceRatio) {
  if (compareAtPriceOffset !== undefined) {
    return roundPrice(basePrice + compareAtPriceOffset);
  }
  if (compareAtPriceRatio !== undefined) {
    return roundPrice(basePrice * compareAtPriceRatio);
  }
  return undefined;
}

function calculateConvertedPrice(value, exchangeRate, roundingCents = []) {
  const converted = exchangeRate * value;
  if (!roundingCents.length) {
    return roundPrice(converted);
  }

  const roundedBase = Math.floor(converted);

  // find nearest preferred cents
  const bestCents = roundingCents.reduce((best, cents) => {
    return Math.abs((roundedBase + cents / 100) - converted)
      < Math.abs((roundedBase + best / 100) - converted)
      ? cents
      : best;
  });

  return roundPrice(roundedBase + bestCents / 100);
}

export function updateProductPrices(pk, exchRates) {
  const filePath = path.join(productsDir, pk, 'info.yml');
  if (!fs.existsSync(filePath)) {
    console.log(`File ${filePath} doesn't exist. Ignoring folder.`);
    return;
  }

  const fileContent = fs.readFileSync(filePath, 'utf8');
  const productData = yaml.load(fileContent);

  if (doesPriceDependOnSize(productData)) {
    for (const size of productData.sizes) {
      const baseSizePrice = productData.price[size][baseCurrency];

      for (const currency of supportedCurrencies) {
        if (currency !== baseCurrency) {
          productData.price[size][currency] = calculateConvertedPrice(baseSizePrice, exchRates[currency], productData.price_rounding_cents);
        }
      }
    }
  } else {
    const basePrice = productData.price[baseCurrency];
    if (!basePrice) {
      console.log(`Base price for product ${pk} doesn't exist.`);
      return;
    }

    for (const currency of supportedCurrencies) {
      if (currency !== baseCurrency) {
        productData.price[currency] = calculateConvertedPrice(basePrice, exchRates[currency], productData.price_rounding_cents);
      }
    }
  }

  updaateProductCompareAtPrices(productData, exchRates);

  const relativePath = path.relative(process.cwd(), filePath);
  console.log(`Writing ${relativePath}…`);
  writeYamlFile(filePath, productData);
}

function updaateProductCompareAtPrices(product, exchRates) {
  const hasCompareAtConfig = product.compare_at_price_offset !== undefined || product.compare_at_price_ratio !== undefined || product.compare_at_price !== undefined;
  if (!hasCompareAtConfig) {
    return;
  }

  if (!product.compare_at_price) {
    product.compare_at_price = {};
  }

  if (doesPriceDependOnSize(product)) {
    for (const size of product.sizes) {
      const basePrice = product.price[size][baseCurrency];

      if (!product.compare_at_price[size]) {
        product.compare_at_price[size] = {};
      }

      const existingBaseCompareAtPrice = product.compare_at_price[size][baseCurrency];
      if (!existingBaseCompareAtPrice || existingBaseCompareAtPrice <= basePrice) {
        const calculatedBaseCompareAtPrice = calculateCompareAtBasePrice(basePrice, product.compare_at_price_offset, product.compare_at_price_ratio);
        if (calculatedBaseCompareAtPrice !== undefined) {
          product.compare_at_price[size][baseCurrency] = calculatedBaseCompareAtPrice;
        }
      }

      const compareAtBasePrice = product.compare_at_price[size][baseCurrency];
      if (!compareAtBasePrice) {
        continue;
      }

      for (const currency of supportedCurrencies) {
        if (currency !== baseCurrency) {
          product.compare_at_price[size][currency] = calculateConvertedPrice(compareAtBasePrice, exchRates[currency], product.price_rounding_cents);
        }
      }
    }
  } else {
    const basePrice = product.price[baseCurrency];

    const existingBaseCompareAtPrice = product.compare_at_price[baseCurrency];
    if (!existingBaseCompareAtPrice || existingBaseCompareAtPrice <= basePrice) {
      const calculatedBaseCompareAtPrice = calculateCompareAtBasePrice(basePrice, product.compare_at_price_offset, product.compare_at_price_ratio);
      if (calculatedBaseCompareAtPrice !== undefined) {
        product.compare_at_price[baseCurrency] = calculatedBaseCompareAtPrice;
      }
    }

    const compareAtBasePrice = product.compare_at_price[baseCurrency];
    if (!compareAtBasePrice) {
      return;
    }

    for (const currency of supportedCurrencies) {
      if (currency !== baseCurrency) {
        product.compare_at_price[currency] = calculateConvertedPrice(compareAtBasePrice, exchRates[currency], product.price_rounding_cents);
      }
    }
  }
}

export function getProductsWithStripePrices() {
  const productDirs = fs.readdirSync(productsDir);

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
  const envSuffix = env === 'production' ? 'live' : 'test';
  const filePath = path.join(productsDir, pk, `stripe_${envSuffix}.yml`);
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

export function serializeProduct(product, opts = {}) {
  const serialized = {
    price: product.price,
    compareAtPrice: product.compare_at_price,
    isSizeBasedPrice: product.isSizeBasedPrice,
    size: product.size,
  };
  if (!opts.inCatalog) {
    serialized.title = product.title;
    serialized.images = product.images;
    serialized.imagesByColor = product.imagesByColor;
    serialized.colors = product.colors;
    if (!product.disabled && !product.out_of_stock) {
      serialized.stripePrices = encryptValues(product.stripePrices, config.encryptionKey);
    }
  }
  return `<script>products['${product.pk}'] = ${JSON.stringify(serialized)};</script>`;
}
