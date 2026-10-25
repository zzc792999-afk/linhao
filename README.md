# 25计算机1 · 班级网站

[在线共享留言版](https://class-25-computer-1-live.onrender.com/) 已上线；[原入口](https://zzc792999-afk.github.io/linhao/) 自动进入共享版，静态展示页保留在 /linhao/preview.html。

[部署共享留言版到 Render](https://render.com/deploy?repo=https%3A%2F%2Fgithub.com%2Fzzc792999-afk%2Flinhao)

## 接通共享留言

数据库已建表并经过真实读写验证。默认 render.yaml 为 Render Free Node 服务，不创建付费磁盘或数据库。

1. 在 Neon 已领取的数据库项目中点击 Connect，复制新的 PostgreSQL 连接字符串，保留 sslmode 等参数。
2. 打开上方 Render 部署入口。在 DATABASE_URL 中填写连接字符串，确认 Plan 为 Free，然后创建部署。
3. 等待 Live 后，通过 Render 提供的 https://…onrender.com 网址访问共享留言版。
4. 电脑发留言、手机访问同一 Render 网址，确认同步。

连接字符串包含密码，只填写到 Render 的环境变量中，不要提交到 GitHub。

GitHub Pages 入口跳转至 Render Node 服务。Node 服务已启用共享模式；数据库连接通过 Render Secret File 配置，未写入源码或浏览器。

render-preview.yaml 保留无数据库的 Render 静态站配置。更多后端说明见 README-DATABASE.md。

## 本地运行与验证

Node.js 24，首次运行 npm ci，然后 npm start，访问 http://localhost:3000。
配置本机 .env 中的 DATABASE_URL 可以连接远程 PostgreSQL；没有该变量时仅在本地使用 SQLite。

npm test 验证 API、共享读取、删除权限、点赞和本地重启持久化。
npm run db:check 验证真实数据库，并自动清理测试数据。

public/ 是网站源码；docs/ 是 GitHub Pages 展示副本。

## V4 班级事务台

正式站首页新增通知、作业待办、活动日程和学习资料，支持搜索、七天事项筛选、个人完成标记及活动日历导出；旁边提供编程学习入口和可恢复的专注计时器。
班务由原 `/admin` 后台统一发布、编辑、置顶和归档，不需要新账号或付费服务。作业勾选按浏览器保存，只做个人自查。
首次部署前执行 `npm run db:migrate-desk`；详细保存规则和测试范围见 README-DATABASE.md 的 V4.0 章节。

## V4.1 课间游乐厅

首页主入口调整为 `/#arcade`：八位吉祥物由全班共同投喂升级、每日收集贴纸；三轮反应挑战保留浏览器最好成绩，加入班级趣味榜；你画我猜支持服务器出词、自由作画和跨浏览器猜画。
班务与学习工具收进页面底部的折叠区，旧入口和记录保留。原管理后台新增猜画与趣味榜内容管理。
首次部署前运行 `npm run db:migrate-arcade`，只新增游戏表。没有新依赖或付费服务，原照片、留言、视频、胶囊和涂鸦继续可用。

## Neon 开发工具

项目已安装 neon、neon-postgres 技能（.agents/skills）和项目 OAuth MCP 配置（.codex/config.toml），服务地址固定到本项目，不包含 API key。
.neon 为本机项目关联，由 .gitignore 排除；skills-lock.json 记录技能来源与校验信息。

V4.1.1 新增第八位吉祥物“小丑先生”👦，支持投喂养成、每日贴纸和头像选择。

V4.1.2 小丑先生改为原创黑发、红鼻尖、微笑的人物卡通头像，统一用于展示卡片、投喂、贴纸、头像预览和趣味榜；沿用 rednose 标识，不重置已有成长和投喂记录。
