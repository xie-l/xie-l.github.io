# 科研主页运行维护

## 发布与运行监控
- Pages 发布源应为 Settings > Pages > Build and deployment > Source > GitHub Actions。自定义发布任务先检查实际模式，未切换时跳过，避免两套发布机制争抢。
- Deploy Public Pages：人工提交涉及网站内容、资源、部署配置时触发；后台采集使用 GITHUB_TOKEN 提交的数据由每3小时（UTC 00:43、03:43、06:43、09:43、12:43、15:43、18:43、21:43）的补偿发布覆盖，也可手动运行。GitHub 定时执行可能延迟。不再为每个采集任务单独触发部署。
- 单一并发组，不中断正在发布的任务；发布完成后检查线上首页及 deployment.json 的实际提交 SHA。
- /deployment.json 记录真实发布版本；首页监控读取 main 的数据并显示过期/缺失状态。
- Site Health and Alerts 每天北京时间12:51巡检；修改巡检配置、独立语法检查器或发布配置时追加一次验证，也可手动运行。数据异常以 CHECK / needs_attention 记录；程序实际执行失败才报错。报告保留14天。
- SMTP 默认关闭以避免重复邮件；若确需直接发送，设置仓库变量 ENABLE_SMTP_ALERTS=true 及 Secrets ALERT_SMTP_HOST、ALERT_SMTP_USER、ALERT_SMTP_PASSWORD、ALERT_EMAIL_TO。只在定时巡检发送，不在代码推送时发送；建议只保留一个告警渠道。

## 数据与隐私
- 微信读书 Cookie 无效、接口不可用或书架为空时标记待恢复，不覆盖历史有效数据；公开阅读内容前确认隐私范围。
- 学术统计由所有者核对 Semantic Scholar 作者 ID 后设置仓库变量 SEMANTIC_SCHOLAR_AUTHOR_ID；未确认时不更新同名作者数据。
- Obsidian 缺少已批准公开的同步输入时跳过；不要将私人笔记原始库上传到公开仓库。
- 本仓库公开。Pages 排除目录及 robots.txt 不是访问控制；内部资料、私人笔记及密钥须置于独立私有仓库。备份保留在 Actions artifact；旧 Git 历史仍存在，涉及已公开秘密须先撤销或轮换。
