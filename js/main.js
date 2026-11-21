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
            const targetSection = targetId === '#' ? document.body : document.getElementById(targetId.slice(1));
            
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
// Three.js 动态背景
// ====================

let scene, camera, renderer, particles;
let backgroundInitialized = false;

function initThreeJSBackground() {
    if (backgroundInitialized) return;
    
    try {
        const canvas = document.getElementById('hero-canvas');
        if (!canvas) {
            console.log('Canvas not found, skipping Three.js background');
            return;
        }
        
        // 检查WebGL支持
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (!gl) {
            console.log('WebGL not supported, using CSS fallback background');
            return;
        }
        
        // 初始化场景
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            alpha: true,
            antialias: true,
            powerPreference: 'high-performance'
        });
        
        // 限制像素比以提高性能
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(window.innerWidth, window.innerHeight);
        
        // 创建粒子
        const particlesGeometry = new THREE.BufferGeometry();
        const particlesCount = 5000; // 增加粒子数量提升视觉效果
        const posArray = new Float32Array(particlesCount * 3);
        
        for (let i = 0; i < particlesCount * 3; i++) {
            posArray[i] = (Math.random() - 0.5) * 10;
        }
        
        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
        
        const particlesMaterial = new THREE.PointsMaterial({
            size: 0.015, // 显著增大粒子尺寸，确保效果明显可见
            color: '#00ffff', // 更亮的青色提高对比度
            transparent: true,
            opacity: 1.0, // 完全不透明，效果更明显
            blending: THREE.AdditiveBlending
        });
        
        particles = new THREE.Points(particlesGeometry, particlesMaterial);
        scene.add(particles);
        
        camera.position.z = 2;
        
        // 隐藏CSS背景
        const fallbackBg = document.querySelector('.banner-bg-fallback');
        if (fallbackBg) {
            fallbackBg.style.opacity = '0';
            fallbackBg.style.transition = 'opacity 0.5s ease';
        }
        
        backgroundInitialized = true;
        animateBackground();
        
        console.log('Three.js background initialized successfully');
        
    } catch (error) {
        console.error('Failed to initialize Three.js background:', error);
        // 保持CSS背景
    }
}

// 鼠标交互变量
let mouseX = 0, mouseY = 0;
let targetMouseX = 0, targetMouseY = 0;

// 监听鼠标移动（仅在非移动端）
if (!/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
    document.addEventListener('mousemove', (e) => {
        targetMouseX = (e.clientX / window.innerWidth) * 2 - 1;
        targetMouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    });
}

function animateBackground() {
    if (!backgroundInitialized || !particles) return;
    
    requestAnimationFrame(animateBackground);
    
    // 平滑鼠标移动
    mouseX += (targetMouseX - mouseX) * 0.05;
    mouseY += (targetMouseY - mouseY) * 0.05;
    
    // 基础旋转 + 鼠标影响（加快旋转速度使效果更明显）
    particles.rotation.x += 0.0008 + mouseY * 0.0002;
    particles.rotation.y += 0.0008 + mouseX * 0.0002;
    
    renderer.render(scene, camera);
}

// 窗口大小调整
window.addEventListener('resize', () => {
    if (!backgroundInitialized || !camera || !renderer) return;
    
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// 页面可见性变化时暂停/恢复动画
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // 页面不可见时暂停动画
        if (backgroundInitialized) {
            console.log('Page hidden, pausing background animation');
        }
    } else {
        // 页面可见时恢复动画
        if (backgroundInitialized) {
            animateBackground();
        }
    }
});

    // 初始化背景（延迟执行，确保DOM加载完成）
    setTimeout(() => {
        initThreeJSBackground();
    }, 100);

    // 初始化完成
    // ====================
    
    console.log('个人主页已加载完成！');
    console.log('Designed by 谢亮');
    console.log('GitHub: https://github.com/xie-l');
});

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

// ====================

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
