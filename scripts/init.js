import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

const fsp = fs.promises;
const dataExmplDir = path.join(process.cwd(), 'data_examples');
const dataDir = path.join(process.cwd(), 'data');
const secretsPath = path.join(process.cwd(), 'config', 'secrets.yml');
const blogImgDir = path.join(process.cwd(), 'public', 'img', 'blog');

async function copyDirectory(src, dest) {
  await fsp.mkdir(dest, {recursive: true});
  const entries = await fsp.readdir(src, {withFileTypes: true});

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyDirectory(srcPath, destPath);
    } else {
      await fsp.copyFile(srcPath, destPath);
    }
  }
}

async function ensureSecretsFile(filePath) {
  if (!fs.existsSync(filePath)) {
    const secrets = {
      exchangerateApiKey: 'YOUR-EXCHANGE-RATE-API-KEY',
      stripeApiSecretKey: 'sk_test_YOUR_SECRET_KEY',
      stripeApiPublishableKey: 'pk_test_YOUR_PUBLISHABLE_KEY',
      paypalClientID: 'YOUR_PAYPAL_CLIENT_ID',
      paypalClientSecret: 'YOUR_PAYPAL_CLIENT_SECRET',
      paypalAPI: 'https://api-m.sandbox.paypal.com'
    };

    const yamlData = yaml.dump(secrets);
    await fsp.writeFile(filePath, yamlData, 'utf8');
    console.log('Created secrets.yml with placeholder values.');
  } else {
    console.log('secrets.yml already exists. Skipping.');
  }
}

async function ensureBlogImageDir(dirPath) {
  try {
    await fsp.mkdir(dirPath, {recursive: true});
    console.log('Ensured blog image directory exists at:', dirPath);
  } catch (err) {
    console.error('Failed to create blog image directory:', err);
    throw err;
  }
}

(async () => {
  try {
    await copyDirectory(dataExmplDir, dataDir);
    console.log('Copied data_examples to data.');
    await ensureSecretsFile(secretsPath);
    await ensureBlogImageDir(blogImgDir);
  } catch (err) {
    console.error('Initialization failed:', err);
    process.exit(1);
  }
})();
