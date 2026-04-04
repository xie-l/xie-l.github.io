// 个人信息编辑器 - 定向替换版
// 从 GitHub 读取当前 index.html，用正则替换目标字段，再写回。
// 不重新生成整个 HTML，保留所有设计细节。

class ProfileEditor {
    constructor() {
        this.form = document.getElementById('profileForm');
        this.currentData = this.loadCurrentData();
        this.setupEventListeners();
        this.populateForm();
    }

    setupEventListeners() {
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveAndUpdate();
        });

        // 自动保存草稿（防抖）
        let saveTimer;
        this.form.addEventListener('input', () => {
            clearTimeout(saveTimer);
            saveTimer = setTimeout(() => this.autoSave(), 1500);
        });
    }

    // 从 localStorage 加载，不存在则用默认值
    loadCurrentData() {
        try {
            const stored = localStorage.getItem('profile_data_v3');
            if (stored) return JSON.parse(stored);
        } catch (e) {
            console.warn('加载 profile 数据失败:', e);
        }
        return this.getDefaultData();
    }

    getDefaultData() {
        return {
            profile: {
                name: '谢亮',
                title: '工学博士 · 动力工程及工程热物理',
                bio: '中共党员，哈尔滨工业大学在读博士生（2020.09-2026.06），研究方向为碳基电催化氧气合成过氧化氢调控机制及强化策略。具备扎实的学术科研能力，以共同作者发表SCI论文30余篇，参与4项发明专利研发。擅长数据分析与机器学习，熟练使用Python进行数据建模与机制分析。',
                tags: ['电催化制氢', '机器学习', '碳基催化剂', '数据分析', 'Python'],
                email: 'imxiel@163.com',
                phone: '18846124518',
                address: '黑龙江省哈尔滨市南岗区西大直街92号哈尔滨工业大学动力楼248室',
                github: 'https://github.com/xie-l'
            },
            about: {
                paragraphs: [
                    '中共党员，哈尔滨工业大学能源科学与工程学院在读博士生（2020.09-2026.06），研究方向为碳基电催化氧气合成过氧化氢调控机制及强化策略。',
                    '具备扎实的学术科研能力，以共同作者发表SCI论文30余篇（其中一作6篇），参与2项发明专利研发。多次在高水平学术会议发声，获美国化学会亚太环境化学学生分会优秀报告奖（全国仅4人），斩获能源装备大赛全国二等奖、双碳大赛全国三等奖2项，连续4年获评校级优秀学生/优秀团员。',
                    '擅长数据分析与机器学习，熟练使用Python、Excel等工具进行数据分析，通过机器学习构建模型预测数据趋势。在读期间基于该能力与多位研究者合作，分析实验数据规律、揭示机制起源。',
                    '文字功底扎实，参与撰写国家自然科学基金重点项目申报书、政务建议文稿，年总撰写文字量超10万。'
                ]
            }
        };
    }

    // 填充表单
    populateForm() {
        const d = this.currentData;
        document.getElementById('profile-name').value = d.profile.name || '';
        document.getElementById('profile-title').value = d.profile.title || '';
        document.getElementById('profile-bio').value = d.profile.bio || '';
        document.getElementById('profile-tags').value = (d.profile.tags || []).join(', ');
        document.getElementById('profile-email').value = d.profile.email || '';
        document.getElementById('profile-phone').value = d.profile.phone || '';
        document.getElementById('profile-address').value = d.profile.address || '';
        document.getElementById('profile-github').value = d.profile.github || '';
        document.getElementById('profile-about').value = (d.about.paragraphs || []).join('\n');
    }

    // 从表单收集
    collectFormData() {
        const rawAbout = document.getElementById('profile-about').value;
        const paragraphs = rawAbout
            .split('\n')
            .map(l => l.trim())
            .filter(l => l.length > 0);

        return {
            profile: {
                name: document.getElementById('profile-name').value.trim(),
                title: document.getElementById('profile-title').value.trim(),
                bio: document.getElementById('profile-bio').value.trim(),
                tags: document.getElementById('profile-tags').value
                    .split(',').map(t => t.trim()).filter(t => t),
                email: document.getElementById('profile-email').value.trim(),
                phone: document.getElementById('profile-phone').value.trim(),
                address: document.getElementById('profile-address').value.trim(),
                github: document.getElementById('profile-github').value.trim()
            },
            about: { paragraphs }
        };
    }

    // 自动保存草稿
    autoSave() {
        try {
            localStorage.setItem('profile_draft_v3', JSON.stringify({
                data: this.collectFormData(),
                savedAt: new Date().toISOString()
            }));
            this.showFormAlert('草稿已自动保存', 'info', 2000);
        } catch (e) { /* ignore */ }
    }

    showFormAlert(msg, type, hideAfter = 5000) {
        const el = document.getElementById('profile-alert');
        el.textContent = msg;
        el.className = `alert alert-${type}`;
        el.style.display = 'block';
        if (hideAfter) setTimeout(() => { el.style.display = 'none'; }, hideAfter);
    }

    // HTML 特殊字符转义（防止注入）
    escapeHtml(text) {
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    // 对 index.html 进行定向字段替换
    applyReplacements(html, data) {
        const esc = (s) => this.escapeHtml(s);

        // 1. 姓名
        html = html.replace(
            /(<h2 class="profile-name">)[^<]*/,
            `$1${esc(data.profile.name)}`
        );

        // 2. 职称/学位
        html = html.replace(
            /(<h3 class="profile-title">)[^<]*/,
            `$1${esc(data.profile.title)}`
        );

        // 3. 简介（卡片 bio）
        html = html.replace(
            /(<p class="profile-bio">)[^<]*/,
            `$1${esc(data.profile.bio)}`
        );

        // 4. 标签列表
        const tagsHtml = data.profile.tags
            .map(tag => `<span class="tag">${esc(tag)}</span>`)
            .join('\n                        ');
        html = html.replace(
            /(<div class="profile-tags">)[\s\S]*?(<\/div>)/,
            `$1\n                        ${tagsHtml}\n                    $2`
        );

        // 5. 所有 mailto 链接（联系我按钮 + 社交图标）
        html = html.replace(
            /href="mailto:[^"]*"/g,
            `href="mailto:${data.profile.email}"`
        );

        // 6. 关于我段落（主内容区 about-content div）
        const aboutHtml = (data.about.paragraphs || [])
            .map(p => `                                <p>${esc(p)}</p>`)
            .join('\n');
        html = html.replace(
            /(<div class="about-content">)[\s\S]*?(<\/div>)/,
            `$1\n${aboutHtml}\n                            $2`
        );

        // 7. 侧边栏联系方式 - 邮箱
        html = html.replace(
            /(class="contact-info">\s*<h4>邮箱<\/h4>\s*<p>)[^<]*/,
            `$1${esc(data.profile.email)}`
        );

        // 8. 侧边栏联系方式 - 电话
        html = html.replace(
            /(class="contact-info">\s*<h4>电话<\/h4>\s*<p>)[^<]*/,
            `$1${esc(data.profile.phone)}`
        );

        // 9. 侧边栏联系方式 - 地址
        html = html.replace(
            /(class="contact-info">\s*<h4>地址<\/h4>\s*<p>)[^<]*/,
            `$1${esc(data.profile.address)}`
        );

        return html;
    }

    // 保存并更新主页
    async saveAndUpdate() {
        const data = this.collectFormData();

        if (!data.profile.name) {
            this.showFormAlert('姓名不能为空', 'error');
            return;
        }

        const submitBtn = this.form.querySelector('button[type="submit"]');
        const originalHTML = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 更新中...';
        submitBtn.disabled = true;

        try {
            // 从 GitHub 读取当前 index.html
            const creds = this.getGitHubCredentials();
            const fileData = await this.githubAPI(
                `/repos/${creds.owner}/${creds.repo}/contents/index.html`
            );

            // GitHub base64 内容有换行，需要去掉再 atob
            const currentHtml = atob(fileData.content.replace(/\n/g, ''));
            const sha = fileData.sha;

            // 定向替换
            const updatedHtml = this.applyReplacements(currentHtml, data);

            // 写回 GitHub
            await this.githubAPI(
                `/repos/${creds.owner}/${creds.repo}/contents/index.html`,
                {
                    method: 'PUT',
                    body: JSON.stringify({
                        message: `更新个人信息: ${new Date().toLocaleString('zh-CN')}`,
                        content: btoa(unescape(encodeURIComponent(updatedHtml))),
                        sha: sha
                    })
                }
            );

            // 保存到 localStorage
            localStorage.setItem('profile_data_v3', JSON.stringify(data));

            this.showFormAlert('✓ 主页已更新！GitHub Pages 通常在 1-2 分钟内生效。', 'success', 8000);

        } catch (err) {
            console.error(err);
            this.showFormAlert(`更新失败: ${err.message}`, 'error');
        } finally {
            submitBtn.innerHTML = originalHTML;
            submitBtn.disabled = false;
        }
    }

    // 预览：在新标签页打开已部署的主页
    preview() {
        const creds = this.getGitHubCredentials();
        const url = `https://${creds.owner}.github.io/${creds.repo !== `${creds.owner}.github.io` ? creds.repo + '/' : ''}`;
        window.open(url, '_blank');
    }

    // GitHub API 请求（复用 main.js 的 githubAPI 函数）
    async githubAPI(endpoint, options = {}) {
        const creds = this.getGitHubCredentials();
        const url = `https://api.github.com${endpoint}`;
        const config = {
            headers: {
                'Authorization': `token ${creds.token}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            ...options
        };
        const response = await fetch(url, config);
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.message || `HTTP ${response.status}`);
        }
        return response.json();
    }

    getGitHubCredentials() {
        return {
            token: localStorage.getItem('github_token'),
            owner: localStorage.getItem('github_owner'),
            repo: localStorage.getItem('github_repo')
        };
    }
}

// 全局函数（供 HTML onclick 调用）
window.previewProfile = function () {
    if (typeof profileEditor !== 'undefined') profileEditor.preview();
};
