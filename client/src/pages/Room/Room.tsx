import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useRoom } from '../../hooks/useRoom';
import { useSocket } from '../../context/SocketContext';
import NameDialog from '../../components/NameDialog/NameDialog';
import PokerTable from '../../components/PokerTable/PokerTable';
import CardSelector from '../../components/CardSelector/CardSelector';
import VoteResults from '../../components/VoteResults/VoteResults';
import IssuePanel from '../../components/IssuePanel/IssuePanel';
import InviteLink from '../../components/InviteLink/InviteLink';
import UserGuide from '../../components/UserGuide/UserGuide';
import './Room.css';

const Room: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const { connected } = useSocket();
  const {
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
  } = useRoom(roomId);

  // 初始化时先检查是否有 session，决定初始是否显示 NameDialog
  const [showNameDialog, setShowNameDialog] = useState(() => {
    if (!roomId) return true;
    const session = getSavedSession();
    return !(session && session.playerName);
  });
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [proposal, setProposal] = useState<string>('');
  const [showIssuePanel, setShowIssuePanel] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState('');
  const joinedRef = useRef(false);

  /** 自动重连：等 socket connected 后再尝试 */
  useEffect(() => {
    if (joinedRef.current || !roomId || !connected) return;

    const session = getSavedSession();
    if (session && session.playerName) {
      joinedRef.current = true;
      joinRoom(session.playerName);
    }
  }, [roomId, connected, getSavedSession, joinRoom]);

  /** 手动设置名字并加入房间 */
  const handleNameSubmit = (name: string) => {
    joinRoom(name);
    setShowNameDialog(false);
  };

  /** 投票（带 proposal） */
  const handleVote = (value: string) => {
    if (selectedCard === value) {
      setSelectedCard(null);
      return;
    }
    setSelectedCard(value);
    vote(value, proposal || undefined);
  };

  /** proposal 变化时，如果已投票则重新提交 */
  const handleProposalChange = useCallback(
    (text: string) => {
      setProposal(text);
      if (selectedCard) {
        vote(selectedCard, text || undefined);
      }
    },
    [selectedCard, vote]
  );

  /** 揭牌 */
  const handleReveal = () => {
    reveal();
  };

  /** 重新投票 */
  const handleRevote = () => {
    setSelectedCard(null);
    setProposal('');
    revote();
  };

  /** 开始编辑名字 */
  const handleStartEditName = () => {
    if (currentPlayer) {
      setEditNameValue(currentPlayer.name);
      setIsEditingName(true);
    }
  };

  /** 提交新名字 */
  const handleSubmitName = () => {
    const trimmed = editNameValue.trim();
    if (trimmed && trimmed !== currentPlayer?.name) {
      setName(trimmed);
    }
    setIsEditingName(false);
  };

  // 新一轮开始时重置选择
  useEffect(() => {
    if (roomState && !roomState.revealed && roomState.voteCount === 0) {
      setSelectedCard(null);
      setProposal('');
    }
  }, [roomState?.revealed, roomState?.voteCount]);

  const currentPlayer = roomState?.players.find((p) => p.id === playerId);

  // 错误页面（如果自动重连失败也需要允许手动输入名字）
  if (error) {
    // 如果是自动重连导致的错误，回到名称输入
    if (!showNameDialog) {
      return (
        <div className="room-error">
          <div className="room-error-content">
            <span className="error-icon">😕</span>
            <h2>无法加入房间</h2>
            <p>{error}</p>
            <a href="/" className="btn btn-primary">
              返回首页
            </a>
          </div>
        </div>
      );
    }
  }

  return (
    <div className="room">
      {/* 名称输入弹窗 */}
      {showNameDialog && <NameDialog onSubmit={handleNameSubmit} />}

      {/* 房间主界面 */}
      {!showNameDialog && roomState && (
        <>
          {/* 顶部栏 */}
          <header className="room-header">
            <div className="room-header-left">
              <a href="/" className="room-logo">
                🃏
              </a>
              {/* 名字显示/编辑 */}
              {isEditingName ? (
                <div className="name-edit-inline">
                  <input
                    className="name-edit-input"
                    value={editNameValue}
                    onChange={(e) => setEditNameValue(e.target.value)}
                    onBlur={handleSubmitName}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSubmitName();
                      if (e.key === 'Escape') setIsEditingName(false);
                    }}
                    maxLength={20}
                    autoFocus
                  />
                </div>
              ) : (
                <h2
                  className="room-title editable-name"
                  onClick={handleStartEditName}
                  title="点击修改名字"
                >
                  {currentPlayer?.name || 'Planning Poker'}
                  <span className="edit-name-icon">✏️</span>
                </h2>
              )}
              {roomState.currentIssueId && (
                <div className="current-issue-badge">
                  📌{' '}
                  {
                    roomState.issues.find(
                      (i) => i.id === roomState.currentIssueId
                    )?.title
                  }
                </div>
              )}
            </div>
            <div className="room-header-right">
              <InviteLink roomId={roomId || ''} />
              <button
                className="btn btn-outline btn-sm"
                onClick={() => setShowIssuePanel(!showIssuePanel)}
              >
                📋 Issues
                {roomState.issues.length > 0 &&
                  ` (${roomState.issues.length})`}
              </button>
              <button
                className="btn btn-outline btn-sm guide-trigger-btn"
                onClick={() => setShowGuide(true)}
                title="使用手册"
              >
                ❓
              </button>
            </div>
          </header>

          {/* 主内容区 */}
          <div
            className={`room-content ${showIssuePanel ? 'with-panel' : ''}`}
          >
            <div className="room-main">
              {/* 扑克桌 */}
              <PokerTable
                players={roomState.players}
                revealed={roomState.revealed}
                onReveal={handleReveal}
                onRevote={handleRevote}
                currentPlayerId={playerId}
                isHost={currentPlayer?.isHost ?? false}
                hasVotes={roomState.voteCount > 0}
              />

              {/* 投票结果（揭牌后显示） */}
              {roomState.revealed && (
                <VoteResults
                  players={roomState.players}
                  votes={roomState.votes}
                  currentIssueId={roomState.currentIssueId}
                  issueResult={
                    roomState.currentIssueId
                      ? roomState.issues.find(
                          (i) => i.id === roomState.currentIssueId
                        )?.result ?? null
                      : null
                  }
                  onSetIssueResult={setIssueResult}
                />
              )}

              {/* 卡片选择器（含 proposal 输入） */}
              {!currentPlayer?.isSpectator && (
                <CardSelector
                  selectedCard={selectedCard}
                  onSelect={handleVote}
                  disabled={roomState.revealed}
                  proposal={proposal}
                  onProposalChange={handleProposalChange}
                />
              )}
            </div>

            {/* Issue 侧边栏 */}
            {showIssuePanel && (
              <IssuePanel
                issues={roomState.issues}
                currentIssueId={roomState.currentIssueId}
                onAddIssue={addIssue}
                onSelectIssue={selectIssue}
                onDeleteIssue={deleteIssue}
                onClose={() => setShowIssuePanel(false)}
              />
            )}
          </div>
        </>
      )}

      {/* 加载中状态 */}
      {!showNameDialog && !roomState && !error && (
        <div className="room-loading">
          <div className="loading-spinner" />
          <p>加载房间中...</p>
        </div>
      )}

      {/* 使用手册弹窗 */}
      {showGuide && <UserGuide onClose={() => setShowGuide(false)} />}
    </div>
  );
};

export default Room;
