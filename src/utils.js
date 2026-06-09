import fs from 'fs-extra';
import yaml from 'js-yaml';

export function indexBy(items, callbackFn) {
  const res = {};
  for (const item of items) {
    res[callbackFn(item)] = item;
  }
  return res;
}

export function writeYamlFile(filePath, data) {
  const newYaml = yaml.dump(data, {lineWidth: -1, noRefs: true, condenseFlow: true});
  fs.writeFileSync(filePath, newYaml, 'utf8');
}

function encrypt(text, key) {
  return text.split('').map((char, i) => {
    return (char.charCodeAt(0) ^ key.charCodeAt(i % key.length)).toString(16).padStart(2, '0');
  }).join('');
}

export function encryptValues(obj, encrptKey) {
  const res = {};
  for (const key in obj) {
    res[key] = encrypt(JSON.stringify(obj[key]), encrptKey);
  }
  return res;
}

export function lowercaseKeys(obj) {
  return Object.fromEntries(
    Object.entries(obj ?? {}).map(([key, value]) => [key.toLowerCase(), value])
  );
}
