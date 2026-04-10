# Obsidian 同步问题修复计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修复 Obsidian 同步的 HTML 格式不一致、文件不显示在网站、文件名格式不统一等问题

**Architecture:** 统一 Obsidian 同步的 HTML 模板与 GitHub 直接创建的格式一致，添加索引更新机制，规范文件命名

**Tech Stack:** Node.js, JavaScript, HTML, GitHub API

---

## 问题分析

### 问题 1：HTML 格式不一致
Obsidian 同步生成的 HTML 与 GitHub 直接创建的 HTML 格式差异：
- 缺少 emoji 图标
- 缺少 Font Awesome CSS
- 缺少内联样式
- 缺少返回链接
- 缺少标签点击脚本

### 问题 2：文件未显示在网站上
Obsidian 同步后没有更新分类索引（index.html），导致文件在网站上看不到

### 问题 3：文件名格式不一致
- Obsidian: `今日小结-2026-04-09.html`
- GitHub: `今日小结（2026.04.08）（202604）.html`

### 问题 4：检查 opencode-obsidian 插件更新
需要检查昨天插件更新带来的潜在问题

---

## 任务分解

### Task 1: 统一 HTML 模板格式

**Files:**
- Modify: `scripts/obsidian-sync.js` (第 124-153 行)

**Objective:** 将 `generateHtmlTemplate` 方法替换为与 `index.html` 的 `buildBlogHTML` 相同的格式

- [ ] **Step 1: 复制 buildBlogHTML 函数**

从 `index.html` 第 2220-2280 行复制 `buildBlogHTML` 函数到剪贴板

- [ ] **Step 2: 替换 generateHtmlTemplate 方法**

修改 `scripts/obsidian-sync.js` 第 124-153 行：

```javascript
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
```

- [ ] **Step 3: 修改调用方式**

修改 `scripts/obsidian-sync.js` 第 75 行：

```javascript
const htmlTemplate = this.generateHtmlTemplate(htmlContent, frontmatter, blogCategory);
```

---

### Task 2: 添加索引更新机制

**Files:**
- Modify: `scripts/obsidian-sync.js` (第 31-91 行，添加索引更新)

**Objective:** 在文件同步完成后，更新分类索引（index.html）

- [ ] **Step 1: 导入索引更新函数**

在 `scripts/obsidian-sync.js` 第 6 行后添加：

```javascript
const { updateCategoryIndex } = require('./utils/category-index');
```

- [ ] **Step 2: 创建索引更新工具函数**

创建新文件 `scripts/utils/category-index.js`：

```javascript
const fs = require('fs-extra');
const path = require('path');

const CAT_NAMES = {
  life: '生活日记',
  books: '书籍阅读',
  tech: '技术思考',
  analysis: '数据分析',
  quotes: '摘录记录',
  thoughts: '随笔思考'
};

function pad(n) {
  return String(n).padStart(2, '0');
}

async function updateCategoryIndex(blogPath, category, filename, title, tagList, raw, source) {
  const indexPath = path.join(blogPath, category, 'index.html');
  
  if (!await fs.pathExists(indexPath)) {
    console.warn(`索引文件不存在: ${indexPath}`);
    return false;
  }
  
  const currentHTML = await fs.readFile(indexPath, 'utf8');
  
  const now = new Date();
  const dateStr = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate());
  const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);
  const excerpt = (lines[0] || '').slice(0, 100);
  
  const tagsHtml = tagList.map(t => `<span class="tag">${t}</span>`).join('');
  
  // 无标题时卡片显示内容开头
  const cardTitle = title || (
    '<span style="color:var(--text-light);font-style:italic">' +
    (lines[0] || '').slice(0, 30) +
    (lines[0] && lines[0].length > 30 ? '…' : '') +
    '</span>'
  );
  
  // 来源标注（quotes 专用）
  const sourceHtml = (category === 'quotes' && source) ?
    '<div class="post-source-mini"><i class="fas fa-link"></i> ' + source.slice(0, 60) + '</div>' : '';
  
  const newCard =
    '\n            <a href="' + filename + '" class="post-item">\n' +
    '                <div class="post-date">' + dateStr + '</div>\n' +
    '                <h3 class="post-title">' + cardTitle + '</h3>\n' +
    sourceHtml +
    '                <p class="post-excerpt">' + excerpt + '</p>\n' +
    '                <div class="post-tags">' + tagsHtml + '</div>\n' +
    '            </a>';
  
  const marker = '<div class="post-list">';
  if (!currentHTML.includes(marker)) {
    console.warn(`无法找到插入点: ${marker}`);
    return false;
  }
  
  const updatedHTML = currentHTML.replace(marker, marker + newCard);
  await fs.writeFile(indexPath, updatedHTML, 'utf8');
  
  console.log(`更新索引成功: ${indexPath}`);
  return true;
}

module.exports = { updateCategoryIndex };
```

- [ ] **Step 3: 在同步完成后更新索引**

修改 `scripts/obsidian-sync.js` 第 78 行后添加：

```javascript
// 更新分类索引
await updateCategoryIndex(
  this.config.blog.blogPath,
  blogCategory,
  `${slug}.html`,
  frontmatter.title,
  frontmatter.tags || [],
  processedContent,
  frontmatter.source
);
```

---

### Task 3: 统一文件名格式

**Files:**
- Modify: `scripts/obsidian-sync.js` (第 66-70 行)

**Objective:** 统一 Obsidian 同步的文件名格式与 GitHub 创建的一致

- [ ] **Step 1: 修改文件名生成逻辑**

修改 `scripts/obsidian-sync.js` 第 66-70 行：

```javascript
const blogCategory = getBlogCategory(path.dirname(filePath));
const now = new Date(frontmatter.date);
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
```

- [ ] **Step 2: 更新调用方式**

修改 `scripts/obsidian-sync.js` 第 75 行：

```javascript
const htmlTemplate = this.generateHtmlTemplate(htmlContent, frontmatter, blogCategory);
await fs.writeFile(targetPath, htmlTemplate, 'utf8');
```

以及索引更新调用：

```javascript
await updateCategoryIndex(
  this.config.blog.blogPath,
  blogCategory,
  filename,  // 使用新生成的 filename
  frontmatter.title,
  frontmatter.tags || [],
  processedContent,
  frontmatter.source
);
```

---

### Task 4: 检查 opencode-obsidian 插件

**Files:**
- Check: `obsidian-vault/.obsidian/plugins/opencode-obsidian/`

**Objective:** 检查昨天插件更新带来的潜在问题

- [ ] **Step 1: 检查插件配置文件**

查看 `obsidian-vault/.obsidian/plugins/opencode-obsidian/data.json`：

```bash
cat obsidian-vault/.obsidian/plugins/opencode-obsidian/data.json
```

检查配置项是否正确，特别是：
- `github_repo`
- `github_owner`
- `sync_path`
- `auto_sync`

- [ ] **Step 2: 检查插件日志**

查看插件日志文件（如果有）：

```bash
ls -la obsidian-vault/.obsidian/plugins/opencode-obsidian/*.log
```

检查是否有错误信息

- [ ] **Step 3: 验证插件功能**

在 Obsidian 中创建测试文件，检查是否触发同步：

1. 在 Obsidian 中创建新文件 `测试-obsidian-插件.md`
2. 添加 frontmatter:
   ```yaml
   ---
   title: "测试 Obsidian 插件"
   date: 2026-04-10
   category: life
   status: published
   tags: [测试, 插件]
   ---
   ```
3. 添加内容："测试内容"
4. 保存文件
5. 检查是否自动同步到 `blog/life/`

---

### Task 5: 测试修复

**Files:**
- Test: `blog/life/` 目录

**Objective:** 验证所有修复工作正常

- [ ] **Step 1: 运行 Obsidian 同步**

```bash
node scripts/obsidian-sync.js --direction obsidian-to-blog --dry-run
```

检查输出：
- 文件名格式是否正确
- HTML 内容是否包含完整样式
- 是否有错误信息

- [ ] **Step 2: 实际同步测试文件**

```bash
node scripts/obsidian-sync.js --direction obsidian-to-blog --file "生活日记/测试文件.md"
```

验证：
- 文件成功同步到 `blog/life/`
- HTML 格式与 GitHub 创建的一致
- 文件出现在 `blog/life/index.html` 索引中

- [ ] **Step 3: 验证网站显示**

1. 访问 https://xie-l.github.io/blog/life/
2. 检查测试文件是否显示在列表中
3. 点击测试文件，验证页面显示正常
4. 检查标签是否可以点击

---

### Task 6: 清理和提交

**Files:**
- All modified files

**Objective:** 清理测试文件，提交所有更改

- [ ] **Step 1: 清理测试文件**

删除测试文件（如果不需要保留）：

```bash
rm -f blog/life/测试-obsidian-插件*.html
```

- [ ] **Step 2: 提交更改**

```bash
git add scripts/obsidian-sync.js
git add scripts/utils/category-index.js
git add config/obsidian-sync.config.json
git commit -m "fix: 统一 Obsidian 同步格式，添加索引更新，修复文件显示问题"
git push
```

---

## 验证清单

- [ ] Obsidian 同步的 HTML 包含完整样式、图标、脚本
- [ ] Obsidian 同步的文件自动显示在网站索引中
- [ ] 文件名格式统一为：`标题（年月）.html` 或 `日期（年月）.html`
- [ ] opencode-obsidian 插件配置正确，无错误日志
- [ ] 网站可以正常访问同步的文件
- [ ] 标签可以点击并跳转到标签页
- [ ] 返回链接正常工作
