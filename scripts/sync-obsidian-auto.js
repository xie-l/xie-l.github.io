#!/usr/bin/env node
// scripts/sync-obsidian-auto.js
// 自动化同步脚本 - 一键同步所有Obsidian文件到博客

const ObsidianSync = require('./obsidian-sync');
const Logger = require('./utils/logger');
const { loadConfig } = require('./utils/config');

async function main() {
  const startTime = Date.now();
  
  try {
    // 加载配置
    const config = loadConfig();
    const logger = new Logger(config.logging);
    
    logger.info('========== Obsidian 自动同步开始 ==========');
    
    // 创建同步实例
    const sync = new ObsidianSync({ config, logger });
    
    // 执行同步
    logger.info('开始同步所有Obsidian文件到博客...');
    const results = await sync.syncObsidianToBlog();
    
    // 统计结果
    const total = results.length;
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    const skipped = results.filter(r => r.skipped).length;
    
    // 输出详细结果
    logger.info('========== 同步结果 ==========');
    logger.info(`总计: ${total} 个文件`);
    logger.info(`成功: ${successful} 个文件`);
    logger.info(`跳过: ${skipped} 个文件`);
    logger.info(`失败: ${failed} 个文件`);
    
    if (failed > 0) {
      logger.warn('失败的文件:');
      results.filter(r => !r.success).forEach(r => {
        logger.warn(`  - ${r.error}`);
      });
    }
    
    // 输出成功的文件
    const successfulSyncs = results.filter(r => r.success && !r.skipped);
    if (successfulSyncs.length > 0) {
      logger.info('同步成功的文件:');
      successfulSyncs.forEach(r => {
        logger.info(`  ✓ ${path.basename(r.source)} -> ${path.basename(r.target)}`);
      });
    }
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    logger.info(`========== 同步完成 (耗时: ${duration}s) ==========`);
    
    // 如果有失败，退出码为1
    if (failed > 0) {
      process.exit(1);
    }
    
  } catch (error) {
    console.error('同步出错:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

const path = require('path');

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = { main };
