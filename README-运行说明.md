# 江苏国动便民后台管理系统 - 运行说明

## 环境要求
- Node.js 18+ （下载地址：https://nodejs.org/）

## 启动步骤

### 1. 安装依赖
打开终端（命令行），分别安装前后端依赖：

```bash
# 进入后端目录，安装依赖
cd backend
npm install

# 进入前端目录，安装依赖
cd ../frontend
npm install
```

### 2. 初始化数据库
在后端目录下执行：

```bash
cd backend
npx prisma generate
npx prisma db push
npx tsx prisma/seed.ts
npx tsx prisma/seed-demo.ts
npx tsx prisma/seed-recent.ts
```

### 3. 启动后端服务
在后端目录下：

```bash
cd backend
npm run dev
```
后端服务运行在 http://localhost:3001

### 4. 启动前端服务
新开一个终端，在前端目录下：

```bash
cd frontend
npm run dev
```
前端服务运行在 http://localhost:5173

### 5. 访问系统
浏览器打开 http://localhost:5173
- 账号：admin
- 密码：admin123

## 项目结构
```
jiangsu-guodong/
├── backend/          # 后端 (Node.js + Express + Prisma + SQLite)
│   ├── prisma/       # 数据库模型和种子数据
│   │   ├── dev.db    # SQLite 数据库文件
│   │   ├── schema.prisma
│   │   └── seed*.ts
│   ├── src/          # 后端源码
│   └── .env          # 环境变量
├── frontend/         # 前端 (React + Vite + Ant Design)
│   ├── public/       # 静态资源
│   ├── src/          # 前端源码
│   └── index.html
└── README-运行说明.md
```
