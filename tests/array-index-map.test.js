#!/usr/bin/env node

/**
 * 数组索引映射测试
 * 验证日期到数组索引的映射函数
 */

const assert = require('assert');

/**
 * 将日期字符串转换为数组索引
 * @param {string} dateStr - 日期字符串 (YYYY-MM-DD)
 * @param {number} arrayLength - 数组长度
 * @returns {number} 数组索引
 */
function dateToIndex(dateStr, arrayLength) {
    // 使用日期的哈希值对数组长度取模
    const hash = dateStr.split('').reduce((acc, char) => {
        return acc + char.charCodeAt(0);
    }, 0);
    return Math.abs(hash) % arrayLength;
}

/**
 * 获取今日数据项
 * @param {Array} array - 数据数组
 * @param {number} count - 需要获取的项数
 * @param {Date} date - 日期
 * @returns {Array} 数据项
 */
function getTodayItems(array, count, date = new Date()) {
    if (!Array.isArray(array) || array.length === 0) {
        return [];
    }
    
    const dateStr = date.toISOString().split('T')[0];
    const startIndex = dateToIndex(dateStr, array.length);
    
    // 确保不越界
    const result = [];
    for (let i = 0; i < count; i++) {
        const index = (startIndex + i) % array.length;
        result.push(array[index]);
    }
    
    return result;
}

// 测试用例
function runTests() {
    console.log('═══════════════════════════════════════');
    console.log('数组索引映射测试');
    console.log('═══════════════════════════════════════\n');
    
    let passed = 0;
    let failed = 0;
    
    // 测试1: dateToIndex 函数
    try {
        const index1 = dateToIndex('2026-04-08', 100);
        const index2 = dateToIndex('2026-04-08', 100);
        assert.strictEqual(index1, index2, '同一日期应返回相同索引');
        console.log('✅ 测试1通过: dateToIndex 确定性');
        passed++;
    } catch (error) {
        console.log(`❌ 测试1失败: ${error.message}`);
        failed++;
    }
    
    // 测试2: 不同日期返回不同索引
    try {
        const index1 = dateToIndex('2026-04-08', 100);
        const index2 = dateToIndex('2026-04-09', 100);
        assert.notStrictEqual(index1, index2, '不同日期应返回不同索引');
        console.log('✅ 测试2通过: dateToIndex 区分不同日期');
        passed++;
    } catch (error) {
        console.log(`❌ 测试2失败: ${error.message}`);
        failed++;
    }
    
    // 测试3: 索引在范围内
    try {
        const index = dateToIndex('2026-04-08', 100);
        assert(index >= 0 && index < 100, '索引应在 [0, length) 范围内');
        console.log('✅ 测试3通过: 索引范围正确');
        passed++;
    } catch (error) {
        console.log(`❌ 测试3失败: ${error.message}`);
        failed++;
    }
    
    // 测试4: getTodayItems 基本功能
    try {
        const testData = ['a', 'b', 'c', 'd', 'e'];
        const items = getTodayItems(testData, 3, new Date('2026-04-08'));
        assert.strictEqual(items.length, 3, '应返回指定数量的项');
        assert(Array.isArray(items), '应返回数组');
        console.log('✅ 测试4通过: getTodayItems 基本功能');
        passed++;
    } catch (error) {
        console.log(`❌ 测试4失败: ${error.message}`);
        failed++;
    }
    
    // 测试5: getTodayItems 不越界
    try {
        const testData = ['a', 'b', 'c'];
        const items = getTodayItems(testData, 5, new Date('2026-04-08'));
        assert.strictEqual(items.length, 5, '应返回5项（循环）');
        console.log('✅ 测试5通过: getTodayItems 循环处理');
        passed++;
    } catch (error) {
        console.log(`❌ 测试5失败: ${error.message}`);
        failed++;
    }
    
    // 测试6: 同一日期返回相同结果
    try {
        const testData = ['a', 'b', 'c', 'd', 'e'];
        const date = new Date('2026-04-08');
        const items1 = getTodayItems(testData, 3, date);
        const items2 = getTodayItems(testData, 3, date);
        assert.deepStrictEqual(items1, items2, '同一日期应返回相同结果');
        console.log('✅ 测试6通过: getTodayItems 确定性');
        passed++;
    } catch (error) {
        console.log(`❌ 测试6失败: ${error.message}`);
        failed++;
    }
    
    // 测试7: 不同日期返回不同结果
    try {
        const testData = ['a', 'b', 'c', 'd', 'e'];
        const items1 = getTodayItems(testData, 3, new Date('2026-04-08'));
        const items2 = getTodayItems(testData, 3, new Date('2026-04-09'));
        assert.notDeepStrictEqual(items1, items2, '不同日期应返回不同结果');
        console.log('✅ 测试7通过: getTodayItems 区分不同日期');
        passed++;
    } catch (error) {
        console.log(`❌ 测试7失败: ${error.message}`);
        failed++;
    }
    
    // 测试8: 处理空数组
    try {
        const items = getTodayItems([], 3);
        assert.deepStrictEqual(items, [], '空数组应返回空结果');
        console.log('✅ 测试8通过: 处理空数组');
        passed++;
    } catch (error) {
        console.log(`❌ 测试8失败: ${error.message}`);
        failed++;
    }
    
    // 总结
    console.log('\n═══════════════════════════════════════');
    console.log('测试总结');
    console.log('═══════════════════════════════════════\n');
    
    console.log(`总测试数: ${passed + failed}`);
    console.log(`✅ 通过: ${passed}`);
    console.log(`❌ 失败: ${failed}`);
    
    if (failed === 0) {
        console.log('\n🎉 所有测试通过！');
        process.exit(0);
    } else {
        console.log('\n⚠️  部分测试失败');
        process.exit(1);
    }
}

// 运行测试
if (require.main === module) {
    runTests();
}

module.exports = { dateToIndex, getTodayItems };
