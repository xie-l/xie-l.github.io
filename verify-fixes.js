#!/usr/bin/env node

/**
 * 修复验证脚本
 * 用于验证所有修复是否正常工作
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 开始验证修复...\n');

let passed = 0;
let failed = 0;

// 测试1: 检查main.js是否包含新的加载函数
console.log('📋 测试1: 检查数据加载函数是否存在');
try {
    const mainJs = fs.readFileSync(path.join(__dirname, 'js/main.js'), 'utf8');
    
    const requiredFunctions = [
        'loadWidgetData',
        'getTodayKey',
        'loadDailyQuestions',
        'loadDailyKeywords',
        'loadDailyData',
        'loadNewsFeed'
    ];
    
    let allFound = true;
    requiredFunctions.forEach(func => {
        if (mainJs.includes(`function ${func}`) || mainJs.includes(`async function ${func}`)) {
            console.log(`  ✓ 找到函数: ${func}`);
        } else {
            console.log(`  ✗ 缺失函数: ${func}`);
            allFound = false;
        }
    });
    
    if (allFound) {
        console.log('  ✅ 通过\n');
        passed++;
    } else {
        console.log('  ❌ 失败\n');
        failed++;
    }
} catch (error) {
    console.log(`  ❌ 错误: ${error.message}\n`);
    failed++;
}

// 测试2: 检查index.html是否指向about-new.html
console.log('📋 测试2: 检查about页面链接');
try {
    const indexHtml = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
    
    const hasCorrectLink = indexHtml.includes('about-new.html');
    const hasOldLink = indexHtml.includes('href="about.html"');
    
    if (hasCorrectLink && !hasOldLink) {
        console.log('  ✓ 导航链接指向 about-new.html');
        console.log('  ✓ 未发现指向 about.html 的链接');
        console.log('  ✅ 通过\n');
        passed++;
    } else {
        if (!hasCorrectLink) console.log('  ✗ 未发现指向 about-new.html 的链接');
        if (hasOldLink) console.log('  ✗ 仍存在指向 about.html 的链接');
        console.log('  ❌ 失败\n');
        failed++;
    }
} catch (error) {
    console.log(`  ❌ 错误: ${error.message}\n`);
    failed++;
}

// 测试3: 检查CSS是否包含新样式
console.log('📋 测试3: 检查CSS样式');
try {
    const styleCss = fs.readFileSync(path.join(__dirname, 'css/style.css'), 'utf8');
    
    const requiredStyles = [
        '.loading-state',
        '.error-state',
        '.empty-state',
        '.retry-btn',
        '.news-item'
    ];
    
    let allFound = true;
    requiredStyles.forEach(style => {
        if (styleCss.includes(style)) {
            console.log(`  ✓ 找到样式: ${style}`);
        } else {
            console.log(`  ✗ 缺失样式: ${style}`);
            allFound = false;
        }
    });
    
    if (allFound) {
        console.log('  ✅ 通过\n');
        passed++;
    } else {
        console.log('  ❌ 失败\n');
        failed++;
    }
} catch (error) {
    console.log(`  ❌ 错误: ${error.message}\n`);
    failed++;
}

// 测试4: 检查数据文件是否存在
console.log('📋 测试4: 检查数据文件');
try {
    const dataDir = path.join(__dirname, 'data');
    const requiredFiles = [
        'pool-questions.json',
        'pool-keywords.json',
        'pool-data.json',
        'news.json'
    ];
    
    let allFound = true;
    requiredFiles.forEach(file => {
        const filePath = path.join(dataDir, file);
        if (fs.existsSync(filePath)) {
            const stats = fs.statSync(filePath);
            const size = (stats.size / 1024).toFixed(1);
            console.log(`  ✓ 找到文件: ${file} (${size} KB)`);
        } else {
            console.log(`  ✗ 缺失文件: ${file}`);
            allFound = false;
        }
    });
    
    if (allFound) {
        console.log('  ✅ 通过\n');
        passed++;
    } else {
        console.log('  ❌ 失败\n');
        failed++;
    }
} catch (error) {
    console.log(`  ❌ 错误: ${error.message}\n`);
    failed++;
}

// 测试5: 检查HTML中的容器元素
console.log('📋 测试5: 检查HTML容器元素');
try {
    const indexHtml = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
    
    const requiredContainers = [
        'id="dq-grid"',
        'id="kw-list"',
        'id="ds-grid"',
        'id="news-content"'
    ];
    
    let allFound = true;
    requiredContainers.forEach(container => {
        if (indexHtml.includes(container)) {
            console.log(`  ✓ 找到容器: ${container}`);
        } else {
            console.log(`  ✗ 缺失容器: ${container}`);
            allFound = false;
        }
    });
    
    if (allFound) {
        console.log('  ✅ 通过\n');
        passed++;
    } else {
        console.log('  ❌ 失败\n');
        failed++;
    }
} catch (error) {
    console.log(`  ❌ 错误: ${error.message}\n`);
    failed++;
}

// 总结
console.log('═════════════════════════════════════');
console.log(`📊 测试结果: ${passed} 通过, ${failed} 失败`);
console.log('═════════════════════════════════════\n');

if (failed === 0) {
    console.log('🎉 所有测试通过！修复已成功应用。');
    console.log('\n下一步操作:');
    console.log('1. 在浏览器中打开 index.html');
    console.log('2. 检查控制台是否有错误');
    console.log('3. 验证所有板块是否正常加载');
    console.log('4. 点击导航栏"关于我"链接，确认指向 about-new.html');
    process.exit(0);
} else {
    console.log('⚠️  部分测试失败，请检查上述错误。');
    process.exit(1);
}
