import React from 'react';
import './UserGuide.css';

interface UserGuideProps {
  onClose: () => void;
}

/** 使用步骤数据 */
const GUIDE_STEPS = [
  {
    icon: '🏠',
    title: '创建或加入房间',
    desc: '在首页点击「创建新房间」即可生成一个专属房间；或在输入框中粘贴好友分享的房间链接 / ID 直接加入。',
  },
  {
    icon: '✏️',
    title: '设置你的名字',
    desc: '进入房间后，系统会弹出一个输入框让你填写显示名称，方便其他人识别你。',
  },
  {
    icon: '🔗',
    title: '邀请团队成员',
    desc: '点击右上角「邀请玩家」按钮，一键复制房间链接，通过即时通讯工具发送给团队成员即可。',
  },
  {
    icon: '🃏',
    title: '选择估点卡片',
    desc: '页面底部展示了一排卡片（0、1、2、3、5、8、13、21、?、☕），点击一张卡片即可完成投票。选中后卡片会高亮上浮，其他人只能看到你已投票，无法看到你的具体选择。',
  },
  {
    icon: '👀',
    title: '揭牌查看结果',
    desc: '当所有人都投票完成后，任何人都可以点击桌面中央的「Reveal cards」按钮揭牌。揭牌后将展示：每人的具体投票值、投票分布柱状图、一致性百分比（Agreement）和平均值（Average）。',
  },
  {
    icon: '🔄',
    title: '重新投票',
    desc: '如果团队对结果存在分歧，可以点击「Revote」按钮重新开始一轮投票，所有选票将被清空。',
  },
  {
    icon: '📋',
    title: '管理 Issue 列表',
    desc: '点击右上角「Issues」按钮可以打开 Issue 管理面板。你可以提前添加待估点的需求项，点击某个 Issue 即可切换到对应的投票上下文，揭牌后结果会自动保存到该 Issue 上。',
  },
];

/** 卡片含义数据 */
const CARD_MEANINGS = [
  { value: '0', meaning: '几乎不需要工作量' },
  { value: '1', meaning: '非常简单的任务' },
  { value: '2', meaning: '简单任务' },
  { value: '3', meaning: '中等偏小任务' },
  { value: '5', meaning: '中等任务' },
  { value: '8', meaning: '较复杂任务' },
  { value: '13', meaning: '复杂任务' },
  { value: '21', meaning: '非常复杂的任务' },
  { value: '?', meaning: '不确定 / 需要更多信息' },
  { value: '☕', meaning: '需要休息一下' },
];

/**
 * 用户使用手册弹窗
 */
const UserGuide: React.FC<UserGuideProps> = ({ onClose }) => {
  return (
    <div className="guide-overlay" onClick={onClose}>
      <div className="guide-modal" onClick={(e) => e.stopPropagation()}>
        {/* 头部 */}
        <div className="guide-header">
          <div className="guide-header-text">
            <h2>📖 使用手册</h2>
            <p>Planning Poker 快速上手指南</p>
          </div>
          <button className="btn-icon guide-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* 内容区域 */}
        <div className="guide-body">
          {/* 什么是 Planning Poker */}
          <section className="guide-section">
            <h3 className="guide-section-title">什么是 Planning Poker？</h3>
            <p className="guide-intro">
              Planning Poker（估点扑克）是一种敏捷开发中常用的
              <strong>团队协作估算技术</strong>
              。团队成员使用类似斐波那契数列的点数卡片，对需求的工作量进行独立评估，然后同时亮牌。这种方式可以避免「锚定效应」，让每个人都能独立思考并表达自己的判断。
            </p>
          </section>

          {/* 操作步骤 */}
          <section className="guide-section">
            <h3 className="guide-section-title">操作步骤</h3>
            <div className="guide-steps">
              {GUIDE_STEPS.map((step, index) => (
                <div key={index} className="guide-step">
                  <div className="guide-step-number">
                    <span className="step-icon">{step.icon}</span>
                    <span className="step-num">{index + 1}</span>
                  </div>
                  <div className="guide-step-content">
                    <h4>{step.title}</h4>
                    <p>{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 卡片含义 */}
          <section className="guide-section">
            <h3 className="guide-section-title">卡片含义参考</h3>
            <div className="guide-cards-grid">
              {CARD_MEANINGS.map((card) => (
                <div key={card.value} className="guide-card-item">
                  <div className="guide-card-value">{card.value}</div>
                  <span className="guide-card-meaning">{card.meaning}</span>
                </div>
              ))}
            </div>
          </section>

          {/* 小贴士 */}
          <section className="guide-section">
            <h3 className="guide-section-title">💡 小贴士</h3>
            <ul className="guide-tips">
              <li>
                <strong>独立思考：</strong>
                投票前不要讨论具体点数，先让每个人独立判断。
              </li>
              <li>
                <strong>讨论分歧：</strong>
                揭牌后如果分歧较大（一致性低于 60%），建议让投最高和最低的人分别解释理由，然后重新投票。
              </li>
              <li>
                <strong>相对估算：</strong>
                点数表示的是相对复杂度，而非具体工时。可以先找一个基准任务定为 3 或 5 分，其他任务相对估计。
              </li>
              <li>
                <strong>善用问号卡：</strong>
                如果你对需求理解不够，不要随意给分，使用「?」卡片表示你需要更多信息。
              </li>
              <li>
                <strong>Issue 管理：</strong>
                可以提前把本次要估点的所有 Issue 都添加到列表中，按顺序逐个估点，效率更高。
              </li>
            </ul>
          </section>
        </div>

        {/* 底部 */}
        <div className="guide-footer">
          <button className="btn btn-primary" onClick={onClose}>
            我知道了，开始使用
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserGuide;
