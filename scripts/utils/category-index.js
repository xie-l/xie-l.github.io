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

async function updateCategoryIndex(blogPath, category, filename, title, tagList, raw, source) {
  const indexPath = path.join(blogPath, category, 'index.html');
  
  if (!await fs.pathExists(indexPath)) {
    console.warn(`索引文件不存在: ${indexPath}`);
    return false;
  }
  
  const currentHTML = await fs.readFile(indexPath, 'utf8');
  
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
  
  const marker = '<div class="post-list">';
  if (!currentHTML.includes(marker)) {
    console.warn(`无法找到插入点: ${marker}`);
    return false;
  }
  
  const updatedHTML = currentHTML.replace(marker, marker + newCard);
  await fs.writeFile(indexPath, updatedHTML, 'utf8');
  
  console.log(`更新索引成功: ${indexPath}`);
  return true;
}

module.exports = { updateCategoryIndex };
