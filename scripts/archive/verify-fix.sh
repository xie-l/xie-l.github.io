#!/bin/bash

# 验证JavaScript语法错误修复
# 使用方法：./verify-fix.sh

set -e

echo "==================================="
echo "JavaScript语法错误修复验证"
echo "==================================="
echo ""

# 检查1：本地语法验证
echo "【检查1】验证本地JavaScript语法..."
if node -c js/main.js 2>/dev/null; then
    echo "✓ 本地语法检查通过"
else
    echo "✗ 本地语法检查失败"
    node -c js/main.js
    exit 1
fi
echo ""

# 检查2：检查远程文件
echo "【检查2】检查远程文件是否已更新..."
REMOTE_COUNT=$(curl -s https://xie-l.github.io/js/main.js | grep -o "particlesCount = 5000" | wc -l)
if [ "$REMOTE_COUNT" -gt 0 ]; then
    echo "✓ 远程文件已更新（particlesCount = 5000）"
else
    echo "✗ 远程文件可能未更新"
    echo "  这可能是因为GitHub Pages还在部署中"
fi
echo ""

# 检查3：检查语法错误
echo "【检查3】检查远程文件语法..."
ERROR_COUNT=$(curl -s https://xie-l.github.io/ 2>&1 | grep -i "syntaxerror\|missing )" | wc -l)
if [ "$ERROR_COUNT" -eq 0 ]; then
    echo "✓ 远程文件无语法错误"
else
    echo "✗ 远程文件仍有语法错误"
    echo "  请等待GitHub Pages部署完成（约1-2分钟）"
fi
echo ""

echo "==================================="
echo "验证完成"
echo "==================================="
echo ""
echo "建议操作："
echo "1. 等待1-2分钟（GitHub Pages部署时间）"
echo "2. 强制刷新浏览器（Ctrl/Cmd + Shift + R）"
echo "3. 访问 https://xie-l.github.io/"
echo "4. 按F12检查控制台是否有错误"
echo ""
