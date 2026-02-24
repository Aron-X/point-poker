import { useState, useEffect, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';
import { RoomState } from '../types';

/** localStorage 中存储的会话信息 */
interface SessionInfo {
  roomId: string;
  playerName: string;
  clientId: string;
}

/** 生成或获取该房间的持久化 clientId */
function getSession(roomId: string): SessionInfo | null {
  try {
    const raw = localStorage.getItem(`pp_session_${roomId}`);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return null;
}

function saveSession(roomId: string, playerName: string, clientId: string) {
  localStorage.setItem(
    `pp_session_${roomId}`,
    JSON.stringify({ roomId, playerName, clientId })
  );
}

function generateClientId(): string {
  return `cid_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

/**
 * 房间管理 Hook
 * 封装所有与房间相关的 Socket 通信逻辑
 * 支持 clientId 会话持久化（刷新/掉线后自动重连）
 */
export function useRoom(roomId: string | undefined) {
  const { socket } = useSocket();
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 监听房间状态更新
  useEffect(() => {
    if (!socket) return;

    socket.on('room-state', (state: RoomState) => {
      setRoomState(state);
    });

    return () => {
      socket.off('room-state');
    };
  }, [socket]);

  // 加入房间
  const joinRoom = useCallback(
    (playerName: string) => {
      if (!socket || !roomId) return;

      // 获取或创建 clientId
      let session = getSession(roomId);
      let clientId = session?.clientId || generateClientId();

      socket.emit(
        'join-room',
        { roomId, playerName, clientId },
        (response: {
          success?: boolean;
          playerId?: string;
          error?: string;
          reconnected?: boolean;
          playerName?: string;
        }) => {
          if (response.error) {
            setError(response.error);
          } else {
            setPlayerId(response.playerId || null);
            setError(null);
            // 保存 session（用重连后返回的实际名称）
            const finalName = response.playerName || playerName;
            saveSession(roomId, finalName, clientId);
          }
        }
      );
    },
    [socket, roomId]
  );

  /**
   * 检查是否有已保存的会话，如果有则自动重连
   * @returns 已保存的 session 或 null
   */
  const getSavedSession = useCallback((): SessionInfo | null => {
    if (!roomId) return null;
    return getSession(roomId);
  }, [roomId]);

  // 投票（含可选 proposal）
  const vote = useCallback(
    (value: string, proposal?: string) => {
      if (!socket || !roomId) return;
      socket.emit('vote', { roomId, value, proposal: proposal || null });
    },
    [socket, roomId]
  );

  // 揭牌
  const reveal = useCallback(() => {
    if (!socket || !roomId) return;
    socket.emit('reveal', { roomId });
  }, [socket, roomId]);

  // 重新投票
  const revote = useCallback(() => {
    if (!socket || !roomId) return;
    socket.emit('revote', { roomId });
  }, [socket, roomId]);

  // 添加 Issue
  const addIssue = useCallback(
    (title: string) => {
      if (!socket || !roomId) return;
      socket.emit('add-issue', { roomId, title });
    },
    [socket, roomId]
  );

  // 选择 Issue
  const selectIssue = useCallback(
    (issueId: string) => {
      if (!socket || !roomId) return;
      socket.emit('select-issue', { roomId, issueId });
    },
    [socket, roomId]
  );

  // 删除 Issue
  const deleteIssue = useCallback(
    (issueId: string) => {
      if (!socket || !roomId) return;
      socket.emit('delete-issue', { roomId, issueId });
    },
    [socket, roomId]
  );

  // 手动设置 Issue 结果
  const setIssueResult = useCallback(
    (issueId: string, result: number | null) => {
      if (!socket || !roomId) return;
      socket.emit('set-issue-result', { roomId, issueId, result });
    },
    [socket, roomId]
  );

  // 设置名称（同时更新 localStorage）
  const setName = useCallback(
    (name: string) => {
      if (!socket || !roomId) return;
      socket.emit('set-name', { roomId, name });
      // 更新 localStorage 中的名称
      const session = getSession(roomId);
      if (session) {
        saveSession(roomId, name, session.clientId);
      }
    },
    [socket, roomId]
  );

  // 切换观察者
  const toggleSpectator = useCallback(() => {
    if (!socket || !roomId) return;
    socket.emit('toggle-spectator', { roomId });
  }, [socket, roomId]);

  return {
    roomState,
    playerId,
    error,
    joinRoom,
    getSavedSession,
    vote,
    reveal,
    revote,
    addIssue,
    selectIssue,
    deleteIssue,
    setIssueResult,
    setName,
    toggleSpectator,
  };
}
