#!/usr/bin/env python3
import re

with open('about.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. 删除错误的</main>标签和第一个不完整的sidebar
pattern = r'</section>\s*\n\s*</main>\s*\n\n\s*<!-- 右侧边栏 -->\s*\n\s*<aside class="sidebar">\s*\n\s*<!-- 实时时间 -->\s*\n\s*<div class="sidebar-widget">.*?</div>\s*\n\s*</main>'

content = re.sub(pattern, '</section>', content, flags=re.DOTALL)

# 2. 在正确的位置添加</main>和完整的sidebar
content = content.replace(
    '    </div>\n\n    <!-- 页脚 -->',
    '''    </div>
                </main>

                <!-- 右侧边栏 -->
                <aside class="sidebar">
                    <!-- 实时时间 -->
                    <div class="sidebar-widget">
                        <h3 class="widget-title">
                            <i class="fas fa-clock" style="color:var(--secondary-color);margin-right:6px"></i>实时时间
                        </h3>
                        <div class="clock-wrap">
                            <div class="clock-time" id="w-clock">--:--:--</div>
                            <div class="clock-gregorian" id="w-date">加载中...</div>
                            <span class="clock-lunar" id="w-lunar">农历加载中</span>
                            <div class="widget-update-info">实时刷新 · 浏览器本地计算</div>
                        </div>
                    </div>

                    <!-- 城市天气 -->
                    <div class="sidebar-widget">
                        <h3 class="widget-title">
                            <i class="fas fa-cloud-sun" style="color:var(--secondary-color);margin-right:6px"></i>城市天气 · 7天预报
                        </h3>
                        <div class="widget-update-info">每日 08:00 更新 · 5个城市</div>
                        <div id="wt-tabs" class="wt-tabs"></div>
                        <div id="w-weather">
                            <div class="wt-loading"><i class="fas fa-spinner fa-spin"></i> 加载中...</div>
                        </div>
                        <div id="w-weather-time" style="font-size:11px;color:var(--text-light);margin-top:6px;opacity:.7;"></div>
                    </div>

                    <!-- 微信读书 -->
                    <div class="sidebar-widget" id="weread-widget">
                        <h3 class="widget-title">📚 正在阅读</h3>
                        <div id="weread-content">
                            <div class="wr-current">
                                <div class="wr-cover-placeholder">📖</div>
                                <div class="wr-info">
                                    <div class="wr-book-title" id="wr-title">--</div>
                                    <div class="wr-author" id="wr-author">--</div>
                                    <div class="wr-bar-wrap">
                                        <div class="wr-bar" id="wr-bar" style="width:0%"></div>
                                    </div>
                                    <div class="wr-pct" id="wr-pct">0%</div>
                                </div>
                            </div>
                            <div class="wr-recent-title">最近读过</div>
                            <div id="wr-recent-list"></div>
                            <div id="wr-updated" style="font-size:11px;color:var(--text-light);margin-top:8px;opacity:.65;"></div>
                        </div>
                    </div>

                    <!-- 快速导航 -->
                    <div class="sidebar-widget">
                        <h3 class="widget-title">快速导航</h3>
                        <ul class="widget-links">
                            <li><a href="#about" class="link-item"><i class="fas fa-user"></i> 个人简介</a></li>
                            <li><a href="#education" class="link-item"><i class="fas fa-graduation-cap"></i> 教育背景</a></li>
                            <li><a href="#awards" class="link-item"><i class="fas fa-trophy"></i> 获奖荣誉</a></li>
                            <li><a href="#internship" class="link-item"><i class="fas fa-briefcase"></i> 实习经历</a></li>
                            <li><a href="#research" class="link-item"><i class="fas fa-flask"></i> 科研项目</a></li>
                            <li><a href="#projects" class="link-item"><i class="fas fa-file-alt"></i> 科研成果</a></li>
                            <li><a href="#skills" class="link-item"><i class="fas fa-cogs"></i> 专业技能</a></li>
                            <li class="link-section-label">返回首页</li>
                            <li><a href="/" class="link-item"><i class="fas fa-home"></i> 返回首页</a></li>
                        </ul>
                    </div>

                    <!-- 联系方式 -->
                    <div class="sidebar-widget">
                        <h3 class="widget-title">联系方式</h3>
                        <div class="contact-info">
                            <p style="font-size: 14px; color: var(--text-secondary); margin-bottom: 12px;">
                                <i class="fas fa-envelope" style="margin-right: 8px; color: var(--secondary-color);"></i>
                                im.xiel@foxmail.com
                            </p>
                            <p style="font-size: 14px; color: var(--text-secondary); margin-bottom: 12px;">
                                <i class="fab fa-github" style="margin-right: 8px; color: var(--secondary-color);"></i>
                                github.com/xie-l
                            </p>
                            <p style="font-size: 14px; color: var(--text-secondary);">
                                <i class="fas fa-graduation-cap" style="margin-right: 8px; color: var(--secondary-color);"></i>
                                ResearchGate: Liang Xie
                            </p>
                        </div>
                    </div>

                    <!-- 学术影响力 -->
                    <div class="sidebar-widget" id="academic-widget">
                        <h3 class="widget-title">
                            <i class="fas fa-chart-line" style="color:var(--secondary-color);margin-right:6px"></i>学术影响力
                        </h3>
                        <div id="academic-stats" style="font-size:13px;color:var(--text-light);">加载中...</div>
                    </div>

                    <!-- 核心优势 -->
                    <div class="sidebar-widget">
                        <h3 class="widget-title">核心优势</h3>
                        <ul style="list-style: none; padding: 0; margin: 0;">
                            <li style="padding: 8px 0; font-size: 14px; color: var(--text-secondary); border-bottom: 1px solid var(--border-color);">
                                <i class="fas fa-check-circle" style="color: var(--success-color); margin-right: 8px;"></i>
                                30+ SCI论文发表
                            </li>
                            <li style="padding: 8px 0; font-size: 14px; color: var(--text-secondary); border-bottom: 1px solid var(--border-color);">
                                <i class="fas fa-check-circle" style="color: var(--success-color); margin-right: 8px;"></i>
                                4项发明专利
                            </li>
                            <li style="padding: 8px 0; font-size: 14px; color: var(--text-secondary); border-bottom: 1px solid var(--border-color);">
                                <i class="fas fa-check-circle" style="color: var(--success-color); margin-right: 8px;"></i>
                                机器学习与DFT计算
                            </li>
                            <li style="padding: 8px 0; font-size: 14px; color: var(--text-secondary);">
                                <i class="fas fa-check-circle" style="color: var(--success-color); margin-right: 8px;"></i>
                                氢能产业实践经验
                            </li>
                        </ul>
                    </div>
                </aside>
            </div>

    <!-- 页脚 -->'''
)

# 3. 添加完整的页脚和JavaScript
footer_script = '''    </div>

    <!-- 页脚 -->
    <footer class="footer">
        <div class="container">
            <p>&copy; 2026 谢亮 | 哈尔滨工业大学工学博士 | 国家能源集团氢能管培生</p>
            <p style="margin-top: 8px; font-size: 13px; color: var(--text-light);">
                本站使用 GitHub Pages 托管 | 主题基于学术风格定制
            </p>
        </div>
    </footer>

    <!-- 返回顶部按钮 -->
    <div class="back-to-top" id="backToTop">
        <i class="fas fa-arrow-up"></i>
    </div>

    <!-- JavaScript -->
    <script src="js/main.js"></script>
    <script>
        // 加载学术影响力数据
        (async function() {
            const el = document.getElementById('academic-stats');
            try {
                const resp = await fetch('/data/stats.json?_=' + Date.now());
                if (!resp.ok) throw new Error('HTTP ' + resp.status);
                const data = await resp.json();
                el.innerHTML = '<div style="padding:10px 0;">' +
                    '<div style="margin-bottom:8px;"><i class="fas fa-file-alt"></i> 博客文章: <strong>' + (data.post_count || 0) + '</strong></div>' +
                    '<div style="margin-bottom:8px;"><i class="fas fa-pen"></i> 总字数: <strong>' + (data.total_words || 0) + '</strong></div>' +
                    '<div style="margin-bottom:8px;"><i class="fas fa-folder"></i> 资源文件: <strong>' + (data.file_count || 0) + '</strong></div>' +
                    '<div><i class="fas fa-calendar"></i> 最新: <strong>' + (data.latest_post_date || '--') + '</strong></div>' +
                    '</div>';
            } catch(e) {
                el.innerHTML = '<div style="padding:10px;color:var(--text-light);">数据加载失败</div>';
            }
        })();
    </script>
    <script src="js/lazy-load.js"></script>
</body>
</html>'''

content = content.replace(
    '    </div>\n\n    <!-- 页脚 -->',
    footer_script
)

with open('about.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ about.html结构修复完成！")
print("✅ 已删除重复的</main>标签")
print("✅ 已整合sidebar内容")
print("✅ 已添加天气、读书等widgets")
print("✅ 已添加时间更新脚本")
