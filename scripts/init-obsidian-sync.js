#!/usr/bin/env node
// scripts/init-obsidian-sync.js

const fs = require('fs-extra');
const path = require('path');

async function init() {
  console.log('🚀 初始化 Obsidian 同步系统...\n');
  
  const directories = [
    'obsidian-vault',
    'obsidian-vault/templates',
    'obsidian-vault/attachments',
    'obsidian-vault/摘录记录',
    'obsidian-vault/随笔思考',
    'obsidian-vault/技术思考',
    'obsidian-vault/生活日记',
    'obsidian-vault/书籍阅读',
    'obsidian-vault/数据分析',
    'obsidian-vault/文件管理',
    'obsidian-vault/文件管理/文件说明',
    'config',
    'logs',
    'backups/obsidian-sync'
  ];
  
  console.log('📁 创建目录结构...');
  for (const dir of directories) {
    await fs.ensureDir(dir);
    console.log(`  ✓ ${dir}`);
  }
  
  const configPath = 'config/obsidian-sync.config.json';
  if (!await fs.pathExists(configPath)) {
    console.log('\n⚙️  创建配置文件...');
    
    const defaultConfig = {
      obsidian: {
        vaultPath: "./obsidian-vault",
        attachmentsPath: "./obsidian-vault/attachments",
        supportedExtensions: [".md", ".markdown"],
        ignoreFolders: [".obsidian", "templates", "drafts"],
        ignoreFiles: [".DS_Store", "Thumbs.db", "*.tmp", "*.swp"],
        encoding: "utf8"
      },
      blog: {
        blogPath: "./blog",
        imgPath: "./img/blog",
        filesPath: "./files",
        supportedCategories: ["quotes", "thoughts", "tech", "life", "books", "analysis"],
        indexFiles: ["index.html"],
        postTemplate: "./templates/blog-post.html",
        encoding: "utf8"
      },
      sync: {
        direction: "both",
        autoBackup: true,
        backupPath: "./backups/obsidian-sync",
        maxBackups: 10,
        backupRetentionDays: 30,
        conflictResolution: "timestamp",
        defaultStatus: "draft",
        validateFrontmatter: true
      },
      images: {
        maxSize: 5242880,
        compress: false,
        compressionQuality: 80,
        supportedFormats: [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"],
        generateThumbnails: false,
        thumbnailWidth: 300,
        lazyLoad: true,
        lightbox: true
      },
      files: {
        maxSize: 104857600,
        supportedTypes: ["photos", "documents", "archives"],
        autoIndex: true,
        generateThumbnails: true
      },
      conversion: {
        markdownEngine: "marked",
        highlightCode: true,
        codeTheme: "github",
        processInternalLinks: true,
        processEmbeds: true,
        removeComments: true,
        processTasks: true
      },
      logging: {
        level: "info",
        maxLogSize: "10MB",
        maxLogFiles: 5,
        logToFile: true,
        logToConsole: true
      },
      watch: {
        enabled: false,
        debounceMs: 1000,
        excludedPatterns: ["**/*.tmp", "**/*.swp", "**/.DS_Store"]
      },
      templates: {
        frontmatter: {
          required: ["title", "date", "category", "status"],
          optional: ["tags", "description", "image", "author"]
        }
      }
    };
    
    await fs.writeJson(configPath, defaultConfig, { spaces: 2 });
    console.log(`  ✓ ${configPath}`);
  }
  
  const templatePath = 'obsidian-vault/templates/blog-post-template.md';
  if (!await fs.pathExists(templatePath)) {
    console.log('\n📝 创建笔记模板...');
    
    const templateContent = `---
title: <% tp.file.title %>
date: <% tp.date.now("YYYY-MM-DD") %>
category: tech
status: draft
tags: []
description: 
---

# <% tp.file.title %>

<% tp.file.cursor() %>
`;
    
    await fs.writeFile(templatePath, templateContent);
    console.log(`  ✓ ${templatePath}`);
  }
  
  console.log('\n✅ 初始化完成！');
  console.log('\n下一步:');
  console.log('1. 在 Obsidian 中打开 obsidian-vault/ 文件夹');
  console.log('2. 安装推荐插件: Templater, Dataview, Calendar');
  console.log('3. 运行: node scripts/obsidian-sync.js --direction obsidian-to-blog');
  console.log('4. 或启动监听: node scripts/watch-obsidian.js');
}

if (require.main === module) {
  init().catch(error => {
    console.error('初始化失败:', error.message);
    process.exit(1);
  });
}

module.exports = { init };
