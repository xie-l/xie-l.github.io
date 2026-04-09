#!/usr/bin/env node
// scripts/watch-obsidian.js

const chokidar = require('chokidar');
const path = require('path');
const ObsidianSync = require('./obsidian-sync');
const { loadConfig } = require('./utils/config');
const Logger = require('./utils/logger');

class ObsidianWatcher {
  constructor(options = {}) {
    this.config = options.config || loadConfig();
    this.logger = options.logger || new Logger(this.config.logging);
    this.sync = new ObsidianSync({ config: this.config, logger: this.logger });
    
    this.debounceTimers = new Map();
    this.debounceMs = this.config.watch.debounceMs || 1000;
  }

  start() {
    console.log('🚀 启动 Obsidian 文件监听...');
    console.log(`监听目录: ${this.config.obsidian.vaultPath}`);
    console.log('按 Ctrl+C 停止监听\n');
    
    const watcher = chokidar.watch(this.config.obsidian.vaultPath, {
      ignored: [
        '**/.obsidian/**',
        '**/templates/**',
        '**/*.tmp',
        '**/*.swp',
        '**/.DS_Store'
      ],
      ignoreInitial: true,
      persistent: true
    });
    
    watcher
      .on('add', (filePath) => this.handleFileChange('add', filePath))
      .on('change', (filePath) => this.handleFileChange('change', filePath))
      .on('unlink', (filePath) => this.handleFileDelete(filePath))
      .on('error', (error) => {
        this.logger.error('监听错误', { error: error.message });
      });
    
    process.on('SIGINT', () => {
      console.log('\n👋 停止监听');
      watcher.close();
      process.exit(0);
    });
  }

  handleFileChange(event, filePath) {
    const relativePath = path.relative(this.config.obsidian.vaultPath, filePath);
    
    if (!filePath.endsWith('.md')) {
      return;
    }
    
    console.log(`\n📝 检测到文件 ${event}: ${relativePath}`);
    
    if (this.debounceTimers.has(filePath)) {
      clearTimeout(this.debounceTimers.get(filePath));
    }
    
    this.debounceTimers.set(filePath, setTimeout(async () => {
      try {
        console.log(`🔄 开始同步: ${relativePath}`);
        
        const result = await this.sync.syncObsidianToBlog({ filePath: relativePath });
        
        if (result.success) {
          if (result.skipped) {
            console.log(`⏭️  跳过: ${relativePath} (草稿)`);
          } else {
            console.log(`✅ 同步成功: ${relativePath}`);
          }
        } else {
          console.error(`❌ 同步失败: ${result.error}`);
        }
      } catch (error) {
        console.error(`❌ 同步出错: ${error.message}`);
      }
      
      this.debounceTimers.delete(filePath);
    }, this.debounceMs));
  }

  handleFileDelete(filePath) {
    const relativePath = path.relative(this.config.obsidian.vaultPath, filePath);
    console.log(`\n🗑️  检测到文件删除: ${relativePath}`);
  }
}

if (require.main === module) {
  const watcher = new ObsidianWatcher();
  watcher.start();
}

module.exports = ObsidianWatcher;
