# 25计算机1 · Render 免费部署版

版本 3.0。网站部署在 Render Free Web Service，留言和点赞存到独立 Neon Free PostgreSQL，不需要付费磁盘。数据库版本的 render-database.yaml 已指定 plan: free；默认 render.yaml 为静态展示版。

[开始 Render 部署](https://render.com/deploy?repo=https%3A%2F%2Fgithub.com%2Fzzc792999-afk%2Flinhao)

## 1. 创建 Neon 免费数据库

1. 打开 https://console.neon.tech ，可以使用 GitHub 注册或登录。
2. 保持 Free 免费计划，创建项目，例如 class-2501；选择靠近 Render 服务的区域。
3. 点击 Connect，复制 PostgreSQL 连接字符串（以 postgresql:// 开头）。保留原有的 sslmode=require 等参数，可以使用 pooled connection。
4. 连接字符串包含密码，只填写在 Render 的 DATABASE_URL 环境变量中。不要上传到 GitHub，不要放入 public，也不需要在聊天中发送。

本项目启动时会自动建表，无需手动运行 SQL。当前未配置远程数据库时，不能宣称网站已上线或留言已同步。

## 2. 在 Render 免费部署

1. 关闭此前要求绑卡的付费配置页面，打开上面的“开始 Render 部署”链接，读取最新 main 分支配置。
2. 在 Blueprint 的 Blueprint Path 字段填写 render-database.yaml，然后确认服务 Plan 为 Free，并且没有 Persistent Disk、付费数据库或其他付费资源。
3. 在 DATABASE_URL 输入框中粘贴 Neon 连接字符串，再确认创建。
4. 等待状态变为 Live，使用 Render 提供的 https://…onrender.com 地址访问。
5. 用电脑发一条留言，手机打开同一网址检查。再做一次 Restart，确认留言仍保留。

如果 Blueprint 页面仍要求付款，可取消，然后从 Render 的 New → Web Service 手动选择本仓库并按以下参数创建。免费资源有额度限制；若 Render 仍要求账户验证，需按实际账户要求处理，不要切换到付费计划。

手动创建参数：
- Runtime: Node
- Branch: main
- Root Directory: 留空
- Build Command: npm ci --omit=dev
- Start Command: npm start
- Instance Type: Free
- Health Check Path: /healthz
- 环境变量 NODE_ENV=production
- 环境变量 DATABASE_URL=从 Neon 复制的完整连接字符串
- 不添加磁盘，不创建 Render 数据库
- PORT 由 Render 提供，代码自动读取

## 免费额度与保存规则

按当前官方说明，Neon Free 无固定试用到期时间且无需信用卡，但有数据库容量、计算、流量等额度限制。Render 免费服务空闲 15 分钟后会休眠，下一次访问约需一分钟唤醒，每个工作区每月共享 750 免费实例小时。你已有的其他免费服务也可能消耗这个额度。

Render 的免费 PostgreSQL 会在 30 天后到期，因此这套配置使用 Neon。免费方案不保证永远可用或无上限，请保持免费计划并关注额度和服务通知。

- Render 重启、休眠和重新部署不会删除外部 Neon 数据库中的留言。
- 保持使用同一个 DATABASE_URL；删除 Neon 项目或数据库会删除数据。
- 定期通过数据库工具执行 pg_dump 做独立备份，免费计划的备份能力以提供方规则为准。

官方参考：
- https://render.com/docs/free
- https://neon.com/pricing
- https://neon.com/docs/get-started/connect-neon

## 本地预览

安装 Node.js 24，在文件夹运行 npm ci（只需首次或依赖变化时），再运行 npm start，访问 http://localhost:3000。
也可以双击“启动网站.bat”。本地未设置 DATABASE_URL 时，自动使用 data/class.db，便于离线预览；这份本地数据不会自动迁移到 Neon。

如需本地连接 Neon，可在终端通过环境变量设置 DATABASE_URL，不要把密码写进代码。线上 Render 缺少 DATABASE_URL 会直接拒绝启动，防止误用临时磁盘丢失留言。

## 功能与范围

- 全班共享留言和点赞；活跃页面每 30 秒同步，页面隐藏或空闲超过 2 分钟后暂停，操作后恢复。
- 显示最新 200 条留言，旧留言仍保存在数据库。
- 昵称限 16 字，留言限 200 字，同一浏览器每次发布需间隔至少 10 秒。
- 通过 HttpOnly Cookie 区分浏览器，只能删除当前浏览器发布的留言。清除 Cookie 或换设备会失去原留言的删除权限。
- 点赞按浏览器计算，没有实名账号；当前没有管理员后台或审核功能。
- 照片保存到同一 Neon 数据库的 photos 表（BYTEA），所有设备共享；JPG、PNG、WebP 原图不超过 15MB，浏览器及服务器自动压缩为最长边 1600px 的 JPEG，移除照片元数据。服务端接收不超过 8MB、解码不超过 4000 万像素、成品不超过 1MB。相册最多 200 张且总计不超过 100MB；满额拒绝新上传，不会覆盖旧照片。只有当前浏览器能删除自己上传的照片，清除 Cookie 后会失去删除权限。静态展示页不能上传。
- 原始照片位于 public/assets，更新文件后重新部署。

## 开发验证

运行 npm test：SQLite 重启持久化测试，以及使用 PGlite PostgreSQL 引擎的 API、共享、权限、重复点赞、冷却时间和模式重建测试。
PGlite 测试验证 PostgreSQL 查询逻辑；真实 Neon 网络连接、TLS、账号权限和 Render 启动仍需在配置真实数据库后验证。

运行 node --check server.js、node --check database.js 和 node --check public/app.js 进行语法检查。

主要文件：public/（网页）、server.js（服务）、database.js（存储适配）、render.yaml（免费部署配置）、test/（验证）。

## 已有数据库的本地验证

npm start 会读取本机 .env 的 DATABASE_URL，Node 服务会自动把首页切换到共享模式。静态发布的 public/docs 页面继续保持展示模式。
运行 npm run db:check 可对真实数据库执行读写和权限验证，检查完成后自动删除测试记录。
Claimable Neon 项目必须在过期前领取；领取后旧数据库密码会轮换，需要重新获取并设置 DATABASE_URL。