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
