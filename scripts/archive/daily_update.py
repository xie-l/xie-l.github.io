#!/usr/bin/env python3
"""
每日数据自动更新脚本
生成今日三问、每日五词、今日数感等数据

使用 LCG 确定性洗牌实现穷举循环：全部展示后再循环，同一天结果相同。
数据池从 data/pool-*.json 读取（1000+ 条目），支持动态扩展。
"""

import json
import datetime
import os
import sys
from pathlib import Path

# 添加项目根目录到路径
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

# 数据存储目录
data_dir = project_root / 'data'
data_dir.mkdir(exist_ok=True)


# ── LCG 确定性洗牌 ──────────────────────────────────────────────────────────

def lcg_shuffle(items, seed):
    """使用线性同余生成器确定性洗牌，同一 seed 结果相同（Fisher-Yates）。"""
    arr = list(items)
    s = (seed ^ 0x1A2B3C4D) & 0xFFFFFFFF
    n = len(arr)
    for i in range(n - 1, 0, -1):
        s = (1664525 * s + 1013904223) & 0xFFFFFFFF
        j = s % (i + 1)
        arr[i], arr[j] = arr[j], arr[i]
    return arr


def pick_exhaustive(pool, count, day_index, seed_offset=0):
    """
    穷举循环抽取：全部展示后才重复。

    算法：
    - 每 ceil(n/count) 天为一个"周期"（epoch）
    - 同一 epoch 内用相同种子洗牌，按偏移量切片取 count 个条目
    - 进入新 epoch 时改变种子重新洗牌

    Parameters:
        pool        : 数据池列表
        count       : 每次抽取数量
        day_index   : UTC 天数（整数，0 = 1970-01-01）
        seed_offset : 不同模块使用不同偏移，避免选出相同条目
    """
    n = len(pool)
    if n == 0:
        return []
    days_per_cycle = (n + count - 1) // count   # ceil(n/count)
    epoch = day_index // days_per_cycle
    day_in_cycle = day_index % days_per_cycle

    shuffled = lcg_shuffle(pool, (epoch ^ seed_offset) & 0xFFFFFFFF)
    start = day_in_cycle * count
    chosen = []
    for i in range(count):
        chosen.append(shuffled[(start + i) % n])
    return chosen


# ── 加载数据池 ───────────────────────────────────────────────────────────────

def load_pool(filename):
    """从 data/ 目录加载 JSON 数组文件，失败返回空列表。"""
    path = data_dir / filename
    if not path.exists():
        print(f'警告：{filename} 不存在，跳过。')
        return []
    with open(path, encoding='utf-8') as f:
        data = json.load(f)
    if not isinstance(data, list):
        print(f'警告：{filename} 不是数组，跳过。')
        return []
    return data


# ── 获取今天的 UTC 天数 ──────────────────────────────────────────────────────

def utc_day_index():
    """返回自 1970-01-01 起的 UTC 天数（整数）。"""
    epoch = datetime.date(1970, 1, 1)
    today = datetime.date.today()
    return (today - epoch).days


# ── 生成各模块数据 ────────────────────────────────────────────────────────────

def generate_daily_questions():
    """生成今日三问（从 pool-questions.json 穷举循环抽取 3 条）。"""
    pool = load_pool('pool-questions.json')
    if not pool:
        pool = ["今天最重要的三件事是什么？",
                "昨天有哪些收获可以优化到今天？",
                "今天可能遇到的最大挑战是什么？如何应对？"]

    today = datetime.date.today().isoformat()
    day_idx = utc_day_index()
    questions = pick_exhaustive(pool, 3, day_idx, seed_offset=0x00000000)

    data = {
        "date": today,
        "questions": [
            {"id": i + 1, "text": q}
            for i, q in enumerate(questions)
        ]
    }

    with open(data_dir / 'daily-questions.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    pool_size = len(pool)
    cycle_days = (pool_size + 2) // 3  # ceil(n/3)
    print(f'✅ 生成今日三问: {today}  '
          f'（池 {pool_size} 条，{cycle_days} 天/轮，'
          f'第 {day_idx % cycle_days + 1} 天）')
    return data


def generate_daily_keywords():
    """生成每日五词（从 pool-keywords.json 穷举循环抽取 5 条）。"""
    pool = load_pool('pool-keywords.json')
    if not pool:
        pool = [{"term": "绿氢", "category": "能源",
                 "definition": "利用可再生能源电解水制取的氢气。",
                 "example": "青海光伏+电解槽制绿氢是典型案例。"}]

    today = datetime.date.today().isoformat()
    day_idx = utc_day_index()
    keywords = pick_exhaustive(pool, 5, day_idx, seed_offset=0xABCDEF01)

    data = {
        "date": today,
        "keywords": [
            {
                "id": i + 1,
                "term": kw.get("term", ""),
                "category": kw.get("domain", kw.get("category", "")),
                "definition": kw.get("def", kw.get("definition", "")),
                "example": kw.get("eg", kw.get("example", "")),
            }
            for i, kw in enumerate(keywords)
        ]
    }

    with open(data_dir / 'daily-keywords.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    pool_size = len(pool)
    cycle_days = (pool_size + 4) // 5
    print(f'✅ 生成每日五词: {today}  '
          f'（池 {pool_size} 条，{cycle_days} 天/轮，'
          f'第 {day_idx % cycle_days + 1} 天）')
    return data


def generate_daily_data():
    """生成今日数感（从 pool-data.json 穷举循环抽取 3 条）。"""
    pool = load_pool('pool-data.json')
    if not pool:
        pool = [{"topic": "中国年产氢总量", "domain": "氢能",
                 "number": "3500", "unit": "万吨/年",
                 "context": "全球最大产氢国，但96%为灰氢。",
                 "insight": "绿氢占比提升是行业核心目标。"}]

    today = datetime.date.today().isoformat()
    day_idx = utc_day_index()
    items = pick_exhaustive(pool, 3, day_idx, seed_offset=0x57A9C31F)

    data = {
        "date": today,
        "data_items": [
            {
                "id": i + 1,
                "topic":    item.get("topic", ""),
                "category": item.get("domain", item.get("category", "")),
                "number":   item.get("num",    item.get("number", "")),
                "unit":     item.get("label",  item.get("unit", "")),
                "context":  item.get("ctx",    item.get("context", "")),
                "insight":  item.get("sense",  item.get("insight", "")),
            }
            for i, item in enumerate(items)
        ]
    }

    with open(data_dir / 'daily-data.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    pool_size = len(pool)
    cycle_days = (pool_size + 2) // 3
    print(f'✅ 生成今日数感: {today}  '
          f'（池 {pool_size} 条，{cycle_days} 天/轮，'
          f'第 {day_idx % cycle_days + 1} 天）')
    return data


def update_stats():
    """更新统计信息。"""
    today = datetime.date.today().isoformat()

    stats_file = data_dir / 'stats.json'
    if stats_file.exists():
        with open(stats_file, 'r', encoding='utf-8') as f:
            stats = json.load(f)
        if "update_count" not in stats:
            stats["update_count"] = 0
    else:
        stats = {
            "total_words": 0,
            "update_count": 0,
            "start_date": today
        }

    stats["update_count"] += 1
    stats["last_update"] = datetime.datetime.now().isoformat()

    with open(stats_file, 'w', encoding='utf-8') as f:
        json.dump(stats, f, ensure_ascii=False, indent=2)

    print(f'✅ 更新统计数据: 第 {stats["update_count"]} 次更新')
    return stats


def main():
    """主函数。"""
    print("=" * 60)
    print("每日数据自动更新脚本（穷举循环模式）")
    print(f"开始时间: {datetime.datetime.now()}")
    print(f"UTC 天数: {utc_day_index()}")
    print("=" * 60)

    try:
        generate_daily_questions()
        generate_daily_keywords()
        generate_daily_data()
        update_stats()

        print("=" * 60)
        print("✅ 所有数据更新完成！")
        print("=" * 60)

        import subprocess
        result = subprocess.run(
            ['git', 'status', '--porcelain', 'data/'],
            capture_output=True, text=True
        )
        if result.stdout.strip():
            print("\n📦 检测到数据文件变更，需要提交到GitHub")
        else:
            print("\nℹ️ 数据文件无变更")

        return True

    except Exception as e:
        print(f"\n❌ 更新失败: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
