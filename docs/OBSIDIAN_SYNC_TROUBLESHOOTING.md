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
