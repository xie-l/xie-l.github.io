#!/usr/bin/env node
// 将单个thoughts .md文件转换为HTML格式

const fs = require('fs-extra');
const path = require('path');
const { parseFrontmatter } = require('./utils/frontmatter');
const { convertMarkdownToHtml } = require('./utils/markdown-converter');

async function convertThoughtsMdToHtml(mdFilePath) {
  console.log(`=== 转换文件: ${mdFilePath} ===`);
  
  // 读取markdown文件
  const content = await fs.readFile(mdFilePath, 'utf8');
  
  // 解析frontmatter
  const { data: frontmatter, content: markdownContent } = parseFrontmatter(content);
  
  console.log('Frontmatter:', frontmatter);
  
  // 生成标题
  let title = frontmatter.title;
  if (!title || title.trim() === '') {
    // 如果标题为空，使用内容的前50个字符作为标题
    const contentPreview = markdownContent.replace(/\n/g, ' ').trim().substring(0, 50);
    title = contentPreview + (markdownContent.length > 50 ? '...' : '');
  }
  
  // 生成日期
  let dateStr = '';
  if (frontmatter.date) {
    const date = new Date(frontmatter.date);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    dateStr = `${year}年${month}月${day}日`;
  }
  
  // 转换markdown为HTML
  const htmlContent = convertMarkdownToHtml(markdownContent, {
    articlePath: mdFilePath,
    processInternalLinks: true,
    processEmbeds: true,
    processTasks: true,
    removeComments: true
  });
  
  // 生成HTML文件名（使用日期格式）
  const mdFileName = path.basename(mdFilePath, '.md');
  const htmlFileName = `${mdFileName}（202604）.html`;
  const htmlFilePath = path.join(path.dirname(mdFilePath), htmlFileName);
  
  // 生成完整的HTML
  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - 谢亮</title>
    <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>💡</text></svg>">
    <link rel="stylesheet" href="../../css/style.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        .blog-container{max-width:860px;margin:100px auto 60px;padding:0 20px}
        .back-link{display:inline-block;margin-bottom:20px;color:var(--secondary-color);text-decoration:none}
        .post-header{text-align:center;margin-bottom:40px;padding-bottom:30px;border-bottom:1px solid var(--border-color)}
        .post-title{font-size:27px;color:var(--primary-color);margin-bottom:15px;line-height:1.4}
        .post-meta{color:var(--text-light);font-size:14px;display:flex;justify-content:center;gap:20px;flex-wrap:wrap}
        .post-content{background:var(--card-bg,#fff);border-radius:15px;padding:40px;box-shadow:var(--shadow-md);line-height:1.9;font-size:16px}
        .post-content p{margin-bottom:20px;text-align:justify}
        .post-source{font-size:13px;color:var(--text-light);margin-bottom:20px;padding:10px 14px;background:var(--bg-secondary,#f8f9fa);border-radius:8px;border-left:3px solid var(--secondary-color)}
        .post-source a{color:var(--secondary-color);word-break:break-all}
        .post-tags{margin-top:30px;padding-top:20px;border-top:1px solid var(--border-color);display:flex;gap:8px;flex-wrap:wrap}
        .tag{font-size:12px;background:var(--secondary-color);color:#fff;padding:4px 12px;border-radius:20px}
    </style>
</head>
<body>
    <div class="blog-container">
        <a href="./" class="back-link"><i class="fas fa-arrow-left"></i> 返回随笔思考</a>
        <article class="post-header">
            <h1 class="post-title">${title}</h1>
            <div class="post-meta">
                <span><i class="fas fa-calendar"></i> ${dateStr}</span>
                <span><i class="fas fa-folder"></i> 随笔思考</span>
            </div>
        </article>
        <div class="post-content">
            ${htmlContent}
        </div>
    </div>
<script>
document.querySelectorAll('.tag').forEach(function(el){el.style.cursor='pointer';el.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();location.href='../tags.html?tag='+encodeURIComponent(el.textContent.trim());});});
</script>
</body>
</html>`;
  
  // 写入HTML文件
  await fs.writeFile(htmlFilePath, html, 'utf8');
  
  console.log(`✓ 转换完成: ${htmlFilePath}`);
  
  return htmlFilePath;
}

// 如果直接运行
if (require.main === module) {
  const mdFilePath = process.argv[2];
  
  if (!mdFilePath) {
    console.error('请提供 .md 文件路径');
    console.error('用法: node scripts/convert-thoughts-md-to-html.js <path-to-md-file>');
    process.exit(1);
  }
  
  const fullPath = path.resolve(mdFilePath);
  
  convertThoughtsMdToHtml(fullPath)
    .then(() => {
      console.log('转换成功！');
      process.exit(0);
    })
    .catch(err => {
      console.error('转换失败:', err);
      process.exit(1);
    });
}

module.exports = { convertThoughtsMdToHtml };
