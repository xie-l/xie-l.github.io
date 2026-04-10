# Obsidian 与 GitHub 个人主页完整同步方案

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现 Obsidian 与 GitHub 个人主页的完整同步，确保 md 文件和图片都能正确同步并在网页上显示

**Architecture:** 基于现有的 obsidian-sync.js 脚本，完善图片处理、自动化同步、错误处理和用户文档，构建可靠的同步流程

**Tech Stack:** Node.js, JavaScript, GitHub API, Markdown, HTML

---

## 问题分析

### 当前状态
- ✅ Obsidian 同步脚本基本功能已完成
- ✅ HTML 格式已统一
- ✅ 索引更新机制已添加
- ⚠️ 图片同步需要验证和完善
- ❌ 缺少自动化同步机制
- ❌ 缺少完整的用户文档
- ❌ 缺少错误处理和监控

### 核心需求
1. **文件同步**：Obsidian 中的 md 文件 → GitHub blog 目录
2. **图片同步**：Obsidian 中的图片 → GitHub img/blog 目录
3. **网页显示**：同步后的文件能在网站上正确显示
4. **图片显示**：图片能在网页上正确加载

---

## 任务分解

### Task 1: 验证和完善图片同步机制

**Files:**
- Modify: `scripts/utils/image-processor.js` (第 5-53 行)
- Test: 创建测试文件验证图片同步

**Objective:** 确保图片从 Obsidian 正确同步到 GitHub，并在网页上可访问

- [ ] **Step 1: 检查当前图片处理逻辑**

查看 `scripts/utils/image-processor.js` 第 5-53 行，确认图片处理流程：
- 源路径：`obsidian-vault/attachments/`
- 目标路径：`img/blog/{category}/{slug}/`
- 路径替换：将 `./attachments/图片.jpg` 替换为 `../../img/blog/{category}/{slug}/图片.jpg`

- [ ] **Step 2: 创建测试文件（带图片）**

在 Obsidian 中创建测试文件：

```bash
cat > "obsidian-vault/生活日记/测试图片同步.md" << 'EOF'
---
title: "测试图片同步"
date: 2026-04-10
category: life
status: published
tags:
  - 测试
  - 图片
---

这是一篇测试图片同步的文章。

## 图片测试

下面是第一张测试图片：

![测试图片1](./attachments/test-image-1.jpg)

这是第二张测试图片：

![测试图片2](./attachments/test-image-2.png)

### 日有所成

1. 测试图片同步功能
2. 验证图片在网页上显示
3. 检查图片路径是否正确

### 日有所记

图片同步测试完成。
EOF
```

将测试图片放入 `obsidian-vault/attachments/` 目录：
```bash
cp ~/Desktop/test-image-1.jpg obsidian-vault/attachments/
cp ~/Desktop/test-image-2.png obsidian-vault/attachments/
```

- [ ] **Step 3: 运行同步测试**

```bash
node scripts/obsidian-sync.js \
  --direction obsidian-to-blog \
  --file "生活日记/测试图片同步.md"
```

**预期输出：**
```
✓ 复制图片: test-image-1.jpg
✓ 复制图片: test-image-2.png
更新索引成功: blog/life/index.html
同步完成
```

- [ ] **Step 4: 验证图片文件是否存在**

```bash
ls -la img/blog/life/测试图片同步/
```

**预期结果：**
```
test-image-1.jpg
test-image-2.png
```

- [ ] **Step 5: 检查生成的 HTML 中的图片路径**

```bash
grep -n "img" "blog/life/测试图片同步（202604）.html"
```

**预期结果：**
```html
<img src="../../img/blog/life/测试图片同步/test-image-1.jpg" alt="测试图片1">
<img src="../../img/blog/life/测试图片同步/test-image-2.png" alt="测试图片2">
```

- [ ] **Step 6: 验证网站上的图片显示**

1. 访问 `https://xie-l.github.io/blog/life/测试图片同步（202604）.html`
2. 检查图片是否正常显示
3. 打开浏览器开发者工具，检查图片 URL 是否正确
4. 确认图片 URL 类似：`https://xie-l.github.io/img/blog/life/测试图片同步/test-image-1.jpg`

- [ ] **Step 7: 修复发现的问题**

如果图片无法显示，检查并修复：
- 图片是否已提交到 GitHub
- 图片路径是否正确
- GitHub Pages 是否已部署完成

---

### Task 2: 创建自动化同步脚本

**Files:**
- Create: `scripts/sync-obsidian-auto.js`
- Create: `.github/workflows/sync-obsidian.yml` (可选，用于 CI/CD)

**Objective:** 提供自动化同步方案，支持手动一键同步或自动定时同步

- [ ] **Step 1: 创建自动化同步脚本**

创建文件 `scripts/sync-obsidian-auto.js`：

```javascript
#!/usr/bin/env node
// scripts/sync-obsidian-auto.js

const ObsidianSync = require('./obsidian-sync');
const Logger = require('./utils/logger');

class AutoSync {
  constructor() {
    this.sync = new ObsidianSync();
    this.logger = new Logger({ level: 'info', logToConsole: true, logToFile: true });
  }

  async run() {
    try {
      this.logger.info('开始自动同步 Obsidian 到 GitHub...');
      
      const results = await this.sync.syncAllFiles();
      
      const successCount = results.filter(r => r.success).length;
      const failedCount = results.filter(r => !r.success).length;
      const skippedCount = results.filter(r => r.skipped).length;
      
      this.logger.info(`同步完成: 成功 ${successCount}, 跳过 ${skippedCount}, 失败 ${failedCount}`);
      
      if (failedCount > 0) {
        const failedFiles = results.filter(r => !r.success).map(r => r.error);
        this.logger.error('失败的文件:', failedFiles);
        process.exit(1);
      }
      
      this.logger.info('所有文件同步成功！');
    } catch (error) {
      this.logger.error('同步出错:', error.message);
      process.exit(1);
    }
  }
}

// 如果是直接运行
if (require.main === module) {
  const autoSync = new AutoSync();
  autoSync.run();
}

module.exports = AutoSync;
```

- [ ] **Step 2: 添加 npm 脚本**

修改 `package.json`，在 `scripts` 部分添加：

```json
{
  "scripts": {
    "sync:obsidian": "node scripts/sync-obsidian-auto.js",
    "sync:obsidian:dry-run": "node scripts/obsidian-sync.js --direction obsidian-to-blog --dry-run"
  }
}
```

- [ ] **Step 3: 测试 npm 脚本**

```bash
npm run sync:obsidian:dry-run
npm run sync:obsidian
```

- [ ] **Step 4: （可选）创建 GitHub Actions 工作流**

创建文件 `.github/workflows/sync-obsidian.yml`：

```yaml
name: Sync Obsidian to GitHub Pages

on:
  # 手动触发
  workflow_dispatch:
  
  # 定时触发（每天凌晨 2 点）
  schedule:
    - cron: '0 2 * * *'
  
  # 当 obsidian-vault 目录有更新时触发
  push:
    paths:
      - 'obsidian-vault/**'

jobs:
  sync:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout repository
        uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Run Obsidian sync
        run: npm run sync:obsidian
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Commit and push changes
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          git add -A
          git diff --quiet && git diff --staged --quiet || git commit -m "chore: sync obsidian updates [automated]"
          git push
```

---

### Task 3: 完善图片路径处理

**Files:**
- Modify: `scripts/utils/image-processor.js` (第 7-50 行)
- Modify: `scripts/obsidian-sync.js` (第 59 行前后)

**Objective:** 确保图片路径处理健壮，支持多种图片引用方式

- [ ] **Step 1: 增强图片路径匹配**

修改 `scripts/utils/image-processor.js` 第 7 行，支持更多图片路径格式：

```javascript
// 支持多种图片路径格式
const imageRegex = /!\[([^\]]*)\]\((\.{1,2}\/[^)]+)\)/g;

// 同时支持以下格式：
// ![alt](./attachments/image.jpg) - 推荐
// ![alt](../attachments/image.jpg) - 兼容
// ![alt](image.jpg) - 同一目录
```

- [ ] **Step 2: 添加图片路径验证和提示**

在 `scripts/obsidian-sync.js` 第 59 行后添加图片路径提示：

```javascript
const processedContent = await processImagePaths(markdownContent, fullPath, frontmatter, this.config.obsidian.vaultPath);

// 检查是否有未处理的本地图片
const unprocessedImages = processedContent.match(/!\[[^\]]*\]\([^)]*\)/g) || [];
const localImages = unprocessedImages.filter(img => 
  img.includes('(') && !img.includes('http') && !img.includes('../img/blog/')
);

if (localImages.length > 0) {
  this.logger.warn(`发现 ${localImages.length} 张本地图片未处理:`);
  localImages.forEach(img => {
    const match = img.match(/\(([^)]+)\)/);
    if (match) {
      this.logger.warn(`  - ${match[1]}`);
    }
  });
  this.logger.warn('提示：请将图片放在 obsidian-vault/attachments/ 文件夹，并使用格式: ![描述](./attachments/图片.jpg)');
}
```

- [ ] **Step 3: 测试不同图片路径格式**

创建测试文件验证各种图片路径：

```bash
cat > "obsidian-vault/生活日记/测试图片路径格式.md" << 'EOF'
---
title: "测试图片路径格式"
date: 2026-04-10
category: life
status: published
tags: [测试, 图片]
---

## 测试不同图片路径格式

### 1. 推荐格式（应该工作）
![推荐](./attachments/recommended.jpg)

### 2. 上级目录格式（应该工作）
![上级](../attachments/parent.png)

### 3. 同一目录格式（可能不工作）
![同级](same-directory.gif)

### 4. 绝对路径（不应该工作）
![绝对](/Users/xxx/absolute.webp)

### 5. 网络图片（应该保持原样）
![网络](https://example.com/image.jpg)
EOF
```

运行同步并检查输出：
```bash
node scripts/obsidian-sync.js \
  --direction obsidian-to-blog \
  --file "生活日记/测试图片路径格式.md"
```

---

### Task 4: 创建完整的使用文档

**Files:**
- Create: `docs/OBSIDIAN_SYNC_GUIDE.md`
- Create: `docs/OBSIDIAN_SYNC_TROUBLESHOOTING.md`

**Objective:** 提供详细的用户文档，指导如何使用 Obsidian 同步功能

- [ ] **Step 1: 创建主使用指南**

创建文件 `docs/OBSIDIAN_SYNC_GUIDE.md`：

```markdown
# Obsidian 同步完整指南

## 概述

本文档介绍如何将 Obsidian 中的笔记同步到 GitHub 个人主页。

## 前置条件

1. 安装 Node.js (v16+)
2. 项目已配置好 `config/obsidian-sync.config.json`
3. Obsidian vault 目录结构正确

## 目录结构

```
xie-l.github.io/
├── obsidian-vault/          # Obsidian 仓库
│   ├── attachments/         # 图片存放目录
│   ├── 生活日记/            # 生活日记分类
│   ├── 技术思考/            # 技术思考分类
│   └── ...
├── blog/                    # 生成的博客文件
│   ├── life/
│   ├── tech/
│   └── ...
├── img/blog/                # 同步的图片
└── scripts/
    └── obsidian-sync.js     # 同步脚本
```

## 基本使用

### 1. 在 Obsidian 中创建笔记

在相应的分类目录下创建 `.md` 文件，必须包含 frontmatter：

```yaml
---
title: "文章标题"
date: 2026-04-10
category: life          # life, tech, books, analysis, quotes, thoughts
status: published       # published 或 draft
tags:
  - 标签1
  - 标签2
description: "文章描述（可选）"
---

文章内容...
```

### 2. 添加图片

将图片放入 `obsidian-vault/attachments/` 目录，然后在文章中引用：

```markdown
![图片描述](./attachments/图片文件名.jpg)
```

### 3. 同步到 GitHub

#### 方法 A：同步单个文件

```bash
node scripts/obsidian-sync.js \
  --direction obsidian-to-blog \
  --file "生活日记/我的文章.md"
```

#### 方法 B：同步所有文件

```bash
# 使用 npm 脚本
npm run sync:obsidian

# 或直接运行
node scripts/sync-obsidian-auto.js
```

#### 方法 C：Dry-run（预览）

```bash
node scripts/obsidian-sync.js \
  --direction obsidian-to-blog \
  --file "生活日记/我的文章.md" \
  --dry-run
```

### 4. 提交到 GitHub

```bash
git add blog/ img/blog/
git commit -m "添加新文章"
git push
```

### 5. 查看效果

等待 GitHub Pages 部署完成后（约 1-2 分钟），访问：

`https://xie-l.github.io/blog/{category}/文章标题（年月）.html`

## 高级配置

### 修改同步配置

编辑 `config/obsidian-sync.config.json`：

```json
{
  "obsidian": {
    "vaultPath": "./obsidian-vault",
    "attachmentsPath": "./obsidian-vault/attachments"
  },
  "blog": {
    "blogPath": "./blog",
    "imgPath": "./img/blog"
  },
  "sync": {
    "autoBackup": true,
    "backupPath": "./backups/obsidian-sync"
  }
}
```

### 自动同步（GitHub Actions）

项目已配置 GitHub Actions，当 `obsidian-vault/` 目录有更新时自动同步。

手动触发：
1. 访问 GitHub 仓库
2. 点击 Actions 标签
3. 选择 "Sync Obsidian to GitHub Pages"
4. 点击 "Run workflow"

## 常见问题

### Q1: 图片无法显示

**原因：** 图片路径不正确或图片未同步

**解决：**
1. 确保图片在 `obsidian-vault/attachments/` 目录
2. 使用正确的引用格式：`![描述](./attachments/图片.jpg)`
3. 运行同步命令
4. 确认图片已复制到 `img/blog/{category}/{slug}/`

### Q2: 文章未显示在网站列表中

**原因：** 索引未更新

**解决：**
同步命令会自动更新索引，如果未更新，检查是否有错误信息。

### Q3: 同步失败

**原因：** frontmatter 格式错误或缺少必填字段

**解决：**
检查 frontmatter 是否包含：
- title
- date
- category
- status

### Q4: 如何排除草稿

**解决：**
将 frontmatter 中的 `status: published` 改为 `status: draft`，草稿不会同步。

## 最佳实践

1. **图片管理**
   - 所有图片统一放在 `obsidian-vault/attachments/`
   - 使用有意义的文件名
   - 图片大小建议不超过 5MB

2. **Frontmatter 规范**
   - 始终包含必填字段
   - 使用正确的日期格式（YYYY-MM-DD）
   - category 必须是支持的分类之一

3. **定期同步**
   - 建议每次写完文章后立即同步
   - 或设置定时自动同步

4. **备份**
   - 同步前会自动创建备份
   - 备份文件在 `backups/obsidian-sync/`
   - 保留最近 10 次备份

## 故障排除

查看详细故障排除指南：`docs/OBSIDIAN_SYNC_TROUBLESHOOTING.md`
```

- [ ] **Step 2: 创建故障排除指南**

创建文件 `docs/OBSIDIAN_SYNC_TROUBLESHOOTING.md`：

```markdown
# Obsidian 同步故障排除

## 问题 1: 图片不显示

### 症状
网页上图片显示为破碎的图标或 404 错误

### 诊断步骤

1. **检查图片是否已同步**

```bash
# 检查图片是否在 img/blog 目录
ls -la img/blog/{category}/{slug}/

# 检查图片是否在 Git 中
git status img/blog/
```

2. **检查 HTML 中的图片路径**

```bash
# 查看生成的 HTML 中的图片路径
grep 'img src' blog/{category}/{filename}.html
```

3. **检查浏览器控制台**

- 打开浏览器开发者工具（F12）
- 切换到 Network 标签
- 刷新页面，查看图片请求
- 检查图片 URL 是否正确

### 解决方案

#### 情况 A: 图片未同步

1. 确认图片在 `obsidian-vault/attachments/`
2. 确认 frontmatter 中 status 为 published
3. 重新运行同步命令
4. 提交图片到 GitHub

```bash
# 同步
git add img/blog/
git commit -m "添加图片"
git push
```

#### 情况 B: 图片路径错误

1. 检查 Obsidian 中的图片引用格式
2. 确保使用 `./attachments/图片.jpg`
3. 重新同步

#### 情况 C: 图片 URL 404

1. 等待 GitHub Pages 部署完成（1-2 分钟）
2. 检查 GitHub 仓库中图片是否存在
3. 清除浏览器缓存（Ctrl+Shift+R）

## 问题 2: 同步失败

### 症状
运行同步命令时报错

### 常见错误

#### 错误 1: "Front Matter 验证失败"

```
错误: Front Matter 验证失败: title is required, date is required
```

**解决：**
在文章开头添加 frontmatter：

```yaml
---
title: "文章标题"
date: 2026-04-10
category: life
status: published
---
```

#### 错误 2: "文件不存在"

```
错误: 文件不存在: obsidian-vault/生活日记/不存在的文件.md
```

**解决：**
检查文件路径是否正确，注意大小写和特殊字符

#### 错误 3: "category 不支持"

```
错误: category 'xxx' 不支持
```

**解决：**
使用支持的 category：
- life (生活日记)
- tech (技术思考)
- books (书籍阅读)
- analysis (数据分析)
- quotes (摘录记录)
- thoughts (随笔思考)

## 问题 3: 文章未显示在列表中

### 症状
文章已同步，但在网站分类页面看不到

### 诊断

1. **检查索引文件是否更新**

```bash
cat blog/{category}/index.html | grep "文章标题"
```

2. **检查是否有同步错误**

```bash
cat logs/obsidian-sync.log | tail -50
```

### 解决

1. 手动更新索引（如果自动更新失败）

```bash
# 重新同步该文件
node scripts/obsidian-sync.js \
  --direction obsidian-to-blog \
  --file "分类/文件名.md"
```

2. 检查索引文件是否有语法错误

3. 提交索引文件

```bash
git add blog/{category}/index.html
git commit -m "更新索引"
git push
```

## 问题 4: 重复文件

### 症状
同一篇文章出现多个版本

### 原因
文件名格式变更或手动创建了文件

### 解决

1. 删除旧文件

```bash
# 删除旧的格式文件
rm "blog/life/旧文件名.html"

# 提交删除
git add -A
git commit -m "删除重复文件"
git push
```

2. 统一使用新的文件名格式

## 问题 5: 同步速度慢

### 优化建议

1. **只同步修改的文件**

```bash
# 同步单个文件，而不是全部
node scripts/obsidian-sync.js \
  --direction obsidian-to-blog \
  --file "具体文件路径.md"
```

2. **减少图片大小**

- 压缩图片后再放入 attachments
- 使用适当的图片格式（JPEG 用于照片，PNG 用于截图）

3. **排除草稿**

将不需要同步的文章 status 设为 draft

## 调试技巧

### 启用详细日志

修改 `config/obsidian-sync.config.json`：

```json
{
  "logging": {
    "level": "debug"
  }
}
```

### 查看日志文件

```bash
# 查看同步日志
tail -f logs/obsidian-sync.log

# 查看错误日志
cat logs/errors.log
```

### 手动检查生成的 HTML

```bash
# 查看生成的 HTML
open blog/life/文章标题（202604）.html

# 验证 HTML 语法
node -e "require('fs').readFileSync('blog/life/文章标题（202604）.html', 'utf8')"
```

### 测试图片 URL

在浏览器中直接访问图片 URL：
`https://xie-l.github.io/img/blog/{category}/{slug}/{图片文件名}`

## 联系支持

如果以上方法都无法解决问题：

1. 查看日志文件 `logs/obsidian-sync.log`
2. 截图错误信息
3. 提供文件路径和操作步骤
4. 在 GitHub 提交 Issue
```

---

### Task 5: 创建快速开始脚本

**Files:**
- Create: `scripts/setup-obsidian-sync.sh`

**Objective:** 提供一键配置脚本，方便新用户快速开始使用

- [ ] **Step 1: 创建设置脚本**

创建文件 `scripts/setup-obsidian-sync.sh`：

```bash
#!/bin/bash
# scripts/setup-obsidian-sync.sh

set -e

echo "=========================================="
echo "Obsidian 同步快速设置"
echo "=========================================="
echo ""

# 检查 Node.js
echo "1. 检查 Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "   ✓ Node.js 已安装: $NODE_VERSION"
else
    echo "   ✗ Node.js 未安装"
    echo "   请访问 https://nodejs.org/ 下载并安装"
    exit 1
fi

# 检查配置文件
echo ""
echo "2. 检查配置文件..."
if [ -f "config/obsidian-sync.config.json" ]; then
    echo "   ✓ 配置文件存在"
else
    echo "   ✗ 配置文件不存在"
    echo "   请创建 config/obsidian-sync.config.json"
    exit 1
fi

# 检查 Obsidian vault 目录
echo ""
echo "3. 检查 Obsidian vault..."
if [ -d "obsidian-vault" ]; then
    echo "   ✓ Obsidian vault 目录存在"
else
    echo "   ✗ Obsidian vault 目录不存在"
    echo "   请创建 obsidian-vault 目录"
    exit 1
fi

# 检查 attachments 目录
echo ""
echo "4. 检查 attachments 目录..."
if [ -d "obsidian-vault/attachments" ]; then
    echo "   ✓ attachments 目录存在"
else
    echo "   ⚠ attachments 目录不存在，创建中..."
    mkdir -p obsidian-vault/attachments
    echo "   ✓ attachments 目录已创建"
fi

# 安装依赖
echo ""
echo "5. 安装依赖..."
if [ -f "package.json" ]; then
    npm install
    echo "   ✓ 依赖安装完成"
else
    echo "   ✗ package.json 不存在"
    exit 1
fi

# 测试同步
echo ""
echo "6. 测试同步..."
cat > "obsidian-vault/测试.md" << 'EOF'
---
title: "测试同步"
date: 2026-04-10
category: life
status: published
tags: [测试]
---

测试内容
EOF

node scripts/obsidian-sync.js \
  --direction obsidian-to-blog \
  --file "测试.md" \
  --dry-run

if [ $? -eq 0 ]; then
    echo "   ✓ 测试通过"
    rm "obsidian-vault/测试.md"
else
    echo "   ✗ 测试失败"
    rm "obsidian-vault/测试.md"
    exit 1
fi

# 完成
echo ""
echo "=========================================="
echo "✓ 设置完成！"
echo "=========================================="
echo ""
echo "使用方法："
echo "1. 在 obsidian-vault/ 目录创建笔记"
echo "2. 图片放在 obsidian-vault/attachments/"
echo "3. 运行: npm run sync:obsidian"
echo "4. 提交: git add blog/ img/blog/ && git commit -m '同步' && git push"
echo ""
echo "查看详细指南: docs/OBSIDIAN_SYNC_GUIDE.md"
```

- [ ] **Step 2: 添加执行权限**

```bash
chmod +x scripts/setup-obsidian-sync.sh
```

- [ ] **Step 3: 测试设置脚本**

```bash
./scripts/setup-obsidian-sync.sh
```

---

### Task 6: 完整系统测试

**Objective:** 验证整个 Obsidian 同步流程工作正常

- [ ] **Step 1: 创建综合测试文件**

创建包含所有元素的测试文件：

```bash
cat > "obsidian-vault/生活日记/完整功能测试.md" << 'EOF'
---
title: "完整功能测试"
date: 2026-04-10
category: life
status: published
tags:
  - 测试
  - 完整功能
  - 图片
  - 格式
description: "这是一个完整的 Obsidian 同步功能测试"
---

# 完整功能测试

这是一个测试 Obsidian 到 GitHub 个人主页完整同步功能的文章。

## 图片测试

### 单张图片

![测试图片](./attachments/test-image.jpg)

### 多张图片

第一张图片：

![图片1](./attachments/image1.jpg)

第二张图片：

![图片2](./attachments/image2.png)

## 格式测试

### 标题

# 一级标题
## 二级标题
### 三级标题

### 列表

无序列表：
- 项目1
- 项目2
- 项目3

有序列表：
1. 第一步
2. 第二步
3. 第三步

### 强调

**粗体文本**
*斜体文本*
~~删除线~~

### 链接

[GitHub](https://github.com)
[个人主页](https://xie-l.github.io)

### 引用

> 这是一个引用
> 多行引用

### 代码

行内代码：`console.log('hello')`

代码块：

```javascript
function hello() {
  console.log('Hello, World!');
}
```

### 表格

| 列1 | 列2 | 列3 |
|-----|-----|-----|
| A   | B   | C   |
| 1   | 2   | 3   |

### 日有所成

1. 完成 Obsidian 同步功能测试
2. 验证所有格式正确转换
3. 确认图片正常显示

### 日有所记

完整功能测试通过，所有元素都能正确同步和显示。
EOF
```

将测试图片放入 attachments 目录：
```bash
touch obsidian-vault/attachments/test-image.jpg
touch obsidian-vault/attachments/image1.jpg
touch obsidian-vault/attachments/image2.png
```

- [ ] **Step 2: 运行完整同步**

```bash
npm run sync:obsidian
```

- [ ] **Step 3: 验证所有文件**

```bash
# 检查 HTML 文件
ls -la "blog/life/完整功能测试（202604）.html"

# 检查图片
ls -la img/blog/life/完整功能测试/

# 检查索引更新
grep "完整功能测试" blog/life/index.html

# 检查 Git 状态
git status blog/life/完整功能测试* img/blog/life/完整功能测试*
```

- [ ] **Step 4: 本地预览**

```bash
# 启动本地服务器预览
npx http-server -p 8080

# 访问 http://localhost:8080/blog/life/完整功能测试（202604）.html
```

- [ ] **Step 5: 提交到 GitHub**

```bash
git add blog/life/完整功能测试* img/blog/life/完整功能测试*
git commit -m "test: 添加完整功能测试文件"
git push
```

- [ ] **Step 6: 在线验证**

等待 GitHub Pages 部署完成后：

1. 访问 `https://xie-l.github.io/blog/life/完整功能测试（202604）.html`
2. 验证所有格式正确显示
3. 验证所有图片正常显示
4. 验证标签可点击
5. 验证返回链接正常工作

---

### Task 7: 提交所有更改

**Files:**
- All modified and created files

**Objective:** 提交所有更改到 GitHub

- [ ] **Step 1: 检查所有修改**

```bash
git status
```

- [ ] **Step 2: 添加所有文件**

```bash
git add scripts/obsidian-sync.js
git add scripts/utils/image-processor.js
git add scripts/utils/category-index.js
git add scripts/sync-obsidian-auto.js
git add scripts/setup-obsidian-sync.sh
git add docs/OBSIDIAN_SYNC_GUIDE.md
git add docs/OBSIDIAN_SYNC_TROUBLESHOOTING.md
git add .github/workflows/sync-obsidian.yml
git add package.json
git add blog/life/完整功能测试* img/blog/life/完整功能测试*
```

- [ ] **Step 3: 创建提交**

```bash
git commit -m "feat: 完成 Obsidian 与 GitHub 个人主页完整同步功能

- 完善图片同步机制，支持多种图片路径格式
- 创建自动化同步脚本和 npm 脚本
- 添加 GitHub Actions 自动同步工作流
- 创建完整的用户文档和故障排除指南
- 创建快速设置脚本
- 通过完整功能测试验证所有功能

使用方法：
1. 在 obsidian-vault/ 目录创建笔记
2. 图片放在 obsidian-vault/attachments/
3. 运行: npm run sync:obsidian
4. 提交: git add blog/ img/blog/ && git commit -m '同步' && git push"
```

- [ ] **Step 4: 推送到 GitHub**

```bash
git push
```

---

## 验证清单

- [ ] 图片从 Obsidian 正确同步到 GitHub
- [ ] 图片在网页上能正常显示
- [ ] 自动化同步脚本工作正常
- [ ] npm 脚本可用
- [ ] GitHub Actions 工作流配置正确
- [ ] 图片路径处理支持多种格式
- [ ] 用户文档完整清晰
- [ ] 故障排除指南覆盖常见问题
- [ ] 快速设置脚本可正常工作
- [ ] 完整功能测试通过
- [ ] 所有文件已提交到 GitHub

---

## 使用方法（最终用户）

### 快速开始

1. **设置环境**
```bash
./scripts/setup-obsidian-sync.sh
```

2. **在 Obsidian 中创建文章**
```markdown
---
title: "我的文章"
date: 2026-04-10
category: life
status: published
tags: [标签1, 标签2]
---

文章内容...

![图片](./attachments/图片.jpg)
```

3. **同步到 GitHub**
```bash
npm run sync:obsidian
```

4. **提交更改**
```bash
git add blog/ img/blog/
git commit -m "添加新文章"
git push
```

5. **查看效果**
访问 `https://xie-l.github.io/blog/life/我的文章（202604）.html`

### 常用命令

```bash
# 同步所有 Obsidian 文件
npm run sync:obsidian

# 同步单个文件
node scripts/obsidian-sync.js --direction obsidian-to-blog --file "生活日记/文章.md"

# 预览同步（dry-run）
npm run sync:obsidian:dry-run

# 查看日志
tail -f logs/obsidian-sync.log
```

---

## 相关文档

- 使用指南：`docs/OBSIDIAN_SYNC_GUIDE.md`
- 故障排除：`docs/OBSIDIAN_SYNC_TROUBLESHOOTING.md`
- 本计划：`docs/superpowers/plans/2026-04-10-complete-obsidian-sync.md`
