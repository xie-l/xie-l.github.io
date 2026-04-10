# GitHub个人主页完整系统验证与修复计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 全面检查并修复GitHub个人主页所有功能，包括博客发布、Obsidian双向同步、微信读书展示等，确保所有用户体验功能正常工作。

**Architecture:** 
1. 修复索引重复添加问题，添加去重逻辑
2. 实现完整的双向同步功能（blog-to-obsidian方向）
3. 验证并测试所有发布入口（右下角铅笔图标、管理后台、Obsidian同步）
4. 检查并修复微信读书数据展示

**Tech Stack:** JavaScript, Node.js, GitHub API, Obsidian, HTML/CSS

---

## 问题总结

### 已确认问题
1. ✅ **右下角铅笔图标发布功能**：已修复SHA参数问题，需要验证实际工作
2. ✅ **Obsidian同步文件显示**：文件能正常显示，HTML格式正确
3. ❌ **索引重复问题**：同一个文件在索引中出现多次（blog/life/index.html第138、162、168行重复）
4. ❌ **双向同步不完整**：只有obsidian-to-blog，缺少blog-to-obsidian方向
5. ⚠️ **微信读书数据为空**：data/weread.json中只有null和空数组
6. ✅ **主页实时刷新功能**：代码存在，需要验证数据是否正确加载

---

## Task 1: 修复索引重复添加问题

**文件：**
- 修改：`scripts/utils/category-index.js`（新增去重逻辑）
- 修改：`scripts/obsidian-sync.js`（调用去重函数）

**问题分析：**
当前`updateCategoryIndex`函数每次都在`post-list`标记后直接插入新卡片，没有检查是否已存在相同文件名的链接，导致重复添加。

### 步骤 1: 添加去重函数到category-index.js

```javascript
// 在 scripts/utils/category-index.js 中添加

/**
 * 检查索引中是否已存在指定文件的链接
 * @param {string} indexHtml - 索引HTML内容
 * @param {string} filename - 文件名（如"今日小结（2026.04.09）（202604）.html"）
 * @returns {boolean} - 是否已存在
 */
function checkFileExistsInIndex(indexHtml, filename) {
  // 构建匹配模式：href="filename" 或 href='filename'
  const escapedFilename = filename.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`href=["']${escapedFilename}["']`);
  return regex.test(indexHtml);
}

module.exports = { updateCategoryIndex, checkFileExistsInIndex };
```

### 步骤 2: 在updateCategoryIndex函数中添加去重检查

```javascript
// 修改 scripts/utils/category-index.js 中的updateCategoryIndex函数

async function updateCategoryIndex(blogPath, category, filename, frontmatter, content, config) {
  // ... 前面的代码保持不变 ...
  
  const indexPath = path.join(blogPath, category, 'index.html');
  
  // 读取当前索引内容
  let indexHtml;
  try {
    indexHtml = await fs.readFile(indexPath, 'utf8');
  } catch (error) {
    // 如果索引文件不存在，创建新的
    indexHtml = createEmptyIndexHtml(category, config);
  }
  
  // 检查是否已存在该文件
  if (checkFileExistsInIndex(indexHtml, filename)) {
    logger.warn(`索引中已存在文件: ${filename}，跳过添加`);
    return { success: true, skipped: true, reason: 'already_exists' };
  }
  
  // ... 后续的插入逻辑 ...
}
```

### 步骤 3: 在obsidian-sync.js中处理跳过的提示

```javascript
// 修改 scripts/obsidian-sync.js 第98-105行

const result = await updateCategoryIndex(
  this.config.blog.blogPath,
  blogCategory,
  filename,
  frontmatter,
  processedContent,
  this.config
);

if (result.skipped && result.reason === 'already_exists') {
  this.logger.info(`文件已在索引中，跳过更新: ${filename}`);
} else if (result.success) {
  this.logger.info(`成功更新分类索引: ${blogCategory}`);
}
```

### 步骤 4: 测试去重功能

```bash
# 测试1：第一次同步，应该成功添加
node scripts/obsidian-sync.js \
  --direction obsidian-to-blog \
  --file "生活日记/今日小结（2026.04.09）.md" \
  --dry-run

# 预期输出：成功更新分类索引

# 测试2：第二次同步相同文件，应该跳过
node scripts/obsidian-sync.js \
  --direction obsidian-to-blog \
  --file "生活日记/今日小结（2026.04.09）.md" \
  --dry-run

# 预期输出：文件已在索引中，跳过更新
```

### 步骤 5: 清理现有重复项

```bash
# 手动清理blog/life/index.html中的重复项
# 删除第162-167行和第168-173行的重复内容
# 只保留第138-143行的第一个
```

---

## Task 2: 实现双向同步功能（blog-to-obsidian）

**文件：**
- 修改：`scripts/obsidian-sync.js`（添加syncBlogToObsidian方法）
- 修改：`scripts/obsidian-sync.js`（更新main函数支持both方向）

### 步骤 1: 添加syncBlogToObsidian方法

```javascript
// 在ObsidianSync类中添加新方法（第243行之后）

  /**
   * 将博客文件同步到Obsidian
   * @param {Object} options - 选项
   * @param {string} options.filePath - 博客文件路径（如"blog/life/xxx.html"）
   */
  async syncBlogToObsidian(options = {}) {
    const { filePath } = options;
    
    if (filePath) {
      return await this.syncSingleBlogFile(filePath);
    } else {
      return await this.syncAllBlogFiles();
    }
  }
  
  async syncSingleBlogFile(filePath) {
    try {
      this.logger.info(`开始同步博客文件到Obsidian: ${filePath}`);
      
      const fullPath = path.join(this.config.blog.blogPath, filePath);
      
      if (!await fs.pathExists(fullPath)) {
        throw new Error(`博客文件不存在: ${fullPath}`);
      }
      
      // 读取HTML文件
      const htmlContent = await fs.readFile(fullPath, 'utf8');
      
      // 从HTML中提取内容（反向解析）
      const extracted = this.extractFromHtml(htmlContent);
      
      if (!extracted) {
        throw new Error('无法从HTML中提取有效内容');
      }
      
      // 转换为Markdown
      const markdownContent = this.convertHtmlToMarkdown(extracted);
      
      // 构建Frontmatter
      const frontmatter = this.buildFrontmatter(extracted);
      
      // 构建完整的Markdown内容
      const fullMarkdown = `---\n${frontmatter}---\n\n${markdownContent}`;
      
      // 确定目标路径
      const vaultCategory = this.getVaultCategory(extracted.category);
      const targetDir = path.join(this.config.obsidian.vaultPath, vaultCategory);
      
      // 生成文件名（使用原始标题或日期）
      let filename;
      if (extracted.title) {
        filename = `${extracted.title}.md`;
      } else {
        const now = new Date(extracted.date);
        filename = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}.md`;
      }
      
      const targetPath = path.join(targetDir, filename);
      
      if (!this.dryRun) {
        await fs.ensureDir(targetDir);
        await fs.writeFile(targetPath, fullMarkdown, 'utf8');
      }
      
      this.logger.info(`成功同步到Obsidian: ${targetPath}`);
      
      return {
        success: true,
        source: fullPath,
        target: targetPath,
        skipped: false
      };
    } catch (error) {
      this.logger.error(`同步失败: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }
```

### 步骤 2: 添加HTML提取和转换辅助方法

```javascript
// 在ObsidianSync类中添加辅助方法

  /**
   * 从HTML中提取标题、日期、分类、标签和内容
   */
  extractFromHtml(html) {
    const result = {};
    
    // 提取标题
    const titleMatch = html.match(/<h1 class="post-title">(.+?)<\/h1>/);
    result.title = titleMatch ? titleMatch[1] : '';
    
    // 提取日期
    const dateMatch = html.match(/<span><i class="fas fa-calendar"><\/i> (.+?)<\/span>/);
    if (dateMatch) {
      // 将"2026年4月10日"转换为"2026-04-10"
      const dateStr = dateMatch[1];
      const dateParts = dateStr.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
      if (dateParts) {
        result.date = `${dateParts[1]}-${String(dateParts[2]).padStart(2, '0')}-${String(dateParts[3]).padStart(2, '0')}`;
      }
    }
    
    // 提取分类
    const catMatch = html.match(/返回(.+?)<\/a>/);
    result.category = this.getBlogCategoryFromName(catMatch ? catMatch[1] : '');
    
    // 提取标签
    const tagsMatch = html.match(/<div class="post-tags">([\s\S]*?)<\/div>/);
    if (tagsMatch) {
      const tagMatches = tagsMatch[1].match(/<span class="tag">(.+?)<\/span>/g);
      result.tags = tagMatches ? tagMatches.map(tag => tag.replace(/<[^>]+>/g, '')) : [];
    } else {
      result.tags = [];
    }
    
    // 提取内容（移除HTML标签）
    const contentMatch = html.match(/<div class="post-content">([\s\S]*?)<\/div>\s*<script>/);
    if (contentMatch) {
      // 简单移除HTML标签（实际项目中可使用更完善的HTML解析器）
      result.content = contentMatch[1]
        .replace(/<p>/g, '')
        .replace(/<\/p>/g, '\n\n')
        .replace(/<[^>]+>/g, '')
        .trim();
    } else {
      result.content = '';
    }
    
    return result;
  }
  
  /**
   * 将HTML内容转换为Markdown（简化版）
   */
  convertHtmlToMarkdown(extracted) {
    let markdown = extracted.content;
    
    // 简单的转换规则
    markdown = markdown
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/<\/h[1-6]>/g, '\n\n')
      .replace(/<h[1-6][^>]*>/g, '\n\n# ')
      .replace(/<\/li>/g, '\n')
      .replace(/<li[^>]*>/g, '- ')
      .replace(/<\/ul>/g, '\n')
      .replace(/<ul[^>]*>/g, '')
      .replace(/<\/ol>/g, '\n')
      .replace(/<ol[^>]*>/g, '');
    
    return markdown.trim();
  }
  
  /**
   * 构建Frontmatter
   */
  buildFrontmatter(extracted) {
    const lines = [];
    lines.push(`title: ${extracted.title || ''}`);
    lines.push(`date: ${extracted.date || new Date().toISOString().split('T')[0]}`);
    lines.push(`category: ${extracted.category || 'life'}`);
    lines.push(`status: published`);
    
    if (extracted.tags && extracted.tags.length > 0) {
      lines.push(`tags: [${extracted.tags.join(', ')}]`);
    }
    
    return lines.join('\n');
  }
  
  /**
   * 根据分类名称获取vault目录
   */
  getVaultCategory(blogCategory) {
    const categoryMap = {
      'tech': '技术思考',
      'life': '生活日记',
      'books': '读书笔记',
      'quotes': '摘录收藏',
      'analysis': '分析文章',
      'thoughts': '随笔思考'
    };
    return categoryMap[blogCategory] || '生活日记';
  }
  
  /**
   * 根据中文分类名获取blog分类
   */
  getBlogCategoryFromName(catName) {
    const nameMap = {
      '技术思考': 'tech',
      '生活日记': 'life',
      '读书笔记': 'books',
      '摘录收藏': 'quotes',
      '分析文章': 'analysis',
      '随笔思考': 'thoughts'
    };
    return nameMap[catName] || 'life';
  }
```

### 步骤 3: 更新main函数支持both方向

```javascript
// 修改 scripts/obsidian-sync.js 第287-296行

if (direction === 'obsidian-to-blog') {
  const result = await sync.syncObsidianToBlog({ filePath });
  // ... 处理结果 ...
} else if (direction === 'blog-to-obsidian') {
  const result = await sync.syncBlogToObsidian({ filePath });
  
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
} else if (direction === 'both') {
  // 先执行obsidian-to-blog
  console.log('=== 第一阶段: Obsidian → Blog ===');
  const result1 = await sync.syncObsidianToBlog({ filePath });
  
  if (result1.success && !result1.skipped) {
    console.log(`Obsidian → Blog: ${result1.source} -> ${result1.target}`);
  }
  
  // 再执行blog-to-obsidian
  console.log('=== 第二阶段: Blog → Obsidian ===');
  const result2 = await sync.syncBlogToObsidian({ filePath });
  
  if (result2.success && !result2.skipped) {
    console.log(`Blog → Obsidian: ${result2.source} -> ${result2.target}`);
  }
  
  console.log('=== 双向同步完成 ===');
}
```

### 步骤 4: 测试blog-to-obsidian功能

```bash
# 测试单个文件同步
node scripts/obsidian-sync.js \
  --direction blog-to-obsidian \
  --file "life/今日小结（2026.04.09）（202604）.html" \
  --dry-run

# 预期输出：
# 开始同步博客文件到Obsidian: life/今日小结（2026.04.09）（202604）.html
# ...处理过程...
# 成功同步到Obsidian: obsidian-vault/生活日记/今日小结（2026.04.09）.md

# 测试both方向
node scripts/obsidian-sync.js \
  --direction both \
  --dry-run

# 预期输出：
# === 第一阶段: Obsidian → Blog ===
# === 第二阶段: Blog → Obsidian ===
```

### 步骤 5: 验证双向同步结果

```bash
# 1. 检查Obsidian vault中是否生成了对应的markdown文件
ls -la obsidian-vault/生活日记/ | grep "今日小结"

# 2. 检查文件内容是否完整（包含frontmatter和markdown内容）
head -20 obsidian-vault/生活日记/今日小结（2026.04.09）.md

# 3. 验证frontmatter格式是否正确
# 应该包含：title, date, category, status, tags
```

---

## Task 3: 验证右下角铅笔图标发布功能

**文件：**
- 测试：`index.html`（第2368-2409行）

### 步骤 1: 本地测试发布流程

```bash
# 1. 在本地启动一个简单的HTTP服务器来测试index.html
cd /Users/liang/Documents/GitHub/xie-l.github.io
python3 -m http.server 8000

# 2. 打开浏览器访问 http://localhost:8000
# 3. 点击右下角铅笔图标（💡）
# 4. 选择分类（如"生活日记"）
# 5. 填写标题和内容
# 6. 点击"发布到博客"
# 7. 检查浏览器控制台是否有错误
```

### 步骤 2: 验证GitHub API调用

```javascript
// 在浏览器控制台中检查网络请求
// 应该看到：
// 1. GET请求获取文件SHA（如果文件已存在）
// 2. PUT请求创建/更新文件
// 3. 状态码应该是201（创建）或200（更新）
```

### 步骤 3: 检查生成的文件

```bash
# 发布后检查blog/life/目录下是否生成了新文件
ls -lt blog/life/ | head -5

# 检查文件内容是否完整
head -30 blog/life/新发布的文件.html

# 检查索引是否自动更新
grep -n "新发布的文件" blog/life/index.html
```

### 步骤 4: 验证更新功能

```bash
# 测试更新已存在的文件
# 1. 再次发布相同标题的内容
# 2. 检查文件是否被更新（SHA参数是否正确传递）
# 3. 检查GitHub提交历史，确认是更新而不是创建新文件
```

---

## Task 4: 检查并修复微信读书功能

**文件：**
- 检查：`data/weread.json`
- 检查：`index.html`（第1622-1650行）

### 步骤 1: 检查数据文件

```bash
# 查看当前weread.json内容
cat data/weread.json

# 预期应该有reading和recent数据，而不是null和空数组
```

### 步骤 2: 检查数据更新脚本

```bash
# 查找微信读书数据更新脚本
ls -la scripts/ | grep weread

# 如果没有，需要创建或检查是否有其他更新机制
```

### 步骤 3: 验证前端显示逻辑

```javascript
// 在浏览器控制台中检查
// 1. 检查weread.json是否成功加载
fetch('/data/weread.json').then(r => r.json()).then(console.log)

// 2. 检查weread-widget是否显示
// 如果数据有效，id="weread-widget"的元素应该display不为none
```

### 步骤 4: 测试数据更新

```bash
# 如果有更新脚本，运行测试
node scripts/update-weread.js  # 假设存在这样的脚本

# 或者手动更新data/weread.json测试
cat > data/weread.json << 'EOF'
{
  "reading": {
    "title": "测试书籍",
    "author": "测试作者",
    "progress": 45
  },
  "recent": [
    {
      "title": "最近阅读1",
      "author": "作者1"
    }
  ],
  "updated": "2026-04-10 12:00 UTC"
}
EOF

# 刷新页面检查是否显示
```

---

## Task 5: 验证主页实时数据刷新功能

**文件：**
- 检查：`index.html`中的数据加载逻辑

### 步骤 1: 检查所有数据加载接口

```bash
# 检查data目录下的所有数据文件
ls -la data/

# 应该包含：
# - weather.json (天气)
# - energy.json (能量状态)
# - stats.json (统计数据)
# - weread.json (微信读书)
# - pool-*.json (各种数据池)
```

### 步骤 2: 验证数据加载代码

```javascript
// 在index.html中检查数据加载
// 第1386行：天气数据
// 第1407行：能量数据
// 第1604行：统计数据
// 第1622行：微信读书
// 第1727-1923行：各种数据池

// 在浏览器控制台测试
await fetch('/data/weather.json?_=' + Date.now()).then(r => r.json())
await fetch('/data/energy.json?_=' + Date.now()).then(r => r.json())
await fetch('/data/stats.json?_=' + Date.now()).then(r => r.json())
```

### 步骤 3: 检查定时刷新机制

```javascript
// 检查setInterval调用
// 第1306行：updateClock每秒更新
// 其他数据是否有定时刷新？

// 如果没有，考虑添加：
setInterval(loadWeather, 60000);  // 每分钟刷新天气
setInterval(loadEnergy, 300000);  // 每5分钟刷新能量
```

---

## Task 6: 完整系统测试

### 步骤 1: 测试完整发布流程

```bash
# 测试1：右下角铅笔图标发布
# - 访问主页 → 点击铅笔图标 → 发布测试文章

# 测试2：管理后台发布
# - 访问admin/dashboard.html → 发布测试文章

# 测试3：Obsidian同步
# - 在Obsidian中创建新笔记 → 同步到博客

# 验证所有方式发布的文章：
# - 文件格式一致
# - 索引正确更新
# - 页面显示正常
```

### 步骤 2: 测试双向同步

```bash
# 1. Obsidian → Blog
node scripts/obsidian-sync.js \
  --direction obsidian-to-blog \
  --file "生活日记/测试双向同步.md"

# 2. 修改Blog中的文件（模拟在GitHub上编辑）
# 编辑 blog/life/测试双向同步.html

# 3. Blog → Obsidian
node scripts/obsidian-sync.js \
  --direction blog-to-obsidian \
  --file "life/测试双向同步.html"

# 4. 验证Obsidian中的文件是否更新
```

### 步骤 3: 测试both方向同步

```bash
# 完整双向同步
node scripts/obsidian-sync.js \
  --direction both

# 预期：所有Obsidian文件同步到Blog，所有Blog文件同步到Obsidian
```

### 步骤 4: 验证网站功能

```bash
# 1. 访问所有博客分类页面
# - /blog/life/index.html
# - /blog/tech/index.html
# - /blog/books/index.html
# - /blog/quotes/index.html
# - /blog/analysis/index.html
# - /blog/thoughts/index.html

# 2. 点击几篇文章检查：
# - 页面显示正常
# - 样式正确
# - 标签可点击
# - 返回链接正常

# 3. 检查主页：
# - 实时数据加载
# - 微信读书显示
# - 所有链接有效
```

---

## 验证清单

### 功能验证
- [ ] 右下角铅笔图标发布功能正常工作
- [ ] 管理后台发布功能正常工作
- [ ] Obsidian同步功能正常工作（obsidian-to-blog）
- [ ] Blog同步到Obsidian功能正常工作（blog-to-obsidian）
- [ ] 双向同步（both）功能正常工作
- [ ] 索引更新不重复添加文件
- [ ] 微信读书数据正确显示
- [ ] 主页实时数据正确刷新

### 代码质量
- [ ] 所有JavaScript语法正确
- [ ] 所有异步操作有错误处理
- [ ] 代码注释清晰
- [ ] 函数职责单一

### 用户体验
- [ ] 发布流程简单直观
- [ ] 同步过程有日志输出
- [ ] 错误提示清晰
- [ ] 所有页面响应式设计正常

---

## 提交计划

完成所有任务后：

1. **提交修复代码**
```bash
git add scripts/utils/category-index.js
git add scripts/obsidian-sync.js
git add blog/life/index.html  # 清理后的索引
git commit -m "fix: 修复索引重复添加问题，实现双向同步功能"
git push origin main
```

2. **创建验证报告**
```bash
# 创建验证文档docs/verification-report.md
echo "# 系统验证报告 - $(date +%Y-%m-%d)" > docs/verification-report.md
echo "" >> docs/verification-report.md
echo "## 测试结果" >> docs/verification-report.md
echo "- [ ] 右下角发布功能" >> docs/verification-report.md
echo "- [ ] Obsidian同步" >> docs/verification-report.md
echo "- [ ] 双向同步" >> docs/verification-report.md
echo "- [ ] 微信读书" >> docs/verification-report.md
```

3. **等待GitHub Pages部署**
# 访问 https://xie-l.github.io 验证所有功能
```
