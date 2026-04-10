const fs = require('fs');

// 读取并检查thoughts index.html
const content = fs.readFileSync('blog/thoughts/index.html', 'utf8');

console.log('=== 检查thoughts index.html ===\n');

// 检查是否有语法错误
console.log('1. 检查是否有index-optimized.html字符串:');
if (content.includes('index-optimized.html')) {
  console.log('✗ 找到错误: index-optimized.html');
  const lines = content.split('\n');
  lines.forEach((line, i) => {
    if (line.includes('index-optimized.html')) {
      console.log(`  第 ${i+1} 行: ${line}`);
    }
  });
} else {
  console.log('✓ 未找到index-optimized.html错误');
}

console.log('\n2. 检查JavaScript语法:');
try {
  // 提取script内容
  const scriptMatch = content.match(/<script>\s*\(function\(\)\{[\s\S]*?\}\)\(\);\s*<\/script>/);
  if (scriptMatch) {
    console.log('✓ JavaScript代码存在');
    
    // 检查字符串拼接
    const script = scriptMatch[0];
    const singleQuoteCount = (script.match(/'/g) || []).length;
    const doubleQuoteCount = (script.match(/"/g) || []).length;
    console.log(`  单引号数量: ${singleQuoteCount}`);
    console.log(`  双引号数量: ${doubleQuoteCount}`);
    
    // 检查是否有未闭合的字符串
    const lines = script.split('\n');
    let inSingleQuote = false;
    let inDoubleQuote = false;
    let lineNum = 0;
    
    for (let line of lines) {
      lineNum++;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const prevChar = i > 0 ? line[i-1] : '';
        
        if (char === "'" && prevChar !== '\\') {
          inSingleQuote = !inSingleQuote;
        } else if (char === '"' && prevChar !== '\\') {
          inDoubleQuote = !inDoubleQuote;
        }
      }
    }
    
    if (inSingleQuote) {
      console.log('✗ 发现未闭合的单引号');
    } else if (inDoubleQuote) {
      console.log('✗ 发现未闭合的双引号');
    } else {
      console.log('✓ 字符串引号匹配正常');
    }
  } else {
    console.log('✗ 未找到JavaScript代码');
  }
} catch (e) {
  console.log('✗ JavaScript语法错误:', e.message);
}

console.log('\n3. 检查HTML结构:');
const hasPageHeader = content.includes('page-header');
const hasPageTitle = content.includes('page-title');
const hasPostList = content.includes('post-list');
const hasScript = content.includes('<script>');

console.log(`  page-header: ${hasPageHeader ? '✓' : '✗'}`);
console.log(`  page-title: ${hasPageTitle ? '✓' : '✗'}`);
console.log(`  post-list: ${hasPostList ? '✓' : '✗'}`);
console.log(`  script: ${hasScript ? '✓' : '✗'}`);

console.log('\n4. 检查文件大小:');
console.log(`  文件大小: ${content.length} 字节`);
console.log(`  行数: ${content.split('\n').length} 行`);

