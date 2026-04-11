#!/usr/bin/env node
// scripts/clean-duplicates.js
// 清理Obsidian vault中的重复文件（保留正确分类）

const fs = require('fs-extra');
const path = require('path');
const { findDuplicates } = require('./check-duplicates');
const { updateCategoryIndex } = require('./utils/category-index');

// 定义正确的分类映射（根据内容类型）
const CORRECT_CATEGORIES = {
  // 书籍阅读类
  '《当下的力量》：一个焦虑型学者的止战手册.md': '书籍阅读',
  '《认知觉醒》：一个博士生的自我重启手册.md': '书籍阅读',
  '《高效能人士的七个习惯》：从博士到管培生的效能觉醒.md': '书籍阅读',
  '《新闻联播》2026 年 4 月 5 日.md': '生活日记',
  
  // 技术思考类
  '个人主页更新模块（202604.06）.md': '技术思考',
  '中共青海省委关于制定国民经济和社会发展第十五个五年规划的建议.md': '技术思考',
  '刘强东三大工作方法-氢能管培生的执行革命（2026.04）.md': '技术思考',
  '刘强东人事管理八项规定-氢能管培生的组织生存指南（2026.04）.md': '技术思考',
  '刘强东自我管理-对我这个氢能管培生的启示（2026.04）.md': '技术思考',
  
  // 摘录记录类
  '十个顶级 Claude Code Skills，装上就不想卸.md': '摘录记录',
  
  // 随笔思考类
  '做事情，很多时候不是这个事情本身，而是要.md': '随笔思考',
  '组织参加会议需要准备的事情：桌签（桌签的排布）、….md': '随笔思考',
  '要注意很多细节，包括茶叶不能太碎，换一个，还有就….md': '随笔思考'
};

async function cleanDuplicates(options = {}) {
  const dryRun = options.dryRun || false;
  const config = options.config || require('./utils/config').loadConfig();
  const vaultPath = config.obsidian.vaultPath;
  const blogPath = config.blog.blogPath;
  
  console.log('🧹 开始清理重复文件...\n');
  
  if (dryRun) {
    console.log('🔍 试运行模式（不会实际删除文件）\n');
  }
  
  // 查找重复文件
  const { duplicates } = await findDuplicates({ config });
  
  if (duplicates.length === 0) {
    console.log('✅ 没有重复文件需要清理');
    return { success: true, cleaned: 0 };
  }
  
  let cleanedCount = 0;
  const categoriesToRegenerate = new Set();
  
  for (const { filename, locations } of duplicates) {
    console.log(`📄 处理: ${filename}`);
    console.log(`   📂 出现在: ${locations.join(', ')}`);
    
    // 确定正确的分类
    const correctCategory = CORRECT_CATEGORIES[filename];
    
    if (!correctCategory) {
      console.log(`   ⚠️  无法确定正确分类，请手动处理`);
      console.log('');
      continue;
    }
    
    console.log(`   ✅ 正确分类: ${correctCategory}`);
    
    // 删除错误分类中的文件
    for (const location of locations) {
      if (location !== correctCategory) {
        const filePath = path.join(vaultPath, location, filename);
        
        try {
          if (await fs.pathExists(filePath)) {
            if (dryRun) {
              console.log(`   🗑️  将删除: ${filePath}`);
            } else {
              await fs.unlink(filePath);
              console.log(`   🗑️  已删除: ${location}/${filename}`);
            }
            
            categoriesToRegenerate.add(location);
            cleanedCount++;
          }
        } catch (error) {
          console.error(`   ❌ 删除失败: ${error.message}`);
        }
      }
    }
    
    // 同时删除blog中错误分类的文件
    const wrongBlogCategories = locations
      .map(loc => require('./utils/category-map').getBlogCategory(loc))
      .filter(cat => cat !== require('./utils/category-map').getBlogCategory(correctCategory));
    
    for (const wrongCat of wrongBlogCategories) {
      const blogCategoryPath = path.join(blogPath, wrongCat);
      
      if (await fs.pathExists(blogCategoryPath)) {
        const files = await fs.readdir(blogCategoryPath);
        const htmlFiles = files.filter(f => f.endsWith('.html'));
        
        // 查找匹配的文件（忽略时间戳）
        const fileKey = require('./utils/string-helpers').getFileKey(filename);
        const matchingFiles = htmlFiles.filter(f => {
          const htmlKey = require('./utils/string-helpers').getFileKey(f);
          return htmlKey === fileKey;
        });
        
        for (const matchingFile of matchingFiles) {
          const filePath = path.join(blogCategoryPath, matchingFile);
          
          try {
            if (dryRun) {
              console.log(`   🗑️  将删除: ${filePath}`);
            } else {
              await fs.unlink(filePath);
              console.log(`   🗑️  已删除: blog/${wrongCat}/${matchingFile}`);
            }
          } catch (error) {
            console.error(`   ❌ 删除失败: ${error.message}`);
          }
        }
      }
    }
    
    console.log('');
  }
  
  // 重新生成受影响的索引
  if (!dryRun && categoriesToRegenerate.size > 0) {
    console.log('🔄 重新生成受影响的索引...\n');
    
    for (const category of categoriesToRegenerate) {
      const blogCategory = require('./utils/category-map').getBlogCategory(category);
      
      try {
        await updateCategoryIndex(blogPath, blogCategory, null, null, [], '', '');
        console.log(`   ✅ 已更新: ${category} → blog/${blogCategory}/index.html`);
      } catch (error) {
        console.error(`   ❌ 更新失败: ${category} - ${error.message}`);
      }
    }
  }
  
  console.log('\n' + '='.repeat(60));
  if (dryRun) {
    console.log(`🔍 试运行完成，将清理 ${cleanedCount} 个文件`);
    console.log('   使用 --apply 参数执行实际清理');
  } else {
    console.log(`✅ 清理完成，共删除 ${cleanedCount} 个重复文件`);
  }
  console.log('='.repeat(60));
  
  return {
    success: true,
    cleaned: cleanedCount,
    dryRun
  };
}

// 命令行接口
if (require.main === module) {
  const args = process.argv.slice(2);
  const dryRun = !args.includes('--apply');
  
  cleanDuplicates({ dryRun })
    .then(result => {
      if (result.dryRun) {
        console.log('\n💡 要实际执行清理，请运行: node scripts/clean-duplicates.js --apply');
      }
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('清理失败:', error.message);
      process.exit(1);
    });
}

module.exports = { cleanDuplicates };
