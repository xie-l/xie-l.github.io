// scripts/utils/frontmatter.js
const matter = require('gray-matter');
const fs = require('fs-extra');

function parseFrontmatter(content) {
  try {
    // 预处理：修复常见的Front Matter格式问题
    let processedContent = content;
    
    // 问题: tags: [...]---（结束标记前没有换行符）
    // 将 ]--- 或 ]\n--- 替换为 ]\n---\n
    processedContent = processedContent.replace(/\](\r?\n)?---(\r?\n)?/g, ']\n---\n');
    
    // 问题2: Obsidian的Markdown标记（**）干扰YAML解析
    // 在Front Matter区域内移除**标记
    const frontmatterMatch = processedContent.match(/^(---\n[\s\S]*?\n)---\n/);
    if (frontmatterMatch) {
      const frontmatter = frontmatterMatch[1];
      const cleanedFrontmatter = frontmatter.replace(/\*\*/g, '');
      processedContent = processedContent.replace(frontmatter, cleanedFrontmatter);
    }
    
    const result = matter(processedContent);
    
    // 处理日期：gray-matter 会自动解析日期为 Date 对象
    // 我们需要将其转换回 YYYY-MM-DD 字符串
    if (result.data.date && result.data.date instanceof Date) {
      const date = result.data.date;
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      result.data.date = `${year}-${month}-${day}`;
    }
    
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
  
  // 验证日期格式
  if (data.date) {
    if (typeof data.date !== 'string') {
      errors.push(`日期必须是字符串格式`);
    } else {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(data.date)) {
        errors.push('日期格式错误，应为 YYYY-MM-DD');
      }
    }
  }
  
  // 验证分类
  if (data.category) {
    const validCategories = ['quotes', 'thoughts', 'tech', 'life', 'books', 'analysis'];
    if (!validCategories.includes(data.category)) {
      errors.push(`无效的分类: ${data.category}`);
    }
  }
  
  // 验证状态
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
