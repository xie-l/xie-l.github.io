#!/bin/bash

# 微信读书数据修复脚本
# 使用方法：./fix-weread.sh [test|restore|check]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DATA_FILE="$SCRIPT_DIR/data/weread.json"
BACKUP_FILE="$SCRIPT_DIR/data/weread.json.backup"
TEST_FILE="$SCRIPT_DIR/data/weread-test.json"

echo "==================================="
echo "微信读书数据修复脚本"
echo "==================================="
echo ""

# 检查文件是否存在
if [ ! -f "$DATA_FILE" ]; then
    echo "✗ 错误：找不到数据文件 $DATA_FILE"
    exit 1
fi

case "$1" in
    test)
        echo "【模式】创建测试数据"
        echo ""
        
        # 备份原始数据
        if [ -f "$DATA_FILE" ]; then
            cp "$DATA_FILE" "$BACKUP_FILE"
            echo "✓ 已备份原始数据到 weread.json.backup"
        fi
        
        # 创建测试数据
        cat > "$DATA_FILE" << 'EOF'
{
  "reading": {
    "title": "高效能人士的七个习惯",
    "author": "史蒂芬·柯维",
    "cover": "https://img3.doubanio.com/fiction/s29725544-0.jpg",
    "progress": 65,
    "finished": false,
    "last_read": "2026-04-08"
  },
  "recent": [
    {
      "title": "认知觉醒",
      "author": "周岭",
      "cover": "",
      "progress": 100,
      "finished": true,
      "last_read": "2026-04-07"
    },
    {
      "title": "深度工作",
      "author": "卡尔·纽波特",
      "cover": "",
      "progress": 45,
      "finished": false,
      "last_read": "2026-04-06"
    },
    {
      "title": "原子习惯",
      "author": "詹姆斯·克利尔",
      "cover": "",
      "progress": 100,
      "finished": true,
      "last_read": "2026-04-05"
    }
  ],
  "updated": "2026-04-08 16:00 UTC"
}
EOF
        
        echo "✓ 已创建测试数据"
        echo ""
        echo "下一步操作："
        echo "1. 刷新首页 https://xie-l.github.io"
        echo "2. 检查侧边栏是否显示'正在阅读'模块"
        echo "3. 确认书籍信息、封面、进度条显示正常"
        echo ""
        echo "测试完成后，运行：./fix-weread.sh restore"
        ;;
        
    restore)
        echo "【模式】恢复原始数据"
        echo ""
        
        if [ -f "$BACKUP_FILE" ]; then
            mv "$BACKUP_FILE" "$DATA_FILE"
            echo "✓ 已恢复原始数据"
        else
            echo "✗ 错误：找不到备份文件 $BACKUP_FILE"
            echo "  请确保之前运行过 ./fix-weread.sh test"
            exit 1
        fi
        ;;
        
    check)
        echo "【模式】检查当前数据状态"
        echo ""
        
        if [ -f "$DATA_FILE" ]; then
            echo "数据文件：$DATA_FILE"
            echo "文件大小：$(wc -c < "$DATA_FILE") 字节"
            echo "最后修改：$(stat -c %y "$DATA_FILE" 2>/dev/null || stat -f %Sm "$DATA_FILE")"
            echo ""
            
            # 检查是否有有效数据
            if command -v python3 > /dev/null; then
                HAS_READING=$(python3 -c "import json; d=json.load(open('$DATA_FILE')); print('reading' in d and d['reading'] is not None)")
                RECENT_COUNT=$(python3 -c "import json; d=json.load(open('$DATA_FILE')); print(len(d.get('recent', [])))")
                
                echo "数据内容分析："
                if [ "$HAS_READING" = "True" ]; then
                    echo "✓ 有正在阅读的书籍"
                else
                    echo "✗ 没有正在阅读的书籍"
                fi
                
                echo "✓ 最近读过：$RECENT_COUNT 本"
                
                if [ "$HAS_READING" = "False" ] && [ "$RECENT_COUNT" -eq 0 ]; then
                    echo ""
                    echo "⚠ 数据为空，模块不会显示"
                    echo "建议运行：./fix-weread.sh test 创建测试数据"
                else
                    echo ""
                    echo "✓ 数据有效，模块应该显示"
                fi
            else
                echo "⚠ 未安装python3，无法分析数据内容"
            fi
        else
            echo "✗ 错误：数据文件不存在"
        fi
        ;;
        
    *)
        echo "使用方法："
        echo "  ./fix-weread.sh test     - 创建测试数据"
        echo "  ./fix-weread.sh restore  - 恢复原始数据"
        echo "  ./fix-weread.sh check    - 检查数据状态"
        echo ""
        echo "当前数据状态："
        if [ -f "$DATA_FILE" ]; then
            ls -lh "$DATA_FILE"
        else
            echo "✗ 数据文件不存在"
        fi
        ;;
esac

echo ""
echo "==================================="
echo "操作完成"
echo "==================================="
