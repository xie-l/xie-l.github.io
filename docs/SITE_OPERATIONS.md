# 科研主页运行维护
- Pages: Settings > Pages > Build and deployment > Source 选择 GitHub Actions；Deploy Public Pages 支持推送、采集成功和每3小时补偿发布。先确认部署成功再停用旧机制。
- /deployment.json 标识真实发布版本；首页监控同时读取 main 的数据并显示过期/缺失状态，不能代替后台运行日志。
- Site Health and Alerts 每天北京时间 09:51 运行，也可手动运行。检测到问题时工作流失败并记录摘要，GitHub 通知是否发邮件取决于账号设置。
- 如需直接 SMTP 邮件：在 Settings > Secrets and variables > Actions 配置 ALERT_SMTP_HOST、ALERT_SMTP_USER、ALERT_SMTP_PASSWORD（邮箱授权码）、ALERT_EMAIL_TO，使用支持 SSL 465 端口的邮箱。不要将授权码写入仓库。配置后手动运行并确认收到邮件。
- WeRead Cookie 无效或书架为空会失败，不覆盖上次有效数据。公开阅读内容前应确认隐私范围。
- 本仓库公开；Pages 排除目录和 robots.txt 不是访问控制。禁止上传内部资料、私人笔记或密钥；将私有原始资料保存在独立私有仓库。
- 学术统计需要由所有者核对 Semantic Scholar 作者 ID 后设置仓库变量 SEMANTIC_SCHOLAR_AUTHOR_ID。未确认身份时不自动将同名作者数据写入。
- 备份保留在 Actions artifact；旧 Git 历史仍然存在。涉及已公开秘密时应先撤销或轮换，再评估历史清理。


## 2026-11-24 告警降噪调整
- 自定义 Pages 发布每3小时定时运行或手动触发，取消每次 push / collector 完成的重复触发。当前仍需在 Settings > Pages 将 Source 切为 GitHub Actions，避免 legacy 分支发布与自定义发布并行。
- Site Health and Alerts 改为北京时间12:51每日巡检；仅修改巡检工作流或独立语法校验器触发一次额外校验。巡检报告用 CHECK / needs_attention 表示数据或授权异常；脚本、语法、执行本身出错才报运行失败。报告保留14天。
- 微信读书、学术、Obsidian 的可预期授权或输入缺失均明确记录待恢复，不覆盖历史数据，不把缺失当作成功采集。独立每日监控继续检查实际数据。
- SMTP 默认关闭以避免重复邮件；确需 GitHub SMTP 时设置仓库变量 ENABLE_SMTP_ALERTS=true 并配置对应 Secrets；只在定时巡检发送，不在代码推送时发送。
