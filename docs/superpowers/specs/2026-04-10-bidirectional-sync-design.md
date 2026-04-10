# 双向同步系统设计文档

## 1. 需求概述

### 1.1 核心目标
实现 Obsidian Vault (Markdown) 与 GitHub Pages Blog (HTML) 之间的双向同步，确保：
- 每个 Markdown 文件在 blog/ 中都有对应的 HTML 文件
- 每个 HTML 文件在 obsidian-vault/ 中都有对应的 Markdown 文件
- 运行单一命令即可实现双向同步
- 不影响任何现有功能和外观

### 1.2 关键原则
- **不破坏现有功能**：所有现有同步、发布、展示功能保持不变
- **外观无变化**：GitHub Pages 的 HTML 输出格式、样式、结构完全不变
- **冲突可解决**：提供明确的冲突检测和解决机制
- **可逆操作**：所有同步操作都可追溯和回滚

## 2. 架构设计

### 2.1 核心组件

```
scripts/obsidian-sync.js (增强)
├── 现有功能：Obsidian → Blog (MD → HTML)
└── 新增功能：Blog → Obsidian (HTML → MD)
    ├── HTML解析器：提取 frontmatter 和正文
    ├── HTML→Markdown 转换器
    ├── 路径映射器：HTML路径 ↔ MD路径
    └── 冲突检测器：时间戳比较
```

### 2.2 文件对应关系（基于文件路径）

```
Obsidian Vault                    GitHub Blog
─────────────────────────────────────────────────────────────
obsidian-vault/                   blog/
├── 生活日记/                     ├── life/
│   ├── 今日小结.md               │   └── 今日小结（202604）.html
│   └── 明日计划.md               │       └── 明日计划（202604）.html
├── 技术思考/                     ├── tech/
│   └── 新技术.md                 │       └── 新技术（202604）.html
├── 摘录记录/                     ├── quotes/
├── 随笔思考/                     ├── thoughts/
├── 书籍阅读/                     ├── books/
└── 数据分析/                     └── analysis/
```

**映射规则**：
- 文件夹映射：生活日记 ↔ life，技术思考 ↔ tech，etc.
- 文件名映射：去除时间戳后缀，保持标题一致
- 分类映射：使用 category-map.js 中的双向映射

### 2.3 同步流程

#### 双向同步主流程

```
1. 扫描阶段
   ├── 扫描 Obsidian Vault 所有 Markdown 文件
   └── 扫描 Blog 所有 HTML 文件

2. 匹配阶段
   ├── 根据路径映射规则建立文件对应关系
   ├── 识别新增文件（仅存在于一边）
   └── 识别冲突文件（两边都存在且都修改过）

3. 冲突检测
   ├── 比较文件最后修改时间戳
   ├── 如果一边更新 → 同步到另一边
   └── 如果两边都更新 → 进入冲突解决

4. 同步执行
   ├── MD → HTML：使用现有转换逻辑
   └── HTML → MD：新增反向转换逻辑

5. 索引更新
   ├── 更新 blog-index.json
   ├── 更新分类索引（index.html）
   └── 更新 RSS 和网站地图
```

## 3. 核心算法

### 3.1 冲突检测算法

```javascript
function detectConflict(mdPath, htmlPath) {
  const mdStat = fs.statSync(mdPath);
  const htmlStat = fs.statSync(htmlPath);
  
  const mdModified = mdStat.mtime.getTime();
  const htmlModified = htmlStat.mtime.getTime();
  
  const timeDiff = Math.abs(mdModified - htmlModified);
  
  // 如果时间差小于1秒，视为同时修改
  if (timeDiff < 1000) {
    return { type: 'simultaneous', resolution: 'timestamp' };
  }
  
  // 否则，时间戳新的获胜
  if (mdModified > htmlModified) {
    return { type: 'md_newer', resolution: 'md_wins' };
  } else {
    return { type: 'html_newer', resolution: 'html_wins' };
  }
}
```

### 3.2 HTML → Markdown 转换

**挑战**：HTML 文件中包含完整的网页结构（DOCTYPE, head, body, 样式等），需要提取正文内容。

**解决方案**：
1. 使用正则表达式提取 `<div class="post-content">` 内的内容
2. 使用正则表达式提取 frontmatter 信息（从 HTML 注释或特定标签）
3. 使用 `turndown` 或类似库将 HTML 转换为 Markdown
4. 重建 frontmatter YAML 块

```javascript
function htmlToMarkdown(htmlContent) {
  // 1. 提取 frontmatter（从 HTML 注释或 meta 标签）
  const frontmatter = extractFrontmatterFromHtml(htmlContent);
  
  // 2. 提取正文内容
  const contentMatch = htmlContent.match(/<div class="post-content">([\s\S]*?)<\/div>/);
  const htmlBody = contentMatch ? contentMatch[1] : '';
  
  // 3. HTML → Markdown 转换
  const markdownBody = convertHtmlToMarkdown(htmlBody);
  
  // 4. 重建 frontmatter
  const frontmatterStr = generateFrontmatter(frontmatter);
  
  return frontmatterStr + '\n\n' + markdownBody;
}
```

## 4. 命令行接口

### 4.1 新增命令

```bash
# 双向同步（主命令）
node scripts/obsidian-sync.js bidirectional

# 或简写
node scripts/obsidian-sync.js bidir

# 参数选项
node scripts/obsidian-sync.js bidirectional --dry-run    # 试运行，不实际修改文件
node scripts/obsidian-sync.js bidirectional --verbose   # 详细输出
node scripts/obsidian-sync.js bidirectional --force     # 强制同步，忽略冲突警告
```

### 4.2 命令输出

```
═══════════════════════════════════════════════════════════════
Obsidian ↔ GitHub 双向同步
═══════════════════════════════════════════════════════════════

扫描文件...
✓ 发现 15 个 Markdown 文件（Obsidian）
✓ 发现 12 个 HTML 文件（GitHub Blog）

匹配文件...
✓ 已匹配 10 对文件
⚠ 发现 2 个仅存在于 Obsidian 的新文件
⚠ 发现 1 个仅存在于 GitHub 的新文件

冲突检测...
✓ 7 对文件无需同步（已最新）
→ 2 对文件将同步：Obsidian → GitHub
→ 1 对文件将同步：GitHub → Obsidian
⚠ 检测到 1 个冲突（两边都有更新）

同步执行...
✓ 同步完成：Obsidian → GitHub（2 个文件）
✓ 同步完成：GitHub → Obsidian（1 个文件）
⚠ 冲突已解决：保留 GitHub 版本（时间戳更新）

更新索引...
✓ 更新 blog-index.json
✓ 更新 life/index.html
✓ 更新 thoughts/index.html
✓ 更新 feed.xml
✓ 更新 sitemap.xml

═══════════════════════════════════════════════════════════════
同步完成！
  已同步：3 个文件
  冲突：1 个（已自动解决）
  跳过：7 个文件（已最新）
═══════════════════════════════════════════════════════════════
```

## 5. 数据存储

### 5.1 同步状态追踪

创建同步状态文件，记录上次同步信息：

```json
// data/sync-state.json
{
  "lastSync": "2026-04-10T15:30:00.000Z",
  "syncedFiles": [
    {
      "mdPath": "obsidian-vault/生活日记/今日小结.md",
      "htmlPath": "blog/life/今日小结（202604）.html",
      "lastSyncTime": "2026-04-10T15:30:00.000Z",
      "mdModified": "2026-04-10T14:20:00.000Z",
      "htmlModified": "2026-04-10T15:25:00.000Z"
    }
  ],
  "conflicts": []
}
```

### 5.2 冲突备份

当检测到冲突时，备份旧版本：

```
backups/
└── sync-conflicts/
    └── 2026-04-10T153000/
        ├── obsidian-vault/
        │   └── 生活日记/
        │       └── 今日小结.md.2026-04-10T153000.bak
        └── blog/
            └── life/
                └── 今日小结（202604）.html.2026-04-10T153000.bak
```

## 6. 错误处理

### 6.1 错误类型

1. **文件读取错误**：文件不存在或无法读取
   - 处理：记录错误，继续同步其他文件

2. **Frontmatter 解析错误**：YAML 格式错误
   - 处理：跳过该文件，记录错误日志

3. **HTML 解析错误**：无法提取正文或元数据
   - 处理：跳过反向同步，保留 MD 版本

4. **转换错误**：Markdown↔HTML 转换失败
   - 处理：使用备用转换器，记录警告

5. **冲突无法自动解决**：时间戳相同但内容不同
   - 处理：备份两个版本，生成冲突报告

### 6.2 错误恢复

```javascript
try {
  await syncFilePair(mdPath, htmlPath);
} catch (error) {
  logger.error(`同步失败: ${mdPath} ↔ ${htmlPath}`);
  logger.error(`错误信息: ${error.message}`);
  
  // 记录到错误日志
  errorLog.push({
    timestamp: new Date().toISOString(),
    mdPath,
    htmlPath,
    error: error.message,
    stack: error.stack
  });
  
  // 继续同步其他文件
  continue;
}
```

## 7. 性能优化

### 7.1 增量同步

只同步变更的文件：

```javascript
// 读取上次同步状态
const lastSyncState = await loadSyncState();

// 比较文件修改时间
const mdModified = fs.statSync(mdPath).mtime.getTime();
const htmlModified = fs.statSync(htmlPath).mtime.getTime();
const lastSyncTime = lastSyncState.getLastSyncTime(mdPath, htmlPath);

// 如果两边都未修改，跳过同步
if (mdModified <= lastSyncTime && htmlModified <= lastSyncTime) {
  logger.debug(`文件未变更，跳过: ${mdPath}`);
  return { skipped: true };
}
```

### 7.2 并行处理

使用 Promise.all 并行处理多个文件：

```javascript
const syncPromises = filePairs.map(pair => syncFilePair(pair.mdPath, pair.htmlPath));
const results = await Promise.allSettled(syncPromises);
```

## 8. 与现有功能集成

### 8.1 不影响现有命令

现有命令保持不变：

```bash
# 单向同步（现有功能）
node scripts/obsidian-sync.js           # 同步所有文件
node scripts/obsidian-sync.js <file>    # 同步单个文件

# 双向同步（新增功能）
node scripts/obsidian-sync.js bidirectional   # 双向同步
```

### 8.2 兼容现有配置

使用相同的配置文件（config/obsidian-sync.config.json）：

```json
{
  "sync": {
    "direction": "both",           // 支持 both, obsidian-to-blog, blog-to-obsidian
    "conflictResolution": "timestamp"  // 冲突解决策略
  }
}
```

### 8.3 兼容现有模板

使用相同的 HTML 模板和 Markdown 模板。

## 9. 测试策略

### 9.1 单元测试

测试核心函数：

```javascript
describe('detectConflict', () => {
  it('应检测 MD 文件更新', () => {
    const result = detectConflict('test.md', 'test.html');
    expect(result.resolution).toBe('md_wins');
  });
});

describe('htmlToMarkdown', () => {
  it('应正确提取 frontmatter', () => {
    const html = '<!-- frontmatter: {...} -->';
    const md = htmlToMarkdown(html);
    expect(md).toContain('---');
  });
});
```

### 9.2 集成测试

测试完整同步流程：

```javascript
describe('bidirectional sync', () => {
  it('应同步 MD → HTML', async () => {
    // 创建测试 MD 文件
    await fs.writeFile('test.md', '---\ntitle: Test\ndate: 2026-04-10\n---\n\nContent');
    
    // 执行同步
    await syncBidirectional();
    
    // 验证 HTML 文件生成
    const htmlExists = await fs.pathExists('test.html');
    expect(htmlExists).toBe(true);
  });
});
```

## 10. 部署和迁移

### 10.1 首次双向同步

首次运行双向同步时：

```bash
# 1. 备份现有数据
npm run backup:all

# 2. 执行双向同步（试运行）
node scripts/obsidian-sync.js bidirectional --dry-run

# 3. 查看同步报告
# 检查是否有冲突或问题

# 4. 执行实际同步
node scripts/obsidian-sync.js bidirectional
```

### 10.2 回滚机制

如果同步出现问题：

```bash
# 从备份恢复
npm run restore:backup -- --date=2026-04-10
```

## 11. 用户界面

### 11.1 管理界面集成

在 admin 界面添加同步控制面板：

```html
<div class="sync-control-panel">
  <h3>双向同步控制</h3>
  <button onclick="runBidirectionalSync()">执行双向同步</button>
  <button onclick="runSyncDryRun()">试运行（不实际修改）</button>
  <div id="sync-status"></div>
  <div id="sync-log"></div>
</div>
```

## 12. 监控和日志

### 12.1 同步日志

记录详细同步日志：

```
logs/
└── sync/
    ├── 2026-04-10.log
    └── 2026-04-11.log
```

日志内容包括：
- 同步开始/结束时间
- 扫描的文件数量
- 同步的文件列表
- 冲突详情
- 错误信息

## 13. 设计总结

### 13.1 核心特性

✅ **双向同步**：Obsidian ↔ GitHub Blog
✅ **冲突解决**：时间戳优先策略
✅ **文件对应**：基于文件路径映射
✅ **完整同步**：同步所有 frontmatter 和内容
✅ **备份机制**：仅在冲突时备份
✅ **增量同步**：只处理变更的文件
✅ **错误恢复**：详细的错误处理和日志
✅ **性能优化**：并行处理和增量检测

### 13.2 不破坏现有功能

✅ **现有命令不变**：所有现有命令和接口保持兼容
✅ **外观无变化**：HTML 输出格式、样式、结构完全不变
✅ **配置兼容**：使用相同的配置文件
✅ **模板兼容**：使用相同的模板系统
✅ **索引更新**：自动更新所有索引文件

### 13.3 使用方式

```bash
# 执行双向同步
node scripts/obsidian-sync.js bidirectional

# 或简写
node scripts/obsidian-sync.js bidir

# 试运行（不实际修改文件）
node scripts/obsidian-sync.js bidir --dry-run
```

---

**设计确认**：请审查以上设计，确认是否符合你的需求？如果有需要调整的地方，请告诉我。
