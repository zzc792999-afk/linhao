# 25计算机1 · Render 部署版

版本：2.0。保留原来的页面风格，新增 Node.js 服务端、SQLite 持久化、全班共享留言及点赞。

## 本地打开

1. 安装 Node.js 24。
2. 在这个文件夹打开终端，运行 `npm start`（或双击 `启动网站.bat`）。
3. 浏览器访问 http://localhost:3000 。停止服务按 Ctrl+C。

没有第三方运行依赖。不要双击 public/index.html 使用共享功能，它需要服务器。
本地运行时，数据库自动生成在 data/class.db。data 目录不要上传到公开仓库。

## 部署到 Render（推荐 Blueprint）

本项目已附 render.yaml。它会创建付费 Starter Web Service 和 1GB 持久磁盘；具体费用以 Render 创建时显示为准，本项目没有替你开通服务。

1. 在 GitHub 新建一个仓库（可以使用私有仓库），把本文件夹的内容上传到仓库根目录。必须包含 package.json、package-lock.json、server.js、render.yaml、.node-version 和整个 public 文件夹。
2. 在 Render 中选择 New → Blueprint，连接该仓库，按页面提示应用 render.yaml。应用前确认页面显示的服务和磁盘费用。
3. 等待部署状态变为 Live，打开 Render 给你的 https://…onrender.com 地址。
4. 用电脑发一条留言，再用手机打开同一网址。最多约 15 秒自动同步，刷新也会立即读取。
5. 做一次 Restart 或重新部署，确认测试留言仍然存在，然后删除该测试留言。

这是有后端的项目，必须选 Web Service，不要选 Static Site。

## 手动创建 Web Service

- Runtime：Node
- Node 版本：24（仓库中的 .node-version 已指定）
- Root Directory：留空（如果项目位于仓库子目录，填写该子目录）
- Build Command：npm ci --omit=dev
- Start Command：npm start
- Health Check Path：/healthz
- Instance：选择支持持久磁盘的付费实例
- 环境变量 NODE_ENV=production
- 环境变量 DATA_DIR=/var/data
- 添加 Persistent Disk，Mount Path=/var/data，Size=1GB
- PORT 由 Render 提供，代码自动读取，不要自行固定为 3000

Render 默认文件系统是临时的。DATA_DIR 必须与实际挂载的持久磁盘路径一致，只配置环境变量并不能代替添加磁盘。Render Free Web Service 不支持持久磁盘；不要删除磁盘后用这套 SQLite 配置上线，否则数据可能随重启丢失。如果坚持免费 Web Service，需要另接持久的外部数据库，并修改后端适配。

官方参考：
- https://render.com/docs/disks
- https://render.com/docs/free
- https://render.com/docs/blueprint-spec

## 共享范围和使用规则

- 留言与点赞存在服务端 SQLite，访问同一个部署网址的设备共享数据。
- 页面每 15 秒读取最新状态；留言列表展示最新 200 条，较早留言仍保留在数据库。
- 昵称最长 16 字，留言最长 200 字；同一浏览器发布留言间隔至少 10 秒。
- 页面只显示当前浏览器发布留言的删除按钮，服务端也会校验权限。
- 身份通过 HttpOnly Cookie 区分，没有账号登录。清理 Cookie、换浏览器或换设备后不能删除原浏览器发布的留言；点赞也按浏览器而非实名人数计算。
- 未登录的访客可以读取、留言、点赞；当前没有管理员后台和人工审核流程。
- 添加照片功能仍为本地临时预览，不会上传服务器，也不会同步。固定班级照片在 public/assets 中，更换对应文件后重新部署即可。
- 浅色/深色主题与昵称偏好仍保存在当前浏览器。
- 原版保存在本地浏览器里的留言不会自动上传，需在新版页面重新发布。

## 数据备份与运维

持久磁盘仅支持单实例；保持服务为一个实例。Render 会提供磁盘快照能力，重要留言仍应定期保留独立备份。SQLite 运行时不要只复制 class.db 文件而忽略 WAL；使用 SQLite backup API/命令制作一致备份，或者停止服务后复制完整数据目录。不要将数据库放进 public 或提交到 GitHub。

## 验证

运行 `npm test`：测试独立浏览器共享读取、重复点赞、删除权限、输入验证、跨站请求拒绝、私有文件隔离以及服务重启后的数据保留。
运行 `node --check server.js` 和 `node --check public/app.js` 检查语法。

文件结构：
- public/：首页、样式、交互脚本与照片
- server.js：静态文件与 API 服务
- data/：运行后生成的数据库（不提交）
- render.yaml：Render Blueprint
- test/：接口测试
