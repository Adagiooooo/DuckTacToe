import { randomUUID } from "crypto";
import type { Game } from "@/features/game/types";
// Keep the in-memory adapter alive across Next.js development hot reloads. A
// module-local Map is recreated when route modules refresh, leaving the client
// with game IDs that no longer exist.
const globalForGames = globalThis as typeof globalThis & {
  duckTacToeGames?: Map<string, Game>;
};
const games = globalForGames.duckTacToeGames ??= new Map<string, Game>();
export const gameRepository = {
  list(): Game[] { return [...games.values()].sort((a,b) => b.updatedAt.localeCompare(a.updatedAt)); },
  get(id: string): Game | undefined { return games.get(id); },
  create(): Game {
    const now = new Date().toISOString();
    const game: Game = { id: randomUUID(), board: Array(9).fill(null), currentPlayer: "X", status: "in_progress", winner: null, moves: 0, createdAt: now, updatedAt: now };
    games.set(game.id, game); return game;
  },
  save(game: Game): Game { games.set(game.id, game); return game; },
  delete(id: string): boolean { return games.delete(id); },
};
