#!/bin/bash

# 更新微信读书Cookie到GitHub Secrets
# 使用方法：./update-weread-secret.sh

set -e

echo "==================================="
echo "更新微信读书Cookie到GitHub Secrets"
echo "==================================="
echo ""

# Cookie值（从用户输入获取）
# 注意：这里应该使用完整的Cookie字符串
WEREAD_COOKIE_VALUE="wr_avatar=https%3A%2F%2Fthirdwx.qlogo.cn%2Fmmopen%2Fvi_32%2Fk5r6L01rTcN29evRXJ305mvVzFGwt6o8fbmUbEiaYWA339LKk37JBpRTib2h4jjU8vFDt5KZnvkfm7E5Eu91dvcicPktiahZEee51lCOxk2tOicc%252F132; wr_fp=2832114611; wr_gender=1; wr_gid=277400089; wr_localvid=e6a328806962945e6a4f356; wr_name=%E7%A8%80%E7%BC%BA%E7%89%A9%E7%A7%8D; wr_pf=NaN; wr_ql=1; wr_rt=o2uxBwk-ptsQE_vnQPw2LxWaI2ZM%25408rde585s0kT_Pj5U9aS_AL; wr_skey=O1pp18ZR; wr_theme=white; wr_vid=9840965"

echo "【步骤1】验证Cookie格式"
echo "Cookie长度：$(echo -n "$WEREAD_COOKIE_VALUE" | wc -c) 字符"
echo ""

if [ $(echo -n "$WEREAD_COOKIE_VALUE" | wc -c) -lt 100 ]; then
    echo "⚠️ 警告：Cookie长度不足100字符"
    echo "这可能是因为："
    echo "1. wr_skey值较短（这是正常的）"
    echo "2. 但wr_rt值应该很长"
    echo ""
fi

echo "【步骤2】检查GitHub CLI是否可用"
if command -v gh &> /dev/null; then
    echo "✓ GitHub CLI已安装"
    
    # 检查是否已登录
    if gh auth status &> /dev/null; then
        echo "✓ 已登录GitHub"
        
        # 更新Secret
        echo "【步骤3】更新GitHub Secret"
        echo "正在更新 WEREAD_COOKIE..."
        
        if echo "$WEREAD_COOKIE_VALUE" | gh secret set WEREAD_COOKIE --repo xie-l/xie-l.github.io; then
            echo "✓ Secret更新成功"
            echo ""
            echo "【步骤4】触发GitHub Actions工作流"
            echo "请手动触发工作流："
            echo "https://github.com/xie-l/xie-l.github.io/actions/workflows/fetch-weread.yml"
            echo ""
            echo "或者使用命令："
            echo "gh workflow run fetch-weread.yml --repo xie-l/xie-l.github.io"
        else
            echo "✗ Secret更新失败"
            echo "请检查GitHub CLI权限"
            exit 1
        fi
    else
        echo "✗ 未登录GitHub"
        echo "请运行：gh auth login"
        exit 1
    fi
else
    echo "✗ GitHub CLI未安装"
    echo "请使用手动配置方法"
    echo ""
    echo "手动配置步骤："
    echo "1. 访问 https://github.com/xie-l/xie-l.github.io/settings/secrets/actions"
    echo "2. 点击 'New repository secret'"
    echo "3. Name: WEREAD_COOKIE"
    echo "4. Value: 粘贴完整的Cookie字符串"
    echo "5. 点击 'Add secret'"
    echo ""
    echo "完整的Cookie字符串："
    echo "$WEREAD_COOKIE_VALUE"
fi

echo ""
echo "==================================="
echo "配置完成"
echo "==================================="
echo ""
echo "下一步："
echo "1. 触发GitHub Actions工作流"
echo "2. 等待运行完成（1-2分钟）"
echo "3. 验证数据文件"
echo "4. 检查主页显示"
echo ""
