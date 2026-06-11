# Netlify 部署说明

## 推荐方式：GitHub 连接 Netlify

1. 把本项目上传到 GitHub。
2. 打开 Netlify，选择 **Add new site** -> **Import an existing project**。
3. 选择你的 GitHub 仓库。
4. 构建设置填写：
   - Build command: `npm run build`
   - Publish directory: `.next`
   - Base directory: 如果仓库根目录就是本项目，留空；如果仓库根目录是 `NICK`，填 `worldcup-market-cn/app`
5. 点击 Deploy。

## 本项目已经准备好的配置

- `netlify.toml` 已设置构建命令、发布目录和 Node 版本。
- `.npmrc` 已设置 `legacy-peer-deps=true`，避免 Netlify 安装 React 19 依赖时报错。
- 项目不需要数据库，默认可以直接静态/服务端混合部署。

## 常见问题

如果 Netlify 显示找不到 `package.json`，说明 Base directory 没填对。  
如果你的仓库结构是：

```text
worldcup-market-cn/
  app/
    package.json
```

Base directory 就填：

```text
worldcup-market-cn/app
```

如果部署后打开不是中文页，可以访问：

```text
/zh
```
