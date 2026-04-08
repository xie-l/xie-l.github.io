#!/usr/bin/env node

/**
 * 数据备份脚本
 * 备份data目录下的所有JSON文件到backups目录
 */

const fs = require('fs');
const path = require('path');

// 颜色输出
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
    log(`✓ ${message}`, 'green');
}

function logError(message) {
    log(`✗ ${message}`, 'red');
}

function logWarning(message) {
    log(`⚠ ${message}`, 'yellow');
}

function logInfo(message) {
    log(`ℹ ${message}`, 'blue');
}

// 确保目录存在
function ensureDir(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        logInfo(`创建目录: ${dirPath}`);
    }
}

// 生成时间戳
function getTimestamp() {
    const now = new Date();
    return now.toISOString().replace(/[:.]/g, '-').slice(0, -5); // YYYY-MM-DDTHH-MM-SS
}

// 备份文件
function backupFile(filePath, backupDir) {
    try {
        if (!fs.existsSync(filePath)) {
            logWarning(`文件不存在，跳过: ${path.basename(filePath)}`);
            return { success: false, skipped: true };
        }
        
        const fileName = path.basename(filePath);
        const timestamp = getTimestamp();
        const backupFileName = `${fileName}.${timestamp}.bak`;
        const backupPath = path.join(backupDir, backupFileName);
        
        // 读取原文件
        const content = fs.readFileSync(filePath, 'utf8');
        
        // 验证JSON格式
        try {
            JSON.parse(content);
        } catch (error) {
            logError(`文件不是有效的JSON: ${fileName}`);
            // 仍然备份，但标记为无效
            fs.writeFileSync(backupPath, content);
            logWarning(`备份无效JSON: ${backupFileName}`);
            return { success: true, valid: false, fileName: backupFileName };
        }
        
        // 写入备份
        fs.writeFileSync(backupPath, content);
        logSuccess(`备份成功: ${backupFileName}`);
        
        return { success: true, valid: true, fileName: backupFileName };
    } catch (error) {
        logError(`备份失败: ${error.message}`);
        return { success: false, error: error.message };
    }
}

// 清理旧备份
function cleanupOldBackups(backupDir, maxAgeDays = 7) {
    try {
        const files = fs.readdirSync(backupDir);
        const now = Date.now();
        const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000;
        let deletedCount = 0;
        
        files.forEach(file => {
            const filePath = path.join(backupDir, file);
            const stats = fs.statSync(filePath);
            const ageMs = now - stats.mtimeMs;
            
            if (ageMs > maxAgeMs) {
                fs.unlinkSync(filePath);
                deletedCount++;
                logInfo(`删除旧备份: ${file}`);
            }
        });
        
        if (deletedCount > 0) {
            logSuccess(`清理完成，删除 ${deletedCount} 个旧备份`);
        } else {
            logInfo('没有需要清理的旧备份');
        }
        
        return { success: true, deletedCount };
    } catch (error) {
        logError(`清理失败: ${error.message}`);
        return { success: false, error: error.message };
    }
}

// 主函数
function main() {
    console.log('═══════════════════════════════════════');
    logInfo('数据备份脚本');
    console.log('═══════════════════════════════════════\n');
    
    const dataDir = path.join(__dirname, '../data');
    const backupDir = path.join(__dirname, '../backups');
    
    // 确保目录存在
    ensureDir(backupDir);
    
    // 获取所有JSON文件
    const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'));
    
    if (files.length === 0) {
        logWarning('data目录下没有JSON文件');
        return;
    }
    
    logInfo(`找到 ${files.length} 个数据文件\n`);
    
    // 备份所有文件
    const results = [];
    files.forEach(file => {
        const filePath = path.join(dataDir, file);
        const result = backupFile(filePath, backupDir);
        results.push({ file, ...result });
    });
    
    // 统计结果
    const successfulBackups = results.filter(r => r.success && r.valid !== false).length;
    const invalidBackups = results.filter(r => r.valid === false).length;
    const failedBackups = results.filter(r => !r.success && !r.skipped).length;
    const skipped = results.filter(r => r.skipped).length;
    
    console.log('');
    console.log('═══════════════════════════════════════');
    logInfo('备份结果');
    console.log('═══════════════════════════════════════\n');
    
    logSuccess(`成功备份: ${successfulBackups}`);
    if (invalidBackups > 0) {
        logWarning(`无效JSON备份: ${invalidBackups}`);
    }
    if (failedBackups > 0) {
        logError(`失败: ${failedBackups}`);
    }
    if (skipped > 0) {
        logInfo(`跳过: ${skipped}`);
    }
    
    // 清理旧备份
    console.log('');
    logInfo('清理旧备份 (保留最近7天)...\n');
    cleanupOldBackups(backupDir, 7);
    
    console.log('');
    console.log('═══════════════════════════════════════');
    if (failedBackups === 0) {
        logSuccess('✅ 备份完成！');
        process.exit(0);
    } else {
        logError('❌ 备份完成，但有失败项');
        process.exit(1);
    }
}

// 运行
if (require.main === module) {
    main();
}

module.exports = { backupFile, cleanupOldBackups };
