// scripts/utils/backup.js
const fs = require('fs-extra');
const path = require('path');

async function createBackup(filePath, backupDir = './backups/obsidian-sync') {
  if (!await fs.pathExists(filePath)) {
    throw new Error(`文件不存在: ${filePath}`);
  }
  
  await fs.ensureDir(backupDir);
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = path.basename(filePath);
  const backupPath = path.join(backupDir, `${timestamp}-${fileName}`);
  
  await fs.copy(filePath, backupPath);
  
  return backupPath;
}

async function restoreFromBackup(backupPath, originalPath) {
  if (!await fs.pathExists(backupPath)) {
    throw new Error(`备份文件不存在: ${backupPath}`);
  }
  
  await fs.copy(backupPath, originalPath);
  
  return originalPath;
}

async function cleanupOldBackups(backupDir = './backups/obsidian-sync', maxBackups = 10) {
  const files = await fs.readdir(backupDir);
  const backupFiles = files
    .filter(file => file.endsWith('.md') || file.endsWith('.html'))
    .map(file => ({
      name: file,
      path: path.join(backupDir, file),
      mtime: fs.statSync(path.join(backupDir, file)).mtime
    }))
    .sort((a, b) => b.mtime - a.mtime);
  
  const filesToDelete = backupFiles.slice(maxBackups);
  
  for (const file of filesToDelete) {
    await fs.remove(file.path);
  }
  
  return filesToDelete.length;
}

module.exports = { createBackup, restoreFromBackup, cleanupOldBackups };
