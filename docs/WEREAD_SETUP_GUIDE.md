# 微信读书配置指南

## 问题说明

当前 `data/weread.json` 中的数据为空：

```json
{
  "reading": null,
  "recent": [],
  "updated": "2026-04-10 04:50 UTC"
}
```

这是因为 GitHub Secret `WEREAD_COOKIE` 未配置或已过期。

## 配置步骤

### 第一步：获取微信读书Cookie

1. 访问 [https://weread.qq.com](https://weread.qq.com)
2. 扫码登录你的微信读书账号
3. 按 `F12` 打开开发者工具
4. 切换到 **Application** 标签页
5. 在左侧菜单选择 **Cookies** → `weread.qq.com`
6. 在右侧找到 **Name** 为 `wr_skey` 的Cookie
7. 复制 **Value** 列的值（或者复制整个Cookie字符串）

**截图说明：**
```
Application → Cookies → weread.qq.com
┌─────────┬─────────────────┬─────────┐
│ Name    │ Value           │ Domain  │
├─────────┼─────────────────┼─────────┤
│ wr_skey │ wxk...（复制）  │ ...     │
└─────────┴─────────────────┴─────────┘
```

### 第二步：配置GitHub Secret

1. 访问你的GitHub仓库：`https://github.com/xie-l/xie-l.github.io`
2. 点击 **Settings** 标签页
3. 在左侧菜单选择 **Secrets and variables** → **Actions**
4. 点击 **New repository secret**
5. 填写信息：
   - **Name**: `WEREAD_COOKIE`
   - **Value**: 粘贴刚才复制的Cookie值
6. 点击 **Add secret**

### 第三步：验证配置

在本地测试Cookie是否有效：

```bash
cd /Users/liang/Documents/GitHub/xie-l.github.io
export WEREAD_COOKIE="你的cookie值"
node test-weread-cookie.js
```

预期输出：
```
=== 测试微信读书Cookie ===

✓ Cookie已设置
  长度: 150 字符
  预览: wxk_9A8B7C6D5E4F3G2H1...

测试API调用...
  正在请求: https://weread.qq.com/web/shelf/sync...

  HTTP状态码: 200
  获取到 15 本书

✓ Cookie有效！

前3本书:
  1. 认知觉醒 - 周岭
  2. 原则 - 瑞·达利欧
  3. 穷查理宝典 - 查理·芒格
```

### 第四步：手动触发更新

配置完成后，可以手动触发数据更新：

1. 访问 GitHub Actions 页面：`https://github.com/xie-l/xie-l.github.io/actions`
2. 点击 **Fetch WeChat Reading Data** 工作流
3. 点击 **Run workflow** → **Run workflow**
4. 等待几分钟后，检查 `data/weread.json` 是否更新

### 第五步：验证主页显示

1. 访问你的主页：`https://xie-l.github.io/`
2. 检查微信读书小部件是否显示当前正在读的书
3. 如果没有显示，检查浏览器控制台是否有错误

## 常见问题

### 1. Cookie过期

**症状**：`data/weread.json` 中的数据突然变为空

**解决**：Cookie约7-30天过期，需要重新获取并更新GitHub Secret

**步骤**：
1. 重复上面的第一步获取新Cookie
2. 在GitHub Secrets中更新 `WEREAD_COOKIE` 的值
3. 手动触发工作流更新数据

### 2. 数据未更新

**症状**：配置Cookie后，`data/weread.json` 仍然是空

**检查**：
1. 确认Cookie是否正确复制（不要有多余的空格）
2. 确认GitHub Secret是否已添加
3. 查看GitHub Actions运行日志，检查是否有错误
4. 运行 `node test-weread-cookie.js` 测试Cookie有效性

### 3. 主页不显示

**症状**：`data/weread.json` 有数据，但主页不显示

**检查**：
1. 检查浏览器控制台是否有JavaScript错误
2. 确认 `index.html` 中微信读书相关代码是否正常
3. 检查网络请求，`/data/weread.json` 是否成功加载（状态码200）

## 自动更新

配置完成后，GitHub Actions会：
- **每天北京时间10:05**自动更新微信读书数据
- 更新 `data/weread.json` 文件
- 自动提交并推送到GitHub

你可以随时：
- 手动触发更新
- 查看更新历史
- 检查更新日志

## 技术支持

如果配置后仍然无法显示：

1. 检查GitHub Actions运行日志
2. 运行测试脚本：`node test-weread-cookie.js`
3. 查看 `data/weread.json` 文件内容
4. 检查浏览器控制台错误
5. 提Issue到GitHub仓库

## 相关文件

- 工作流：`.github/workflows/fetch-weread.yml`
- 数据文件：`data/weread.json`
- 前端代码：`index.html`（第1622-1650行）
- 测试脚本：`test-weread-cookie.js`
