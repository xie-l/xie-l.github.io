#!/usr/bin/env node
// 测试右下角铅笔图标发布功能

const https = require('https');

// GitHub配置
const OWNER = 'xie-l';
const REPO = 'xie-l.github.io';
const TOKEN = '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';
const API_BASE = `https://api.github.com/repos/${OWNER}/${REPO}/contents/`;

async function testPublish() {
  console.log('=== 测试右下角铅笔图标发布功能 ===\n');
  
  // 测试1: 检查文件是否存在（获取SHA）
  console.log('测试1: 检查文件是否存在...');
  const testPath = 'blog/life/test-publish-function.html';
  
  try {
    const sha = await getFileSha(testPath);
    if (sha) {
      console.log(`✓ 文件已存在，SHA: ${sha.substring(0, 8)}...`);
    } else {
      console.log('✓ 文件不存在（正常，将创建新文件）');
    }
  } catch (error) {
    console.log(`✗ 错误: ${error.message}`);
  }
  
  // 测试2: 创建测试文件
  console.log('\n测试2: 创建测试文件...');
  const testContent = `<!DOCTYPE html>
<html>
<head>
    <title>测试发布功能</title>
</head>
<body>
    <h1>测试发布功能</h1>
    <p>这是一篇测试文章，用于验证右下角铅笔图标发布功能是否正常工作。</p>
    <p>发布时间: ${new Date().toLocaleString()}</p>
</body>
</html>`;
  
  try {
    const result = await createOrUpdateFile(testPath, testContent, '测试发布功能');
    console.log(`✓ 文件创建/更新成功: ${result.html_url}`);
  } catch (error) {
    console.log(`✗ 错误: ${error.message}`);
    console.log(`  状态码: ${error.status}`);
    console.log(`  响应: ${JSON.stringify(error.response, null, 2)}`);
  }
  
  console.log('\n=== 测试完成 ===');
}

// 获取文件SHA
function getFileSha(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: `/repos/${OWNER}/${REPO}/contents/${encodeURIComponent(path)}`,
      method: 'GET',
      headers: {
        'Authorization': `token ${TOKEN}`,
        'User-Agent': 'Node.js',
        'Accept': 'application/vnd.github.v3+json'
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const fileData = JSON.parse(data);
            resolve(fileData.sha);
          } catch (e) {
            reject(new Error(`解析响应失败: ${e.message}`));
          }
        } else if (res.statusCode === 404) {
          // 文件不存在
          resolve(null);
        } else {
          reject(new Error(`GitHub API错误: ${res.statusCode} ${data}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.end();
  });
}

// 创建或更新文件
function createOrUpdateFile(path, content, message) {
  return new Promise(async (resolve, reject) => {
    try {
      // 先检查文件是否存在，获取SHA
      const sha = await getFileSha(path);
      
      const body = {
        message: message,
        content: Buffer.from(content).toString('base64')
      };
      
      // 如果文件已存在，需要提供SHA
      if (sha) {
        body.sha = sha;
        console.log(`  更新已存在的文件 (SHA: ${sha.substring(0, 8)}...)`);
      } else {
        console.log(`  创建新文件`);
      }
      
      const postData = JSON.stringify(body);
      
      const options = {
        hostname: 'api.github.com',
        path: `/repos/${OWNER}/${REPO}/contents/${encodeURIComponent(path)}`,
        method: 'PUT',
        headers: {
          'Authorization': `token ${TOKEN}`,
          'User-Agent': 'Node.js',
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };
      
      const req = https.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          if (res.statusCode === 200 || res.statusCode === 201) {
            try {
              const result = JSON.parse(data);
              resolve(result.content);
            } catch (e) {
              reject(new Error(`解析响应失败: ${e.message}`));
            }
          } else {
            const error = new Error(`GitHub API错误: ${res.statusCode}`);
            error.status = res.statusCode;
            try {
              error.response = JSON.parse(data);
            } catch (e) {
              error.response = data;
            }
            reject(error);
          }
        });
      });
      
      req.on('error', (error) => {
        reject(error);
      });
      
      req.write(postData);
      req.end();
    } catch (error) {
      reject(error);
    }
  });
}

// 运行测试
testPublish().catch(console.error);
