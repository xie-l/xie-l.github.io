# Obsidian 同步重复文件问题处理

## 问题说明

在 Obsidian vault 中，同一文件出现在多个分类目录中，导致同步到 blog 时也出现重复。

### 根本原因

文件在 Obsidian 中被手动复制到多个目录，但 frontmatter 中的 `category` 字段未相应修改。同步脚本根据**文件所在目录**决定 blog 分类，因此同一文件会出现在多个 blog 分类中。

**示例：**
```
obsidian-vault/书籍阅读/文章.md (category: books) → blog/books/文章.html
obsidian-vault/生活日记/文章.md (category: life) → blog/life/文章.html
```

## 检测重复文件

使用检测脚本扫描 Obsidian vault 中的重复文件：

```bash
node scripts/check-duplicates.js
```

输出示例：
```
🔍 扫描Obsidian vault中的重复文件...

⚠️  发现 12 个重复文件:

📄 《当下的力量》：一个焦虑型学者的止战手册.md
   📂 出现在: 生活日记, 书籍阅读

📄 《认知觉醒》：一个博士生的自我重启手册.md
   📂 出现在: 生活日记, 书籍阅读

💡 建议: 删除重复文件，只保留在正确分类中的版本
```

## 清理重复文件

### 方法1：使用清理脚本（推荐）

清理脚本会自动删除重复文件并重新生成索引：

```bash
# 先试运行（查看将要删除的文件）
node scripts/clean-duplicates.js

# 确认无误后，执行实际清理
node scripts/clean-duplicates.js --apply
```

**脚本功能：**
- ✅ 自动识别重复文件
- ✅ 根据预定义规则确定正确分类
- ✅ 删除错误分类中的文件（Obsidian 和 blog）
- ✅ 重新生成受影响的索引

### 方法2：手动清理

如果清理脚本的预定义规则不符合你的需求，可以手动清理：

```bash
# 1. 删除 Obsidian vault 中的重复文件
rm "obsidian-vault/生活日记/文章.md"

# 2. 删除 blog 中的重复文件
rm "blog/life/文章.html"

# 3. 重新生成索引
node -e "
const { updateCategoryIndex } = require('./scripts/utils/category-index');
updateCategoryIndex('./blog', 'life', null, null, [], '', '');
"
```

## 预防重复文件

### 1. 移动文件时修改 category

在 Obsidian 中移动文件到不同目录时，**务必同时修改 frontmatter 中的 category 字段**：

```markdown
---
status: published
title: 文章标题
date: 2026-04-05
category: books  # ← 必须与所在目录匹配
---
```

**匹配规则：**

| Obsidian 目录 | category 字段 |
|--------------|--------------|
| 摘录记录/ | category: quotes |
| 随笔思考/ | category: thoughts |
| 技术思考/ | category: tech |
| 生活日记/ | category: life |
| 书籍阅读/ | **category: books** |
| 数据分析/ | category: analysis |

### 2. 在 Git 工作流中添加检查

修改 `.github/workflows/sync-obsidian.yml`，在同步前检查重复文件：

```yaml
- name: Check for duplicate files
  run: node scripts/check-duplicates.js

- name: Sync Obsidian to Blog
  run: node scripts/obsidian-sync.js --direction both
```

### 3. 定期运行检测

建议定期（如每周）运行检测脚本：

```bash
# 添加到定时任务（cron）
0 9 * * 0 cd /path/to/your/blog && node scripts/check-duplicates.js
```

## 同步脚本的分类映射

同步脚本的分类映射是完全正确的：

```javascript
// scripts/utils/category-map.js
const categoryMap = {
  '摘录记录': 'quotes',
  '随笔思考': 'thoughts',
  '技术思考': 'tech',
  '生活日记': 'life',      // ← 正确
  '书籍阅读': 'books',     // ← 正确
  '数据分析': 'analysis'
};
```

同步逻辑：
```javascript
// scripts/obsidian-sync.js:101
const blogCategory = getBlogCategory(path.dirname(filePath));
// 根据文件所在目录名映射到 blog 分类
```

**重要**：同步脚本根据**文件所在目录**决定 blog 分类，而不是 frontmatter 中的 category 字段。确保文件在正确的目录中，分类就不会出错。

## 常见问题

### Q: 为什么同步脚本不使用 frontmatter 中的 category 字段？

A: 文件所在的目录是文件的实际位置，是单一真相来源。frontmatter 中的 category 应该与目录匹配，但可能因手动复制而失效。使用目录作为分类依据更可靠。

### Q: 我可以手动修改 blog 中的文件吗？

A: 不建议手动修改 blog 目录中的文件，因为这些文件是由同步脚本自动生成的。下次同步时，手动修改可能会被覆盖。

### Q: 如果我想更改文章的分类怎么办？

A: 正确的做法是：
1. 在 Obsidian 中将文件移动到目标分类目录
2. 修改文件的 frontmatter，更新 category 字段
3. 运行同步脚本

### Q: 清理脚本如何确定哪个是正确分类？

A: 清理脚本使用预定义的 `CORRECT_CATEGORIES` 映射。如果某个文件的分类判断不符合你的需求，可以：
1. 手动清理文件
2. 修改脚本中的 `CORRECT_CATEGORIES` 映射
3. 提交 issue 请求更新映射规则

## 相关文件

- 检测脚本：`scripts/check-duplicates.js`
- 清理脚本：`scripts/clean-duplicates.js`
- 分类映射：`scripts/utils/category-map.js`
- 同步脚本：`scripts/obsidian-sync.js`
- 索引更新：`scripts/utils/category-index.js`

## 总结

1. ✅ **同步脚本工作正常**，分类映射逻辑正确
2. ⚠️ **问题根源**：Obsidian 中手动复制文件导致重复
3. ✅ **已创建检测工具**：`check-duplicates.js`
4. ✅ **已创建清理工具**：`clean-duplicates.js`
5. ✅ **已清理示例文件**：《当下的力量》已从 life 分类移除

**关键点**：保持文件在正确的 Obsidian 目录中，frontmatter 中的 category 与目录匹配，就不会出现分类错误。
