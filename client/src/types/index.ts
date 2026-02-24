/** 玩家信息 */
export interface Player {
  id: string;
  name: string;
  isHost: boolean;
  isSpectator: boolean;
  hasVoted: boolean;
  vote: string | null;
  /** 揭牌后可见的 proposal 文字 */
  proposal: string | null;
}

/** Issue（待估点项） */
export interface Issue {
  id: string;
  title: string;
  result: number | null;
}

/** 房间状态（服务端同步） */
export interface RoomState {
  id: string;
  players: Player[];
  revealed: boolean;
  votes: Record<string, string>;
  voteCount: number;
  playerCount: number;
  issues: Issue[];
  currentIssueId: string | null;
}
