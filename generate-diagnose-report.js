#!/usr/bin/env node
// 生成诊断报告

const https = require('https');
const fs = require('fs');
const path = require('path');

console.log('=== GitHub 发布功能诊断报告生成器 ===\n');

const report = {
    timestamp: new Date().toISOString(),
    diagnostics: {},
    errors: [],
    recommendations: []
};

async function runDiagnostics() {
    console.log('正在运行诊断...\n');
    
    // 1. 检查GitHub API访问
    await diagnoseGitHubAPI();
    
    // 2. 检查本地配置文件
    diagnoseLocalConfig();
    
    // 3. 检查代码中的潜在问题
    diagnoseCodeIssues();
    
    // 4. 生成报告
    generateReport();
}

async function diagnoseGitHubAPI() {
    console.log('1. 诊断 GitHub API 访问');
    console.log('========================');
    
    // 测试公共API（无需token）
    try {
        const response = await new Promise((resolve, reject) => {
            https.get('https://api.github.com/repos/xie-l/xie-l.github.io', {
                headers: {
                    'User-Agent': 'Node.js',
                    'Accept': 'application/vnd.github.v3+json'
                }
            }, resolve).on('error', reject);
        });
        
        let data = '';
        response.on('data', chunk => data += chunk);
        await new Promise(resolve => response.on('end', resolve));
        
        if (response.statusCode === 200) {
            const repoInfo = JSON.parse(data);
            console.log('✓ 仓库可访问:', repoInfo.full_name);
            console.log('  - 公开仓库:', !repoInfo.private);
            console.log('  - 默认分支:', repoInfo.default_branch);
            report.diagnostics.repo_access = 'ok';
        } else {
            console.log('✗ 仓库访问失败:', response.statusCode, data);
            report.diagnostics.repo_access = 'failed';
            report.errors.push(`仓库访问失败: ${response.statusCode}`);
        }
    } catch (error) {
        console.log('✗ 仓库访问错误:', error.message);
        report.diagnostics.repo_access = 'error';
        report.errors.push(`仓库访问错误: ${error.message}`);
    }
    
    console.log('');
}

function diagnoseLocalConfig() {
    console.log('2. 诊断本地配置');
    console.log('==================');
    
    // 检查必要的文件
    const requiredFiles = [
        'index.html',
        'admin/main.js',
        'admin/login.html'
    ];
    
    requiredFiles.forEach(file => {
        const exists = fs.existsSync(path.join(__dirname, file));
        console.log(`${exists ? '✓' : '✗'} ${file}`);
        if (!exists) {
            report.errors.push(`缺少必要文件: ${file}`);
        }
    });
    
    console.log('');
}

function diagnoseCodeIssues() {
    console.log('3. 诊断代码中的潜在问题');
    console.log('==========================');
    
    // 检查index.html中的发布代码
    const indexPath = path.join(__dirname, 'index.html');
    if (fs.existsSync(indexPath)) {
        const content = fs.readFileSync(indexPath, 'utf8');
        
        // 检查是否有正确的Authorization头
        const authPattern = /headers:\s*\{[^}]*['"]Authorization['"]\s*:\s*['"]token\s*\+\s*token['"]/;
        const hasAuthHeader = authPattern.test(content);
        console.log(`${hasAuthHeader ? '✓' : '✗'} Authorization 头格式正确`);
        if (!hasAuthHeader) {
            report.errors.push('Authorization 头格式可能不正确');
        }
        
        // 检查是否有SHA参数传递
        const shaPattern = /body\.sha\s*=\s*fileSha/;
        const hasShaParam = shaPattern.test(content);
        console.log(`${hasShaParam ? '✓' : '✗'} SHA 参数已添加`);
        if (!hasShaParam) {
            report.errors.push('缺少SHA参数');
        }
        
        // 检查错误处理
        const errorPattern = /发布失败.*err\.message/;
        const hasErrorHandling = errorPattern.test(content);
        console.log((hasErrorHandling ? '✓' : '✗') + ' 有错误处理');
        
        // 检查token获取
        const tokenPattern = /localStorage\.getItem\(['"]github_token['"]\)/;
        const hasTokenFetch = tokenPattern.test(content);
        console.log((hasTokenFetch ? '✓' : '✗') + ' 有Token获取代码');
    }
    
    console.log('');
}

function generateReport() {
    console.log('4. 生成诊断报告');
    console.log('==================\n');
    
    // 分析错误
    if (report.errors.length === 0) {
        console.log('✅ 未发现明显问题');
        report.recommendations.push('所有检查通过，问题可能与浏览器环境或网络有关');
    } else {
        console.log('发现以下问题:');
        report.errors.forEach((error, i) => {
            console.log(`${i + 1}. ${error}`);
        });
        console.log('');
    }
    
    // 生成建议
    console.log('建议:');
    if (report.errors.includes('缺少SHA参数')) {
        console.log('• 确保已应用SHA修复（index.html第2413-2415行）');
        report.recommendations.push('检查SHA参数是否正确传递');
    }
    
    if (report.errors.includes('Authorization 头格式可能不正确')) {
        console.log('• 检查Authorization头格式是否为: "token " + token');
        report.recommendations.push('修复Authorization头格式');
    }
    
    console.log('• 在浏览器控制台运行诊断脚本');
    console.log('• 检查网络请求的详细信息');
    console.log('• 验证Token在localStorage中的值');
    
    report.recommendations.push('在浏览器控制台运行诊断脚本');
    report.recommendations.push('检查网络请求的Authorization头');
    report.recommendations.push('验证localStorage中的Token值');
    
    // 保存报告
    const reportPath = path.join(__dirname, 'diagnose-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
    
    console.log(`\n诊断报告已保存到: ${reportPath}`);
    console.log('\n=== 诊断完成 ===');
}

// 运行诊断
runDiagnostics().catch(error => {
    console.error('诊断失败:', error);
    process.exit(1);
});
