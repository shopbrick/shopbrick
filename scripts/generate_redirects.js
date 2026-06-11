import path from 'path';
import fs from 'fs';
import fsExtra from 'fs-extra';
import config, {env} from '../src/config.js';
import {getProducts} from '../src/products.js';
import {getBlogs} from '../src/blogs.js';
import {LANGS} from '../src/languages.js';

//
// Usage:
//     node scripts/generate_redirects.js
//

const pageRoutes = ['about', 'cart', 'blogs', 'policies/privacy-policy', 'policies/refund-policy', 'policies/shipping-policy', 'policies/terms-of-service'];
const products = getProducts();
const blogs = getBlogs();
const buildFolder = env !== 'test' ? 'build' : 'build_test';
const globalBuildDir = path.join(process.cwd(), buildFolder);
const defaultLang = config.defaultLanguage;

async function generateRedirects(language) {
  const isDefaultLang = language === defaultLang;
  const langPref = isDefaultLang ? '' : `${language}/`;
  const buildDir = isDefaultLang ? globalBuildDir : path.join(globalBuildDir, language);
  const productsDir = path.join(buildDir, 'products');
  const blogsDir = path.join(buildDir, 'blogs');
  await fsExtra.ensureDir(buildDir);

  for (const pageRoute of pageRoutes) {
    await generateRedirectHTMLPage(buildDir, `${langPref}${pageRoute}`);
  }

  await fsExtra.ensureDir(productsDir);
  for (const product of products) {
    await generateRedirectHTMLPage(buildDir, `${langPref}products/${product.pk}`);
  }

  await fsExtra.ensureDir(blogsDir);
  for (const blog of blogs) {
    await generateRedirectHTMLPage(buildDir, `${langPref}blogs/${blog.handle}`);
  }

  console.log(`✅ Redirects generation for language ${language} complete!`);
}

async function generateRedirectHTMLPage(buildDir, dirPath) {
  const fileDir = path.join(buildDir, dirPath);
  await fsExtra.ensureDir(fileDir);
  const filePath = path.join(buildDir, dirPath, 'index.html');
  // console.log(`📁 Created dir ./${buildFolder}/${dirPath}/`);
  const pageURL = `https://${config.domain}/${dirPath}.html`;
  const content = `<!DOCTYPE html>
<meta charset="utf-8">
<title>Redirecting to ${pageURL}</title>
<meta http-equiv="refresh" content="0; URL=${pageURL}">
<link rel="canonical" href="${pageURL}">`;
  fs.writeFileSync(filePath, content, 'utf-8');
  // console.log(` ⬅️  Generated: ./${buildFolder}/${dirPath}/index.html`);
  console.log(`⬅️ Redirect: ./${buildFolder}/${dirPath}/index.html`);
}

for (const language of LANGS) {
  generateRedirects(language).catch(console.error);
}

async function generateMainLanguageRedirects() {
  const enDir = path.join(globalBuildDir, defaultLang);
  await fsExtra.ensureDir(enDir);

  await fsExtra.ensureDir(path.join(enDir, 'policies'));
  for (const pageRoute of pageRoutes) {
    await generateRootRedirectHTMLPage(pageRoute, enDir);
  }

  const productsDir = path.join(enDir, 'products');
  await fsExtra.ensureDir(productsDir);
  for (const product of products) {
    await generateRootRedirectHTMLPage(`products/${product.pk}`, enDir);
  }

  const blogsDir = path.join(enDir, 'blogs');
  await fsExtra.ensureDir(blogsDir);
  for (const blog of blogs) {
    await generateRootRedirectHTMLPage(`blogs/${blog.handle}`, enDir);
  }
}

async function generateRootRedirectHTMLPage(p, enDir) {
  const pageURL = `https://${config.domain}/${p}.html`;

  const content = `<!DOCTYPE html>
<meta charset="utf-8">
<title>Redirecting to ${pageURL}</title>
<meta http-equiv="refresh" content="0; URL=${pageURL}">
<link rel="canonical" href="${pageURL}">`;

  const f1 = path.join(enDir, `${p}.html`);
  fs.writeFileSync(f1, content, 'utf-8');
  console.log(`⬅️ Redirect: /${defaultLang}/${p}.html`);

  await fsExtra.ensureDir(path.join(enDir, p));
  const f2 = path.join(enDir, p, 'index.html');
  fs.writeFileSync(f2, content, 'utf-8');
  // console.log(`⬅️ Redirect: /${defaultLang}/${p}/index.html`);
}

generateMainLanguageRedirects().catch(console.error);
