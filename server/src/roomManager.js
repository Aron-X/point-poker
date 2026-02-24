const { nanoid } = require('nanoid');

class RoomManager {
  constructor() {
    /** @type {Map<string, Room>} */
    this.rooms = new Map();
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
      for (const [oldSocketId, existingPlayer] of room.players) {
        if (existingPlayer.clientId === clientId) {
          // 重连：更新 socketId，保留之前的状态
          room.players.delete(oldSocketId);

          // 迁移投票和 proposal
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
   * 从房间移除玩家
   */
  removePlayer(roomId, socketId) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    room.players.delete(socketId);
    room.votes.delete(socketId);
    room.proposals.delete(socketId);

    // 房间为空时删除房间
    if (room.players.size === 0) {
      this.rooms.delete(roomId);
      return;
    }

    // 如果房主离开，指定新房主
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
