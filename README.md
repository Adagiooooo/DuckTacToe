# Duck Tac Toe

A two-player Tic-Tac-Toe web application with little duck tokens, victory wiggles, and a waddle-away new-round transition, built with Next.js App Router, React 19, TypeScript, Tailwind CSS v4, and shadcn/ui-compatible components.

## Start locally

Install dependencies with `npm install`, then run `npm run dev` and open `http://localhost:3000`.

## Project organization

- `src/app`: App Router pages, global styles, and REST route handlers.
- `src/app/api/v1`: versioned HTTP API.
- `src/features/game`: game types, rule logic, duck token, and game UI grouped by product feature.
- `src/components/ui`: reusable shadcn/ui-style primitives.
- `src/server/repositories`: server-side data access adapter.
- `src/lib`: shared utilities.

## REST API

- `GET /api/v1/games` — list games.
- `POST /api/v1/games` — create a game (`201`, `{ data: Game }`).
- `GET /api/v1/games/:gameId` — fetch a game.
- `PATCH /api/v1/games/:gameId` — place a move with JSON `{ "index": 0 }` (indexes 0–8).
- `DELETE /api/v1/games/:gameId` — delete a game.

Successful responses use `{ "data": ... }`. Errors use `{ "error": { "code", "message" } }`.

## Persistence

The repository currently uses an in-memory Map so the starter runs without external services. Game records disappear on server restart and are not shared across server instances. Replace `src/server/repositories/game-repository.ts` with a database adapter before deploying a durable or horizontally scaled service.

