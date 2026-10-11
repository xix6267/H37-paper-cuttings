# 剪纸小家

以剪纸为主题的社区创课空间。

## 快速开始

需要安装 [Node.js](https://nodejs.org/)（v18 或更高版本）。

```bash
# 安装依赖（无需额外依赖，只需 Node.js）
# 构建网站
npm run build

# 本地预览（构建后在 dist 目录）
npx serve dist
```

## 项目结构

```
jianzhi-xiaojia/
├── content/courses/        课程内容（每节课一个文件夹）
│   └── 01-first-lesson/
│       ├── info.json       课程信息
│       ├── cover.jpg       课程样图
│       └── work1.jpg ...   学员作品照片
├── src/
│   ├── build.js            站点生成脚本
│   └── style.css           样式
├── .github/
│   ├── workflows/deploy.yml      自动构建部署
│   └── ISSUE_TEMPLATE/           作品提交表单
└── dist/                   构建输出（自动生成）
```

## 添加新课程

1. 在 `content/courses/` 下创建新文件夹（如 `03-third-lesson`）
2. 放入 `info.json`（参考已有课程格式）
3. 放入 `cover.jpg`（课程样图）和学员作品照片
4. 提交代码，网站自动重建

## 审核学员作品

1. 在 GitHub 的 Issues 中查看新的作品提交
2. 下载学员上传的照片
3. 将照片放入对应课程文件夹
4. 更新 `info.json` 中的 `works` 数组
5. 提交代码，网站自动上线

## 部署到 GitHub Pages

1. 在 GitHub 创建仓库
2. 推送代码到 `main` 分支
3. 仓库 Settings → Pages → Source 选 "GitHub Actions"
4. 每次推送自动构建部署

## 技术栈

- 纯静态网站，无数据库
- Node.js 构建（零依赖）
- GitHub Pages 托管（免费）
