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
    // 初始化完成
    // ====================
    
    console.log('个人主页已加载完成！');
    console.log('Designed by 谢亮');
    console.log('GitHub: https://github.com/xie-l');
    
});

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
