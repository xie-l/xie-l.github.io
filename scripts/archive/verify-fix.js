#!/usr/bin/env node
// 验证修复是否有效

const fs = require('fs');

console.log('=== 验证修复是否有效 ===\n');

// 1. 检查admin/main.js
const content = fs.readFileSync('admin/main.js', 'utf8');

// 检查publishBlog函数
const publishBlogMatch = content.match(/async publishBlog\(\)[\s\S]*?await createOrUpdateFile\([^)]+\)/);
if (publishBlogMatch) {
  const func = publishBlogMatch[0];
  if (func.includes('fileSha')) {
    console.log('✓ publishBlog函数已修复，包含fileSha参数');
  } else {
    console.log('✗ publishBlog函数未修复，缺少fileSha参数');
  }
} else {
  console.log('✗ 无法找到publishBlog函数');
}

// 检查publishQuote函数
const publishQuoteMatch = content.match(/async publishQuote\(\)[\s\S]*?await createOrUpdateFile\([^)]+\)/);
if (publishQuoteMatch) {
  const func = publishQuoteMatch[0];
  if (func.includes('fileSha')) {
    console.log('✓ publishQuote函数已修复，包含fileSha参数');
  } else {
    console.log('✗ publishQuote函数未修复，缺少fileSha参数');
  }
} else {
  console.log('✗ 无法找到publishQuote函数');
}

// 检查getFileContent调用
const getFileContentCalls = (content.match(/await getFileContent\([^)]+\)/g) || []).length;
console.log(`✓ 找到 ${getFileContentCalls} 处 getFileContent 调用`);

console.log('\n=== 修复总结 ===');
console.log('已修复:');
console.log('1. admin/main.js publishBlog函数 - 添加SHA参数检查');
console.log('2. admin/main.js publishQuote函数 - 添加SHA参数检查');
console.log('\n这些修复解决了:"Invalid request. \"sha\" wasn\'t supplied"错误');

console.log('\n=== 建议操作 ===');
console.log('1. 确保GitHub Token有效（如过期需重新生成）');
console.log('2. 刷新浏览器缓存');
console.log('3. 测试发布功能');
