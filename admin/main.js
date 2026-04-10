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
            // GitHub base64 内容有换行符，需要先去掉再 atob
            // 注意：atob 返回二进制字符串，中文必须用 decodeURIComponent(escape(...)) 还原
            return {
                content: decodeURIComponent(escape(atob(data.content.replace(/\n/g, '')))),
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
        console.log('[DEBUG] 提供 SHA 参数:', sha);
    } else {
        console.log('[DEBUG] 未提供 SHA 参数，将创建新文件');
    }
    
    console.log('[DEBUG] 请求体:', JSON.stringify(body, null, 2));
    
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
        const title = document.getElementById('blog-title').value.trim();
        const category = document.getElementById('blog-category').value;
        const tags = document.getElementById('blog-tags').value;
        const content = document.getElementById('blog-content').value.trim();

        if (!title || !category || !content) {
            showAlert('blog', '请填写所有必填项', 'error');
            return;
        }

        const submitBtn = this.form.querySelector('button[type="submit"]');
        const originalHTML = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 发布中...';
        submitBtn.disabled = true;

        try {
            const now = new Date();
            const date = now.toISOString().split('T')[0];
            // 生成文件名：标题-年月.html（中文友好）
            const monthStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}`;
            const shortTitle = this.slugify(title) || 'post';
            const filename = `${shortTitle}（${monthStr}）.html`;
            const path = `blog/${category}/${filename}`;

            // 生成 HTML（用 marked 转换 Markdown）
            const tagList = tags ? tags.split(',').map(t => t.trim()).filter(t => t) : [];
            const htmlContent = this.generateBlogHTML(title, category, tagList, content, date);

            // 检查文件是否已存在，获取 SHA
            let fileSha = null;
            try {
                const existingFile = await getFileContent(path);
                if (existingFile && existingFile.sha) {
                    fileSha = existingFile.sha;
                    console.log('[DEBUG] 获取到文件 SHA:', fileSha);
                }
            } catch (error) {
                // 文件不存在是正常现象
                if (!error.message.includes('404')) {
                    console.warn('检查文件存在性时出错:', error);
                }
            }

            // 创建或更新博文文件
            await createOrUpdateFile(
                path,
                htmlContent,
                `发布博客: ${title}`,
                fileSha
            );

            // 更新分类索引页
            await this.updateCategoryIndex(category, title, filename, tagList, content);

            this.form.reset();
            localStorage.removeItem('blog_draft');
            // 切换到成功状态面板（新版 dashboard 提供，旧版降级为 alert）
            if (typeof showBlogSuccess === 'function') {
                showBlogSuccess(title, category);
            } else {
                showAlert('blog', '✓ 博客发布成功！约1-2分钟后在博客可见。', 'success');
            }

        } catch (error) {
            showAlert('blog', `发布失败: ${error.message}`, 'error');
        } finally {
            submitBtn.innerHTML = originalHTML;
            submitBtn.disabled = false;
        }
    }

    // 更新分类索引页（在 post-list 最前面插入新条目）
    async updateCategoryIndex(category, title, filename, tagList, content) {
        const indexPath = `blog/${category}/index.html`;
        try {
            const file = await getFileContent(indexPath);
            if (!file) return; // 索引不存在，跳过

            // 生成摘要（取正文前80字）
            const plainText = content.replace(/[#*`>_\[\]!]/g, '').replace(/\n+/g, ' ').trim();
            const excerpt = plainText.length > 80 ? plainText.substring(0, 80) + '…' : plainText;

            const tagsHtml = tagList
                .map(t => `<span class="tag">${t}</span>`)
                .join('\n                    ');

            const today = new Date();
            const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

            const newEntry = `            <a href="${filename}" class="post-item">
                <div class="post-date">${dateStr}</div>
                <h3 class="post-title">${title}</h3>
                <p class="post-excerpt">${excerpt}</p>
                <div class="post-tags">
                    ${tagsHtml}
                </div>
            </a>`;

            // 插入到 post-list 开头
            const updatedHtml = file.content.replace(
                /(<div class="post-list">)/,
                `$1\n${newEntry}`
            );

            await createOrUpdateFile(
                indexPath,
                updatedHtml,
                `更新${this.getCategoryName(category)}索引: ${title}`,
                file.sha
            );
        } catch (e) {
            console.warn('更新索引页失败（不影响博文发布）:', e.message);
        }
    }

    getCategoryName(category) {
        const names = {
            tech: '技术思考',
            life: '生活日记',
            books: '书籍阅读',
            analysis: '数据分析'
        };
        return names[category] || category;
    }
    
    generateBlogHTML(title, category, tagList, content, date) {
        const categoryName = this.getCategoryName(category);

        // 用 marked.js 转换 Markdown（如果已加载）
        const bodyHtml = (typeof marked !== 'undefined')
            ? marked.parse(content)
            : content.replace(/\n/g, '<br>');

        // 估算阅读时长（按每分钟500字）
        const charCount = content.replace(/\s/g, '').length;
        const readMin = Math.max(3, Math.round(charCount / 500));

        const tagsHtml = tagList
            .map(t => `<span class="tag">${t}</span>`)
            .join('\n            ');
        const tagClickScript = `<script>
document.querySelectorAll('.tag').forEach(function(el){el.style.cursor='pointer';el.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();location.href='../tags.html?tag='+encodeURIComponent(el.textContent.trim());});});
<\/script>`;

        const year = date.split('-')[0];
        const dateZh = date.replace(/-/g, '年').replace(/年(\d{2})年/, '年$1月') + '日';

        return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - 谢亮的${categoryName}</title>
    <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📝</text></svg>">
    <link rel="stylesheet" href="../../css/style.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        .blog-container {
            max-width: 900px;
            margin: 100px auto 50px;
            padding: 0 20px;
        }
        .back-link {
            display: inline-block;
            margin-bottom: 20px;
            color: var(--secondary-color);
            text-decoration: none;
            transition: var(--transition);
        }
        .back-link:hover { color: var(--primary-color); }
        .post-header {
            text-align: center;
            margin-bottom: 40px;
            padding-bottom: 30px;
            border-bottom: 1px solid var(--border-color);
        }
        .post-title {
            font-size: 28px;
            color: var(--primary-color);
            margin-bottom: 15px;
            line-height: 1.4;
        }
        .post-meta {
            color: var(--text-light);
            font-size: 14px;
            display: flex;
            justify-content: center;
            gap: 20px;
            flex-wrap: wrap;
        }
        .post-content {
            background: var(--card-bg);
            border-radius: 15px;
            padding: 40px;
            box-shadow: var(--shadow-md);
            line-height: 1.8;
            font-size: 16px;
        }
        .post-content h2 {
            color: var(--primary-color);
            margin-top: 40px;
            margin-bottom: 20px;
            font-size: 22px;
            border-bottom: 2px solid var(--secondary-color);
            padding-bottom: 8px;
        }
        .post-content h3 {
            color: var(--primary-color);
            margin-top: 28px;
            margin-bottom: 15px;
            font-size: 18px;
        }
        .post-content p { margin-bottom: 18px; text-align: justify; }
        .post-content ul, .post-content ol { margin-left: 25px; margin-bottom: 18px; }
        .post-content li { margin-bottom: 10px; line-height: 1.7; }
        .post-content strong { color: var(--primary-color); font-weight: 600; }
        .post-content blockquote {
            border-left: 4px solid var(--secondary-color);
            background: rgba(6, 182, 212, 0.06);
            padding: 16px 20px;
            margin: 24px 0;
            border-radius: 0 8px 8px 0;
            font-style: italic;
            color: var(--text-light);
        }
        .post-content code {
            background: rgba(6, 182, 212, 0.1);
            padding: 2px 6px;
            border-radius: 4px;
            font-family: 'JetBrains Mono', monospace;
            font-size: 0.9em;
        }
        .post-content pre {
            background: #1e293b;
            color: #e2e8f0;
            padding: 20px;
            border-radius: 10px;
            overflow-x: auto;
            margin-bottom: 20px;
        }
        .post-content pre code { background: none; padding: 0; color: inherit; }
        .post-tags {
            margin-top: 40px;
            padding-top: 30px;
            border-top: 1px solid var(--border-color);
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
        }
        .tag {
            font-size: 13px;
            background: var(--secondary-color);
            color: white;
            padding: 5px 12px;
            border-radius: 20px;
        }
        @media (max-width: 768px) {
            .blog-container { margin-top: 80px; }
            .post-content { padding: 20px; }
            .post-title { font-size: 22px; }
        }
    </style>
</head>
<body>
    <div class="blog-container">
        <a href="./" class="back-link">
            <i class="fas fa-arrow-left"></i> 返回${categoryName}
        </a>

        <article class="post-header">
            <h1 class="post-title">${title}</h1>
            <div class="post-meta">
                <span><i class="fas fa-calendar"></i> ${dateZh}</span>
                <span><i class="fas fa-clock"></i> 阅读时长：约${readMin}分钟</span>
                ${tagList.length > 0 ? `<span><i class="fas fa-tag"></i> ${tagList[0]}</span>` : ''}
            </div>
        </article>

        <div class="post-content">
            ${bodyHtml}
        </div>

        <div class="post-tags">
            ${tagsHtml}
        </div>
    </div>

    <footer class="footer">
        <div class="footer-content">
            <p>&copy; ${year} 谢亮. All rights reserved.</p>
        </div>
    </footer>
    ${tagClickScript}
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
        if (!files.length) return;
        const directory = document.getElementById('upload-directory').value;
        const rawTags   = (document.getElementById('upload-tags') || {}).value || '';
        const tagList   = rawTags.split(/[,，、;\s]+/).map(t => t.trim()).filter(Boolean);

        for (const file of files) {
            if (file.size > 10 * 1024 * 1024) {
                showAlert('file', `文件 "${file.name}" 超过10MB限制`, 'error');
                continue;
            }
            const fileItem = this.createFileItem(file, directory);
            document.getElementById('file-list').appendChild(fileItem);
            try {
                await this.uploadFile(file, directory, fileItem, tagList);
            } catch (error) {
                showAlert('file', `上传失败: ${error.message}`, 'error');
            }
        }
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
    
    async uploadFile(file, directory, item, tagList = []) {
        const progressBar = item.querySelector('.progress-bar');
        const statusDiv   = item.querySelector('.file-size');
        try {
            let progress = 0;
            const interval = setInterval(() => {
                progress += Math.random() * 20;
                if (progress >= 90) { progress = 90; clearInterval(interval); }
                progressBar.style.width = progress + '%';
            }, 100);

            const content = await this.readFileAsBase64(file);
            const path    = directory + file.name;
            await createOrUpdateFile(path, content, `上传文件: ${file.name}`);

            clearInterval(interval);
            progressBar.style.width = '100%';
            progressBar.style.background = '#10b981';
            // 进度条后显示持久的成功文字
            progressBar.insertAdjacentHTML('afterend',
                '<div style="color:#10b981;font-size:12px;margin-top:4px;font-weight:600">' +
                '✅ 上传成功' + (tagList.length ? '  |  标签：' + tagList.join(' / ') : '') + '</div>');

            // 保存标签到 data/files-index.json
            if (tagList.length > 0) {
                await this.saveFileIndex(file, path, tagList);
            }

            showAlert('file', `✅ "${file.name}" 上传成功${tagList.length ? '，标签：' + tagList.join(' / ') : ''}`, 'success');
        } catch (error) {
            item.querySelector('.progress-bar').style.background = '#ef4444';
            if (statusDiv) statusDiv.textContent = '❌ 上传失败';
            throw error;
        }
    }

    // 将文件元数据+标签写入 data/files-index.json
    async saveFileIndex(file, path, tagList) {
        try {
            const creds = getStoredCredentials();
            const apiBase = `${GITHUB_API_BASE}/repos/${creds.owner}/${creds.repo}/contents/`;
            const indexPath = 'data/files-index.json';

            // 读取现有 index（可能不存在）
            let existing = { files: [] };
            let sha = null;
            try {
                const res = await fetch(apiBase + indexPath, {
                    headers: { 'Authorization': `token ${creds.token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    existing = JSON.parse(decodeURIComponent(escape(atob(data.content.replace(/\n/g,'')))));
                    sha = data.sha;
                }
            } catch(e) { /* 首次创建 */ }

            // 去重：同名文件更新标签
            existing.files = (existing.files || []).filter(f => f.name !== file.name || f.path !== path);
            existing.files.unshift({
                name: file.name,
                path: path,
                tags: tagList,
                size: file.size,
                uploadedAt: new Date().toISOString().slice(0,10)
            });

            const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(existing, null, 2))));
            const body = { message: `更新文件索引：${file.name}`, content: encoded };
            if (sha) body.sha = sha;
            await fetch(apiBase + indexPath, {
                method: 'PUT',
                headers: { 'Authorization': `token ${creds.token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
        } catch(e) {
            console.warn('文件索引更新失败（不影响上传）:', e);
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
let blogManager, fileManager, profileEditor;

// 页面初始化
document.addEventListener('DOMContentLoaded', function() {
    if (!checkAuth()) return;
    
    // 初始化管理器
    blogManager = new BlogManager();
    fileManager = new FileManager();
    profileEditor = new ProfileEditor();
    
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

// 全局函数（博客相关）
window.previewBlog = function() {
    if (typeof blogManager !== 'undefined') blogManager.previewBlog();
};
window.saveDraft = function() {
    if (typeof blogManager !== 'undefined') blogManager.saveDraft();
};

// ═══════════════════════════════════════════════════════════════════════════════
// 快速记录功能（摘录记录 + 随笔思考）
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * 显示快速记录表单
 * @param {string} type - 'quote' 或 'thought'
 */
function showCaptureForm(type) {
    // 隐藏所有表单
    document.querySelectorAll('.capture-form').forEach(form => {
        form.style.display = 'none';
    });
    
    // 显示对应表单
    const formId = type === 'quote' ? 'quote-form' : 'thought-form';
    const form = document.getElementById(formId);
    form.style.display = 'block';
    
    // 滚动到表单位置
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    
    // 聚焦到主要内容输入框
    const focusId = type === 'quote' ? 'quote-content' : 'thought-content';
    setTimeout(() => document.getElementById(focusId).focus(), 300);
    
    // 显示最近记录面板
    document.getElementById('recent-captures').style.display = 'block';
    loadRecentCaptures(type);
}

/**
 * 隐藏快速记录表单
 */
function hideCaptureForm() {
    document.querySelectorAll('.capture-form').forEach(form => {
        form.style.display = 'none';
    });
    document.getElementById('recent-captures').style.display = 'none';
}

/**
 * 发布摘录记录
 */
async function publishQuote() {
    const source = document.getElementById('quote-source').value.trim();
    const content = document.getElementById('quote-content').value.trim();
    const reflection = document.getElementById('quote-reflection').value.trim();
    const tags = document.getElementById('quote-tags').value.trim();
    
    // 验证必填项
    if (!content) {
        showAlert('quick-capture', '请填写摘录内容', 'error');
        return;
    }
    
    const submitBtn = event.target;
    const originalHTML = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 发布中...';
    submitBtn.disabled = true;
    
    try {
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const timeStr = now.toTimeString().split(' ')[0].substring(0, 5);
        
        // 生成文件名
        let filename;
        if (source) {
            try {
                const url = new URL(source);
                const domain = url.hostname.replace(/[^a-zA-Z0-9]/g, '-');
                filename = `${dateStr}-${domain}.md`;
            } catch {
                filename = `${dateStr}-quote.md`;
            }
        } else {
            filename = `${dateStr}-quote.md`;
        }
        
        // 生成标题
        const title = source ? `来自 ${new URL(source).hostname} 的摘录` : '精彩摘录';
        
        // 处理标签
        const tagList = tags ? tags.split(/[,，\s]+/).filter(t => t.trim()) : [];
        const tagsStr = tagList.length > 0 ? tagList.join(', ') : '';
        
        // 生成文件内容
        let fileContent = `---\ntitle: "${title}"\ndate: ${now.toISOString()}\ncategory: quotes\n`;
        if (source) fileContent += `source: "${source}"\n`;
        if (tagsStr) fileContent += `tags: [${tagsStr}]\n`;
        fileContent += `---\n\n`;
        
        // 添加引用内容
        fileContent += `> ${content.replace(/\n/g, '\n> ')}\n\n`;
        
        // 添加感悟
        if (reflection) {
            fileContent += `**摘录感悟**: ${reflection}\n`;
        }
        
        // 检查文件是否已存在，获取 SHA
        const filePath = `blog/quotes/${filename}`;
        let fileSha = null;
        try {
            const existingFile = await getFileContent(filePath);
            if (existingFile && existingFile.sha) {
                fileSha = existingFile.sha;
                console.log('[DEBUG] 获取到文件 SHA:', fileSha);
            }
        } catch (error) {
            // 文件不存在是正常现象
            if (!error.message.includes('404')) {
                console.warn('检查文件存在性时出错:', error);
            }
        }

        // 创建或更新文件
        await createOrUpdateFile(
            filePath,
            fileContent,
            `添加摘录: ${title}`,
            fileSha
        );
        
        showAlert('quick-capture', '✓ 摘录发布成功！约1分钟后可见。', 'success');
        
        // 清空表单
        document.getElementById('quote-source').value = '';
        document.getElementById('quote-content').value = '';
        document.getElementById('quote-reflection').value = '';
        document.getElementById('quote-tags').value = '';
        
        // 隐藏表单
        setTimeout(hideCaptureForm, 2000);
        
    } catch (error) {
        showAlert('quick-capture', `发布失败: ${error.message}`, 'error');
    } finally {
        submitBtn.innerHTML = originalHTML;
        submitBtn.disabled = false;
    }
}

/**
 * 发布随笔思考
 */
async function publishThought() {
    const title = document.getElementById('thought-title').value.trim();
    const content = document.getElementById('thought-content').value.trim();
    const tags = document.getElementById('thought-tags').value.trim();
    
    // 验证必填项
    if (!content) {
        showAlert('quick-capture', '请填写思考内容', 'error');
        return;
    }
    
    const submitBtn = event.target;
    const originalHTML = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 发布中...';
    submitBtn.disabled = true;
    
    try {
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const timeStr = now.toTimeString().split(' ')[0].substring(0, 5);
        
        // 如果标题为空，使用内容前20字作为显示标题
        const displayTitle = title || content.substring(0, 20).replace(/\n/g, ' ') + '...';
        
        // 生成文件名（添加时间戳避免冲突）
        let filename;
        const timeStamp = now.toTimeString().split(' ')[0].replace(/:/g, ''); // HHMMSS格式
        if (title) {
            const slug = title.substring(0, 30).replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '-');
            filename = `${dateStr}-${timeStamp}-${slug}.md`;
        } else {
            filename = `${dateStr}-${timeStamp}.md`;
        }
        
        // 处理标签
        const tagList = tags ? tags.split(/[,，\s]+/).filter(t => t.trim()) : [];
        const tagsStr = tagList.length > 0 ? tagList.join(', ') : '';
        
        // 生成文件内容
        let fileContent = `---\ntitle: "${title}"\ndate: ${now.toISOString()}\ncategory: thoughts\n`;
        if (tagsStr) fileContent += `tags: [${tagsStr}]\n`;
        fileContent += `---\n\n${content}\n`;
        
        // 检查文件是否已存在，如果存在则获取其 SHA
        const filePath = `blog/thoughts/${filename}`;
        let fileSha = null;
        console.log('[DEBUG] 准备检查文件:', filePath);
        try {
            const existingFile = await getFileContent(filePath);
            console.log('[DEBUG] existingFile 结果:', existingFile);
            if (existingFile && existingFile.sha) {
                fileSha = existingFile.sha;
                console.log('[DEBUG] 获取到 SHA:', fileSha);
            } else {
                console.log('[DEBUG] 文件不存在或没有 SHA');
            }
        } catch (error) {
            // 文件不存在是正常现象，继续执行
            if (!error.message.includes('404')) {
                console.warn('检查文件存在性时出错:', error);
            } else {
                console.log('[DEBUG] 文件不存在 (404)，将创建新文件');
            }
        }
        
        console.log('[DEBUG] 准备调用 createOrUpdateFile，fileSha =', fileSha);
        // 创建或更新文件
        await createOrUpdateFile(
            filePath,
            fileContent,
            `添加随笔: ${displayTitle}`,
            fileSha
        );
        
        showAlert('quick-capture', '✓ 随笔发布成功！约1分钟后可见。', 'success');
        
        // 清空表单
        document.getElementById('thought-title').value = '';
        document.getElementById('thought-content').value = '';
        document.getElementById('thought-tags').value = '';
        
        // 隐藏表单
        setTimeout(hideCaptureForm, 2000);
        
    } catch (error) {
        showAlert('quick-capture', `发布失败: ${error.message}`, 'error');
    } finally {
        submitBtn.innerHTML = originalHTML;
        submitBtn.disabled = false;
    }
}

/**
 * 加载最近记录
 * @param {string} type - 'quote' 或 'thought'
 */
async function loadRecentCaptures(type) {
    try {
        const category = type === 'quote' ? 'quotes' : 'thoughts';
        const path = `blog/${category}`;
        
        // 获取文件列表
        const files = await listFiles(path);
        if (!files || files.length === 0) {
            document.getElementById('recent-captures-list').innerHTML = '<p style="color:var(--text3);text-align:center;padding:20px;">暂无记录</p>';
            return;
        }
        
        // 取最近5条（按修改时间排序）
        const recentFiles = files
            .sort((a, b) => new Date(b.lastModified || 0) - new Date(a.lastModified || 0))
            .slice(0, 5);
        
        const listHtml = await Promise.all(recentFiles.map(async file => {
            try {
                const fileData = await getFileContent(file.path);
                if (!fileData) return '';
                
                // 解析front matter
                const frontMatter = fileData.content.match(/^---\n([\s\S]*?)\n---/);
                if (!frontMatter) return '';
                
                const meta = {};
                frontMatter[1].split('\n').forEach(line => {
                    const [key, ...valueParts] = line.split(':');
                    if (key && valueParts.length > 0) {
                        meta[key.trim()] = valueParts.join(':').trim().replace(/^"|"$/g, '');
                    }
                });
                
                const title = meta.title || (type === 'quote' ? '摘录' : '随笔');
                const date = new Date(meta.date).toLocaleString('zh-CN', {
                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                });
                
                return `
                    <div class="file-item">
                        <div class="file-item-head">
                            <i class="fas fa-${type === 'quote' ? 'quote-left' : 'lightbulb'}" style="color:var(--accent);"></i>
                            <div style="flex:1;">
                                <div style="font-weight:600;font-size:14px;">${title || '（无标题）'}</div>
                                <div style="font-size:12px;color:var(--text3);">${date}</div>
                            </div>
                        </div>
                    </div>
                `;
            } catch {
                return '';
            }
        }));
        
        document.getElementById('recent-captures-list').innerHTML = listHtml.join('');
        
    } catch (error) {
        console.warn('加载最近记录失败:', error);
        document.getElementById('recent-captures-list').innerHTML = '<p style="color:var(--text3);text-align:center;padding:20px;">加载失败</p>';
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
