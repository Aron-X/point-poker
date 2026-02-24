import React from 'react';
import { CARD_VALUES } from '../../utils/constants';
import './CardSelector.css';

interface CardSelectorProps {
  selectedCard: string | null;
  onSelect: (value: string) => void;
  disabled: boolean;
  /** 当前 proposal 文本 */
  proposal?: string;
  /** proposal 变化回调 */
  onProposalChange?: (text: string) => void;
}

/**
 * 卡片选择器
 * 显示在页面底部，供用户选择估点值
 * 支持可选的 proposal 文本输入
 */
const CardSelector: React.FC<CardSelectorProps> = ({
  selectedCard,
  onSelect,
  disabled,
  proposal = '',
  onProposalChange,
}) => {
  return (
    <div className={`card-selector ${disabled ? 'is-disabled' : ''}`}>
      <div className="card-selector-inner">
        {CARD_VALUES.map((value) => (
          <button
            key={value}
            className={`card-option ${selectedCard === value ? 'selected' : ''}`}
            onClick={() => !disabled && onSelect(value)}
            disabled={disabled}
            title={`选择 ${value}`}
          >
            <span className="card-option-value">{value}</span>
          </button>
        ))}
      </div>

      {/* Proposal 输入区 */}
      {!disabled && (
        <div className="proposal-area">
          <label className="proposal-label">
            💡 Proposal (可选)
          </label>
          <input
            type="text"
            className="proposal-input"
            placeholder="输入你的想法，最多20字..."
            value={proposal}
            onChange={(e) =>
              onProposalChange?.(e.target.value.substring(0, 20))
            }
            maxLength={20}
            disabled={disabled}
          />
          <span className="proposal-count">{proposal.length}/20</span>
        </div>
      )}

      {disabled && (
        <p className="card-selector-hint">等待新一轮投票开始...</p>
      )}
    </div>
  );
};

export default CardSelector;
