import path from 'path';
import fs from 'fs';
import fsExtra from 'fs-extra';
import config from '../src/config.js';
import {getProducts} from '../src/products.js';
import {getBlogs} from '../src/blogs.js';

//
// Usage:
//     node scripts/generate_redirects.js
//

const pageRoutes = ['about', 'cart', 'blogs'];
const products = getProducts();
const blogs = getBlogs();

async function generateRedirects() {
  const buildDir = path.join(process.cwd(), 'build');
  const productsDir = path.join(buildDir, 'products');
  const blogsDir = path.join(buildDir, 'blogs');
  await fsExtra.ensureDir(buildDir);

  for (const pageRoute of pageRoutes) {
    await generateRedirectHTMLPage(buildDir, pageRoute);
  }

  await fsExtra.ensureDir(productsDir);
  for (const product of products) {
    await generateRedirectHTMLPage(buildDir, `products/${product.pk}`);
  }

  await fsExtra.ensureDir(blogsDir);
  for (const blog of blogs) {
    await generateRedirectHTMLPage(buildDir, `blogs/${blog.handle}`);
  }

  console.log('✅ Redirects generation complete!');
}

async function generateRedirectHTMLPage(buildDir, dirPath) {
  const fileDir = path.join(buildDir, dirPath);
  const filePath = path.join(buildDir, dirPath, 'index.html');
  await fsExtra.ensureDir(fileDir);
  console.log(`📁 Created dir ./build/${dirPath}/`);
  const pageURL = `https://${config.domain}/${dirPath}.html`;
  const content = `<!DOCTYPE html>
<meta charset="utf-8">
<title>Redirecting to ${pageURL}</title>
<meta http-equiv="refresh" content="0; URL=${pageURL}">
<link rel="canonical" href="${pageURL}">`;
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(` ⬅️  Generated: ./build/${dirPath}/index.html`);
}

generateRedirects().catch(console.error);
