import path from 'path';
import fs from 'fs';
import fsExtra from 'fs-extra';
import config, {env} from '../src/config.js';
import {getProducts} from '../src/products.js';
import {getBlogs} from '../src/blogs.js';
import {LANGS} from '../src/languages.js';

//
// Usage:
//     ENV=test node scripts/generate_redirects.js
//

const pageRoutes = ['about', 'cart', 'blogs', 'policies/privacy-policy', 'policies/refund-policy', 'policies/shipping-policy', 'policies/terms-of-service'];
const products = getProducts();
const blogs = getBlogs();
const buildFolder = env !== 'test' ? 'build' : 'build_test';
const buildDir = path.join(process.cwd(), buildFolder);
const defaultLang = config.defaultLanguage;

async function generateRedirects(language) {
  const isDefaultLang = language === defaultLang;
  const langPref = isDefaultLang ? '' : `${language}/`;
  const productsDir = path.join(buildDir, 'products');
  const blogsDir = path.join(buildDir, 'blogs');
  await fsExtra.ensureDir(buildDir);

  for (const pageRoute of pageRoutes) {
    await generateRedirectHTMLPage(`${langPref}${pageRoute}`);
  }

  for (const product of products) {
    await generateRedirectHTMLPage(`${langPref}products/${product.pk}`);
  }

  for (const blog of blogs) {
    await generateRedirectHTMLPage(`${langPref}blogs/${blog.handle}`);
  }

  console.log(`✅ Redirects generation for language ${language} complete!`);
}

async function generateRedirectHTMLPage(dirPath) {
  const fileDir = path.join(buildDir, dirPath);
  await fsExtra.ensureDir(fileDir);
  const filePath = path.join(buildDir, dirPath, 'index.html');
  console.log(`📁 Created dir ./${buildFolder}/${dirPath}/`);
  const pageURL = `https://${config.domain}/${dirPath}.html`;
  const content = `<!DOCTYPE html>
<meta charset="utf-8">
<title>Redirecting to ${pageURL}</title>
<meta http-equiv="refresh" content="0; URL=${pageURL}">
<link rel="canonical" href="${pageURL}">`;
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`⬅️ Redirect: ./${buildFolder}/${dirPath}/index.html`);
}

for (const language of LANGS) {
  generateRedirects(language).catch(console.error);
}

async function generateMainLanguageRedirects() {
  for (const pageRoute of pageRoutes) {
    await generateRootRedirectHTMLPage(pageRoute);
  }

  for (const product of products) {
    await generateRootRedirectHTMLPage(`products/${product.pk}`);
  }

  for (const blog of blogs) {
    await generateRootRedirectHTMLPage(`blogs/${blog.handle}`);
  }
}

async function generateRootRedirectHTMLPage(p) {
  const enDir = path.join(buildDir, defaultLang);
  const pageURL = `https://${config.domain}/${p}.html`;

  const content = `<!DOCTYPE html>
<meta charset="utf-8">
<title>Redirecting to ${pageURL}</title>
<meta http-equiv="refresh" content="0; URL=${pageURL}">
<link rel="canonical" href="${pageURL}">`;

  await fsExtra.ensureDir(path.join(enDir, p));

  const f1 = path.join(enDir, `${p}.html`);
  fs.writeFileSync(f1, content, 'utf-8');

  const f2 = path.join(enDir, p, 'index.html');
  fs.writeFileSync(f2, content, 'utf-8');

  console.log(`⬅️ Redirect from: /${defaultLang}/${p}.html`);
}

generateMainLanguageRedirects().catch(console.error);
