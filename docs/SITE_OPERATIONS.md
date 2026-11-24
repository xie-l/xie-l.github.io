# 科研主页运行维护
- Pages: Settings > Pages > Build and deployment > Source 选择 GitHub Actions；Deploy Public Pages 支持推送、采集成功和每3小时补偿发布。先确认部署成功再停用旧机制。
- /deployment.json 标识真实发布版本；首页监控同时读取 main 的数据并显示过期/缺失状态，不能代替后台运行日志。
- Site Health and Alerts 每天北京时间 09:51 运行，也可手动运行。检测到问题时工作流失败并记录摘要，GitHub 通知是否发邮件取决于账号设置。
- 如需直接 SMTP 邮件：在 Settings > Secrets and variables > Actions 配置 ALERT_SMTP_HOST、ALERT_SMTP_USER、ALERT_SMTP_PASSWORD（邮箱授权码）、ALERT_EMAIL_TO，使用支持 SSL 465 端口的邮箱。不要将授权码写入仓库。配置后手动运行并确认收到邮件。
- WeRead Cookie 无效或书架为空会失败，不覆盖上次有效数据。公开阅读内容前应确认隐私范围。
- 本仓库公开；Pages 排除目录和 robots.txt 不是访问控制。禁止上传内部资料、私人笔记或密钥；将私有原始资料保存在独立私有仓库。
- 学术统计需要由所有者核对 Semantic Scholar 作者 ID 后设置仓库变量 SEMANTIC_SCHOLAR_AUTHOR_ID。未确认身份时不自动将同名作者数据写入。
- 备份保留在 Actions artifact；旧 Git 历史仍然存在。涉及已公开秘密时应先撤销或轮换，再评估历史清理。
