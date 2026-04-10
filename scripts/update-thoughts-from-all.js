#!/usr/bin/env node
// 从所有分类中收集thoughts文章并更新thoughts索引

const fs = require('fs-extra');
const path = require('path');

async function updateThoughtsFromAll() {
  console.log('=== 从所有分类收集thoughts文章 ===');
  
  const blogIndexPath = path.join(__dirname, '..', 'data', 'blog-index.json');
  const blogIndex = await fs.readJson(blogIndexPath);
  
  // 筛选thoughts分类的文章
  const thoughtsPosts = blogIndex.posts.filter(p => p.category === 'thoughts');
  
  console.log(`找到 ${thoughtsPosts.length} 篇thoughts文章`);
  
  // 复制thoughts文章到thoughts目录（如果还没有）
  const thoughtsPath = path.join(__dirname, '..', 'blog', 'thoughts');
  await fs.ensureDir(thoughtsPath);
  
  let copiedCount = 0;
  
  for (const post of thoughtsPosts) {
    const sourcePath = path.join(__dirname, '..', post.path);
    const destPath = path.join(thoughtsPath, path.basename(post.path));
    
    // 检查文件是否存在
    if (!await fs.pathExists(destPath)) {
      await fs.copy(sourcePath, destPath);
      copiedCount++;
      console.log(`✓ 复制: ${post.title}`);
    }
  }
  
  console.log(`✓ 复制了 ${copiedCount} 个新文件`);
  
  // 更新thoughts索引
  const { updateThoughtsIndex } = require('./update-thoughts-index');
  await updateThoughtsIndex();
}

// 如果直接运行
if (require.main === module) {
  updateThoughtsFromAll().catch(err => {
    console.error('更新失败:', err);
    process.exit(1);
  });
}

module.exports = { updateThoughtsFromAll };
