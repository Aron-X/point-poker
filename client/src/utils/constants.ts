/** 可选的估点卡片值 */
export const CARD_VALUES = ['0', '1', '2', '3', '5', '8', '13', '21', '?', '☕'];

/** 服务器地址 */
export const SERVER_URL = (() => {
  const env = import.meta.env.APP_ENV || import.meta.env.MODE;
  if (env === 'production') {
    return 'https://aron-point-poker.up.railway.app';
  }
  return import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';
})();

/** 头像背景色列表 */
export const AVATAR_COLORS = [
  '#4A90D9',
  '#E74C3C',
  '#2ECC71',
  '#F39C12',
  '#9B59B6',
  '#1ABC9C',
  '#E67E22',
  '#3498DB',
  '#E91E63',
  '#00BCD4',
];

/**
 * 根据名称生成一致的头像颜色
 */
export function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}
