#!/usr/bin/env node
// 自动更新thoughts分类索引

const fs = require('fs-extra');
const path = require('path');

async function updateThoughtsIndex() {
  console.log('=== 更新thoughts索引 ===');
  
  const thoughtsPath = path.join(__dirname, '..', 'blog', 'thoughts');
  const indexPath = path.join(thoughtsPath, 'index.html');
  
  // 获取所有thoughts HTML文件
  const files = await fs.readdir(thoughtsPath);
  const htmlFiles = files
    .filter(f => f.endsWith('.html') && f !== 'index.html')
    .map(f => path.join(thoughtsPath, f));
  
  // 按修改时间排序（最新的在前）
  htmlFiles.sort((a, b) => {
    const statA = fs.statSync(a);
    const statB = fs.statSync(b);
    return statB.mtime.getTime() - statA.mtime.getTime();
  });
  
  console.log(`找到 ${htmlFiles.length} 个thoughts文件`);
  
  // 生成索引内容
  let indexContent = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>随笔思考 - 谢亮的博客</title>
    <link rel="stylesheet" href="../../css/style.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body>
    <div class="blog-container">
        <a href="../" class="back-link"><i class="fas fa-arrow-left"></i> 返回博客首页</a>
        <h1 class="page-title">📝 随笔思考</h1>
        <div class="post-list">
`;
  
  // 为每个文件生成卡片
  for (const file of htmlFiles) {
    const filename = path.basename(file);
    const content = await fs.readFile(file, 'utf8');
    
    // 提取信息
    const titleMatch = content.match(/<h1 class="post-title">(.+?)<\/h1>/);
    const dateMatch = content.match(/<span><i class="fas fa-calendar"><\/i> (.+?)<\/span>/);
    const excerptMatch = content.match(/<p class="post-excerpt">(.+?)<\/p>/);
    
    const title = titleMatch ? titleMatch[1] : filename;
    const date = dateMatch ? dateMatch[1] : '';
    const excerpt = excerptMatch ? excerptMatch[1].substring(0, 150) : '';
    
    // 生成卡片
    indexContent += `            <a href="${filename}" class="post-item">
                <div class="post-date">${date}</div>
                <h3 class="post-title">${title}</h3>
                <p class="post-excerpt">${excerpt}</p>
            </a>
`;
  }
  
  indexContent += `        </div>
    </div>
</body>
</html>`;
  
  // 写入文件
  await fs.writeFile(indexPath, indexContent, 'utf8');
  
  console.log(`✓ thoughts索引已更新: ${htmlFiles.length} 篇文章`);
  console.log(`✓ 文件位置: ${indexPath}`);
}

// 如果直接运行此脚本
if (require.main === module) {
  updateThoughtsIndex().catch(err => {
    console.error('更新失败:', err);
    process.exit(1);
  });
}

module.exports = { updateThoughtsIndex };
