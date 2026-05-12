import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

const fsp = fs.promises;
const productsExmplDir = path.join(process.cwd(), 'products_examples');
const productsDir = path.join(process.cwd(), 'products');
const configExamplePath = path.join(process.cwd(), 'config', 'config_example.yml');
const configPath = path.join(process.cwd(), 'config', 'config.yml');
const secretsPath = path.join(process.cwd(), 'config', 'secrets.yml');
const prodSecretsPath = path.join(process.cwd(), 'config', 'production.yml');
const testSecretsPath = path.join(process.cwd(), 'config', 'test.yml');
const blogImgDir = path.join(process.cwd(), 'public', 'img', 'blog');

async function copyDirectory(src, dest) {
  const relativeSrc = path.relative(process.cwd(), src);
  const relativeDest = path.relative(process.cwd(), dest);
  if (fs.existsSync(dest)) {
    console.log(`Folder '${relativeDest}' already exists. Skipping copy of '${relativeSrc}'.`);
    return;
  }
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
  console.log(`Copied ${relativeSrc} to ${relativeDest}.`);
}

async function copyFile(src, dest) {
  try {
    if (!fs.existsSync(dest)) {
      await fsp.copyFile(src, dest);
      console.log(`Copied ${src} to ${dest}`);
    } else {
      const relativeDest = path.relative(process.cwd(), dest);
      console.log(`File '${relativeDest}' already exists. Skipping.`);
    }
  } catch (err) {
    console.error(`Failed to copy ${src}:`, err);
    throw err;
  }
}

async function ensureSecretsFile(filePath) {
  if (!fs.existsSync(filePath)) {
    const secrets = {
      exchangerateApiKey: 'YOUR-EXCHANGE-RATE-API-KEY',
      whatsAppNumber: '',
      telegramUsername: '',
      defaultChatMessage: 'Hi! I have a question about your shop.',
    };

    const yamlData = yaml.dump(secrets);
    await fsp.writeFile(filePath, yamlData, 'utf8');
    console.log(`Created ${path.basename(filePath)} with placeholder values.`);
  } else {
    console.log(`File '${path.basename(filePath)}' already exists. Skipping.`);
  }
}

async function ensureEnvSecretsFile(filePath, env = 'test') {
  if (!fs.existsSync(filePath)) {
    const envSecrets = {
      stripeApiPublishableKey: `pk_${env === 'test' ? 'test' : 'live'}_YOUR_PUBLISHABLE_KEY`,
      stripeApiSecretKey: `sk_${env === 'test' ? 'test' : 'live'}_YOUR_SECRET_KEY`,
      paypalClientID: `YOUR_PAYPAL_${env === 'test' ? 'TEST' : 'PRODUCTION'}_CLIENT_ID`,
      paypalClientSecret: `YOUR_PAYPAL_${env === 'test' ? 'TEST' : 'PRODUCTION'}_CLIENT_SECRET`,
      paypalAPI: env === 'test' ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com',
      googleAnalytics: `<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'G-XXXXXXXXXX');
</script>`,
    };

    const yamlData = yaml.dump(envSecrets);
    await fsp.writeFile(filePath, yamlData, 'utf8');
    console.log(`Created ${path.basename(filePath)} with placeholder values.`);
  } else {
    console.log(`File '${path.basename(filePath)}' already exists. Skipping.`);
  }
}

async function ensureBlogImageDir(dirPath) {
  try {
    await fsp.mkdir(dirPath, {recursive: true});
    console.log('Ensured blog image directory exists at:', path.relative(process.cwd(), dirPath));
  } catch (err) {
    console.error('Failed to create blog image directory:', err);
    throw err;
  }
}

(async () => {
  try {
    await copyDirectory(productsExmplDir, productsDir);
    await copyFile(configExamplePath, configPath);
    await ensureSecretsFile(secretsPath);
    await ensureEnvSecretsFile(prodSecretsPath, 'production');
    await ensureEnvSecretsFile(testSecretsPath, 'test');
    await ensureBlogImageDir(blogImgDir);
  } catch (err) {
    console.error('Initialization failed:', err);
    process.exit(1);
  }
})();
