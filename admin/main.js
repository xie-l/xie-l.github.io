// GitHub API 配置
const GITHUB_API_BASE = 'https://api.github.com';

// 获取存储的凭据
function getStoredCredentials() {
    return {
        token: localStorage.getItem('github_token'),
        repo: localStorage.getItem('github_repo'),
        owner: localStorage.getItem('github_owner')
    };
}

// 检查是否已登录
function checkAuth() {
    const creds = getStoredCredentials();
    if (!creds.token || !creds.repo || !creds.owner) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// 退出登录
function logout() {
    localStorage.removeItem('github_token');
    localStorage.removeItem('github_repo');
    localStorage.removeItem('github_owner');
    window.location.href = 'login.html';
}

// 清除设置
function clearSettings() {
    if (confirm('确定要清除所有本地设置吗？')) {
        logout();
    }
}

// GitHub API 请求
async function githubAPI(endpoint, options = {}) {
    const creds = getStoredCredentials();
    const url = `${GITHUB_API_BASE}${endpoint}`;
    
    const config = {
        headers: {
            'Authorization': `token ${creds.token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
        },
        ...options
    };
    
    try {
        const response = await fetch(url, config);
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'GitHub API 请求失败');
        }
        
        return await response.json();
    } catch (error) {
        console.error('GitHub API Error:', error);
        throw error;
    }
}

// 获取文件内容
async function getFileContent(path) {
    try {
        const creds = getStoredCredentials();
        const data = await githubAPI(`/repos/${creds.owner}/${creds.repo}/contents/${path}`);
        
        if (Array.isArray(data)) {
            // 如果是目录，返回文件列表
            return data;
        } else {
            // 如果是文件，返回解码后的内容
            return {
                content: atob(data.content),
                sha: data.sha
            };
        }
    } catch (error) {
        if (error.message.includes('404')) {
            return null; // 文件不存在
        }
        throw error;
    }
}

// 创建或更新文件
async function createOrUpdateFile(path, content, message, sha = null) {
    const creds = getStoredCredentials();
    
    const body = {
        message: message,
        content: btoa(unescape(encodeURIComponent(content)))
    };
    
    if (sha) {
        body.sha = sha; // 更新时需要提供sha
    }
    
    return await githubAPI(
        `/repos/${creds.owner}/${creds.repo}/contents/${path}`,
        {
            method: 'PUT',
            body: JSON.stringify(body)
        }
    );
}

// 删除文件
async function deleteFile(path, sha, message = '删除文件') {
    const creds = getStoredCredentials();
    
    return await githubAPI(
        `/repos/${creds.owner}/${creds.repo}/contents/${path}`,
        {
            method: 'DELETE',
            body: JSON.stringify({
                message: message,
                sha: sha
            })
        }
    );
}

// 显示提示信息
function showAlert(sectionId, message, type = 'info') {
    const alert = document.getElementById(`${sectionId}-alert`);
    alert.textContent = message;
    alert.className = `alert alert-${type}`;
    alert.style.display = 'block';
    
    setTimeout(() => {
        alert.style.display = 'none';
    }, 5000);
}

// 博客功能
class BlogManager {
    constructor() {
        this.form = document.getElementById('blogForm');
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.publishBlog();
        });
    }
    
    async publishBlog() {
        const title = document.getElementById('blog-title').value;
        const category = document.getElementById('blog-category').value;
        const tags = document.getElementById('blog-tags').value;
        const content = document.getElementById('blog-content').value;
        
        if (!title || !category || !content) {
            showAlert('blog', '请填写所有必填项', 'error');
            return;
        }
        
        try {
            // 生成文件名
            const date = new Date().toISOString().split('T')[0];
            const filename = `${date}-${this.slugify(title)}.html`;
            const path = `blog/${category}/${filename}`;
            
            // 生成HTML内容
            const htmlContent = this.generateBlogHTML(title, category, tags, content, date);
            
            // 创建文件
            await createOrUpdateFile(
                path,
                htmlContent,
                `添加新博客: ${title}`
            );
            
            showAlert('blog', '博客发布成功！', 'success');
            
            // 清空表单
            this.form.reset();
            
        } catch (error) {
            showAlert('blog', `发布失败: ${error.message}`, 'error');
        }
    }
    
    generateBlogHTML(title, category, tags, content, date) {
        const categoryNames = {
            'tech': '技术思考',
            'life': '生活日记'
        };
        
        const tagList = tags ? tags.split(',').map(tag => tag.trim()) : [];
        
        return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - 谢亮</title>
    <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📝</text></svg>">
    <link rel="stylesheet" href="../../css/style.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body>
    <div style="max-width: 800px; margin: 100px auto 50px; padding: 0 20px;">
        <a href="../" style="color: var(--secondary-color); text-decoration: none;">
            <i class="fas fa-arrow-left"></i> 返回${categoryNames[category]}
        </a>
        
        <article style="background: var(--card-bg); border-radius: 15px; padding: 40px; margin-top: 20px; box-shadow: var(--shadow);">
            <h1 style="color: var(--primary-color); margin-bottom: 10px;">${title}</h1>
            <div style="color: var(--text-light); font-size: 14px; margin-bottom: 30px;">
                <i class="fas fa-calendar"></i> 发布日期: ${date}
                ${tagList.length > 0 ? `<span style="margin-left: 20px;"><i class="fas fa-tags"></i> ${tagList.join(', ')}</span>` : ''}
            </div>
            
            <div style="line-height: 1.8; color: var(--text-color);">
                ${content.replace(/\n/g, '<br>')}
            </div>
        </article>
    </div>
    
    <footer class="footer">
        <div class="footer-content">
            <p>&copy; 2026 谢亮. All rights reserved.</p>
        </div>
    </footer>
</body>
</html>`;
    }
    
    slugify(text) {
        return text.toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
    }
    
    previewBlog() {
        const content = document.getElementById('blog-content').value;
        const title = document.getElementById('blog-title').value;
        
        if (!content) {
            showAlert('blog', '没有内容可以预览', 'error');
            return;
        }
        
        // 打开新窗口显示预览
        const previewWindow = window.open('', '_blank', 'width=800,height=600');
        previewWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>预览 - ${title}</title>
                <link rel="stylesheet" href="../css/style.css">
            </head>
            <body>
                <div style="max-width: 800px; margin: 40px auto; padding: 20px;">
                    <h1>${title}</h1>
                    <div style="line-height: 1.8;">${content.replace(/\n/g, '<br>')}</div>
                </div>
            </body>
            </html>
        `);
    }
    
    saveDraft() {
        const formData = {
            title: document.getElementById('blog-title').value,
            category: document.getElementById('blog-category').value,
            tags: document.getElementById('blog-tags').value,
            content: document.getElementById('blog-content').value,
            savedAt: new Date().toISOString()
        };
        
        localStorage.setItem('blog_draft', JSON.stringify(formData));
        showAlert('blog', '草稿已保存到本地', 'success');
    }
    
    loadDraft() {
        const draft = localStorage.getItem('blog_draft');
        if (draft) {
            const data = JSON.parse(draft);
            document.getElementById('blog-title').value = data.title || '';
            document.getElementById('blog-category').value = data.category || '';
            document.getElementById('blog-tags').value = data.tags || '';
            document.getElementById('blog-content').value = data.content || '';
        }
    }
}

// 文件管理
class FileManager {
    constructor() {
        this.uploadedFiles = [];
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // 文件选择
        document.getElementById('file-input').addEventListener('change', (e) => {
            this.handleFileSelect(e);
        });
        
        // 拖拽上传
        const uploadArea = document.querySelector('.upload-area');
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });
        
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            this.handleFileSelect({ target: { files: e.dataTransfer.files } });
        });
    }
    
    async handleFileSelect(event) {
        const files = Array.from(event.target.files);
        const directory = document.getElementById('upload-directory').value;
        
        for (const file of files) {
            // 检查文件大小（10MB限制）
            if (file.size > 10 * 1024 * 1024) {
                showAlert('file', `文件 "${file.name}" 超过10MB限制`, 'error');
                continue;
            }
            
            const fileItem = this.createFileItem(file, directory);
            document.getElementById('file-list').appendChild(fileItem);
            
            try {
                await this.uploadFile(file, directory, fileItem);
            } catch (error) {
                showAlert('file', `上传失败: ${error.message}`, 'error');
            }
        }
        
        // 清空input
        event.target.value = '';
    }
    
    createFileItem(file, directory) {
        const item = document.createElement('div');
        item.className = 'file-item';
        item.innerHTML = `
            <div class="file-info">
                <div class="file-icon">
                    <i class="fas ${this.getFileIcon(file.name)}"></i>
                </div>
                <div>
                    <div class="file-name">${file.name}</div>
                    <div class="file-size">${this.formatFileSize(file.size)}</div>
                    <div class="progress">
                        <div class="progress-bar" style="width: 0%"></div>
                    </div>
                </div>
            </div>
            <div class="file-actions">
                <button class="btn btn-small btn-danger" onclick="fileManager.removeFile(this)">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        return item;
    }
    
    async uploadFile(file, directory, item) {
        const progressBar = item.querySelector('.progress-bar');
        
        try {
            // 模拟进度
            let progress = 0;
            const interval = setInterval(() => {
                progress += Math.random() * 20;
                if (progress >= 90) {
                    progress = 90;
                    clearInterval(interval);
                }
                progressBar.style.width = progress + '%';
            }, 100);
            
            // 读取文件内容
            const content = await this.readFileAsBase64(file);
            
            // 上传文件
            const path = directory + file.name;
            await createOrUpdateFile(
                path,
                content,
                `上传文件: ${file.name}`
            );
            
            // 完成进度
            clearInterval(interval);
            progressBar.style.width = '100%';
            progressBar.style.background = '#10b981';
            
            showAlert('file', `文件 "${file.name}" 上传成功`, 'success');
            
        } catch (error) {
            item.querySelector('.progress-bar').style.background = '#ef4444';
            throw error;
        }
    }
    
    readFileAsBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }
    
    getFileIcon(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        const iconMap = {
            'jpg': 'fa-file-image',
            'jpeg': 'fa-file-image',
            'png': 'fa-file-image',
            'gif': 'fa-file-image',
            'pdf': 'fa-file-pdf',
            'doc': 'fa-file-word',
            'docx': 'fa-file-word',
            'xls': 'fa-file-excel',
            'xlsx': 'fa-file-excel',
            'zip': 'fa-file-archive',
            'rar': 'fa-file-archive'
        };
        return iconMap[ext] || 'fa-file';
    }
    
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    removeFile(button) {
        const item = button.closest('.file-item');
        item.remove();
    }
}

// 页面切换
function switchSection(sectionName) {
    // 隐藏所有section
    document.querySelectorAll('.admin-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // 显示目标section
    document.getElementById(`${sectionName}-section`).classList.add('active');
    
    // 更新导航状态
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');
}

// 初始化
let blogManager, fileManager;

document.addEventListener('DOMContentLoaded', function() {
    if (!checkAuth()) return;
    
    // 初始化管理器
    blogManager = new BlogManager();
    fileManager = new FileManager();
    
    // 加载草稿
    blogManager.loadDraft();
    
    // 填充设置
    const creds = getStoredCredentials();
    document.getElementById('settings-token').value = creds.token.substring(0, 10) + '...';
    document.getElementById('settings-repo').value = creds.repo;
    document.getElementById('settings-owner').value = creds.owner;
    
    // 导航切换
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            switchSection(link.dataset.section);
        });
    });
});

// 全局函数
window.logout = logout;
window.clearSettings = clearSettings;
window.previewBlog = () => blogManager.previewBlog();
window.saveDraft = () => blogManager.saveDraft();
window.fileManager = fileManager;
// 个人信息管理
class ProfileManager {
    constructor() {
        this.data = new ProfileData();
        this.form = document.getElementById('profileForm');
        this.setupEventListeners();
        this.loadProfile();
    }
    
    setupEventListeners() {
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveProfile();
        });
    }
    
    // 加载个人信息到表单
    loadProfile() {
        // 优先从localStorage加载
        if (this.data.loadFromStorage()) {
            this.fillForm(this.data.data);
        } else {
            // 从当前index.html加载（简化版）
            this.loadFromCurrentPage();
        }
    }
    
    // 从当前页面加载（简化版）
    loadFromCurrentPage() {
        // 这里简化处理，使用默认数据
        this.data.loadFromStorage() || this.data.loadFromHTML();
        this.fillForm(this.data.data);
    }
    
    // 填充表单
    fillForm(data) {
        // 个人信息
        document.getElementById('profile-name').value = data.profile.name || '';
        document.getElementById('profile-title').value = data.profile.title || '';
        document.getElementById('profile-bio').value = data.profile.bio || '';
        document.getElementById('profile-tags').value = (data.profile.tags || []).join(', ');
        document.getElementById('profile-email').value = data.profile.email || '';
        document.getElementById('profile-phone').value = data.profile.phone || '';
        document.getElementById('profile-address').value = data.profile.address || '';
        document.getElementById('profile-github').value = data.profile.github || '';
        
        // 其他部分（简化版，实际应该加载更多）
        document.getElementById('profile-education').value = this.arrayToText(data.education.items) || '';
        document.getElementById('profile-projects').value = this.arrayToText(data.projects.items) || '';
        document.getElementById('profile-publications').value = this.arrayToText(data.publications?.items) || '';
        document.getElementById('profile-skills').value = this.arrayToText(data.skills?.categories) || '';
    }
    
    // 将数组转换为文本
    arrayToText(array) {
        if (!array || !Array.isArray(array)) return '';
        return array.map(item => {
            if (typeof item === 'string') return item;
            return JSON.stringify(item, null, 2);
        }).join('\n\n');
    }
    
    // 保存个人信息
    async saveProfile() {
        try {
            // 收集表单数据
            const profileData = this.collectFormData();
            
            // 验证数据
            if (!this.validateData(profileData)) {
                showAlert('profile', '请填写所有必填项', 'error');
                return;
            }
            
            // 保存到localStorage
            this.data.data = profileData;
            this.data.saveToStorage();
            
            // 生成新的index.html
            const htmlContent = this.generateIndexHTML(profileData);
            
            // 上传到GitHub
            await createOrUpdateFile(
                'index.html',
                htmlContent,
                '更新个人信息'
            );
            
            showAlert('profile', '个人信息更新成功！', 'success');
            
        } catch (error) {
            showAlert('profile', `更新失败: ${error.message}`, 'error');
        }
    }
    
    // 收集表单数据
    collectFormData() {
        return {
            profile: {
                name: document.getElementById('profile-name').value,
                title: document.getElementById('profile-title').value,
                bio: document.getElementById('profile-bio').value,
                tags: document.getElementById('profile-tags').value.split(',').map(tag => tag.trim()).filter(tag => tag),
                email: document.getElementById('profile-email').value,
                phone: document.getElementById('profile-phone').value,
                address: document.getElementById('profile-address').value,
                github: document.getElementById('profile-github').value
            },
            // 其他部分需要解析，这里简化处理
            about: {
                paragraphs: [document.getElementById('profile-bio').value]
            }
        };
    }
    
    // 验证数据
    validateData(data) {
        return data.profile.name && data.profile.title && data.profile.bio;
    }
    
    // 生成index.html内容
    generateIndexHTML(profileData) {
        // 这里简化处理，实际应该生成完整的HTML
        // 由于HTML结构复杂，这里只更新关键部分
        
        return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${profileData.profile.name} - 个人主页</title>
    <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>👨‍💻</text></svg>">
    <link rel="stylesheet" href="css/style.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body>
    <!-- 顶部导航栏 -->
    <header class="header">
        <div class="container">
            <div class="header-content">
                <div class="logo">
                    <a href="#home">个人主页</a>
                </div>
                <nav class="nav">
                    <ul class="nav-menu">
                        <li><a href="blog/" class="nav-link nav-external">博客</a></li>
                        <li><a href="files/" class="nav-link nav-external">资源</a></li>
                        <li><a href="admin/login.html" class="nav-link nav-external">管理</a></li>
                    </ul>
                </nav>
                <div class="mobile-toggle">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        </div>
    </header>

    <!-- 横幅区域 -->
    <section class="banner">
        <div class="banner-bg"></div>
        <div class="banner-content">
            <div class="container">
                <h1 class="banner-title">探索技术的无限可能</h1>
                <p class="banner-subtitle">碳基电催化 · 机器学习 · 能源转化</p>
                <div class="banner-meta">
                    <span><i class="fas fa-graduation-cap"></i> 哈尔滨工业大学</span>
                    <span><i class="fas fa-map-marker-alt"></i> 哈尔滨</span>
                </div>
            </div>
        </div>
    </section>

    <!-- 个人信息区域 -->
    <section class="profile-section">
        <div class="container">
            <div class="profile-card">
                <div class="profile-avatar">
                    <img src="img/avatar.jpg" alt="${profileData.profile.name}" class="avatar" onerror="this.src='https://via.placeholder.com/200'">
                </div>
                <div class="profile-info">
                    <h2 class="profile-name">${profileData.profile.name}</h2>
                    <h3 class="profile-title">${profileData.profile.title}</h3>
                    <p class="profile-bio">${profileData.profile.bio}</p>
                    <div class="profile-tags">
                        ${profileData.profile.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                    <div class="profile-contact">
                        <a href="mailto:${profileData.profile.email}" class="contact-btn">
                            <i class="fas fa-envelope"></i> 联系我
                        </a>
                        <a href="${profileData.profile.github}" target="_blank" class="contact-btn secondary">
                            <i class="fab fa-github"></i> GitHub
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- 主要内容区域 -->
    <div class="main-content">
        <div class="container">
            <div class="content-wrapper">
                <!-- 左侧主内容 -->
                <main class="main-column">
                    <!-- 关于我 -->
                    <section id="about" class="section">
                        <div class="section-header">
                            <h2 class="section-title">个人简介</h2>
                        </div>
                        <div class="section-content">
                            <div class="about-content">
                                <p>${profileData.profile.bio}</p>
                            </div>
                        </div>
                    </section>

                    <!-- 更多内容... -->
                </main>
                
                <!-- 右侧边栏 -->
                <aside class="sidebar">
                    <!-- 联系方式 -->
                    <div class="sidebar-widget">
                        <h3 class="widget-title">联系方式</h3>
                        <div class="contact-list">
                            <div class="contact-item">
                                <div class="contact-icon">
                                    <i class="fas fa-envelope"></i>
                                </div>
                                <div class="contact-info">
                                    <h4>邮箱</h4>
                                    <p>${profileData.profile.email}</p>
                                </div>
                            </div>
                            <div class="contact-item">
                                <div class="contact-icon">
                                    <i class="fas fa-phone"></i>
                                </div>
                                <div class="contact-info">
                                    <h4>电话</h4>
                                    <p>${profileData.profile.phone}</p>
                                </div>
                            </div>
                            <div class="contact-item">
                                <div class="contact-icon">
                                    <i class="fas fa-map-marker-alt"></i>
                                </div>
                                <div class="contact-info">
                                    <h4>地址</h4>
                                    <p>${profileData.profile.address}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    </div>

    <!-- 页脚 -->
    <footer class="footer">
        <div class="container">
            <div class="footer-content">
                <p>&copy; 2026 ${profileData.profile.name}. All rights reserved. | 备案号：京ICP备12345678号</p>
                <p>Powered by <a href="https://pages.github.com" target="_blank">GitHub Pages</a></p>
            </div>
        </div>
    </footer>

    <!-- 返回顶部 -->
    <div class="back-to-top" id="backToTop">
        <i class="fas fa-arrow-up"></i>
    </div>

    <script src="js/main.js"></script>
</body>
</html>`;
    }
    
    // 预览个人信息
    previewProfile() {
        const data = this.collectFormData();
        const previewWindow = window.open('', '_blank', 'width=800,height=600');
        previewWindow.document.write(this.generateIndexHTML(data));
    }
}

// 初始化个人信息管理器
let profileManager;

// 修改DOMContentLoaded事件
document.addEventListener('DOMContentLoaded', function() {
    if (!checkAuth()) return;
    
    // 初始化管理器
    blogManager = new BlogManager();
    fileManager = new FileManager();
    profileManager = new ProfileManager();
    
    // 加载草稿
    blogManager.loadDraft();
    
    // 填充设置
    const creds = getStoredCredentials();
    document.getElementById('settings-token').value = creds.token.substring(0, 10) + '...';
    document.getElementById('settings-repo').value = creds.repo;
    document.getElementById('settings-owner').value = creds.owner;
    
    // 导航切换
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            switchSection(link.dataset.section);
        });
    });
});

// 添加全局函数
window.previewProfile = () => profileManager.previewProfile();
window.profileManager = profileManager;
