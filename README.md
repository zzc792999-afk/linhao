# 25计算机1 · 班级网站

[现有展示站](https://zzc792999-afk.github.io/linhao/) 可继续访问。

[部署共享留言版到 Render](https://render.com/deploy?repo=https%3A%2F%2Fgithub.com%2Fzzc792999-afk%2Flinhao)

## 接通共享留言

数据库已建表并经过真实读写验证。默认 render.yaml 为 Render Free Node 服务，不创建付费磁盘或数据库。

1. 在 Neon 已领取的数据库项目中点击 Connect，复制新的 PostgreSQL 连接字符串，保留 sslmode 等参数。
2. 打开上方 Render 部署入口。在 DATABASE_URL 中填写连接字符串，确认 Plan 为 Free，然后创建部署。
3. 等待 Live 后，通过 Render 提供的 https://…onrender.com 网址访问共享留言版。
4. 电脑发留言、手机访问同一 Render 网址，确认同步。

连接字符串包含密码，只填写到 Render 的环境变量中，不要提交到 GitHub。

当前 GitHub Pages 地址持续提供展示版，不包含后端。Render Node 服务会自动启用共享模式，部署完成后使用 Render 的新网址发布和查看留言。

render-preview.yaml 保留无数据库的 Render 静态站配置。更多后端说明见 README-DATABASE.md。

## 本地运行与验证

Node.js 24，首次运行 npm ci，然后 npm start，访问 http://localhost:3000。
配置本机 .env 中的 DATABASE_URL 可以连接远程 PostgreSQL；没有该变量时仅在本地使用 SQLite。

npm test 验证 API、共享读取、删除权限、点赞和本地重启持久化。
npm run db:check 验证真实数据库，并自动清理测试数据。

public/ 是网站源码；docs/ 是 GitHub Pages 展示副本。
