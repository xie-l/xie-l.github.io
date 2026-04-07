#!/usr/bin/env python3
"""
每日数据自动更新脚本
生成今日三问、每日五词、今日数感等数据
"""

import json
import random
import datetime
import os
import sys
from pathlib import Path

# 添加项目根目录到路径
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

# 数据存储目录
data_dir = project_root / 'data'
data_dir.mkdir(exist_ok=True)

# 每日三问题库
DAILY_QUESTIONS_POOL = [
    "今天最重要的三件事是什么？",
    "昨天有哪些收获可以优化到今天？",
    "今天可能遇到的最大挑战是什么？如何应对？",
    "今天的目标与年度目标有什么关联？",
    "今天可以为团队/他人创造什么价值？",
    "今天有哪些时间可以被更高效地利用？",
    "今天需要学习什么新知识点？",
    "今天有哪些决策需要基于数据而非直觉？",
    "今天如何平衡深度工作与事务性工作？",
    "今天的精力峰值在什么时间段？如何安排重要工作？",
    "今天有哪些沟通需要提前准备？",
    "今天如何确保工作与生活的平衡？",
    "今天有哪些风险需要提前预防？",
    "今天有哪些机会可以主动创造？",
    "今天如何衡量自己的成功？",
    "今天有哪些习惯需要坚持？哪些需要改进？",
    "今天如何提升自己的不可替代性？",
    "今天有哪些信息需要主动获取？",
    "今天如何为长期目标积累复利？",
    "今天有哪些情绪需要管理？",
    "今天如何保持专注力？",
    "今天有哪些工具/方法可以提升效率？",
    "今天如何确保高质量的输出？",
    "今天有哪些关系需要维护？",
    "今天如何保持身体健康？",
    "今天有哪些创新可以尝试？",
    "今天如何提升自己的专业判断力？",
    "今天有哪些经验可以沉淀为知识？",
    "今天如何确保充足的睡眠？",
    "今天有哪些边界需要设定？"
]

# 每日五词词库
DAILY_KEYWORDS_POOL = [
    {
        "term": "催化活性",
        "category": "电化学",
        "definition": "催化剂促进化学反应的能力，通常用反应速率或转化率来衡量。",
        "example": "通过优化催化剂的电子结构，我们显著提升了其催化活性。"
    },
    {
        "term": "过电位",
        "category": "电化学",
        "definition": "实际电化学反应电位与理论热力学电位之间的差值，是衡量电催化活性的重要指标。",
        "example": "降低过电位是提升电解水制氢效率的关键。"
    },
    {
        "term": "活性位点",
        "category": "催化",
        "definition": "催化剂表面能够吸附反应物并促进化学反应的特定原子或原子簇。",
        "example": "DFT计算揭示了边缘碳原子是主要的活性位点。"
    },
    {
        "term": "选择",
        "category": "催化",
        "definition": "催化剂对特定反应路径的偏好程度，通常用目标产物与副产物的比例表示。",
        "example": "高选择性的催化剂可以抑制副反应，提高目标产物收率。"
    },
    {
        "term": "稳定性",
        "category": "材料",
        "definition": "催化剂在长时间运行或苛刻条件下保持性能的能力。",
        "example": "催化剂的稳定性直接影响其工业化应用的可行性。"
    },
    {
        "term": "特征工程",
        "category": "机器学习",
        "definition": "从原始数据中提取和转换特征，以提高机器学习模型性能的过程。",
        "example": "良好的特征工程使模型准确率提升了15%。"
    },
    {
        "term": "交叉验证",
        "category": "机器学习",
        "definition": "将数据集分成多份，轮流作为训练集和验证集，以评估模型泛化能力的方法。",
        "example": "采用5折交叉验证确保模型的可靠性。"
    },
    {
        "term": "过拟合",
        "category": "机器学习",
        "definition": "模型在训练数据上表现很好，但在新数据上表现差的现象。",
        "example": "通过正则化技术有效防止了过拟合。"
    },
    {
        "term": "第一性原理",
        "category": "计算",
        "definition": "基于量子力学基本原理，不依赖经验参数计算材料性质的方法。",
        "example": "通过第一性原理计算预测了催化剂的电子结构。"
    },
    {
        "term": "态密度",
        "category": "计算",
        "definition": "单位能量区间内电子态的数目，是分析材料电子结构的重要工具。",
        "example": "态密度分析揭示了催化活性的起源。"
    },
    {
        "term": "氢能",
        "category": "能源",
        "definition": "以氢气为载体的清洁能源，具有高能量密度和零碳排放的特点。",
        "example": "氢能被视为实现碳中和的关键能源形式。"
    },
    {
        "term": "电解水制氢",
        "category": "能源",
        "definition": "利用电能将水分解为氢气和氧气的过程，是绿氢的主要生产方式。",
        "example": "碱性电解水制氢技术已经相对成熟。"
    },
    {
        "term": "质子交换膜",
        "category": "能源",
        "definition": "允许质子通过但阻隔气体的固体聚合物电解质薄膜，是PEM电解槽的核心组件。",
        "example": "质子交换膜的性能直接影响电解效率。"
    },
    {
        "term": "碳中和",
        "category": "环境",
        "definition": "通过减排和碳吸收，使二氧化碳净排放量为零的状态。",
        "example": "中国承诺在2060年前实现碳中和。"
    },
    {
        "term": "循环经济",
        "category": "经济",
        "definition": "以资源的高效利用和循环利用为核心，实现经济与环境协调发展的经济模式。",
        "example": "氢能产业符合循环经济的发展理念。"
    }
]

# 今日数感数据池
DAILY_DATA_POOL = [
    {
        "topic": "中国氢能产量",
        "category": "能源",
        "number": "3,300",
        "unit": "万吨/年",
        "context": "中国2025年氢气产量约为3300万吨，占全球氢气产量的30%左右，其中绿氢占比正在快速提升。",
        "insight": "氢能产业正处于爆发式增长前夜，预计到2030年绿氢产能将达到100万吨/年以上。"
    },
    {
        "topic": "电解水制氢效率",
        "category": "技术",
        "number": "4.3",
        "unit": "kWh/m³",
        "context": "碱性电解水制氢的能耗约为4.3-5.0 kWh/m³ H₂，相当于每千克氢气消耗约48-56度电。",
        "insight": "能耗是制约绿氢成本的关键因素，降低电耗10%可使氢气成本下降约0.8-1.0元/kg。"
    },
    {
        "topic": "碳基催化剂占比",
        "category": "材料",
        "number": "78",
        "unit": "%",
        "context": "碳基催化剂在电催化领域占据主导地位，因其成本低、导电性好、结构可调性强等优势。",
        "insight": "碳材料的微结构调控是提升催化性能的关键，孔径分布每优化10%，活性可提升15-20%。"
    },
    {
        "topic": "氢气热值",
        "category": "能源",
        "number": "120",
        "unit": "MJ/kg",
        "context": "氢气的质量热值约为120 MJ/kg，是汽油的2.8倍，天然气的2.4倍。",
        "insight": "氢能的高能量密度使其成为理想的储能介质，尤其适合长时储能场景。"
    },
    {
        "topic": "电解槽效率",
        "category": "技术",
        "number": "75",
        "unit": "%",
        "context": "目前商业化碱性电解槽的系统效率约为75%，PEM电解槽效率可达80%以上。",
        "insight": "效率提升是降低绿氢成本的核心，每提升1%效率可降低氢气成本约0.05元/m³。"
    },
    {
        "topic": "氢燃料电池效率",
        "category": "技术",
        "number": "60",
        "unit": "%",
        "context": "氢燃料电池的电化学转换效率约为60%，远高于内燃机的30-40%。",
        "insight": "燃料电池的高效率使其在交通领域具有显著优势，尤其适合重载长途运输。"
    },
    {
        "topic": "储氢密度",
        "category": "材料",
        "number": "5.5",
        "unit": "wt%",
        "context": "目前商业化的金属氢化物储氢材料的储氢密度约为5.5wt%，接近DOE目标。",
        "insight": "储氢密度是制约氢能应用的关键瓶颈，每提升1wt%可显著降低储运成本。"
    },
    {
        "topic": "氢气扩散系数",
        "category": "物理",
        "number": "0.61",
        "unit": "cm²/s",
        "context": "氢气在空气中的扩散系数为0.61 cm²/s，是天然气的4倍，有利于泄漏时快速扩散。",
        "insight": "氢气的快速扩散特性降低了泄漏积聚的风险，提高了安全性。"
    },
    {
        "topic": "催化剂载量",
        "category": "材料",
        "number": "0.5",
        "unit": "mg/cm²",
        "context": "PEM电解槽阳极铱催化剂载量约为0.5 mg/cm²，是成本的主要贡献者。",
        "insight": "降低催化剂载量是降低成本的关键，每降低0.1 mg/cm²可降低成本约5%。"
    },
    {
        "topic": "电解槽寿命",
        "category": "技术",
        "number": "60,000",
        "unit": "小时",
        "context": "商业化碱性电解槽的设计寿命约为60,000小时，相当于7年连续运行。",
        "insight": "延长电解槽寿命可降低资本成本，每延长1万小时可降低氢气成本约0.1元/m³。"
    }
]

def generate_daily_questions():
    """生成今日三问"""
    today = datetime.date.today().isoformat()
    questions = random.sample(DAILY_QUESTIONS_POOL, 3)
    
    data = {
        "date": today,
        "questions": [
            {"id": 1, "text": questions[0]},
            {"id": 2, "text": questions[1]},
            {"id": 3, "text": questions[2]}
        ]
    }
    
    # 保存到文件
    with open(data_dir / 'daily-questions.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"✅ 生成今日三问: {today}")
    return data

def generate_daily_keywords():
    """生成每日五词"""
    today = datetime.date.today().isoformat()
    keywords = random.sample(DAILY_KEYWORDS_POOL, 5)
    
    data = {
        "date": today,
        "keywords": [
            {
                "id": i + 1,
                "term": keyword["term"],
                "category": keyword["category"],
                "definition": keyword["definition"],
                "example": keyword["example"]
            }
            for i, keyword in enumerate(keywords)
        ]
    }
    
    # 保存到文件
    with open(data_dir / 'daily-keywords.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"✅ 生成每日五词: {today}")
    return data

def generate_daily_data():
    """生成今日数感"""
    today = datetime.date.today().isoformat()
    data_items = random.sample(DAILY_DATA_POOL, 3)
    
    data = {
        "date": today,
        "data_items": [
            {
                "id": i + 1,
                "topic": item["topic"],
                "category": item["category"],
                "number": item["number"],
                "unit": item["unit"],
                "context": item["context"],
                "insight": item["insight"]
            }
            for i, item in enumerate(data_items)
        ]
    }
    
    # 保存到文件
    with open(data_dir / 'daily-data.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"✅ 生成今日数感: {today}")
    return data

def update_stats():
    """更新统计信息"""
    today = datetime.date.today().isoformat()
    
    # 读取现有统计数据
    stats_file = data_dir / 'stats.json'
    if stats_file.exists():
        with open(stats_file, 'r', encoding='utf-8') as f:
            stats = json.load(f)
        # 确保必要的字段存在
        if "update_count" not in stats:
            stats["update_count"] = 0
    else:
        stats = {
            "total_words": 0,
            "update_count": 0,
            "start_date": today
        }
    
    # 更新统计
    stats["update_count"] += 1
    stats["last_update"] = datetime.datetime.now().isoformat()
    
    # 保存统计
    with open(stats_file, 'w', encoding='utf-8') as f:
        json.dump(stats, f, ensure_ascii=False, indent=2)
    
    print(f"✅ 更新统计数据: 第 {stats['update_count']} 次更新")
    return stats

def main():
    """主函数"""
    print("=" * 50)
    print("每日数据自动更新脚本")
    print(f"开始时间: {datetime.datetime.now()}")
    print("=" * 50)
    
    try:
        # 生成数据
        generate_daily_questions()
        generate_daily_keywords()
        generate_daily_data()
        update_stats()
        
        print("=" * 50)
        print("✅ 所有数据更新完成！")
        print("=" * 50)
        
        # 检查是否需要提交
        import subprocess
        result = subprocess.run(['git', 'status', '--porcelain', 'data/'], 
                              capture_output=True, text=True)
        
        if result.stdout.strip():
            print("\n📦 检测到数据文件变更，需要提交到GitHub")
            print("请确保GitHub Actions工作流已正确配置")
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
