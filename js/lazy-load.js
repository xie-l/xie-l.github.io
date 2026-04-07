/**
 * 懒加载模块 - 优化首页性能
 * 只对非首屏内容进行懒加载
 */

(function() {
    'use strict';

    // 配置：需要懒加载的模块
    const lazyModules = [
        {
            id: 'daily-keywords',
            load: loadDailyKeywords,
            threshold: 0.1 // 距离视口10%时开始加载
        },
        {
            id: 'daily-data',
            load: loadDailyData,
            threshold: 0.1
        },
        {
            id: 'energy-market',
            load: loadEnergyMarket,
            threshold: 0.1
        },
        {
            id: 'goals',
            load: loadGoals,
            threshold: 0.1
        }
    ];

    // 加载状态
    const loadStatus = new Map();

    /**
     * 初始化懒加载
     */
    function init() {
        if (!('IntersectionObserver' in window)) {
            // 浏览器不支持 IntersectionObserver，直接加载所有内容
            console.warn('浏览器不支持 IntersectionObserver，直接加载所有内容');
            loadAllModules();
            return;
        }

        // 为每个模块创建观察器
        lazyModules.forEach(module => {
            const element = document.getElementById(module.id);
            if (!element) {
                console.warn(`未找到模块: ${module.id}`);
                return;
            }

            // 创建占位符
            createPlaceholder(element);

            // 创建观察器
            const observer = new IntersectionObserver(
                (entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting && !loadStatus.get(module.id)) {
                            loadModule(module);
                        }
                    });
                },
                {
                    rootMargin: '0px',
                    threshold: module.threshold
                }
            );

            observer.observe(element);
            loadStatus.set(module.id, false);
        });

        console.log('懒加载初始化完成');
    }

    /**
     * 创建加载占位符
     */
    function createPlaceholder(element) {
        const placeholder = document.createElement('div');
        placeholder.className = 'lazy-placeholder';
        placeholder.innerHTML = `
            <div style="padding: 40px; text-align: center; color: var(--text-light);">
                <i class="fas fa-spinner fa-spin" style="font-size: 24px; margin-bottom: 12px; opacity: 0.5;"></i>
                <div style="font-size: 13px;">正在加载内容...</div>
            </div>
        `;
        
        // 将占位符插入到元素内部
        element.innerHTML = '';
        element.appendChild(placeholder);
    }

    /**
     * 加载指定模块
     */
    function loadModule(module) {
        if (loadStatus.get(module.id)) return;

        console.log(`开始加载模块: ${module.id}`);
        loadStatus.set(module.id, true);

        const element = document.getElementById(module.id);
        if (!element) return;

        // 显示加载中状态
        element.innerHTML = `
            <div style="padding: 40px; text-align: center; color: var(--text-light);">
                <i class="fas fa-spinner fa-spin" style="font-size: 24px; margin-bottom: 12px; opacity: 0.5;"></i>
                <div style="font-size: 13px;">正在加载内容...</div>
            </div>
        `;

        // 执行加载函数
        try {
            module.load(element);
            console.log(`模块加载完成: ${module.id}`);
        } catch (error) {
            console.error(`模块加载失败: ${module.id}`, error);
            element.innerHTML = `
                <div style="padding: 40px; text-align: center; color: var(--danger-color);">
                    <i class="fas fa-exclamation-triangle" style="font-size: 24px; margin-bottom: 12px; opacity: 0.5;"></i>
                    <div style="font-size: 13px;">内容加载失败，请刷新页面重试</div>
                </div>
            `;
        }
    }

    /**
     * 加载所有模块（用于降级处理）
     */
    function loadAllModules() {
        lazyModules.forEach(module => {
            const element = document.getElementById(module.id);
            if (element) {
                module.load(element);
            }
        });
    }

    /**
     * 加载每日五词
     */
    function loadDailyKeywords(container) {
        // 模拟数据加载（实际应从API或JSON文件获取）
        setTimeout(() => {
            container.innerHTML = `
                <div class="kw-header">
                    <h2 class="section-title">📚 每日五词</h2>
                    <span class="kw-date-tag" id="kw-date">每日更新</span>
                </div>
                <div class="kw-list" id="kw-list">
                    <div class="kw-item">
                        <div class="kw-left">
                            <div class="kw-num">01</div>
                            <div class="kw-badge">电化学</div>
                        </div>
                        <div class="kw-right">
                            <div class="kw-term">过电位</div>
                            <div class="kw-def">实际电化学反应电位与理论电位之间的差值，是衡量电催化活性的重要指标。</div>
                            <div class="kw-eg"><strong>例句：</strong>通过优化催化剂结构，我们成功将<b>过电位</b>降低了50mV。</div>
                        </div>
                    </div>
                    <div class="kw-item">
                        <div class="kw-left">
                            <div class="kw-num">02</div>
                            <div class="kw-badge">催化</div>
                        </div>
                        <div class="kw-right">
                            <div class="kw-term">活性位点</div>
                            <div class="kw-def">催化剂表面能够吸附反应物并促进化学反应的特定原子或原子簇。</div>
                            <div class="kw-eg"><strong>例句：</strong>DFT计算揭示了边缘碳原子是主要的<b>活性位点</b>。</div>
                        </div>
                    </div>
                    <div class="kw-item">
                        <div class="kw-left">
                            <div class="kw-num">03</div>
                            <div class="kw-badge">机器学习</div>
                        </div>
                        <div class="kw-right">
                            <div class="kw-term">特征工程</div>
                            <div class="kw-def">从原始数据中提取和转换特征，以提高机器学习模型性能的过程。</div>
                            <div class="kw-eg"><strong>例句：</strong>良好的<b>特征工程</b>使模型准确率提升了15%。</div>
                        </div>
                    </div>
                    <div class="kw-item">
                        <div class="kw-left">
                            <div class="kw-num">04</div>
                            <div class="kw-badge">能源</div>
                        </div>
                        <div class="kw-right">
                            <div class="kw-term">氢能</div>
                            <div class="kw-def">以氢气为载体的清洁能源，具有高能量密度和零碳排放的特点。</div>
                            <div class="kw-eg"><strong>例句：</strong><b>氢能</b>被视为实现碳中和的关键能源形式。</div>
                        </div>
                    </div>
                    <div class="kw-item">
                        <div class="kw-left">
                            <div class="kw-num">05</div>
                            <div class="kw-badge">计算</div>
                        </div>
                        <div class="kw-right">
                            <div class="kw-term">第一性原理</div>
                            <div class="kw-def">基于量子力学基本原理，不依赖经验参数计算材料性质的方法。</div>
                            <div class="kw-eg"><strong>例句：</strong>通过<b>第一性原理</b>计算预测了催化剂的电子结构。</div>
                        </div>
                    </div>
                </div>
            `;
        }, 300); // 模拟网络延迟
    }

    /**
     * 加载今日数感
     */
    function loadDailyData(container) {
        setTimeout(() => {
            container.innerHTML = `
                <div class="ds-grid">
                    <div class="ds-card">
                        <div class="ds-head">
                            <div class="ds-topic">中国氢能产量</div>
                            <div class="ds-domain-badge">能源</div>
                        </div>
                        <div class="ds-num-box">
                            <div class="ds-num">3,300</div>
                            <div class="ds-num-label">万吨/年</div>
                        </div>
                        <div class="ds-section-label">数据解读</div>
                        <div class="ds-ctx">中国2025年氢气产量约为3300万吨，占全球氢气产量的30%左右，其中绿氢占比正在快速提升。</div>
                        <div class="ds-sense"><strong>数感启示：</strong>氢能产业正处于爆发式增长前夜，预计到2030年绿氢产能将达到100万吨/年以上。</div>
                    </div>
                    <div class="ds-card">
                        <div class="ds-head">
                            <div class="ds-topic">电解水制氢效率</div>
                            <div class="ds-domain-badge">技术</div>
                        </div>
                        <div class="ds-num-box">
                            <div class="ds-num">4.3</div>
                            <div class="ds-num-label">kWh/m³</div>
                        </div>
                        <div class="ds-section-label">数据解读</div>
                        <div class="ds-ctx">碱性电解水制氢的能耗约为4.3-5.0 kWh/m³ H₂，相当于每千克氢气消耗约48-56度电。</div>
                        <div class="ds-sense"><strong>数感启示：</strong>能耗是制约绿氢成本的关键因素，降低电耗10%可使氢气成本下降约0.8-1.0元/kg。</div>
                    </div>
                    <div class="ds-card">
                        <div class="ds-head">
                            <div class="ds-topic">碳基催化剂占比</div>
                            <div class="ds-domain-badge">材料</div>
                        </div>
                        <div class="ds-num-box">
                            <div class="ds-num">78%</div>
                            <div class="ds-num-label">市场份额</div>
                        </div>
                        <div class="ds-section-label">数据解读</div>
                        <div class="ds-ctx">碳基催化剂在电催化领域占据主导地位，因其成本低、导电性好、结构可调性强等优势。</div>
                        <div class="ds-sense"><strong>数感启示：</strong>碳材料的微结构调控是提升催化性能的关键，孔径分布每优化10%，活性可提升15-20%。</div>
                    </div>
                </div>
            `;
        }, 400);
    }

    /**
     * 加载能源市场数据
     */
    function loadEnergyMarket(container) {
        setTimeout(() => {
            container.innerHTML = `
                <div class="em-grid">
                    <div class="em-card em-card-oil">
                        <div class="em-card-header">
                            <div class="em-card-label">布伦特原油</div>
                            <img class="em-spark" src="https://s3.tradingview.com/tv-widget-static/images/financials/dist/images/sparklines/sparkline2.svg" alt="趋势">
                        </div>
                        <div class="em-asset">Brent Crude Oil</div>
                        <div class="em-price-row">
                            <div class="em-price">75.32</div>
                            <div class="em-unit">美元/桶</div>
                        </div>
                        <div class="em-trend em-trend-up">↗ +2.3%</div>
                        <div class="em-date">2026-04-07</div>
                    </div>
                    <div class="em-card em-card-natgas">
                        <div class="em-card-header">
                            <div class="em-card-label">天然气</div>
                            <img class="em-spark" src="https://s3.tradingview.com/tv-widget-static/images/financials/dist/images/sparklines/sparkline1.svg" alt="趋势">
                        </div>
                        <div class="em-asset">Natural Gas</div>
                        <div class="em-price-row">
                            <div class="em-price">2.85</div>
                            <div class="em-unit">美元/MMBtu</div>
                        </div>
                        <div class="em-trend em-trend-down">↘ -1.8%</div>
                        <div class="em-date">2026-04-07</div>
                    </div>
                    <div class="em-card em-card-h2">
                        <div class="em-card-header">
                            <div class="em-card-label">氢气</div>
                            <img class="em-spark" src="https://s3.tradingview.com/tv-widget-static/images/financials/dist/images/sparklines/sparkline3.svg" alt="趋势">
                        </div>
                        <div class="em-asset">Hydrogen</div>
                        <div class="em-price-row">
                            <div class="em-price">3.20</div>
                            <div class="em-unit">美元/kg</div>
                        </div>
                        <div class="em-trend em-trend-up">↗ +5.2%</div>
                        <div class="em-date">2026-04-07</div>
                    </div>
                </div>
                <div style="text-align: center; margin-top: 16px; font-size: 11px; color: var(--text-light);">
                    数据仅供参考 | 更新频率：每日
                </div>
            `;
        }, 500);
    }

    /**
     * 加载目标规划
     */
    function loadGoals(container) {
        setTimeout(() => {
            container.innerHTML = `
                <div class="goals-grid">
                    <div class="goal-card">
                        <div class="goal-icon">🎯</div>
                        <h3>短期目标（2026-2027）</h3>
                        <ul>
                            <li>完成博士论文答辩，顺利毕业</li>
                            <li>适应国家能源集团氢能部门工作</li>
                            <li>建立氢能产业知识体系</li>
                            <li>完成青海实习项目交付</li>
                            <li>保持每日学习与输出习惯</li>
                        </ul>
                    </div>
                    <div class="goal-card">
                        <div class="goal-icon">📈</div>
                        <h3>中期目标（2028-2030）</h3>
                        <ul>
                            <li>成为氢能领域专业人才</li>
                            <li>在三级联动培养中脱颖而出</li>
                            <li>主导至少1个氢能研发项目</li>
                            <li>发表产业相关技术论文</li>
                            <li>建立行业影响力</li>
                        </ul>
                    </div>
                    <div class="goal-card">
                        <div class="goal-icon">🚀</div>
                        <h3>长期目标（2030+）</h3>
                        <ul>
                            <li>成为氢能领域技术专家</li>
                            <li>推动氢能技术产业化应用</li>
                            <li>培养氢能专业人才</li>
                            <li>为国家能源转型贡献力量</li>
                            <li>实现个人价值与社会价值的统一</li>
                        </ul>
                    </div>
                </div>
            `;
        }, 600);
    }

    // 页面加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // 暴露全局方法（用于手动触发加载）
    window.LazyLoad = {
        init,
        loadModule,
        loadAllModules
    };

})();
