const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const { RoomManager } = require('./roomManager');
const { setupSocketHandlers } = require('./socketHandlers');

const app = express();
const server = http.createServer(app);

// Socket.io 配置，支持跨域
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json());

// 房间管理器（内存存储）
const roomManager = new RoomManager();

// ==================== REST API ====================

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 检查房间是否存在
app.get('/api/room/:roomId', (req, res) => {
  const room = roomManager.getRoom(req.params.roomId);
  if (room) {
    res.json({ exists: true, playerCount: room.players.size });
  } else {
    res.status(404).json({ exists: false });
  }
});

// ==================== 静态文件服务（生产环境） ====================

if (process.env.NODE_ENV === 'production') {
  const clientBuild = path.join(__dirname, '../public');
  app.use(express.static(clientBuild));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuild, 'index.html'));
  });
}

// ==================== Socket.io ====================

setupSocketHandlers(io, roomManager);

// ==================== 启动服务器 ====================

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Planning Poker server running on port ${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/api/health`);
});
