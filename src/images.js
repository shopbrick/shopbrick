import fs from 'fs-extra';
import path from 'path';
import sharp from 'sharp';

const THUMB_SIZE = 160;

export async function generateProductThumbs(productsDir) {
  const productDirs = fs.readdirSync(productsDir, {withFileTypes: true})
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  let generated = 0;
  let skipped = 0;

  for (const handle of productDirs) {
    const imagesDir = path.join(productsDir, handle, 'images');
    const thumbsDir = path.join(imagesDir, 'thumb');

    if (!fs.existsSync(imagesDir)) {
      continue;
    }

    fs.ensureDirSync(thumbsDir);

    const files = fs.readdirSync(imagesDir, {withFileTypes: true});

    for (const file of files) {
      if (!file.isFile()) {
        continue;
      }

      const ext = path.extname(file.name).toLowerCase();

      if (!['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
        continue;
      }

      const sourcePath = path.join(imagesDir, file.name);

      // thumb always stored as webp
      const thumbName =
        path.basename(file.name, ext) + '.webp';

      const thumbPath = path.join(
        thumbsDir,
        thumbName
      );

      let regenerate = false;

      if (!fs.existsSync(thumbPath)) {
        regenerate = true;
      } else {
        const srcStat = fs.statSync(sourcePath);
        const thumbStat = fs.statSync(thumbPath);

        if (srcStat.mtimeMs > thumbStat.mtimeMs) {
          regenerate = true;
        }
      }

      if (regenerate) {
        await sharp(sourcePath)
          .resize(THUMB_SIZE, THUMB_SIZE, {
            fit: 'cover',
            position: 'centre',
          })
          .webp({
            quality: 85,
          })
          .toFile(thumbPath);

        generated++;
      } else {
        skipped++;
      }
    }
  }

  console.log(
    `🖼️  Thumbnails: ${generated} generated, ${skipped} up-to-date`
  );
}

export function thumbUrl(imgUrl, pk) {
  return imgUrl
    .replace(`/img/products/${pk}/`, `/img/products/${pk}/thumb/`)
    .replace(/\.(jpg|jpeg|png)$/i, '.webp');
}
