const fs = require('fs-extra');
const path = require('path');

const CAT_NAMES = {
  life: '生活日记',
  books: '书籍阅读',
  tech: '技术思考',
  analysis: '数据分析',
  quotes: '摘录记录',
  thoughts: '随笔思考'
};

function pad(n) {
  return String(n).padStart(2, '0');
}

/**
 * 检查索引中是否已存在指定文件的链接
 * @param {string} indexHtml - 索引HTML内容
 * @param {string} filename - 文件名（如"今日小结（2026.04.09）（202604）.html"）
 * @returns {boolean} - 是否已存在
 */
function checkFileExistsInIndex(indexHtml, filename) {
  // 如果文件名为null/undefined，返回false（不存在）
  if (!filename) {
    return false;
  }
  
  // 构建匹配模式：href="filename" 或 href='filename'
  const escapedFilename = filename.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`href=["']${escapedFilename}["']`);
  return regex.test(indexHtml);
}

/**
 * 从HTML文件中提取博客文章信息
 */
async function extractPostInfo(htmlFilePath, filename) {
  try {
    const content = await fs.readFile(htmlFilePath, 'utf8');
    const category = path.basename(path.dirname(htmlFilePath));
    
    // 提取标题
    const titleMatch = content.match(/<h1 class="post-title">(.+?)<\/h1>/);
    const title = titleMatch ? titleMatch[1] : '';
    
    // 提取日期（处理quotes分类的特殊结构）
    let date = '';
    const dateMatch = content.match(/<div class="post-date">(.+?)<\/div>/);
    if (dateMatch) {
      date = dateMatch[1];
    } else {
      // quotes分类：从.post-meta的第一个span提取日期
      const metaDateMatch = content.match(/<span><i class="fas fa-calendar"><\/i>\s*(.+?)<\/span>/);
      date = metaDateMatch ? metaDateMatch[1] : new Date().toISOString().split('T')[0];
    }
    
    // 提取摘要（处理quotes分类没有post-excerpt的情况）
    let excerpt = '';
    const excerptMatch = content.match(/<p class="post-excerpt">(.+?)<\/p>/);
    if (excerptMatch) {
      excerpt = excerptMatch[1];
    } else {
      // quotes分类：从正文第一段提取
      const contentMatch = content.match(/<div class="post-content">([\s\S]*?)<\/div>/);
      if (contentMatch) {
        const firstP = contentMatch[1].match(/<p>(.+?)<\/p>/);
        excerpt = firstP ? firstP[1].slice(0, 100) : '';
      }
    }
    
    // 提取标签
    const tagsMatch = content.match(/<div class="post-tags">([\s\S]*?)<\/div>/);
    let tagsHtml = '';
    if (tagsMatch) {
      const tags = tagsMatch[1].match(/<span class="tag">(.+?)<\/span>/g);
      if (tags) {
        tagsHtml = tags.join('');
      }
    }
    
    // 提取来源（quotes分类）
    let sourceHtml = '';
    if (category === 'quotes') {
      // quotes使用post-source而不是post-source-mini
      const sourceMatch = content.match(/<div class="post-source"([\s\S]*?)<\/div>/);
      if (sourceMatch) {
        sourceHtml = '<div class="post-source-mini">' + 
          sourceMatch[1].replace(/<a[^>]*>(.+?)<\/a>/, '$1').replace(/来源：/, '').trim() + 
          '</div>';
      }
    }
    
    return {
      title: title || filename.replace(/\.html$/, ''),
      date: date || new Date().toISOString().split('T')[0],
      excerpt: excerpt || '',
      tagsHtml: tagsHtml,
      sourceHtml: sourceHtml
    };
  } catch (error) {
    console.warn(`提取文件信息失败: ${htmlFilePath}`, error.message);
    return {
      title: filename.replace(/\.html$/, ''),
      date: new Date().toISOString().split('T')[0],
      excerpt: '',
      tagsHtml: '',
      sourceHtml: ''
    };
  }
}

/**
 * 重新生成整个分类索引
 */
async function regenerateCategoryIndex(blogPath, category) {
  const categoryDir = path.join(blogPath, category);
  const indexPath = path.join(categoryDir, 'index.html');
  
  if (!await fs.pathExists(indexPath)) {
    console.warn(`索引文件不存在: ${indexPath}`);
    return { success: false, error: 'index_not_found' };
  }
  
  const currentHTML = await fs.readFile(indexPath, 'utf8');
  
  // quotes分类使用JavaScript动态加载，不清空静态内容
  if (category === 'quotes') {
    // 对于quotes，只清空post-list中的静态条目，保留容器
    const markerRegex = /(<div\s+class="post-list"[^>]*>)[\s\S]*?(<\/div>\s*<\/div>\s*<script)/;
    const markerMatch = currentHTML.match(markerRegex);
    
    if (!markerMatch) {
      console.warn(`无法找到quotes的post-list区域`);
      return { success: false, error: 'marker_not_found' };
    }
    
    // 清空内容，只保留容器
    const newContent = markerMatch[1] + '\n        ' + markerMatch[2];
    const updatedHTML = currentHTML.replace(markerRegex, newContent);
    await fs.writeFile(indexPath, updatedHTML, 'utf8');
    
    console.log(`清空quotes静态索引成功: ${indexPath}`);
    return { success: true, skipped: false, regenerated: true, count: 0 };
  }
  
  // 读取所有HTML文件（除了index.html和以index开头的文件）
  const files = await fs.readdir(categoryDir);
  const htmlFiles = files.filter(f => f.endsWith('.html') && !f.startsWith('index'));
  
  // 为每个文件提取信息并生成卡片
  const cards = [];
  for (const filename of htmlFiles) {
    const filePath = path.join(categoryDir, filename);
    const postInfo = await extractPostInfo(filePath, filename);
    
    const cardTitle = postInfo.title || (
      '<span style="color:var(--text-light);font-style:italic">' +
      (postInfo.excerpt || '').slice(0, 30) +
      ((postInfo.excerpt || '').length > 30 ? '…' : '') +
      '</span>'
    );
    
    const card =
      '\n            <a href="' + filename + '" class="post-item">\n' +
      '                <div class="post-date">' + postInfo.date + '</div>\n' +
      '                <h3 class="post-title">' + cardTitle + '</h3>\n' +
      postInfo.sourceHtml +
      '                <p class="post-excerpt">' + postInfo.excerpt + '</p>\n' +
      '                <div class="post-tags">' + postInfo.tagsHtml + '</div>\n' +
      '            </a>';
    
    cards.push(card);
  }
  
  // 使用正则表达式匹配<div class="post-list">...</div>，替换整个内容
  const markerRegex = /(<div\s+class="post-list"[^>]*>)[\s\S]*?(<\/div>\s+<p style="text-align: center;)/;
  const markerMatch = currentHTML.match(markerRegex);
  
  if (!markerMatch) {
    console.warn(`无法找到post-list区域`);
    return { success: false, error: 'marker_not_found' };
  }
  
  const newContent = markerMatch[1] + cards.join('') + '\n        ' + markerMatch[2];
  const updatedHTML = currentHTML.replace(markerRegex, newContent);
  await fs.writeFile(indexPath, updatedHTML, 'utf8');
  
  console.log(`重新生成索引成功: ${indexPath}, 共 ${cards.length} 篇文章`);
  return { success: true, skipped: false, regenerated: true, count: cards.length };
}

async function updateCategoryIndex(blogPath, category, filename, title, tagList, raw, source) {
  const indexPath = path.join(blogPath, category, 'index.html');
  
  if (!await fs.pathExists(indexPath)) {
    console.warn(`索引文件不存在: ${indexPath}`);
    return { success: false, error: 'index_not_found' };
  }
  
  // 如果filename为null，重新生成整个索引
  if (!filename) {
    return await regenerateCategoryIndex(blogPath, category);
  }
  
  const currentHTML = await fs.readFile(indexPath, 'utf8');
  
  // 检查是否已存在该文件
  if (checkFileExistsInIndex(currentHTML, filename)) {
    console.warn(`索引中已存在文件: ${filename}，跳过添加`);
    return { success: true, skipped: true, reason: 'already_exists' };
  }
  
  const now = new Date();
  const dateStr = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate());
  const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);
  const excerpt = (lines[0] || '').slice(0, 100);
  
  const tagsHtml = tagList.map(t => `<span class="tag">${t}</span>`).join('');
  
  // 无标题时卡片显示内容开头
  const cardTitle = title || (
    '<span style="color:var(--text-light);font-style:italic">' +
    (lines[0] || '').slice(0, 30) +
    (lines[0] && lines[0].length > 30 ? '…' : '') +
    '</span>'
  );
  
  // 来源标注（quotes 专用）
  const sourceHtml = (category === 'quotes' && source) ?
    '<div class="post-source-mini"><i class="fas fa-link"></i> ' + source.slice(0, 60) + '</div>' : '';
  
  const newCard =
    '\n            <a href="' + filename + '" class="post-item">\n' +
    '                <div class="post-date">' + dateStr + '</div>\n' +
    '                <h3 class="post-title">' + cardTitle + '</h3>\n' +
    sourceHtml +
    '                <p class="post-excerpt">' + excerpt + '</p>\n' +
    '                <div class="post-tags">' + tagsHtml + '</div>\n' +
    '            </a>';
  
  // 使用正则表达式匹配<div class="post-list">，允许有其他属性
  const markerRegex = /<div\s+class="post-list"[^>]*>/;
  const markerMatch = currentHTML.match(markerRegex);
  
  if (!markerMatch) {
    console.warn(`无法找到插入点: <div class="post-list">`);
    return { success: false, error: 'marker_not_found' };
  }
  
  const marker = markerMatch[0];
  const updatedHTML = currentHTML.replace(marker, marker + newCard);
  await fs.writeFile(indexPath, updatedHTML, 'utf8');
  
  console.log(`更新索引成功: ${indexPath}`);
  return { success: true, skipped: false };
}

module.exports = { updateCategoryIndex, checkFileExistsInIndex };
