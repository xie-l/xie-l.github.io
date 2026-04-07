# 个人主页设计调研与技术选型

## 一、目标用户分析

### 用户画像
- **姓名**：谢亮
- **身份**：哈尔滨工业大学工学博士、国家能源集团氢能管培生
- **专业领域**：动力工程及工程热物理、碳基电催化、电解水制氢
- **核心优势**：
  - 学术背景深厚（SCI论文30+篇，一作6篇）
  - 技术实力强（机器学习、DFT计算、Python数据分析）
  - 实践经验丰富（青海省科技项目、政策文件起草）
  - 创新能力强（4项发明专利、挑战杯特等奖）

### 页面目标
1. **学术展示**：突出科研成果和学术影响力
2. **技术实力**：展现专业技能和技术栈
3. **个人品牌**：建立氢能领域年轻专家形象
4. **职业发展**：连接学术研究与产业实践

## 二、先进设计趋势调研

### 2.1 2024年个人主页设计趋势

#### 视觉设计趋势
1. **玻璃拟态（Glassmorphism）**
   - 半透明背景、模糊效果
   - 营造层次感和现代感
   - 示例：https://dribbble.com/shots/16801075-Glassmorphism-Portfolio

2. **新拟态（Neumorphism）**
   - 柔和的凹凸效果
   - 适用于卡片和按钮
   - 示例：https://uxdesign.cc/neumorphism-in-ui-design-2024-trend-or-passing-fad-7c8c6e2e6d1e

3. **暗黑模式优先**
   - 默认深色主题
   - 减少眼部疲劳
   - 突出内容重点

4. **微交互（Micro-interactions）**
   - 悬停动画
   - 滚动视差
   - 加载动画

5. **3D元素和粒子效果**
   - Three.js 背景
   - 粒子动画
   - 3D模型展示

#### 技术栈趋势
1. **静态站点生成器**
   - Next.js / Gatsby (React)
   - Nuxt.js (Vue)
   - Hugo / Jekyll

2. **动画库**
   - Framer Motion
   - GSAP (GreenSock)
   - Anime.js

3. **数据可视化**
   - D3.js
   - Chart.js
   - ECharts

4. **性能优化**
   - WebP图片格式
   - 懒加载（Lazy Loading）
   - Service Worker缓存

### 2.2 优秀个人主页案例分析

#### 案例1：学术型主页
**URL**: https://www.mathjax.org/
**特点**:
- 简洁的学术风格
- 突出论文和出版物
- 清晰的导航结构
- 响应式设计

#### 案例2：技术专家主页
**URL**: https://rauchg.com/
**特点**:
- 暗黑模式设计
- 动态背景效果
- 项目展示卡片
- 博客集成

#### 案例3：科研人员主页
**URL**: https://cs.stanford.edu/people/karpathy/
**特点**:
- 极简设计
- 重点突出研究成果
- 清晰的联系方式
- 教学资源链接

### 2.3 适合本项目的框架选型

#### 推荐方案：现代静态HTML + 高级CSS + JavaScript
**理由**:
1. 当前项目已经是静态HTML，迁移成本低
2. 可以完全控制设计和性能
3. 适合GitHub Pages托管
4. 便于后期集成动态功能

**技术栈**:
- **HTML5**: 语义化标签
- **CSS3**: Grid, Flexbox, Custom Properties, Animations
- **JavaScript ES6+**: 现代语法，模块化
- **Three.js**: 3D背景效果（可选）
- **ECharts.js**: 数据可视化
- **Splitting.js**: 文字动画
- **Typed.js**: 打字机效果

## 三、页面结构设计

### 3.1 信息架构

```
首页 (Hero Section)
├── 个人品牌展示
│   ├── 姓名 + 头衔
│   ├── 核心价值主张
│   └── 动态背景效果

关于我 (About)
├── 个人简介
│   ├── 学术身份
│   ├── 职业身份
│   └── 个人特质

教育背景 (Education)
├── 博士阶段
│   ├── 学校/专业/时间
│   ├── 研究方向
│   ├── 主修课程
│   └── 导师信息
└── 本科阶段
    ├── 学校/专业/时间
    ├── 主修课程
    └── 导师信息

科研成果 (Research)
├── 期刊论文（第一作者）
│   ├── 论文列表（带引用）
│   └── 影响因子/分区
├── 合作作者论文
│   ├── 论文列表
│   └── 合作网络
├── 发明专利
│   ├── 专利列表
│   └── 授权状态
└── 学术会议
    ├── 会议报告
    └── 墙报展示

项目经验 (Projects)
├── 国家自然科学基金重点项目
├── 青海省重点研发项目
├── 企业技术开发项目
└── 其他科研项目

获奖荣誉 (Awards)
├── 国家级竞赛奖项
├── 学术荣誉
└── 其他奖项

专业技能 (Skills)
├── 学术科研能力
│   ├── 电催化制氢
│   ├── 机器学习
│   └── DFT计算
├── 数据处理与编程
│   ├── Python
│   ├── 机器学习
│   └── 数据可视化
└── 软技能
    ├── 团队协作
    ├── 项目管理
    └── 文字撰写

实习经历 (Internship)
├── 青海省市场监督管理局
└── 黑龙江省双鸭山市宝山区发改局

联系方式 (Contact)
├── 邮箱
├── GitHub
└── ResearchGate
```

### 3.2 视觉层次设计

#### 第一层次：品牌识别
- 大标题：姓名 + 核心身份
- 副标题：价值主张/研究方向
- 视觉元素：个人头像/3D模型

#### 第二层次：核心成就
- 关键数字：论文数量、专利数量、项目经费
- 重要奖项：挑战杯特等奖等
- 可视化展示：图表、进度条

#### 第三层次：详细信息
- 时间线：教育经历、项目经历
- 卡片：论文、专利、技能
- 列表：课程、荣誉

### 3.3 交互设计

#### 滚动动画
- 元素进入视口时淡入
- 数字从0开始计数动画
- 进度条填充动画

#### 悬停效果
- 卡片3D倾斜
- 按钮颜色变化
- 图片放大

#### 点击交互
- 展开/收起详细信息
- 模态框查看论文详情
- 标签筛选功能

## 四、技术实现方案

### 4.1 核心样式设计

#### 颜色系统
```css
:root {
  /* 主色调 - 科技感深蓝 */
  --primary-color: #0a192f;      /* 深蓝 */
  --secondary-color: #64ffda;    /* 青绿 */
  --accent-color: #ff6b6b;       /* 珊瑚红 */
  
  /* 中性色 */
  --bg-color: #0a192f;           /* 背景 */
  --card-bg: rgba(17, 34, 64, 0.8); /* 卡片背景 */
  --text-primary: #e6f1ff;       /* 主要文字 */
  --text-secondary: #8892b0;     /* 次要文字 */
  
  /* 状态色 */
  --success: #64ffda;
  --warning: #ffd166;
  --error: #ff6b6b;
}
```

#### 字体系统
```css
:root {
  --font-primary: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono: 'Fira Code', 'Consolas', monospace;
  --font-size-xs: 12px;
  --font-size-sm: 14px;
  --font-size-base: 16px;
  --font-size-lg: 18px;
  --font-size-xl: 20px;
  --font-size-2xl: 24px;
  --font-size-3xl: 32px;
  --font-size-4xl: 42px;
}
```

#### 阴影和动画
```css
:root {
  --shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.1);
  --shadow-md: 0 4px 8px rgba(0, 0, 0, 0.15);
  --shadow-lg: 0 8px 16px rgba(0, 0, 0, 0.2);
  --shadow-hover: 0 12px 24px rgba(0, 0, 0, 0.25);
  
  --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  --transition-slow: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}
```

### 4.2 组件设计

#### 3D Hero Section
```javascript
// 使用 Three.js 创建粒子背景
import * as THREE from 'three';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ alpha: true });

// 创建粒子系统
const particlesGeometry = new THREE.BufferGeometry();
const particlesCount = 5000;
const posArray = new Float32Array(particlesCount * 3);

for (let i = 0; i < particlesCount * 3; i++) {
  posArray[i] = (Math.random() - 0.5) * 10;
}

particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
const particlesMaterial = new THREE.PointsMaterial({
  size: 0.005,
  color: '#64ffda'
});

const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particlesMesh);
```

#### 滚动动画库
```javascript
// 使用 Intersection Observer API
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('animate-in');
    }
  });
}, observerOptions);

// 观察所有需要动画的元素
document.querySelectorAll('.animate-on-scroll').forEach(el => {
  observer.observe(el);
});
```

#### 数据可视化
```javascript
// 使用 ECharts 展示论文发表趋势
const chart = echarts.init(document.getElementById('publication-chart'));

const option = {
  backgroundColor: 'transparent',
  tooltip: {
    trigger: 'axis',
    backgroundColor: 'rgba(17, 34, 64, 0.9)',
    borderColor: '#64ffda',
    textStyle: { color: '#e6f1ff' }
  },
  xAxis: {
    type: 'category',
    data: ['2020', '2021', '2022', '2023', '2024', '2025'],
    axisLine: { lineStyle: { color: '#8892b0' } },
    axisLabel: { color: '#8892b0' }
  },
  yAxis: {
    type: 'value',
    axisLine: { lineStyle: { color: '#8892b0' } },
    axisLabel: { color: '#8892b0' },
    splitLine: { lineStyle: { color: '#112240' } }
  },
  series: [{
    data: [2, 5, 8, 12, 15, 30],
    type: 'line',
    smooth: true,
    lineStyle: { color: '#64ffda', width: 3 },
    itemStyle: { color: '#64ffda' },
    areaStyle: {
      color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
        { offset: 0, color: 'rgba(100, 255, 218, 0.3)' },
        { offset: 1, color: 'rgba(100, 255, 218, 0)' }
      ])
    }
  }]
};

chart.setOption(option);
```

### 4.3 响应式设计

#### 断点设置
```css
/* 移动端优先 */
/* 默认样式（< 640px） */

/* 平板（≥ 640px） */
@media (min-width: 640px) {
  .container { max-width: 640px; }
}

/* 桌面（≥ 1024px） */
@media (min-width: 1024px) {
  .container { max-width: 1024px; }
  .grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
  .grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
}

/* 大桌面（≥ 1280px） */
@media (min-width: 1280px) {
  .container { max-width: 1280px; }
}
```

## 五、内容策略

### 5.1 文案优化

#### 标题优化
- **原**: 关于我
- **新**: 谢亮 · 氢能科研者 × 产业实践者

#### 简介优化
- **原**: 中共党员，哈尔滨工业大学能源科学与工程学院工学博士...
- **新**: 致力于将学术积累转化为产业价值的氢能研究者。在哈工大攻读博士期间，专注于碳基电催化研究，发表SCI论文30余篇；现作为国家能源集团氢能管培生，推动科研成果产业化应用。

### 5.2 视觉内容

#### 图片资源
1. **个人形象照**：专业、亲和
2. **研究示意图**：电催化机理图
3. **项目照片**：实验室、企业场景
4. **数据图表**：论文趋势、引用网络

#### 图标系统
- 使用 Font Awesome 6 Pro
- 自定义 SVG 图标
- 统一的线性风格

## 六、性能优化

### 6.1 加载优化

#### 图片优化
- WebP 格式
- 懒加载
- 响应式图片

#### 代码分割
- CSS 按组件拆分
- JavaScript 按需加载
- 关键路径优化

### 6.2 SEO优化

#### 结构化数据
```json
{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "谢亮",
  "jobTitle": "氢能管培生",
  "worksFor": {
    "@type": "Organization",
    "name": "国家能源集团"
  },
  "alumniOf": {
    "@type": "CollegeOrUniversity",
    "name": "哈尔滨工业大学"
  },
  "sameAs": [
    "https://github.com/xie-l",
    "https://scholar.google.com/citations?user=..."
  ]
}
```

#### Meta标签
- Open Graph
- Twitter Card
- Canonical URL

## 七、部署与维护

### 7.1 部署方案
- GitHub Pages 自动部署
- CDN加速（jsDelivr）
- 自定义域名

### 7.2 监控与分析
- Google Analytics
- 页面性能监控
- 用户行为分析

## 八、实施计划

### 阶段一：基础框架（1-2天）
- [ ] 创建新的HTML结构
- [ ] 实现基础CSS样式系统
- [ ] 设置响应式布局

### 阶段二：核心组件（2-3天）
- [ ] Hero Section 3D效果
- [ ] 滚动动画系统
- [ ] 数据可视化图表

### 阶段三：内容填充（2-3天）
- [ ] 优化文案内容
- [ ] 添加图片和图标
- [ ] 实现交互功能

### 阶段四：测试优化（1-2天）
- [ ] 跨浏览器测试
- [ ] 性能优化
- [ ] SEO优化

## 九、预期效果

### 9.1 用户体验提升
- 页面加载速度 < 2s
- Lighthouse评分 > 90
- 移动端体验优化

### 9.2 个人品牌提升
- 专业形象塑造
- 学术影响力展示
- 技术实力体现

### 9.3 功能完善
- 完整的信息展示
- 良好的交互体验
- 便捷的联系方式
