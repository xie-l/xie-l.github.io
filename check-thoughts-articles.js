const fs = require('fs');

// 读取blog-index.json
const blogIndex = JSON.parse(fs.readFileSync('data/blog-index.json', 'utf8'));

// 筛选thoughts分类的文章
const thoughtsPosts = blogIndex.posts.filter(p => p.category === 'thoughts');

console.log('=== thoughts分类文章（来自blog-index.json） ===');
console.log(`总数: ${thoughtsPosts.length} 篇`);
console.log('');

thoughtsPosts.forEach((post, i) => {
  console.log(`${i + 1}. ${post.title}`);
  console.log(`   日期: ${post.date}`);
  console.log(`   路径: ${post.path}`);
  console.log('');
});

// 检查这些文件是否存在于thoughts目录
console.log('=== 文件存在性检查 ===');
console.log('');

thoughtsPosts.forEach(post => {
  const filename = post.path.split('/').pop();
  
  if (fs.existsSync(post.path)) {
    console.log(`✓ ${filename} (存在)`);
  } else {
    console.log(`✗ ${filename} (不存在)`);
  }
});

// 检查thoughts目录下实际有多少文件
console.log('');
console.log('=== thoughts目录实际文件 ===');
const thoughtsDir = fs.readdirSync('blog/thoughts');
const actualFiles = thoughtsDir.filter(f => f.endsWith('.html') && f !== 'index.html');
console.log(`thoughts目录有 ${actualFiles.length} 个HTML文件`);
actualFiles.forEach(f => console.log(`  - ${f}`));
