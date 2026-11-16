import type { Cell, Game, Player } from "./types";
export const WINNING_LINES = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]] as const;
export function findWinningLines(board: Cell[]): (typeof WINNING_LINES)[number][] {
  return WINNING_LINES.filter(([a, b, c]) => Boolean(board[a]) && board[a] === board[b] && board[a] === board[c]);
}
export function findWinner(board: Cell[]): Player | null {
  const line = findWinningLines(board)[0];
  return line ? board[line[0]] : null;
}
export function playMove(game: Game, index: number): Game {
  if (!Number.isInteger(index) || index < 0 || index > 8) throw new Error("Move index must be between 0 and 8.");
  if (game.status !== "in_progress") throw new Error("This game is already finished.");
  if (game.board[index]) throw new Error("That square is already taken.");
  const board = [...game.board]; board[index] = game.currentPlayer;
  const winner = findWinner(board);
  const status = winner ? "won" : board.every(Boolean) ? "draw" : "in_progress";
  return { ...game, board, winner, status, moves: game.moves + 1, currentPlayer: game.currentPlayer === "X" ? "O" : "X", updatedAt: new Date().toISOString() };
}
