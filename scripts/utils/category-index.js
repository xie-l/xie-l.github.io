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

async function updateCategoryIndex(blogPath, category, filename, title, tagList, raw, source) {
  const indexPath = path.join(blogPath, category, 'index.html');
  
  if (!await fs.pathExists(indexPath)) {
    console.warn(`索引文件不存在: ${indexPath}`);
    return { success: false, error: 'index_not_found' };
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
