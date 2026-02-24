import React, { useState, useEffect, useCallback } from 'react';
import { Player } from '../../types';
import PlayerCard from '../PlayerCard/PlayerCard';
import './PokerTable.css';

interface PokerTableProps {
  players: Player[];
  revealed: boolean;
  onReveal: () => void;
  onRevote: () => void;
  currentPlayerId: string | null;
  /** 当前用户是否是房主 */
  isHost: boolean;
  /** 是否有人已投票（用于激活桌面动画） */
  hasVotes: boolean;
}

/**
 * 扑克桌组件
 * 将玩家分布在桌子的四周（上、右、下、左）
 * 支持揭牌倒计时动画和荧光边框效果
 */
const PokerTable: React.FC<PokerTableProps> = ({
  players,
  revealed,
  onReveal,
  onRevote,
  currentPlayerId,
  isHost,
  hasVotes,
}) => {
  const { top, right, bottom, left } = distributePlayers(players);

  // 倒计时状态：null=没有倒计时, 3/2/1=倒计时中
  const [countdown, setCountdown] = useState<number | null>(null);

  /** 房主点击揭牌 → 启动倒计时 */
  const handleRevealClick = useCallback(() => {
    if (!isHost || countdown !== null) return;
    setCountdown(3);
  }, [isHost, countdown]);

  /** 倒计时逻辑 */
  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      onReveal();
      setCountdown(null);
      return;
    }
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, onReveal]);

  /** 新一轮时重置倒计时 */
  useEffect(() => {
    if (!revealed) {
      setCountdown(null);
    }
  }, [revealed]);

  // 桌面是否正在投票中（有人投了且还没揭牌）
  const isVoting = hasVotes && !revealed && countdown === null;

  return (
    <div className="poker-table-container">
      {/* 上方玩家 */}
      <div className="table-side table-top">
        {top.map((player) => (
          <PlayerCard
            key={player.id}
            player={player}
            position="top"
            revealed={revealed}
            isCurrentPlayer={player.id === currentPlayerId}
          />
        ))}
      </div>

      {/* 中间：左 + 桌面 + 右 */}
      <div className="table-middle">
        <div className="table-side table-left">
          {left.map((player) => (
            <PlayerCard
              key={player.id}
              player={player}
              position="left"
              revealed={revealed}
              isCurrentPlayer={player.id === currentPlayerId}
            />
          ))}
        </div>

        <div
          className={`table-surface ${isVoting ? 'voting-glow' : ''} ${countdown !== null ? 'countdown-active' : ''}`}
        >
          {/* 荧光旋转边框层 */}
          {isVoting && <div className="glow-border" />}

          <div className="table-inner">
            {countdown !== null ? (
              /* 倒计时显示 */
              <div className="countdown-display">
                <div className="countdown-number" key={countdown}>
                  {countdown === 0 ? '🎉' : countdown}
                </div>
                <span className="countdown-text">即将揭牌...</span>
              </div>
            ) : !revealed ? (
              /* 揭牌按钮 */
              <button
                className={`btn btn-primary btn-lg btn-reveal ${!isHost ? 'host-only' : ''}`}
                onClick={handleRevealClick}
                disabled={!isHost}
                title={!isHost ? '只有房主可以揭牌' : '点击揭牌'}
              >
                Reveal cards
                {!isHost && <span className="host-hint">👑 房主操作</span>}
              </button>
            ) : (
              /* 重新投票按钮 */
              <button
                className="btn btn-primary btn-lg btn-reveal"
                onClick={onRevote}
              >
                Revote
              </button>
            )}
          </div>
        </div>

        <div className="table-side table-right">
          {right.map((player) => (
            <PlayerCard
              key={player.id}
              player={player}
              position="right"
              revealed={revealed}
              isCurrentPlayer={player.id === currentPlayerId}
            />
          ))}
        </div>
      </div>

      {/* 下方玩家 */}
      <div className="table-side table-bottom">
        {bottom.map((player) => (
          <PlayerCard
            key={player.id}
            player={player}
            position="bottom"
            revealed={revealed}
            isCurrentPlayer={player.id === currentPlayerId}
          />
        ))}
      </div>
    </div>
  );
};

/**
 * 将玩家均匀分配到桌子四周
 * - 1人：上
 * - 2人：上 + 下
 * - 3人：上 + 左 + 右（居中对称布局）
 * - 4人：上 + 右 + 下 + 左
 * - 5+人：均匀分配到四面
 */
function distributePlayers(players: Player[]) {
  const top: Player[] = [];
  const right: Player[] = [];
  const bottom: Player[] = [];
  const left: Player[] = [];

  if (players.length <= 2) {
    // 1-2人：上下分布
    players.forEach((p, i) => {
      if (i % 2 === 0) top.push(p);
      else bottom.push(p);
    });
  } else if (players.length === 3) {
    // 3人：上 + 左 + 右（居中对称）
    top.push(players[0]);
    left.push(players[1]);
    right.push(players[2]);
  } else if (players.length === 4) {
    // 4人：四面各一个
    top.push(players[0]);
    right.push(players[1]);
    bottom.push(players[2]);
    left.push(players[3]);
  } else {
    // 5人及以上：均匀分配
    players.forEach((p, i) => {
      switch (i % 4) {
        case 0: top.push(p); break;
        case 1: right.push(p); break;
        case 2: bottom.push(p); break;
        case 3: left.push(p); break;
      }
    });
  }

  return { top, right, bottom, left };
}

export default PokerTable;
