export type Player = 'B' | 'W';

export interface Point {
  x: number; // 0 to 18 (column A to T)
  y: number; // 0 to 18 (row 19 to 1)
}

export type BoardState = (Player | null)[][];

export interface GoMove {
  x: number;
  y: number;
  color: Player;
  pass?: boolean;
  moveNumber: number;
  coordinate: string;
  capturedByMove?: { B: number; W: number };
  commentary?: string;
}

export interface CandidateMove {
  move: string;
  reason: string;
  point?: Point | null;
}

export interface GoAnalysisResponse {
  next_move: string;
  win_rate_estimate: string;
  score_lead_estimate: string;
  top_3_candidates: CandidateMove[];
  commentary: string;
}

export interface GamePreset {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  moves: GoMove[];
  playerToMove: Player;
  focusPoint?: Point;
}
