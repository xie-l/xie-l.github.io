// scripts/utils/config.js
const fs = require('fs-extra');
const path = require('path');

let configCache = null;
let configLastModified = null;

function loadConfig() {
  const configPath = path.join(process.cwd(), 'config', 'obsidian-sync.config.json');
  
  if (!fs.existsSync(configPath)) {
    throw new Error(`配置文件不存在: ${configPath}`);
  }
  
  const stats = fs.statSync(configPath);
  
  if (!configCache || stats.mtime > configLastModified) {
    configCache = fs.readJsonSync(configPath);
    configLastModified = stats.mtime;
  }
  
  return configCache;
}

function validateConfig(config) {
  const errors = [];
  
  if (!config.obsidian || !config.obsidian.vaultPath) {
    errors.push('缺少 obsidian.vaultPath 配置');
  }
  
  if (!config.blog || !config.blog.blogPath) {
    errors.push('缺少 blog.blogPath 配置');
  }
  
  const validCategories = ['quotes', 'thoughts', 'tech', 'life', 'books', 'analysis'];
  if (config.blog && config.blog.supportedCategories) {
    for (const category of config.blog.supportedCategories) {
      if (!validCategories.includes(category)) {
        errors.push(`无效的分类: ${category}`);
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

module.exports = { loadConfig, validateConfig };
