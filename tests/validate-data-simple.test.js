#!/usr/bin/env node

/**
 * 简化版数据验证测试
 * 验证JSON数据格式是否符合要求（基于实际数据结构）
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

// 验证函数
const validators = {
    'pool-questions.json': (data) => {
        const errors = [];
        
        if (!Array.isArray(data)) {
            errors.push('数据必须是数组格式');
            return errors;
        }
        
        if (data.length === 0) {
            errors.push('问题列表不能为空');
            return errors;
        }
        
        if (data.length < 100) {
            logWarning(`问题数量较少: ${data.length} 个，建议至少100个`);
        }
        
        // 检查前10个样本
        const sampleSize = Math.min(10, data.length);
        for (let i = 0; i < sampleSize; i++) {
            const item = data[i];
            if (typeof item !== 'string') {
                errors.push(`[${i}]: 必须是字符串，实际为 ${typeof item}`);
            } else if (item.trim().length === 0) {
                errors.push(`[${i}]: 问题内容不能为空`);
            } else if (item.length < 5) {
                errors.push(`[${i}]: 问题太短: "${item}"`);
            }
        }
        
        // 检查是否有重复（样本检查）
        const sampleQuestions = data.slice(0, 50);
        const uniqueQuestions = new Set(sampleQuestions);
        if (uniqueQuestions.size < sampleQuestions.length * 0.9) {
            logWarning(`前50个问题中存在重复或相似内容`);
        }
        
        return errors;
    },
    
    'pool-keywords.json': (data) => {
        const errors = [];
        
        if (!Array.isArray(data)) {
            errors.push('数据必须是数组格式');
            return errors;
        }
        
        if (data.length === 0) {
            errors.push('词汇列表不能为空');
            return errors;
        }
        
        if (data.length < 50) {
            logWarning(`词汇数量较少: ${data.length} 个，建议至少50个`);
        }
        
        // 检查所有项目
        data.forEach((item, index) => {
            if (typeof item !== 'object' || item === null) {
                errors.push(`[${index}]: 必须是对象，实际为 ${typeof item}`);
                return;
            }
            
            if (!item.term || typeof item.term !== 'string') {
                errors.push(`[${index}]: 缺少术语(term)或不是字符串`);
            } else if (item.term.trim().length === 0) {
                errors.push(`[${index}]: 术语不能为空`);
            }
            
            if (!item.def || typeof item.def !== 'string') {
                errors.push(`[${index}]: 缺少定义(def)或不是字符串`);
            } else if (item.def.trim().length === 0) {
                errors.push(`[${index}]: 定义不能为空`);
            }
            
            // 检查HTML标签是否完整
            if (item.def && (item.def.includes('<strong>') && !item.def.includes('</strong>'))) {
                errors.push(`[${index}]: 定义中的HTML标签未闭合`);
            }
            
            if (item.domain && typeof item.domain !== 'string') {
                errors.push(`[${index}]: domain必须是字符串`);
            }
            
            if (item.eg && typeof item.eg !== 'string') {
                errors.push(`[${index}]: eg必须是字符串`);
            }
        });
        
        return errors;
    },
    
    'pool-data.json': (data) => {
        const errors = [];
        
        if (!Array.isArray(data)) {
            errors.push('数据必须是数组格式');
            return errors;
        }
        
        if (data.length === 0) {
            errors.push('数据集不能为空');
            return errors;
        }
        
        if (data.length < 20) {
            logWarning(`数据数量较少: ${data.length} 个，建议至少20个`);
        }
        
        // 检查所有项目
        data.forEach((item, index) => {
            if (typeof item !== 'object' || item === null) {
                errors.push(`[${index}]: 必须是对象，实际为 ${typeof item}`);
                return;
            }
            
            if (!item.topic || typeof item.topic !== 'string') {
                errors.push(`[${index}]: 缺少主题(topic)或不是字符串`);
            } else if (item.topic.trim().length === 0) {
                errors.push(`[${index}]: 主题不能为空`);
            }
            
            if (item.num === undefined || item.num === null) {
                errors.push(`[${index}]: 缺少数字(num)`);
            }
            
            if (!item.label || typeof item.label !== 'string') {
                errors.push(`[${index}]: 缺少单位(label)或不是字符串`);
            }
            
            if (!item.ctx || typeof item.ctx !== 'string') {
                errors.push(`[${index}]: 缺少背景(ctx)或不是字符串`);
            } else if (item.ctx.trim().length === 0) {
                errors.push(`[${index}]: 背景不能为空`);
            }
            
            if (!item.sense || typeof item.sense !== 'string') {
                errors.push(`[${index}]: 缺少数感(sense)或不是字符串`);
            } else if (item.sense.trim().length === 0) {
                errors.push(`[${index}]: 数感不能为空`);
            }
            
            if (!item.domain || typeof item.domain !== 'string') {
                errors.push(`[${index}]: 缺少领域(domain)或不是字符串`);
            }
        });
        
        return errors;
    },
    
    'news.json': (data) => {
        const errors = [];
        
        if (typeof data !== 'object' || data === null || Array.isArray(data)) {
            errors.push('数据必须是对象格式');
            return errors;
        }
        
        const feedTypes = Object.keys(data);
        if (feedTypes.length === 0) {
            errors.push('资讯分类不能为空');
            return errors;
        }
        
        feedTypes.forEach(feedType => {
            const feedData = data[feedType];
            
            if (typeof feedData !== 'object' || feedData === null) {
                errors.push(`${feedType}: 必须是对象`);
                return;
            }
            
            if (!feedData.updated || typeof feedData.updated !== 'string') {
                errors.push(`${feedType}: 缺少更新时间(updated)或不是字符串`);
            }
            
            if (!feedData.items || !Array.isArray(feedData.items)) {
                errors.push(`${feedType}: 缺少items或不是数组`);
                return;
            }
            
            if (feedData.items.length === 0) {
                logWarning(`${feedType}: items为空`);
            }
            
            feedData.items.forEach((item, index) => {
                if (typeof item !== 'object' || item === null) {
                    errors.push(`${feedType}[${index}]: 必须是对象`);
                    return;
                }
                
                // 标题可以是title或title_cn
                if (!item.title || typeof item.title !== 'string') {
                    errors.push(`${feedType}[${index}]: 缺少标题(title)或不是字符串`);
                } else if (item.title.trim().length === 0 && (!item.title_cn || item.title_cn.trim().length === 0)) {
                    errors.push(`${feedType}[${index}]: 标题不能为空`);
                }
                
                if (!item.link || typeof item.link !== 'string') {
                    errors.push(`${feedType}[${index}]: 缺少链接(link)或不是字符串`);
                } else if (!isValidUrl(item.link)) {
                    errors.push(`${feedType}[${index}]: 链接格式无效: ${item.link}`);
                }
                
                // source和time是可选字段（如果缺失会使用默认值）
                if (item.source && typeof item.source !== 'string') {
                    errors.push(`${feedType}[${index}]: source必须是字符串`);
                }
                
                if (item.time && typeof item.time !== 'string') {
                    errors.push(`${feedType}[${index}]: time必须是字符串`);
                }
                
                if (item.pubDate && typeof item.pubDate !== 'string') {
                    errors.push(`${feedType}[${index}]: pubDate必须是字符串`);
                }
            });
        });
        
        return errors;
    }
};

// 辅助函数
function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

// 验证单个文件
function validateFile(filePath) {
    const fileName = path.basename(filePath);
    const validator = validators[fileName];
    
    if (!validator) {
        logWarning(`未找到验证器: ${fileName}`);
        return { valid: false, errors: [], warnings: [`跳过: ${fileName}`] };
    }
    
    logInfo(`验证: ${fileName}`);
    
    // 读取文件
    let data;
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        data = JSON.parse(content);
    } catch (error) {
        return {
            valid: false,
            errors: [`无法读取或解析JSON: ${error.message}`],
            warnings: []
        };
    }
    
    // 运行验证
    const errors = validator(data);
    
    return {
        valid: errors.length === 0,
        errors,
        warnings: []
    };
}

// 运行所有测试
function runTests() {
    console.log('═══════════════════════════════════════');
    logInfo('数据验证测试开始 (简化版)');
    console.log('═══════════════════════════════════════\n');
    
    const dataDir = path.join(__dirname, '../data');
    const testFiles = Object.keys(validators);
    
    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;
    let totalErrors = 0;
    let totalWarnings = 0;
    
    testFiles.forEach(fileName => {
        const filePath = path.join(dataDir, fileName);
        
        if (!fs.existsSync(filePath)) {
            logWarning(`文件不存在: ${fileName}`);
            totalWarnings++;
            return;
        }
        
        totalTests++;
        
        const result = validateFile(filePath);
        
        if (result.valid) {
            logSuccess(`通过: ${fileName}`);
            passedTests++;
        } else {
            logError(`失败: ${fileName}`);
            failedTests++;
            totalErrors += result.errors.length;
            
            result.errors.forEach(error => {
                logError(`  - ${error}`);
            });
        }
        
        if (result.warnings && result.warnings.length > 0) {
            result.warnings.forEach(warning => {
                logWarning(`  - ${warning}`);
                totalWarnings++;
            });
        }
        
        console.log('');
    });
    
    // 总结
    console.log('═══════════════════════════════════════');
    logInfo('测试总结');
    console.log('═══════════════════════════════════════\n');
    
    logInfo(`总测试数: ${totalTests}`);
    logSuccess(`通过: ${passedTests}`);
    logError(`失败: ${failedTests}`);
    if (totalErrors > 0) {
        logError(`错误数: ${totalErrors}`);
    }
    if (totalWarnings > 0) {
        logWarning(`警告数: ${totalWarnings}`);
    }
    
    console.log('');
    
    if (failedTests === 0) {
        logSuccess('🎉 所有测试通过！');
        process.exit(0);
    } else {
        logError('❌ 部分测试失败，请修复后再提交');
        process.exit(1);
    }
}

// 运行测试
if (require.main === module) {
    runTests();
}

module.exports = { validateFile, validators };
