import fs from 'fs-extra';
import path from 'path';
import slugify from 'slugify';
import cfg from './config.js';
import {getProduct} from './products.js';

const blogsDir = path.join(process.cwd(), 'blogs');
const fileExt = /\.txt$/i;
const HTTP = 'http';
const IGNORE = /^IGNORE:/i;
const DATE_REGEX = /^(?:\d{4}[-/.]\d{1,2}[-/.]\d{1,2}|\d{1,2}[-/.]\d{1,2}[-/.]\d{4}|\w+\s\d{1,2},?\s\d{4})$/;

export function getBlog(blogFile) {
  const blogPath = path.join(blogsDir, blogFile);
  if (!fs.existsSync(blogPath)) return;

  const fileContent = fs.readFileSync(blogPath, 'utf8');
  return parseBlogFile(fileContent);
}

export function getBlogs() {
  const blogFiles = fs.readdirSync(blogsDir).filter((fname) => fileExt.test(fname)).reverse();

  return blogFiles.map(getBlog).filter(Boolean);
}

function parseBlogFile(fileContent) {
  const lines = fileContent.split('\n').map(line => line.trim()).filter(Boolean);
  if (lines.length < 3) return null;

  const title = lines[0];
  const handle = slugify(title, {lower: true, strict: true});
  const dateCandidate = lines[1];
  const date = DATE_REGEX.test(dateCandidate) ? dateCandidate : null

  const contentLines = [];
  const images = [];

  const startIndex = date ? 2 : 1

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i];

    if (IGNORE.test(line)) break;

    if (
      (line.startsWith(HTTP) || line.startsWith('/img')) &&
      !line.includes(' ') &&
      /\.(jpg|jpeg|png|webp|gif)$/i.test(line)
    ) {
      images.push(line);
    } else {
      if (line.startsWith('/products/') && line.endsWith('.html')) {
        const match = line.match(/^\/products\/([^/]+)\.html$/);
        if (!match) {
          throw new Error(`Invalid product link format: ${line} in blog post: ${fileContent.slice(0, 100)}...`);
        }
      
        const pk = match[1];
        const product = getProduct(pk);
      
        if (!product) {
          throw new Error(`Product not found: "${pk}" linked in blog post: ${fileContent.slice(0, 100)}...`);
        }
      
        const productName = product.title || pk;
        contentLines.push(`<a href="${line}" target="_blank">${productName}</a>`);
      } else {
        contentLines.push(line);
      }
    }
  }

  return {
    handle,
    title,
    date,
    intro: contentLines[0],
    contentLines,
    images,
    url: `https://${cfg.domain}/blogs/${handle}.html`
  };
}
