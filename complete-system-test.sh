#!/bin/bash
# 完整系统测试脚本

echo "=== GitHub个人主页完整系统测试 ==="
echo "测试时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

passed=0
failed=0

# 测试函数
test_pass() {
    echo -e "${GREEN}✓${NC} $1"
    ((passed++))
}

test_fail() {
    echo -e "${RED}✗${NC} $1"
    ((failed++))
}

test_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

echo "1. 检查文件结构"
echo "=================="

# 检查关键文件
files=(
    "index.html"
    "scripts/obsidian-sync.js"
    "scripts/utils/category-index.js"
    "admin/main.js"
    "blog/life/index.html"
    "data/weread.json"
    "data/weather.json"
    "data/energy.json"
    "data/stats.json"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        test_pass "文件存在: $file"
    else
        test_fail "文件不存在: $file"
    fi
done

echo ""
echo "2. 测试Obsidian同步功能"
echo "=========================="

# 测试obsidian-to-blog
echo "测试: Obsidian → Blog"
node scripts/obsidian-sync.js --direction obsidian-to-blog --file "生活日记/今日小结（2026.04.09）.md" --dry-run > /tmp/test_obsidian.log 2>&1
if grep -q "成功:" /tmp/test_obsidian.log; then
    test_pass "Obsidian到Blog同步正常"
else
    test_fail "Obsidian到Blog同步失败"
    cat /tmp/test_obsidian.log
fi

# 测试blog-to-obsidian
echo "测试: Blog → Obsidian"
node scripts/obsidian-sync.js --direction blog-to-obsidian --file "life/今日小结（2026.04.09）（202604）.html" --dry-run > /tmp/test_blog.log 2>&1
if grep -q "成功:" /tmp/test_blog.log; then
    test_pass "Blog到Obsidian同步正常"
else
    test_fail "Blog到Obsidian同步失败"
    cat /tmp/test_blog.log
fi

# 测试both方向
echo "测试: 双向同步"
node scripts/obsidian-sync.js --direction both --dry-run > /tmp/test_both.log 2>&1
if grep -q "双向同步完成" /tmp/test_both.log; then
    test_pass "双向同步功能正常"
else
    test_fail "双向同步功能失败"
    cat /tmp/test_both.log
fi

echo ""
echo "3. 测试索引去重功能"
echo "===================="

# 检查索引中是否有重复项
duplicates=$(grep -o '今日小结（2026.04.09）（202604）.html' blog/life/index.html | wc -l)
if [ "$duplicates" -eq 1 ]; then
    test_pass "索引无重复项"
elif [ "$duplicates" -eq 0 ]; then
    test_warn "索引中未找到测试文件"
else
    test_fail "索引中存在 $duplicates 个重复项"
fi

echo ""
echo "4. 检查数据文件"
echo "================"

# 检查数据文件大小
for file in data/weather.json data/energy.json data/stats.json; do
    if [ -f "$file" ]; then
        size=$(wc -c < "$file")
        if [ "$size" -gt 100 ]; then
            test_pass "数据文件正常: $file ($size 字节)"
        else
            test_warn "数据文件过小: $file ($size 字节)"
        fi
    else
        test_fail "数据文件不存在: $file"
    fi
done

# 检查微信读书数据
if [ -f "data/weread.json" ]; then
    if grep -q '"reading":null' data/weread.json; then
        test_warn "微信读书数据为空（需要配置Cookie）"
    else
        test_pass "微信读书数据已配置"
    fi
else
    test_fail "微信读书数据文件不存在"
fi

echo ""
echo "5. 验证JavaScript语法"
echo "======================"

# 检查JavaScript语法
js_files=(
    "scripts/obsidian-sync.js"
    "scripts/utils/category-index.js"
    "admin/main.js"
)

for file in "${js_files[@]}"; do
    if node -c "$file" 2>/dev/null; then
        test_pass "JavaScript语法正确: $file"
    else
        test_fail "JavaScript语法错误: $file"
        node -c "$file"
    fi
done

echo ""
echo "6. 检查GitHub API配置"
echo "======================"

# 检查是否配置了GitHub token（实际测试需要token）
if [ -n "$GITHUB_TOKEN" ]; then
    test_pass "GitHub Token已配置"
else
    test_warn "GitHub Token未配置（某些测试需要）"
fi

echo ""
echo "=================="
echo "测试完成！"
echo "=================="
echo -e "通过: ${GREEN}${passed}${NC}"
echo -e "失败: ${RED}${failed}${NC}"
echo ""

if [ $failed -eq 0 ]; then
    echo -e "${GREEN}✓ 所有测试通过！${NC}"
    exit 0
else
    echo -e "${RED}✗ 有 $failed 个测试失败${NC}"
    exit 1
fi
