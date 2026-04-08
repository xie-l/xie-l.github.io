#!/usr/bin/env node

/**
 * 数据加载调试脚本
 * 模拟浏览器中的数据加载过程
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 数据加载调试开始...\n');

// 模拟 getTodayKey 函数
function getTodayKey(date = new Date()) {
    const hour = date.getHours();
    if (hour < 8) {
        date.setDate(date.getDate() - 1);
    }
    return date.toISOString().split('T')[0];
}

// 模拟加载函数
async function debugLoadDailyQuestions() {
    console.log('📋 调试: loadDailyQuestions');
    
    try {
        const todayKey = getTodayKey();
        console.log(`  今日日期键: ${todayKey}`);
        
        const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/pool-questions.json'), 'utf8'));
        console.log(`  数据类型: ${Array.isArray(data) ? 'array' : typeof data}`);
        console.log(`  数据长度: ${data.length}`);
        
        // 检查数据格式
        if (Array.isArray(data)) {
            console.log('  ✅ 数据是数组格式');
            console.log(`  前3个问题: ${JSON.stringify(data.slice(0, 3), null, 2)}`);
            
            // 模拟渲染
            const questions = data.slice(0, 3);
            console.log(`  将渲染 ${questions.length} 个问题`);
            
            return { success: true, format: 'array', count: data.length };
        } else if (typeof data === 'object' && data[todayKey]) {
            console.log('  ✅ 数据是对象格式（按日期索引）');
            const todayData = data[todayKey];
            console.log(`  今日数据: ${JSON.stringify(todayData, null, 2)}`);
            
            return { success: true, format: 'object', todayKey };
        } else {
            console.log('  ❌ 数据格式不匹配');
            console.log(`  期望: 数组或对象[${todayKey}]`);
            console.log(`  实际: ${typeof data}`);
            
            return { success: false, error: 'format_mismatch', format: typeof data };
        }
    } catch (error) {
        console.log(`  ❌ 加载失败: ${error.message}`);
        return { success: false, error: error.message };
    }
}

async function debugLoadDailyKeywords() {
    console.log('\n📋 调试: loadDailyKeywords');
    
    try {
        const todayKey = getTodayKey();
        console.log(`  今日日期键: ${todayKey}`);
        
        const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/pool-keywords.json'), 'utf8'));
        console.log(`  数据类型: ${Array.isArray(data) ? 'array' : typeof data}`);
        console.log(`  数据长度: ${data.length}`);
        
        if (Array.isArray(data)) {
            console.log('  ✅ 数据是数组格式');
            console.log(`  前1个词汇: ${JSON.stringify(data[0], null, 2)}`);
            
            const keywords = data.slice(0, 5);
            console.log(`  将渲染 ${keywords.length} 个词汇`);
            
            return { success: true, format: 'array', count: data.length };
        } else if (typeof data === 'object' && data[todayKey]) {
            console.log('  ✅ 数据是对象格式（按日期索引）');
            const todayData = data[todayKey];
            console.log(`  今日数据: ${JSON.stringify(todayData, null, 2)}`);
            
            return { success: true, format: 'object', todayKey };
        } else {
            console.log('  ❌ 数据格式不匹配');
            return { success: false, error: 'format_mismatch', format: typeof data };
        }
    } catch (error) {
        console.log(`  ❌ 加载失败: ${error.message}`);
        return { success: false, error: error.message };
    }
}

async function debugLoadDailyData() {
    console.log('\n📋 调试: loadDailyData');
    
    try {
        const todayKey = getTodayKey();
        console.log(`  今日日期键: ${todayKey}`);
        
        const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/pool-data.json'), 'utf8'));
        console.log(`  数据类型: ${Array.isArray(data) ? 'array' : typeof data}`);
        console.log(`  数据长度: ${data.length}`);
        
        if (Array.isArray(data)) {
            console.log('  ✅ 数据是数组格式');
            console.log(`  第1个数据: ${JSON.stringify(data[0], null, 2)}`);
            
            const datasets = data.slice(0, 6);
            console.log(`  将渲染 ${datasets.length} 个数据集`);
            
            return { success: true, format: 'array', count: data.length };
        } else if (typeof data === 'object' && data[todayKey]) {
            console.log('  ✅ 数据是对象格式（按日期索引）');
            const todayData = data[todayKey];
            console.log(`  今日数据: ${JSON.stringify(todayData, null, 2)}`);
            
            return { success: true, format: 'object', todayKey };
        } else {
            console.log('  ❌ 数据格式不匹配');
            return { success: false, error: 'format_mismatch', format: typeof data };
        }
    } catch (error) {
        console.log(`  ❌ 加载失败: ${error.message}`);
        return { success: false, error: error.message };
    }
}

// 运行调试
async function main() {
    console.log('═══════════════════════════════════════');
    console.log('数据加载调试');
    console.log('═══════════════════════════════════════\n');
    
    const results = {};
    results.questions = await debugLoadDailyQuestions();
    results.keywords = await debugLoadDailyKeywords();
    results.data = await debugLoadDailyData();
    
    // 总结
    console.log('\n═══════════════════════════════════════');
    console.log('调试结果总结');
    console.log('═══════════════════════════════════════\n');
    
    const allPassed = Object.values(results).every(r => r.success);
    
    if (allPassed) {
        console.log('✅ 所有数据加载调试通过！');
        console.log('\n问题分析:');
        console.log('  - 数据文件存在且格式正确');
        console.log('  - 数据是数组格式（非日期索引）');
        console.log('  - 需要在加载函数中适配数组格式');
        process.exit(0);
    } else {
        console.log('❌ 部分数据加载调试失败');
        console.log('\n问题分析:');
        Object.entries(results).forEach(([key, result]) => {
            if (!result.success) {
                console.log(`  - ${key}: ${result.error}`);
            }
        });
        process.exit(1);
    }
}

// 运行
if (require.main === module) {
    main();
}

module.exports = { debugLoadDailyQuestions, debugLoadDailyKeywords, debugLoadDailyData };
