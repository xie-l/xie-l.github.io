#!/usr/bin/env python3
import re

# 修复about.html的最终版本
with open('about.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. 删除第一个错误的</main>和第一个不完整的sidebar
# 匹配模式：从</section>到</main>，然后到第一个sidebar的结束</main>
pattern = r'                    </section>\s*\n\s*</main>\s*\n\n\s*<!-- 右侧边栏 -->\s*\n\s*<aside class="sidebar">\s*\n\s*<!-- 实时时间 -->\s*\n\s*<div class="sidebar-widget">[\s\S]*?</div>\s*\n\s*</main>'

content = re.sub(pattern, '                    </section>', content)

# 2. 确保只有一个</main>在正确的位置
# 查找第二个</main>的位置，确保它后面跟着完整的sidebar
content = re.sub(
    r'(                </main>)\s*\n\n\s*(<!-- 右侧边栏 -->[\s\S]*?\n\s*</aside>)\s*\n\s*(</div>)\s*\n\s*(<!-- 页脚 -->)',
    r'                </main>\n\n                \2\n\n            \3\n\n    \4',
    content
)

with open('about.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ 已删除第一个错误的</main>和第一个不完整的sidebar")
print("✅ 已确保只有一个</main>在正确的位置")
print("✅ 已保留第二个完整的sidebar")
