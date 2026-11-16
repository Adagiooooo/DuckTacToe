export type Player = "X" | "O";
export type Cell = Player | null;
export type GameStatus = "in_progress" | "won" | "draw";
export interface Game { id: string; board: Cell[]; currentPlayer: Player; status: GameStatus; winner: Player | null; moves: number; createdAt: string; updatedAt: string }
