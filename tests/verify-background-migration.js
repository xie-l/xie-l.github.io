#!/usr/bin/env node

/**
 * 背景迁移验证脚本
 * 验证Three.js背景是否正确实现
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 背景迁移验证开始...\n');

let passed = 0;
let failed = 0;

function test(name, fn) {
    try {
        const result = fn();
        if (result) {
            console.log(`✅ ${name}`);
            passed++;
            return true;
        } else {
            console.log(`❌ ${name}`);
            failed++;
            return false;
        }
    } catch (error) {
        console.log(`❌ ${name}: ${error.message}`);
        failed++;
        return false;
    }
}

// 测试1: Three.js脚本已添加
test('index.html 包含Three.js脚本', () => {
    const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
    return html.includes('three.js/r128/three.min.js');
});

// 测试2: Canvas元素已添加
test('banner区域包含canvas元素', () => {
    const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
    const bannerMatch = html.match(/<section class="banner">[\s\S]*?<\/section>/);
    if (!bannerMatch) return false;
    const bannerSection = bannerMatch[0];
    return bannerSection.includes('<canvas id="hero-canvas"></canvas>');
});

// 测试3: Fallback背景已添加
test('banner区域包含fallback背景', () => {
    const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
    const bannerMatch = html.match(/<section class="banner">[\s\S]*?<\/section>/);
    if (!bannerMatch) return false;
    const bannerSection = bannerMatch[0];
    return bannerSection.includes('<div class="banner-bg-fallback"></div>');
});

// 测试4: CSS样式已更新
test('CSS包含#hero-canvas样式', () => {
    const css = fs.readFileSync(path.join(__dirname, '../css/style.css'), 'utf8');
    return css.includes('#hero-canvas');
});

// 测试5: CSS包含fallback样式
test('CSS包含banner-bg-fallback样式', () => {
    const css = fs.readFileSync(path.join(__dirname, '../css/style.css'), 'utf8');
    return css.includes('.banner-bg-fallback');
});

// 测试6: JavaScript代码已添加
test('main.js包含Three.js初始化函数', () => {
    const js = fs.readFileSync(path.join(__dirname, '../js/main.js'), 'utf8');
    return js.includes('function initThreeJSBackground()');
});

// 测试7: JavaScript包含动画函数
test('main.js包含animateBackground函数', () => {
    const js = fs.readFileSync(path.join(__dirname, '../js/main.js'), 'utf8');
    return js.includes('function animateBackground()');
});

// 测试8: JavaScript包含性能优化
test('main.js包含性能优化（粒子数3000）', () => {
    const js = fs.readFileSync(path.join(__dirname, '../js/main.js'), 'utf8');
    return js.includes('particlesCount = 3000');
});

// 测试9: JavaScript包含降级方案
test('main.js包含WebGL检测和降级', () => {
    const js = fs.readFileSync(path.join(__dirname, '../js/main.js'), 'utf8');
    return js.includes('WebGL') && js.includes('fallback');
});

// 测试10: 备份文件存在
test('备份文件已创建', () => {
    return fs.existsSync(path.join(__dirname, '../index.html.backup.before-bg-migration'));
});

// 总结
console.log('\n═══════════════════════════════════════');
console.log('验证结果');
console.log('═══════════════════════════════════════\n');

console.log(`总测试数: ${passed + failed}`);
console.log(`✅ 通过: ${passed}`);
console.log(`❌ 失败: ${failed}`);

if (failed === 0) {
    console.log('\n🎉 所有验证通过！');
    console.log('\n✅ 已实现的功能:');
    console.log('  - Three.js脚本已添加');
    console.log('  - Canvas元素已添加');
    console.log('  - Fallback背景已添加');
    console.log('  - CSS样式已更新');
    console.log('  - JavaScript代码已添加');
    console.log('  - 性能优化已实施');
    console.log('  - 降级方案已准备');
    console.log('\n🚀 背景迁移已完成！');
    console.log('\n💡 下一步:');
    console.log('  1. 在浏览器中打开 index.html');
    console.log('  2. 检查动态背景是否正常显示');
    console.log('  3. 验证文字是否清晰可见');
    console.log('  4. 测试性能（FPS > 30）');
    console.log('  5. 提交代码到Git');
    process.exit(0);
} else {
    console.log('\n⚠️  部分验证失败，请检查:');
    console.log('  - 确保所有文件已正确修改');
    console.log('  - 检查控制台错误信息');
    process.exit(1);
}
