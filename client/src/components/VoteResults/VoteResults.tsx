import React, { useState, useEffect, useRef } from 'react';
import { Player } from '../../types';
import './VoteResults.css';

interface VoteResultsProps {
  players: Player[];
  votes: Record<string, string>;
  /** 当前关联的 Issue ID */
  currentIssueId: string | null;
  /** 服务端同步的 Issue 结果（来自 roomState.issues） */
  issueResult: number | null;
  /** 手动设置 Issue 结果的回调 */
  onSetIssueResult?: (issueId: string, result: number | null) => void;
}

/**
 * 投票结果展示
 * 显示投票分布柱状图、一致性指标和可编辑的最终结果
 */
const VoteResults: React.FC<VoteResultsProps> = ({
  players,
  votes,
  currentIssueId,
  issueResult,
  onSetIssueResult,
}) => {
  // 统计投票分布
  const distribution: Record<string, number> = {};
  Object.values(votes).forEach((vote) => {
    distribution[vote] = (distribution[vote] || 0) + 1;
  });

  // 按投票数排序
  const sortedEntries = Object.entries(distribution).sort(
    (a, b) => b[1] - a[1]
  );

  const totalVotes = Object.values(votes).length;

  // 一致性百分比
  const maxVotes = sortedEntries.length > 0 ? sortedEntries[0][1] : 0;
  const agreement =
    totalVotes > 0 ? Math.round((maxVotes / totalVotes) * 100) : 0;

  // 平均值（仅数字投票）
  const numericVotes = Object.values(votes)
    .map(Number)
    .filter((n) => !isNaN(n));
  const average =
    numericVotes.length > 0
      ? Math.round(
          (numericVotes.reduce((a, b) => a + b, 0) / numericVotes.length) * 10
        ) / 10
      : null;

  // ========== Final 输入框状态 ==========
  // 标记输入框是否正在被用户编辑
  const [isEditing, setIsEditing] = useState(false);
  // 本地编辑中的值
  const [localValue, setLocalValue] = useState<string>('');

  // 显示值：编辑中用 localValue，否则用服务端的 issueResult（如果有）或 average
  const displayValue = isEditing
    ? localValue
    : String(issueResult ?? average ?? '');

  /** 输入框获得焦点：进入编辑模式 */
  const handleFocus = () => {
    setIsEditing(true);
    setLocalValue(String(issueResult ?? average ?? ''));
  };

  /** 输入值变化 */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value);
  };

  /** 失焦：提交并退出编辑模式 */
  const handleBlur = () => {
    setIsEditing(false);
    if (currentIssueId && onSetIssueResult) {
      const num = parseFloat(localValue);
      if (!isNaN(num)) {
        onSetIssueResult(currentIssueId, Math.round(num * 10) / 10);
      }
    }
  };

  /** 回车也提交 */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      (e.target as HTMLInputElement).blur();
    }
  };

  // 一致性环形图参数
  const circumference = 2 * Math.PI * 54;
  const dashOffset = circumference - (agreement / 100) * circumference;

  return (
    <div className="vote-results">
      {/* 投票分布柱状图 */}
      <div className="vote-distribution">
        {sortedEntries.map(([value, count]) => (
          <div key={value} className="vote-bar-item">
            <div className="vote-bar-container">
              <div
                className="vote-bar"
                style={{
                  height: `${(count / totalVotes) * 100}%`,
                }}
              />
            </div>
            <div className="vote-card-small">{value}</div>
            <span className="vote-count">
              {count} {count === 1 ? 'Vote' : 'Votes'}
            </span>
          </div>
        ))}
      </div>

      {/* 统计信息 */}
      <div className="vote-summary">
        {/* 一致性环形图 */}
        <div className="agreement-section">
          <div className="agreement-ring">
            <svg viewBox="0 0 120 120" className="agreement-svg">
              <circle
                className="agreement-bg-circle"
                cx="60"
                cy="60"
                r="54"
              />
              <circle
                className="agreement-fill-circle"
                cx="60"
                cy="60"
                r="54"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                style={{
                  '--agreement-color':
                    agreement >= 80
                      ? '#2ECC71'
                      : agreement >= 50
                        ? '#F39C12'
                        : '#E74C3C',
                } as React.CSSProperties}
              />
            </svg>
            <div className="agreement-value">{agreement}%</div>
          </div>
          <span className="agreement-label">Agreement</span>
        </div>

        {/* 平均值 */}
        {average !== null && (
          <div className="average-section">
            <div className="average-value">{average}</div>
            <span className="average-label">Average</span>
          </div>
        )}

        {/* 可编辑的最终结果 */}
        {average !== null && currentIssueId && (
          <div className="final-result-section">
            <input
              type="number"
              className="final-result-input"
              value={displayValue}
              onFocus={handleFocus}
              onChange={handleChange}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              step="0.1"
              title="修改最终估点结果"
              aria-label="最终估点结果"
            />
            <span className="final-result-label">Final</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default VoteResults;
