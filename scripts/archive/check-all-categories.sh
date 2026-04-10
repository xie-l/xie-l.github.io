#!/bin/bash
# 检查所有分类的文章分布

echo "=== 博客文章分类统计 ==="
echo ""

# 统计每个分类的文章数量
for category in life books tech analysis quotes thoughts; do
    count=$(find blog/$category -name "*.html" -type f | grep -v "index.html" | wc -l)
    echo "$category: $count 篇"
done

echo ""
echo "=== thoughts分类详情 ==="
echo ""

# 列出所有thoughts文章
for file in blog/thoughts/*.html; do
    if [[ "$file" != *"index.html"* ]]; then
        title=$(grep -o '<h1 class="post-title">[^<]*</h1>' "$file" | sed 's/<h1 class="post-title">//;s/<\/h1>//')
        date=$(grep -o '<span><i class="fas fa-calendar"><\/i> [^<]*<\/span>' "$file" | sed 's/<span><i class="fas fa-calendar"><\/i> //;s/<\/span>//')
        echo "- $date: $title"
    fi
done

echo ""
echo "=== 最近发布的10篇文章（所有分类） ==="
echo ""

# 按修改时间排序
find blog -name "*.html" -type f -not -name "index.html" | xargs ls -lt | head -10 | while read line; do
    file=$(echo "$line" | awk '{print $NF}')
    category=$(echo "$file" | cut -d'/' -f2)
    title=$(grep -o '<h1 class="post-title">[^<]*</h1>' "$file" 2>/dev/null | sed 's/<h1 class="post-title">//;s/<\/h1>//' | head -1)
    if [ -n "$title" ]; then
        echo "- [$category] $title"
    fi
done
