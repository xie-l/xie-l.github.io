// 诊断发布功能的脚本
// 在浏览器控制台运行

console.log('=== GitHub Publish Diagnostic Tool ===\n');

// 1. 检查localStorage
diagnoseLocalStorage();

// 2. 检查发布函数
diagnosePublishFunction();

// 3. 测试GitHub API
testGitHubAPI();

function diagnoseLocalStorage() {
    console.log('1. 检查本地存储:');
    console.log('==================');
    
    const token = localStorage.getItem('github_token');
    const repo = localStorage.getItem('github_repo');
    const owner = localStorage.getItem('github_owner');
    
    console.log('Token存在:', !!token);
    console.log('Token长度:', token ? token.length : 'null');
    if (token) {
        console.log('Token前10位:', token.substring(0, 10));
        console.log('Token后10位:', token.substring(token.length - 10));
        console.log('Token格式检查:');
        console.log('  - 以ghp_开头:', token.startsWith('ghp_'));
        console.log('  - 以github_pat_开头:', token.startsWith('github_pat_'));
        console.log('  - 包含空格:', token.includes(' '));
        console.log('  - 包含换行:', token.includes('\n'));
    }
    
    console.log('Repo:', repo);
    console.log('Owner:', owner);
    console.log('');
}

function diagnosePublishFunction() {
    console.log('2. 检查发布函数:');
    console.log('==================');
    
    // 查找发布按钮和事件
    const publishBtn = document.querySelector('#pubBtn, .publish-btn');
    console.log('发布按钮存在:', !!publishBtn);
    
    if (publishBtn) {
        console.log('按钮文本:', publishBtn.textContent);
        console.log('按钮禁用状态:', publishBtn.disabled);
    }
    
    // 检查表单元素
    const titleEl = document.getElementById('title');
    const catEl = document.getElementById('cat');
    const bodyEl = document.getElementById('body');
    
    console.log('标题输入框存在:', !!titleEl);
    console.log('分类选择框存在:', !!catEl);
    console.log('内容输入框存在:', !!bodyEl);
    console.log('');
}

function testGitHubAPI() {
    console.log('3. 测试GitHub API:');
    console.log('==================');
    
    const token = localStorage.getItem('github_token');
    const repo = localStorage.getItem('github_repo') || 'xie-l.github.io';
    const owner = localStorage.getItem('github_owner') || 'xie-l';
    
    if (!token) {
        console.error('❌ 未找到Token，无法测试API');
        return;
    }
    
    console.log('正在测试API...');
    
    // 测试1: 获取用户信息
    fetch('https://api.github.com/user', {
        headers: {
            'Authorization': 'token ' + token,
            'Accept': 'application/vnd.github.v3+json'
        }
    })
    .then(resp => {
        console.log('用户API状态码:', resp.status);
        return resp.json();
    })
    .then(data => {
        if (data.login) {
            console.log('✓ 用户信息获取成功:', data.login);
        } else {
            console.log('✗ 用户信息获取失败:', data);
        }
    })
    .catch(err => {
        console.log('✗ 用户API错误:', err.message);
    });
    
    // 测试2: 获取仓库信息
    fetch(`https://api.github.com/repos/${owner}/${repo}`, {
        headers: {
            'Authorization': 'token ' + token,
            'Accept': 'application/vnd.github.v3+json'
        }
    })
    .then(resp => {
        console.log('仓库API状态码:', resp.status);
        return resp.json();
    })
    .then(data => {
        if (data.name) {
            console.log('✓ 仓库信息获取成功:', data.name);
            console.log('  - 推送权限:', data.permissions && data.permissions.push);
        } else {
            console.log('✗ 仓库信息获取失败:', data);
        }
    })
    .catch(err => {
        console.log('✗ 仓库API错误:', err.message);
    });
    
    // 测试3: 检查文件是否存在（用于发布功能）
    setTimeout(() => {
        const testPath = 'blog/life/test-publish-' + Date.now() + '.html';
        console.log('');
        console.log('4. 测试文件创建流程:');
        console.log('==================');
        
        const content = btoa('<h1>测试</h1>');
        fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${testPath}`, {
            method: 'PUT',
            headers: {
                'Authorization': 'token ' + token,
                'Content-Type': 'application/json',
                'Accept': 'application/vnd.github.v3+json'
            },
            body: JSON.stringify({
                message: '测试发布',
                content: content
            })
        })
        .then(resp => {
            console.log('文件创建状态码:', resp.status);
            if (resp.status === 201) {
                console.log('✓ 文件创建成功');
            } else if (resp.status === 401) {
                console.log('✗ 认证失败 - Token无效或权限不足');
            } else if (resp.status === 404) {
                console.log('✗ 仓库不存在或无权访问');
            } else {
                return resp.json().then(data => {
                    console.log('错误详情:', data);
                });
            }
        })
        .catch(err => {
            console.log('✗ 文件创建错误:', err.message);
        });
    }, 2000);
    
    console.log('');
}

// 拦截fetch请求以查看实际发送的headers
(function() {
    const originalFetch = window.fetch;
    window.fetch = function() {
        const args = Array.prototype.slice.call(arguments);
        
        // 如果是GitHub API请求，打印详细信息
        if (args[0] && typeof args[0] === 'string' && args[0].includes('api.github.com')) {
            console.log('=== GitHub API 请求 ===');
            console.log('URL:', args[0]);
            console.log('Method:', args[1] && args[1].method || 'GET');
            
            if (args[1] && args[1].headers) {
                console.log('Headers:');
                for (let [key, value] of Object.entries(args[1].headers)) {
                    if (key.toLowerCase() === 'authorization') {
                        // 隐藏token
                        const tokenPreview = value.substring(0, 20) + '...';
                        console.log('  ', key + ':', tokenPreview);
                    } else {
                        console.log('  ', key + ':', value);
                    }
                }
            }
            
            if (args[1] && args[1].body) {
                try {
                    const body = JSON.parse(args[1].body);
                    console.log('Body:');
                    console.log('  message:', body.message);
                    console.log('  content:', body.content ? body.content.substring(0, 50) + '...' : 'null');
                    console.log('  sha:', body.sha || 'null');
                } catch (e) {
                    console.log('Body:', args[1].body);
                }
            }
            console.log('');
        }
        
        return originalFetch.apply(this, arguments);
    };
})();

console.log('诊断工具已加载，请刷新页面并查看控制台输出');
console.log('然后点击右下角铅笔图标进行测试');
