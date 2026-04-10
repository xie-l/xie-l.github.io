// scripts/utils/category-map.js
const categoryMap = {
  '摘录记录': 'quotes',
  '随笔思考': 'thoughts',
  '技术思考': 'tech',
  '生活日记': 'life',
  '书籍阅读': 'books',
  '数据分析': 'analysis'
};

const reverseCategoryMap = {
  'quotes': '摘录记录',
  'thoughts': '随笔思考',
  'tech': '技术思考',
  'life': '生活日记',
  'books': '书籍阅读',
  'analysis': '数据分析'
};

function getBlogCategory(obsidianFolder) {
  return categoryMap[obsidianFolder];
}

function getObsidianFolder(blogCategory) {
  return reverseCategoryMap[blogCategory];
}

function validateCategory(category) {
  const validCategories = ['quotes', 'thoughts', 'tech', 'life', 'books', 'analysis'];
  
  if (!validCategories.includes(category)) {
    throw new Error(`无效的分类: "${category}"。可用值: ${validCategories.join(', ')}`);
  }
  
  return true;
}

module.exports = {
  categoryMap,
  reverseCategoryMap,
  getBlogCategory,
  getObsidianFolder,
  validateCategory
};
