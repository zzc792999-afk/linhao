# 25计算机1 · 网站展示版

当前优先展示网站，不需要数据库，也不需要配置任何环境变量。

## 立即查看

直接双击 public/index.html，即可查看完整页面。照片放大、主题切换、当前设备点赞和本地照片预览可用。留言区暂未开放。

## Render 免费静态部署

[打开部署页面](https://render.com/deploy?repo=https%3A%2F%2Fgithub.com%2Fzzc792999-afk%2Flinhao)

render.yaml 已改为 Static Site，发布 public 目录，没有付费磁盘、后端服务或数据库。

也可以在 Render 选择 New → Static Site，连接本仓库：
- Branch：main
- Build Command：echo "Static site ready"
- Publish Directory：public

确认创建后，等状态变为 Live，即可通过 Render 给出的网址访问。
若打开的是之前的旧 Blueprint 配置，请重新打开上方部署链接以读取当前配置。

## GitHub Pages

用于即时在线预览的文件位于 docs 目录，与 public 一致。Pages 发布源为 main 分支的 /docs。

## 以后启用共享留言

后端代码和测试仍保留在仓库中。数据库部署说明见 README-DATABASE.md，配置见 render-database.yaml。
接入外部数据库后，用 render-database.yaml 部署 Node 服务；Node 服务会自动启用共享模式，静态 public/docs 继续提供展示版。

## 本地源文件

public/index.html：首页
public/style.css：样式
public/app.js：交互
public/assets/：三张照片

点赞在展示版中仅保存在本设备；添加的照片仅在本次页面打开期间展示。

## 数据库连接验证

在本机 .env 中配置 DATABASE_URL 后运行 npm run db:check，检查数据库建表、读写、跨设备读取、删除权限和点赞，并自动清理测试数据。npm start 会自动读取这个不提交到仓库的 .env。

Claimable Neon 数据库需要在领取前完成保留手续；未领取项目会在 72 小时后过期。领取流程会轮换连接密码，领取后请在 Neon 的 Connect 中获取新的 DATABASE_URL，并填写到 Render 环境变量。不要继续使用领取前的旧连接信息。