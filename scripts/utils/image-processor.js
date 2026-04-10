// scripts/utils/image-processor.js
const fs = require('fs-extra');
const path = require('path');

async function processImagePaths(content, articlePath, frontmatter, vaultPath = 'obsidian-vault') {
  // 匹配 Markdown 图片语法，支持多种路径格式:
  // - ![alt](./attachments/image.jpg) - 推荐格式
  // - ![alt](../attachments/image.jpg) - 兼容格式
  // - ![alt](image.jpg) - 同一目录
  // 排除网络图片 (http:// 或 https://)
  const imageRegex = /!\[([^\]]*)\]\((?!https?:\/\/)(\.{0,2}\/?[^)]+)\)/g;
  
  let match;
  let processedContent = content;
  let imageCount = 0;
  
  while ((match = imageRegex.exec(content)) !== null) {
    const [fullMatch, altText, imagePath] = match;
    const filename = path.basename(imagePath);
    const category = frontmatter.category;
    const slug = frontmatter.slug || generateSlug(frontmatter.title);
    
    // 根据图片路径格式确定源路径
    let sourcePath;
    const noteDir = path.dirname(articlePath.replace(vaultPath + path.sep, ''));
    
    if (imagePath.startsWith('./')) {
      // ./attachments/image.jpg - 相对于 vault 根目录
      sourcePath = path.join(vaultPath, imagePath);
    } else if (imagePath.startsWith('../')) {
      // ../attachments/image.jpg - 相对于笔记所在目录的父目录
      sourcePath = path.join(vaultPath, noteDir, imagePath);
    } else {
      // image.jpg - 相对于笔记所在目录
      sourcePath = path.join(vaultPath, noteDir, imagePath);
    }
    
    const targetDir = path.join('img', 'blog', category, slug);
    const targetPath = path.join(targetDir, filename);
    
    await fs.ensureDir(targetDir);
    
    if (await fs.pathExists(sourcePath)) {
      await fs.copy(sourcePath, targetPath);
      
      const newPath = path.join('..', '..', targetPath);
      processedContent = processedContent.replace(fullMatch, `![${altText}](${newPath})`);
      
      imageCount++;
      console.log(`✓ 复制图片: ${filename} (从: ${imagePath})`);
    } else {
      console.warn(`⚠️  图片不存在: ${sourcePath}`);
      console.warn(`   原始路径: ${imagePath}`);
    }
  }
  
  // 检查是否有未处理的本地图片
  const simpleImageRegex = /!\[[^\]]*\]\([^)]+\)/g;
  const allImages = processedContent.match(simpleImageRegex) || [];
  const processedImages = processedContent.match(/!\[[^\]]*\]\(\.\.\/\.\.\/img\/blog\//g) || [];
  const unprocessedImages = allImages.length - processedImages.length;
  
  if (unprocessedImages > 0) {
    console.warn(`⚠️  发现 ${unprocessedImages} 张本地图片未被处理`);
    console.warn('   支持的图片路径格式:');
    console.warn('   - ![描述](./attachments/图片.jpg) - 推荐 (相对于 vault 根目录)');
    console.warn('   - ![描述](../attachments/图片.jpg) - 兼容 (相对于 vault 根目录)');
    console.warn('   - ![描述](图片.jpg) - 同一目录 (相对于笔记所在目录)');
    console.warn('   - 网络图片不会被处理，保持原样');
    
    // 显示具体的未处理图片路径
    const unprocessedMatches = processedContent.match(simpleImageRegex) || [];
    const processedMatches = processedContent.match(/!\[[^\]]*\]\(\.\.\/\.\.\/img\/blog\//g) || [];
    
    unprocessedMatches.forEach(img => {
      if (!processedMatches.some(p => img.includes(p))) {
        const pathMatch = img.match(/!\[[^\]]*\]\(([^)]+)\)/);
        if (pathMatch && !pathMatch[1].startsWith('http')) {
          console.warn(`   - ${img}`);
        }
      }
    });
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
