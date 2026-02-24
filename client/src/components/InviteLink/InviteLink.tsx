import React, { useState } from 'react';
import './InviteLink.css';

interface InviteLinkProps {
  roomId: string;
}

/**
 * 邀请链接组件
 * 一键复制房间链接
 */
const InviteLink: React.FC<InviteLinkProps> = ({ roomId }) => {
  const [copied, setCopied] = useState(false);

  const inviteUrl = `${window.location.origin}/room/${roomId}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = inviteUrl;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      className={`invite-btn ${copied ? 'copied' : ''}`}
      onClick={handleCopy}
      title={inviteUrl}
    >
      {copied ? '✅ 已复制!' : '🔗 邀请玩家'}
    </button>
  );
};

export default InviteLink;
