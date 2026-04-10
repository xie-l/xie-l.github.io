const TurndownService = require('turndown');

function htmlToMarkdown(htmlContent) {
  // 创建 turndown 实例
  const turndownService = new TurndownService({
    headingStyle: 'atx',
    bulletListMarker: '-',
    codeBlockStyle: 'fenced'
  });
  
  // 提取 frontmatter 信息
  const frontmatter = extractFrontmatter(htmlContent);
  
  // 提取正文内容
  const contentMatch = htmlContent.match(/<div class="post-content">([\s\S]*?)<\/div>/);
  const htmlBody = contentMatch ? contentMatch[1] : '';
  
  // HTML → Markdown 转换
  const markdownBody = turndownService.turndown(htmlBody);
  
  // 如果有 frontmatter，重建 YAML 块
  if (frontmatter && Object.keys(frontmatter).length > 0) {
    const frontmatterStr = generateFrontmatter(frontmatter);
    return frontmatterStr + '\n\n' + markdownBody;
  }
  
  return markdownBody;
}

function extractFrontmatter(htmlContent) {
  const frontmatter = {};
  
  // 提取标题
  const titleMatch = htmlContent.match(/<h1 class="post-title">(.+?)<\/h1>/);
  if (titleMatch) {
    frontmatter.title = titleMatch[1];
  }
  
  // 提取日期
  const dateMatch = htmlContent.match(/<i class="fas fa-calendar"><\/i>\s*([^<]+)<\/span>/);
  if (dateMatch) {
    frontmatter.date = parseChineseDate(dateMatch[1]);
  }
  
  // 提取分类
  const categoryMatch = htmlContent.match(/<i class="fas fa-folder"><\/i>\s*([^<]+)<\/span>/);
  if (categoryMatch) {
    frontmatter.category = mapCategoryName(categoryMatch[1]);
  }
  
  // 提取标签
  const tagsMatch = htmlContent.match(/<i class="fas fa-tags"><\/i>\s*([^<]+)<\/span>/);
  if (tagsMatch) {
    frontmatter.tags = tagsMatch[1].split('/').map(tag => tag.trim());
  }
  
  return frontmatter;
}

function generateFrontmatter(data) {
  const lines = ['---'];
  for (const [key, value] of Object.entries(data)) {
    if (Array.isArray(value)) {
      lines.push(`${key}: [${value.join(', ')}]`);
    } else {
      lines.push(`${key}: ${value}`);
    }
  }
  lines.push('---');
  return lines.join('\n');
}

function parseChineseDate(chineseDate) {
  // 将 "2026年4月10日" 转换为 "2026-04-10"
  const match = chineseDate.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
  if (match) {
    const year = match[1];
    const month = match[2].padStart(2, '0');
    const day = match[3].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  return new Date().toISOString().split('T')[0];
}

function mapCategoryName(categoryName) {
  const categoryMap = {
    '生活日记': 'life',
    '技术思考': 'tech',
    '随笔思考': 'thoughts',
    '摘录记录': 'quotes',
    '书籍阅读': 'books',
    '数据分析': 'analysis'
  };
  return categoryMap[categoryName] || 'life';
}

module.exports = { htmlToMarkdown };
