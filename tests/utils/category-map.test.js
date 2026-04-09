const {
  categoryMap,
  reverseCategoryMap,
  getBlogCategory,
  getObsidianFolder,
  validateCategory
} = require('../../scripts/utils/category-map');

describe('Category Map', () => {
  test('categoryMap 包含所有分类', () => {
    expect(categoryMap['摘录记录']).toBe('quotes');
    expect(categoryMap['随笔思考']).toBe('thoughts');
    expect(categoryMap['技术思考']).toBe('tech');
    expect(categoryMap['生活日记']).toBe('life');
    expect(categoryMap['书籍阅读']).toBe('books');
    expect(categoryMap['数据分析']).toBe('analysis');
  });

  test('reverseCategoryMap 反向映射正确', () => {
    expect(reverseCategoryMap['quotes']).toBe('摘录记录');
    expect(reverseCategoryMap['thoughts']).toBe('随笔思考');
    expect(reverseCategoryMap['tech']).toBe('技术思考');
    expect(reverseCategoryMap['life']).toBe('生活日记');
    expect(reverseCategoryMap['books']).toBe('书籍阅读');
    expect(reverseCategoryMap['analysis']).toBe('数据分析');
  });

  test('getBlogCategory 返回正确的博客分类', () => {
    expect(getBlogCategory('摘录记录')).toBe('quotes');
    expect(getBlogCategory('技术思考')).toBe('tech');
  });

  test('getObsidianFolder 返回正确的 Obsidian 文件夹', () => {
    expect(getObsidianFolder('quotes')).toBe('摘录记录');
    expect(getObsidianFolder('tech')).toBe('技术思考');
  });

  test('validateCategory 验证有效分类', () => {
    expect(() => validateCategory('quotes')).not.toThrow();
    expect(() => validateCategory('tech')).not.toThrow();
  });

  test('validateCategory 抛出无效分类错误', () => {
    expect(() => validateCategory('invalid')).toThrow('无效的分类');
    expect(() => validateCategory('')).toThrow('无效的分类');
  });
});
