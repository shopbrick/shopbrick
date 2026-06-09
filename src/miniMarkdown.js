const FEATURE_HEADING_REGEX =
    /(?<![A-Za-z])(?:Features|Size|Note|Tips|Specifications|Package)(?![A-Za-z])/i;

const LIST_REGEX = /^(?:✔|•|-|\*|\d+\.)\s+/;
const IMAGE_PLACEHOLDER = '[[image]]';
const HTTP = 'http';

export function convertDescriptionTxtToHtml(descriptionTxt, imageSrcs = []) {
  const rawLines = descriptionTxt
    .replace(/\r/g, '')
    .split('\n');

  const html = [];

  let imageIndex = 0;
  let inList = false;
  let inCodeBlock = false;
  let codeBlockLines = [];
  let paragraphLines = [];

  function insertImage() {
    if (imageIndex >= imageSrcs.length) return;

    html.push(
      `<img src="${imageSrcs[imageIndex++]}" class="rounded-lg w-full shadow-md mt-4">`
    );
  }

  function applyInlineFormatting(text) {
    return text.replace(
      /\*\*(.+?)\*\*/g,
      '<span class="font-semibold text-heading">$1</span>'
    );
  }

  function flushParagraph() {
    if (!paragraphLines.length) return;

    html.push(
      `<p class="text-base text-body">${applyInlineFormatting(
        paragraphLines.join(' ')
      )}</p>`
    );

    paragraphLines = [];
  }

  function closeList() {
    if (!inList) return;

    html.push('</ul>');
    inList = false;
  }

  function flushCodeBlock() {
    if (!codeBlockLines.length) return;

    html.push(
      `<div class="bg-gray-100 dark:bg-gray-900 p-5 rounded-2xl border border-transparent divider shadow-sm">`
    );

    for (const line of codeBlockLines) {
      html.push(
        `<p class="text-sm text-body">${applyInlineFormatting(line)}</p>`
      );
    }

    html.push('</div>');

    codeBlockLines = [];
  }

  const lines = rawLines.map(line => line.trim());
  const nextNonEmptyLineAfterIndex = getNextNonEmptyLines(lines);
  const prevNonEmptyLineBeforeIndex = getPrevNonEmptyLines(lines);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const nextLine = nextNonEmptyLineAfterIndex[i] || '';
    const prevLine = prevNonEmptyLineBeforeIndex[i] || '';

    // Empty line = paragraph separator
    if (!line) {
      flushParagraph();
      closeList();
      continue;
    }

    // First line -> h2
    if (i === 0) {
      html.push(
        `<h2 class="text-2xl font-bold text-heading">${applyInlineFormatting(
          line
        )}</h2>`
      );
      continue;
    }

    // Ignore markdown underline
    if (/^-{3,}$/.test(line) && i === 1) {
      continue;
    }

    // Code blocks
    if (line === '```') {
      flushParagraph();
      closeList();

      if (inCodeBlock) {
        flushCodeBlock();
      }
      inCodeBlock = !inCodeBlock;

      continue;
    }

    if (inCodeBlock) {
      codeBlockLines.push(line);
      continue;
    }

    // Explicit image placeholder
    if (line === IMAGE_PLACEHOLDER) {
      flushParagraph();
      closeList();
      insertImage();
      continue;
    }

    // Image URL
    if (
      (line.startsWith(HTTP) || line.startsWith('/img')) &&
      !line.includes(' ') &&
      /\.(jpg|jpeg|png|webp|gif)$/i.test(line)
    ) {
      flushParagraph();
      closeList();

      html.push(
        `<img src="${line}" class="rounded-lg w-full shadow-md mt-4">`
      );

      continue;
    }

    // Horizontal rule
    if (line === '---') {
      flushParagraph();
      closeList();

      html.push('<hr class="divider">');
      continue;
    }

    const nextIsList = LIST_REGEX.test(nextLine);
    const thisIsList = LIST_REGEX.test(line);

    // H3
    if (
      (FEATURE_HEADING_REGEX.test(line) && line.length <= 30)
      ||
      ((nextIsList || prevLine === '---') && !thisIsList)
    ) {
      flushParagraph();
      closeList();

      insertImage();

      html.push(
        `<h3 class="text-xl font-semibold text-heading">${applyInlineFormatting(
          line
        )}</h3>`
      );

      continue;
    }

    // Lists
    if (thisIsList) {
      flushParagraph();

      if (!inList) {
        html.push('<ul class="space-y-2 text-body">');
        inList = true;
      }

      html.push(
        `<li>${applyInlineFormatting(
          line
        )}</li>`
      );

      continue;
    }

    // Normal paragraph
    paragraphLines.push(line);
  }

  flushParagraph();
  closeList();

  if (inCodeBlock) {
    flushCodeBlock();
  }

  while (imageIndex < imageSrcs.length) {
    insertImage();
  }

  return `
<div class="product-description">
${html.join('\n')}
</div>`.trim();
}

function getNextNonEmptyLines(lines) {
  const nextNonEmptyLineAfterIndex = {};
  let nextNonEmptyLine = '';

  for (let i = lines.length - 1; i >= 0; i--) {
    nextNonEmptyLineAfterIndex[i] = nextNonEmptyLine;

    if (lines[i]) {
      nextNonEmptyLine = lines[i];
    }
  }
  return nextNonEmptyLineAfterIndex;
}

function getPrevNonEmptyLines(lines) {
  const prevNonEmptyLineBeforeIndex = {};
  let prevNonEmptyLine = '';

  for (let i = 0; i < lines.length; i++) {
    prevNonEmptyLineBeforeIndex[i] = prevNonEmptyLine;

    if (lines[i]) {
      prevNonEmptyLine = lines[i];
    }
  }
  return prevNonEmptyLineBeforeIndex;
}
