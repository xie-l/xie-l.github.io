#!/usr/bin/env node

/**
 * 数据验证测试
 * 验证JSON数据格式是否符合要求
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

// 验证规则定义
const VALIDATION_RULES = {
    'pool-questions.json': {
        description: '每日三问数据',
        structure: {
            type: 'array',
            minItems: 3,
            items: {
                type: 'object',
                required: ['date', 'questions'],
                properties: {
                    date: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
                    questions: {
                        type: 'array',
                        minItems: 3,
                        maxItems: 3,
                        items: {
                            type: 'object',
                            required: ['question'],
                            properties: {
                                question: { type: 'string', minLength: 1 }
                            }
                        }
                    }
                }
            }
        },
        businessRules: (data) => {
            const errors = [];
            
            if (!Array.isArray(data)) {
                errors.push('数据必须是数组格式');
                return errors;
            }
            
            data.forEach((item, index) => {
                if (!item.date || !item.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
                    errors.push(`[${index}]: 日期格式无效: ${item.date}`);
                }
                if (!item.questions || item.questions.length !== 3) {
                    errors.push(`[${index}]: 问题数量必须为3个，实际: ${item.questions ? item.questions.length : 0}`);
                }
                if (item.questions) {
                    item.questions.forEach((q, qIndex) => {
                        if (!q.question || q.question.trim().length === 0) {
                            errors.push(`[${index}].questions[${qIndex}]: 问题内容不能为空`);
                        }
                    });
                }
            });
            
            return errors;
        }
    },
    'pool-keywords.json': {
        description: '每日五词数据',
        structure: {
            type: 'array',
            items: {
                type: 'object',
                required: ['term', 'def'],
                properties: {
                    term: { type: 'string', minLength: 1 },
                    def: { type: 'string', minLength: 1 },
                    domain: { type: 'string' },
                    eg: { type: 'string' }
                }
            }
        },
        businessRules: (data) => {
            const errors = [];
            
            if (!Array.isArray(data)) {
                errors.push('数据必须是数组格式');
                return errors;
            }
            
            if (data.length === 0) {
                errors.push('词汇列表不能为空');
                return errors;
            }
            
            data.forEach((kw, index) => {
                if (!kw.term || kw.term.trim().length === 0) {
                    errors.push(`[${index}]: 术语不能为空`);
                }
                if (!kw.def || kw.def.trim().length === 0) {
                    errors.push(`[${index}]: 定义不能为空`);
                }
            });
            
            return errors;
        }
    },
    'pool-data.json': {
        description: '今日数感数据',
        structure: {
            type: 'array',
            items: {
                type: 'object',
                required: ['topic', 'num', 'label', 'ctx', 'sense', 'domain'],
                properties: {
                    topic: { type: 'string', minLength: 1 },
                    num: { type: ['string', 'number'] },
                    label: { type: 'string' },
                    ctx: { type: 'string', minLength: 1 },
                    sense: { type: 'string', minLength: 1 },
                    domain: { type: 'string' }
                }
            }
        },
        businessRules: (data) => {
            const errors = [];
            
            if (!Array.isArray(data)) {
                errors.push('数据必须是数组格式');
                return errors;
            }
            
            if (data.length === 0) {
                errors.push('数据集不能为空');
                return errors;
            }
            
            data.forEach((ds, index) => {
                if (!ds.topic || ds.topic.trim().length === 0) {
                    errors.push(`[${index}]: 主题不能为空`);
                }
                if (ds.num === undefined || ds.num === null) {
                    errors.push(`[${index}]: 数字不能为空`);
                }
                if (!ds.ctx || ds.ctx.trim().length === 0) {
                    errors.push(`[${index}]: 背景不能为空`);
                }
                if (!ds.sense || ds.sense.trim().length === 0) {
                    errors.push(`[${index}]: 数感不能为空`);
                }
            });
            
            return errors;
        }
    },
    'news.json': {
        description: '资讯数据',
        structure: {
            type: 'object',
            patternProperties: {
                '^[a-z_]+$': {
                    type: 'object',
                    required: ['updated', 'items'],
                    properties: {
                        updated: { type: 'string', minLength: 1 },
                        items: {
                            type: 'array',
                            items: {
                                type: 'object',
                                required: ['title', 'link', 'source', 'time'],
                                properties: {
                                    title: { type: 'string', minLength: 1 },
                                    link: { type: 'string', format: 'uri' },
                                    source: { type: 'string', minLength: 1 },
                                    time: { type: 'string', minLength: 1 },
                                    summary: { type: 'string' }
                                }
                            }
                        }
                    }
                }
            }
        },
        businessRules: (data) => {
            const errors = [];
            Object.entries(data).forEach(([feedType, feedData]) => {
                if (!feedData.updated || feedData.updated.trim().length === 0) {
                    errors.push(`${feedType}: 更新时间不能为空`);
                }
                if (!feedData.items || !Array.isArray(feedData.items)) {
                    errors.push(`${feedType}: items必须是数组`);
                } else {
                    feedData.items.forEach((item, index) => {
                        if (!item.title || item.title.trim().length === 0) {
                            errors.push(`${feedType}[${index}]: 标题不能为空`);
                        }
                        if (!item.link || !isValidUrl(item.link)) {
                            errors.push(`${feedType}[${index}]: 链接格式无效`);
                        }
                    });
                }
            });
            return errors;
        }
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

function validateStructure(data, schema, path = '') {
    const errors = [];
    
    // 验证类型
    if (schema.type) {
        const actualType = Array.isArray(data) ? 'array' : typeof data;
        if (actualType !== schema.type) {
            errors.push(`${path}: 类型应为 ${schema.type}, 实际为 ${actualType}`);
            return errors; // 类型错误，不再继续验证
        }
    }
    
    // 验证必需字段
    if (schema.required && Array.isArray(schema.required)) {
        schema.required.forEach(field => {
            if (data[field] === undefined) {
                errors.push(`${path}: 缺少必需字段 "${field}"`);
            }
        });
    }
    
    // 验证对象属性
    if (schema.type === 'object' && schema.properties) {
        Object.entries(schema.properties).forEach(([key, propSchema]) => {
            if (data[key] !== undefined) {
                errors.push(...validateStructure(data[key], propSchema, `${path}.${key}`));
            }
        });
    }
    
    // 验证数组元素
    if (schema.type === 'array' && schema.items) {
        data.forEach((item, index) => {
            errors.push(...validateStructure(item, schema.items, `${path}[${index}]`));
        });
    }
    
    // 验证模式属性（如日期模式）
    if (schema.type === 'object' && schema.patternProperties) {
        Object.entries(data).forEach(([key, value]) => {
            const matchingPattern = Object.keys(schema.patternProperties).find(pattern => {
                const regex = new RegExp(pattern);
                return regex.test(key);
            });
            
            if (matchingPattern) {
                const propSchema = schema.patternProperties[matchingPattern];
                errors.push(...validateStructure(value, propSchema, `${path}["${key}"]`));
            }
        });
    }
    
    // 验证字符串长度
    if (schema.minLength && typeof data === 'string') {
        if (data.length < schema.minLength) {
            errors.push(`${path}: 字符串长度至少为 ${schema.minLength}`);
        }
    }
    
    // 验证数组长度
    if (schema.minItems && Array.isArray(data)) {
        if (data.length < schema.minItems) {
            errors.push(`${path}: 数组元素至少为 ${schema.minItems} 个`);
        }
    }
    
    if (schema.maxItems && Array.isArray(data)) {
        if (data.length > schema.maxItems) {
            errors.push(`${path}: 数组元素至多为 ${schema.maxItems} 个`);
        }
    }
    
    return errors;
}

// 主验证函数
function validateDataFile(filePath) {
    const fileName = path.basename(filePath);
    const rule = VALIDATION_RULES[fileName];
    
    if (!rule) {
        logWarning(`未找到验证规则: ${fileName}`);
        return { valid: true, errors: [], warnings: [`未找到验证规则: ${fileName}`] };
    }
    
    logInfo(`验证 ${rule.description}: ${fileName}`);
    
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
    
    // 验证结构
    const structureErrors = validateStructure(data, rule.structure, 'root');
    
    // 验证业务规则
    const businessErrors = rule.businessRules ? rule.businessRules(data) : [];
    
    const allErrors = [...structureErrors, ...businessErrors];
    
    return {
        valid: allErrors.length === 0,
        errors: allErrors,
        warnings: []
    };
}

// 运行测试
function runTests() {
    console.log('═══════════════════════════════════════');
    logInfo('数据验证测试开始');
    console.log('═══════════════════════════════════════\n');
    
    const dataDir = path.join(__dirname, '../data');
    const testFiles = Object.keys(VALIDATION_RULES);
    
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
        logInfo(`测试文件: ${fileName}`);
        
        const result = validateDataFile(filePath);
        
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
    logError(`错误数: ${totalErrors}`);
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

module.exports = { validateDataFile, VALIDATION_RULES };
