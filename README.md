# 个人主页

一个简洁、现代、响应式的个人主页模板，可以轻松部署到 GitHub Pages。

## 特性

- ✅ 响应式设计，完美适配桌面端和移动端
- ✅ 现代化的UI设计，简洁大气
- ✅ 平滑滚动和动画效果
- ✅ 技能条动画展示
- ✅ 项目经验展示
- ✅ 教育背景时间线
- ✅ 社交链接集成
- ✅ 易于自定义和扩展

## 快速开始

### 1. 下载或克隆项目

```bash
git clone https://github.com/yourusername/personal-homepage.git
cd personal-homepage
```

或者直接下载ZIP文件并解压。

### 2. 自定义内容

编辑 `index.html` 文件，替换以下内容：

#### 个人信息
```html
<!-- 找到并修改以下内容 -->
<h2 class="profile-name">你的名字</h2>
<p class="profile-title">软件工程师</p>
<p class="profile-bio">专注于前端开发和用户体验设计</p>
```

#### 社交链接
```html
<!-- 修改邮箱和社交账号链接 -->
<a href="mailto:your.email@example.com" target="_blank" title="邮箱">
<a href="https://github.com/yourusername" target="_blank" title="GitHub">
<a href="https://linkedin.com/in/yourusername" target="_blank" title="LinkedIn">
```

#### 关于我
```html
<!-- 修改个人简介 -->
<p>我是一名充满激情的软件工程师...</p>
```

#### 教育背景
```html
<!-- 修改学校和专业信息 -->
<h3>硕士学位 - 计算机科学与技术</h3>
<p class="timeline-institution">某某大学</p>
```

#### 项目经验
```html
<!-- 修改项目名称、描述和技术栈 -->
<h3>电商平台重构</h3>
<p class="project-description">负责前端架构设计...</p>
<span class="tech-tag">React</span>
```

#### 技能水平
```html
<!-- 修改技能名称和熟练度（0-100） -->
<span>JavaScript/TypeScript</span>
<div class="skill-progress" data-skill="90"></div>
```

#### 联系方式
```html
<!-- 修改联系信息 -->
<span>your.email@example.com</span>
<span>+86 138 0000 0000</span>
```

### 3. 添加头像

将你的头像图片（推荐150x150像素）放入 `img/` 目录，命名为 `avatar.jpg`，或者修改HTML中的图片引用路径。

**头像显示优化**：头像已自动居中显示，如果你的头像显示不完整，可以在 `css/style.css` 中调整 `.avatar-container` 的 `margin` 值。

详见 `img/README.md` 文件。

## 部署到 GitHub Pages

### 方法1：使用 GitHub Desktop（推荐新手）

1. **安装 GitHub Desktop**
   - 从 [desktop.github.com](https://desktop.github.com/) 下载并安装

2. **创建新仓库**
   - 打开 GitHub Desktop
   - 点击 "File" -> "New repository"
   - 仓库名称：`yourusername.github.io`（重要：必须按照这个格式）
   - 本地路径：选择你的 `personal-homepage` 文件夹
   - 点击 "Create repository"

3. **提交更改**
   - 在左下角填写提交信息，如 "Initial commit"
   - 点击 "Commit to main"

4. **发布到 GitHub**
   - 点击 "Publish repository"
   - 勾选 "Keep this code private"（如果你想公开就取消勾选）
   - 点击 "Publish repository"

5. **启用 GitHub Pages**
   - 打开浏览器，访问 `https://github.com/yourusername/yourusername.github.io`
   - 点击 "Settings" 标签
   - 在左侧菜单找到 "Pages"
   - 在 "Source" 部分，选择 "main" 分支和 "/ (root)" 文件夹
   - 点击 "Save"
   - 等待几分钟，你的个人主页就会在 `https://yourusername.github.io` 上线

### 方法2：使用命令行

1. **初始化 Git 仓库**
```bash
cd personal-homepage
git init
```

2. **添加所有文件**
```bash
git add .
```

3. **提交更改**
```bash
git commit -m "Initial commit - Personal homepage"
```

4. **创建 GitHub 仓库**
   - 访问 [github.com/new](https://github.com/new)
   - 仓库名称必须命名为：`yourusername.github.io`（将 `yourusername` 替换为你的GitHub用户名）
   - 点击 "Create repository"

5. **链接本地仓库到 GitHub**
```bash
git remote add origin https://github.com/yourusername/yourusername.github.io.git
```

6. **推送到 GitHub**
```bash
git push -u origin main
```

7. **启用 GitHub Pages**
   - 访问 `https://github.com/yourusername/yourusername.github.io`
   - 进入 Settings > Pages
   - 在 "Source" 中选择 "main" 分支
   - 等待几分钟，访问 `https://yourusername.github.io`

### 方法3：直接上传（最简单）

1. **创建 GitHub 仓库**
   - 访问 [github.com/new](https://github.com/new)
   - 仓库名称：`yourusername.github.io`
   - 点击 "Create repository"

2. **上传文件**
   - 在仓库页面点击 "Add file" -> "Upload files"
   - 拖拽你的 `personal-homepage` 文件夹中的所有文件到上传区域
   - 等待上传完成
   - 点击 "Commit changes"

3. **启用 GitHub Pages**
   - 进入 Settings > Pages
   - 在 "Source" 中选择 "main" 分支
   - 等待几分钟，访问 `https://yourusername.github.io`

## 验证部署

部署完成后，访问 `https://yourusername.github.io`（将 `yourusername` 替换为你的GitHub用户名）。

如果页面没有立即显示，请等待几分钟，GitHub Pages 需要一些时间来部署。

## 更新你的个人主页

## 新功能使用指南

### 📔 个人日记系统

现在你可以在 `blog/` 目录下撰写个人日记和思考：

1. **访问日记主页**：点击导航栏的"日记"链接
2. **选择分类**：
   - **技术思考**：记录编程心得、技术探索、项目总结
   - **生活日记**：记录日常生活、读书感悟、成长记录
3. **添加新文章**：
   - 复制现有的 `blog/tech/index.html` 或 `blog/life/index.html` 文件
   - 重命名为新的文件名（如 `my-first-post.html`）
   - 修改标题和内容
   - 在列表页面添加链接指向新文章

### 📁 文件管理中心

在 `files/` 目录可以方便地管理文件和照片：

1. **上传文件**：
   - 照片：放入 `files/photos/` 目录
   - 文档：放入 `files/documents/` 目录
   - 支持格式：JPG, PNG, GIF, PDF, Word, Excel, PPT等

2. **管理文件**：
   ```bash
   # 添加新文件到Git
   git add files/photos/my-photo.jpg
   git add files/documents/my-document.pdf
   
   # 提交更改
   git commit -m "添加新照片和文档"
   
   # 推送到GitHub
   git push origin main
   ```

3. **访问文件**：上传后，通过导航栏的"文件"链接访问文件管理中心

### 🎨 界面优化

- **浏览器图标**：已添加个性化的favicon，浏览器标签页会显示👤图标
- **头像居中**：头像现在完美居中显示，不会被遮挡
- **丝滑滚动**：左侧个人资料卡片滚动更加流畅自然

## 更新你的个人主页

要更新内容，只需：

1. 修改本地文件（主页、日记、添加新文件等）
2. 提交更改：
   ```bash
   git add .
   git commit -m "更新内容"
   git push origin main
   ```
3. 等待几分钟，GitHub Pages 会自动更新

### 快速更新常用内容

```bash
# 更新日记
git add blog/
git commit -m "添加新日记"
git push origin main

# 上传新照片
git add files/photos/
git commit -m "上传新照片"
git push origin main

# 更新文档
git add files/documents/
git commit -m "更新文档"
git push origin main
```

## 自定义域名（可选）

如果你想使用自定义域名（如 `yourname.com`）：

1. 在 `personal-homepage` 文件夹中创建 `CNAME` 文件（无扩展名）
2. 在文件中写入你的域名，如：`www.yourname.com`
3. 提交并推送更改
4. 在你的域名提供商处设置DNS记录指向GitHub Pages

详细步骤参考：[GitHub Pages 自定义域名](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site)

## 技术栈

- **HTML5** - 语义化标记
- **CSS3** - 现代样式和动画
- **JavaScript (ES6+)** - 交互功能
- **Font Awesome** - 图标库
- **GitHub Pages** - 免费托管

## 浏览器兼容性

- Chrome (推荐)
- Firefox
- Safari
- Edge
- 移动端浏览器

## 文件结构

```
personal-homepage/
├── index.html          # 主页面
├── css/
│   └── style.css       # 样式文件
├── js/
│   └── main.js         # JavaScript文件
├── img/
│   ├── avatar.jpg      # 头像图片（需要添加）
│   └── README.md       # 图片使用说明
├── blog/               # 个人日记和博客
│   ├── index.html      # 日记主页
│   ├── tech/           # 技术思考
│   │   └── index.html
│   └── life/           # 生活日记
│       └── index.html
├── files/              # 文件管理中心
│   ├── index.html      # 文件管理主页
│   ├── photos/         # 照片相册
│   │   └── index.html
│   └── documents/      # 文档资料
│       └── index.html
└── README.md           # 此文件
```

## 常见问题

### Q: 页面部署后样式错乱？
A: 确保所有文件路径正确，特别是CSS和JS文件的引用路径。使用相对路径。

### Q: 头像不显示？
A: 检查头像文件是否在 `img/` 目录下，文件名是否为 `avatar.jpg`，或者修改HTML中的引用路径。

### Q: 如何修改主题颜色？
A: 编辑 `css/style.css` 文件中的CSS变量（`:root` 部分）。

### Q: 如何添加新页面？
A: 创建新的HTML文件，并在导航栏中添加相应链接。

### Q: 如何让搜索引擎收录？
A: 添加 `robots.txt` 文件，并提交sitemap到搜索引擎。

## 贡献

欢迎提交 Issue 和 Pull Request 来改进这个模板！

## 许可证

MIT License - 可自由使用、修改和分发。

## 支持

如有问题，请：
1. 查看 [GitHub Pages 文档](https://docs.github.com/en/pages)
2. 提交 Issue 到本仓库
3. 联系项目维护者

## 更新日志

- 2024-01 - 初始版本发布
- 添加了响应式设计
- 优化了移动端体验

---

**祝你的个人主页上线成功！** 🎉
