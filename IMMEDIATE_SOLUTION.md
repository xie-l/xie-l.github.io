# 🚨 立即解决方案

**问题**: 发布失败：Invalid request. "sha" wasn't supplied

**根本原因**: 浏览器缓存了旧版本的代码，或者GitHub Pages尚未部署最新修复

---

## ✅ 解决方案（按优先级排序）

### 方案1: 等待自动部署 + 清除缓存（推荐）

**步骤1: 等待1-2分钟**
- GitHub Pages正在自动部署最新代码
- 提交ID: `9f72e39` (已包含SHA修复)

**步骤2: 清除浏览器缓存**
```
按 Ctrl+Shift+R (Windows)
或 Cmd+Shift+R (Mac)
```

**步骤3: 重新登录管理后台**
- 访问 `/admin/login.html`
- 输入GitHub Token
- 点击登录

**步骤4: 测试发布**
- 尝试发布博客或摘录
- 应该成功

---

### 方案2: 强制刷新（立即生效）

在浏览器控制台运行以下代码：

```javascript
// 1. 清除所有存储
gitlocalStorage.removeItem('github_token');
localStorage.removeItem('github_repo');
localStorage.removeItem('github_owner');
sessionStorage.clear();

// 2. 强制刷新页面（绕过所有缓存）
location.reload(true);
```

**然后**：
- 重新登录管理后台
- 测试发布功能

---

### 方案3: 验证修复是否生效

在浏览器控制台运行：

```javascript
// 检查admin/main.js是否包含修复
fetch('/admin/main.js')
  .then(r => r.text())
  .then(content => {
    if (content.includes('fileSha')) {
      console.log('✅ 修复已生效！admin/main.js包含fileSha');
    } else {
      console.log('❌ 修复未生效！admin/main.js不包含fileSha');
      console.log('请等待1-2分钟或尝试方案2');
    }
  });
```

---

### 方案4: 手动测试发布

在浏览器控制台运行完整的测试：

```javascript
// 测试发布功能
async function testPublish() {
  const token = localStorage.getItem('github_token');
  const owner = localStorage.getItem('github_owner');
  const repo = localStorage.getItem('github_repo');
  
  if (!token || !owner || !repo) {
    console.error('请先登录管理后台');
    return;
  }
  
  const testPath = 'blog/test/test-' + Date.now() + '.md';
  const content = btoa('# Test\n\nThis is a test.');
  const apiBase = `https://api.github.com/repos/${owner}/${repo}/contents/`;
  
  try {
    // 检查文件是否存在
    const checkResp = await fetch(apiBase + encodeURIComponent(testPath), {
      headers: { 'Authorization': 'token ' + token }
    });
    
    let fileSha = null;
    if (checkResp.ok) {
      const fileData = await checkResp.json();
      fileSha = fileData.sha;
      console.log('文件已存在，SHA:', fileSha.substring(0, 10) + '...');
    }
    
    // 创建/更新文件
    const body = { message: '测试', content: content };
    if (fileSha) body.sha = fileSha;
    
    const resp = await fetch(apiBase + encodeURIComponent(testPath), {
      method: 'PUT',
      headers: {
        'Authorization': 'token ' + token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    
    console.log('状态码:', resp.status);
    if (resp.ok) {
      console.log('✅ 测试成功！修复已生效');
      // 清理
      const result = await resp.json();
      await fetch(apiBase + encodeURIComponent(testPath), {
        method: 'DELETE',
        headers: { 'Authorization': 'token ' + token },
        body: JSON.stringify({
          message: '清理',
          sha: result.content.sha
        })
      });
    } else {
      const err = await resp.json();
      console.error('❌ 失败:', err.message);
    }
  } catch (error) {
    console.error('错误:', error.message);
  }
}

testPublish();
```

---

## 📊 当前状态

### 代码状态
- ✅ 修复已完成（提交ID: `9f72e39`）
- ✅ 已推送到GitHub
- ✅ 等待GitHub Pages部署

### 验证结果
```bash
$ node verify-fix.js

✓ publishBlog函数已修复，包含fileSha参数
✓ publishQuote函数已修复，包含fileSha参数
```

---

## 🎯 立即行动

### 推荐步骤（成功率最高）

1. **等待1-2分钟**（让GitHub Pages部署最新代码）
2. **清除浏览器缓存**（按 Ctrl+Shift+R 或 Cmd+Shift+R）
3. **重新登录**（访问 /admin/login.html）
4. **测试发布**

### 如果仍然失败

请提供以下信息：
1. 浏览器控制台日志
2. 网络请求的详细信息（特别是Request Headers和Response）
3. 运行以下命令的结果：
   ```bash
   cd /Users/liang/Documents/GitHub/xie-l.github.io
   node verify-fix.js
   ```

---

## 🔧 快速修复命令

```bash
# 1. 确保代码最新
cd /Users/liang/Documents/GitHub/xie-l.github.io
git pull origin main

# 2. 验证修复
node verify-fix.js

# 3. 推送到GitHub
git push origin main
```

---

**重要提醒**: 如果等待2分钟后仍然出现此错误，请立即运行方案3的验证代码，并告诉我结果。这表明可能有其他问题需要解决。
