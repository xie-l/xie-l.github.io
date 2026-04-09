// scripts/utils/frontmatter.js
const matter = require('gray-matter');
const fs = require('fs-extra');

function parseFrontmatter(content) {
  try {
    const result = matter(content);
    return {
      data: result.data || {},
      content: result.content || '',
      excerpt: result.excerpt || ''
    };
  } catch (error) {
    throw new Error(`Front Matter 解析失败: ${error.message}`);
  }
}

function validateFrontmatter(data, requiredFields = []) {
  const errors = [];
  
  for (const field of requiredFields) {
    if (!(field in data) || data[field] === null || data[field] === undefined) {
      errors.push(`缺少必填字段: ${field}`);
    }
  }
  
  if (data.date) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(data.date)) {
      errors.push('日期格式错误，应为 YYYY-MM-DD');
    }
  }
  
  if (data.category) {
    const validCategories = ['quotes', 'thoughts', 'tech', 'life', 'books', 'analysis'];
    if (!validCategories.includes(data.category)) {
      errors.push(`无效的分类: ${data.category}`);
    }
  }
  
  if (data.status) {
    const validStatuses = ['draft', 'published'];
    if (!validStatuses.includes(data.status)) {
      errors.push(`无效的状态: ${data.status}`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

function generateFrontmatter(data) {
  return matter.stringify('', data);
}

module.exports = {
  parseFrontmatter,
  validateFrontmatter,
  generateFrontmatter
};
