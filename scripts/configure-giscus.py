#!/usr/bin/env python3
"""
配置 Giscus 评论系统
用法：python3 scripts/configure-giscus.py <category-id>

仓库 ID 已内置（R_kgDOJxjSOA），只需传入从 giscus.app 获取的 category-id。
示例：python3 scripts/configure-giscus.py DIC_kwDOJxjSOA4CAbcd
"""

import sys, glob, re

REPO_ID = "R_kgDOJxjSOA"   # 已确认（xie-l/xie-l.github.io 的 GraphQL node_id）

def main():
    if len(sys.argv) < 2:
        print("用法: python3 scripts/configure-giscus.py <category-id>")
        print("category-id 从 https://giscus.app 配置页面复制")
        sys.exit(1)

    category_id = sys.argv[1].strip()
    if not category_id.startswith("DIC_"):
        print(f"警告：category-id 通常以 'DIC_' 开头，你输入的是: {category_id}")
        confirm = input("确认继续？(y/N): ").strip().lower()
        if confirm != "y":
            sys.exit(0)

    posts = [p for p in glob.glob("blog/**/*.html", recursive=True)
             if "giscus" in open(p, encoding="utf-8").read()]

    count = 0
    for path in sorted(posts):
        with open(path, encoding="utf-8") as f:
            content = f.read()

        new = content.replace('data-repo-id="YOUR_REPO_ID"',
                              f'data-repo-id="{REPO_ID}"')
        new = new.replace('data-category-id="YOUR_CATEGORY_ID"',
                          f'data-category-id="{category_id}"')

        if new != content:
            with open(path, "w", encoding="utf-8") as f:
                f.write(new)
            print(f"[ok] {path}")
            count += 1
        else:
            print(f"[skip] 已配置或无占位符: {path}")

    print(f"\n完成：已配置 {count} 篇文章的 Giscus 评论")
    if count > 0:
        print("现在可以 git add blog/ && git commit && git push 了")

if __name__ == "__main__":
    main()
