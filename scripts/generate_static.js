import express from 'express';
import path from 'path';
import fs from 'fs';
import fsExtra from 'fs-extra';
import ejs from 'ejs';
import config from '../src/config.js';
import {getProductsWithStripePrices, getProductPrice, getProductOldPrice} from '../src/products.js';
import {getBlogs} from '../src/blogs.js';
import {encryptValues} from '../src/utils.js';
import {copyDirSync, copyProductImages, minifyHTML, uglifyJSfile} from '../src/utils2.js';
import countries from '../src/countries.js';
import currencies from '../src/currencies.js';

//
// Usage:
//     node scripts/generate_static.js
//
const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(process.cwd(), 'views'));

const products = getProductsWithStripePrices();
const featuredProducts = products.filter((p) => p.featuring_product);
const policies = ['privacy-policy', 'refund-policy', 'shipping-policy', 'terms-of-service'];
const blogs = getBlogs();

const locals = {
  getProductPrice,
  getProductOldPrice,
  site: config,
  formatCurrency: config.formatCurrency,
  countries,
  currencies,
  encryptValues,
  products,
  featuredProducts,
  blogs,
};

const pages = [
  {route: 'index', output: 'index.html'},
  {route: 'about', output: 'about.html'},
  {route: '404', output: '404.html'},
  {route: 'cart', output: 'cart.html'},
  {route: 'blogs', output: 'blogs.html'},
  {route: 'success', output: 'success.html'},
];

async function generateStaticSite() {
  const publicDir = path.join(process.cwd(), 'public');
  const buildDir = path.join(process.cwd(), 'build');
  const productsDir = path.join(buildDir, 'products');
  const policiesDir = path.join(buildDir, 'policies');
  const blogsDir = path.join(buildDir, 'blogs');
  await fsExtra.ensureDir(buildDir);
  console.log('📁 Created dir ./build/');

  copyDirSync(publicDir, buildDir);
  console.log('💽 Copy public dir complete.');
  uglifyJSfile(path.join(buildDir, 'js', 'cart.js')) && console.log('🗜️ UglifyJS minified ./build/js/cart.js');

  for (const page of pages) {
    const filePath = path.join(buildDir, page.output);
    const content = await ejs.renderFile(`views/${page.route}.ejs`, locals);
    fs.writeFileSync(filePath, await minifyHTML(content), 'utf-8');
    console.log(`🌐 Generated: ./build/${page.output}`);
  }

  await fsExtra.ensureDir(productsDir);
  console.log('📂 Created dir ./build/products/');

  for (const product of products) {
    copyProductImages(product.pk, 'main');
    copyProductImages(product.pk, 'description');

    const filePath = path.join(productsDir, `${product.pk}.html`);
    const content = await ejs.renderFile('views/product.ejs', {...locals, product});
    fs.writeFileSync(filePath, await minifyHTML(content), 'utf-8');
    console.log(`🌐 Generated: ./build/products/${product.pk}.html`);
  }

  await fsExtra.ensureDir(policiesDir);
  console.log('📂 Created dir ./build/policies/');

  for (const policy of policies) {
    const filePath = path.join(policiesDir, `${policy}.html`);
    const content = await ejs.renderFile('views/policy.ejs', {...locals, policy});
    fs.writeFileSync(filePath, await minifyHTML(content), 'utf-8');
    console.log(`🏛️ Generated: ./build/policies/${policy}.html`);
  }

  await fsExtra.ensureDir(blogsDir);
  console.log('📂 Created dir ./build/blogs/');

  for (const blog of blogs) {
    const filePath = path.join(blogsDir, `${blog.handle}.html`);
    const content = await ejs.renderFile('views/blog.ejs', {...locals, blog});
    fs.writeFileSync(filePath, await minifyHTML(content), 'utf-8');
    console.log(`🌐 Generated: ./build/blogs/${blog.handle}.html`);
  }

  const filePath = path.join(buildDir, 'CNAME');
  fs.writeFileSync(filePath, `${config.domain}\n`, 'utf-8');
  console.log('🌏 Generated: ./build/blogs/CNAME');

  console.log('✅ Static site generation complete!');
}

generateStaticSite().catch(console.error);

// import * as _ from './generate_redirects.js';
await import('./generate_redirects.js');
