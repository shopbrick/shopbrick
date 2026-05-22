import express from 'express';
import path from 'path';
import fs from 'fs';
import fsExtra from 'fs-extra';
import ejs from 'ejs';
import config, {env} from '../src/config.js';
import {getProductsWithStripePrices, getProductPrice, getProductCompareAtPrice, serializeProduct} from '../src/products.js';
import {getBlogs} from '../src/blogs.js';
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
  env,
  getProductPrice,
  getProductCompareAtPrice,
  serializeProduct,
  site: config,
  hasBlogs: blogs.length > 0,
  hasTestimonials: Array.isArray(config.testimonials) && config.testimonials.length > 0,
  formatCurrency: config.formatCurrency,
  countries,
  currencies,
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
  const buildFolder = env !== 'test' ? 'build' : 'build_test';
  const buildDir = path.join(process.cwd(), buildFolder);
  const productsDir = path.join(buildDir, 'products');
  const policiesDir = path.join(buildDir, 'policies');
  const blogsDir = path.join(buildDir, 'blogs');
  await fsExtra.ensureDir(buildDir);
  console.log(`📁 Created dir ./${buildFolder}/`);

  copyDirSync(publicDir, buildDir);
  console.log('💽 Copy public dir complete.');
  uglifyJSfile(path.join(buildDir, 'js', 'cart.js')) && console.log(`🗜️ UglifyJS minified ./${buildFolder}/js/cart.js`);

  for (const page of pages) {
    const filePath = path.join(buildDir, page.output);
    const content = await ejs.renderFile(`views/${page.route}.ejs`, locals);
    fs.writeFileSync(filePath, await minifyHTML(content), 'utf-8');
    console.log(`🌐 Generated: ./${buildFolder}/${page.output}`);
  }

  await fsExtra.ensureDir(productsDir);
  console.log(`📂 Created dir ./${buildFolder}/products/`);

  for (const product of products) {
    copyProductImages(buildFolder, product.pk, 'main');
    copyProductImages(buildFolder, product.pk, 'description');

    const filePath = path.join(productsDir, `${product.pk}.html`);
    const content = await ejs.renderFile('views/product.ejs', {...locals, product});
    fs.writeFileSync(filePath, await minifyHTML(content), 'utf-8');
    console.log(`🌐 Generated: ./${buildFolder}/products/${product.pk}.html`);
  }

  await fsExtra.ensureDir(policiesDir);
  console.log(`📂 Created dir ./${buildFolder}/policies/`);

  for (const policy of policies) {
    const filePath = path.join(policiesDir, `${policy}.html`);
    const content = await ejs.renderFile('views/policy.ejs', {...locals, policy});
    fs.writeFileSync(filePath, await minifyHTML(content), 'utf-8');
    console.log(`🏛️ Generated: ./${buildFolder}/policies/${policy}.html`);
  }

  await fsExtra.ensureDir(blogsDir);
  console.log(`📂 Created dir ./${buildFolder}/blogs/`);

  for (const blog of blogs) {
    const filePath = path.join(blogsDir, `${blog.handle}.html`);
    const content = await ejs.renderFile('views/blog.ejs', {...locals, blog});
    fs.writeFileSync(filePath, await minifyHTML(content), 'utf-8');
    console.log(`🌐 Generated: ./${buildFolder}/blogs/${blog.handle}.html`);
  }

  const filePath = path.join(buildDir, 'CNAME');
  fs.writeFileSync(filePath, `${config.domain}\n`, 'utf-8');
  console.log(`🌏 Generated: ./${buildFolder}/blogs/CNAME`);

  console.log('✅ Static site generation complete!');
}

generateStaticSite().catch(console.error);

// import * as _ from './generate_redirects.js';
await import('./generate_redirects.js');
