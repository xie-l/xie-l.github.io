#!/bin/bash
# 修复GitHub Actions的git冲突

cd /Users/liang/Documents/GitHub/xie-l.github.io

echo "=== 修复Git冲突 ==="

# 1. 检查当前状态
echo "1. 检查当前状态..."
git status --short

# 2. 如果有冲突文件，解决它们
if [ -f "feed.xml" ]; then
    echo "2. 备份feed.xml..."
    cp feed.xml feed.xml.backup
fi

# 3. 重置到远程最新状态
echo "3. 重置到远程最新状态..."
git fetch origin main
git reset --hard origin/main

# 4. 重新生成索引
echo "4. 重新生成索引..."
python3 << 'PYEOF'
import json, glob, os
from datetime import datetime, timezone

# 重新生成blog-index.json
posts = []
for path in glob.glob('blog/**/*.html', recursive=True):
    if 'index.html' in path or 'tags.html' in path:
        continue
    try:
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 提取信息
        import re
        title_match = re.search(r'<h1 class="post-title">(.*?)</h1>', content)
        date_match = re.search(r'<span><i class="fas fa-calendar"></i> (.*?)</span>', content)
        
        if title_match and date_match:
            title = title_match.group(1)
            date_str = date_match.group(1)
            
            # 转换日期格式
            try:
                date_obj = datetime.strptime(date_str, '%Y年%m月%d日')
                iso_date = date_obj.strftime('%Y-%m-%d')
            except:
                iso_date = '2026-04-10'
            
            category = path.split('/')[1]
            
            posts.append({
                'title': title,
                'date': iso_date,
                'category': category,
                'path': path.replace('\\', '/')
            })
    except Exception as e:
        print(f"处理 {path} 时出错: {e}")

posts.sort(key=lambda x: x['date'], reverse=True)

with open('data/blog-index.json', 'w', encoding='utf-8') as f:
    json.dump(posts, f, ensure_ascii=False, indent=2)

print(f"✓ 重新生成 data/blog-index.json: {len(posts)} 篇文章")

# 更新thoughts索引
thoughts_posts = [p for p in posts if p['category'] == 'thoughts']
print(f"✓ 找到 {len(thoughts_posts)} 篇thoughts文章")
PYEOF

# 5. 提交修复
echo "5. 提交修复..."
git add data/blog-index.json
git commit -m "fix: resolve GitHub Actions conflict and update blog index

- Reset to origin/main to resolve merge conflicts
- Regenerate blog-index.json with latest data
- Update thoughts category index"

# 6. 推送到GitHub
echo "6. 推送到GitHub..."
git push origin main

echo "✓ Git冲突已修复"
echo "✓ 索引已重新生成"
echo "✓ 更改已推送到GitHub"
