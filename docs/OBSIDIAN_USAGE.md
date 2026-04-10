# Obsidian 使用完全指南

## 📂 目录结构

```
xie-l.github.io/
└── obsidian-vault/          ← 在 Obsidian 中打开这个文件夹
    ├── .obsidian/           # Obsidian 配置（自动生成）
    ├── templates/           # 笔记模板
    │   └── blog-post-template.md
    ├── attachments/         # 图片附件
    │   └── 今日小结/
    │       └── 冬虫夏草鉴别会.jpg
    ├── 摘录记录/            # 摘录、引用
    ├── 随笔思考/            # 随笔、思考
    ├── 技术思考/            # 技术文章
    ├── 生活日记/            # 生活记录 ← 你的文章在这里
    ├── 书籍阅读/            # 读书笔记
    ├── 数据分析/            # 数据分析
    └── 文件管理/            # 文件管理笔记
```

## 📝 写作流程

### 1. 在 Obsidian 中打开仓库

- 打开 Obsidian
- 点击"打开文件夹"
- 选择 `xie-l.github.io/obsidian-vault/`

### 2. 创建新文章

**方法 A：使用文件夹模板（推荐）**

1. 在左侧文件树中，右键点击目标文件夹（如"生活日记"）
2. 选择"新建笔记"
3. 自动应用模板，包含：

```yaml
---
title: 新笔记
date: 2026-04-10
category: life
status: draft
tags: []
description: 
---

# 新笔记

<% tp.file.cursor() %>
```

**方法 B：手动创建**

1. 点击"新建笔记"按钮
2. 手动添加 front matter

### 3. 插入图片（关键步骤）

#### ✅ 正确方式

**步骤 1：准备图片**

```bash
# 创建文章专用图片文件夹
mkdir obsidian-vault/attachments/我的文章

# 将图片放入该文件夹
cp 图片.jpg obsidian-vault/attachments/我的文章/
```

**步骤 2：在笔记中引用**

```markdown
# 方式 1：标准 Markdown（推荐）
![图片描述](./attachments/我的文章/图片.jpg)

# 方式 2：Obsidian 嵌入语法
![[图片.jpg]]

# 方式 3：带尺寸
![[图片.jpg|500]]
```

**示例**：
```markdown
---
title: 今日小结（2026.04.09）
date: 2026-04-10
category: life
status: draft
tags: [日小结, 记录]
description: 
---

# 今日小结（2026.04.09）

今天参加了冬虫夏草鉴别会。

![冬虫夏草鉴别会](./attachments/今日小结/冬虫夏草鉴别会.jpg)

会议内容很有收获。
```

#### ❌ 错误方式

```markdown
# 错误 1：缺少 ./attachments/ 前缀
![描述](图片.jpg)

# 错误 2：绝对路径
![描述](/Users/xxx/图片.jpg)

# 错误 3：只有文件名
![描述](冬虫夏草鉴别会.jpg)
```

### 4. 设置发布状态

**写作阶段**：
```yaml
status: draft  # 不会发布到博客
```

**发布阶段**：
```yaml
status: published  # 会发布到博客
```

### 5. 同步到博客

```bash
# 同步单个文件
node scripts/obsidian-sync.js --direction obsidian-to-blog \
  --file "生活日记/今日小结（2026.04.09）.md"

# 同步所有文件
node scripts/obsidian-sync.js --direction obsidian-to-blog

# 预览模式（不实际写入）
node scripts/obsidian-sync.js --direction obsidian-to-blog \
  --file "生活日记/今日小结（2026.04.09）.md" --dry-run
```

**预期输出**：
```
开始同步: obsidian-to-blog
✓ 复制图片: 冬虫夏草鉴别会.jpg
同步完成: 生活日记/今日小结（2026.04.09）.md -> blog/life/今日小结-2026-04-09.html
同步完成
```

### 6. 自动同步（开发时）

```bash
node scripts/watch-obsidian.js
```

- 保持终端运行
- 每次保存文件自动同步
- 修改 `status: published` 后自动发布

## 📊 查看结果

### 生成的文件

```bash
# 博客文章
ls -la blog/life/今日小结-2026-04-09.html

# 图片文件
ls -la img/blog/life/今日小结-2026-04-09/
# 输出: 冬虫夏草鉴别会.jpg
```

### 在浏览器中查看

```bash
# 启动本地服务器
python -m http.server 8000

# 访问
open http://localhost:8000/blog/life/今日小结-2026-04-09.html
```

## 🎯 分类对应

| Obsidian 文件夹 | 博客分类 | URL 路径 |
|----------------|---------|---------|
| 摘录记录 | quotes | /blog/quotes/ |
| 随笔思考 | thoughts | /blog/thoughts/ |
| 技术思考 | tech | /blog/tech/ |
| 生活日记 | life | /blog/life/ |
| 书籍阅读 | books | /blog/books/ |
| 数据分析 | analysis | /blog/analysis/ |

## 🔧 配置检查

### Obsidian 设置

1. **附件文件夹路径**
   - 设置 → 文件与链接 → 附件文件夹路径
   - 值: `attachments`

2. **新附件的默认位置**
   - 设置 → 文件与链接 → 新附件的默认位置
   - 选择: "当前文件夹下的指定子文件夹"
   - 子文件夹名称: `attachments`

3. **Templater 插件配置**
   - Template folder location: `templates`
   - Trigger Templater on new file creation: ✅ 开启
   - Enable folder templates: ✅ 开启
   - 为每个分类文件夹添加规则

### 配置文件

**config/obsidian-sync.config.json**

```json
{
  "obsidian": {
    "vaultPath": "./obsidian-vault",
    "attachmentsPath": "./obsidian-vault/attachments"
  },
  "images": {
    "maxSize": 5242880,
    "compress": false,
    "compressionQuality": 80,
    "supportedFormats": [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"],
    "lazyLoad": true,
    "lightbox": true
  }
}
```

## 🐛 常见问题

### Q1: 同步失败，提示 "YAML front matter 格式错误"

**检查**:
- YAML 必须以 `---` 开始和结束
- 冒号后面必须有空格（`key: value`）
- 日期格式: `2026-04-10`（YYYY-MM-DD）

### Q2: 图片无法显示

**检查**:
1. 图片是否在 `obsidian-vault/attachments/` 目录
2. 路径格式: `![](./attachments/图片.jpg)`
3. 同步后是否生成了 `img/blog/{category}/{slug}/` 目录

### Q3: 文章没有发布到博客

**检查**:
- front matter 中 `status: published`（不是 draft）
- 分类是否正确（quotes/thoughts/tech/life/books/analysis）
- 运行同步命令时没有错误

### Q4: 如何批量发布文章

```bash
# 将所有 draft 改为 published
find obsidian-vault/ -name "*.md" -exec sed -i 's/status: draft/status: published/g' {} \;

# 同步所有文章
node scripts/obsidian-sync.js --direction obsidian-to-blog
```

## 💡 最佳实践

### 1. 文章命名

- 使用日期+标题：`2026-04-10-我的技术文章.md`
- 或使用中文标题：`我的技术文章.md`

### 2. 图片组织

```
obsidian-vault/attachments/
├── 今日小结/
│   └── 冬虫夏草鉴别会.jpg
├── 技术文章1/
│   ├── screenshot1.png
│   └── diagram.jpg
└── 技术文章2/
    └── architecture.png
```

### 3. 标签使用

```yaml
tags: [JavaScript, Web开发, 前端]
```

### 4. 描述编写

```yaml
description: 本文介绍了如何使用 Obsidian 管理博客文章，包括图片插入、同步发布等操作
```

## 📚 完整示例

### Obsidian 笔记

`obsidian-vault/技术思考/使用Obsidian管理博客.md`:

```markdown
---
title: 使用Obsidian管理博客
date: 2026-04-10
category: tech
status: published
tags: [Obsidian, GitHub, 博客]
description: 本文详细介绍了如何使用 Obsidian 管理 GitHub 个人主页博客
---

# 使用Obsidian管理博客

## 概述

Obsidian 是一个强大的本地笔记工具，结合 GitHub Pages 可以搭建个人博客系统。

## 主要功能

### 1. 双向同步
支持 Obsidian ↔ GitHub 博客的双向同步。

### 2. 图片管理
自动处理图片上传、路径转换、懒加载。

### 3. 分类管理
支持六种文章分类，自动映射到博客目录。

## 操作步骤

### 步骤1：安装和配置

![配置截图](./attachments/使用Obsidian管理博客/config-screen.png)

### 步骤2：创建文章

在对应分类文件夹中创建笔记。

### 步骤3：插入图片

将图片放入 `attachments/` 文件夹，使用 `![](./attachments/图片.jpg)` 引用。

### 步骤4：同步发布

运行命令：`node scripts/obsidian-sync.js --direction obsidian-to-blog`

## 注意事项

1. 必须填写 YAML front matter
2. status 必须为 published 才会发布
3. 图片路径必须使用 ./attachments/ 前缀

## 总结

Obsidian + GitHub Pages 是一个强大的博客解决方案，支持本地写作、版本控制、自动部署。
```

### 同步后

```bash
# 生成的博客文章
blog/tech/使用Obsidian管理博客.html

# 生成的图片
img/blog/tech/使用Obsidian管理博客/
├── config-screen.png
└── ...
```

## 🎉 总结

记住关键步骤：

1. **打开** `obsidian-vault/` 文件夹
2. **创建** 文章（使用模板）
3. **插入** 图片（`![](./attachments/图片.jpg)`）
4. **设置** `status: published`
5. **同步** `node scripts/obsidian-sync.js --direction obsidian-to-blog`
6. **查看** 生成的博客文章

现在你可以开始使用 Obsidian 管理你的博客了！🎉
