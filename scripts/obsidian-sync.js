#!/usr/bin/env node
// scripts/obsidian-sync.js

const fs = require('fs-extra');
const path = require('path');
const { loadConfig } = require('./utils/config');
const { validateFrontmatter, parseFrontmatter } = require('./utils/frontmatter');
const { convertMarkdownToHtml } = require('./utils/markdown-converter');
const { processImagePaths } = require('./utils/image-processor');
const { getBlogCategory } = require('./utils/category-map');
const { createBackup } = require('./utils/backup');
const Logger = require('./utils/logger');

class ObsidianSync {
  constructor(options = {}) {
    this.config = options.config || loadConfig();
    this.logger = options.logger || new Logger(this.config.logging);
    this.dryRun = options.dryRun || false;
  }

  async syncObsidianToBlog(options = {}) {
    const { filePath } = options;
    
    if (filePath) {
      return await this.syncSingleFile(filePath);
    } else {
      return await this.syncAllFiles();
    }
  }

  async syncSingleFile(filePath) {
    try {
      this.logger.info(`开始同步文件: ${filePath}`);
      
      const fullPath = path.join(this.config.obsidian.vaultPath, filePath);
      
      if (!await fs.pathExists(fullPath)) {
        throw new Error(`文件不存在: ${fullPath}`);
      }
      
      const content = await fs.readFile(fullPath, 'utf8');
      const { data: frontmatter, content: markdownContent } = parseFrontmatter(content);
      
      const validation = validateFrontmatter(frontmatter, this.config.templates.frontmatter.required);
      
      if (!validation.valid) {
        throw new Error(`Front Matter 验证失败: ${validation.errors.join(', ')}`);
      }
      
      if (frontmatter.status !== 'published') {
        this.logger.info(`跳过草稿文件: ${filePath}`);
        return { success: true, skipped: true };
      }
      
      if (!this.dryRun) {
        await createBackup(fullPath, this.config.sync.backupPath);
      }
      
      const processedContent = await processImagePaths(markdownContent, fullPath, frontmatter);
      
      const htmlContent = convertMarkdownToHtml(processedContent, {
        articlePath: fullPath,
        ...this.config.conversion
      });
      
      const blogCategory = getBlogCategory(path.dirname(filePath));
      const slug = frontmatter.slug || this.generateSlug(frontmatter.title);
      
      const targetDir = path.join(this.config.blog.blogPath, blogCategory);
      const targetPath = path.join(targetDir, `${slug}.html`);
      
      if (!this.dryRun) {
        await fs.ensureDir(targetDir);
        
        const htmlTemplate = this.generateHtmlTemplate(htmlContent, frontmatter);
        await fs.writeFile(targetPath, htmlTemplate, 'utf8');
        
        this.logger.info(`同步完成: ${filePath} -> ${targetPath}`);
      }
      
      return {
        success: true,
        source: fullPath,
        target: targetPath,
        frontmatter
      };
    } catch (error) {
      this.logger.error(`同步失败: ${filePath}`, { error: error.message });
      return { success: false, error: error.message };
    }
  }

  async syncAllFiles() {
    const results = [];
    const categories = Object.keys(require('./utils/category-map').categoryMap);
    
    for (const category of categories) {
      const categoryPath = path.join(this.config.obsidian.vaultPath, category);
      
      if (!await fs.pathExists(categoryPath)) {
        continue;
      }
      
      const files = await fs.readdir(categoryPath);
      const markdownFiles = files.filter(file => file.endsWith('.md'));
      
      for (const file of markdownFiles) {
        const filePath = path.join(category, file);
        const result = await this.syncSingleFile(filePath);
        results.push(result);
      }
    }
    
    return results;
  }

  generateSlug(title) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  generateHtmlTemplate(content, frontmatter) {
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${frontmatter.title}</title>
    <meta name="description" content="${frontmatter.description || ''}">
    <link rel="stylesheet" href="../../css/style.css">
</head>
<body>
    <article class="blog-post">
        <header class="post-header">
            <h1 class="post-title">${frontmatter.title}</h1>
            <div class="post-meta">
                <time class="post-date">${frontmatter.date}</time>
                <span class="post-category">${frontmatter.category}</span>
                ${frontmatter.tags && frontmatter.tags.length > 0 ? 
                  `<div class="post-tags">${frontmatter.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}</div>` : 
                  ''}
            </div>
        </header>
        
        <div class="post-content">
            ${content}
        </div>
    </article>
</body>
</html>`;
  }
}

module.exports = ObsidianSync;

if (require.main === module) {
  const args = process.argv.slice(2);
  const directionIndex = args.indexOf('--direction');
  const fileIndex = args.indexOf('--file');
  const dryRun = args.includes('--dry-run');
  
  if (directionIndex === -1) {
    console.error('错误: 缺少 --direction 参数');
    console.log('用法: node scripts/obsidian-sync.js --direction <obsidian-to-blog|blog-to-obsidian|both> [--file <路径>] [--dry-run]');
    process.exit(1);
  }
  
  const direction = args[directionIndex + 1];
  const filePath = fileIndex !== -1 ? args[fileIndex + 1] : null;
  
  const validDirections = ['obsidian-to-blog', 'blog-to-obsidian', 'both'];
  
  if (!validDirections.includes(direction)) {
    console.error(`错误: 无效的方向 "${direction}"。可用值: ${validDirections.join(', ')}`);
    process.exit(1);
  }
  
  (async () => {
    try {
      const sync = new ObsidianSync({ dryRun });
      
      console.log(`开始同步: ${direction}`);
      
      if (direction === 'obsidian-to-blog') {
        const result = await sync.syncObsidianToBlog({ filePath });
        
        if (result.success) {
          if (result.skipped) {
            console.log(`跳过: ${filePath || '所有草稿文件'}`);
          } else {
            console.log(`成功: ${result.source} -> ${result.target}`);
          }
        } else {
          console.error(`失败: ${result.error}`);
          process.exit(1);
        }
      } else {
        console.log('暂不支持的方向');
        process.exit(1);
      }
      
      console.log('同步完成');
    } catch (error) {
      console.error('同步出错:', error.message);
      process.exit(1);
    }
  })();
}
