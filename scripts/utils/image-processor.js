// scripts/utils/image-processor.js
const fs = require('fs-extra');
const path = require('path');

async function processImagePaths(content, articlePath, frontmatter) {
  const imageRegex = /!\[([^\]]*)\]\((\.\/attachments\/[^)]+)\)/g;
  
  let match;
  let processedContent = content;
  
  while ((match = imageRegex.exec(content)) !== null) {
    const [fullMatch, altText, imagePath] = match;
    const filename = path.basename(imagePath);
    const category = frontmatter.category;
    const slug = frontmatter.slug || generateSlug(frontmatter.title);
    
    const sourcePath = path.join(path.dirname(articlePath), imagePath);
    const targetDir = path.join('img', 'blog', category, slug);
    const targetPath = path.join(targetDir, filename);
    
    await fs.ensureDir(targetDir);
    
    if (await fs.pathExists(sourcePath)) {
      await fs.copy(sourcePath, targetPath);
      
      const newPath = path.join('..', '..', targetPath);
      processedContent = processedContent.replace(fullMatch, `![${altText}](${newPath})`);
      
      console.log(`✓ 复制图片: ${filename}`);
    } else {
      console.warn(`⚠️  图片不存在: ${sourcePath}`);
    }
  }
  
  return processedContent;
}

function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-|-$/g, '');
}

function addImageCaptions(html) {
  const figureRegex = /<p>\s*<img src="([^"]+)" alt="([^"]+)"\s*\/?>\s*<\/p>/g;
  
  return html.replace(figureRegex, (match, src, alt) => {
    return `<figure class="blog-image">
  <img src="${src}" alt="${alt}">
  <figcaption>${alt}</figcaption>
</figure>`;
  });
}

function addLazyLoading(html) {
  return html.replace(/<img /g, '<img loading="lazy" ');
}

module.exports = {
  processImagePaths,
  generateSlug,
  addImageCaptions,
  addLazyLoading
};
