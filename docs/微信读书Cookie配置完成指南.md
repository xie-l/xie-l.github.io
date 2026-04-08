# 微信读书Cookie配置完成指南

**日期**：2026年4月8日
**状态**：Cookie已获取，开始配置

---

## 当前进度

✅ **已完成**：
- Cookie表格已提供
- wr_skey已提取：O1pp18ZR
- 完整Cookie字符串已构建

🔄 **进行中**：
- 配置GitHub Secret
- 触发GitHub Actions工作流

---

## 操作步骤

### 步骤1：配置GitHub Secret（3分钟）

您有两个选择：

#### 选项A：使用自动化脚本（推荐）

```bash
cd /Users/liang/Documents/GitHub/xie-l.github.io
./update-weread-secret.sh
```

**前提**：需要安装GitHub CLI并已登录

**安装GitHub CLI**：
```bash
# Mac
brew install gh

# 然后登录
gh auth login
```

#### 选项B：手动配置

1. **访问GitHub Secrets页面**
   - URL: https://github.com/xie-l/xie-l.github.io/settings/secrets/actions

2. **添加新Secret**
   - 点击 "New repository secret"
   - Name: `WEREAD_COOKIE`
   - Value: 粘贴下面的完整Cookie字符串

3. **完整Cookie字符串**
```
wr_avatar=https%3A%2F%2Fthirdwx.qlogo.cn%2Fmmopen%2Fvi_32%2Fk5r6L01rTcN29evRXJ305mvVzFGwt6o8fbmUbEiaYWA339LKk37JBpRTib2h4jjU8vFDt5KZnvkfm7E5Eu91dvcicPktiahZEee51lCOxk2tOicc%252F132; wr_fp=2832114611; wr_gender=1; wr_gid=277400089; wr_localvid=e6a328806962945e6a4f356; wr_name=%E7%A8%80%E7%BC%BA%E7%89%A9%E7%A7%8D; wr_pf=NaN; wr_ql=1; wr_rt=o2uxBwk-ptsQE_vnQPw2LxWaI2ZM%25408rde585s0kT_Pj5U9aS_AL; wr_skey=O1pp18ZR; wr_theme=white; wr_vid=9840965
```

### 步骤2：验证Secret配置（1分钟）

配置完成后：

1. 刷新Secrets页面
2. 确认WEREAD_COOKIE出现在列表中
3. 确认值为"Updated just now"或类似提示

### 步骤3：触发GitHub Actions工作流（2分钟）

1. **访问工作流页面**
   - URL: https://github.com/xie-l/xie-l.github.io/actions/workflows/fetch-weread.yml

2. **手动触发**
   - 点击 "Run workflow" 按钮
   - 确认Branch为main
   - 再次点击 "Run workflow"

3. **等待完成**
   - 状态从黄色（in progress）变为绿色（completed）
   - 通常需要1-2分钟

### 步骤4：验证数据文件（1分钟）

工作流完成后：

1. **访问数据文件**
   - URL: https://xie-l.github.io/data/weread.json

2. **检查内容**
   - 确认不是空数据
   - 确认有reading和recent字段
   - 确认updated时间是刚刚

**预期结果**：
```json
{
  "reading": {
    "title": "书名",
    "author": "作者",
    ...
  },
  "recent": [...],
  "updated": "2026-04-08 10:05 UTC"
}
```

### 步骤5：验证主页显示（1分钟）

1. **访问主页**
   - URL: https://xie-l.github.io/

2. **强制刷新**
   - Mac: Cmd + Shift + R
   - Windows: Ctrl + F5

3. **检查右侧边栏**
   - 查找"正在阅读"模块
   - 确认显示书籍信息
   - 确认显示进度条
   - 确认显示最近读过的书

---

## 验证清单

### 配置阶段
- [ ] GitHub Secret已配置（WEREAD_COOKIE）
- [ ] Cookie值完整（包含所有字段）
- [ ] Secret状态显示正常

### 工作流阶段
- [ ] GitHub Actions工作流已触发
- [ ] 工作流运行成功（绿色✓）
- [ ] 日志显示"[OK] shelf: X books"

### 数据阶段
- [ ] data/weread.json可访问
- [ ] 数据不为空
- [ ] 包含reading字段
- [ ] 包含recent字段

### 显示阶段
- [ ] 主页右侧显示"正在阅读"
- [ ] 显示当前书籍封面/标题/作者
- [ ] 显示阅读进度条
- [ ] 显示最近读过的书列表

---

## 故障排查

### 问题1：工作流运行失败

**症状**：工作流状态为红色（failure）

**解决**：
1. 点击工作流记录
2. 查看日志输出
3. 查找错误信息
4. 常见错误：
   - `Cookie无效` → 重新获取Cookie
   - `API调用失败` → 检查网络
   - `权限不足` → 检查GitHub Token

### 问题2：数据文件为空

**症状**：data/weread.json只有{"reading": null, "recent": []}

**解决**：
1. 检查工作流日志
2. 确认Cookie是否有效
3. 确认微信读书账号是否有阅读数据
4. 重新获取Cookie并更新

### 问题3：主页不显示

**症状**：右侧边栏没有"正在阅读"模块

**解决**：
1. 强制刷新浏览器（Cmd+Shift+R）
2. 检查浏览器控制台是否有错误
3. 确认data/weread.json有有效数据
4. 检查网络请求是否成功

---

## 完成标准

✅ **所有步骤完成**：
- [ ] GitHub Secret配置成功
- [ ] GitHub Actions工作流运行成功
- [ ] data/weread.json有有效数据
- [ ] 主页显示微信读书widget

---

## 下一步

请选择操作方式：

### A. 使用自动化脚本

```bash
cd /Users/liang/Documents/GitHub/xie-l.github.io
./update-weread-secret.sh
```

### B. 手动配置

按照上面的"步骤1：配置GitHub Secret"手动操作

### C. 我协助你完成

告诉我：
1. 是否已安装GitHub CLI？
2. 是否已登录GitHub CLI？
3. 希望使用哪种方式？

---

**请选择（A/B/C），我将协助您完成配置！**
