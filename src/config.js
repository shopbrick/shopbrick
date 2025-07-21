import fs from 'fs-extra';
import path from 'path';
import yaml from 'js-yaml';
import {env} from 'node:process';

const encryptionKey = 'v8aNKRf7NaTT';

function getConfig() {
  console.log('Parsing config.yml ...');
  const config = yaml.load(fs.readFileSync(path.join(process.cwd(), 'config', 'config.yml'), 'utf8'));

  if (env.CONFIG) {
    env.CONFIG.split(',').map(name => name.trim()).forEach(name => {
      loadAndMergeYaml(config, name);
    });
  }
  loadAndMergeYaml(config, 'secrets', {optional: true});
  config.baseCurrency ||= config.currencyUnit;
  config.aboutLines = config.about.split(/\r?\n/);
  config.formatCurrency = (number) =>
    new Intl.NumberFormat(config.locale, { style: 'currency', currency: config.baseCurrency }).format(number);
  config.encryptionKey ||= encryptionKey;
  return config;
}

function loadAndMergeYaml(config, filename, options = {}) {
  const filePath = path.join(process.cwd(), 'config', `${filename}.yml`);
  if (!fs.existsSync(filePath)) {
    if (options.optional) return;
    throw new Error(`File ${filePath} doesn't exist.`);
  }
  const loaded = yaml.load(fs.readFileSync(filePath, 'utf8'));
  Object.assign(config, loaded);
}

export default getConfig();
