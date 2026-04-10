# Obsidian 图片插入指南

## ✅ 正确的图片插入方式

### 方法 1：标准 Markdown（推荐）

1. 将图片文件放入 `obsidian-vault/attachments/` 文件夹
2. 在笔记中使用：
   ```markdown
   ![图片描述](./attachments/图片文件名.jpg)
   ```

### 方法 2：Obsidian 嵌入语法

1. 将图片放入 `obsidian-vault/attachments/` 文件夹
2. 在笔记中使用：
   ```markdown
   ![[图片文件名.jpg]]
   ```

## ❌ 错误的图片插入方式

### 错误示例 1：相对路径

```markdown
![描述](图片.jpg)  ❌ 缺少 ./attachments/ 前缀
```

**错误信息**：
```
⚠️  发现 1 张图片未使用 ./attachments/ 路径
提示：请将图片放在 obsidian-vault/attachments/ 文件夹，并使用 ![描述](./attachments/图片.jpg) 格式
```

### 错误示例 2：绝对路径

```markdown
![描述](/Users/xxx/图片.jpg)  ❌ 不应该使用绝对路径
```

## 📁 文件组织建议

```
obsidian-vault/
├── attachments/              ← 所有图片放在这里
│   ├── 文章1/
│   │   ├── image1.jpg
│   │   └── image2.png
│   └── 文章2/
│       └── screenshot.png
├── 技术思考/
│   └── 我的文章.md         ← 引用图片时使用 ./attachments/文章1/image1.jpg
└── ...
```

## 🔄 同步时的图片处理

当你运行同步命令时：

```bash
node scripts/obsidian-sync.js --direction obsidian-to-blog --file "技术思考/我的文章.md"
```

系统会自动：

1. **扫描** 笔记中的图片链接（`![](./attachments/图片.jpg)`）
2. **复制** 图片到 `img/blog/tech/文章标题/` 目录
3. **更新** HTML 中的图片路径为 `../../img/blog/tech/文章标题/图片.jpg`
4. **生成** 带图片的博客文章

## 💡 最佳实践

### 1. 每个文章使用独立文件夹

```bash
# 创建文章专用图片文件夹
mkdir obsidian-vault/attachments/我的文章

# 将图片放入该文件夹
cp image1.jpg obsidian-vault/attachments/我的文章/
cp image2.png obsidian-vault/attachments/我的文章/
```

然后在笔记中：
```markdown
![图1](./attachments/我的文章/image1.jpg)
![图2](./attachments/我的文章/image2.png)
```

### 2. 图片命名规范

- 使用有意义的文件名：`login-screen.png` ✅
- 避免空格，使用连字符：`my-image.jpg` ✅

### 3. 控制图片大小

- 单张图片建议 < 2MB
- 在配置中启用图片压缩：
  ```json
  {
    "images": {
      "compress": true,
      "compressionQuality": 80
    }
  }
  ```

## 🔧 配置检查

**config/obsidian-sync.config.json**
```json
{
  "obsidian": {
    "vaultPath": "./obsidian-vault",
    "attachmentsPath": "./obsidian-vault/attachments"
  }
}
```

**Obsidian 设置**
- **附件文件夹路径**: `attachments`
- **新附件的默认位置**: "当前文件夹下的指定子文件夹"
- **子文件夹名称**: `attachments`

## 📝 示例

### Obsidian 笔记

```markdown
---
title: 我的技术文章
date: 2026-04-10
category: tech
status: published
tags: [JavaScript, Web]
description: 这是一篇关于技术的文章
---

# 我的技术文章

这是正文内容。

## 截图示例

![登录界面](./attachments/技术文章/login-screen.png)

![数据流程图](./attachments/技术文章/data-flow.png)
```

### 同步后

图片会被复制到：`img/blog/tech/我的技术文章/`

HTML 中的图片路径：`../../img/blog/tech/我的技术文章/login-screen.png`

## 🎉 总结

记住三个关键点：

1. **图片位置**: `obsidian-vault/attachments/`
2. **引用格式**: `![](./attachments/文件名.jpg)`
3. **同步命令**: `node scripts/obsidian-sync.js --direction obsidian-to-blog`

现在可以开始愉快地在 Obsidian 中写作了！
