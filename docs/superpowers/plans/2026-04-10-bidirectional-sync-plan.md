# 双向同步系统实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现 Obsidian Vault 与 GitHub Pages Blog 之间的双向同步，支持 MD↔HTML 相互转换，冲突自动解决，不影响任何现有功能。

**Architecture:** 在现有 scripts/obsidian-sync.js 基础上增强，添加 HTML→Markdown 反向转换功能，使用文件路径映射和时间戳冲突检测，保持所有现有命令和接口兼容。

**Tech Stack:** Node.js, fs-extra, marked (Markdown→HTML), turndown (HTML→Markdown), YAML frontmatter

---

### Task 1: 添加 HTML→Markdown 转换依赖

**Files:**
- Modify: `package.json`

**Purpose:** 添加 turndown 库用于 HTML→Markdown 转换

- [ ] **Step 1: 安装 turndown 依赖**

```bash
npm install turndown --save
```

Expected output: 
```
added 2 packages, and audited 200 packages
```

- [ ] **Step 2: 验证安装**

```bash
npm list turndown
```

Expected output:
```
├── turndown@7.1.3
```

- [ ] **Step 3: 提交更改**

```bash
git add package.json package-lock.json
git commit -m "chore: 添加 turndown 依赖用于 HTML→Markdown 转换"
```

---

### Task 2: 创建 HTML→Markdown 转换工具模块

**Files:**
- Create: `scripts/utils/html-to-markdown.js`
- Test: `tests/utils/html-to-markdown.test.js`

**Purpose:** 创建独立的工具模块，将 HTML 内容转换为 Markdown，并提取 frontmatter

- [ ] **Step 1: 创建测试文件**

```bash
mkdir -p tests/utils
cat > tests/utils/html-to-markdown.test.js << 'TESTEOF'
const { htmlToMarkdown } = require('../../scripts/utils/html-to-markdown');

describe('htmlToMarkdown', () => {
  it('应正确提取 frontmatter 和正文', () => {
    const html = `<!DOCTYPE html>
<html>
<head><title>测试标题</title></head>
<body>
  <div class="post-header">
    <h1 class="post-title">测试标题</h1>
    <div class="post-meta">
      <span><i class="fas fa-calendar"></i> 2026年4月10日</span>
      <span><i class="fas fa-folder"></i> 生活日记</span>
    </div>
  </div>
  <div class="post-content">
    <p>测试正文内容</p>
  </div>
</body>
</html>`;
    
    const result = htmlToMarkdown(html);
    
    expect(result).toContain('---');
    expect(result).toContain('title: 测试标题');
    expect(result).toContain('date: 2026-04-10');
    expect(result).toContain('测试正文内容');
  });
  
  it('应处理没有 frontmatter 的 HTML', () => {
    const html = '<div class="post-content"><p>纯内容</p></div>';
    const result = htmlToMarkdown(html);
    expect(result).toBe('纯内容');
  });
});
TESTEOF
```

- [ ] **Step 2: 运行测试（应失败）**

```bash
npm test tests/utils/html-to-markdown.test.js
```

Expected: FAIL (module not found)

- [ ] **Step 3: 创建转换模块**

```javascript
// scripts/utils/html-to-markdown.js
const TurndownService = require('turndown');

function htmlToMarkdown(htmlContent) {
  // 创建 turndown 实例
  const turndownService = new TurndownService({
    headingStyle: 'atx',
    bulletListMarker: '-',
    codeBlockStyle: 'fenced'
  });
  
  // 提取 frontmatter 信息
  const frontmatter = extractFrontmatter(htmlContent);
  
  // 提取正文内容
  const contentMatch = htmlContent.match(/<div class="post-content">([\s\S]*?)<\/div>/);
  const htmlBody = contentMatch ? contentMatch[1] : '';
  
  // HTML → Markdown 转换
  const markdownBody = turndownService.turndown(htmlBody);
  
  // 如果有 frontmatter，重建 YAML 块
  if (frontmatter && Object.keys(frontmatter).length > 0) {
    const frontmatterStr = generateFrontmatter(frontmatter);
    return frontmatterStr + '\n\n' + markdownBody;
  }
  
  return markdownBody;
}

function extractFrontmatter(htmlContent) {
  const frontmatter = {};
  
  // 提取标题
  const titleMatch = htmlContent.match(/<h1 class="post-title">(.+?)<\/h1>/);
  if (titleMatch) {
    frontmatter.title = titleMatch[1];
  }
  
  // 提取日期
  const dateMatch = htmlContent.match(/<i class="fas fa-calendar"><\/i>\s*([^<]+)<\/span>/);
  if (dateMatch) {
    frontmatter.date = parseChineseDate(dateMatch[1]);
  }
  
  // 提取分类
  const categoryMatch = htmlContent.match(/<i class="fas fa-folder"><\/i>\s*([^<]+)<\/span>/);
  if (categoryMatch) {
    frontmatter.category = mapCategoryName(categoryMatch[1]);
  }
  
  // 提取标签
  const tagsMatch = htmlContent.match(/<i class="fas fa-tags"><\/i>\s*([^<]+)<\/span>/);
  if (tagsMatch) {
    frontmatter.tags = tagsMatch[1].split('/').map(tag => tag.trim());
  }
  
  return frontmatter;
}

function generateFrontmatter(data) {
  const lines = ['---'];
  for (const [key, value] of Object.entries(data)) {
    if (Array.isArray(value)) {
      lines.push(`${key}: [${value.join(', ')}]`);
    } else {
      lines.push(`${key}: ${value}`);
    }
  }
  lines.push('---');
  return lines.join('\n');
}

function parseChineseDate(chineseDate) {
  // 将 "2026年4月10日" 转换为 "2026-04-10"
  const match = chineseDate.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
  if (match) {
    const year = match[1];
    const month = match[2].padStart(2, '0');
    const day = match[3].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  return new Date().toISOString().split('T')[0];
}

function mapCategoryName(categoryName) {
  const categoryMap = {
    '生活日记': 'life',
    '技术思考': 'tech',
    '随笔思考': 'thoughts',
    '摘录记录': 'quotes',
    '书籍阅读': 'books',
    '数据分析': 'analysis'
  };
  return categoryMap[categoryName] || 'life';
}

module.exports = { htmlToMarkdown };
```

- [ ] **Step 4: 运行测试（应通过）**

```bash
npm test tests/utils/html-to-markdown.test.js
```

Expected: PASS

- [ ] **Step 5: 提交更改**

```bash
git add scripts/utils/html-to-markdown.js tests/utils/html-to-markdown.test.js
git commit -m "feat: 添加 HTML→Markdown 转换工具模块"
```

---

### Task 3: 增强 ObsidianSync 类，添加反向同步方法

**Files:**
- Modify: `scripts/obsidian-sync.js`

**Purpose:** 在现有的 ObsidianSync 类中添加反向同步功能

- [ ] **Step 1: 导入新模块**

在 `scripts/obsidian-sync.js` 顶部添加：

```javascript
const { htmlToMarkdown } = require('./utils/html-to-markdown');
const { getObsidianFolder } = require('./utils/category-map');
```

- [ ] **Step 2: 添加反向同步方法**

在 `ObsidianSync` 类中添加：

```javascript
class ObsidianSync {
  // ... 现有方法 ...
  
  async syncBlogToObsidian(options = {}) {
    const { filePath } = options;
    
    if (filePath) {
      return await this.syncSingleHtmlToMd(filePath);
    } else {
      return await this.syncAllHtmlToMd();
    }
  }
  
  async syncSingleHtmlToMd(htmlPath) {
    try {
      this.logger.info(`开始反向同步: ${htmlPath}`);
      
      const fullPath = path.join(this.config.blog.blogPath, htmlPath);
      
      if (!await fs.pathExists(fullPath)) {
        throw new Error(`HTML文件不存在: ${fullPath}`);
      }
      
      // 读取 HTML 文件
      const htmlContent = await fs.readFile(fullPath, 'utf8');
      
      // 转换为 Markdown
      const markdownContent = htmlToMarkdown(htmlContent);
      
      // 解析 frontmatter
      const { data: frontmatter } = parseFrontmatter(markdownContent);
      
      // 确定目标路径
      const obsidianFolder = getObsidianFolder(frontmatter.category);
      const targetDir = path.join(this.config.obsidian.vaultPath, obsidianFolder);
      
      // 生成文件名（去除时间戳后缀）
      const htmlFilename = path.basename(htmlPath, '.html');
      const baseName = htmlFilename.replace(/（\d{6}）$/, ''); // 移除时间戳后缀
      const mdFilename = `${baseName}.md`;
      const targetPath = path.join(targetDir, mdFilename);
      
      // 创建备份（如果文件已存在）
      if (await fs.pathExists(targetPath)) {
        await createBackup(targetPath, this.config.sync.backupPath);
      }
      
      // 写入 Markdown 文件
      await fs.ensureDir(targetDir);
      await fs.writeFile(targetPath, markdownContent, 'utf8');
      
      this.logger.info(`反向同步完成: ${htmlPath} -> ${targetPath}`);
      
      return {
        success: true,
        htmlPath,
        mdPath: targetPath,
        frontmatter
      };
    } catch (error) {
      this.logger.error(`反向同步失败: ${htmlPath}`, error);
      throw error;
    }
  }
  
  async syncAllHtmlToMd() {
    const results = [];
    
    // 扫描所有 HTML 文件
    for (const category of this.config.blog.supportedCategories) {
      const categoryDir = path.join(this.config.blog.blogPath, category);
      
      if (!await fs.pathExists(categoryDir)) {
        continue;
      }
      
      const files = await fs.readdir(categoryDir);
      const htmlFiles = files.filter(f => f.endsWith('.html') && f !== 'index.html');
      
      for (const htmlFile of htmlFiles) {
        try {
          const htmlPath = path.join(category, htmlFile);
          const result = await this.syncSingleHtmlToMd(htmlPath);
          results.push(result);
        } catch (error) {
          this.logger.error(`同步失败: ${htmlFile}`, error);
          results.push({ success: false, error: error.message, htmlFile });
        }
      }
    }
    
    return results;
  }
}
```

- [ ] **Step 3: 添加冲突检测方法**

```javascript
class ObsidianSync {
  // ... 现有方法 ...
  
  detectConflict(mdPath, htmlPath) {
    try {
      const mdStat = fs.statSync(mdPath);
      const htmlStat = fs.statSync(htmlPath);
      
      const mdModified = mdStat.mtime.getTime();
      const htmlModified = htmlStat.mtime.getTime();
      
      const timeDiff = Math.abs(mdModified - htmlModified);
      
      // 如果时间差小于1秒，视为同时修改
      if (timeDiff < 1000) {
        return {
          type: 'simultaneous',
          resolution: 'timestamp',
          mdModified: new Date(mdModified).toISOString(),
          htmlModified: new Date(htmlModified).toISOString()
        };
      }
      
      // 否则，时间戳新的获胜
      if (mdModified > htmlModified) {
        return {
          type: 'md_newer',
          resolution: 'md_wins',
          reason: 'MD文件更新',
          mdModified: new Date(mdModified).toISOString(),
          htmlModified: new Date(htmlModified).toISOString()
        };
      } else {
        return {
          type: 'html_newer',
          resolution: 'html_wins',
          reason: 'HTML文件更新',
          mdModified: new Date(mdModified).toISOString(),
          htmlModified: new Date(htmlModified).toISOString()
        };
      }
    } catch (error) {
      this.logger.error(`冲突检测失败: ${mdPath} ↔ ${htmlPath}`, error);
      return {
        type: 'error',
        resolution: 'skip',
        error: error.message
      };
    }
  }
}
```

- [ ] **Step 4: 添加双向同步主方法**

```javascript
class ObsidianSync {
  // ... 现有方法 ...
  
  async syncBidirectional(options = {}) {
    const { dryRun = false, verbose = false } = options;
    
    this.logger.info('═══════════════════════════════════════════════════════════════');
    this.logger.info('Obsidian ↔ GitHub 双向同步');
    this.logger.info('═══════════════════════════════════════════════════════════════');
    
    const results = {
      scanned: { md: 0, html: 0 },
      matched: 0,
      synced: { mdToHtml: 0, htmlToMd: 0 },
      conflicts: 0,
      skipped: 0,
      errors: 0
    };
    
    try {
      // 1. 扫描文件
      this.logger.info('\n扫描文件...');
      const mdFiles = await this.scanMarkdownFiles();
      const htmlFiles = await this.scanHtmlFiles();
      
      results.scanned.md = mdFiles.length;
      results.scanned.html = htmlFiles.length;
      
      this.logger.info(`✓ 发现 ${mdFiles.length} 个 Markdown 文件（Obsidian）`);
      this.logger.info(`✓ 发现 ${htmlFiles.length} 个 HTML 文件（GitHub Blog）`);
      
      // 2. 匹配文件
      this.logger.info('\n匹配文件...');
      const filePairs = this.matchFiles(mdFiles, htmlFiles);
      results.matched = filePairs.length;
      
      this.logger.info(`✓ 已匹配 ${filePairs.length} 对文件`);
      
      // 3. 处理每对文件
      this.logger.info('\n冲突检测...');
      
      for (const pair of filePairs) {
        try {
          const conflict = this.detectConflict(pair.mdPath, pair.htmlPath);
          
          if (verbose) {
            this.logger.debug(`检测: ${pair.mdPath} ↔ ${pair.htmlPath}`);
            this.logger.debug(`结果: ${conflict.resolution} - ${conflict.reason || ''}`);
          }
          
          switch (conflict.resolution) {
            case 'md_wins':
              if (!dryRun) {
                await this.syncSingleFile(pair.relativeMdPath);
              }
              results.synced.mdToHtml++;
              this.logger.info(`→ 同步: ${pair.relativeMdPath} → ${pair.relativeHtmlPath}`);
              break;
              
            case 'html_wins':
              if (!dryRun) {
                await this.syncSingleHtmlToMd(pair.relativeHtmlPath);
              }
              results.synced.htmlToMd++;
              this.logger.info(`→ 同步: ${pair.relativeHtmlPath} → ${pair.relativeMdPath}`);
              break;
              
            case 'timestamp':
              results.conflicts++;
              this.logger.warn(`⚠ 检测到冲突: ${pair.relativeMdPath}`);
              // 时间戳相同，使用 HTML 版本（因为 HTML 通常包含完整样式）
              if (!dryRun) {
                await this.syncSingleHtmlToMd(pair.relativeHtmlPath);
              }
              break;
              
            case 'skip':
              results.skipped++;
              if (verbose) {
                this.logger.debug(`跳过: ${pair.relativeMdPath}`);
              }
              break;
          }
        } catch (error) {
          results.errors++;
          this.logger.error(`处理失败: ${pair.mdPath}`, error);
        }
      }
      
      // 4. 更新索引
      if (!dryRun) {
        this.logger.info('\n更新索引...');
        await this.updateAllIndexes();
        this.logger.info('✓ 更新 blog-index.json');
        this.logger.info('✓ 更新分类索引');
        this.logger.info('✓ 更新 feed.xml');
        this.logger.info('✓ 更新 sitemap.xml');
      }
      
      // 5. 输出总结
      this.logger.info('\n═══════════════════════════════════════════════════════════════');
      this.logger.info('同步完成！');
      this.logger.info(`  已同步：${results.synced.mdToHtml + results.synced.htmlToMd} 个文件`);
      this.logger.info(`    - Obsidian → GitHub: ${results.synced.mdToHtml} 个`);
      this.logger.info(`    - GitHub → Obsidian: ${results.synced.htmlToMd} 个`);
      this.logger.info(`  冲突：${results.conflicts} 个（已自动解决）`);
      this.logger.info(`  跳过：${results.skipped} 个文件（已最新）`);
      this.logger.info(`  错误：${results.errors} 个`);
      this.logger.info('═══════════════════════════════════════════════════════════════');
      
      return results;
      
    } catch (error) {
      this.logger.error('双向同步失败', error);
      throw error;
    }
  }
  
  // 辅助方法：扫描 Markdown 文件
  async scanMarkdownFiles() {
    const mdFiles = [];
    const vaultPath = this.config.obsidian.vaultPath;
    
    for (const folder of Object.keys(categoryMap)) {
      const folderPath = path.join(vaultPath, folder);
      if (!await fs.pathExists(folderPath)) continue;
      
      const files = await fs.readdir(folderPath);
      const mdFilesInFolder = files.filter(f => f.endsWith('.md'));
      
      for (const file of mdFilesInFolder) {
        mdFiles.push(path.join(folder, file));
      }
    }
    
    return mdFiles;
  }
  
  // 辅助方法：扫描 HTML 文件
  async scanHtmlFiles() {
    const htmlFiles = [];
    const blogPath = this.config.blog.blogPath;
    
    for (const category of this.config.blog.supportedCategories) {
      const categoryDir = path.join(blogPath, category);
      if (!await fs.pathExists(categoryDir)) continue;
      
      const files = await fs.readdir(categoryDir);
      const htmlFilesInCategory = files.filter(f => f.endsWith('.html') && f !== 'index.html');
      
      for (const file of htmlFilesInCategory) {
        htmlFiles.push(path.join(category, file));
      }
    }
    
    return htmlFiles;
  }
  
  // 辅助方法：匹配文件
  matchFiles(mdFiles, htmlFiles) {
    const pairs = [];
    
    for (const mdFile of mdFiles) {
      const mdPath = path.join(this.config.obsidian.vaultPath, mdFile);
      const mdTitle = path.basename(mdFile, '.md');
      
      // 查找对应的 HTML 文件
      const matchingHtml = htmlFiles.find(htmlFile => {
        const htmlTitle = path.basename(htmlFile, '.html').replace(/（\d{6}）$/, '');
        return htmlTitle === mdTitle;
      });
      
      if (matchingHtml) {
        pairs.push({
          mdPath,
          htmlPath: path.join(this.config.blog.blogPath, matchingHtml),
          relativeMdPath: mdFile,
          relativeHtmlPath: matchingHtml
        });
      }
    }
    
    return pairs;
  }
  
  // 辅助方法：更新所有索引
  async updateAllIndexes() {
    // 更新 blog-index.json
    const { updateBlogIndex } = require('./update-data');
    await updateBlogIndex();
    
    // 更新分类索引
    for (const category of this.config.blog.supportedCategories) {
      const { updateCategoryIndex } = require('./utils/category-index');
      await updateCategoryIndex(this.config.blog.blogPath, category);
    }
    
    // 更新 thoughts 索引（如果有 thoughts 文章）
    const thoughtsPath = path.join(this.config.blog.blogPath, 'thoughts');
    if (await fs.pathExists(thoughtsPath)) {
      const { updateThoughtsIndex } = require('./update-thoughts-index');
      await updateThoughtsIndex();
    }
  }
}
```

- [ ] **Step 5: 更新命令行接口**

在文件末尾的 `if (require.main === module)` 块中添加：

```javascript
if (require.main === module) {
  const command = process.argv[2];
  const options = {
    dryRun: process.argv.includes('--dry-run'),
    verbose: process.argv.includes('--verbose'),
    force: process.argv.includes('--force')
  };
  
  const sync = new ObsidianSync();
  
  (async () => {
    try {
      switch (command) {
        case 'bidirectional':
        case 'bidir':
          const results = await sync.syncBidirectional(options);
          process.exit(results.errors > 0 ? 1 : 0);
          break;
          
        // ... 现有命令处理 ...
        
        default:
          console.log('用法:');
          console.log('  node scripts/obsidian-sync.js <file>          # 同步单个文件');
          console.log('  node scripts/obsidian-sync.js                 # 同步所有文件');
          console.log('  node scripts/obsidian-sync.js bidirectional   # 双向同步');
          console.log('');
          console.log('选项:');
          console.log('  --dry-run    试运行，不实际修改文件');
          console.log('  --verbose    详细输出');
          console.log('  --force      强制同步，忽略冲突警告');
          process.exit(0);
      }
    } catch (error) {
      console.error('执行失败:', error);
      process.exit(1);
    }
  })();
}
```

- [ ] **Step 6: 测试反向同步功能**

```bash
# 测试单个 HTML→MD 同步
node -e "
const ObsidianSync = require('./scripts/obsidian-sync');
const sync = new ObsidianSync();
sync.syncBlogToObsidian({ filePath: 'life/今日小结（2026.04.09）（202604）.html' })
  .then(result => console.log('成功:', result))
  .catch(err => console.error('失败:', err));
"
```

Expected: 应在 obsidian-vault/生活日记/ 中生成对应的 .md 文件

- [ ] **Step 7: 提交更改**

```bash
git add scripts/obsidian-sync.js
git commit -m "feat: 添加反向同步和双向同步功能"
```

---

### Task 4: 添加分类映射的反向查询

**Files:**
- Modify: `scripts/utils/category-map.js`

**Purpose:** 添加 getObsidianFolder 函数，支持从 blog category 到 Obsidian folder 的映射

- [ ] **Step 1: 添加反向映射函数**

```javascript
// scripts/utils/category-map.js

// ... 现有代码 ...

function getObsidianFolder(blogCategory) {
  return reverseCategoryMap[blogCategory];
}

// ... 导出部分 ...
module.exports = {
  categoryMap,
  reverseCategoryMap,
  getBlogCategory,
  getObsidianFolder,  // 新增
  validateCategory
};
```

- [ ] **Step 2: 测试反向映射**

```bash
node -e "
const { getObsidianFolder } = require('./scripts/utils/category-map');
console.log('life ->', getObsidianFolder('life'));
console.log('tech ->', getObsidianFolder('tech'));
console.log('thoughts ->', getObsidianFolder('thoughts'));
"
```

Expected output:
```
life -> 生活日记
 tech -> 技术思考
 thoughts -> 随笔思考
```

- [ ] **Step 3: 提交更改**

```bash
git add scripts/utils/category-map.js
git commit -m "feat: 添加分类反向映射函数"
```

---

### Task 5: 集成双向同步到管理界面

**Files:**
- Modify: `admin/obsidian-sync.html`

**Purpose:** 在管理界面添加双向同步控制面板

- [ ] **Step 1: 添加控制面板 HTML**

在 `admin/obsidian-sync.html` 的适当位置添加：

```html
<div class="control-panel">
  <h3>双向同步控制</h3>
  <button id="btn-bidirectional" class="btn btn-primary">
    <i class="fas fa-sync-alt"></i> 执行双向同步
  </button>
  <button id="btn-dry-run" class="btn btn-secondary">
    <i class="fas fa-eye"></i> 试运行
  </button>
  <div id="sync-result" class="result-panel" style="display: none;">
    <h4>同步结果</h4>
    <pre id="sync-output"></pre>
  </div>
</div>
```

- [ ] **Step 2: 添加 JavaScript 处理函数**

在页面的 `<script>` 部分添加：

```javascript
document.getElementById('btn-bidirectional').addEventListener('click', async () => {
  await runBidirectionalSync(false);
});

document.getElementById('btn-dry-run').addEventListener('click', async () => {
  await runBidirectionalSync(true);
});

async function runBidirectionalSync(dryRun) {
  const resultDiv = document.getElementById('sync-result');
  const outputPre = document.getElementById('sync-output');
  
  resultDiv.style.display = 'block';
  outputPre.textContent = '正在执行同步，请稍候...';
  
  try {
    const response = await fetch('/api/run-sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        command: 'bidirectional',
        dryRun: dryRun
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      outputPre.textContent = `同步完成！\n\n已同步: ${result.synced} 个文件\n冲突: ${result.conflicts} 个\n跳过: ${result.skipped} 个`;
    } else {
      outputPre.textContent = `同步失败: ${result.error}`;
    }
  } catch (error) {
    outputPre.textContent = `错误: ${error.message}`;
  }
}
```

- [ ] **Step 3: 提交更改**

```bash
git add admin/obsidian-sync.html
git commit -m "feat: 在管理界面添加双向同步控制面板"
```

---

### Task 6: 创建 API 端点（如果需要）

**Files:**
- Modify: `admin/main.js`（或现有的 API 处理文件）

**Purpose:** 添加处理双向同步请求的 API 端点

- [ ] **Step 1: 添加 API 路由处理**

```javascript
// 在 admin/main.js 中添加

app.post('/api/run-sync', async (req, res) => {
  try {
    const { command, dryRun } = req.body;
    
    if (command !== 'bidirectional') {
      return res.status(400).json({ success: false, error: '不支持的命令' });
    }
    
    // 调用同步脚本
    const { execSync } = require('child_process');
    const args = ['scripts/obsidian-sync.js', 'bidirectional'];
    
    if (dryRun) {
      args.push('--dry-run');
    }
    
    const output = execSync(`node ${args.join(' ')}`, {
      encoding: 'utf8',
      cwd: process.cwd()
    });
    
    res.json({
      success: true,
      output: output
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      output: error.stdout || error.stderr
    });
  }
});
```

- [ ] **Step 2: 提交更改**

```bash
git add admin/main.js
git commit -m "feat: 添加双向同步 API 端点"
```

---

### Task 7: 完整集成测试

**Files:**
- Test: 手动测试所有功能

**Purpose:** 验证双向同步系统完整功能

- [ ] **Step 1: 准备测试数据**

```bash
# 确保测试文件存在
ls obsidian-vault/生活日记/今日小结\（2026.04.09\）.md
ls blog/life/今日小结\（2026.04.09\）\（202604\）.html
```

- [ ] **Step 2: 测试单向反向同步**

```bash
node scripts/obsidian-sync.js blog-to-obsidian
```

Expected: 应在 obsidian-vault/ 中生成/更新 Markdown 文件

- [ ] **Step 3: 测试双向同步（试运行）**

```bash
node scripts/obsidian-sync.js bidirectional --dry-run --verbose
```

Expected: 显示同步计划，但不实际修改文件

- [ ] **Step 4: 测试双向同步（实际执行）**

```bash
node scripts/obsidian-sync.js bidirectional
```

Expected: 实际执行同步，更新索引文件

- [ ] **Step 5: 验证索引更新**

```bash
git status
```

Expected: 应看到 data/blog-index.json、feed.xml、sitemap.xml 被更新

- [ ] **Step 6: 测试管理界面**

1. 打开浏览器访问 admin/obsidian-sync.html
2. 点击"执行双向同步"按钮
3. 验证同步结果显示

- [ ] **Step 7: 提交所有更改**

```bash
git add -A
git commit -m "feat: 完成双向同步系统实现"
```

---

### Task 8: 文档更新

**Files:**
- Create: `docs/bidirectional-sync-usage.md`

**Purpose:** 编写使用文档

- [ ] **Step 1: 创建使用文档**

```bash
cat > docs/bidirectional-sync-usage.md << 'DOCEOF'
# 双向同步使用指南

## 快速开始

### 执行双向同步

```bash
node scripts/obsidian-sync.js bidirectional
```

或简写：

```bash
node scripts/obsidian-sync.js bidir
```

### 试运行（不实际修改文件）

```bash
node scripts/obsidian-sync.js bidirectional --dry-run
```

### 详细输出

```bash
node scripts/obsidian-sync.js bidirectional --verbose
```

## 工作原理

### 文件对应关系

```
Obsidian Vault                  GitHub Blog
─────────────────────────────────────────────
生活日记/今日小结.md      ↔   life/今日小结（202604）.html
技术思考/新技术.md        ↔   tech/新技术（202604）.html
摘录记录/名言.md          ↔   quotes/名言（202604）.html
```

### 冲突解决

当同一个文件在两边都被修改时，系统会比较时间戳：

- **MD 文件更新** → 同步到 GitHub（MD→HTML）
- **HTML 文件更新** → 同步到 Obsidian（HTML→MD）
- **同时更新** → 保留 HTML 版本（因为包含完整样式）

### 备份策略

仅在检测到冲突时备份旧版本：

```
backups/
└── sync-conflicts/
    └── 2026-04-10T153000/
        ├── obsidian-vault/
        └── blog/
```

## 使用场景

### 场景 1：在 Obsidian 中编辑后同步

1. 在 Obsidian 中编辑 Markdown 文件
2. 运行：`node scripts/obsidian-sync.js bidirectional`
3. 变更自动同步到 GitHub Blog

### 场景 2：在网页端编辑后同步

1. 直接在 GitHub 上编辑 HTML 文件
2. 运行：`node scripts/obsidian-sync.js bidirectional`
3. 变更自动同步回 Obsidian

### 场景 3：添加新文章

在 Obsidian 中创建新 Markdown 文件（需包含 frontmatter）：

```yaml
---
title: 新文章标题
date: 2026-04-10
category: life
status: published
tags: [标签1, 标签2]
---

文章内容...
```

运行同步命令后，自动生成对应的 HTML 文件。

## 管理界面

访问 `admin/obsidian-sync.html`，可以：

- 点击"执行双向同步"按钮运行同步
- 点击"试运行"查看同步计划（不实际修改）
- 查看同步结果和统计信息

## 故障排除

### 问题：同步后格式错乱

**原因**：HTML→Markdown 转换不完美

**解决**：
1. 检查 HTML 结构是否标准
2. 手动调整 Markdown 格式
3. 在 Obsidian 中重新编辑后再次同步

### 问题：冲突没有被正确解决

**原因**：时间戳相同或检测失败

**解决**：
1. 查看备份文件：`backups/sync-conflicts/`
2. 手动比较两个版本
3. 删除不需要的版本后重新同步

### 问题：文件没有同步

**原因**：
- 文件缺少 frontmatter
- status 为 draft（草稿）
- 分类不在支持列表中

**解决**：
检查文件是否包含必需的 frontmatter：

```yaml
---
title: 标题
date: 2026-04-10
category: life
status: published
---
```

## 高级用法

### 手动指定同步方向

```bash
# 仅 Obsidian → GitHub
node scripts/obsidian-sync.js

# 仅 GitHub → Obsidian
node scripts/obsidian-sync.js blog-to-obsidian
```

### 同步单个文件

```bash
# 同步单个 Markdown 文件
node scripts/obsidian-sync.js 生活日记/今日小结.md

# 同步单个 HTML 文件
node scripts/obsidian-sync.js blog-to-obsidian life/今日小结（202604）.html
```

## 注意事项

1. **不要在两边同时编辑同一文件**，尽量在一个环境中完成编辑再同步
2. **保持 frontmatter 完整**，缺少必需字段会导致同步失败
3. **定期备份重要文件**，虽然系统有备份机制，但重要内容建议额外备份
4. **首次同步建议用 --dry-run**，确认无误后再实际执行

## 相关文档

- [双向同步系统设计](./superpowers/specs/2026-04-10-bidirectional-sync-design.md)
- [Obsidian 同步配置](../config/obsidian-sync.config.json)
DOCEOF
```

- [ ] **Step 2: 提交文档**

```bash
git add docs/bidirectional-sync-usage.md
git commit -m "docs: 添加双向同步使用指南"
```

---

## 计划完成

**计划已保存到：** `docs/superpowers/plans/2026-04-10-bidirectional-sync-plan.md`

**执行选项：**

1. **Subagent-Driven（推荐）** - 我派遣独立的子代理逐个任务执行，每个任务后审查，快速迭代
2. **Inline Execution** - 在当前会话中使用 executing-plans 技能批量执行任务，带检查点

**推荐选择 Subagent-Driven**，因为：
- 任务之间有依赖关系，需要逐步验证
- 涉及多个文件的修改，需要及时检查
- 可以更快地发现问题并调整

**请选择执行方式：**
