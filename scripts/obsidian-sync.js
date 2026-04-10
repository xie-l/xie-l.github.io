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
const { updateCategoryIndex } = require('./utils/category-index');
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
      const now = new Date(frontmatter.date);
      
      function pad(n) { return String(n).padStart(2, '0'); }
      const stamp = now.getFullYear() + pad(now.getMonth() + 1);
      
      // 生成文件名：有标题用标题，无标题用日期
      let filename;
      if (frontmatter.title) {
        const safeTitle = frontmatter.title.replace(/[<>:"/\\|?*\u0000-\u001f]/g, '').slice(0, 30);
        filename = `${safeTitle}（${stamp}）.html`;
      } else {
        filename = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}（${stamp}）.html`;
      }
      
      const targetDir = path.join(this.config.blog.blogPath, blogCategory);
      const targetPath = path.join(targetDir, filename);
      
      if (!this.dryRun) {
        await fs.ensureDir(targetDir);
        
        const htmlTemplate = this.generateHtmlTemplate(htmlContent, frontmatter, blogCategory);
        await fs.writeFile(targetPath, htmlTemplate, 'utf8');
        
        // 更新分类索引
        await updateCategoryIndex(
          this.config.blog.blogPath,
          blogCategory,
          filename,
          frontmatter.title,
          frontmatter.tags || [],
          processedContent,
          frontmatter.source
        );
        
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

  generateHtmlTemplate(content, frontmatter, blogCategory) {
    const CAT_NAMES = { 
      life: '生活日记', 
      books: '书籍阅读', 
      tech: '技术思考', 
      analysis: '数据分析', 
      quotes: '摘录记录', 
      thoughts: '随笔思考' 
    };
    const CAT_ICONS = { 
      life: '📅', 
      books: '📚', 
      tech: '💻', 
      analysis: '📊', 
      quotes: '❝', 
      thoughts: '💡' 
    };
    
    function pad(n) { return String(n).padStart(2, '0'); }
    function safe(s) { return String(s || '').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
    
    const title = frontmatter.title;
    const cat = blogCategory;
    const tagList = frontmatter.tags || [];
    const source = frontmatter.source;
    const now = new Date(frontmatter.date);
    
    const catName = CAT_NAMES[cat] || '随笔';
    const catIcon = CAT_ICONS[cat] || '✏️';
    const dateStr = now.getFullYear() + '年' + (now.getMonth() + 1) + '月' + now.getDate() + '日';
    
    const paras = content.split('\n')
      .map(function(l) { return l.trim(); })
      .filter(Boolean)
      .map(function(l) { return '            <p>' + safe(l) + '</p>'; })
      .join('\n');
    
    const tagsHtml = tagList.map(function(t) { 
      return '<span class="tag">' + safe(t) + '</span>'; 
    }).join('\n            ');
    
    const tagClickScript = '<script>\ndocument.querySelectorAll(\'.tag\').forEach(function(el){el.style.cursor=\'pointer\';el.addEventListener(\'click\',function(e){e.preventDefault();e.stopPropagation();location.href=\'../tags.html?tag=\'+encodeURIComponent(el.textContent.trim());});});\n<\/script>';
    
    var sourceHtml = '';
    if (cat === 'quotes' && source && source.trim()) {
      var src = source.trim();
      var isUrl = /^https?:\/\//i.test(src);
      sourceHtml = '\n        <div class="post-source" data-source="' + safe(src) + '">' +
        '<i class="fas fa-link"></i> 来源：' +
        (isUrl ? '<a href="' + safe(src) + '" target="_blank" rel="noopener">' + safe(src) + '</a>' : safe(src)) +
        '</div>';
    }
    
    var headerHtml = (cat === 'thoughts' && !title) ?
      '        <div class="post-meta" style="margin-bottom:24px;justify-content:center;display:flex;gap:16px;color:var(--text-light);font-size:14px">' +
      '<span><i class="fas fa-calendar"></i> ' + dateStr + '</span>' +
      '<span><i class="fas fa-folder"></i> ' + catName + '</span>' +
      (tagList.length ? '<span><i class="fas fa-tags"></i> ' + tagList.join(' / ') + '</span>' : '') +
      '</div>' :
      '        <article class="post-header">\n' +
      '            <h1 class="post-title">' + safe(title) + '</h1>\n' +
      '            <div class="post-meta">\n' +
      '                <span><i class="fas fa-calendar"></i> ' + dateStr + '</span>\n' +
      '                <span><i class="fas fa-folder"></i> ' + catName + '</span>\n' +
      (tagList.length ? '                <span><i class="fas fa-tags"></i> ' + tagList.join(' / ') + '</span>\n' : '') +
      '            </div>\n        </article>';
    
    return '<!DOCTYPE html>\n<html lang="zh-CN">\n<head>\n' +
      '    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
      '    <title>' + safe(title || dateStr) + ' - 谢亮</title>\n' +
      '    <link rel="icon" href="data:image/svg+xml,<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'><text y=\'.9em\' font-size=\'90\'>' + catIcon + '</text></svg>">\n' +
      '    <link rel="stylesheet" href="../../css/style.css">\n' +
      '    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">\n' +
      '    <style>\n' +
      '        .blog-container{max-width:860px;margin:100px auto 60px;padding:0 20px}\n' +
      '        .back-link{display:inline-block;margin-bottom:20px;color:var(--secondary-color);text-decoration:none}\n' +
      '        .post-header{text-align:center;margin-bottom:40px;padding-bottom:30px;border-bottom:1px solid var(--border-color)}\n' +
      '        .post-title{font-size:27px;color:var(--primary-color);margin-bottom:15px;line-height:1.4}\n' +
      '        .post-meta{color:var(--text-light);font-size:14px;display:flex;justify-content:center;gap:20px;flex-wrap:wrap}\n' +
      '        .post-content{background:var(--card-bg,#fff);border-radius:15px;padding:40px;box-shadow:var(--shadow-md);line-height:1.9;font-size:16px}\n' +
      '        .post-content p{margin-bottom:20px;text-align:justify}\n' +
      '        .post-source{font-size:13px;color:var(--text-light);margin-bottom:20px;padding:10px 14px;background:var(--bg-secondary,#f8f9fa);border-radius:8px;border-left:3px solid var(--secondary-color)}\n' +
      '        .post-source a{color:var(--secondary-color);word-break:break-all}\n' +
      '        .post-tags{margin-top:30px;padding-top:20px;border-top:1px solid var(--border-color);display:flex;gap:8px;flex-wrap:wrap}\n' +
      '        .tag{font-size:12px;background:var(--secondary-color);color:#fff;padding:4px 12px;border-radius:20px}\n' +
      '    </style>\n</head>\n<body>\n' +
      '    <div class="blog-container">\n' +
      '        <a href="./" class="back-link"><i class="fas fa-arrow-left"></i> 返回' + catName + '</a>\n' +
      headerHtml + '\n' + sourceHtml +
      '        <div class="post-content">\n' + paras + '\n' +
      '            <div class="post-tags">' + tagsHtml + '</div>\n' +
      '        </div>\n    </div>\n' + tagClickScript + '\n</body>\n</html>';
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
