# Obsidian 同步系统使用指南

## 快速开始

### 1. 初始化系统

```bash
node scripts/init-obsidian-sync.js
```

这将创建所有必要的目录和配置文件。

### 2. 在 Obsidian 中写作

在 `obsidian-vault/` 目录下的对应分类中创建笔记：
- `摘录记录/` - 摘录、引用
- `随笔思考/` - 随笔、思考
- `技术思考/` - 技术文章
- `生活日记/` - 生活记录
- `书籍阅读/` - 读书笔记
- `数据分析/` - 数据分析

### 3. 发布到博客

在 Obsidian 中编辑文章，设置 front matter：

```yaml
---
title: 文章标题
date: 2026-04-09
category: tech          # 选择分类
status: published       # 设置为 published 才会发布
tags: [JavaScript, Web]
description: 文章摘要
---
```

然后运行同步命令：

```bash
# 同步单个文件
node scripts/obsidian-sync.js --direction obsidian-to-blog --file "技术思考/我的文章.md"

# 同步所有文件
node scripts/obsidian-sync.js --direction obsidian-to-blog
```

### 4. 自动同步（开发时）

启动文件监听，自动同步：

```bash
node scripts/watch-obsidian.js
```

每次保存文件时，会自动触发同步。

## 命令参考

### 同步命令

```bash
# Obsidian → 博客
node scripts/obsidian-sync.js --direction obsidian-to-blog

# 博客 → Obsidian（反向同步）
node scripts/obsidian-sync.js --direction blog-to-obsidian

# 双向同步
node scripts/obsidian-sync.js --direction both

# 预览模式（不实际写入）
node scripts/obsidian-sync.js --direction obsidian-to-blog --dry-run
```

### 文件管理

```bash
# 上传文件到文件管理系统
node scripts/file-manager.js --action upload

# 生成文件索引
node scripts/file-manager.js --action index
```

## 配置说明

配置文件：`config/obsidian-sync.config.json`

主要配置项：

- **obsidian.vaultPath** - Obsidian 仓库路径
- **blog.blogPath** - 博客文章路径
- **sync.autoBackup** - 是否自动备份（建议保持 true）
- **images.maxSize** - 图片大小限制（默认 5MB）
- **logging.level** - 日志级别（info/warn/error/debug）

## 图片管理

在 Obsidian 中插入图片：

```markdown
![图片描述](./attachments/my-article/image.png)
```

同步时会自动：
1. 复制图片到 `img/blog/{category}/{slug}/`
2. 更新 HTML 中的图片路径
3. 支持图片压缩和懒加载

## 故障排除

### 同步失败，提示 "YAML front matter 格式错误"

检查：
1. YAML 必须以 `---` 开始和结束
2. 冒号后面必须有空格（`key: value`）
3. 如果值包含冒号，使用引号包裹

### 图片无法显示

检查：
1. 图片是否在 `attachments/` 目录
2. 同步后是否复制到 `img/blog/` 目录
3. 检查浏览器控制台的网络请求

## 最佳实践

1. **定期提交到 Git**：每次同步后运行 `git add . && git commit -m "更新文章"`
2. **使用草稿状态**：写作时设置 `status: draft`，完成后改为 `published`
3. **图片优化**：控制图片大小（建议单张 < 2MB）
4. **标签管理**：使用有意义的标签，便于分类和搜索

## 进阶功能

### 自动压缩图片

在配置文件中设置：

```json
{
  "images": {
    "compress": true,
    "compressionQuality": 80
  }
}
```

### 图片点击放大

启用 Lightbox：

```json
{
  "images": {
    "lightbox": true
  }
}
```

### 懒加载

提升页面加载速度：

```json
{
  "images": {
    "lazyLoad": true
  }
}
```

## 支持

如有问题，请查看日志文件：`logs/obsidian-sync.log`
