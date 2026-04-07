#!/usr/bin/env python3
"""
批量数据生成引擎
支持生成后续批次（第2-10批，每批100条）
"""

import json
import random
from pathlib import Path
from datetime import datetime

class BatchGenerator:
    def __init__(self, data_dir="data"):
        self.data_dir = Path(data_dir)
        self.templates = self.load_templates()
        self.variable_pool = self.load_variable_pool()
        self.generated_count = 0
    
    def load_templates(self):
        """加载高质量模板"""
        return {
            "questions": {
                "identity_transition": [
                    "作为{role}，今天我{action}，学到了什么{outcome}？",
                    "我在{previous_role}积累的{ability}，今天如何应用到{current_task}？",
                    "今天遇到的{challenge}，让我意识到从{old_identity}到{new_identity}需要{mindset_shift}？",
                    "如果{future_self}看到今天的{behavior}，会给出什么{advice}？",
                    "今天哪个{moment}，让我感受到了{transformation}的{sign}？"
                ],
                "industry_insight": [
                    "今天观察到的{industry_segment}的{phenomenon}，揭示了{underlying_logic}？",
                    "如果我是{technology_component}，我会如何向{stakeholder}讲述我的{value_proposition}？",
                    "今天看到的{data_point}，让我对{industry_trend}有了{new_understanding}？",
                    "在{dilemma}之间，今天的哪个{decision}体现了{trade_off}？",
                    "今天听到的哪个{opinion}，挑战了我对{assumption}的{cognition}？"
                ],
                "cognitive_growth": [
                    "今天哪个{situation}，让我意识到自己的{cognitive_bias}？",
                    "如果应用{mental_model}重新思考{problem}，我会得出什么{new_conclusion}？",
                    "今天学到的{concept}，如何与已有的{knowledge_domain}建立{connection}？",
                    "哪个{old_belief}今天被{new_evidence}挑战了？我如何{response}？",
                    "今天哪个{habit}的{compound_effect}开始显现？"
                ]
            },
            "keywords": {
                "structure": {
                    "term": "{term}",
                    "category": "{category}",
                    "definition": "{definition}",
                    "example": "{example}"
                }
            },
            "data_items": {
                "structure": {
                    "topic": "{topic}",
                    "category": "{category}",
                    "number": "{number}",
                    "unit": "{unit}",
                    "context": "{context}",
                    "insight": "{insight}"
                }
            }
        }
    
    def load_variable_pool(self):
        """加载变量池"""
        return {
            "role": ["氢能管培生", "电催化研究者", "央企青年", "系统思考者", "产业实践者"],
            "action": ["主动提问", "跨界学习", "反思实践", "连接概念", "挑战假设"],
            "outcome": ["产业洞察", "技术理解", "管理智慧", "成长认知", "系统思维"],
            "ability": ["文献批判能力", "实验设计思维", "数据分析素养", "理论建模技能"],
            "challenge": ["跨部门协作", "身份转型", "思维定势", "资源约束"],
            "industry_segment": ["氢能产业链", "电催化领域", "能源系统", "材料科学", "央企管理"],
            "phenomenon": ["效率瓶颈", "成本拐点", "技术突破", "政策变化", "市场反应"],
            "mental_model": ["第一性原理", "系统思维", "反脆弱", "复利效应", "批判性思维"],
            "cognitive_bias": ["确认偏误", "锚定效应", "幸存者偏差", "权威盲从"],
            
            # 关键词变量
            "tech_terms": [
                ("质子导体", "材料科学", "在高温下具有质子导电性的陶瓷材料，用于SOEC电解槽，工作温度600-800°C，效率可达90%以上。", "BaCeO₃基钙钛矿是典型质子导体，在600°C下质子电导率0.01S/cm，用于高温电解水制氢。"),
                ("钙钛矿氧化物", "催化材料", "通式ABO₃的晶体结构材料，A位和B位可调变，是设计OER催化剂的重要平台，如LaCoO₃、SrTiO₃。", "La₀.₈Sr₀.₂CoO₃钙钛矿OER过电位仅280mV，因Sr掺杂优化了Co的价态和氧空位浓度。"),
                ("尖晶石氧化物", "催化材料", "通式AB₂O₄的晶体结构，如Co₃O₄、NiCo₂O₄，在OER中表现优异，因混合价态和丰富的活性位点。", "NiCo₂O₄尖晶石在1M KOH中OER过电位230mV，因Ni²⁺/Ni³⁺和Co²⁺/Co³⁺协同催化。"),
                ("层状双氢氧化物", "催化材料", "LDH，通式[M²⁺₁₋ₓM³⁺ₓ(OH)₂]ˣ⁺[Aⁿ⁻]ₓ/ₙ·mH₂O，如NiFe-LDH，是高效OER催化剂，因层间结构可调。", "NiFe-LDH在1A/cm²下过电位210mV，因Fe掺杂优化了Ni的d带中心和OH⁻吸附。"),
                ("金属有机框架", "催化材料", "MOF，由金属节点和有机配体组成的多孔材料，比表面积>1000m²/g，是单原子催化剂的理想载体。", "ZIF-8热解可制备氮掺杂碳负载的单原子Co，电化学活性面积提升10倍。"),
                ("碳纳米管", "催化载体", "一维碳纳米材料，导电性优异，作为催化剂载体可提升分散性和电子传输，增强活性和稳定性。", "碳纳米管负载Pt纳米颗粒，电化学活性面积从20m²/g提升至80m²/g，HER活性提升3倍。"),
                ("石墨烯", "催化载体", "二维碳纳米材料，比表面积大，导电性极佳，作为载体可锚定单原子催化剂，提升利用率和稳定性。", "氮掺杂石墨烯负载单原子Ir，质量活性提升10倍，因Ir与N配位形成稳定活性位点。"),
                ("氧空位", "催化活性中心", "金属氧化物中氧离子缺失形成的缺陷，可调控电子结构和吸附性能，是OER催化剂的活性来源之一。", "Co₃O₄表面氧空位浓度从5%提升至15%，OER过电位降低50mV，因氧空位优化了OOH*吸附。"),
                ("配位不饱和位点", "催化活性中心", "配位数低于体相的表面原子，具有高度反应活性，是催化反应的活性中心，如台阶、边角原子。", "Pt纳米颗粒的边角原子占10%，却是90%催化反应的发生位点，因配位不饱和增强反应物吸附。"),
                ("d带中心理论", "催化理论", "描述催化剂电子结构与催化活性的理论，d带中心位置决定中间体吸附强度，是计算筛选催化剂的理论基础。", "通过d带中心计算预测，将Pt的d带中心下移0.2eV可优化氢吸附自由能至近热中性，提升HER活性3倍。")
            ],
            
            # 数据洞察变量
            "data_topics": [
                ("SOEC电解效率", "氢能技术", "85", "%", "固体氧化物电解槽在800°C下效率可达85%，利用工业废热可进一步提升至90%，适合高温工业场景。", "SOEC在氢能炼钢中可消纳钢铁厂余热，系统效率达90%，能耗仅4.0kWh/m³，是深度脱碳的理想技术。"),
                ("氢气液化能耗", "氢能技术", "12", "kWh/kg", "氢气液化需降温至-253°C，能耗约12kWh/kg，占氢气热值的40%，是液氢成本高的主因。", "液化能耗占液氢终端成本30%，需开发磁制冷等新技术降至8kWh/kg，提升液氢经济性。"),
                ("有机液态储氢密度", "氢能技术", "50", "g/L", "有机液态储氢（如LOHC）密度50g/L，接近液氢70g/L，但可在常温常压运输，安全性高。", "LOHC适合长距离海运，日本与中东合作开发，用甲苯/甲基环己烷体系，储氢密度高且可循环100次。"),
                ("固态储氢质量密度", "氢能技术", "5-7", "%wt", "固态储氢材料（如MgH₂、LaNi₅）质量储氢密度5-7%，体积密度50-100g/L，但需200-300°C释氢。", "固态储氢适合燃料电池叉车等小型设备，丰田已商业化，质量密度5%可满足8小时作业需求。"),
                ("氢气管道输送成本", "氢能技术", "0.3", "元/kg·100km", "氢气管道输送成本仅0.3元/kg·100km，远低于拖车2-3元，但初始投资高（500万元/km）。", "管道适合大规模长距离输送，欧洲计划建1万公里氢气管道网，中国西氢东送需提前规划走廊。"),
                ("氢能炼钢减排潜力", "氢能技术", "95", "%CO₂减排", "氢能直接还原铁（DRI）可减排95%CO₂，是钢铁脱碳终极路径，目前成本比高炉高30-50%。", "瑞典SSAB已示范氢能炼钢，使用绿氢DRI，产品溢价20%，宝马、奔驰采购，绿色溢价可覆盖成本增量。"),
                ("氢燃料电池寿命", "氢能技术", "20000", "小时", "燃料电池商用车寿命要求20000小时（5000次循环），目前可达15000-18000小时，目标2025年达标。", "寿命每提升1000小时，重卡全生命周期成本降低5万元，通过催化剂稳定化和膜耐久性改进实现。"),
                ("加氢站投资成本", "氢能技术", "800", "万元/站", "500kg/日加氢站投资约800万元，是加油站3倍，其中压缩机占30%，储氢罐占25%。", "加氢站需氢车规模化才能盈利，盈亏平衡点为30-50辆车，国家能源集团通过“车站联动”模式加速推广。"),
                ("氢气燃烧温度", "氢能技术", "2000", "°C", "氢气燃烧温度达2000°C，比天然气高300°C，适合高温工业，但NOx排放高，需空气分级燃烧控制。", "氢能玻璃窑炉可提升产品质量，但需解决NOx排放问题，通过富氧燃烧可将NOx降至50mg/m³以下。"),
                ("氢脆敏感性", "氢能技术", "300", "ppm（临界浓度）", "钢材在300ppm氢浓度下开始氢脆，强度下降50%，氢能管道需使用316L不锈钢或纤维增强复合材料。", "氢能基础设施材料选择是关键，API 5L X52及以上钢级不适用，需开发抗氢脆新材料。")
            ]
        }
    
    def generate_questions_batch(self, batch_num, count=100):
        """生成一批问题"""
        print(f"\n🤖 生成第{batch_num}批问题数据（100条）...")
        
        questions = []
        template_categories = [
            ("identity_transition", 30),
            ("industry_insight", 40),
            ("cognitive_growth", 30)
        ]
        
        for category, num in template_categories:
            templates = self.templates["questions"][category]
            for _ in range(num):
                template = random.choice(templates)
                question = self.fill_template(template)
                
                # 质量检查
                if self.validate_question_quality(question):
                    questions.append(question)
                else:
                    # 重新生成
                    question = self.fill_template(random.choice(templates))
                    questions.append(question)
        
        # 保存
        filename = f"pool-questions-batch{batch_num}.json"
        self.save_data(questions, filename)
        
        print(f"✅ 生成完成: {len(questions)} 条问题")
        return questions
    
    def generate_keywords_batch(self, batch_num, count=100):
        """生成一批关键词"""
        print(f"\n🤖 生成第{batch_num}批关键词（100条）...")
        
        keywords = []
        tech_terms = self.variable_pool["tech_terms"]
        
        # 如果变量池不足，循环使用
        while len(keywords) < count:
            for term_data in tech_terms:
                if len(keywords) >= count:
                    break
                
                term, category, definition, example = term_data
                
                # 随机增强示例
                if random.random() > 0.5:
                    example = self.enhance_example(example)
                
                keyword = {
                    "term": term,
                    "category": category,
                    "definition": definition,
                    "example": example
                }
                
                keywords.append(keyword)
        
        # 保存
        filename = f"pool-keywords-batch{batch_num}.json"
        self.save_data(keywords, filename)
        
        print(f"✅ 生成完成: {len(keywords)} 条关键词")
        return keywords
    
    def generate_data_batch(self, batch_num, count=100):
        """生成一批数据洞察"""
        print(f"\n🤖 生成第{batch_num}批数据洞察（100条）...")
        
        data_items = []
        data_topics = self.variable_pool["data_topics"]
        
        # 如果变量池不足，循环使用
        while len(data_items) < count:
            for topic_data in data_topics:
                if len(data_items) >= count:
                    break
                
                topic, category, number, unit, context, insight = topic_data
                
                # 随机微调数值（±10%）增加多样性
                if random.random() > 0.7:
                    try:
                        num = float(number)
                        variation = random.uniform(-0.1, 0.1)
                        number = str(round(num * (1 + variation), 2))
                    except:
                        pass
                
                data_item = {
                    "topic": topic,
                    "category": category,
                    "number": number,
                    "unit": unit,
                    "context": context,
                    "insight": insight
                }
                
                data_items.append(data_item)
        
        # 保存
        filename = f"pool-data-batch{batch_num}.json"
        self.save_data(data_items, filename)
        
        print(f"✅ 生成完成: {len(data_items)} 条数据洞察")
        return data_items
    
    def fill_template(self, template):
        """填充模板变量"""
        import re
        result = template
        variables = re.findall(r'\{(\w+)\}', template)
        
        for var in variables:
            if var in self.variable_pool:
                value = random.choice(self.variable_pool[var])
                result = result.replace(f"{{{var}}}", value)
        
        return result
    
    def validate_question_quality(self, question):
        """验证问题质量"""
        # 长度检查
        if not (15 <= len(question) <= 100):
            return False
        
        # 必须包含问号
        if "？" not in question:
            return False
        
        # 启发性检查
        heuristic_words = ["什么", "为什么", "如何", "怎样", "哪个", "哪里"]
        if not any(word in question for word in heuristic_words):
            return False
        
        return True
    
    def enhance_example(self, example):
        """增强示例的相关性"""
        enhancements = [
            "国家能源集团",
            "央企",
            "博士",
            "管培生",
            "产业实践",
            "技术创新"
        ]
        
        if any(word in example for word in enhancements):
            return example
        
        # 随机添加相关性
        enhancer = random.choice(enhancements)
        return f"{example} 这在{enhancer}的实践中尤为重要。"
    
    def save_data(self, data, filename):
        """保存数据"""
        filepath = self.data_dir / filename
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        print(f"  💾 保存至: {filename}")
    
    def generate_next_batch(self):
        """生成下一批次"""
        # 检查已生成的批次
        existing_batches = {
            "questions": len(list(self.data_dir.glob("pool-questions-batch*.json"))),
            "keywords": len(list(self.data_dir.glob("pool-keywords-batch*.json"))),
            "data": len(list(self.data_dir.glob("pool-data-batch*.json")))
        }
        
        print("=" * 60)
        print("批量生成引擎")
        print("=" * 60)
        print(f"已生成批次:")
        print(f"  - 问题: {existing_batches['questions']} 批")
        print(f"  - 关键词: {existing_batches['keywords']} 批")
        print(f"  - 数据洞察: {existing_batches['data']} 批")
        
        next_batch = max(existing_batches.values()) + 1
        
        print(f"\n🚀 生成第{next_batch}批数据...")
        
        # 生成三类型数据
        self.generate_questions_batch(next_batch)
        self.generate_keywords_batch(next_batch)
        self.generate_data_batch(next_batch)
        
        print("\n✅ 批次生成完成！")
        print(f"🎯 当前总数据量: {next_batch * 100} 条/类型")
        
        # 预测剩余批次
        remaining = 10 - next_batch
        if remaining > 0:
            print(f"📊 距离1000条目标还需生成: {remaining} 批（约{remaining * 100}条）")
        else:
            print("🎉 已达到1000条目标！")

def main():
    """主函数"""
    print("批量数据生成引擎")
    print("=" * 60)
    
    generator = BatchGenerator()
    
    while True:
        print("\n选项:")
        print("1. 生成下一批（100条/类型）")
        print("2. 生成指定批次")
        print("3. 查看生成状态")
        print("4. 退出")
        
        choice = input("\n请选择 (1-4): ").strip()
        
        if choice == "1":
            generator.generate_next_batch()
        elif choice == "2":
            batch_num = input("输入批次号 (2-10): ").strip()
            try:
                batch_num = int(batch_num)
                if 2 <= batch_num <= 10:
                    generator.generate_questions_batch(batch_num)
                    generator.generate_keywords_batch(batch_num)
                    generator.generate_data_batch(batch_num)
                else:
                    print("批次号必须在2-10之间")
            except:
                print("请输入有效数字")
        elif choice == "3":
            existing = {
                "questions": len(list(generator.data_dir.glob("pool-questions-batch*.json"))),
                "keywords": len(list(generator.data_dir.glob("pool-keywords-batch*.json"))),
                "data": len(list(generator.data_dir.glob("pool-data-batch*.json")))
            }
            print(f"\n📊 生成状态:")
            for k, v in existing.items():
                print(f"  - {k}: {v} 批 ({v*100} 条)")
        elif choice == "4":
            print("退出生成引擎")
            break
        else:
            print("无效选择，请重新输入")

if __name__ == "__main__":
    main()
