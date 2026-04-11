#!/usr/bin/env node
// scripts/check-duplicates.js
// 检查Obsidian vault中的重复文件

const fs = require('fs-extra');
const path = require('path');
const { loadConfig } = require('./utils/config');

async function findDuplicates(options = {}) {
  const config = options.config || loadConfig();
  const vaultPath = config.obsidian.vaultPath;
  
  // 获取所有分类目录
  const categories = Object.keys(require('./utils/category-map').categoryMap);
  
  const fileMap = new Map(); // filename -> locations
  let totalFiles = 0;
  let duplicateCount = 0;
  
  console.log('🔍 扫描Obsidian vault中的重复文件...\n');
  
  for (const category of categories) {
    const categoryPath = path.join(vaultPath, category);
    if (!await fs.pathExists(categoryPath)) {
      continue;
    }
    
    const files = await fs.readdir(categoryPath);
    const mdFiles = files.filter(f => f.endsWith('.md') && !f.startsWith('.'));
    
    for (const file of mdFiles) {
      totalFiles++;
      
      if (!fileMap.has(file)) {
        fileMap.set(file, []);
      }
      fileMap.get(file).push(category);
    }
  }
  
  // 报告重复文件
  const duplicates = [];
  for (const [filename, locations] of fileMap) {
    if (locations.length > 1) {
      duplicates.push({ filename, locations });
      duplicateCount++;
    }
  }
  
  // 按文件名排序
  duplicates.sort((a, b) => a.filename.localeCompare(b.filename));
  
  if (duplicates.length > 0) {
    console.log(`⚠️  发现 ${duplicates.length} 个重复文件:\n`);
    
    for (const { filename, locations } of duplicates) {
      console.log(`📄 ${filename}`);
      console.log(`   📂 出现在: ${locations.join(', ')}`);
      
      // 读取每个文件的frontmatter，检查category是否匹配
      for (const location of locations) {
        const filePath = path.join(vaultPath, location, filename);
        const content = await fs.readFile(filePath, 'utf8');
        const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
        
        if (frontmatterMatch) {
          const categoryMatch = frontmatterMatch[1].match(/category:\s*(.+)/);
          if (categoryMatch) {
            const categoryInFm = categoryMatch[1].trim();
            const expectedCategory = require('./utils/category-map').getBlogCategory(location);
            
            if (categoryInFm !== expectedCategory) {
              console.log(`   ⚠️  分类不匹配: 文件在"${location}"目录，但category是"${categoryInFm}"`);
            }
          }
        }
      }
      console.log('');
    }
    
    console.log(`💡 建议: 删除重复文件，只保留在正确分类中的版本`);
  } else {
    console.log('✅ 没有发现重复文件');
  }
  
  console.log(`\n📊 总计: ${totalFiles} 个文件，${duplicateCount} 个重复`);
  
  return {
    totalFiles,
    duplicateCount,
    duplicates
  };
}

if (require.main === module) {
  findDuplicates().catch(error => {
    console.error('检查失败:', error.message);
    process.exit(1);
  });
}

module.exports = { findDuplicates };
