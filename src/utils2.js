import fs from 'fs';
import path from 'path';
import {minify} from 'html-minifier-terser';
import UglifyJS from 'uglify-js';

export function copyDirSync(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

const dataDir = path.join(process.cwd(), 'data');
const buildDir = path.join(process.cwd(), 'build');
const imageExtensions = /\.(png|jpe?g|webp|gif|bmp|svg)$/i;

export function copyProductImages(pk, folder) {
  const srcDir = path.join(dataDir, pk, 'images', folder);
  const destDir = path.join(buildDir, 'img', 'products', pk, folder);

  if (!fs.existsSync(srcDir)) {
    console.error('Source directory does not exist:', srcDir);
    return;
  }
  fs.mkdirSync(destDir, {recursive: true});

  const files = fs.readdirSync(srcDir);

  for (const file of files) {
    const srcFile = path.join(srcDir, file);
    const destFile = path.join(destDir, file);
    const stat = fs.statSync(srcFile);

    if (stat.isFile() && imageExtensions.test(file)) {
      fs.copyFileSync(srcFile, destFile);
    }
  }
  console.log(`🖼️ Images copied: ./${path.join('build', 'img', 'products', pk, folder)}/`);
}

export async function minifyHTML(html) {
  return await minify(html, {
    collapseWhitespace: true,
    removeComments: true,
    removeRedundantAttributes: true,
    removeEmptyAttributes: true,
    minifyJS: true,
    minifyCSS: true,
  });
}

export async function uglifyJSfile(filePath) {
  const code = fs.readFileSync(filePath, 'utf8');
  const result = UglifyJS.minify(code);

  if (result.error) {
    console.error('UglifyJS error:', result.error);
    return false;
  } else {
    fs.writeFileSync(filePath, result.code);
    return true;
  }
}
