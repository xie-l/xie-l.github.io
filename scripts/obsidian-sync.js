#!/usr/bin/env node
// scripts/obsidian-sync.js

const fs = require('fs-extra');
const path = require('path');
const { loadConfig } = require('./utils/config');
const { validateFrontmatter, parseFrontmatter } = require('./utils/frontmatter');
const { convertMarkdownToHtml } = require('./utils/markdown-converter');
const { processImagePaths } = require('./utils/image-processor');
const { getBlogCategory, getObsidianFolder } = require('./utils/category-map');
const { createBackup } = require('./utils/backup');
const { updateCategoryIndex } = require('./utils/category-index');
const { htmlToMarkdown } = require('./utils/html-to-markdown');
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
      
      // 验证图片处理结果
      const hasUnprocessedImages = /!\[[^\]]*\]\((?!https?:\/\/)(?!\.\.\/\.\.\/img\/blog\/)[^)]+\)/.test(processedContent);
      if (hasUnprocessedImages) {
        this.logger.warn('发现未处理的本地图片，请检查图片路径格式');
        this.logger.warn('支持的格式: ./attachments/图片.jpg, ../attachments/图片.jpg, 或 图片.jpg');
      }
      
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
        const result = await updateCategoryIndex(
          this.config.blog.blogPath,
          blogCategory,
          filename,
          frontmatter.title,
          frontmatter.tags || [],
          processedContent,
          frontmatter.source
        );
        
        if (result.skipped && result.reason === 'already_exists') {
          this.logger.info(`文件已在索引中，跳过更新: ${filename}`);
        } else if (result.success) {
          this.logger.info(`成功更新分类索引: ${blogCategory}`);
        }
        
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
       '        <div class="post-content">\n' + content + '\n' +
       '            <div class="post-tags">' + tagsHtml + '</div>\n' +
       '        </div>\n    </div>\n' + tagClickScript + '\n</body>\n</html>';
  }
  
  /**
   * 将博客文件同步到Obsidian
   * @param {Object} options - 选项
   * @param {string} options.filePath - 博客文件路径（如"blog/life/xxx.html"）
   */
  async syncBlogToObsidian(options = {}) {
    const { filePath } = options;
    
    if (filePath) {
      return await this.syncSingleHtmlToMd(filePath);
    } else {
      return await this.syncAllHtmlToMd();
    }
  }
  
  /**
   * 同步单个HTML文件到Obsidian
   * @param {string} filePath - 博客文件路径（如"life/xxx.html"）
   */
  async syncSingleHtmlToMd(filePath) {
    try {
      this.logger.info(`开始同步博客文件到Obsidian: ${filePath}`);
      
      const fullPath = path.join(this.config.blog.blogPath, filePath);
      
      if (!await fs.pathExists(fullPath)) {
        throw new Error(`博客文件不存在: ${fullPath}`);
      }
      
      // 读取HTML文件
      const htmlContent = await fs.readFile(fullPath, 'utf8');
      
      // 使用htmlToMarkdown模块转换
      let markdownContent = htmlToMarkdown(htmlContent);
      
      if (!markdownContent) {
        throw new Error('无法将HTML转换为Markdown');
      }
      
      // 提取Frontmatter信息
      const frontmatter = this.extractFrontmatterFromHtml(htmlContent);
      
      // 确保status字段存在（默认为published）
      if (!markdownContent.includes('status:')) {
        // 在frontmatter中添加status字段
        markdownContent = markdownContent.replace(/^---\n/, `---\nstatus: published\n`);
      }
      
      // 确定目标路径
      const vaultCategory = getObsidianFolder(frontmatter.category || 'life');
      const targetDir = path.join(this.config.obsidian.vaultPath, vaultCategory);
      
      // 生成文件名（使用标题或日期）
      const filename = this.generateMarkdownFilename(frontmatter, filePath);
      const targetPath = path.join(targetDir, filename);
      
      // 检查冲突
      const conflict = await this.detectConflict(targetPath, frontmatter);
      
      if (conflict.hasConflict && !this.dryRun) {
        this.logger.warn(`检测到冲突: ${conflict.reason}`);
        await createBackup(targetPath, this.config.sync.backupPath);
      }
      
      if (!this.dryRun) {
        await fs.ensureDir(targetDir);
        await fs.writeFile(targetPath, markdownContent, 'utf8');
      }
      
      this.logger.info(`成功同步到Obsidian: ${targetPath}`);
      
      return {
        success: true,
        source: fullPath,
        target: targetPath,
        skipped: false,
        conflict: conflict.hasConflict
      };
    } catch (error) {
      this.logger.error(`同步失败: ${filePath}`, { error: error.message });
      return {
        success: false,
        error: error.message,
        source: filePath
      };
    }
  }
  
  /**
   * 从HTML中提取Frontmatter信息
   */
  extractFrontmatterFromHtml(htmlContent) {
    const frontmatter = {};
    
    // 提取标题
    const titleMatch = htmlContent.match(/<h1 class="post-title">(.+?)<\/h1>/);
    frontmatter.title = titleMatch ? titleMatch[1].trim() : '';
    
    // 提取日期
    const dateMatch = htmlContent.match(/<i class="fas fa-calendar"><\/i>\s*([^<]+)<\/span>/);
    if (dateMatch) {
      frontmatter.date = this.parseChineseDate(dateMatch[1].trim());
    }
    
    // 提取分类
    const categoryMatch = htmlContent.match(/<i class="fas fa-folder"><\/i>\s*([^<]+)<\/span>/);
    if (categoryMatch) {
      frontmatter.category = this.mapCategoryName(categoryMatch[1].trim());
    }
    
    // 提取标签
    const tagsMatch = htmlContent.match(/<i class="fas fa-tags"><\/i>\s*([^<]+)<\/span>/);
    if (tagsMatch) {
      frontmatter.tags = tagsMatch[1].trim().split('/').map(tag => tag.trim()).filter(tag => tag);
    }
    
    // 提取来源（如果是quotes分类）
    if (frontmatter.category === 'quotes') {
      const sourceMatch = htmlContent.match(/<div class="post-source"[^>]*>([\s\S]*?)<\/div>/);
      if (sourceMatch) {
        const sourceText = sourceMatch[1].replace(/<[^>]+>/g, '').replace('来源：', '').trim();
        frontmatter.source = sourceText;
      }
    }
    
    return frontmatter;
  }
  
  /**
   * 生成Markdown文件名
   */
  generateMarkdownFilename(frontmatter, originalFilePath) {
    let filename;
    
    if (frontmatter.title) {
      // 清理标题中的特殊字符
      const safeTitle = frontmatter.title.replace(/[<>:"/\\|?*\u0000-\u001f]/g, '').slice(0, 50);
      filename = `${safeTitle}.md`;
    } else {
      // 使用日期
      const now = new Date(frontmatter.date || Date.now());
      const pad = (n) => String(n).padStart(2, '0');
      filename = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}.md`;
    }
    
    return filename;
  }
  
  /**
   * 解析中文日期格式
   */
  parseChineseDate(chineseDate) {
    const match = chineseDate.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
    if (match) {
      const year = match[1];
      const month = match[2].padStart(2, '0');
      const day = match[3].padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    return new Date().toISOString().split('T')[0];
  }
  
  /**
   * 将中文分类名映射为blog分类
   */
  mapCategoryName(categoryName) {
    const nameMap = {
      '生活日记': 'life',
      '书籍阅读': 'books',
      '技术思考': 'tech',
      '数据分析': 'analysis',
      '摘录记录': 'quotes',
      '随笔思考': 'thoughts'
    };
    return nameMap[categoryName] || 'life';
  }
  
  /**
   * 同步所有HTML文件到Obsidian
   */
  async syncAllHtmlToMd() {
    const results = [];
    
    try {
      this.logger.info('开始同步所有博客文件到Obsidian');
      
      // 获取所有分类目录
      const categories = ['life', 'tech', 'books', 'quotes', 'analysis', 'thoughts'];
      
      for (const category of categories) {
        const categoryDir = path.join(this.config.blog.blogPath, category);
        
        if (!await fs.pathExists(categoryDir)) {
          this.logger.warn(`分类目录不存在: ${categoryDir}`);
          continue;
        }
        
        // 读取目录中的所有HTML文件
        const files = await fs.readdir(categoryDir);
        const htmlFiles = files.filter(f => f.endsWith('.html') && !f.startsWith('index'));
        
        for (const htmlFile of htmlFiles) {
          const filePath = path.join(category, htmlFile);
          
          try {
            const result = await this.syncSingleHtmlToMd(filePath);
            results.push(result);
          } catch (error) {
            this.logger.error(`同步异常: ${filePath} - ${error.message}`);
            results.push({
              success: false,
              error: error.message,
              source: filePath
            });
          }
        }
      }
      
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;
      const conflicts = results.filter(r => r.conflict).length;
      
      this.logger.info(`所有博客文件同步完成，共处理 ${results.length} 个文件，成功 ${successful} 个，失败 ${failed} 个，冲突 ${conflicts} 个`);
      
      return {
        success: true,
        results: results,
        total: results.length,
        successful: successful,
        failed: failed,
        conflicts: conflicts
      };
    } catch (error) {
      this.logger.error(`批量同步失败: ${error.message}`);
      return {
        success: false,
        error: error.message,
        results: results
      };
    }
  }
  
  /**
   * 检测冲突
   * @param {string} targetPath - 目标文件路径
   * @param {Object} frontmatter - Frontmatter数据
   */
  async detectConflict(targetPath, frontmatter) {
    try {
      if (!await fs.pathExists(targetPath)) {
        return { hasConflict: false };
      }
      
      const existingContent = await fs.readFile(targetPath, 'utf8');
      const { data: existingFrontmatter } = parseFrontmatter(existingContent);
      
      // 检查标题是否不同
      if (existingFrontmatter.title !== frontmatter.title) {
        return {
          hasConflict: true,
          reason: `标题不匹配: "${existingFrontmatter.title}" vs "${frontmatter.title}"`
        };
      }
      
      // 检查日期是否不同
      if (existingFrontmatter.date !== frontmatter.date) {
        return {
          hasConflict: true,
          reason: `日期不匹配: ${existingFrontmatter.date} vs ${frontmatter.date}`
        };
      }
      
      // 检查分类是否不同
      if (existingFrontmatter.category !== frontmatter.category) {
        return {
          hasConflict: true,
          reason: `分类不匹配: ${existingFrontmatter.category} vs ${frontmatter.category}`
        };
      }
      
      return { hasConflict: false };
    } catch (error) {
      this.logger.warn(`冲突检测失败: ${error.message}`);
      return { hasConflict: false };
    }
  }
  
  /**
   * 双向同步主方法
   * @param {Object} options - 选项
   * @param {string} options.filePath - 指定文件路径（可选）
   */
  async syncBidirectional(options = {}) {
    const { filePath } = options;
    const results = {
      obsidianToBlog: null,
      blogToObsidian: null,
      conflicts: [],
      success: true
    };
    
    try {
      this.logger.info('开始双向同步');
      
      // 第一阶段: Obsidian → Blog
      this.logger.info('=== 第一阶段: Obsidian → Blog ===');
      results.obsidianToBlog = await this.syncObsidianToBlog({ filePath });
      
      // 检查Obsidian → Blog是否成功
      // 如果是数组（批量同步），检查是否有成功项
      // 如果是对象（单个文件），检查success属性
      const obsidianSuccess = Array.isArray(results.obsidianToBlog) 
        ? results.obsidianToBlog.some(r => r.success)
        : results.obsidianToBlog.success;
      
      if (obsidianSuccess) {
        this.logger.info('Obsidian → Blog 同步成功');
      } else {
        this.logger.error('Obsidian → Blog 同步失败');
        results.success = false;
      }
      
      // 第二阶段: Blog → Obsidian
      this.logger.info('=== 第二阶段: Blog → Obsidian ===');
      results.blogToObsidian = await this.syncBlogToObsidian({ filePath });
      
      if (results.blogToObsidian.success) {
        this.logger.info('Blog → Obsidian 同步成功');
      } else {
        this.logger.error('Blog → Obsidian 同步失败');
        results.success = false;
      }
      
      // 收集冲突信息
      if (results.blogToObsidian.results) {
        results.conflicts = results.blogToObsidian.results.filter(r => r.conflict);
      }
      
      // 更新所有索引
      if (results.success) {
        await this.updateAllIndexes();
      }
      
      this.logger.info('双向同步完成');
      
      return results;
    } catch (error) {
      this.logger.error(`双向同步失败: ${error.message}`);
      return {
        success: false,
        error: error.message,
        obsidianToBlog: results.obsidianToBlog,
        blogToObsidian: results.blogToObsidian
      };
    }
  }
  
  /**
   * 扫描所有Markdown文件
   */
  async scanMarkdownFiles() {
    const files = [];
    const categories = Object.keys(require('./utils/category-map').categoryMap);
    
    for (const category of categories) {
      const categoryPath = path.join(this.config.obsidian.vaultPath, category);
      
      if (await fs.pathExists(categoryPath)) {
        const categoryFiles = await fs.readdir(categoryPath);
        const markdownFiles = categoryFiles
          .filter(f => f.endsWith('.md'))
          .map(f => ({
            path: path.join(category, f),
            fullPath: path.join(categoryPath, f),
            category: category,
            filename: f
          }));
        
        files.push(...markdownFiles);
      }
    }
    
    return files;
  }
  
  /**
   * 扫描所有HTML文件
   */
  async scanHtmlFiles() {
    const files = [];
    const categories = ['life', 'tech', 'books', 'quotes', 'analysis', 'thoughts'];
    
    for (const category of categories) {
      const categoryPath = path.join(this.config.blog.blogPath, category);
      
      if (await fs.pathExists(categoryPath)) {
        const categoryFiles = await fs.readdir(categoryPath);
        const htmlFiles = categoryFiles
          .filter(f => f.endsWith('.html') && !f.startsWith('index'))
          .map(f => ({
            path: path.join(category, f),
            fullPath: path.join(categoryPath, f),
            category: category,
            filename: f
          }));
        
        files.push(...htmlFiles);
      }
    }
    
    return files;
  }
  
  /**
   * 匹配Obsidian和Blog文件
   */
  async matchFiles(markdownFiles, htmlFiles) {
    const matches = [];
    
    // 创建索引以便快速查找
    const htmlIndex = new Map();
    for (const htmlFile of htmlFiles) {
      const key = this.getFileKey(htmlFile.filename);
      htmlIndex.set(key, htmlFile);
    }
    
    // 匹配Markdown文件
    for (const mdFile of markdownFiles) {
      const key = this.getFileKey(mdFile.filename);
      const htmlFile = htmlIndex.get(key);
      
      if (htmlFile) {
        matches.push({
          type: 'both',
          markdown: mdFile,
          html: htmlFile
        });
        htmlIndex.delete(key); // 移除已匹配的
      } else {
        matches.push({
          type: 'markdown_only',
          markdown: mdFile
        });
      }
    }
    
    // 剩余的HTML文件
    for (const htmlFile of htmlIndex.values()) {
      matches.push({
        type: 'html_only',
        html: htmlFile
      });
    }
    
    return matches;
  }
  
  /**
   * 获取文件键名（用于匹配）
   */
  getFileKey(filename) {
    // 移除扩展名和时间戳，只保留标题部分
    return filename
      .replace(/\.(md|html)$/, '')
      .replace(/\（\d{6}\）$/, '') // 移除时间戳如（202604）
      .replace(/\(\d{6}\)$/, '')  // 移除时间戳如(202604)
      .trim();
  }
  
  /**
   * 更新所有分类索引
   */
  async updateAllIndexes() {
    this.logger.info('开始更新所有分类索引');
    
    const categories = ['life', 'tech', 'books', 'quotes', 'analysis', 'thoughts'];
    
    for (const category of categories) {
      try {
        await updateCategoryIndex(
          this.config.blog.blogPath,
          category,
          null, // 不指定文件，更新整个分类
          null,
          [],
          '',
          ''
        );
        this.logger.info(`更新分类索引成功: ${category}`);
      } catch (error) {
        this.logger.error(`更新分类索引失败: ${category} - ${error.message}`);
      }
    }
    
    this.logger.info('所有分类索引更新完成');
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
        
        // 处理批量结果（数组）或单个结果（对象）
        if (Array.isArray(result)) {
          const successful = result.filter(r => r.success).length;
          const failed = result.filter(r => !r.success).length;
          const skipped = result.filter(r => r.skipped).length;
          
          console.log(`批量同步完成: 总共 ${result.length} 个文件，成功 ${successful} 个，失败 ${failed} 个，跳过 ${skipped} 个`);
          
          if (failed > 0) {
            console.log('\n失败的文件:');
            result.filter(r => !r.success).forEach(r => {
              console.log(`  - ${r.source || r.error}`);
            });
          }
        } else if (result.success) {
          if (result.skipped) {
            console.log(`跳过: ${filePath}`);
          } else {
            console.log(`成功: ${result.source} -> ${result.target}`);
          }
        } else {
          console.error(`失败: ${result.error}`);
          process.exit(1);
        }
      } else if (direction === 'blog-to-obsidian') {
        const result = await sync.syncBlogToObsidian({ filePath });
        
        // 处理批量结果（数组）或单个结果（对象）
        if (result.results && Array.isArray(result.results)) {
          const successful = result.results.filter(r => r.success).length;
          const failed = result.results.filter(r => !r.success).length;
          const conflicts = result.results.filter(r => r.conflict).length;
          
          console.log(`批量同步完成: 总共 ${result.results.length} 个文件，成功 ${successful} 个，失败 ${failed} 个，冲突 ${conflicts} 个`);
          
          if (failed > 0) {
            console.log('\n失败的文件:');
            result.results.filter(r => !r.success).forEach(r => {
              console.log(`  - ${r.source || r.error}`);
            });
          }
        } else if (result.success) {
          if (result.skipped) {
            console.log(`跳过: ${filePath}`);
          } else {
            console.log(`成功: ${result.source} -> ${result.target}`);
          }
        } else {
          console.error(`失败: ${result.error}`);
          process.exit(1);
        }
      } else if (direction === 'both') {
        if (filePath) {
          console.log('注意: 双向同步不支持指定单个文件，将执行全量同步');
          console.log('原因: Obsidian和Blog的文件路径格式不同，无法直接映射');
        }
        
        // 使用双向同步方法
        console.log('=== 开始双向同步 ===');
        const result = await sync.syncBidirectional({});
        
        if (result.success) {
          console.log('双向同步成功完成');
          
          if (result.conflicts && result.conflicts.length > 0) {
            console.log(`\n检测到 ${result.conflicts.length} 个冲突:`);
            result.conflicts.forEach(conflict => {
              console.log(`  - ${conflict.source}: ${conflict.reason}`);
            });
          }
          
          const obsidianResults = result.obsidianToBlog;
          const blogResults = result.blogToObsidian;
          
          if (obsidianResults && obsidianResults.results) {
            const successful = obsidianResults.results.filter(r => r.success && !r.skipped).length;
            console.log(`Obsidian → Blog: 成功 ${successful} 个文件`);
          }
          
          if (blogResults && blogResults.results) {
            const successful = blogResults.results.filter(r => r.success && !r.skipped).length;
            const conflicts = blogResults.results.filter(r => r.conflict).length;
            console.log(`Blog → Obsidian: 成功 ${successful} 个文件，冲突 ${conflicts} 个`);
          }
        } else {
          console.error(`双向同步失败: ${result.error}`);
          process.exit(1);
        }
        
        console.log('=== 双向同步完成 ===');
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
