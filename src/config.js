import fs from 'fs-extra';
import path from 'path';
import yaml from 'js-yaml';

const defaultEncryptionKey = 'v8aNKRf7NaTT';

const envRaw = process.env.ENV ?? 'test';
const testEnv = 'test';
const prodEnv = 'production';
const prodAliases = ['prod', 'live'];
const knownEnvs = [testEnv, prodEnv, ...prodAliases];
if (!knownEnvs.includes(envRaw)) throw new Error(`ENV variable is set to '${envRaw}', but it should be one of: ${knownEnvs.join(', ')}.`);
export const env = prodAliases.includes(envRaw) ? prodEnv : envRaw;
console.log(`Running in '${env}' environment.`);

function getConfig() {
  console.log('Parsing config.yml…');
  const config = yaml.load(fs.readFileSync(path.join(process.cwd(), 'config', 'config.yml'), 'utf8'));

  if (env.CONFIG) {
    env.CONFIG.split(',').map(name => name.trim()).forEach(name => {
      loadAndMergeYaml(config, name);
    });
  }
  loadAndMergeYaml(config, 'secrets', {optional: true});
  loadAndMergeYaml(config, env, {optional: true});
  config.baseCurrency ||= config.currencyUnit;
  config.aboutLines = config.about.split(/\r?\n/);
  config.formatCurrency = (number) =>
    new Intl.NumberFormat(config.locale, { style: 'currency', currency: config.baseCurrency }).format(number);
  config.encryptionKey ||= defaultEncryptionKey;
  return config;
}

function loadAndMergeYaml(config, filename, options = {}) {
  const filePath = path.join(process.cwd(), 'config', `${filename}.yml`);
  if (!fs.existsSync(filePath)) {
    if (options.optional) {
      const relativePath = path.relative(process.cwd(), filePath);
      console.warn(`Config file ${relativePath} not found. Skipping.`);
      return;
    }
    throw new Error(`File ${relativePath} doesn't exist.`);
  }
  console.log(`Parsing ${filename}.yml…`);
  const loaded = yaml.load(fs.readFileSync(filePath, 'utf8'));
  Object.assign(config, loaded);
}

export default getConfig();
