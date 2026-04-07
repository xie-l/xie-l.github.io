/**
 * 移动端优化模块
 * 实现侧边栏折叠、底部快速操作栏等功能
 */

(function() {
    'use strict';

    // 检测是否为移动端
    const isMobile = window.innerWidth <= 768;

    /**
     * 初始化移动端优化
     */
    function init() {
        if (!isMobile) return;

        console.log('初始化移动端优化');

        // 初始化侧边栏折叠
        initSidebarCollapse();

        // 初始化底部快速操作栏
        initQuickActions();

        // 优化触摸交互
        optimizeTouchInteraction();
    }

    /**
     * 初始化侧边栏折叠功能
     */
    function initSidebarCollapse() {
        const sidebarWidgets = document.querySelectorAll('.sidebar-widget');
        
        sidebarWidgets.forEach((widget, index) => {
            const title = widget.querySelector('.widget-title');
            const content = widget.querySelector('.widget-content') || widget.querySelector('.clock-wrap, #w-weather, .widget-links, .stats-grid, .contact-info');
            
            if (!title || !content) return;

            // 将内容包装在widget-content中
            if (!widget.querySelector('.widget-content')) {
                const wrapper = document.createElement('div');
                wrapper.className = 'widget-content';
                wrapper.appendChild(content);
                widget.appendChild(wrapper);
            }

            // 默认展开前2个widget，其余折叠
            if (index < 2) {
                widget.classList.add('expanded');
            }

            // 添加点击事件
            title.addEventListener('click', () => {
                widget.classList.toggle('expanded');
                
                // 添加点击反馈
                title.style.transform = 'scale(0.98)';
                setTimeout(() => {
                    title.style.transform = '';
                }, 100);
            });

            // 添加触摸反馈
            title.addEventListener('touchstart', () => {
                title.style.background = 'var(--bg-tertiary)';
            });

            title.addEventListener('touchend', () => {
                setTimeout(() => {
                    title.style.background = '';
                }, 150);
            });
        });
    }

    /**
     * 初始化底部快速操作栏
     */
    function initQuickActions() {
        // 创建底部操作栏
        const quickActionsBar = document.createElement('div');
        quickActionsBar.className = 'mobile-quick-actions';
        quickActionsBar.innerHTML = `
            <a href="/" class="action-btn" title="首页">
                <i class="fas fa-home"></i>
                <span>首页</span>
            </a>
            <a href="about.html" class="action-btn" title="关于我">
                <i class="fas fa-user"></i>
                <span>关于我</span>
            </a>
            <a href="blog/" class="action-btn" title="博客">
                <i class="fas fa-pen-nib"></i>
                <span>博客</span>
            </a>
            <a href="#news-feed" class="action-btn" title="动态" onclick="scrollToTop(event)">
                <i class="fas fa-newspaper"></i>
                <span>动态</span>
            </a>
            <a href="#backToTop" class="action-btn" title="顶部" onclick="scrollToTop(event)">
                <i class="fas fa-arrow-up"></i>
                <span>顶部</span>
            </a>
        `;

        // 添加到页面
        document.body.appendChild(quickActionsBar);

        // 添加滚动时隐藏/显示逻辑
        let lastScrollTop = 0;
        let isHidden = false;

        window.addEventListener('scroll', () => {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            
            if (scrollTop > lastScrollTop && scrollTop > 100) {
                // 向下滚动，隐藏操作栏
                if (!isHidden) {
                    quickActionsBar.style.transform = 'translateY(100%)';
                    isHidden = true;
                }
            } else {
                // 向上滚动，显示操作栏
                if (isHidden) {
                    quickActionsBar.style.transform = 'translateY(0)';
                    isHidden = false;
                }
            }
            
            lastScrollTop = scrollTop;
        });
    }

    /**
     * 优化触摸交互
     */
    function optimizeTouchInteraction() {
        // 为所有可点击元素添加触摸反馈
        const clickableElements = document.querySelectorAll(
            'a, button, .nav-link, .contact-btn, .tag, .action-btn'
        );

        clickableElements.forEach(element => {
            // 移除双击缩放
            element.addEventListener('touchstart', (e) => {
                if (element.tagName === 'A' && element.href.includes('#')) {
                    e.preventDefault();
                }
            }, { passive: false });

            // 添加触摸反馈
            element.addEventListener('touchstart', () => {
                element.style.opacity = '0.7';
                element.style.transform = 'scale(0.98)';
            }, { passive: true });

            element.addEventListener('touchend', () => {
                setTimeout(() => {
                    element.style.opacity = '';
                    element.style.transform = '';
                }, 100);
            }, { passive: true });
        });

        // 优化输入框焦点
        const inputs = document.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            input.addEventListener('focus', () => {
                // 确保输入框在视口内
                setTimeout(() => {
                    input.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'center',
                        inline: 'nearest'
                    });
                }, 100);
            });
        });
    }

    /**
     * 滚动到顶部
     */
    window.scrollToTop = function(event) {
        if (event) event.preventDefault();
        
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    /**
     * 滚动到指定元素
     */
    window.scrollToElement = function(selector) {
        const element = document.querySelector(selector);
        if (element) {
            element.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    };

    // 页面加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // 窗口大小改变时重新检测
    window.addEventListener('resize', () => {
        const newIsMobile = window.innerWidth <= 768;
        if (newIsMobile !== isMobile) {
            location.reload(); // 简单处理：重新加载页面
        }
    });

    // 暴露全局方法
    window.MobileOptimize = {
        init,
        initSidebarCollapse,
        initQuickActions,
        optimizeTouchInteraction
    };

})();
