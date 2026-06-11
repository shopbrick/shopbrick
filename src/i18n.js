import fs from 'fs-extra';
import path from 'path';
import yaml from 'js-yaml';
import {productsDir, getProductDescriptionImages} from './products.js';
import {convertDescriptionTxtToHtml} from './miniMarkdown.js';

function getI18n(pk, lang) {
  const filePath = path.join(productsDir, pk, 'i18n.yml');
  if (!fs.existsSync(filePath)) {
    return;
  }
  return yaml.load(fs.readFileSync(filePath, 'utf8'));
}

export function getTranslatedProductTitle(product, lang) {
  const translations = getI18n(product.pk, lang);

  return translations?.[lang]?.title ?? product.title;
}

export function getTranslatedProductDescription(product, lang) {
  const translations = getI18n(product.pk, lang);
  const descriptionTxt = translations?.[lang]?.description;
  if (!descriptionTxt) {
    return product.description;
  }
  const imageSrcs = getProductDescriptionImages(product.pk);
  return convertDescriptionTxtToHtml(descriptionTxt, imageSrcs);
}
