# 图片使用说明

## 头像图片

1. **推荐尺寸**: 150x150 像素或更高（正方形）
2. **推荐格式**: JPG, PNG, WebP
3. **文件命名**: `avatar.jpg` (或 `avatar.png`)
4. **放置位置**: 将此文件放在 `img/` 目录下

## 如何添加你的头像

### 方法1：直接替换
- 将你的头像图片重命名为 `avatar.jpg`
- 替换 `img/` 目录下的 `avatar.jpg` 文件

### 方法2：修改HTML引用
如果不想使用 `avatar.jpg` 这个名字，可以修改 `index.html` 中的图片引用：

```html
<!-- 找到这行代码 -->
<img src="img/avatar.jpg" alt="个人头像" class="avatar" onerror="this.src='https://via.placeholder.com/150'">

<!-- 修改为你的图片文件名 -->
<img src="img/your-photo.png" alt="个人头像" class="avatar" onerror="this.src='https://via.placeholder.com/150'">
```

### 方法3：使用在线图片
也可以使用在线图片链接：

```html
<img src="https://your-image-url.com/photo.jpg" alt="个人头像" class="avatar" onerror="this.src='https://via.placeholder.com/150'">
```

## 其他图片

如果你想添加更多图片（如项目截图、证书等），可以：

1. 将图片文件放入 `img/` 目录
2. 在HTML中使用相对路径引用：
   ```html
   <img src="img/your-image.jpg" alt="描述文字">
   ```

## 图片优化建议

- 使用适当的图片格式（照片用JPG，图标用PNG/SVG）
- 压缩图片以减少加载时间
- 使用响应式图片（`srcset`）以适应不同屏幕
- 为所有图片添加 `alt` 属性以提高可访问性

## 占位图片

如果暂时没有合适的头像，可以使用以下免费服务获取占位图片：

- https://placeholder.com/
- https://pravatar.cc/
- https://i.pravatar.cc/

示例：
```html
<img src="https://i.pravatar.cc/150?img=3" alt="个人头像">
```
