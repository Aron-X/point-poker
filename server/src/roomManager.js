const { nanoid } = require('nanoid');

class RoomManager {
  constructor() {
    /** @type {Map<string, Room>} */
    this.rooms = new Map();
    /** @type {Map<string, NodeJS.Timeout>} 断线宽限期定时器 (key: `${roomId}:${socketId}`) */
    this.disconnectTimers = new Map();
  }

  /**
   * 创建新房间
   */
  createRoom() {
    const roomId = nanoid(10);
    const room = {
      id: roomId,
      players: new Map(),
      votes: new Map(),
      proposals: new Map(),  // playerId -> proposal text
      revealed: false,
      issues: [],
      currentIssueId: null,
      createdAt: new Date(),
    };
    this.rooms.set(roomId, room);
    return room;
  }

  /**
   * 获取房间
   */
  getRoom(roomId) {
    return this.rooms.get(roomId);
  }

  /**
   * 添加玩家到房间（支持 clientId 重连）
   * @param {string} roomId
   * @param {string} socketId - 当前 socket ID
   * @param {string} name - 玩家名称
   * @param {string|null} clientId - 持久化客户端 ID（用于重连识别）
   * @returns {object|null} player 对象，含 reconnected 标志
   */
  addPlayer(roomId, socketId, name, clientId) {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    // 检查是否是重连（通过 clientId 匹配）
    if (clientId) {
      // 先检查宽限期中的"幽灵"玩家
      for (const [timerKey, timerInfo] of this.disconnectTimers) {
        if (timerInfo.roomId === roomId && timerInfo.clientId === clientId) {
          // 取消宽限期定时器，恢复玩家
          clearTimeout(timerInfo.timer);
          this.disconnectTimers.delete(timerKey);

          const ghost = timerInfo.player;
          ghost.id = socketId;
          room.players.set(socketId, ghost);

          // 恢复投票和 proposal
          if (timerInfo.vote !== undefined) room.votes.set(socketId, timerInfo.vote);
          if (timerInfo.proposal) room.proposals.set(socketId, timerInfo.proposal);

          console.log(`[Room] Player ${ghost.name} reconnected from grace period (clientId: ${clientId})`);
          return { ...ghost, reconnected: true };
        }
      }

      // 还在线的旧连接重连
      for (const [oldSocketId, existingPlayer] of room.players) {
        if (existingPlayer.clientId === clientId) {
          room.players.delete(oldSocketId);

          const oldVote = room.votes.get(oldSocketId);
          if (oldVote !== undefined) {
            room.votes.delete(oldSocketId);
            room.votes.set(socketId, oldVote);
          }
          const oldProposal = room.proposals.get(oldSocketId);
          if (oldProposal !== undefined) {
            room.proposals.delete(oldSocketId);
            room.proposals.set(socketId, oldProposal);
          }

          existingPlayer.id = socketId;
          room.players.set(socketId, existingPlayer);

          console.log(`[Room] Player ${existingPlayer.name} reconnected (clientId: ${clientId})`);
          return { ...existingPlayer, reconnected: true };
        }
      }
    }

    // 新玩家
    const isHost = room.players.size === 0;
    const player = {
      id: socketId,
      name: name || 'Player',
      isHost,
      isSpectator: false,
      clientId: clientId || null,
    };
    room.players.set(socketId, player);
    return { ...player, reconnected: false };
  }

  /**
   * 从房间移除玩家（带宽限期，允许 30 秒内重连）
   * @param {Function} onActualRemove - 宽限期到期后真正移除时的回调（用于广播状态）
   */
  removePlayer(roomId, socketId, onActualRemove) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const player = room.players.get(socketId);
    if (!player) return;

    // 如果玩家有 clientId，进入宽限期而非直接删除
    if (player.clientId) {
      const vote = room.votes.get(socketId);
      const proposal = room.proposals.get(socketId);

      // 先从房间中移除
      room.players.delete(socketId);
      room.votes.delete(socketId);
      room.proposals.delete(socketId);

      const GRACE_PERIOD_MS = 30000;
      const timerKey = `${roomId}:${player.clientId}`;

      const timer = setTimeout(() => {
        this.disconnectTimers.delete(timerKey);
        console.log(`[Room] Grace period expired for ${player.name} in room ${roomId}`);

        // 如果房间还在且已空，删除房间
        const r = this.rooms.get(roomId);
        if (r && r.players.size === 0) {
          this.rooms.delete(roomId);
        } else if (r) {
          // 如果房主离开，指定新房主
          const hasHost = [...r.players.values()].some((p) => p.isHost);
          if (!hasHost) {
            const firstPlayer = r.players.values().next().value;
            if (firstPlayer) firstPlayer.isHost = true;
          }
          if (onActualRemove) onActualRemove();
        }
      }, GRACE_PERIOD_MS);

      this.disconnectTimers.set(timerKey, {
        timer,
        roomId,
        clientId: player.clientId,
        player,
        vote,
        proposal,
      });

      console.log(`[Room] ${player.name} entered grace period (30s) for room ${roomId}`);

      // 房间暂时为空但不删除（等宽限期到期）
      // 不广播状态变更（玩家可能马上回来）
      return;
    }

    // 无 clientId 的玩家直接移除
    room.players.delete(socketId);
    room.votes.delete(socketId);
    room.proposals.delete(socketId);

    if (room.players.size === 0) {
      this.rooms.delete(roomId);
      return;
    }

    const hasHost = [...room.players.values()].some((p) => p.isHost);
    if (!hasHost) {
      const firstPlayer = room.players.values().next().value;
      if (firstPlayer) firstPlayer.isHost = true;
    }
  }

  /**
   * 玩家投票（含可选 proposal）
   */
  vote(roomId, socketId, value, proposal) {
    const room = this.rooms.get(roomId);
    if (!room || room.revealed) return false;

    const player = room.players.get(socketId);
    if (!player || player.isSpectator) return false;

    room.votes.set(socketId, value);

    // 处理 proposal
    if (proposal && typeof proposal === 'string' && proposal.trim().length > 0) {
      room.proposals.set(socketId, proposal.trim().substring(0, 20));
    } else {
      room.proposals.delete(socketId);
    }

    return true;
  }

  /**
   * 揭牌
   */
  reveal(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    room.revealed = true;

    // 将结果保存到当前 issue
    if (room.currentIssueId) {
      const numericVotes = [...room.votes.values()]
        .filter((v) => v !== '?' && v !== '☕')
        .map(Number)
        .filter((n) => !isNaN(n));

      if (numericVotes.length > 0) {
        const avg = numericVotes.reduce((a, b) => a + b, 0) / numericVotes.length;
        const issue = room.issues.find((i) => i.id === room.currentIssueId);
        if (issue) {
          issue.result = Math.round(avg * 10) / 10;
        }
      }
    }

    return true;
  }

  /**
   * 重新投票
   */
  revote(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    room.votes.clear();
    room.proposals.clear();
    room.revealed = false;
    return true;
  }

  /**
   * 添加 Issue
   */
  addIssue(roomId, title) {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    const issue = {
      id: nanoid(8),
      title,
      result: null,
    };
    room.issues.push(issue);
    return issue;
  }

  /**
   * 选择当前 Issue
   */
  selectIssue(roomId, issueId) {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    room.currentIssueId = issueId;
    room.votes.clear();
    room.proposals.clear();
    room.revealed = false;
    return true;
  }

  /**
   * 设置 Issue 结果（用户手动修改）
   */
  setIssueResult(roomId, issueId, result) {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    const issue = room.issues.find((i) => i.id === issueId);
    if (issue) {
      issue.result = result;
      return true;
    }
    return false;
  }

  /**
   * 删除 Issue
   */
  deleteIssue(roomId, issueId) {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    room.issues = room.issues.filter((i) => i.id !== issueId);
    if (room.currentIssueId === issueId) {
      room.currentIssueId = null;
    }
    return true;
  }

  /**
   * 设置玩家名称
   */
  setPlayerName(roomId, socketId, name) {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    const player = room.players.get(socketId);
    if (player) {
      player.name = name;
      return true;
    }
    return false;
  }

  /**
   * 切换观察者模式
   */
  toggleSpectator(roomId, socketId) {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    const player = room.players.get(socketId);
    if (player) {
      player.isSpectator = !player.isSpectator;
      if (player.isSpectator) {
        room.votes.delete(socketId);
        room.proposals.delete(socketId);
      }
      return true;
    }
    return false;
  }

  /**
   * 获取可序列化的房间状态
   */
  getRoomState(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    const players = [];
    for (const [id, player] of room.players) {
      players.push({
        id: player.id,
        name: player.name,
        isHost: player.isHost,
        isSpectator: player.isSpectator,
        hasVoted: room.votes.has(id),
        vote: room.revealed ? room.votes.get(id) || null : null,
        proposal: room.revealed ? room.proposals.get(id) || null : null,
      });
    }

    return {
      id: room.id,
      players,
      revealed: room.revealed,
      votes: room.revealed ? Object.fromEntries(room.votes) : {},
      voteCount: room.votes.size,
      playerCount: room.players.size,
      issues: room.issues,
      currentIssueId: room.currentIssueId,
    };
  }
}

module.exports = { RoomManager };
