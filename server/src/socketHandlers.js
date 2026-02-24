/**
 * Socket.io 事件处理器
 * 处理所有客户端与服务端之间的实时通信
 */
function setupSocketHandlers(io, roomManager) {
  io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    let currentRoomId = null;

    // ==================== 房间管理 ====================

    /**
     * 创建新房间
     */
    socket.on('create-room', (callback) => {
      const room = roomManager.createRoom();
      console.log(`[Room] Created room: ${room.id}`);
      callback({ roomId: room.id });
    });

    /**
     * 加入房间（支持 clientId 重连）
     */
    socket.on('join-room', ({ roomId, playerName, clientId }, callback) => {
      const room = roomManager.getRoom(roomId);
      if (!room) {
        callback({ error: 'Room not found' });
        return;
      }

      const player = roomManager.addPlayer(roomId, socket.id, playerName, clientId || null);
      if (!player) {
        callback({ error: 'Failed to join room' });
        return;
      }

      currentRoomId = roomId;
      socket.join(roomId);

      const action = player.reconnected ? 'reconnected to' : 'joined';
      console.log(`[Room] ${player.name} ${action} room: ${roomId}`);
      callback({
        success: true,
        playerId: socket.id,
        reconnected: player.reconnected || false,
        playerName: player.name,
      });

      // 广播房间状态
      broadcastRoomState(roomId);
    });

    // ==================== 投票流程 ====================

    /**
     * 提交投票（含可选 proposal）
     */
    socket.on('vote', ({ roomId, value, proposal }) => {
      if (roomManager.vote(roomId, socket.id, value, proposal || null)) {
        broadcastRoomState(roomId);
      }
    });

    /**
     * 揭牌
     */
    socket.on('reveal', ({ roomId }) => {
      if (roomManager.reveal(roomId)) {
        broadcastRoomState(roomId);
      }
    });

    /**
     * 重新投票
     */
    socket.on('revote', ({ roomId }) => {
      if (roomManager.revote(roomId)) {
        broadcastRoomState(roomId);
      }
    });

    // ==================== Issue 管理 ====================

    /**
     * 添加 Issue
     */
    socket.on('add-issue', ({ roomId, title }) => {
      if (roomManager.addIssue(roomId, title)) {
        broadcastRoomState(roomId);
      }
    });

    /**
     * 选择当前 Issue
     */
    socket.on('select-issue', ({ roomId, issueId }) => {
      if (roomManager.selectIssue(roomId, issueId)) {
        broadcastRoomState(roomId);
      }
    });

    /**
     * 手动设置 Issue 结果
     */
    socket.on('set-issue-result', ({ roomId, issueId, result }) => {
      if (roomManager.setIssueResult(roomId, issueId, result)) {
        broadcastRoomState(roomId);
      }
    });

    /**
     * 删除 Issue
     */
    socket.on('delete-issue', ({ roomId, issueId }) => {
      if (roomManager.deleteIssue(roomId, issueId)) {
        broadcastRoomState(roomId);
      }
    });

    // ==================== 玩家设置 ====================

    /**
     * 设置玩家名称
     */
    socket.on('set-name', ({ roomId, name }) => {
      if (roomManager.setPlayerName(roomId, socket.id, name)) {
        broadcastRoomState(roomId);
      }
    });

    /**
     * 切换观察者模式
     */
    socket.on('toggle-spectator', ({ roomId }) => {
      if (roomManager.toggleSpectator(roomId, socket.id)) {
        broadcastRoomState(roomId);
      }
    });

    // ==================== 连接管理 ====================

    /**
     * 客户端断开连接
     */
    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
      if (currentRoomId) {
        roomManager.removePlayer(currentRoomId, socket.id);
        broadcastRoomState(currentRoomId);
      }
    });

    // ==================== 辅助函数 ====================

    function broadcastRoomState(roomId) {
      const roomState = roomManager.getRoomState(roomId);
      if (roomState) {
        io.to(roomId).emit('room-state', roomState);
      }
    }
  });
}

module.exports = { setupSocketHandlers };
