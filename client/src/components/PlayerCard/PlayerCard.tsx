import React, { useState } from 'react';
import { Player } from '../../types';
import { getAvatarColor } from '../../utils/constants';
import './PlayerCard.css';

interface PlayerCardProps {
  player: Player;
  position: 'top' | 'right' | 'bottom' | 'left';
  revealed: boolean;
  isCurrentPlayer: boolean;
}

/**
 * 玩家卡片组件
 * 显示玩家头像、名称、投票状态和 proposal
 */
const PlayerCard: React.FC<PlayerCardProps> = ({
  player,
  position,
  revealed,
  isCurrentPlayer,
}) => {
  const [showProposal, setShowProposal] = useState(false);

  /** 获取卡片上显示的内容 */
  const getCardContent = () => {
    if (player.isSpectator) return { text: '👀', className: 'spectator' };
    if (!player.hasVoted) return { text: '', className: 'empty' };
    if (revealed && player.vote !== null)
      return { text: player.vote, className: 'revealed' };
    return { text: '✓', className: 'voted' };
  };

  const card = getCardContent();
  const avatarColor = getAvatarColor(player.name);
  const isVertical = position === 'left' || position === 'right';
  const hasProposal = revealed && player.proposal;

  return (
    <div
      className={`player-card-wrapper ${position} ${isCurrentPlayer ? 'is-me' : ''}`}
    >
      {/* 投票卡片 + proposal 标记 */}
      <div className="vote-card-area">
        <div className={`vote-card ${card.className}`}>
          {card.text && <span className="card-value">{card.text}</span>}
        </div>
        {/* Proposal 图标 */}
        {hasProposal && (
          <button
            className="proposal-badge"
            onClick={() => setShowProposal(!showProposal)}
            title="查看 Proposal"
          >
            💡
          </button>
        )}
        {/* Proposal 气泡 */}
        {hasProposal && showProposal && (
          <div className="proposal-tooltip">
            <div className="proposal-tooltip-content">
              {player.proposal}
            </div>
          </div>
        )}
      </div>

      {/* 玩家信息 */}
      <div className={`player-info ${isVertical ? 'vertical' : ''}`}>
        <div
          className="player-avatar"
          style={{ backgroundColor: avatarColor }}
        >
          {player.name.charAt(0).toUpperCase()}
        </div>
        <span className="player-name" title={player.name}>
          {player.name}
        </span>
        {isCurrentPlayer && <span className="you-tag">(你)</span>}
      </div>
    </div>
  );
};

export default PlayerCard;
