const { htmlToMarkdown } = require('../../scripts/utils/html-to-markdown');

describe('htmlToMarkdown', () => {
  it('应正确提取 frontmatter 和正文', () => {
    const html = `<!DOCTYPE html>
<html>
<head><title>测试标题</title></head>
<body>
  <div class="post-header">
    <h1 class="post-title">测试标题</h1>
    <div class="post-meta">
      <span><i class="fas fa-calendar"></i> 2026年4月10日</span>
      <span><i class="fas fa-folder"></i> 生活日记</span>
    </div>
  </div>
  <div class="post-content">
    <p>测试正文内容</p>
  </div>
</body>
</html>`;
    
    const result = htmlToMarkdown(html);
    
    expect(result).toContain('---');
    expect(result).toContain('title: 测试标题');
    expect(result).toContain('date: 2026-04-10');
    expect(result).toContain('测试正文内容');
  });
  
  it('应处理没有 frontmatter 的 HTML', () => {
    const html = '<div class="post-content"><p>纯内容</p></div>';
    const result = htmlToMarkdown(html);
    expect(result).toBe('纯内容');
  });
});
