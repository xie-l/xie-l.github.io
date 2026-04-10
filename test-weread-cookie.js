#!/usr/bin/env node
// 测试微信读书Cookie是否有效

const https = require('https');

// 从环境变量读取Cookie（模拟GitHub Secret）
const WEREAD_COOKIE = process.env.WEREAD_COOKIE || '';

console.log('=== 测试微信读书Cookie ===\n');

if (!WEREAD_COOKIE) {
  console.log('❌ 错误: WEREAD_COOKIE 未设置');
  console.log('\n配置步骤:');
  console.log('1. 访问 https://weread.qq.com，扫码登录');
  console.log('2. 按 F12 → Application → Cookies → weread.qq.com');
  console.log('3. 复制 wr_skey 的值（或复制全部cookie字符串）');
  console.log('4. 在GitHub仓库 → Settings → Secrets → Actions → New repository secret');
  console.log('   Name: WEREAD_COOKIE');
  console.log('   Value: <粘贴cookie字符串>');
  console.log('5. Cookie约7-30天过期，过期后需要重新获取并更新');
  process.exit(1);
}

console.log('✓ Cookie已设置');
console.log(`  长度: ${WEREAD_COOKIE.length} 字符`);
console.log(`  预览: ${WEREAD_COOKIE.substring(0, 30)}...\n`);

// 测试API调用
console.log('测试API调用...');

const HEADERS = {
  'Cookie': WEREAD_COOKIE,
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  'Referer': 'https://weread.qq.com/',
  'Accept': 'application/json, text/plain, */*'
};

const options = {
  hostname: 'weread.qq.com',
  path: '/web/shelf/sync?synckey=0&virtualGroupId=0',
  method: 'GET',
  headers: HEADERS
};

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const req = https.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log(`  HTTP状态码: ${res.statusCode}`);
    
    if (res.statusCode === 200) {
      try {
        const result = JSON.parse(data);
        const books = result.books || result.shelf || result.bookList || [];
        console.log(`  获取到 ${books.length} 本书`);
        
        if (books.length > 0) {
          console.log('\n✓ Cookie有效！');
          console.log('\n前3本书:');
          books.slice(0, 3).forEach((book, i) => {
            const bookInfo = book.book || book;
            console.log(`  ${i + 1}. ${bookInfo.title || '未知标题'} - ${bookInfo.author || '未知作者'}`);
          });
        } else {
          console.log('\n⚠  获取到0本书，可能是书架为空');
        }
      } catch (e) {
        console.log(`\n❌ 解析响应失败: ${e.message}`);
        console.log(`  响应预览: ${data.substring(0, 100)}...`);
      }
    } else if (res.statusCode === 401 || res.statusCode === 403) {
      console.log('\n❌ Cookie无效或已过期');
      console.log('  请重新获取Cookie并更新GitHub Secret');
    } else {
      console.log(`\n❌ 请求失败: ${res.statusCode}`);
      console.log(`  响应: ${data.substring(0, 200)}`);
    }
  });
});

req.on('error', (error) => {
  console.log(`\n❌ 请求错误: ${error.message}`);
});

req.setTimeout(10000, () => {
  console.log('\n❌ 请求超时（10秒）');
  req.destroy();
});

req.end();

console.log('  正在请求: https://weread.qq.com/web/shelf/sync...\n');
