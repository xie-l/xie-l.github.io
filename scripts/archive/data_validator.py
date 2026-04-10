#!/usr/bin/env python3
"""
数据质量验证工具
确保每条数据符合高质量标准
"""

import json
import sys
from pathlib import Path

class DataValidator:
    def __init__(self, data_dir="data"):
        self.data_dir = Path(data_dir)
    
    def validate_questions(self, filepath):
        """验证问题质量"""
        with open(filepath, 'r', encoding='utf-8') as f:
            questions = json.load(f)
        
        print(f"\n📋 验证问题数据: {filepath}")
        print(f"总数: {len(questions)} 条")
        
        quality_score = 0
        for i, q in enumerate(questions, 1):
            score = 0
            feedback = []
            
            # 1. 长度检查 (15-100字)
            if 15 <= len(q) <= 100:
                score += 1
            else:
                feedback.append(f"长度不合适: {len(q)}字")
            
            # 2. 是否包含问号
            if "？" in q:
                score += 1
            else:
                feedback.append("缺少问号")
            
            # 3. 启发性检查 (包含“什么”、“为什么”、“如何”等)
            heuristic_words = ["什么", "为什么", "如何", "怎样", "哪个", "哪里"]
            if any(word in q for word in heuristic_words):
                score += 1
            else:
                feedback.append("启发性不足")
            
            # 4. 深度检查 (包含抽象概念)
            deep_concepts = ["认知", "思维", "逻辑", "系统", "本质", "原理", "模式", "战略"]
            if any(concept in q for concept in deep_concepts):
                score += 1
            
            # 5. 行动导向 (包含“今天”、“现在”、“如何”等)
            action_words = ["今天", "现在", "如何", "怎么"]
            if any(word in q for word in action_words):
                score += 1
            
            quality_score += score
            
            if score < 3:
                print(f"  ⚠️  问题{i}: 得分{score}/5 - {q[:30]}...")
                for fb in feedback:
                    print(f"     - {fb}")
        
        avg_score = quality_score / len(questions)
        print(f"\n✅ 平均质量得分: {avg_score:.2f}/5")
        
        if avg_score >= 4.0:
            print("🌟 质量评级: 优秀")
        elif avg_score >= 3.5:
            print("👍 质量评级: 良好")
        else:
            print("⚠️  质量评级: 需要改进")
        
        return avg_score
    
    def validate_keywords(self, filepath):
        """验证关键词质量"""
        with open(filepath, 'r', encoding='utf-8') as f:
            keywords = json.load(f)
        
        print(f"\n📋 验证关键词数据: {filepath}")
        print(f"总数: {len(keywords)} 条")
        
        required_fields = ["term", "category", "definition", "example"]
        category_count = {}
        quality_score = 0
        
        for i, kw in enumerate(keywords, 1):
            score = 0
            feedback = []
            
            # 1. 检查必需字段
            for field in required_fields:
                if field in kw and kw[field]:
                    score += 1
                else:
                    feedback.append(f"缺少字段: {field}")
            
            # 2. 定义长度检查 (50-200字)
            if "definition" in kw and 50 <= len(kw["definition"]) <= 200:
                score += 1
            else:
                feedback.append("定义长度不合适")
            
            # 3. 实例相关性检查 (是否包含央企/氢能/国家能源集团)
            if "example" in kw and any(word in kw["example"] for word in ["国家能源集团", "氢能", "央企"]):
                score += 1
            
            # 4. 分类统计
            category = kw.get("category", "未知")
            category_count[category] = category_count.get(category, 0) + 1
            
            quality_score += score
            
            if score < 5:
                print(f"  ⚠️  关键词{i}: 得分{score}/6 - {kw.get('term', '未知')}")
                for fb in feedback:
                    print(f"     - {fb}")
        
        avg_score = quality_score / len(keywords)
        print(f"\n✅ 平均质量得分: {avg_score:.2f}/6")
        print(f"分类分布: {len(category_count)} 个类别")
        for cat, count in sorted(category_count.items(), key=lambda x: x[1], reverse=True)[:10]:
            print(f"  - {cat}: {count}条")
        
        return avg_score
    
    def validate_data_items(self, filepath):
        """验证数据洞察质量"""
        with open(filepath, 'r', encoding='utf-8') as f:
            data_items = json.load(f)
        
        print(f"\n📋 验证数据洞察: {filepath}")
        print(f"总数: {len(data_items)} 条")
        
        required_fields = ["topic", "category", "number", "unit", "context", "insight"]
        category_count = {}
        quality_score = 0
        
        for i, item in enumerate(data_items, 1):
            score = 0
            feedback = []
            
            # 1. 检查必需字段
            for field in required_fields:
                if field in item and item[field]:
                    score += 1
                else:
                    feedback.append(f"缺少字段: {field}")
            
            # 2. 数据值合理性 (0.001-1000000)
            try:
                num = float(item.get("number", "0").replace(",", ""))
                if 0.001 <= num <= 1000000:
                    score += 1
                else:
                    feedback.append("数值范围异常")
            except:
                feedback.append("数值格式错误")
            
            # 3. 洞察深度检查 (包含"意味着"、"关键"、"方向"等)
            deep_words = ["意味着", "关键", "方向", "核心", "启示", "趋势", "拐点"]
            if any(word in item.get("insight", "") for word in deep_words):
                score += 1
            else:
                feedback.append("洞察深度不足")
            
            # 4. 实例相关性
            if any(word in item.get("context", "") for word in ["国家能源集团", "央企", "中国"]):
                score += 1
            
            # 5. 分类统计
            category = item.get("category", "未知")
            category_count[category] = category_count.get(category, 0) + 1
            
            quality_score += score
            
            if score < 6:
                print(f"  ⚠️  数据{i}: 得分{score}/8 - {item.get('topic', '未知')}")
                for fb in feedback:
                    print(f"     - {fb}")
        
        avg_score = quality_score / len(data_items)
        print(f"\n✅ 平均质量得分: {avg_score:.2f}/8")
        print(f"分类分布: {len(category_count)} 个类别")
        for cat, count in sorted(category_count.items(), key=lambda x: x[1], reverse=True)[:10]:
            print(f"  - {cat}: {count}条")
        
        return avg_score
    
    def run_full_validation(self):
        """运行完整验证"""
        print("=" * 60)
        print("数据质量验证报告")
        print("=" * 60)
        
        results = {}
        
        # 验证问题数据
        for batch_file in self.data_dir.glob("pool-questions-batch*.json"):
            score = self.validate_questions(batch_file)
            results[batch_file.name] = score
        
        # 验证关键词数据
        for batch_file in self.data_dir.glob("pool-keywords-batch*.json"):
            score = self.validate_keywords(batch_file)
            results[batch_file.name] = score
        
        # 验证数据洞察
        for batch_file in self.data_dir.glob("pool-data-batch*.json"):
            score = self.validate_data_items(batch_file)
            results[batch_file.name] = score
        
        print("\n" + "=" * 60)
        print("总结报告")
        print("=" * 60)
        
        for filename, score in results.items():
            print(f"{filename}: {score:.2f}分")
        
        avg_total = sum(results.values()) / len(results)
        print(f"\n🎯 总体平均分: {avg_total:.2f}")
        
        if avg_total >= 4.5:
            print("🌟 综合评级: 优秀 - 可直接用于生产环境")
        elif avg_total >= 4.0:
            print("👍 综合评级: 良好 - 建议小范围优化")
        elif avg_total >= 3.5:
            print("⚠️  综合评级: 合格 - 需要针对性改进")
        else:
            print("❌ 综合评级: 不合格 - 需要重新生成")

if __name__ == "__main__":
    validator = DataValidator()
    validator.run_full_validation()
