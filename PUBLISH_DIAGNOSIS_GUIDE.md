# GitHub 发布功能 "Bad credentials" 错误诊断指南

**创建时间**: 2026-04-10 15:00
**问题**: 右下角铅笔图标发布失败，错误 "Bad credentials"

---

## 🎯 快速诊断流程

### 步骤 1: 使用诊断工具（推荐）

我已经创建了完整的诊断工具，请按以下步骤操作：

1. **访问诊断页面**
   ```
   http://localhost:8000/test-publish-diagnose.html
   ```
   或
   ```
   https://xie-l.github.io/test-publish-diagnose.html
   ```

2. **点击"检查 Token 信息"**
   - 工具会自动检查Token格式和有效性
   - 查看是否有格式错误（空格、换行等）

3. **点击"测试用户 API"**
   - 验证Token是否能访问GitHub API
   - 检查是否有401/403错误

4. **点击"测试仓库 API"**
   - 验证是否能访问你的仓库
   - 检查推送权限

5. **点击"模拟发布"**
   - 完整模拟发布流程
   - 查看详细的请求和响应

---

## 🔍 根因分析

### 可能的错误原因（按可能性排序）

#### 1. Token 格式问题（最常见）

**症状**: Token包含空格、换行或特殊字符

**检查方法**:
```javascript
// 在浏览器控制台运行
const token = localStorage.getItem('github_token');
console.log('Token长度:', token.length);
console.log('包含空格:', token.includes(' '));
console.log('包含换行:', token.includes('\n'));
console.log('Token预览:', token.substring(0, 10) + '...');
```

**解决方案**:
- 清除现有Token: `localStorage.removeItem('github_token')`
- 重新登录管理后台 `/admin/login.html`
- 粘贴Token时确保没有多余空格

#### 2. Token 权限不足

**症状**: 可以访问用户API，但无法访问仓库或推送

**检查方法**:
- 访问 https://github.com/settings/tokens
- 检查Token是否勾选了 `repo` 权限
- 检查Token是否过期

**解决方案**:
- 生成新的Personal Access Token (classic)
- 必须勾选 `repo` (Full control of private repositories)
- 更新到管理后台

#### 3. Token 未正确存储

**症状**: localStorage中没有Token或值为null

**检查方法**:
```javascript
// 在浏览器控制台运行
console.log('Token存在:', !!localStorage.getItem('github_token'));
console.log('Repo存在:', !!localStorage.getItem('github_repo'));
console.log('Owner存在:', !!localStorage.getItem('github_owner'));
```

**解决方案**:
- 访问 `/admin/login.html`
- 输入正确的Token和仓库名称
- 点击登录

#### 4. Authorization 头格式错误

**症状**: 请求头格式不正确导致认证失败

**检查方法**:
在浏览器开发者工具中查看网络请求：
- 打开 Network 标签
- 点击发布按钮
- 查看请求的 Headers
- 检查 Authorization 格式是否为: `token <your-token>`

**正确格式**:
```
Authorization: token ghp_xxxxxxxxxxxxxxxxxxxx
```

**错误格式示例**:
```
Authorization: ghp_xxxxxxxxxxxxxxxxxxxx  // 缺少 "token " 前缀
Authorization: Token ghp_...              // Token 大小写错误
Authorization: bearer ghp_...             // 使用了错误的认证方式
```

**解决方案**:
- 检查 `index.html` 第2402行和第2419行
- 确保格式为: `'Authorization':'token '+token`

#### 5. 跨域或CORS问题

**症状**: 浏览器控制台显示CORS错误

**检查方法**:
- 查看浏览器控制台错误
- 检查是否有CORS相关的错误信息

**解决方案**:
- GitHub API支持CORS，通常不是问题
- 确保使用的是 `https://api.github.com`
- 检查浏览器插件是否拦截了请求

---

## 🛠️ 手动诊断步骤

如果无法使用诊断工具，可以手动进行以下检查：

### 检查1: 验证Token有效性

```javascript
// 在浏览器控制台运行
const token = localStorage.getItem('github_token');

fetch('https://api.github.com/user', {
    headers: {
        'Authorization': 'token ' + token,
        'Accept': 'application/vnd.github.v3+json'
    }
})
.then(resp => {
    console.log('状态码:', resp.status);
    return resp.json();
})
.then(data => {
    if (data.login) {
        console.log('✓ Token有效，用户:', data.login);
    } else {
        console.log('✗ Token无效:', data);
    }
});
```

**预期结果**: 状态码200，返回用户信息

**如果返回401**: Token无效或格式错误

### 检查2: 验证仓库访问

```javascript
const token = localStorage.getItem('github_token');
const owner = localStorage.getItem('github_owner');
const repo = localStorage.getItem('github_repo');

fetch(`https://api.github.com/repos/${owner}/${repo}`, {
    headers: {
        'Authorization': 'token ' + token,
        'Accept': 'application/vnd.github.v3+json'
    }
})
.then(resp => {
    console.log('状态码:', resp.status);
    return resp.json();
})
.then(data => {
    if (data.name) {
        console.log('✓ 仓库访问成功:', data.full_name);
        console.log('推送权限:', data.permissions?.push);
    } else {
        console.log('✗ 仓库访问失败:', data);
    }
});
```

**预期结果**: 状态码200，返回仓库信息

**如果返回404**: 仓库不存在或无权访问

### 检查3: 模拟发布请求

```javascript
const token = localStorage.getItem('github_token');
const owner = localStorage.getItem('github_owner');
const repo = localStorage.getItem('github_repo');

const testPath = 'blog/life/test-' + Date.now() + '.html';
const content = btoa('<h1>测试</h1>');
const apiBase = `https://api.github.com/repos/${owner}/${repo}/contents/`;

// 检查文件是否存在
fetch(apiBase + encodeURIComponent(testPath), {
    method: 'GET',
    headers: {
        'Authorization': 'token ' + token,
        'Accept': 'application/vnd.github.v3+json'
    }
})
.then(resp => {
    console.log('检查状态码:', resp.status);
    if (resp.status === 404) {
        console.log('✓ 文件不存在，将创建');
    }
    return resp.ok ? resp.json() : null;
})
.then(fileData => {
    const body = {
        message: '测试发布',
        content: content
    };
    
    if (fileData?.sha) {
        body.sha = fileData.sha;
        console.log('提供SHA:', fileData.sha);
    }
    
    // 创建/更新文件
    return fetch(apiBase + encodeURIComponent(testPath), {
        method: 'PUT',
        headers: {
            'Authorization': 'token ' + token,
            'Content-Type': 'application/json',
            'Accept': 'application/vnd.github.v3+json'
        },
        body: JSON.stringify(body)
    });
})
.then(resp => {
    console.log('PUT状态码:', resp.status);
    if (resp.ok) {
        console.log('✓ 文件创建成功');
    } else {
        return resp.json().then(err => {
            console.log('错误详情:', err);
        });
    }
});
```

**预期结果**: 状态码201（创建）或200（更新）

**如果返回401**: Authorization头格式错误或Token无效

---

## 📝 诊断报告模板

请按照以下模板提供诊断信息：

```
=== 诊断报告 ===
时间: 
浏览器: 

1. Token检查:
   - Token存在: ✓/✗
   - Token长度: 
   - Token格式(ghp_): ✓/✗
   - Token格式(github_pat_): ✓/✗
   - 包含空格: ✓/✗
   - 包含换行: ✓/✗

2. API测试结果:
   - 用户API状态码: 
   - 仓库API状态码: 
   - 模拟发布状态码: 

3. 错误信息:
   - 完整错误: 
   - 响应体: 

4. 浏览器控制台日志:
   - 相关错误: 

5. 网络请求信息:
   - Request URL: 
   - Authorization头: 
   - 响应状态: 
   - 响应体: 
```

---

## ✅ 验证清单

修复后，请确认以下项目：

- [ ] Token格式正确（以ghp_或github_pat_开头）
- [ ] Token无空格和换行
- [ ] Token已正确存储在localStorage
- [ ] 用户API测试返回200
- [ ] 仓库API测试返回200
- [ ] 模拟发布返回201或200
- [ ] 右下角发布功能正常工作

---

## 🔧 快速修复命令

### 清除Token并重新登录

```javascript
// 在浏览器控制台运行
localStorage.removeItem('github_token');
localStorage.removeItem('github_repo');
localStorage.removeItem('github_owner');
console.log('✓ Token已清除');
console.log('请访问 /admin/login.html 重新登录');
```

### 验证Token格式

```javascript
const token = localStorage.getItem('github_token');
if (token) {
    console.log('Token格式检查:');
    console.log('  长度:', token.length);
    console.log('  以ghp_开头:', token.startsWith('ghp_'));
    console.log('  包含空格:', token.includes(' '));
    console.log('  包含换行:', token.includes('\n'));
} else {
    console.log('❌ Token不存在');
}
```

---

## 📊 常见错误代码

| 状态码 | 错误信息 | 原因 | 解决方案 |
|--------|----------|------|----------|
| 401 | Bad credentials | Token无效或格式错误 | 重新生成Token并登录 |
| 401 | Unauthorized | 认证失败 | 检查Authorization头格式 |
| 404 | Not Found | 仓库不存在 | 检查仓库名称和所有者 |
| 403 | Forbidden | 权限不足 | 确保Token有repo权限 |
| 422 | Validation Failed | 请求体格式错误 | 检查请求参数 |

---

## 🚀 下一步行动

1. **立即行动**: 访问诊断页面进行测试
   ```
   http://localhost:8000/test-publish-diagnose.html
   ```

2. **如果诊断失败**: 按照建议操作修复

3. **如果诊断成功但发布失败**: 
   - 提供完整的诊断报告
   - 检查浏览器网络请求的详细信息
   - 查看控制台日志

4. **验证修复**:
   - 重新运行诊断工具
   - 测试发布功能
   - 确认所有检查项通过

---

## 📞 需要进一步帮助？

如果以上步骤无法解决问题，请提供：

1. **诊断工具的完整输出**（截图或日志）
2. **浏览器控制台错误信息**
3. **网络请求的详细信息**（包括Request Headers和Response）
4. **Token格式验证结果**（不包含完整Token）

---

**最后更新**: 2026-04-10 15:00
**诊断工具**: `test-publish-diagnose.html`
**状态**: 等待用户诊断结果
