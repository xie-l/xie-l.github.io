// 个人信息编辑器 - 完整版
// 提供完整的个人信息编辑、预览、保存功能

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
        
        // 自动保存草稿
        this.form.addEventListener('input', () => {
            this.autoSave();
        });
    }
    
    // 从当前主页加载数据
    loadCurrentData() {
        try {
            // 从localStorage加载（如果有）
            const stored = localStorage.getItem('profile_data_v2');
            if (stored) {
                return JSON.parse(stored);
            }
            
            // 否则返回默认数据
            return this.getDefaultData();
        } catch (error) {
            console.error('加载数据失败:', error);
            return this.getDefaultData();
        }
    }
    
    // 默认数据
    getDefaultData() {
        return {
            // 个人信息卡片
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
            
            // 横幅信息
            banner: {
                title: '探索技术的无限可能',
                subtitle: '碳基电催化 · 机器学习 · 能源转化',
                meta: [
                    { icon: 'fa-graduation-cap', text: '哈尔滨工业大学' },
                    { icon: 'fa-map-marker-alt', text: '哈尔滨' }
                ]
            },
            
            // 个人简介
            about: {
                paragraphs: [
                    '中共党员，哈尔滨工业大学能源科学与工程学院在读博士生（2020.09-2026.06），研究方向为碳基电催化氧气合成过氧化氢调控机制及强化策略。',
                    '具备扎实的学术科研能力，以共同作者发表SCI论文30余篇（其中一作6篇），参与2项发明专利研发。多次在高水平学术会议发声，获美国化学会亚太环境化学学生分会优秀报告奖（全国仅4人），斩获能源装备大赛全国二等奖、双碳大赛全国三等奖2项，连续4年获评校级优秀学生/优秀团员。',
                    '擅长数据分析与机器学习，熟练使用Python、Excel等工具进行数据分析，通过机器学习构建模型预测数据趋势。在读期间基于该能力与多位研究者合作，分析实验数据规律、揭示机制起源。',
                    '文字功底扎实，参与撰写国家自然科学基金重点项目申报书、政务建议文稿（如青海省清洁能源质量基础设施建设建议），年总撰写文字量超10万。'
                ]
            },
            
            // 教育背景
            education: {
                items: [
                    {
                        degree: '工学博士 - 动力工程及工程热物理',
                        institution: '哈尔滨工业大学（推荐免试直接攻读博士学位）',
                        period: '2020.09 - 2026.06',
                        description: '课题内容：碳基电催化氧气合成过氧化氢调控机制及强化策略。主修课程：高等热力学、高等燃烧学、高等流体力学、辐射传热原理、能源与环境新技术、纳米能源材料及高效能量存储、可再生能源的有效利用、分子动力学模拟原理和应用、第一性原理方法及应用、Python编程、机器学习原理及方法。导师：周伟 教授；高继慧 教授'
                    },
                    {
                        degree: '工学学士 - 能源与动力工程',
                        institution: '哈尔滨工业大学',
                        period: '2016.09 - 2020.07',
                        description: '主修课程：工程热力学、燃烧学、工程流体力学、传热学、空气动力学、理论力学、材料力学、机械原理、制冷原理与工程、空调原理与工程。导师：高继慧 教授'
                    }
                ]
            },
            
            // 科研项目
            projects: {
                items: [
                    {
                        name: '宁东煤/太西煤基活性炭功能化、高值化及宏量制备基础',
                        date: '2021-2024',
                        source: '国家自然科学基金区域创新发展联合基金重点项目（U21A2062）',
                        work: '项目申请立项阶段，主要负责研究背景调研、研究方案部分的撰写、研究流程的设计；项目执行阶段，主要负责煤基碳材料多尺度结构构筑方法研究、机制分析及制得活性炭的电催化氧气还原性能的评价。',
                        tags: ['电催化', '碳材料', '机器学习']
                    },
                    {
                        name: '生物炭阳极序构耦合脉冲动态电解实现低电耗大电流制氢的机制研究',
                        date: '2022-2024',
                        source: '国家自然科学基金面上项目',
                        work: '主要负责理论研究及机制分析，包括高性能HER催化剂结构的机器学习预测筛选、典型生物质（玉米芯）阳极氧化路径及机制分析。',
                        tags: ['制氢机制', '机器学习', '催化剂筛选']
                    }
                ]
            },
            
            // 科研成果
            publications: {
                items: [
                    {
                        type: '期刊论文（第一作者）',
                        count: '6篇',
                        content: [
                            '[1] Liang Xie, Wei Zhou*, et al. Understanding the activity origin of oxygen-doped carbon materials in catalyzing the two-electron oxygen reduction reaction towards hydrogen peroxide generation. Journal of Colloid and Interface Science, 2022, 610: 934-943. (IF=9.4, 中科院一区Top, 他引36次)',
                            '[2] Liang Xie, Wei Zhou*, et al. Edge-doped substituents as an emerging atomic-level strategy for enhancing M-N4-C single-atom catalysts. Nanoscale Horizons, 2025, 10: 322-335. (IF=8.0, 中科院二区, 入选hot article)',
                            '[3] Liang Xie, Wei Zhou*, et al. Elucidating the impact of oxygen functional groups on M-N4-C catalysts: a DFT and machine learning approach. Materials Horizons, 2024, 11: 1719-1731. (IF=12.2, 中科院二区)',
                            '[4] Liang Xie, Wei Zhou*, et al. Effect of molecular size on the electrocatalytic activity of M-N4-C catalyst. Journal of Materials Chemistry A, 2024, 13(3): 1788-1795. (IF=10.7, 中科院二区)'
                        ],
                        tags: ['电催化', '机器学习', 'DFT计算']
                    },
                    {
                        type: '发明专利',
                        count: '4项',
                        content: [
                            '[1] 孙飞, 曲智斌, 谢亮, 等. 一种准确快速预测杂原子掺杂无定形碳催化活性位的方法: 中国, CN114512196A [P], 2022-05-17. (已授权)',
                            '[2] 周伟, 丁雅妮, 谢亮, 等. 一种脉冲电合成H2O2的方法: 中国, CN114293206A [P], 2022-04-08. (已授权)',
                            '[3] 周伟, 张学伟, 黄玉明, 李俊峰, 谢亮, 等. 一种促进质子交换膜电解水制氢的方法: 中国, CN117127195A [P], 2023-11-28.',
                            '[4] 周伟, 薛乃源, 王玉涛, 郭永谦, 续晨帆, 孙苗婷, 谢亮, 等. 一种基于亚铁氰根循环再生辅助的高盐水体稳定电解制氢方法: 中国, CN121295202A [P], 2026-01-09.'
                        ],
                        tags: ['催化活性预测', '脉冲电合成', '电解水制氢']
                    }
                ]
            },
            
            // 个人技能
            skills: {
                categories: [
                    {
                        name: '学术科研能力',
                        skills: [
                            { name: '电催化制氢研究', level: 95 },
                            { name: '机器学习与数据分析', level: 90 },
                            { name: 'DFT理论计算', level: 85 }
                        ]
                    },
                    {
                        name: '数据处理与编程',
                        skills: [
                            { name: 'Python数据分析', level: 90 },
                            { name: 'Excel高级应用', level: 85 },
                            { name: '机器学习建模', level: 80 }
                        ]
                    },
                    {
                        name: '综合素质能力',
                        skills: [
                            { name: '沟通组织协调', level: 90 },
                            { name: '文字分析写作', level: 85 },
                            { name: '抗压与独立工作', level: 88 }
                        ]
                    }
                ]
            }
        };
    }
    
    // 填充表单
    populateForm() {
        const data = this.currentData;
        
        // 基本信息
        document.getElementById('profile-name').value = data.profile.name || '';
        document.getElementById('profile-title').value = data.profile.title || '';
        document.getElementById('profile-bio').value = data.profile.bio || '';
        document.getElementById('profile-tags').value = (data.profile.tags || []).join(', ');
        document.getElementById('profile-email').value = data.profile.email || '';
        document.getElementById('profile-phone').value = data.profile.phone || '';
        document.getElementById('profile-address').value = data.profile.address || '';
        document.getElementById('profile-github').value = data.profile.github || '';
        
        // 其他部分（使用JSON格式）
        document.getElementById('profile-education').value = this.formatForTextarea(data.education.items || []);
        document.getElementById('profile-projects').value = this.formatForTextarea(data.projects.items || []);
        document.getElementById('profile-publications').value = this.formatForTextarea(data.publications.items || []);
        document.getElementById('profile-skills').value = this.formatForTextarea(data.skills.categories || []);
    }
    
    // 将数组格式化为文本区域格式
    formatForTextarea(items) {
        if (!Array.isArray(items) || items.length === 0) return '';
        
        return items.map((item, index) => {
            return `// 项目 ${index + 1}
${JSON.stringify(item, null, 2)}

`;
        }).join('');
    }
    
    // 从表单收集数据
    collectFormData() {
        const data = {
            profile: {
                name: document.getElementById('profile-name').value.trim(),
                title: document.getElementById('profile-title').value.trim(),
                bio: document.getElementById('profile-bio').value.trim(),
                tags: this.parseTags(document.getElementById('profile-tags').value),
                email: document.getElementById('profile-email').value.trim(),
                phone: document.getElementById('profile-phone').value.trim(),
                address: document.getElementById('profile-address').value.trim(),
                github: document.getElementById('profile-github').value.trim()
            },
            
            // 解析其他部分
            education: {
                items: this.parseTextareaData(document.getElementById('profile-education').value)
            },
            projects: {
                items: this.parseTextareaData(document.getElementById('profile-projects').value)
            },
            publications: {
                items: this.parseTextareaData(document.getElementById('profile-publications').value)
            },
            skills: {
                categories: this.parseTextareaData(document.getElementById('profile-skills').value)
            }
        };
        
        return data;
    }
    
    // 解析标签
    parseTags(tagString) {
        return tagString.split(',')
            .map(tag => tag.trim())
            .filter(tag => tag.length > 0);
    }
    
    // 解析文本区域数据
    parseTextareaData(text) {
        try {
            // 按 // 项目 X 分割
            const items = text.split(/\/\/\s*项目\s*\d+/);
            const result = [];
            
            for (let i = 1; i < items.length; i++) {
                const itemText = items[i].trim();
                if (itemText) {
                    try {
                        // 提取JSON部分
                        const jsonMatch = itemText.match(/\{[\s\S]*\}/);
                        if (jsonMatch) {
                            const obj = JSON.parse(jsonMatch[0]);
                            result.push(obj);
                        }
                    } catch (e) {
                        console.warn('解析项目失败:', e);
                    }
                }
            }
            
            return result;
        } catch (error) {
            console.error('解析文本区域数据失败:', error);
            return [];
        }
    }
    
    // 验证数据
    validateData(data) {
        const errors = [];
        
        if (!data.profile.name) {
            errors.push('姓名不能为空');
        }
        
        if (!data.profile.title) {
            errors.push('职称/学位不能为空');
        }
        
        if (!data.profile.bio) {
            errors.push('个人简介不能为空');
        }
        
        if (data.profile.tags.length === 0) {
            errors.push('至少需要一个标签');
        }
        
        if (errors.length > 0) {
            throw new Error(errors.join('\n'));
        }
        
        return true;
    }
    
    // 自动保存草稿
    autoSave() {
        const data = this.collectFormData();
        localStorage.setItem('profile_draft', JSON.stringify({
            data: data,
            savedAt: new Date().toISOString()
        }));
        
        // 显示保存提示
        const alert = document.getElementById('profile-alert');
        alert.textContent = '草稿已自动保存';
        alert.className = 'alert alert-info';
        alert.style.display = 'block';
        
        setTimeout(() => {
            alert.style.display = 'none';
        }, 2000);
    }
    
    // 加载草稿
    loadDraft() {
        const draft = localStorage.getItem('profile_draft');
        if (draft) {
            const { data } = JSON.parse(draft);
            if (data && data.profile) {
                this.fillFormWithData(data);
                
                const alert = document.getElementById('profile-alert');
                alert.textContent = '已加载自动保存的草稿';
                alert.className = 'alert alert-info';
                alert.style.display = 'block';
                
                setTimeout(() => {
                    alert.style.display = 'none';
                }, 3000);
            }
        }
    }
    
    // 用数据填充表单
    fillFormWithData(data) {
        if (data.profile) {
            document.getElementById('profile-name').value = data.profile.name || '';
            document.getElementById('profile-title').value = data.profile.title || '';
            document.getElementById('profile-bio').value = data.profile.bio || '';
            document.getElementById('profile-tags').value = (data.profile.tags || []).join(', ');
            document.getElementById('profile-email').value = data.profile.email || '';
            document.getElementById('profile-phone').value = data.profile.phone || '';
            document.getElementById('profile-address').value = data.profile.address || '';
            document.getElementById('profile-github').value = data.profile.github || '';
        }
        
        if (data.education) {
            document.getElementById('profile-education').value = this.formatForTextarea(data.education.items || []);
        }
        
        if (data.projects) {
            document.getElementById('profile-projects').value = this.formatForTextarea(data.projects.items || []);
        }
        
        if (data.publications) {
            document.getElementById('profile-publications').value = this.formatForTextarea(data.publications.items || []);
        }
        
        if (data.skills) {
            document.getElementById('profile-skills').value = this.formatForTextarea(data.skills.categories || []);
        }
    }
    
    // 保存并更新
    async saveAndUpdate() {
        try {
            // 收集数据
            const data = this.collectFormData();
            
            // 验证数据
            this.validateData(data);
            
            // 保存到localStorage
            localStorage.setItem('profile_data_v2', JSON.stringify(data));
            
            // 显示加载状态
            const submitBtn = this.form.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 生成中...';
            submitBtn.disabled = true;
            
            // 生成完整的HTML
            const htmlGenerator = new IndexHTMLGenerator(data);
            const htmlContent = htmlGenerator.generate();
            
            // 上传到GitHub
            await this.uploadToGitHub(htmlContent);
            
            // 恢复按钮状态
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
            
            // 显示成功消息
            showAlert('profile', '个人信息更新成功！请等待1-2分钟让GitHub Pages部署。', 'success');
            
        } catch (error) {
            // 恢复按钮状态
            const submitBtn = this.form.querySelector('button[type="submit"]');
            submitBtn.disabled = false;
            
            showAlert('profile', `更新失败: ${error.message}`, 'error');
        }
    }
    
    // 预览
    preview() {
        const data = this.collectFormData();
        const htmlGenerator = new IndexHTMLGenerator(data);
        const htmlContent = htmlGenerator.generate();
        
        const previewWindow = window.open('', '_blank', 'width=1200,height=800');
        previewWindow.document.write(htmlContent);
    }
    
    // 上传到GitHub
    async uploadToGitHub(content) {
        const creds = this.getGitHubCredentials();
        
        try {
            // 获取当前index.html的SHA（如果存在）
            let sha = null;
            try {
                const existing = await this.githubAPI(`/repos/${creds.owner}/${creds.repo}/contents/index.html`);
                sha = existing.sha;
            } catch (error) {
                // 文件不存在，sha保持null
            }
            
            // 创建或更新文件
            await this.githubAPI(`/repos/${creds.owner}/${creds.repo}/contents/index.html`, {
                method: 'PUT',
                body: JSON.stringify({
                    message: `更新个人信息: ${new Date().toISOString()}`,
                    content: btoa(unescape(encodeURIComponent(content))),
                    sha: sha
                })
            });
            
        } catch (error) {
            throw new Error(`GitHub上传失败: ${error.message}`);
        }
    }
    
    // GitHub API请求
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
            const error = await response.json();
            throw new Error(error.message || `HTTP ${response.status}`);
        }
        
        return response.json();
    }
    
    // 获取GitHub凭据
    getGitHubCredentials() {
        return {
            token: localStorage.getItem('github_token'),
            owner: localStorage.getItem('github_owner'),
            repo: localStorage.getItem('github_repo')
        };
    }
}

// Index HTML生成器
class IndexHTMLGenerator {
    constructor(data) {
        this.data = data;
    }
    
    generate() {
        return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.data.profile.name} - 个人主页</title>
    <meta name="description" content="${this.data.profile.title}">
    <meta name="keywords" content="${this.data.profile.tags.join(', ')}">
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
                <h1 class="banner-title">${this.data.banner.title}</h1>
                <p class="banner-subtitle">${this.data.banner.subtitle}</p>
                <div class="banner-meta">
                    ${this.data.banner.meta.map(meta => `<span><i class="fas ${meta.icon}"></i> ${meta.text}</span>`).join('')}
                </div>
            </div>
        </div>
    </section>

    <!-- 个人信息区域 -->
    <section class="profile-section">
        <div class="container">
            <div class="profile-card">
                <div class="profile-avatar">
                    <img src="img/avatar.jpg" alt="${this.data.profile.name}" class="avatar" onerror="this.src='https://via.placeholder.com/200'">
                </div>
                <div class="profile-info">
                    <h2 class="profile-name">${this.data.profile.name}</h2>
                    <h3 class="profile-title">${this.data.profile.title}</h3>
                    <p class="profile-bio">${this.data.profile.bio}</p>
                    <div class="profile-tags">
                        ${this.data.profile.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                    <div class="profile-contact">
                        <a href="mailto:${this.data.profile.email}" class="contact-btn">
                            <i class="fas fa-envelope"></i> 联系我
                        </a>
                        <a href="${this.data.profile.github}" target="_blank" class="contact-btn secondary">
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
                                ${this.data.about.paragraphs.map(p => `<p>${p}</p>`).join('')}
                            </div>
                        </div>
                    </section>

                    <!-- 教育背景 -->
                    <section id="education" class="section">
                        <div class="section-header">
                            <h2 class="section-title">教育背景</h2>
                        </div>
                        <div class="section-content">
                            <div class="timeline">
                                ${this.data.education.items.map(item => `
                                <div class="timeline-item">
                                    <div class="timeline-marker"></div>
                                    <div class="timeline-content">
                                        <h3>${item.degree}</h3>
                                        <p class="timeline-institution">${item.institution}</p>
                                        <p class="timeline-period">${item.period}</p>
                                        <p class="timeline-description">${item.description}</p>
                                    </div>
                                </div>
                                `).join('')}
                            </div>
                        </div>
                    </section>

                    <!-- 科研项目 -->
                    <section id="research" class="section">
                        <div class="section-header">
                            <h2 class="section-title">科研项目</h2>
                        </div>
                        <div class="section-content">
                            <div class="project-list">
                                ${this.data.projects.items.map(item => `
                                <div class="project-item">
                                    <div class="project-header">
                                        <h3>${item.name}</h3>
                                        <span class="project-date">${item.date}</span>
                                    </div>
                                    <div class="project-body">
                                        <p><strong>项目来源：</strong>${item.source}</p>
                                        <p><strong>工作内容：</strong>${item.work}</p>
                                        <div class="project-tech">
                                            ${item.tags.map(tag => `<span class="tech-tag">${tag}</span>`).join('')}
                                        </div>
                                    </div>
                                </div>
                                `).join('')}
                            </div>
                        </div>
                    </section>

                    <!-- 科研成果 -->
                    <section id="projects" class="section">
                        <div class="section-header">
                            <h2 class="section-title">科研成果</h2>
                        </div>
                        <div class="section-content">
                            <div class="project-list">
                                ${this.data.publications.items.map(item => `
                                <div class="project-item">
                                    <div class="project-header">
                                        <h3>${item.type}</h3>
                                        <span class="project-date">${item.count}</span>
                                    </div>
                                    <div class="project-body">
                                        ${item.content.map(content => `<p>${content}</p>`).join('')}
                                        <div class="project-tech">
                                            ${item.tags.map(tag => `<span class="tech-tag">${tag}</span>`).join('')}
                                        </div>
                                    </div>
                                </div>
                                `).join('')}
                            </div>
                        </div>
                    </section>

                    <!-- 个人技能 -->
                    <section id="skills" class="section">
                        <div class="section-header">
                            <h2 class="section-title">个人特长与技能</h2>
                        </div>
                        <div class="section-content">
                            <div class="skills-grid">
                                ${this.data.skills.categories.map(category => `
                                <div class="skill-category">
                                    <h3>${category.name}</h3>
                                    <div class="skill-items">
                                        ${category.skills.map(skill => `
                                        <div class="skill-item">
                                            <span>${skill.name}</span>
                                            <div class="skill-bar">
                                                <div class="skill-progress" data-skill="${skill.level}"></div>
                                            </div>
                                        </div>
                                        `).join('')}
                                    </div>
                                </div>
                                `).join('')}
                            </div>
                        </div>
                    </section>
                </main>

                <!-- 右侧边栏 -->
                <aside class="sidebar">
                    <!-- 快速链接 -->
                    <div class="sidebar-widget">
                        <h3 class="widget-title">快速链接</h3>
                        <ul class="widget-links">
                            <li><a href="blog/" class="link-item">
                                <i class="fas fa-blog"></i>
                                个人博客
                            </a></li>
                            <li><a href="files/" class="link-item">
                                <i class="fas fa-folder-open"></i>
                                文件资源
                            </a></li>
                            <li><a href="#" class="link-item">
                                <i class="fas fa-download"></i>
                                简历下载
                            </a></li>
                            <li><a href="#" class="link-item">
                                <i class="fas fa-link"></i>
                                相关链接
                            </a></li>
                        </ul>
                    </div>

                    <!-- 技术栈 -->
                    <div class="sidebar-widget">
                        <h3 class="widget-title">技术栈</h3>
                        <div class="tech-cloud">
                            ${this.data.profile.tags.map(tag => `<span class="tech-tag">${tag}</span>`).join('')}
                        </div>
                    </div>

                    <!-- 统计数据 -->
                    <div class="sidebar-widget">
                        <h3 class="widget-title">统计数据</h3>
                        <div class="stats-grid">
                            <div class="stat-item">
                                <div class="stat-number">5+</div>
                                <div class="stat-label">年经验</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-number">30+</div>
                                <div class="stat-label">论文</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-number">4+</div>
                                <div class="stat-label">专利</div>
                            </div>
                        </div>
                    </div>

                    <!-- 社交链接 -->
                    <div class="sidebar-widget">
                        <h3 class="widget-title">社交链接</h3>
                        <div class="social-grid">
                            <a href="${this.data.profile.github}" target="_blank" class="social-item">
                                <i class="fab fa-github"></i>
                            </a>
                            <a href="https://linkedin.com/in/xie-liang" target="_blank" class="social-item">
                                <i class="fab fa-linkedin"></i>
                            </a>
                            <a href="https://twitter.com/xie_liang" target="_blank" class="social-item">
                                <i class="fab fa-twitter"></i>
                            </a>
                            <a href="mailto:${this.data.profile.email}" class="social-item">
                                <i class="fas fa-envelope"></i>
                            </a>
                        </div>
                    </div>

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
                                    <p>${this.data.profile.email}</p>
                                </div>
                            </div>
                            <div class="contact-item">
                                <div class="contact-icon">
                                    <i class="fas fa-phone"></i>
                                </div>
                                <div class="contact-info">
                                    <h4>电话</h4>
                                    <p>${this.data.profile.phone}</p>
                                </div>
                            </div>
                            <div class="contact-item">
                                <div class="contact-icon">
                                    <i class="fas fa-map-marker-alt"></i>
                                </div>
                                <div class="contact-info">
                                    <h4>地址</h4>
                                    <p>${this.data.profile.address}</p>
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
                <p>&copy; 2026 ${this.data.profile.name}. All rights reserved. | 备案号：京ICP备12345678号</p>
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
}

// 全局函数
window.previewProfile = function() {
    profileEditor.preview();
};

// 初始化
let profileEditor;

// 修改DOMContentLoaded事件
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
