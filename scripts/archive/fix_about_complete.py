#!/usr/bin/env python3
"""
Complete fix for about.html
- Fixes duplicate </main> tag
- Fixes duplicate </body> and </html> tags
- Fixes duplicate scripts and footers
- Adds missing weather and weread JavaScript
"""

import re

# Read the file
with open('about.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove everything after the first </body></html>
# Find the position of first </body></html>
first_body_end = content.find('</body>\n</html>')
if first_body_end != -1:
    # Keep everything up to and including </body></html>
    content = content[:first_body_end + len('</body>\n</html>')]

# 2. Remove duplicate script src="js/main.js" before </body>
# Keep only the first occurrence
scripts = []
script_pattern = r'    <script src="js/main\.js"></script>\n'
pos = 0
while True:
    match = re.search(script_pattern, content[pos:])
    if not match:
        break
    scripts.append((pos + match.start(), pos + match.end()))
    pos += match.end()

if len(scripts) > 1:
    # Remove all but the first script
    for start, end in reversed(scripts[1:]):
        content = content[:start] + content[end:]

# 3. Add </main> before <!-- 右侧边栏 -->
# Find the position
sidebar_comment = '<!-- 右侧边栏 -->'
pos = content.find('\n' + sidebar_comment)
if pos != -1:
    # Check if </main> is already there
    before_sidebar = content[pos-50:pos]
    if '</main>' not in before_sidebar:
        # Add </main>
        content = content[:pos] + '\n                </main>' + content[pos:]

# 4. Add missing JavaScript before </body>
js_to_add = '''
    <!-- Weather and WeRead Scripts -->
    <script>
    // Helper functions
    function fetchSignal(ms) {
        var ctrl = new AbortController();
        setTimeout(function() { ctrl.abort(); }, ms);
        return ctrl.signal;
    }

    function fmtBJ(utcStr) {
        if (!utcStr) return '';
        const m = utcStr.match(/(\\d{4})-(\\d{2})-(\\d{2})\\s+(\\d{2}):(\\d{2})/);
        if (!m) return utcStr;
        const bj = new Date(Date.UTC(+m[1], +m[2]-1, +m[3], +m[4], +m[5]) + 8*3600*1000);
        const pad = n => String(n).padStart(2, '0');
        return (bj.getUTCMonth()+1) + '月' + bj.getUTCDate() + '日 '
             + pad(bj.getUTCHours()) + ':' + pad(bj.getUTCMinutes());
    }

    // Weather data
    const WEATHER_CITIES = ['Beijing','Shanghai','Nanchang','Xining','Harbin'];
    const WEEK_ZH = ['周日','周一','周二','周三','周四','周五','周六'];
    let _wtData   = {};
    let _wtActive = 'Beijing';

    function renderWeatherCity(cityKey) {
        _wtActive = cityKey;
        const d = _wtData[cityKey];
        const container = document.getElementById('w-weather');
        if (!d) { container.innerHTML = '<div class="wt-loading">暂无数据</div>'; return; }

        const cur   = d.current || {};
        const daily = d.daily   || [];

        const todayHTML =
            '<div class="wt-today">' +
                '<div class="wt-today-icon">' + (cur.icon || '🌡️') + '</div>' +
                '<div>' +
                    '<div class="wt-today-temp">' + (cur.temp !== undefined ? cur.temp + '°C' : '--') + '</div>' +
                    '<div class="wt-today-desc">'  + (cur.desc || '')                                 + '</div>' +
                '</div>' +
            '</div>';

        const forecastHTML =
            '<div class="wt-forecast">' +
            daily.slice(0, 7).map(function(day, i) {
                var dt      = new Date(day.date + 'T00:00:00+08:00');
                var dayName = i === 0 ? '今天' : WEEK_ZH[dt.getDay()];
                return '<div class="wt-day' + (i === 0 ? ' wt-day-today' : '') + '">' +
                    '<div class="wt-day-name">' + dayName         + '</div>' +
                    '<div class="wt-day-icon">' + (day.icon||'🌡️') + '</div>' +
                    '<div class="wt-day-max">'  + day.max + '°'   + '</div>' +
                    '<div class="wt-day-min">'  + day.min + '°'   + '</div>' +
                '</div>';
            }).join('') +
            '</div>';

        container.innerHTML = todayHTML + forecastHTML;

        document.querySelectorAll('.wt-tab').forEach(function(btn) {
            btn.classList.toggle('active', btn.dataset.city === cityKey);
        });
    }

    function renderWeather(data) {
        _wtData = data;
        var tabsEl = document.getElementById('wt-tabs');
        if (tabsEl) {
            tabsEl.innerHTML = WEATHER_CITIES.map(function(q) {
                var name = (data[q] && data[q].name) ? data[q].name : q;
                return '<button class="wt-tab' + (q === _wtActive ? ' active' : '') +
                       '" data-city="' + q + '">' + name + '</button>';
            }).join('');
            tabsEl.addEventListener('click', function(e) {
                if (e.target.classList.contains('wt-tab')) {
                    renderWeatherCity(e.target.dataset.city);
                }
            });
        }
        renderWeatherCity(_wtActive);
        var timeEl = document.getElementById('w-weather-time');
        if (timeEl) {
            var firstUpdated = Object.values(data).map(function(d) { return d && d.updated; }).find(Boolean);
            timeEl.textContent = firstUpdated ? '更新于 ' + fmtBJ(firstUpdated) + '（北京时间）' : '';
        }
    }

    async function loadWeather() {
        try {
            const res = await fetch('/data/weather.json?_=' + Date.now(), {
                signal: fetchSignal(5000)
            });
            if (!res.ok) throw new Error('HTTP ' + res.status);
            const data = await res.json();
            renderWeather(data);
        } catch(e) {
            const container = document.getElementById('w-weather');
            container.innerHTML = '<div class="wt-loading" style="padding:8px 0;font-size:13px;color:var(--text-light)">' +
                '<i class="fas fa-exclamation-circle"></i> 天气数据加载失败，请稍后刷新</div>';
        }
    }

    loadWeather();

    // WeRead data
    (async function loadWeRead() {
        try {
            const res = await fetch('/data/weread.json?_=' + Date.now(), {
                signal: fetchSignal(5000)
            });
            if (!res.ok) throw new Error('HTTP ' + res.status);
            const d = await res.json();
            const widget = document.getElementById('weread-widget');
            if (!widget) return;
            if (!d.reading && (!d.recent || d.recent.length === 0)) return;
            widget.style.display = '';
            if (d.reading) {
                const r = d.reading;
                const titleEl  = document.getElementById('wr-title');
                const authorEl = document.getElementById('wr-author');
                const barEl    = document.getElementById('wr-bar');
                const pctEl    = document.getElementById('wr-pct');
                if (titleEl)  titleEl.textContent  = r.title  || '--';
                if (authorEl) authorEl.textContent = r.author || '';
                const pct = Math.min(100, Math.max(0, r.progress || 0));
                if (barEl)    barEl.style.width    = pct + '%';
                if (pctEl)    pctEl.textContent    = '已读 ' + pct + '%';
                if (r.cover) {
                    const placeholder = widget.querySelector('.wr-cover-placeholder');
                    if (placeholder) {
                        const img = document.createElement('img');
                        img.className = 'wr-cover';
                        img.src = r.cover;
                        img.alt = r.title;
                        img.onerror = () => {};
                        placeholder.replaceWith(img);
                    }
                }
            }
            if (d.recent && d.recent.length > 0) {
                const listEl = document.getElementById('wr-recent-list');
                if (listEl) {
                    listEl.innerHTML = d.recent.slice(0, 4).map(function(b) {
                        const finishMark = b.finished ? '✓' : (b.progress ? b.progress + '%' : '');
                        return '<div class="wr-recent-item">' +
                            '<span style="overflow:hidden;white-space:nowrap;text-overflow:ellipsis;max-width:130px">' + (b.title || '') + '</span>' +
                            '<span class="wr-rt">' + finishMark + '</span></div>';
                    }).join('');
                }
            }
            const updEl = document.getElementById('wr-updated');
            if (updEl && d.updated) updEl.textContent = '更新于 ' + fmtBJ(d.updated) + '（北京时间）';
        } catch(e) { /* 静默失败 */ }
    })();
    </script>
'''

# Find position to insert (before </body>)
pos = content.rfind('    <script src="js/main.js"></script>')
if pos != -1:
    # Insert after this script
    next_line = content.find('\n', pos)
    if next_line != -1:
        content = content[:next_line+1] + js_to_add + content[next_line+1:]

# Write the fixed file
with open('about.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Fixed about.html:")
print("   - Removed duplicate </body></html>")
print("   - Removed duplicate script tags")
print("   - Added missing </main> tag")
print("   - Added weather and weread JavaScript")
print("   - File saved successfully")
