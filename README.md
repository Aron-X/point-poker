# 🃏 Planning Poker Online

一个免费、开源的在线估点（Planning Poker）工具，用于敏捷团队的故事点估算。

## 功能特性

- **无需注册** - 打开即用，无需登录
- **创建房间** - 一键创建估点房间
- **分享链接** - 复制链接邀请团队成员加入
- **实时投票** - 所有参与者同时出牌，互不影响
- **揭牌展示** - 统一揭牌，显示投票分布和一致性指标
- **Issue 管理** - 支持添加和管理待估点的 Issue 列表
- **响应式设计** - 支持桌面端和移动端

## 技术栈

| 模块 | 技术 |
|------|------|
| 前端 | React 19 + TypeScript + Vite |
| 后端 | Node.js + Express + Socket.io |
| 通信 | WebSocket (Socket.io) |
| 存储 | 内存存储（无需数据库） |

## 项目结构

```
pointPoker/
├── package.json              # 根项目配置（并发启动脚本）
├── server/                   # 后端服务
│   ├── package.json
│   └── src/
│       ├── index.js          # Express + Socket.io 服务入口
│       ├── roomManager.js    # 房间管理（创建/加入/投票/揭牌）
│       └── socketHandlers.js # WebSocket 事件处理
├── client/                   # 前端 React 应用
│   ├── package.json
│   ├── vite.config.ts        # Vite 配置（含开发代理）
│   ├── index.html
│   └── src/
│       ├── main.tsx          # 应用入口
│       ├── App.tsx           # 根组件（路由配置）
│       ├── types/            # TypeScript 类型定义
│       │   └── index.ts
│       ├── context/          # React Context
│       │   └── SocketContext.tsx  # Socket.io 连接管理
│       ├── hooks/            # 自定义 Hooks
│       │   └── useRoom.ts   # 房间操作 Hook
│       ├── pages/            # 页面组件
│       │   ├── Home/         # 首页（创建/加入房间）
│       │   └── Room/         # 房间页（估点主界面）
│       ├── components/       # 通用组件
│       │   ├── NameDialog/   # 名称输入弹窗
│       │   ├── PokerTable/   # 扑克桌（玩家分布）
│       │   ├── PlayerCard/   # 玩家卡片
│       │   ├── CardSelector/ # 估点卡片选择器
│       │   ├── VoteResults/  # 投票结果展示
│       │   ├── IssuePanel/   # Issue 管理侧边栏
│       │   └── InviteLink/   # 邀请链接按钮
│       └── utils/            # 工具函数
│           └── constants.ts  # 常量定义
└── README.md
```

## 快速开始

### 前置要求

- Node.js >= 18
- npm >= 9

### 安装依赖

```bash
# 在项目根目录执行，一键安装所有依赖
npm run install:all
```

### 启动开发环境

```bash
# 同时启动前端和后端开发服务器
npm run dev
```

启动后：
- **前端**: http://localhost:5173
- **后端**: http://localhost:3001
- **健康检查**: http://localhost:3001/api/health

### 分别启动

```bash
# 只启动后端
npm run dev:server

# 只启动前端
npm run dev:client
```

### 生产环境构建

```bash
# 构建前端
npm run build

# 启动生产服务器（会自动服务前端静态文件）
npm start
```

## 使用流程

1. **创建房间** - 打开首页，点击「创建新房间」
2. **邀请成员** - 点击「邀请玩家」按钮复制链接，分享给团队
3. **设置名称** - 团队成员打开链接后输入自己的名字加入
4. **选择卡片** - 每个人从底部卡片中选择一个估点值（0, 1, 2, 3, 5, 8, 13, 21, ?, ☕）
5. **揭牌** - 所有人投票后，点击「Reveal cards」揭牌
6. **查看结果** - 查看投票分布、一致性百分比和平均值
7. **重新投票** - 如果需要重新讨论，点击「Revote」重新开始

## Issue 管理

点击右上角「Issues」按钮打开 Issue 管理面板：

- **添加 Issue** - 输入标题后添加
- **选择 Issue** - 点击某个 Issue 开始对其估点
- **查看结果** - 揭牌后结果会自动保存到 Issue 上
- **删除 Issue** - 鼠标悬停在 Issue 上显示删除按钮

## 环境变量

### 后端

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `PORT` | `3001` | 服务器端口 |
| `NODE_ENV` | `development` | 运行环境 |

### 前端

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `VITE_SERVER_URL` | `http://localhost:3001` | 后端服务地址 |

## License

MIT
