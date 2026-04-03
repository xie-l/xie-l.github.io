// 个人信息模板
// 这个文件定义了主页各个可编辑部分的模板

const PROFILE_TEMPLATE = {
    // 个人信息卡片
    profile: {
        name: '<h2 class="profile-name">{{name}}</h2>',
        title: '<h3 class="profile-title">{{title}}</h3>',
        bio: '<p class="profile-bio">{{bio}}</p>',
        tags: '{{#tags}}<span class="tag">{{.}}</span>{{/tags}}',
        email: '<a href="mailto:{{email}}" class="contact-btn"><i class="fas fa-envelope"></i> 联系我</a>',
        github: '<a href="{{github}}" target="_blank" class="contact-btn secondary"><i class="fab fa-github"></i> GitHub</a>'
    },
    
    // 个人简介
    about: {
        content: '{{#paragraphs}}<p>{{.}}</p>{{/paragraphs}}'
    },
    
    // 教育背景
    education: {
        items: `
            {{#items}}
            <div class="timeline-item">
                <div class="timeline-marker"></div>
                <div class="timeline-content">
                    <h3>{{degree}}</h3>
                    <p class="timeline-institution">{{institution}}</p>
                    <p class="timeline-period">{{period}}</p>
                    <p class="timeline-description">{{description}}</p>
                </div>
            </div>
            {{/items}}
        `
    },
    
    // 科研项目
    projects: {
        items: `
            {{#items}}
            <div class="project-item">
                <div class="project-header">
                    <h3>{{name}}</h3>
                    <span class="project-date">{{date}}</span>
                </div>
                <div class="project-body">
                    <p><strong>项目来源：</strong>{{source}}</p>
                    <p><strong>工作内容：</strong>{{work}}</p>
                    <div class="project-tech">
                        {{#tags}}<span class="tech-tag">{{.}}</span>{{/tags}}
                    </div>
                </div>
            </div>
            {{/items}}
        `
    },
    
    // 科研成果
    publications: {
        items: `
            {{#items}}
            <div class="project-item">
                <div class="project-header">
                    <h3>{{type}}</h3>
                    <span class="project-date">{{count}}</span>
                </div>
                <div class="project-body">
                    {{#content}}<p>{{.}}</p>{{/content}}
                    <div class="project-tech">
                        {{#tags}}<span class="tech-tag">{{.}}</span>{{/tags}}
                    </div>
                </div>
            </div>
            {{/items}}
        `
    },
    
    // 个人技能
    skills: {
        categories: `
            {{#categories}}
            <div class="skill-category">
                <h3>{{name}}</h3>
                <div class="skill-items">
                    {{#skills}}
                    <div class="skill-item">
                        <span>{{name}}</span>
                        <div class="skill-bar">
                            <div class="skill-progress" data-skill="{{level}}"></div>
                        </div>
                    </div>
                    {{/skills}}
                </div>
            </div>
            {{/categories}}
        `
    }
};

// 数据存储类
class ProfileData {
    constructor() {
        this.data = this.loadDefaultData();
    }
    
    loadDefaultData() {
        return {
            profile: {
                name: '谢亮',
                title: '工学博士 · 动力工程及工程热物理',
                bio: '中共党员，哈尔滨工业大学在读博士生（2020.09-2026.06），研究方向为碳基电催化氧气合成过氧化氢调控机制及强化策略。具备扎实的学术科研能力，以共同作者发表SCI论文30余篇，参与4项发明专利研发。擅长数据分析与机器学习，熟练使用Python进行数据建模与机制分析。',
                tags: ['电催化制氢', '机器学习', '碳基催化剂', '数据分析', 'Python'],
                email: 'imxiel@163.com',
                github: 'https://github.com/xie-l'
            },
            about: {
                paragraphs: [
                    '中共党员，哈尔滨工业大学能源科学与工程学院在读博士生（2020.09-2026.06），研究方向为碳基电催化氧气合成过氧化氢调控机制及强化策略。',
                    '具备扎实的学术科研能力，以共同作者发表SCI论文30余篇（其中一作6篇），参与2项发明专利研发。多次在高水平学术会议发声，获美国化学会亚太环境化学学生分会优秀报告奖（全国仅4人），斩获能源装备大赛全国二等奖、双碳大赛全国三等奖2项，连续4年获评校级优秀学生/优秀团员。',
                    '擅长数据分析与机器学习，熟练使用Python、Excel等工具进行数据分析，通过机器学习构建模型预测数据趋势。在读期间基于该能力与多位研究者合作，分析实验数据规律、揭示机制起源。',
                    '文字功底扎实，参与撰写国家自然科学基金重点项目申报书、政务建议文稿（如青海省清洁能源质量基础设施建设建议），年总撰写文字量超10万。'
                ]
            },
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
            }
        };
    }
    
    // 从当前index.html加载数据
    loadFromHTML() {
        try {
            // 这里简化处理，实际应该从DOM中提取
            return this.loadDefaultData();
        } catch (error) {
            console.error('加载数据失败:', error);
            return this.loadDefaultData();
        }
    }
    
    // 保存数据到localStorage
    saveToStorage() {
        localStorage.setItem('profile_data', JSON.stringify(this.data));
    }
    
    // 从localStorage加载数据
    loadFromStorage() {
        const stored = localStorage.getItem('profile_data');
        if (stored) {
            this.data = JSON.parse(stored);
            return true;
        }
        return false;
    }
}

// 模板渲染类
class TemplateRenderer {
    static render(template, data) {
        let result = template;
        
        // 处理简单变量替换
        result = result.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
            return data[key] || '';
        });
        
        // 处理循环（{{#items}}...{{/items}}）
        result = result.replace(/\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g, (match, key, content) => {
            if (data[key] && Array.isArray(data[key])) {
                return data[key].map(item => this.render(content, item)).join('');
            }
            return '';
        });
        
        return result;
    }
}

// 导出到全局
window.ProfileData = ProfileData;
window.TemplateRenderer = TemplateRenderer;
window.PROFILE_TEMPLATE = PROFILE_TEMPLATE;