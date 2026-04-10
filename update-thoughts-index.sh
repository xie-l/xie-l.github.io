#!/bin/bash
# 更新thoughts索引

cd /Users/liang/Documents/GitHub/xie-l.github.io

echo "=== 更新thoughts索引 ==="

# 备份原索引
cp blog/thoughts/index.html blog/thoughts/index.html.backup

# 读取索引头部（到post-list之前）
head -n $(grep -n 'class="post-list"' blog/thoughts/index.html | cut -d: -f1) blog/thoughts/index.html > /tmp/thoughts-index-new.html

# 添加post-list标记
echo '        <div class="post-list">' >> /tmp/thoughts-index-new.html

# 获取所有thoughts HTML文件（按修改时间倒序）
find blog/thoughts -name "*（202604）.html" -type f | sort -r | while read file; do
    filename=$(basename "$file")
    
    # 从HTML文件中提取信息
    title=$(grep -o '<h1 class="post-title">[^<]*</h1>' "$file" | sed 's/<h1 class="post-title">//;s/<\/h1>//' | head -1)
    date=$(grep -o '<span><i class="fas fa-calendar"><\/i> [^<]*<\/span>' "$file" | sed 's/<span><i class="fas fa-calendar"><\/i> //;s/<\/span>//' | head -1)
    excerpt=$(grep -o '<p class="post-excerpt">[^<]*</p>' "$file" | sed 's/<p class="post-excerpt">//;s/<\/p>//' | head -1 | cut -c1-100)
    
    # 生成卡片
    echo "            <a href=\"$filename\" class=\"post-item\">" >> /tmp/thoughts-index-new.html
    echo "                <div class=\"post-date\">$date</div>" >> /tmp/thoughts-index-new.html
    echo "                <h3 class=\"post-title\">$title</h3>" >> /tmp/thoughts-index-new.html
    echo "                <p class=\"post-excerpt\">$excerpt</p>" >> /tmp/thoughts-index-new.html
    echo "            </a>" >> /tmp/thoughts-index-new.html
done

# 添加尾部
sed -n '/post-list/,$p' blog/thoughts/index.html | tail -n +2 >> /tmp/thoughts-index-new.html

# 替换原文件
cp /tmp/thoughts-index-new.html blog/thoughts/index.html

echo "✓ thoughts索引已更新"
echo "✓ 备份文件: blog/thoughts/index.html.backup"
