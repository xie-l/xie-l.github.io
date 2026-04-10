#!/usr/bin/env node
// 自动修复Token问题
// 这个脚本会引导你重新生成Token并自动更新

const https = require('https');
const readline = require('readline');
const fs = require('fs');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔧 GitHub Token 自动修复工具');
console.log('================================\n');

console.log('问题确认: Token已失效（Bad credentials）');
console.log('解决方案: 重新生成GitHub Personal Access Token\n');

console.log('步骤1: 生成新的Token');
console.log('---------------------');
console.log('1. 访问: https://github.com/settings/tokens');
console.log('2. 点击 "Generate new token" → "Generate new token (classic)"');
console.log('3. 填写Token描述（如: Personal Homepage Token）');
console.log('4. 勾选权限: ✓ repo (Full control of private repositories)');
console.log('5. 点击 "Generate token"');
console.log('6. 复制生成的Token（以 ghp_ 开头）\n');

function askForToken() {
  rl.question('请将新生成的Token粘贴到这里: ', (newToken) => {
    newToken = newToken.trim();
    
    if (!newToken) {
      console.log('❌ Token不能为空');
      rl.close();
      return;
    }
    
    if (!newToken.startsWith('ghp_') && !newToken.startsWith('github_pat_')) {
      console.log('⚠️  Warning: Token格式可能不正确');
      console.log('   Token应该以 ghp_ 或 github_pat_ 开头\n');
    }
    
    console.log('\n步骤2: 验证Token有效性');
    console.log('-----------------------');
    
    verifyToken(newToken).then(valid => {
      if (valid) {
        console.log('\n✓ Token验证成功！');
        
        console.log('\n步骤3: 更新本地配置');
        console.log('-------------------');
        
        updateLocalConfig(newToken);
        
        console.log('\n✅ Token修复完成！');
        console.log('\n下一步操作:');
        console.log('1. 刷新浏览器缓存 (Ctrl+Shift+R 或 Cmd+Shift+R)');
        console.log('2. 访问你的主页');
        console.log('3. 测试右下角铅笔图标发布功能');
        console.log('\n如果仍然有问题，请运行: node test-token-validity.js');
        
      } else {
        console.log('\n❌ Token验证失败');
        console.log('请检查:');
        console.log('1. Token是否已复制完整');
        console.log('2. Token是否以 ghp_ 开头');
        console.log('3. Token是否包含空格或换行\n');
        
        rl.question('是否重试? (y/n): ', (answer) => {
          if (answer.toLowerCase() === 'y') {
            askForToken();
          } else {
            console.log('\n操作已取消');
            rl.close();
          }
        });
      }
    });
  });
}

function verifyToken(token) {
  return new Promise((resolve) => {
    console.log('正在验证Token...');
    
    const options = {
      hostname: 'api.github.com',
      path: '/user',
      headers: {
        'Authorization': 'token ' + token,
        'User-Agent': 'Node.js',
        'Accept': 'application/vnd.github.v3+json'
      }
    };
    
    const req = https.get(options, (resp) => {
      let data = '';
      resp.on('data', chunk => data += chunk);
      resp.on('end', () => {
        if (resp.statusCode === 200) {
          try {
            const user = JSON.parse(data);
            console.log('✓ Token有效，用户: ' + user.login);
            resolve(true);
          } catch (e) {
            console.log('✗ 响应解析失败: ' + e.message);
            resolve(false);
          }
        } else {
          console.log('✗ Token无效，状态码: ' + resp.statusCode);
          try {
            const error = JSON.parse(data);
            console.log('  错误信息: ' + error.message);
          } catch (e) {
            console.log('  响应: ' + data);
          }
          resolve(false);
        }
      });
    });
    
    req.on('error', (err) => {
      console.log('✗ 请求错误: ' + err.message);
      resolve(false);
    });
    
    req.setTimeout(10000, () => {
      console.log('✗ 请求超时');
      req.destroy();
      resolve(false);
    });
  });
}

function updateLocalConfig(token) {
  // 创建或更新配置文件
  const config = {
    github_token: token,
    github_repo: 'xie-l.github.io',
    github_owner: 'xie-l',
    updated: new Date().toISOString()
  };
  
  // 保存到配置文件
  fs.writeFileSync(
    path.join(__dirname, 'github-config.json'),
    JSON.stringify(config, null, 2),
    'utf8'
  );
  
  console.log('✓ 配置文件已创建: github-config.json');
  console.log('  Token已安全存储（请勿将此文件提交到Git）');
  
  // 创建浏览器脚本
  const browserScript = `
// 在浏览器控制台运行此脚本更新Token
localStorage.setItem('github_token', '${token}');
localStorage.setItem('github_repo', 'xie-l.github.io');
localStorage.setItem('github_owner', 'xie-l');
console.log('✓ Token已更新到localStorage');
console.log('请刷新页面并测试发布功能');
`.trim();
  
  fs.writeFileSync(
    path.join(__dirname, 'update-token-in-browser.js'),
    browserScript,
    'utf8'
  );
  
  console.log('✓ 浏览器更新脚本已创建: update-token-in-browser.js');
  console.log('  在浏览器控制台运行此脚本即可更新Token');
}

// 开始
askForToken();
