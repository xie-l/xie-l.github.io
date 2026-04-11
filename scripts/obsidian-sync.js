#!/usr/bin/env node
// scripts/obsidian-sync.js

const fs = require('fs-extra');
const path = require('path');
const cheerio = require('cheerio');
const { loadConfig } = require('./utils/config');
const { validateFrontmatter, parseFrontmatter } = require('./utils/frontmatter');
const { convertMarkdownToHtml } = require('./utils/markdown-converter');
const { processImagePaths } = require('./utils/image-processor');
const { getBlogCategory, getObsidianFolder } = require('./utils/category-map');
const { updateCategoryIndex } = require('./utils/category-index');
const { htmlToMarkdown } = require('./utils/html-to-markdown');
const { isSourceNewer } = require('./utils/file-compare');
const Logger = require('./utils/logger');
const { pad, safeHtml, sanitizeFilename, isValidPath, getFileKey } = require('./utils/string-helpers');

// 常量配置
const CATEGORY_CONFIG = {
  NAMES: {
    life: '生活日记',
    books: '书籍阅读',
    tech: '技术思考',
    analysis: '数据分析',
    quotes: '摘录记录',
    thoughts: '随笔思考'
  },
  ICONS: {
    life: '📅',
    books: '📚',
    tech: '💻',
    analysis: '📊',
    quotes: '❝',
    thoughts: '💡'
  }
};

const BLOG_CATEGORIES = ['life', 'tech', 'books', 'quotes', 'analysis', 'thoughts'];
const CONCURRENT_LIMIT = 5; // 并行处理限制

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
      // 验证文件路径安全性
      if (!isValidPath(filePath)) {
        throw new Error(`非法文件路径: ${filePath}`);
      }
      
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
      
      const stamp = now.getFullYear() + pad(now.getMonth() + 1);
      
      // 生成文件名：有标题用标题，无标题用日期
      let filename;
      if (frontmatter.title) {
        const safeTitle = sanitizeFilename(frontmatter.title, 30);
        filename = `${safeTitle}（${stamp}）.html`;
      } else {
        filename = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}（${stamp}）.html`;
      }
      
      const targetDir = path.join(this.config.blog.blogPath, blogCategory);
      const targetPath = path.join(targetDir, filename);
      
      // 比较文件时间戳，只同步更新的文件
      if (!this.dryRun) {
        const timeCompare = await isSourceNewer(fullPath, targetPath);
        
        if (!timeCompare.isNewer) {
          this.logger.info(`目标文件已是最新，跳过同步: ${filename} (目标: ${timeCompare.targetTime}, 源: ${timeCompare.sourceTime})`);
          return {
            success: true,
            source: fullPath,
            target: targetPath,
            frontmatter,
            skipped: true,
            reason: 'target_is_newer'
          };
        }
        
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
    const filePromises = [];
    
    // 收集所有待处理文件
    for (const category of categories) {
      const categoryPath = path.join(this.config.obsidian.vaultPath, category);
      
      if (!await fs.pathExists(categoryPath)) {
        continue;
      }
      
      const files = await fs.readdir(categoryPath);
      const markdownFiles = files.filter(file => file.endsWith('.md'));
      
      for (const file of markdownFiles) {
        const filePath = path.join(category, file);
        filePromises.push({ filePath, category });
      }
    }
    
    this.logger.info(`找到 ${filePromises.length} 个待处理文件，使用并发限制: ${CONCURRENT_LIMIT}`);
    
    // 使用并发限制处理文件
    const processBatch = async (batch) => {
      const batchResults = [];
      
      for (const { filePath } of batch) {
        const result = await this.syncSingleFile(filePath);
        batchResults.push(result);
      }
      
      return batchResults;
    };
    
    // 分批处理
    for (let i = 0; i < filePromises.length; i += CONCURRENT_LIMIT) {
      const batch = filePromises.slice(i, i + CONCURRENT_LIMIT);
      this.logger.info(`处理批次 ${Math.floor(i / CONCURRENT_LIMIT) + 1}/${Math.ceil(filePromises.length / CONCURRENT_LIMIT)}`);
      
      const batchResults = await processBatch(batch);
      results.push(...batchResults);
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
    const title = frontmatter.title;
    const cat = blogCategory;
    const tagList = frontmatter.tags || [];
    const source = frontmatter.source;
    const now = new Date(frontmatter.date);
    
    const catName = CATEGORY_CONFIG.NAMES[cat] || '随笔';
    const catIcon = CATEGORY_CONFIG.ICONS[cat] || '✏️';
    const dateStr = now.getFullYear() + '年' + (now.getMonth() + 1) + '月' + now.getDate() + '日';
    
    const tagsHtml = tagList.map(t => 
      `<span class="tag">${safeHtml(t)}</span>`
    ).join('\n            ');
    
    const tagClickScript = `<script>
document.querySelectorAll('.tag').forEach(function(el){
  el.style.cursor='pointer';
  el.addEventListener('click',function(e){
    e.preventDefault();
    e.stopPropagation();
    location.href='../tags.html?tag='+encodeURIComponent(el.textContent.trim());
  });
});
<\/script>`;
    
    const sourceHtml = this.generateSourceHtml(cat, source);
    const headerHtml = this.generateHeaderHtml(cat, title, dateStr, catName, tagList);
    
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${safeHtml(title || dateStr)} - 谢亮</title>
    <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>${catIcon}</text></svg>">
    <link rel="stylesheet" href="../../css/style.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        .blog-container{max-width:860px;margin:100px auto 60px;padding:0 20px}
        .back-link{display:inline-block;margin-bottom:20px;color:var(--secondary-color);text-decoration:none}
        .post-header{text-align:center;margin-bottom:40px;padding-bottom:30px;border-bottom:1px solid var(--border-color)}
        .post-title{font-size:27px;color:var(--primary-color);margin-bottom:15px;line-height:1.4}
        .post-meta{color:var(--text-light);font-size:14px;display:flex;justify-content:center;gap:20px;flex-wrap:wrap}
        .post-content{background:var(--card-bg,#fff);border-radius:15px;padding:40px;box-shadow:var(--shadow-md);line-height:1.9;font-size:16px}
        .post-content p{margin-bottom:20px;text-align:justify}
        .post-source{font-size:13px;color:var(--text-light);margin-bottom:20px;padding:10px 14px;background:var(--bg-secondary,#f8f9fa);border-radius:8px;border-left:3px solid var(--secondary-color)}
        .post-source a{color:var(--secondary-color);word-break:break-all}
        .post-tags{margin-top:30px;padding-top:20px;border-top:1px solid var(--border-color);display:flex;gap:8px;flex-wrap:wrap}
        .tag{font-size:12px;background:var(--secondary-color);color:#fff;padding:4px 12px;border-radius:20px}
    </style>
</head>
<body>
    <div class="blog-container">
        <a href="./" class="back-link"><i class="fas fa-arrow-left"></i> 返回${catName}</a>
        ${headerHtml}
        ${sourceHtml}
        <div class="post-content">
            ${content}
            <div class="post-tags">${tagsHtml}</div>
        </div>
    </div>
    ${tagClickScript}
</body>
</html>`;
  }
  
  /**
   * 生成来源HTML
   */
  generateSourceHtml(cat, source) {
    if (cat !== 'quotes' || !source || !source.trim()) {
      return '';
    }
    
    const src = source.trim();
    const isUrl = /^https?:\/\//i.test(src);
    
    return `
        <div class="post-source" data-source="${safeHtml(src)}">
            <i class="fas fa-link"></i> 来源：
            ${isUrl ? `<a href="${safeHtml(src)}" target="_blank" rel="noopener">${safeHtml(src)}</a>` : safeHtml(src)}
        </div>`;
  }
  
  /**
   * 生成头部HTML
   */
  generateHeaderHtml(cat, title, dateStr, catName, tagList) {
    if (cat === 'thoughts' && !title) {
      return `        <div class="post-meta" style="margin-bottom:24px;justify-content:center;display:flex;gap:16px;color:var(--text-light);font-size:14px">
            <span><i class="fas fa-calendar"></i> ${dateStr}</span>
            <span><i class="fas fa-folder"></i> ${catName}</span>
            ${tagList.length ? `<span><i class="fas fa-tags"></i> ${tagList.join(' / ')}</span>` : ''}
        </div>`;
    }
    
    return `        <article class="post-header">
            <h1 class="post-title">${safeHtml(title)}</h1>
            <div class="post-meta">
                <span><i class="fas fa-calendar"></i> ${dateStr}</span>
                <span><i class="fas fa-folder"></i> ${catName}</span>
                ${tagList.length ? `<span><i class="fas fa-tags"></i> ${tagList.join(' / ')}</span>` : ''}
            </div>
        </article>`;
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
      // 验证文件路径安全性
      if (!isValidPath(filePath)) {
        throw new Error(`非法文件路径: ${filePath}`);
      }
      
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
      const frontmatter = this.extractFrontmatterFromHtml(htmlContent, fullPath);
      
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
      }
      
      // 比较文件时间戳，只同步更新的文件
      if (!this.dryRun) {
        const timeCompare = await isSourceNewer(fullPath, targetPath);
        
        if (!timeCompare.isNewer) {
          this.logger.info(`目标文件已是最新，跳过同步: ${filename} (目标: ${timeCompare.targetTime}, 源: ${timeCompare.sourceTime})`);
          return {
            success: true,
            source: fullPath,
            target: targetPath,
            skipped: true,
            reason: 'target_is_newer',
            conflict: conflict.hasConflict
          };
        }
        
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
  extractFrontmatterFromHtml(htmlContent, filePath) {
    const frontmatter = {};
    
    try {
      const $ = cheerio.load(htmlContent);
      
      // 提取标题
      const titleEl = $('h1.post-title');
      frontmatter.title = titleEl.length ? titleEl.text().trim() : '';
      
      // 提取所有meta信息
      const metaSpans = $('.post-meta span');
      
      // 提取日期（找到日历图标）
      const dateSpan = metaSpans.filter((i, el) => {
        return $(el).html().includes('fa-calendar');
      });
      if (dateSpan.length) {
        const dateText = dateSpan.text().replace(/[^\u4e00-\u9fa5\d]/g, '').trim();
        frontmatter.date = this.parseChineseDate(dateText);
      }
      
      // 提取分类和标签（找到标签图标）
      const tagSpans = metaSpans.filter((i, el) => {
        const html = $(el).html();
        return html.includes('fa-tag') || html.includes('fa-tags');
      });
      
      if (tagSpans.length) {
        const tagTexts = tagSpans.map((i, el) => $(el).text().trim()).get();
        
        // 第一个不包含 / 的是分类
        const categoryText = tagTexts.find(text => !text.includes('/'));
        if (categoryText) {
          frontmatter.category = this.mapCategoryName(categoryText);
        }
        
        // 包含 / 的是标签
        const tagsText = tagTexts.find(text => text.includes('/'));
        if (tagsText) {
          frontmatter.tags = tagsText.split('/').map(tag => tag.trim()).filter(tag => tag);
        }
      }
      
      // 提取来源（如果是quotes分类）
      if (frontmatter.category === 'quotes') {
        const sourceEl = $('.post-source');
        if (sourceEl.length) {
          const sourceText = sourceEl.text().replace('来源：', '').trim();
          frontmatter.source = sourceText;
        }
      }
      
      // 如果无法从HTML中提取分类，使用文件路径推断
      if (!frontmatter.category || frontmatter.category === 'life') {
        const inferredCategory = this.inferCategoryFromPath(filePath);
        if (inferredCategory) {
          frontmatter.category = inferredCategory;
        }
      }
    } catch (error) {
      this.logger.error('提取Frontmatter失败', { error: error.message });
      throw error;
    }
    
    // 设置默认值
    if (!frontmatter.category) {
      frontmatter.category = 'life'; // 默认分类
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
      const safeTitle = sanitizeFilename(frontmatter.title, 50);
      filename = `${safeTitle}.md`;
    } else {
      // 使用日期
      const now = new Date(frontmatter.date || Date.now());
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
   * 从文件路径推断分类
   */
  inferCategoryFromPath(filePath) {
    const path = require('path');
    const dir = path.dirname(filePath);
    const folder = path.basename(dir);
    
    const folderToCategory = {
      'books': 'books',
      'life': 'life',
      'tech': 'tech',
      'analysis': 'analysis',
      'quotes': 'quotes',
      'thoughts': 'thoughts'
    };
    
    return folderToCategory[folder];
  }
  
  /**
   * 同步所有HTML文件到Obsidian（带并发控制）
   */
  async syncAllHtmlToMd() {
    const results = [];
    
    try {
      this.logger.info('开始同步所有博客文件到Obsidian');
      
      // 获取所有待处理的文件
      const filePromises = [];
      
      for (const category of BLOG_CATEGORIES) {
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
          filePromises.push({ filePath, category });
        }
      }
      
      this.logger.info(`找到 ${filePromises.length} 个待处理文件，使用并发限制: ${CONCURRENT_LIMIT}`);
      
      // 使用并发限制处理文件
      const processBatch = async (batch) => {
        const batchResults = [];
        
        for (const { filePath } of batch) {
          try {
            const result = await this.syncSingleHtmlToMd(filePath);
            batchResults.push(result);
          } catch (error) {
            this.logger.error(`同步异常: ${filePath} - ${error.message}`);
            batchResults.push({
              success: false,
              error: error.message,
              source: filePath
            });
          }
        }
        
        return batchResults;
      };
      
      // 分批处理
      for (let i = 0; i < filePromises.length; i += CONCURRENT_LIMIT) {
        const batch = filePromises.slice(i, i + CONCURRENT_LIMIT);
        this.logger.info(`处理批次 ${Math.floor(i / CONCURRENT_LIMIT) + 1}/${Math.ceil(filePromises.length / CONCURRENT_LIMIT)}`);
        
        const batchResults = await processBatch(batch);
        results.push(...batchResults);
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
   * @throws {Error} 当冲突检测失败时抛出错误
   */
  async detectConflict(targetPath, frontmatter) {
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
    
    for (const category of BLOG_CATEGORIES) {
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
   * @deprecated 请使用 string-helpers.js 中的 getFileKey 函数
   */
  getFileKey(filename) {
    return getFileKey(filename);
  }
  
  /**
   * 更新所有分类索引
   */
  async updateAllIndexes() {
    this.logger.info('开始更新所有分类索引');
    
    for (const category of BLOG_CATEGORIES) {
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
