import { NextResponse } from "next/server";
import { gameRepository } from "@/server/repositories/game-repository";
export async function GET() { return NextResponse.json({ data: gameRepository.list() }); }
export async function POST() { return NextResponse.json({ data: gameRepository.create() }, { status: 201 }); }
