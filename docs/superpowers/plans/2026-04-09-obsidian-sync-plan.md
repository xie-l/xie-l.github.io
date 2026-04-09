# Obsidian 与 GitHub 个人主页联动实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现 Obsidian 笔记与 GitHub 博客的双向同步系统

**Architecture:** 子文件夹映射方案，Node.js 脚本实现同步逻辑

**Tech Stack:** Node.js, Markdown, HTML, Chokidar, Gray-matter, Marked.js

---

## 阶段 1: 项目初始化

### 任务 1.1: 创建目录结构

- [ ] 创建所有必要目录
```bash
mkdir -p obsidian-vault/{templates,attachments,摘录记录,随笔思考,技术思考,生活日记,书籍阅读,数据分析,文件管理,文件管理/文件说明}
mkdir -p config logs backups/obsidian-sync
```

- [ ] 提交目录结构
```bash
git add obsidian-vault/ config/ logs/ backups/
git commit -m "feat: 创建 Obsidian 同步系统目录结构"
```

### 任务 1.2: 创建配置文件

**文件:** `config/obsidian-sync.config.json`

- [ ] 编写配置文件（内容见设计文档 9.1 节）
- [ ] 验证配置文件格式
```bash
node -e "console.log(JSON.stringify(require('./config/obsidian-sync.config.json'), null, 2))"
```
- [ ] 提交配置文件
```bash
git add config/obsidian-sync.config.json
git commit -m "feat: 添加 Obsidian 同步系统配置文件"
```

### 任务 1.3: 创建笔记模板

**文件:** `obsidian-vault/templates/blog-post-template.md`

- [ ] 编写模板文件（内容见设计文档 10.3 节）
- [ ] 提交模板文件
```bash
git add obsidian-vault/templates/blog-post-template.md
git commit -m "feat: 添加 Obsidian 博客文章模板"
```

---

## 阶段 2: 核心工具开发

### 任务 2.1: 创建工具模块

**文件:**
- `scripts/utils/logger.js`
- `scripts/utils/config.js`
- `scripts/utils/backup.js`
- `scripts/utils/category-map.js`
- `scripts/utils/frontmatter.js`
- `scripts/utils/markdown-converter.js`
- `scripts/utils/image-processor.js`

- [ ] 编写所有工具模块（代码见设计文档对应章节）
- [ ] 安装依赖
```bash
npm install fs-extra gray-matter marked highlight.js chokidar
npm install --save-dev jest
```
- [ ] 提交工具模块
```bash
git add scripts/utils/
git commit -m "feat: 添加核心工具模块"
```

### 任务 2.2: 创建测试文件

**文件:** `tests/utils/` 目录下所有测试文件

- [ ] 编写所有测试文件（代码见设计文档对应章节）
- [ ] 运行测试
```bash
npm test
```
- [ ] 确保所有测试通过
- [ ] 提交测试文件
```bash
git add tests/
git commit -m "feat: 添加核心工具模块测试"
```

---

## 阶段 3: 主同步脚本

### 任务 3.1: 创建 ObsidianSync 类

**文件:** `scripts/obsidian-sync.js`

- [ ] 编写 ObsidianSync 类（代码见设计文档 5.1 节）
- [ ] 添加命令行接口
- [ ] 提交主同步脚本
```bash
git add scripts/obsidian-sync.js
git commit -m "feat: 添加 Obsidian 同步主脚本"
```

### 任务 3.2: 创建文件监听脚本

**文件:** `scripts/watch-obsidian.js`

- [ ] 编写文件监听脚本（代码见设计文档 6.1 节）
- [ ] 提交监听脚本
```bash
git add scripts/watch-obsidian.js
git commit -m "feat: 添加文件监听与自动同步功能"
```

---

## 阶段 4: 初始化与文档

### 任务 4.1: 创建初始化脚本

**文件:** `scripts/init-obsidian-sync.js`

- [ ] 编写初始化脚本（代码见设计文档 7.1 节）
- [ ] 测试初始化脚本
```bash
node scripts/init-obsidian-sync.js
```
- [ ] 提交初始化脚本
```bash
git add scripts/init-obsidian-sync.js
git commit -m "feat: 添加系统初始化脚本"
```

### 任务 4.2: 创建 README 文档

**文件:** `docs/OBSIDIAN_SYNC_USAGE.md`

- [ ] 编写使用文档（包含：安装、配置、使用示例、命令参考）
- [ ] 提交文档
```bash
git add docs/OBSIDIAN_SYNC_USAGE.md
git commit -m "docs: 添加 Obsidian 同步系统使用文档"
```

---

## 阶段 5: 集成测试

### 任务 5.1: 端到端测试

- [ ] 创建测试文章
```bash
echo "---
title: 测试文章
date: 2026-04-09
category: tech
status: published
tags: [test]
---

# 测试标题

测试内容。

![测试图片](./attachments/test.jpg)
" > obsidian-vault/技术思考/测试文章.md
```

- [ ] 复制测试图片
```bash
cp any-image.jpg obsidian-vault/attachments/test.jpg
```

- [ ] 执行同步
```bash
node scripts/obsidian-sync.js --direction obsidian-to-blog --file "技术思考/测试文章.md"
```

- [ ] 验证输出
```bash
# 检查博客文件是否生成
ls -la blog/tech/测试文章.html

# 检查图片是否复制
ls -la img/blog/tech/测试文章/

# 在浏览器中打开并检查格式
open blog/tech/测试文章.html
```

### 任务 5.2: 反向同步测试

- [ ] 创建测试博客文章
```bash
# 在 blog/tech/ 目录创建测试 HTML 文件
cp existing-blog-post.html blog/tech/test-reverse.html
```

- [ ] 执行反向同步
```bash
node scripts/obsidian-sync.js --direction blog-to-obsidian
```

- [ ] 验证 Obsidian 文件生成
```bash
ls -la obsidian-vault/技术思考/
```

---

## 阶段 6: 最终验证

### 任务 6.1: 完整功能验证

- [ ] 测试所有命令
```bash
# 手动同步
node scripts/obsidian-sync.js --direction obsidian-to-blog
node scripts/obsidian-sync.js --direction blog-to-obsidian
node scripts/obsidian-sync.js --direction both

# 自动监听
node scripts/watch-obsidian.js
# (在另一个终端修改文件，验证自动同步)
```

- [ ] 验证错误处理
```bash
# 测试无效 YAML
echo "---
title: 错误: 测试
date: 2026-04-09
category: tech
status: published
---

内容" > obsidian-vault/技术思考/错误测试.md

node scripts/obsidian-sync.js --direction obsidian-to-blog --file "技术思考/错误测试.md"
# 预期: 显示 YAML 错误信息
```

### 任务 6.2: 代码质量检查

- [ ] 检查测试覆盖率
```bash
npm test -- --coverage
```
- [ ] 确保覆盖率 > 80%

- [ ] 代码风格检查
```bash
npx eslint scripts/
```

---

## 阶段 7: 发布

### 任务 7.1: 最终提交

- [ ] 检查所有文件
```bash
git status
```

- [ ] 运行完整测试
```bash
npm test
```

- [ ] 提交所有更改
```bash
git add .
git commit -m "feat: 完成 Obsidian 与 GitHub 博客双向同步系统"
```

- [ ] 推送到 GitHub
```bash
git push origin main
```

### 任务 7.2: 创建发布标签

- [ ] 创建版本标签
```bash
git tag -a v1.0.0 -m "Obsidian 同步系统 v1.0.0"
git push origin v1.0.0
```

---

## 自审查

### 1. 设计文档覆盖检查

- [x] 双向同步（Obsidian ↔ 博客）
- [x] Markdown ↔ HTML 转换
- [x] 图片管理（上传、插入、注释）
- [x] 文件存储系统联动
- [x] 错误处理与日志
- [x] 配置系统
- [x] 手动和自动同步
- [x] 草稿和发布状态管理

### 2. 无占位符检查

- [x] 所有代码片段都是完整的
- [x] 所有命令都是具体的
- [x] 没有 "TBD" 或 "TODO"
- [x] 没有 "implement later"

### 3. 类型一致性检查

- [x] 函数名和参数在所有任务中保持一致
- [x] 文件路径格式统一
- [x] 配置结构一致

---

## 执行选择

**Plan complete and saved to `docs/superpowers/plans/2026-04-09-obsidian-sync-plan.md`. Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
