import { NextResponse } from "next/server";
import { playMove } from "@/features/game/logic";
import { gameRepository } from "@/server/repositories/game-repository";
type Context = { params: Promise<{ gameId: string }> };
export async function GET(_request: Request, { params }: Context) {
  const { gameId } = await params; const game = gameRepository.get(gameId);
  return game ? NextResponse.json({ data: game }) : NextResponse.json({ error: { code: "NOT_FOUND", message: "Game not found." } }, { status: 404 });
}
export async function PATCH(request: Request, { params }: Context) {
  const { gameId } = await params; const game = gameRepository.get(gameId);
  if (!game) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Game not found." } }, { status: 404 });
  try { const body = await request.json(); return NextResponse.json({ data: gameRepository.save(playMove(game, body.index)) }); }
  catch (error) { return NextResponse.json({ error: { code: "INVALID_MOVE", message: error instanceof Error ? error.message : "Invalid move." } }, { status: 400 }); }
}
export async function DELETE(_request: Request, { params }: Context) {
  const { gameId } = await params;
  return gameRepository.delete(gameId) ? new Response(null, { status: 204 }) : NextResponse.json({ error: { code: "NOT_FOUND", message: "Game not found." } }, { status: 404 });
}
