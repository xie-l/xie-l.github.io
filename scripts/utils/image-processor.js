// scripts/utils/image-processor.js
const fs = require('fs-extra');
const path = require('path');

async function processImagePaths(content, articlePath, frontmatter, vaultPath = 'obsidian-vault') {
  // 匹配 Markdown 图片语法: ![alt](./attachments/...)
  const imageRegex = /!\[([^\]]*)\]\((\.\/attachments\/[^)]+)\)/g;
  
  let match;
  let processedContent = content;
  let imageCount = 0;
  
  while ((match = imageRegex.exec(content)) !== null) {
    const [fullMatch, altText, imagePath] = match;
    const filename = path.basename(imagePath);
    const category = frontmatter.category;
    const slug = frontmatter.slug || generateSlug(frontmatter.title);
    
    // 图片路径是相对于 vault 根目录，不是相对于笔记所在目录
    const sourcePath = path.join(vaultPath, imagePath);
    const targetDir = path.join('img', 'blog', category, slug);
    const targetPath = path.join(targetDir, filename);
    
    await fs.ensureDir(targetDir);
    
    if (await fs.pathExists(sourcePath)) {
      await fs.copy(sourcePath, targetPath);
      
      const newPath = path.join('..', '..', targetPath);
      processedContent = processedContent.replace(fullMatch, `![${altText}](${newPath})`);
      
      imageCount++;
      console.log(`✓ 复制图片: ${filename}`);
    } else {
      console.warn(`⚠️  图片不存在: ${sourcePath}`);
      console.warn(`   请检查: obsidian-vault/attachments/ 目录下是否有该文件`);
    }
  }
  
  // 检查是否有未处理的图片（没有使用 ./attachments/ 路径的）
  const simpleImageRegex = /!\[[^\]]*\]\([^)]+\)/g;
  const allImages = processedContent.match(simpleImageRegex) || [];
  const processedImages = processedContent.match(/!\[[^\]]*\]\(\.\.\/img\/blog\//g) || [];
  const unprocessedImages = allImages.length - processedImages.length;
  
  if (unprocessedImages > 0) {
    console.warn(`⚠️  发现 ${unprocessedImages} 张图片未使用 ./attachments/ 路径`);
    console.warn('   提示：请将图片放在 obsidian-vault/attachments/ 文件夹');
    console.warn('   并使用格式: ![描述](./attachments/图片.jpg)');
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
