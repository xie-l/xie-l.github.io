// ====================
// 暗色模式初始化（在 DOMContentLoaded 之前尽早执行）
// ====================
(function() {
    const saved = localStorage.getItem('theme') ||
        (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    if (saved === 'dark') document.documentElement.classList.add('dark');
})();

// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', function() {

    // ====================
    // 暗色模式切换按钮
    // ====================

    const themeToggle = document.getElementById('themeToggle');
    const html = document.documentElement;

    function updateToggleIcon() {
        if (!themeToggle) return;
        const isDark = html.classList.contains('dark');
        themeToggle.innerHTML = isDark
            ? '<i class="fas fa-sun"></i>'
            : '<i class="fas fa-moon"></i>';
        themeToggle.title = isDark ? '切换浅色模式' : '切换深色模式';
    }

    updateToggleIcon();

    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            html.classList.toggle('dark');
            const isDark = html.classList.contains('dark');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            updateToggleIcon();
        });
    }

    // ====================
    // 移动端菜单切换
    // ====================
    
    const mobileToggle = document.querySelector('.mobile-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (mobileToggle && navMenu) {
        mobileToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            mobileToggle.classList.toggle('active');
        });
        
        // 点击菜单项后关闭菜单
        const navLinks = navMenu.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                navMenu.classList.remove('active');
                mobileToggle.classList.remove('active');
            });
        });
    }
    
    // ====================
    // 平滑滚动
    // ====================
    
    const links = document.querySelectorAll('a[href^="#"]');
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                const offsetTop = targetSection.offsetTop - 80;
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
                
                // 更新活动导航链接
                updateActiveNavLink(targetId);
            }
        });
    });
    
    // ====================
    // 导航栏高亮
    // ====================
    
    function updateActiveNavLink(activeId) {
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === activeId) {
                link.classList.add('active');
            }
        });
    }
    
    // ====================
    // 滚动时更新活动导航链接
    // ====================
    
    const sections = document.querySelectorAll('section[id]');
    
    function updateNavOnScroll() {
        const scrollPosition = window.scrollY + 100;
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');
            
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                updateActiveNavLink('#' + sectionId);
            }
        });
    }
    
    window.addEventListener('scroll', updateNavOnScroll);
    updateNavOnScroll(); // 初始化
    
    // ====================
    // 返回顶部按钮
    // ====================
    
    const backToTopButton = document.getElementById('backToTop');
    
    if (backToTopButton) {
        window.addEventListener('scroll', function() {
            if (window.pageYOffset > 300) {
                backToTopButton.classList.add('visible');
            } else {
                backToTopButton.classList.remove('visible');
            }
        });
        
        backToTopButton.addEventListener('click', function() {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
    
    // ====================
    // 技能条动画
    // ====================
    
    const observerOptions = {
        threshold: 0.3,
        rootMargin: '0px 0px -100px 0px'
    };
    
    const skillObserver = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const skillBars = entry.target.querySelectorAll('.skill-progress');
                skillBars.forEach(bar => {
                    const skillLevel = bar.getAttribute('data-skill');
                    setTimeout(() => {
                        bar.style.width = skillLevel + '%';
                    }, 100);
                });
                skillObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    const skillsSection = document.querySelector('#skills');
    if (skillsSection) {
        skillObserver.observe(skillsSection);
    }
    
    // ====================
    // 滚动时显示元素动画
    // ====================
    
    const animateObserver = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });
    
    // 为所有section添加观察
    const allSections = document.querySelectorAll('.section');
    allSections.forEach((section, index) => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(30px)';
        section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        section.style.transitionDelay = (index * 0.1) + 's';
        animateObserver.observe(section);
    });
    
    // ====================
    // 个人资料卡片动画
    // ====================
    
    const profileCard = document.querySelector('.profile-card');
    if (profileCard) {
        profileCard.style.opacity = '0';
        profileCard.style.transform = 'translateY(40px)';
        profileCard.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
        
        setTimeout(() => {
            profileCard.style.opacity = '1';
            profileCard.style.transform = 'translateY(0)';
        }, 300);
    }
    
    // ====================
    // 横幅文字动画
    // ====================
    
    const bannerTitle = document.querySelector('.banner-title');
    const bannerSubtitle = document.querySelector('.banner-subtitle');
    const bannerMeta = document.querySelector('.banner-meta');
    
    if (bannerTitle) {
        bannerTitle.style.opacity = '0';
        bannerTitle.style.transform = 'translateY(20px)';
        bannerTitle.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
        
        setTimeout(() => {
            bannerTitle.style.opacity = '1';
            bannerTitle.style.transform = 'translateY(0)';
        }, 500);
    }
    
    if (bannerSubtitle) {
        bannerSubtitle.style.opacity = '0';
        bannerSubtitle.style.transform = 'translateY(20px)';
        bannerSubtitle.style.transition = 'opacity 0.8s ease 0.2s, transform 0.8s ease 0.2s';
        
        setTimeout(() => {
            bannerSubtitle.style.opacity = '1';
            bannerSubtitle.style.transform = 'translateY(0)';
        }, 700);
    }
    
    if (bannerMeta) {
        bannerMeta.style.opacity = '0';
        bannerMeta.style.transform = 'translateY(20px)';
        bannerMeta.style.transition = 'opacity 0.8s ease 0.4s, transform 0.8s ease 0.4s';
        
        setTimeout(() => {
            bannerMeta.style.opacity = '1';
            bannerMeta.style.transform = 'translateY(0)';
        }, 900);
    }
    
    // ====================
    // 导航栏滚动效果
    // ====================
    
    let lastScrollTop = 0;
    const header = document.querySelector('.header');
    
    window.addEventListener('scroll', function() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (scrollTop > lastScrollTop && scrollTop > 100) {
            // 向下滚动
            if (header) {
                header.style.transform = 'translateY(-100%)';
            }
        } else {
            // 向上滚动
            if (header) {
                header.style.transform = 'translateY(0)';
            }
        }
        
        lastScrollTop = scrollTop;
    });
    
    // ====================
    // 复制邮箱功能
    // ====================
    
    const copyEmailBtn = document.querySelector('.btnCopy');
    if (copyEmailBtn) {
        copyEmailBtn.addEventListener('click', function() {
            const email = 'your.email@example.com';
            navigator.clipboard.writeText(email).then(function() {
                // 创建提示
                const toast = document.createElement('div');
                toast.textContent = '邮箱已复制到剪贴板！';
                toast.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: #10b981;
                    color: white;
                    padding: 12px 20px;
                    border-radius: 8px;
                    z-index: 9999;
                    font-size: 14px;
                    animation: fadeInUp 0.3s ease;
                `;
                document.body.appendChild(toast);
                
                setTimeout(() => {
                    toast.remove();
                }, 3000);
            }).catch(function(err) {
                alert('复制失败，请手动复制');
            });
        });
    }
    
    // ====================
    // 表单提交（如果有）
    // ====================
    
    const contactForm = document.querySelector('.contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            
            submitBtn.textContent = '发送中...';
            submitBtn.disabled = true;
            
            // 模拟异步提交
            setTimeout(() => {
                // 创建成功提示
                const successToast = document.createElement('div');
                successToast.textContent = '消息发送成功！我会尽快回复您。';
                successToast.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: #10b981;
                    color: white;
                    padding: 12px 20px;
                    border-radius: 8px;
                    z-index: 9999;
                    font-size: 14px;
                    animation: fadeInUp 0.3s ease;
                `;
                document.body.appendChild(successToast);
                
                // 重置表单
                this.reset();
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
                
                setTimeout(() => {
                    successToast.remove();
                }, 3000);
            }, 2000);
        });
    }
    
    // ====================
    // 性能优化：防抖函数
    // ====================
    
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    // 使用防抖优化滚动事件
    const optimizedScrollHandler = debounce(function() {
        updateNavOnScroll();
    }, 10);
    
    window.addEventListener('scroll', optimizedScrollHandler);
    
    // ====================
    // 核心数据加载基础设施
    // ====================
    
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
    
    /**
     * 通用数据加载器（带错误处理和加载状态）
     * @param {string} widgetName - 组件名称（用于日志和错误提示）
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
    
    // ====================
    // 今日三问加载器
    // ====================
    
    async function loadDailyQuestions() {
        const todayKey = getTodayKey();
        const dataUrl = `data/pool-questions.json`;
        
        const renderer = (data, container) => {
            // 适配数组格式
            if (!Array.isArray(data) || data.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-calendar-times"></i>
                        <div>今日三问暂无内容</div>
                        <div style="font-size: 12px; color: var(--text-light); margin-top: 8px;">每日8:00自动更新</div>
                    </div>
                `;
                return;
            }
            
            // 从数组获取今日问题
            const questions = getTodayItems(data, 3);
            
            container.innerHTML = questions.map((q, index) => `
                <div class="dq-card">
                    <div class="dq-num">${String(index + 1).padStart(2, '0')}</div>
                    <div class="dq-text">${q}</div>
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
    
    // ====================
    // 每日五词加载器
    // ====================
    
    async function loadDailyKeywords() {
        const todayKey = getTodayKey();
        const dataUrl = `data/pool-keywords.json`;
        
        const renderer = (data, container) => {
            // 适配数组格式
            if (!Array.isArray(data) || data.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-book-open"></i>
                        <div>每日五词暂无内容</div>
                    </div>
                `;
                return;
            }
            
            // 从数组获取今日词汇
            const keywords = getTodayItems(data, 5);
            
            container.innerHTML = keywords.map((kw, index) => `
                <div class="kw-item">
                    <div class="kw-left">
                        <div class="kw-num">${String(index + 1).padStart(2, '0')}</div>
                        <div class="kw-badge">${kw.domain || '通用'}</div>
                    </div>
                    <div class="kw-right">
                        <div class="kw-term">${kw.term}</div>
                        <div class="kw-def">${kw.def}</div>
                        ${kw.eg ? `<div class="kw-eg"><strong>例:</strong> ${kw.eg}</div>` : ''}
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
    
    // ====================
    // 今日数感加载器
    // ====================
    
    async function loadDailyData() {
        const todayKey = getTodayKey();
        const dataUrl = `data/pool-data.json`;
        
        const renderer = (data, container) => {
            // 适配数组格式
            if (!Array.isArray(data) || data.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-chart-bar"></i>
                        <div>今日数感暂无内容</div>
                    </div>
                `;
                return;
            }
            
            // 从数组获取今日数据
            const datasets = getTodayItems(data, 6);
            
            container.innerHTML = datasets.map(dataset => `
                <div class="ds-card">
                    <div class="ds-head">
                        <div class="ds-topic">${dataset.topic}</div>
                        <div class="ds-domain-badge">${dataset.domain}</div>
                    </div>
                    <div class="ds-num-box">
                        <div class="ds-num">${dataset.num}</div>
                        <div class="ds-num-label">${dataset.label}</div>
                    </div>
                    <div class="ds-section-label">背景</div>
                    <div class="ds-ctx">${dataset.ctx}</div>
                    <div class="ds-sense">
                        <strong>数感:</strong> ${dataset.sense}
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
    
    // ====================
    // 资讯动态加载器
    // ====================
    
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
            
            container.innerHTML = items.map(item => {
                // 适配RSS标准字段
                const title = item.title || item.title_cn || '无标题';
                const link = item.link || '#';
                const source = item.source || getFeedName(feedType);
                const time = item.time || item.pubDate || '未知时间';
                const summary = item.summary || item.description || '';
                
                return `
                    <div class="news-item">
                        <div class="news-title">
                            <a href="${link}" target="_blank" rel="noopener">${title}</a>
                        </div>
                        <div class="news-meta">
                            <span class="news-source">${source}</span>
                            <span class="news-time">${time}</span>
                        </div>
                        ${summary ? `<div class="news-summary">${summary}</div>` : ''}
                    </div>
                `;
            }).join('');
            
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
    
    // ====================
    // 其他思维成长模块加载器（模板）
    // ====================
    
    // 跨域类比
    async function loadDailyAnalogy() {
        const dataUrl = `data/pool-analogies.json`;
        const renderer = (data, container) => {
            // 实现渲染逻辑
        };
        return loadWidgetData('DailyAnalogy', dataUrl, renderer, {
            containerId: 'analogy-card'
        });
    }
    
    // 信号vs噪声
    async function loadDailySignal() {
        const dataUrl = `data/pool-signals.json`;
        const renderer = (data, container) => {
            // 实现渲染逻辑
        };
        return loadWidgetData('DailySignal', dataUrl, renderer, {
            containerId: 'signal-card'
        });
    }
    
    // 认知偏误
    async function loadDailyBias() {
        const dataUrl = `data/pool-biases.json`;
        const renderer = (data, container) => {
            // 实现渲染逻辑
        };
        return loadWidgetData('DailyBias', dataUrl, renderer, {
            containerId: 'bias-card'
        });
    }
    
    // 逆向思维
    async function loadDailyInversion() {
        const dataUrl = `data/pool-inversions.json`;
        const renderer = (data, container) => {
            // 实现渲染逻辑
        };
        return loadWidgetData('DailyInversion', dataUrl, renderer, {
            containerId: 'inversion-card'
        });
    }
    
    // 历史类比
    async function loadDailyHistorical() {
        const dataUrl = `data/pool-historical.json`;
        const renderer = (data, container) => {
            // 实现渲染逻辑
        };
        return loadWidgetData('DailyHistorical', dataUrl, renderer, {
            containerId: 'historical-card'
        });
    }
    
    // 每日一人
    async function loadDailyPerson() {
        const dataUrl = `data/pool-persons.json`;
        const renderer = (data, container) => {
            // 实现渲染逻辑
        };
        return loadWidgetData('DailyPerson', dataUrl, renderer, {
            containerId: 'person-card'
        });
    }
    
    // 微写作
    async function loadDailyWriting() {
        const dataUrl = `data/pool-writing.json`;
        const renderer = (data, container) => {
            // 实现渲染逻辑
        };
        return loadWidgetData('DailyWriting', dataUrl, renderer, {
            containerId: 'writing-card'
        });
    }
    
    // 预测与校准
    async function loadPredictions() {
        const dataUrl = `data/pool-predictions.json`;
        const renderer = (data, container) => {
            // 实现渲染逻辑
        };
        return loadWidgetData('Predictions', dataUrl, renderer, {
            containerId: 'prediction-card'
        });
    }
    
    // 能源市场
    async function loadEnergyMarket() {
        const dataUrl = `data/energy.json`;
        const renderer = (data, container) => {
            // 实现渲染逻辑
        };
        return loadWidgetData('EnergyMarket', dataUrl, renderer, {
            containerId: 'em-grid'
        });
    }
    
    // ====================
    // 初始化所有数据加载
    // ====================
    
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
        
        // 加载其他思维成长模块（可选）
        // 可以根据需要启用
        /*
        loadDailyAnalogy();
        loadDailySignal();
        loadDailyBias();
        loadDailyInversion();
        loadDailyHistorical();
        loadDailyPerson();
        loadDailyWriting();
        loadPredictions();
        loadEnergyMarket();
        */
        
        console.log('每日内容加载初始化完成');
    }, 1000); // 延迟1秒加载，确保DOM完全就绪
    
    // ====================
    // 资讯标签切换
    // ====================
    
    // 为资讯标签添加点击事件
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
    
    // ====================
    // 初始化完成
    // ====================
    
    console.log('个人主页已加载完成！');
    console.log('Designed by 谢亮');
    console.log('GitHub: https://github.com/xie-l');
    
}

// ====================
// 数组索引映射工具函数
// ====================

/**
 * 将日期字符串转换为数组索引
 * @param {string} dateStr - 日期字符串 (YYYY-MM-DD)
 * @param {number} arrayLength - 数组长度
 * @returns {number} 数组索引
 */
function dateToIndex(dateStr, arrayLength) {
    const hash = dateStr.split('').reduce((acc, char) => {
        return acc + char.charCodeAt(0);
    }, 0);
    return Math.abs(hash) % arrayLength;
}

/**
 * 从数组获取今日数据项
 * @param {Array} array - 数据数组
 * @param {number} count - 需要获取的项数
 * @param {Date} date - 日期
 * @returns {Array} 数据项
 */
function getTodayItems(array, count, date = new Date()) {
    if (!Array.isArray(array) || array.length === 0) {
        return [];
    }
    
    const dateStr = date.toISOString().split('T')[0];
    const startIndex = dateToIndex(dateStr, array.length);
    
    const result = [];
    for (let i = 0; i < count; i++) {
        const index = (startIndex + i) % array.length;
        result.push(array[index]);
    }
    
    return result;
}

// ====================);

// 页面卸载时的清理
window.addEventListener('beforeunload', function() {
    console.log('页面即将卸载...');
});

// 错误处理
window.addEventListener('error', function(e) {
    console.error('发生错误:', e.error);
});

// 未处理的Promise拒绝
window.addEventListener('unhandledrejection', function(e) {
    console.error('未处理的Promise拒绝:', e.reason);
});
