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

export function convertDescriptionTxtToHtml(descriptionTxt, imageSrcs) {
  const lines = descriptionTxt.split('\n').map(line => line.trim()).filter(Boolean);

  const htmlLines = [];
  let inList = false;
  let imageIndex = 0;
  let headingSeen = false;

  const insertImage = () => {
    if (imageIndex < imageSrcs.length) {
      const imageHtml = `<img src="${imageSrcs[imageIndex++]}" class="rounded-lg w-full shadow-md mt-4">`;
      htmlLines.push(imageHtml);
    }
  };

  for (let line of lines) {
    // Section headings
    if (/^(Features|Size|Note|Tips|Specifications):?/i.test(line) || line.length <= 15 && line.indexOf(':') === -1) {
      if (headingSeen) insertImage(); // Skip image before the first heading
      headingSeen = true;

      if (inList) {
        htmlLines.push('</ul>');
        inList = false;
      }

      htmlLines.push(`<h3 class="mt-4 text-xl font-semibold text-slate-800 dark:text-slate-300">${line}</h3>`);
    }

    // List items
    else if (/^\d+\.\s/.test(line)) {
      if (!inList) {
        htmlLines.push('<ul class="list-disc list-inside mt-2 space-y-1">');
        inList = true;
      }

      htmlLines.push(`<li class="text-slate-700 dark:text-slate-400">${line.replace(/^\d+\.\s*/, '')}</li>`);
    }

    // Paragraph lines with bold label
    else {
      if (inList) {
        htmlLines.push('</ul>');
        inList = false;
      }

      const colonIndex = line.indexOf(':');
      if (line.length <= 50 && colonIndex !== -1 && colonIndex < line.length - 1) {
        const label = line.slice(0, colonIndex + 1);
        const value = line.slice(colonIndex + 1).trim();
        htmlLines.push(`<p class="mt-2 text-lg text-slate-700 dark:text-slate-400">${label} <strong>${value}</strong></p>`);
      } else {
        htmlLines.push(`<p class="mt-2 text-lg text-slate-700 dark:text-slate-400">${line}</p>`);
      }
    }
  }

  if (inList) {
    htmlLines.push('</ul>');
  }

  // Append any remaining images at the end
  while (imageIndex < imageSrcs.length) {
    htmlLines.push(`<img src="${imageSrcs[imageIndex++]}" class="rounded-lg w-full shadow-md mt-4">`);
  }

  return htmlLines.join('\n');
}
