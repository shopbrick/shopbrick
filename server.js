import express from 'express';
import {join} from 'path';
import fs from 'fs-extra';
import {getProductWithStripePrices, getProductsWithStripePrices, getProductPrice, getProductOldPrice} from './src/products.js';
import config from './src/config.js';
import {getBlogs} from './src/blogs.js';
import {indexBy, encryptValues} from './src/utils.js';
import countries from './src/countries.js';
import currencies from './src/currencies.js';

const app = express();
const blogs = getBlogs();
const blogMap = indexBy(blogs, (blog) => blog.handle);

app.set('view engine', 'ejs');
app.use(express.static('public'));

app.use((_req, res, next) => {
  res.locals.getProductPrice = getProductPrice;
  res.locals.getProductOldPrice = getProductOldPrice;
  res.locals.site = config;
  res.locals.formatCurrency = config.formatCurrency;
  res.locals.countries = countries;
  res.locals.currencies = currencies;
  res.locals.encryptValues = encryptValues;
  next();
});

app.get('/', (_req, res) => {
  const products = getProductsWithStripePrices();
  const featuredProducts = products.filter((p) => p.featuring_product);
  res.render('index', {featuredProducts, products});
});

app.get('/about.html', (_req, res) => {
  res.render('about');
});

app.get('/404.html', (_req, res) => {
  const products = getProductsWithStripePrices();
  res.render('404', {products});
});

app.get('/img/products/:handle/:category/:filename', (req, res) => {
  const {handle, category, filename} = req.params;
  const filePath = join(process.cwd(), 'data', handle, 'images', category, filename);

  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send('Page not found');
  }
});

app.get('/products/:handle.html', (req, res) => {
  const {handle} = req.params;
  const product = getProductWithStripePrices(handle);

  if (product) {
    res.render('product', {product});
  } else {
    res.status(404).send('Page not found');
  }
});

app.get('/cart.html', (_req, res) => {
  res.render('cart');
});

app.get('/policies/:policy.html', (req, res) => {
  const {policy} = req.params;
  res.render('policy', {policy});
});

app.get('/blogs.html', (_req, res) => {
  res.render('blogs', {blogs});
});

app.get('/blogs/:handle.html', (req, res) => {
  const {handle} = req.params;
  res.render('blog', {blog: blogMap[handle]});
});

app.get('/success.html', (_req, res) => {
  res.render('success');
});

app.listen(3002, () => {
  console.log('Server running on http://localhost:3002');
});
