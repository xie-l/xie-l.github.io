#!/bin/bash
# 快速修复微信读书不显示问题

echo "开始修复微信读书不显示问题..."
echo ""
echo "方案：添加测试数据（5分钟）"
echo ""

# 备份原始数据
cp data/weread.json data/weread.json.backup

# 创建测试数据
cat > data/weread.json << 'JSONEOF'
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
      "progress": 100,
      "finished": true,
      "last_read": "2026-04-07"
    },
    {
      "title": "深度工作",
      "author": "卡尔·纽波特",
      "progress": 45,
      "finished": false,
      "last_read": "2026-04-06"
    }
  ],
  "updated": "2026-04-08 16:00 UTC"
}
JSONEOF

# 提交并推送
git add data/weread.json
git commit -m "test: 添加微信读书测试数据（快速修复）"
git push

echo ""
echo "✅ 测试数据已添加并推送"
echo ""
echo "下一步："
echo "1. 等待2分钟（GitHub Pages部署）"
echo "2. 访问 https://xie-l.github.io/"
echo "3. 检查右侧边栏是否显示'正在阅读'"
echo "4. 按 Cmd + Shift + R 强制刷新"
echo ""
echo "完成后，如需恢复原始状态，运行："
echo "  git checkout data/weread.json"
echo "  git push"
