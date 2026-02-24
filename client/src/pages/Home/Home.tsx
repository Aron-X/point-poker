import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../../context/SocketContext';
import UserGuide from '../../components/UserGuide/UserGuide';
import './Home.css';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { socket, connected } = useSocket();
  const [joinRoomId, setJoinRoomId] = useState('');
  const [showGuide, setShowGuide] = useState(false);

  /** 创建新房间 */
  const handleCreateRoom = () => {
    if (!socket) return;
    socket.emit('create-room', (response: { roomId: string }) => {
      navigate(`/room/${response.roomId}`);
    });
  };

  /** 加入已有房间 */
  const handleJoinRoom = () => {
    if (!joinRoomId.trim()) return;

    // 支持粘贴完整 URL，自动提取 roomId
    let roomId = joinRoomId.trim();
    const urlMatch = roomId.match(/\/room\/(.+?)(?:\?|$)/);
    if (urlMatch) {
      roomId = urlMatch[1];
    }
    navigate(`/room/${roomId}`);
  };

  return (
    <div className="home">
      <div className="home-container">
        {/* Logo 区域 */}
        <div className="home-logo">
          <div className="logo-icon">🃏</div>
          <h1 className="home-title">Planning Poker</h1>
          <p className="home-subtitle">
            免费、快速、有趣的敏捷估点工具
          </p>
        </div>

        {/* 操作区域 */}
        <div className="home-actions">
          <button
            className="btn btn-primary btn-lg home-create-btn"
            onClick={handleCreateRoom}
            disabled={!connected}
          >
            🚀 创建新房间
          </button>

          <div className="divider">
            <span>OR</span>
          </div>

          <div className="join-form">
            <input
              type="text"
              className="input"
              placeholder="输入房间链接或 ID..."
              value={joinRoomId}
              onChange={(e) => setJoinRoomId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom()}
            />
            <button
              className="btn btn-secondary"
              onClick={handleJoinRoom}
              disabled={!joinRoomId.trim() || !connected}
            >
              加入房间
            </button>
          </div>
        </div>

        {/* 连接状态 */}
        {!connected && (
          <div className="connection-status">
            <div className="status-dot" />
            正在连接服务器...
          </div>
        )}

        {/* 使用指南入口 */}
        <button
          className="home-guide-btn"
          onClick={() => setShowGuide(true)}
        >
          📖 如何使用？查看使用手册
        </button>

        {/* 特性介绍 */}
        <div className="home-features">
          <div className="feature">
            <span className="feature-icon">⚡</span>
            <span>无需注册，即开即用</span>
          </div>
          <div className="feature">
            <span className="feature-icon">🔗</span>
            <span>分享链接即可邀请</span>
          </div>
          <div className="feature">
            <span className="feature-icon">📊</span>
            <span>实时查看投票结果</span>
          </div>
        </div>
      </div>

      {/* 使用手册弹窗 */}
      {showGuide && <UserGuide onClose={() => setShowGuide(false)} />}
    </div>
  );
};

export default Home;
