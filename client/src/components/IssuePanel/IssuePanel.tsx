import React, { useState } from 'react';
import { Issue } from '../../types';
import './IssuePanel.css';

interface IssuePanelProps {
  issues: Issue[];
  currentIssueId: string | null;
  onAddIssue: (title: string) => void;
  onSelectIssue: (issueId: string) => void;
  onDeleteIssue: (issueId: string) => void;
  onClose: () => void;
}

/**
 * Issue 管理侧边栏
 * 支持添加、选择、删除估点项
 */
const IssuePanel: React.FC<IssuePanelProps> = ({
  issues,
  currentIssueId,
  onAddIssue,
  onSelectIssue,
  onDeleteIssue,
  onClose,
}) => {
  const [newIssueTitle, setNewIssueTitle] = useState('');

  const handleAdd = () => {
    if (newIssueTitle.trim()) {
      onAddIssue(newIssueTitle.trim());
      setNewIssueTitle('');
    }
  };

  return (
    <div className="issue-panel">
      {/* 面板头部 */}
      <div className="issue-panel-header">
        <h3>📋 Issues</h3>
        <button className="btn-icon" onClick={onClose} title="关闭">
          ✕
        </button>
      </div>

      {/* 添加 Issue */}
      <div className="issue-add">
        <input
          type="text"
          className="input"
          placeholder="输入 Issue 标题..."
          value={newIssueTitle}
          onChange={(e) => setNewIssueTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        />
        <button
          className="btn btn-primary btn-sm"
          onClick={handleAdd}
          disabled={!newIssueTitle.trim()}
        >
          添加
        </button>
      </div>

      {/* Issue 列表 */}
      <div className="issue-list">
        {issues.length === 0 && (
          <p className="issue-empty">
            还没有添加任何 Issue
            <br />
            <span>添加一些待估点的项目吧</span>
          </p>
        )}
        {issues.map((issue, index) => (
          <div
            key={issue.id}
            className={`issue-item ${currentIssueId === issue.id ? 'active' : ''}`}
            onClick={() => onSelectIssue(issue.id)}
          >
            <span className="issue-index">{index + 1}</span>
            <span className="issue-title" title={issue.title}>
              {issue.title}
            </span>
            {issue.result !== null && (
              <span className="issue-result">{issue.result}</span>
            )}
            <button
              className="btn-icon issue-delete"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteIssue(issue.id);
              }}
              title="删除"
            >
              🗑
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default IssuePanel;
