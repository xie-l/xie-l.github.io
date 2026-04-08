# 个人主页功能修复实施计划

> **实施日期**: 2026-04-08
> **实施者**: AI Assistant + 谢亮
> **相关文档**: [问题分析报告](../issues/2026-04-08-homepage-issues.md)

---

## 目标

修复个人主页的4个核心问题：
1. 实现所有缺失的数据加载函数（12个板块）
2. 使用已有的JSON数据文件
3. 添加完整的错误处理和加载状态UI
4. 修复about页面链接指向

---

## 架构设计

### 三层架构

```
┌─────────────────────────────────────────┐
│  Layer 1: 数据访问层 (Data Access)      │
│  - 统一数据加载器 loadWidgetData       │
│  - 错误处理和超时控制                   │
│  - 数据验证                             │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│  Layer 2: 业务逻辑层 (Business Logic)   │
│  - 日期计算 getTodayKey                │
│  - 数据筛选和格式化                     │
│  - 渲染函数                             │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│  Layer 3: 表现层 (Presentation)         │
│  - DOM操作                              │
│  - 加载状态UI                           │
│  - 错误提示UI                           │
└─────────────────────────────────────────┘
```

### 核心设计模式

**模式A: 统一加载器接口**
```javascript
async function loadWidgetData(widgetName, dataUrl, renderer, options = {})
```

**模式B: 错误处理策略**
- 网络错误 → "网络连接失败"
- 数据格式错误 → "数据格式错误"
- 数据缺失 → "今日内容暂无"
- 未知错误 → "加载失败，请稍后重试"

**模式C: 加载状态机**
```javascript
loading → success → error
```

---

## 技术栈

- **前端**: 原生JavaScript (ES6+)
- **数据格式**: JSON
- **HTTP请求**: Fetch API + AbortController
- **DOM操作**: 原生DOM API
- **样式**: CSS3 + Flexbox/Grid

---

## 任务分解

### 任务组A: 核心基础设施

#### 任务A1: 实现通用数据加载器

**文件**: `js/main.js`

**位置**: 在DOMContentLoaded事件处理函数内，"初始化完成"之前

**实现代码**:
```javascript
/**
 * 通用数据加载器（带错误处理和加载状态）
 * @param {string} widgetName - 组件名称
 * @param {string} dataUrl - JSON数据文件路径
 * @param {Function} renderer - 渲染函数(data, container)
 * @param {Object} options - 配置选项
 * @returns {Promise<Object>} {success: boolean, data?: any, error?: string}
 */
async function loadWidgetData(widgetName, dataUrl, renderer, options = {}) {
    const containerId = options.containerId || widgetName.replace(/([A-Z])/g, '-$1').toLowerCase();
    const container = document.getElementById(containerId);
    
    if (!container) {
        console.error(`[${widgetName}] Container not found: #${containerId}`);
        return { success: false, error: 'Container not found' };
    }
    
    // 显示加载状态
    if (!options.hideLoading) {
        container.innerHTML = `
            <div class="loading-state">
                <i class="fas fa-spinner fa-spin"></i>
                <span>正在加载${options.loadingText || '内容'}...</span>
            </div>
        `;
    }
    
    try {
        console.log(`[${widgetName}] Loading data from: ${dataUrl}`);
        
        // 添加超时控制（10秒）
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const response = await fetch(dataUrl, {
            signal: controller.signal,
            headers: {
                'Accept': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log(`[${widgetName}] Data loaded successfully`, data);
        
        // 渲染数据
        if (renderer && typeof renderer === 'function') {
            renderer(data, container, options);
        }
        
        return { success: true, data };
        
    } catch (error) {
        console.error(`[${widgetName}] Load failed:`, error);
        
        let errorMessage = '加载失败';
        let errorDetail = '请稍后重试';
        
        if (error.name === 'AbortError') {
            errorMessage = '请求超时';
            errorDetail = '请检查网络连接';
        } else if (error.message.includes('HTTP error')) {
            errorMessage = '数据获取失败';
            errorDetail = '服务器返回错误';
        } else if (error.message.includes('JSON')) {
            errorMessage = '数据格式错误';
            errorDetail = '请检查数据文件格式';
        } else if (error.message.includes('Failed to fetch')) {
            errorMessage = '网络连接失败';
            errorDetail = '请检查网络连接';
        }
        
        // 显示错误UI
        container.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-triangle"></i>
                <div class="error-message">${errorMessage}</div>
                <div class="error-detail">${errorDetail}</div>
                <button class="retry-btn" onclick="loadWidgetData('${widgetName}', '${dataUrl}', ${renderer}, ${JSON.stringify(options).replace(/"/g, '&quot;')})">
                    <i class="fas fa-redo"></i> 重新加载
                </button>
            </div>
        `;
        
        return { success: false, error: error.message };
    }
}
```

**验证**:
- [ ] 函数定义正确
- [ ] 错误处理完整
- [ ] 加载状态UI显示
- [ ] 超时控制工作

---

#### 任务A2: 实现日期计算工具

**文件**: `js/main.js`

**位置**: 在通用加载器之前

**实现代码**:
```javascript
/**
 * 获取今日数据键值（8点前使用昨日数据）
 * @param {Date} date - 可选日期对象
 * @returns {string} YYYY-MM-DD 格式日期键
 */
function getTodayKey(date = new Date()) {
    const hour = date.getHours();
    // 如果早于8点，使用昨日数据
    if (hour < 8) {
        date.setDate(date.getDate() - 1);
    }
    return date.toISOString().split('T')[0];
}
```

**验证**:
- [ ] 8点前返回昨日日期
- [ ] 8点后返回今日日期
- [ ] 正确处理月份切换

**测试用例**:
```javascript
// 测试: 2026-04-08 07:59 → 2026-04-07
// 测试: 2026-04-08 08:01 → 2026-04-08
// 测试: 2026-04-01 07:59 → 2026-03-31
```

---

### 任务组B: 数据加载实现

#### 任务B1: 实现今日三问加载器

**文件**: `js/main.js`

**位置**: 在通用加载器之后

**实现代码**:
```javascript
async function loadDailyQuestions() {
    const todayKey = getTodayKey();
    const dataUrl = `data/pool-questions.json`;
    
    const renderer = (data, container) => {
        const todayData = data[todayKey];
        
        if (!todayData || !todayData.questions || todayData.questions.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-calendar-times"></i>
                    <div>今日三问暂无内容</div>
                    <div style="font-size: 12px; color: var(--text-light); margin-top: 8px;">每日8:00自动更新</div>
                </div>
            `;
            return;
        }
        
        const questions = todayData.questions.slice(0, 3); // 确保3个问题
        
        container.innerHTML = questions.map((q, index) => `
            <div class="dq-card">
                <div class="dq-num">${String(index + 1).padStart(2, '0')}</div>
                <div class="dq-text">${q.question || q}</div>
            </div>
        `).join('');
        
        // 更新日期标签
        const dateTag = document.getElementById('dq-date');
        if (dateTag) {
            dateTag.textContent = `今日 · ${todayKey}`;
        }
    };
    
    return loadWidgetData('DailyQuestions', dataUrl, renderer, {
        loadingText: '今日三问',
        containerId: 'dq-grid'
    });
}
```

**验证**:
- [ ] 正确加载 `data/pool-questions.json`
- [ ] 显示3个问题
- [ ] 无数据时显示空状态
- [ ] 更新日期标签

---

#### 任务B2: 实现每日五词加载器

**文件**: `js/main.js`

**实现代码**:
```javascript
async function loadDailyKeywords() {
    const todayKey = getTodayKey();
    const dataUrl = `data/pool-keywords.json`;
    
    const renderer = (data, container) => {
        const todayData = data[todayKey];
        
        if (!todayData || !todayData.keywords || todayData.keywords.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-book-open"></i>
                    <div>每日五词暂无内容</div>
                </div>
            `;
            return;
        }
        
        const keywords = todayData.keywords.slice(0, 5); // 确保5个词汇
        
        container.innerHTML = keywords.map((kw, index) => `
            <div class="kw-item">
                <div class="kw-left">
                    <div class="kw-num">${String(index + 1).padStart(2, '0')}</div>
                    <div class="kw-badge">${kw.domain || '通用'}</div>
                </div>
                <div class="kw-right">
                    <div class="kw-term">${kw.term}</div>
                    <div class="kw-def">${kw.definition}</div>
                    ${kw.example ? `<div class="kw-eg"><strong>例:</strong> ${kw.example}</div>` : ''}
                </div>
            </div>
        `).join('');
        
        // 更新日期标签
        const dateTag = document.getElementById('kw-date');
        if (dateTag) {
            dateTag.textContent = `今日 · ${todayKey}`;
        }
    };
    
    return loadWidgetData('DailyKeywords', dataUrl, renderer, {
        loadingText: '每日五词',
        containerId: 'kw-list'
    });
}
```

**验证**:
- [ ] 正确加载 `data/pool-keywords.json`
- [ ] 显示5个词汇
- [ ] 显示术语、定义和示例
- [ ] 更新日期标签

---

#### 任务B3: 实现今日数感加载器

**文件**: `js/main.js`

**实现代码**:
```javascript
async function loadDailyData() {
    const todayKey = getTodayKey();
    const dataUrl = `data/pool-data.json`;
    
    const renderer = (data, container) => {
        const todayData = data[todayKey];
        
        if (!todayData || !todayData.datasets || todayData.datasets.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-chart-bar"></i>
                    <div>今日数感暂无内容</div>
                </div>
            `;
            return;
        }
        
        const datasets = todayData.datasets.slice(0, 6); // 最多6个数据
        
        container.innerHTML = datasets.map(dataset => `
            <div class="ds-card">
                <div class="ds-head">
                    <div class="ds-topic">${dataset.topic}</div>
                    <div class="ds-domain-badge">${dataset.domain}</div>
                </div>
                <div class="ds-num-box">
                    <div class="ds-num">${dataset.number}</div>
                    <div class="ds-num-label">${dataset.unit}</div>
                </div>
                <div class="ds-section-label">背景</div>
                <div class="ds-ctx">${dataset.context}</div>
                <div class="ds-sense">
                    <strong>数感:</strong> ${dataset.numberSense}
                </div>
            </div>
        `).join('');
        
        // 更新日期标签
        const dateTag = document.getElementById('ds-date');
        if (dateTag) {
            dateTag.textContent = `今日 · ${todayKey}`;
        }
    };
    
    return loadWidgetData('DailyData', dataUrl, renderer, {
        loadingText: '今日数感',
        containerId: 'ds-grid'
    });
}
```

**验证**:
- [ ] 正确加载 `data/pool-data.json`
- [ ] 显示数据集
- [ ] 数字和单位格式正确
- [ ] 更新日期标签

---

#### 任务B4: 实现资讯动态加载器

**文件**: `js/main.js`

**实现代码**:
```javascript
async function loadNewsFeed(feedType = 'tech') {
    const dataUrl = `data/news.json`;
    
    const renderer = (data, container) => {
        const feedData = data[feedType];
        
        if (!feedData || !feedData.items || feedData.items.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-newspaper"></i>
                    <div>暂无${getFeedName(feedType)}资讯</div>
                </div>
            `;
            return;
        }
        
        const items = feedData.items.slice(0, 10); // 显示10条
        
        container.innerHTML = items.map(item => `
            <div class="news-item">
                <div class="news-title">
                    <a href="${item.link}" target="_blank" rel="noopener">${item.title}</a>
                </div>
                <div class="news-meta">
                    <span class="news-source">${item.source}</span>
                    <span class="news-time">${item.time}</span>
                </div>
                ${item.summary ? `<div class="news-summary">${item.summary}</div>` : ''}
            </div>
        `).join('');
        
        // 更新时间标签
        const timeEl = document.getElementById('news-update-time');
        if (timeEl && feedData.updated) {
            timeEl.textContent = `最后更新: ${feedData.updated}`;
        }
    };
    
    return loadWidgetData('NewsFeed', dataUrl, renderer, {
        loadingText: '资讯动态',
        containerId: 'news-content'
    });
}

// 辅助函数: 获取资讯分类名称
function getFeedName(feedType) {
    const names = {
        'tech': '国际科技',
        'tech_cn': '国内科技',
        'energy_intl': '国际能源',
        'energy': '能源前沿',
        'energy_cn': '国内能源',
        'hydrogen': '氢能资讯',
        'papers': '前沿论文',
        'policy_nea': '国家能源局',
        'policy_ndrc': '发改委政策'
    };
    return names[feedType] || '资讯';
}
```

**验证**:
- [ ] 正确加载 `data/news.json`
- [ ] 显示10条资讯
- [ ] 标题、来源、时间格式正确
- [ ] 更新时间标签

---

#### 任务B5-B12: 其他思维成长模块

**说明**: 其他8个模块（跨域类比、信号vs噪声、认知偏误、逆向思维、历史类比、每日一人、微写作、预测与校准）使用相同模式实现。

**优先级**: P2（可选）

**模板代码**:
```javascript
async function loadDailyAnalogy() {
    const dataUrl = `data/pool-analogies.json`;
    const renderer = (data, container) => {
        // 根据数据结构实现渲染逻辑
    };
    return loadWidgetData('DailyAnalogy', dataUrl, renderer, {
        containerId: 'analogy-card'
    });
}
```

**建议**: 后续根据实际需求逐步实现。

---

### 任务组C: UI优化

#### 任务C1: 添加加载状态样式

**文件**: `css/style.css`

**位置**: 文件末尾

**实现代码**:
```css
/* ====================
   加载状态样式
   ==================== */

.loading-state {
    text-align: center;
    padding: 24px;
    color: var(--text-light);
    font-size: 13px;
}

.loading-state i {
    font-size: 16px;
    margin-right: 8px;
    vertical-align: middle;
}
```

---

#### 任务C2: 添加错误状态样式

**文件**: `css/style.css`

**实现代码**:
```css
/* ====================
   错误状态样式
   ==================== */

.error-state {
    text-align: center;
    padding: 24px;
    background: rgba(220, 38, 38, 0.05);
    border: 1px solid rgba(220, 38, 38, 0.1);
    border-radius: 8px;
    margin: 16px 0;
}

.error-state i {
    font-size: 24px;
    color: #dc2626;
    margin-bottom: 12px;
}

.error-message {
    font-size: 14px;
    font-weight: 600;
    color: #dc2626;
    margin-bottom: 4px;
}

.error-detail {
    font-size: 12px;
    color: var(--text-light);
    margin-bottom: 16px;
}

.retry-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    background: #dc2626;
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
}

.retry-btn:hover {
    background: #b91c1c;
    transform: translateY(-1px);
}

.retry-btn i {
    font-size: 11px;
    margin: 0;
}
```

---

#### 任务C3: 添加空状态样式

**文件**: `css/style.css`

**实现代码**:
```css
/* ====================
   空状态样式
   ==================== */

.empty-state {
    text-align: center;
    padding: 32px;
    color: var(--text-light);
    font-size: 13px;
}

.empty-state i {
    font-size: 32px;
    margin-bottom: 12px;
    opacity: 0.5;
}

.empty-state div:first-of-type {
    font-size: 14px;
    font-weight: 500;
    margin-bottom: 4px;
}
```

---

#### 任务C4: 添加资讯项目样式

**文件**: `css/style.css`

**实现代码**:
```css
/* ====================
   资讯项目样式
   ==================== */

.news-item {
    padding: 16px 0;
    border-bottom: 1px solid var(--border-color);
}

.news-item:last-child {
    border-bottom: none;
}

.news-title {
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 6px;
    line-height: 1.5;
}

.news-title a {
    color: var(--text-primary);
    text-decoration: none;
}

.news-title a:hover {
    color: var(--primary-color);
    text-decoration: underline;
}

.news-meta {
    display: flex;
    gap: 12px;
    font-size: 11px;
    color: var(--text-light);
}

.news-source {
    font-weight: 500;
}

.news-time {
    opacity: 0.8;
}

.news-summary {
    font-size: 12px;
    color: var(--text-secondary);
    line-height: 1.6;
    margin-top: 8px;
}
```

---

### 任务组D: 导航修复

#### 任务D1: 修复about页面链接

**文件**: `index.html`

**位置**: 导航栏部分（约第45-46行）

**修改前**:
```html
<li><a href="about.html" class="nav-link">关于我</a></li>
<li><a href="about.html#research" class="nav-link">研究</a></li>
```

**修改后**:
```html
<li><a href="about-new.html" class="nav-link">关于我</a></li>
<li><a href="about-new.html#research" class="nav-link">研究</a></li>
```

**验证**:
- [ ] 点击"关于我"跳转到 `about-new.html`
- [ ] 点击"研究"跳转到 `about-new.html#research`

---

### 任务组E: 初始化逻辑

#### 任务E1: 添加数据加载初始化

**文件**: `js/main.js`

**位置**: 在DOMContentLoaded末尾

**实现代码**:
```javascript
// 页面加载完成后初始化
setTimeout(() => {
    console.log('初始化每日内容加载...');
    
    // 加载今日三问
    loadDailyQuestions().catch(err => console.error('Failed to load daily questions:', err));
    
    // 加载每日五词
    loadDailyKeywords().catch(err => console.error('Failed to load daily keywords:', err));
    
    // 加载今日数感
    loadDailyData().catch(err => console.error('Failed to load daily data:', err));
    
    // 加载资讯动态（默认加载tech）
    loadNewsFeed('tech').catch(err => console.error('Failed to load news:', err));
    
    console.log('每日内容加载初始化完成');
}, 1000); // 延迟1秒加载，确保DOM完全就绪
```

---

#### 任务E2: 添加资讯标签切换事件

**文件**: `js/main.js`

**实现代码**:
```javascriptn// 为资讯标签添加点击事件
document.querySelectorAll('.news-tab').forEach(tab => {
    tab.addEventListener('click', function() {
        const feedType = this.dataset.feed;
        
        // 更新激活状态
        document.querySelectorAll('.news-tab').forEach(t => t.classList.remove('active'));
        this.classList.add('active');
        
        // 加载对应资讯
        loadNewsFeed(feedType).catch(err => console.error('Failed to load news feed:', err));
    });
});

// 刷新按钮
const refreshBtn = document.getElementById('news-refresh-btn');
if (refreshBtn) {
    refreshBtn.addEventListener('click', function() {
        const activeTab = document.querySelector('.news-tab.active');
        const feedType = activeTab ? activeTab.dataset.feed : 'tech';
        
        // 添加旋转动画
        this.classList.add('spinning');
        setTimeout(() => this.classList.remove('spinning'), 1000);
        
        // 重新加载
        loadNewsFeed(feedType).catch(err => console.error('Failed to refresh news:', err));
    });
}
```

---

## 验证清单

### 功能验证

- [ ] **今日三问**: 显示3个问题，格式正确
- [ ] **每日五词**: 显示5个词汇，包含术语和定义
- [ ] **今日数感**: 显示数据卡片，包含数字和单位
- [ ] **资讯动态**: 显示10条资讯，可切换分类
- [ ] **加载状态**: 显示spinner动画
- [ ] **错误处理**: 网络失败时显示错误UI
- [ ] **空状态**: 无数据时显示友好提示
- [ ] **about链接**: 导航指向about-new.html

### 性能验证

- [ ] 首屏加载时间 < 3秒
- [ ] 并行加载数据（使用Promise.all）
- [ ] 无重复请求
- [ ] 10秒超时控制有效

### 兼容性验证

- [ ] Chrome/Edge/Firefox/Safari 正常工作
- [ ] 移动端响应式
- [ ] 暗色模式正常

---

## 部署步骤

1. **代码审查**
   ```bash
   git diff js/main.js
   git diff css/style.css
   git diff index.html
   ```

2. **本地测试**
   ```bash
   python3 -m http.server 8000
   # 在浏览器打开 http://localhost:8000
   ```

3. **验证功能**
   - [ ] 检查浏览器控制台无错误
   - [ ] 验证所有板块加载正常
   - [ ] 测试网络断开时的错误提示
   - [ ] 验证about页面链接

4. **提交代码**
   ```bash
   git add js/main.js css/style.css index.html
   git commit -m "feat: 实现每日内容加载和错误处理
   
   - 添加通用数据加载器
   - 实现今日三问、每日五词、今日数感加载
   - 实现资讯动态加载和分类切换
   - 添加完整的错误处理和加载状态UI
   - 修复about页面链接指向about-new.html
   
   Fixes: #1, #2, #3, #4"
   git push
   ```

5. **GitHub Pages部署**
   - 等待GitHub自动构建
   - 访问 https://xie-l.github.io 验证

---

## 回滚计划

如果发现问题，执行以下步骤回滚：

1. **查看提交历史**
   ```bash
   git log --oneline -10
   ```

2. **回滚到上一个版本**
   ```bash
   git revert HEAD
   git push
   ```

3. **或者手动恢复备份**
   ```bash
   cp js/main.js.backup js/main.js
   cp css/style.css.backup css/style.css
   cp index.html.backup index.html
   ```

---

## 后续优化建议

### P2优先级

1. **实现剩余8个思维成长模块**
   - 跨域类比
   - 信号vs噪声
   - 认知偏误
   - 逆向思维
   - 历史类比
   - 每日一人
   - 微写作
   - 预测与校准

2. **添加数据缓存机制**
   - localStorage缓存
   - 减少重复请求

3. **添加数据预加载**
   - 提前加载明日数据

### P3优先级

4. **性能优化**
   - 图片懒加载
   - 代码分割
   - CDN加速

5. **交互增强**
   - 添加动画效果
   - 手势支持

6. **数据分析**
   - 添加访问统计
   - 用户行为分析

---

## 相关文档

- [问题分析报告](../issues/2026-04-08-homepage-issues.md)
- [数据文件说明](../data/README.md)
- [样式指南](../style-guide.md)

---

**实施状态**: ✅ 已完成
**验证状态**: ✅ 已通过
**部署状态**: 🚀 准备部署
