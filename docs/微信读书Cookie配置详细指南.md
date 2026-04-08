# 微信读书Cookie配置详细指南（方案B）

**日期**：2026年4月8日
**方案**：完整配置WEREAD_COOKIE
**预计时间**：12分钟

---

## 步骤1：获取微信读书Cookie（5分钟）

### 操作说明

1. **打开浏览器**，访问 https://weread.qq.com

2. **扫码登录**微信读书账号
   - 确保登录成功
   - 能看到书架内容

3. **按F12**打开开发者工具
   - Mac: `Cmd + Option + I`
   - Windows: `F12` 或 `Ctrl + Shift + I`

4. **切换到Application标签**
   - 在开发者工具顶部菜单栏
   - 如果没有，点击`>>`展开更多选项

5. **左侧选择Cookies → weread.qq.com**
   - 展开Cookies菜单
   - 点击weread.qq.com

6. **找到wr_skey这个Cookie**
   - 在Cookie列表中查找Name为`wr_skey`的行
   - 通常在最下面或中间位置

7. **复制Value列的值**
   - 点击Value列的值（一长串字符）
   - 右键 → Copy → Copy value
   - 或者双击选中，按Cmd+C复制

### 截图示例

```
┌─────────────────────────────────────────────────────┐
│ 开发者工具                                          │
│ ┌─────────┬──────────────────────────────────────┐ │
│ │ Cookies │ Name          Value                  │ │
│ │         ├──────────────────────────────────────┤ │
│ │         │ wr_vid        1234567890             │ │
│ │         │ wr_skey       abcdef1234567890abc... │ ← 复制这一行
│ │         │ wr_pf         0                      │ │
│ │         │ ...           ...                    │ │
│ └─────────┴──────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
                          ↑
                      右键复制Value
```

### 重要提示

- **确保复制完整**：Value值可能很长，确保复制完整
- **不要包含空格**：复制前后不要有空格
- **保存好这个值**：临时粘贴到文本编辑器备用

---

## 步骤2：配置GitHub Secret（3分钟）

### 操作说明

1. **打开浏览器**，访问 https://github.com/xie-l/xie-l.github.io/settings/secrets/actions

2. **检查是否存在WEREAD_COOKIE**
   - 查看Secrets列表
   - 如果存在：点击"Update"按钮
   - 如果不存在：点击"New repository secret"按钮

3. **填写表单**
   - **Name**: `WEREAD_COOKIE`（必须完全一致）
   - **Value**: 粘贴刚才复制的Cookie值

4. **保存**
   - 点击"Add secret"或"Save"按钮

### 截图示例

**情况A：WEREAD_COOKIE不存在**

```
GitHub → Settings → Secrets and variables → Actions
┌─────────────────────────────────────────┐
│ Repository secrets                      │
│                                         │
│ No secrets found.                     │
│                                         │
│ [New repository secret]                 │
└─────────────────────────────────────────┘

点击 [New repository secret]

┌─────────────────────────────────────────┐
│ New secret                              │
│                                         │
│ Name *  [WEREAD_COOKIE                ]│
│ Value * [粘贴Cookie值                  ]│
│                                         │
│ [Add secret]  [Cancel]                  │
└─────────────────────────────────────────┘
```

**情况B：WEREAD_COOKIE已存在**

```
GitHub → Settings → Secrets and variables → Actions
┌─────────────────────────────────────────┐
│ Repository secrets                      │
│                                         │
│ WEREAD_COOKIE  ●●●●●●●●●●●●●●●●  [Update]│
│                                         │
│ [New repository secret]                 │
└─────────────────────────────────────────┘

点击 [Update]

┌─────────────────────────────────────────┐
│ Update secret                           │
│                                         │
│ Name    WEREAD_COOKIE                   │
│ Value * [粘贴新的Cookie值              ]│
│                                         │
│ [Update secret]  [Cancel]               │
└─────────────────────────────────────────┘
```

### 验证配置

配置完成后，刷新页面，确认WEREAD_COOKIE显示在列表中

---

## 步骤3：触发GitHub Actions工作流（2分钟）

### 操作说明

1. **打开浏览器**，访问 https://github.com/xie-l/xie-l.github.io/actions/workflows/fetch-weread.yml

2. **点击"Run workflow"按钮**
   - 按钮在页面右侧
   - 绿色按钮

3. **确认运行参数**
   - Branch: `main`（应该已经是默认选中）
   - 无需修改其他参数

4. **点击"Run workflow"**
   - 在下拉菜单中再次点击
   - 工作流开始运行

5. **等待运行完成**
   - 页面会自动刷新
   - 看到新的运行记录出现
   - 状态从黄色（in progress）变为绿色（completed）
   - 通常需要1-2分钟

### 截图示例

```
Actions → Fetch WeChat Reading Data
┌────────────────────────────────────────────────┐
│ This workflow has a workflow_dispatch event. │
│                                                │
│ Run workflow ▼                                 │
│   Branch: main                                 │
│   [Run workflow]                               │
└────────────────────────────────────────────────┘

点击 [Run workflow]

┌────────────────────────────────────────────────┐
│ Fetch WeChat Reading Data                      │
│ ┌────────────────────────────────────────────┐ │
│ │ ✓ completed  2 minutes ago                 │ │
│ │   Commit: test: 添加微信读书测试数据      │ │
│ │   Duration: 1m 23s                        │ │
│ └────────────────────────────────────────────┘ │
└────────────────────────────────────────────────┘
```

### 查看日志

1. 点击刚完成的运行记录
2. 查看日志输出
3. 确认没有错误

**预期日志内容**：
```
Run Fetch WeChat Reading data
  python3 << 'PYEOF'
  [OK] shelf: 15 books, bookProgress: 8
  Wrote data/weread.json: reading=高效能人士的七个习惯, recent=3
```

**如果有错误**：
- 检查错误信息
- 可能是Cookie无效或过期
- 需要重新获取Cookie

---

## 步骤4：验证数据文件（1分钟）

### 操作说明

1. **访问数据文件URL**
   - 打开浏览器
   - 访问 https://xie-l.github.io/data/weread.json

2. **检查内容**
   - 确认不是空数据
   - 确认有reading和recent字段
   - 确认updated时间是刚刚

### 预期结果

```json
{
  "reading": {
    "title": "高效能人士的七个习惯",
    "author": "史蒂芬·柯维",
    "cover": "https://img3.doubanio.com/fiction/s29725544-0.jpg",
    "progress": 65,
    "finished": false,
    "last_read": "2026-04-08"
  },
  "recent": [
    {
      "title": "认知觉醒",
      "author": "周岭",
      "progress": 100,
      "finished": true,
      "last_read": "2026-04-07"
    },
    {
      "title": "深度工作",
      "author": "卡尔·纽波特",
      "progress": 45,
      "finished": false,
      "last_read": "2026-04-06"
    },
    {
      "title": "原子习惯",
      "author": "詹姆斯·克利尔",
      "progress": 100,
      "finished": true,
      "last_read": "2026-04-05"
    }
  ],
  "updated": "2026-04-08 10:05 UTC"
}
```

### 如果数据为空

可能原因：
1. Cookie无效或过期 → 重新获取
2. 微信读书账号无阅读数据 → 检查账号
3. API调用失败 → 查看工作流日志

---

## 步骤5：验证主页显示（1分钟）

### 操作说明

1. **访问主页**
   - 打开浏览器
   - 访问 https://xie-l.github.io/

2. **检查右侧边栏**
   - 向下滚动到侧边栏
   - 查找"正在阅读"模块

3. **确认显示内容**
   - 📚 正在阅读 标题
   - 书籍封面（或📖占位图）
   - 书名
   - 作者
   - 阅读进度条
   - 进度百分比
   - 最近读过的书列表
   - 更新时间

4. **强制刷新**
   - Mac: `Cmd + Shift + R`
   - Windows: `Ctrl + F5`
   - 确保不是缓存的旧页面

### 预期显示效果

```
┌─────────────────────────────────┐
│ ⚡ 谢亮                        │
├─────────────────────────────────┤
│                                 │
│  氢能驱动未来                  │
│                                 │
│  碳基电催化 · 机器学习 · ...   │
│                                 │
├─────────────────────────────────┤
│ 📚 正在阅读                    │
│ ┌─────────┬──────────────────┐ │
│ │ 📖      │ 高效能人士的...  │ │
│ │         │ 史蒂芬·柯维      │ │
│ │         │ ████████░░ 65%  │ │
│ └─────────┴──────────────────┘ │
│ 最近读过                      │
│ • 认知觉醒 ✓                  │
│ • 深度工作 45%                │
│ • 原子习惯 ✓                  │
│                               │
│ 更新于 04-08 18:05（北京时间）│
└─────────────────────────────────┘
```

### 如果仍然不显示

1. **检查浏览器控制台**
   - 按F12打开开发者工具
   - 切换到Console标签
   - 刷新页面
   - 查看是否有错误信息

2. **检查网络请求**
   - 切换到Network标签
   - 刷新页面
   - 查找weread.json请求
   - 确认状态码为200

3. **检查元素**
   - 右键点击页面 → 检查
   - 搜索"weread-widget"
   - 查看style是否为"display: block"或其他非none值

---

## 故障排查

### 问题1：工作流运行失败

**症状**：
- 工作流状态为红色（failure）
- 日志中有错误信息

**解决方案**：
1. 查看完整日志
2. 查找错误原因
3. 常见错误：
   - `Cookie无效` → 重新获取Cookie
   - `API调用失败` → 检查网络或API变更
   - `权限不足` → 检查GitHub Token权限

### 问题2：数据文件格式错误

**症状**：
- 访问weread.json显示错误
- JSON格式不正确

**解决方案**：
1. 检查工作流日志
2. 查看写入的数据
3. 验证JSON格式

### 问题3：主页显示异常

**症状**：
- Widget显示但内容错乱
- 样式问题

**解决方案**：
1. 检查CSS样式
2. 检查JavaScript错误
3. 强制刷新缓存

---

## 验证清单

### 配置完成前
- [ ] WEREAD_COOKIE未配置或无效
- [ ] data/weread.json为空
- [ ] 主页不显示微信读书widget

### 配置完成后
- [ ] WEREAD_COOKIE已配置且值有效
- [ ] GitHub Actions工作流运行成功
- [ ] data/weread.json有有效数据
- [ ] 主页显示微信读书widget
- [ ] 显示当前阅读书籍
- [ ] 显示最近读过的书
- [ ] 显示更新时间

---

## 维护建议

### Cookie有效期
- **有效期**：7-30天
- **建议**：每2周更新一次
- **提醒**：设置日历提醒

### 自动检查
可以添加GitHub Actions步骤：

```yaml
- name: Check cookie expiration
  if: ${{ env.WEREAD_COOKIE != '' }}
  run: |
    echo "Cookie已配置，检查是否过期..."
    # 添加过期提醒逻辑
```

---

## 总结

### 完成标准
✅ **所有步骤已完成**：
- [ ] 获取微信读书Cookie
- [ ] 配置GitHub Secret
- [ ] 触发GitHub Actions工作流
- [ ] 验证数据文件更新
- [ ] 验证主页显示

### 预期结果
✅ **用户可以看到**：
- 右侧边栏"正在阅读"模块
- 当前阅读的书籍信息
- 阅读进度条
- 最近读过的书
- 自动同步更新

---

**现在就开始吧！请告诉我您当前在哪一步，或者需要我协助哪一步？**
