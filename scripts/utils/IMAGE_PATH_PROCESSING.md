# 图片路径处理增强

## 支持的图片路径格式

本系统现在支持三种图片路径格式：

### 1. 推荐格式：`./attachments/图片.jpg`
- 图片存放在 Obsidian vault 根目录的 `attachments` 文件夹中
- 示例：`![描述](./attachments/photo.jpg)`
- 路径相对于 vault 根目录

### 2. 兼容格式：`../attachments/图片.jpg`
- 图片存放在 Obsidian vault 根目录的 `attachments` 文件夹中
- 示例：`![描述](../attachments/photo.png)`
- 路径相对于笔记所在目录的父目录

### 3. 同一目录格式：`图片.jpg`
- 图片与 Markdown 笔记文件在同一目录下
- 示例：`![描述](image.gif)`
- 路径相对于笔记所在目录

### 4. 网络图片
- 网络图片不会被处理，保持原样
- 示例：`![描述](https://example.com/image.jpg)`

## 处理流程

1. **匹配图片**：使用正则表达式匹配所有本地图片路径（排除网络图片）
2. **解析路径**：根据路径格式确定图片的源位置
3. **复制图片**：将图片复制到 `img/blog/{category}/{slug}/` 目录
4. **更新路径**：将 Markdown 中的图片路径更新为相对路径
5. **验证结果**：检查是否有未处理的本地图片并给出警告

## 警告信息

当发现未处理的本地图片时，系统会显示：

```
⚠️  发现 N 张本地图片未被处理
   支持的图片路径格式:
   - ![描述](./attachments/图片.jpg) - 推荐 (相对于 vault 根目录)
   - ![描述](../attachments/图片.jpg) - 兼容 (相对于 vault 根目录)
   - ![描述](图片.jpg) - 同一目录 (相对于笔记所在目录)
   - 网络图片不会被处理，保持原样
   - ![图片1](path1.jpg)
   - ![图片2](path2.png)
```

## 实现文件

- `scripts/utils/image-processor.js` - 核心图片处理逻辑
- `scripts/obsidian-sync.js` - 同步流程中调用图片处理

## 测试

测试文件：`obsidian-vault/生活日记/测试图片路径格式.md`

运行测试：
```bash
node scripts/obsidian-sync.js --direction obsidian-to-blog --file "生活日记/测试图片路径格式.md"
```

## 注意事项

1. 所有本地图片都会被复制到 `img/blog/{category}/{slug}/` 目录
2. 图片路径在生成的 HTML 中会更新为 `../../img/blog/{category}/{slug}/文件名`
3. 如果图片文件不存在，会显示警告但继续处理
4. 网络图片（http:// 或 https://）不会被处理
