# 同步问题分析与解决方案

## 问题 1：新文件未同步

### 现象
创建了 `今日小结（2026.04.10）.md`，但运行同步后在 blog 中没有看到。

### 根本原因
文件格式不正确：
```markdown
<!-- 错误格式 -->

---
status: published
title: 今日小结（2026.04.10）
...
---
```

文件开头有多余的空行，导致 Front Matter 解析失败。

### 解决方案
确保文件以 `---` 开头，没有多余的空行：

```markdown
---
status: published
title: 今日小结（2026.04.10）
date: 2026-04-11
category: life
tags: [日小结, 记录]
---

### 日有所成
...
```

修复后，同步成功：
```
同步完成: 生活日记/今日小结（2026.04.10）.md -> blog/life/今日小结（2026.04.10）（202604）.html
```

## 问题 2：双向同步冲突

### 现象
运行 `node scripts/obsidian-sync.js --direction both` 后，显示检测到 10 个冲突：
```
- blog/life/20260404-05（2026.04）.html: target_is_newer
- blog/life/今日小结（2026.04.04-05）（202604）.html: target_is_newer
...
```

### 根本原因
`target_is_newer` 表示：**目标文件（MD）比源文件（HTML）新**

这是系统的智能保护机制，避免覆盖较新的文件。

### 具体数据
```
示例：规划认识（2026.04）
├─ HTML (源): 4/7/2026, 12:39:38 PM (旧)
└─ MD (目标): 4/11/2026, 8:44:00 AM (新)
               └─ 跳过同步，避免覆盖较新的 MD 文件
```

### 这是错误吗？
**不是！这是预期的行为。**

这些"冲突"实际上是系统的**智能保护机制**：
- ✅ 避免数据丢失：防止较新的 MD 文件被旧的 HTML 文件覆盖
- ✅ 双向编辑安全：你可以在 Obsidian 和 Blog 两边分别编辑
- ✅ 自动解决：系统会自动选择最新的版本，无需手动干预

### 如何处理？

**方案 1：忽略（推荐）**
- 什么都不用做
- 最新的文件（MD 版本）已经保留在 Obsidian 中
- 索引已正确更新
- 博客展示正常

**方案 2：强制覆盖（如果你确定要覆盖）**
```bash
# 删除 MD 文件，重新从 HTML 同步
rm "/Users/liang/Documents/GitHub/xie-l.github.io/obsidian-vault/生活日记/规划认识（2026.04）.md"
node scripts/obsidian-sync.js --direction blog-to-obsidian
```

## 问题 3：同步重写所有文件

### 现象
用户担心："同步到 GitHub 上就得全部都更新文件"

### 实际情况
系统已经实现了智能同步：

1. **文件级别**：比较时间戳，只同步更新的文件
   ```javascript
   const timeCompare = await isSourceNewer(fullPath, targetPath);
   if (!timeCompare.isNewer) {
     // 跳过同步
     return { skipped: true, reason: 'target_is_newer' };
   }
   ```

2. **索引级别**：重新生成整个分类索引
   - 索引文件（index.html）会在每次同步时重新生成
   - 这是导致 GitHub 显示修改的主要原因

### 优化建议

#### 1. 避免不必要的索引更新

修改 `scripts/obsidian-sync.js`，只在有实际文件变化时更新索引：

```javascript
// 修改前：每次同步都更新索引
const result = await updateCategoryIndex(...);

// 修改后：只在文件实际同步时更新索引
if (!skipped) {
  const result = await updateCategoryIndex(...);
}
```

#### 2. 增量更新索引

修改 `scripts/utils/category-index.js`，实现增量更新而不是全量重写：

```javascript
// 当前：重新生成整个索引
async function regenerateCategoryIndex(blogPath, category) {
  // ... 读取所有文件，重新生成
}

// 优化：只添加新文件或更新现有文件
async function updateCategoryIndex(blogPath, category, filename, title, tagList, raw, source) {
  if (!filename) {
    // 只在需要时重新生成
    return await regenerateCategoryIndex(blogPath, category);
  }
  // ... 只更新单个文件
}
```

## 后续操作建议

### 1. 创建新文件时

确保 Front Matter 格式正确：
```markdown
---
status: published
title: 文章标题
date: YYYY-MM-DD
category: life  # 或 tech, books, analysis, quotes, thoughts
tags: [标签1, 标签2]
---

文章内容...
```

### 2. 日常同步

**推荐方式**：
```bash
# 单向同步（避免冲突）
node scripts/obsidian-sync.js --direction obsidian-to-blog  # 只在 Obsidian 编辑
# 或
node scripts/obsidian-sync.js --direction blog-to-obsidian  # 只在 Blog 编辑
```

**双向同步（接受冲突）**：
```bash
node scripts/obsidian-sync.js --direction both
# 查看冲突日志
grep "跳过同步" logs/obsidian-sync-*.log
```

### 3. 处理冲突

查看冲突详情：
```bash
node scripts/obsidian-sync.js --direction both 2>&1 | grep "跳过同步"
```

输出示例：
```
[INFO] 目标文件已是最新，跳过同步: 规划认识（2026.04）.md 
      (目标: 4/11/2026, 8:44:00 AM, 源: 4/7/2026, 12:39:38 PM)
```

### 4. Git 提交建议

**只提交实际修改的文件**：
```bash
# 查看哪些文件被修改
git status

# 如果只有 index.html 被修改，可以选择不提交
# 或者使用 git add -p 选择性地提交
```

**使用 .gitignore 忽略索引文件**（不推荐，因为索引是博客展示的关键）：
```
# 在 .gitignore 中添加
blog/*/index.html
```

## 总结

1. ✅ **新文件同步**：确保 Front Matter 格式正确（以 `---` 开头，无多余空行）
2. ✅ **冲突问题**：`target_is_newer` 是正常保护机制，无需处理
3. ✅ **文件重写**：系统已智能比较时间戳，只同步更新的文件
4. ✅ **索引更新**：索引文件会重新生成，这是正常的

**关键要点**：
- 冲突不是错误，是保护机制
- 文件格式很重要，Front Matter 必须正确
- 信任系统的时间戳比较逻辑
- 索引更新是必要的，不要试图完全避免
