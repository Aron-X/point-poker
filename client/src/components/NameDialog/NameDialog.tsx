import React, { useState } from 'react';
import './NameDialog.css';

interface NameDialogProps {
  onSubmit: (name: string) => void;
}

/**
 * 名称输入弹窗
 * 用户加入房间时设置自己的显示名
 */
const NameDialog: React.FC<NameDialogProps> = ({ onSubmit }) => {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(name.trim());
    }
  };

  return (
    <div className="name-dialog-overlay">
      <div className="name-dialog">
        <div className="name-dialog-icon">👋</div>
        <h2>欢迎加入!</h2>
        <p>输入你的名字加入估点会话</p>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            className="input name-input"
            placeholder="你的名字"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            maxLength={20}
          />
          <button
            type="submit"
            className="btn btn-primary btn-lg name-submit-btn"
            disabled={!name.trim()}
          >
            加入游戏
          </button>
        </form>
      </div>
    </div>
  );
};

export default NameDialog;
