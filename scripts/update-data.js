#!/usr/bin/env node

/**
 * 数据更新脚本框架
 * 提供数据更新的基础设施和模板
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

// 配置
const CONFIG = {
    dataDir: path.join(__dirname, '../data'),
    backupDir: path.join(__dirname, '../backups'),
    maxItems: {
        questions: 1000,  // 最大问题数
        keywords: 1000,   // 最大词汇数
        data: 500,        // 最大数据数
        news: 100         // 每个资讯分类最大条数
    }
};

// 确保目录存在
function ensureDir(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        logInfo(`创建目录: ${dirPath}`);
    }
}

// 读取JSON文件
function readJSON(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(content);
    } catch (error) {
        logError(`读取JSON失败: ${error.message}`);
        return null;
    }
}

// 写入JSON文件（带格式化）
function writeJSON(filePath, data) {
    try {
        const json = JSON.stringify(data, null, 2);
        fs.writeFileSync(filePath, json, 'utf8');
        logSuccess(`写入成功: ${path.basename(filePath)}`);
        return true;
    } catch (error) {
        logError(`写入JSON失败: ${error.message}`);
        return false;
    }
}

// 备份文件
function backupFile(filePath) {
    const backupScript = path.join(__dirname, 'backup-data.js');
    if (fs.existsSync(backupScript)) {
        const backup = require('./backup-data.js');
        return backup.backupFile(filePath, CONFIG.backupDir);
    }
    logWarning('备份脚本不存在，跳过备份');
    return { success: false };
}

// 验证数据
function validateData(filePath) {
    const validatorScript = path.join(__dirname, '../tests/validate-data-simple.test.js');
    if (fs.existsSync(validatorScript)) {
        const validator = require(validatorScript);
        return validator.validateFile(filePath);
    }
    logWarning('验证脚本不存在，跳过验证');
    return { valid: true };
}

// 生成更新日志
function generateUpdateLog(dataType, changes) {
    const timestamp = new Date().toISOString();
    const logEntry = {
        timestamp,
        dataType,
        changes,
        version: `v${Date.now()}`
    };
    
    const logFile = path.join(CONFIG.dataDir, 'update-log.json');
    let logs = [];
    
    if (fs.existsSync(logFile)) {
        logs = readJSON(logFile) || [];
    }
    
    logs.unshift(logEntry);
    
    // 保留最近100条记录
    if (logs.length > 100) {
        logs = logs.slice(0, 100);
    }
    
    writeJSON(logFile, logs);
    return logEntry;
}

// ====================
// 数据更新模板
// ====================

const updaters = {
    /**
     * 更新每日三问
     * @param {Array<string>} newQuestions - 新问题数组
     * @param {Object} options - 选项
     */
    questions: (newQuestions, options = {}) => {
        const filePath = path.join(CONFIG.dataDir, 'pool-questions.json');
        
        logInfo(`更新每日三问: ${newQuestions.length} 个问题`);
        
        // 读取现有数据
        let existingData = readJSON(filePath) || [];
        logInfo(`现有数据: ${existingData.length} 个问题`);
        
        // 合并数据（去重）
        const merged = [...existingData];
        let added = 0;
        let duplicates = 0;
        
        newQuestions.forEach(q => {
            if (typeof q === 'string' && q.trim().length > 0) {
                if (!merged.includes(q)) {
                    merged.push(q);
                    added++;
                } else {
                    duplicates++;
                }
            }
        });
        
        // 限制最大数量
        if (merged.length > CONFIG.maxItems.questions) {
            logWarning(`数据量超过最大限制 (${CONFIG.maxItems.questions})，将截断`);
            merged.splice(CONFIG.maxItems.questions);
        }
        
        logInfo(`添加: ${added}, 重复: ${duplicates}, 总计: ${merged.length}`);
        
        // 备份
        if (!options.skipBackup) {
            backupFile(filePath);
        }
        
        // 写入
        if (writeJSON(filePath, merged)) {
            // 验证
            const validation = validateData(filePath);
            if (validation.valid) {
                logSuccess('更新成功并通过验证');
                
                // 记录日志
                generateUpdateLog('questions', {
                    added,
                    duplicates,
                    total: merged.length
                });
                
                return { success: true, added, duplicates, total: merged.length };
            } else {
                logError('验证失败');
                validation.errors.forEach(err => logError(`  - ${err}`));
                return { success: false, errors: validation.errors };
            }
        }
        
        return { success: false, error: '写入失败' };
    },
    
    /**
     * 更新每日五词
     * @param {Array<Object>} newKeywords - 新词汇数组
     */
    keywords: (newKeywords, options = {}) => {
        const filePath = path.join(CONFIG.dataDir, 'pool-keywords.json');
        
        logInfo(`更新每日五词: ${newKeywords.length} 个词汇`);
        
        let existingData = readJSON(filePath) || [];
        logInfo(`现有数据: ${existingData.length} 个词汇`);
        
        // 按term去重
        const existingTerms = new Set(existingData.map(k => k.term));
        let added = 0;
        let duplicates = 0;
        const merged = [...existingData];
        
        newKeywords.forEach(kw => {
            if (kw && kw.term && !existingTerms.has(kw.term)) {
                merged.push({
                    term: kw.term,
                    def: kw.def || '',
                    domain: kw.domain || '通用',
                    eg: kw.eg || ''
                });
                added++;
            } else {
                duplicates++;
            }
        });
        
        // 限制最大数量
        if (merged.length > CONFIG.maxItems.keywords) {
            logWarning(`数据量超过最大限制 (${CONFIG.maxItems.keywords})，将截断`);
            merged.splice(CONFIG.maxItems.keywords);
        }
        
        logInfo(`添加: ${added}, 重复: ${duplicates}, 总计: ${merged.length}`);
        
        if (!options.skipBackup) {
            backupFile(filePath);
        }
        
        if (writeJSON(filePath, merged)) {
            const validation = validateData(filePath);
            if (validation.valid) {
                logSuccess('更新成功并通过验证');
                generateUpdateLog('keywords', {
                    added,
                    duplicates,
                    total: merged.length
                });
                return { success: true, added, duplicates, total: merged.length };
            } else {
                logError('验证失败');
                validation.errors.forEach(err => logError(`  - ${err}`));
                return { success: false, errors: validation.errors };
            }
        }
        
        return { success: false, error: '写入失败' };
    },
    
    /**
     * 更新今日数感
     * @param {Array<Object>} newData - 新数据数组
     */
    data: (newData, options = {}) => {
        const filePath = path.join(CONFIG.dataDir, 'pool-data.json');
        
        logInfo(`更新今日数感: ${newData.length} 条数据`);
        
        let existingData = readJSON(filePath) || [];
        logInfo(`现有数据: ${existingData.length} 条`);
        
        // 按topic去重
        const existingTopics = new Set(existingData.map(d => d.topic));
        let added = 0;
        let duplicates = 0;
        const merged = [...existingData];
        
        newData.forEach(ds => {
            if (ds && ds.topic && !existingTopics.has(ds.topic)) {
                merged.push({
                    topic: ds.topic,
                    num: ds.num || 0,
                    label: ds.label || '',
                    ctx: ds.ctx || '',
                    sense: ds.sense || '',
                    domain: ds.domain || '数据'
                });
                added++;
            } else {
                duplicates++;
            }
        });
        
        // 限制最大数量
        if (merged.length > CONFIG.maxItems.data) {
            logWarning(`数据量超过最大限制 (${CONFIG.maxItems.data})，将截断`);
            merged.splice(CONFIG.maxItems.data);
        }
        
        logInfo(`添加: ${added}, 重复: ${duplicates}, 总计: ${merged.length}`);
        
        if (!options.skipBackup) {
            backupFile(filePath);
        }
        
        if (writeJSON(filePath, merged)) {
            const validation = validateData(filePath);
            if (validation.valid) {
                logSuccess('更新成功并通过验证');
                generateUpdateLog('data', {
                    added,
                    duplicates,
                    total: merged.length
                });
                return { success: true, added, duplicates, total: merged.length };
            } else {
                logError('验证失败');
                validation.errors.forEach(err => logError(`  - ${err}`));
                return { success: false, errors: validation.errors };
            }
        }
        
        return { success: false, error: '写入失败' };
    }
};

// ====================
// CLI命令处理
// ====================

function showHelp() {
    console.log(`
═══════════════════════════════════════
数据更新脚本
═══════════════════════════════════════

用法:
  node update-data.js <command> [options]

命令:
  questions <file>    从JSON文件更新问题
  keywords <file>     从JSON文件更新词汇
  data <file>         从JSON文件更新数据
  validate            验证所有数据文件
  help                显示帮助

示例:
  node update-data.js questions ./new-questions.json
  node update-data.js keywords ./new-keywords.json
  node update-data.js validate

选项:
  --skip-backup       跳过备份步骤
  --dry-run           试运行，不实际写入
`);
}

// 主函数
function main() {
    const args = process.argv.slice(2);
    
    if (args.length === 0 || args[0] === 'help' || args[0] === '--help') {
        showHelp();
        return;
    }
    
    const command = args[0];
    const filePath = args[1];
    const options = {
        skipBackup: args.includes('--skip-backup'),
        dryRun: args.includes('--dry-run')
    };
    
    console.log('═══════════════════════════════════════');
    logInfo(`执行命令: ${command}`);
    console.log('═══════════════════════════════════════\n');
    
    switch (command) {
        case 'questions':
        case 'keywords':
        case 'data':
            if (!filePath) {
                logError('请指定输入文件');
                process.exit(1);
            }
            
            if (!fs.existsSync(filePath)) {
                logError(`文件不存在: ${filePath}`);
                process.exit(1);
            }
            
            const newData = readJSON(filePath);
            if (!newData || !Array.isArray(newData)) {
                logError('输入文件必须是JSON数组');
                process.exit(1);
            }
            
            const result = updaters[command](newData, options);
            
            if (result.success) {
                logSuccess(`更新成功: ${result.added} 条添加, ${result.total} 条总计`);
                process.exit(0);
            } else {
                logError(`更新失败: ${result.error || '验证错误'}`);
                process.exit(1);
            }
            break;
            
        case 'validate':
            const validatorScript = path.join(__dirname, '../tests/validate-data-simple.test.js');
            if (fs.existsSync(validatorScript)) {
                const validator = require(validatorScript);
                validator.runTests();
            } else {
                logError('验证脚本不存在');
                process.exit(1);
            }
            break;
            
        default:
            logError(`未知命令: ${command}`);
            showHelp();
            process.exit(1);
    }
}

// 运行
if (require.main === module) {
    main();
}

module.exports = { updaters, CONFIG };
