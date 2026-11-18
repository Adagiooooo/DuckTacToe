"use client";
import { useCallback, useEffect, useState } from "react";
import { ArrowRight, Clock3, Crown, RotateCcw, Sparkles, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BoardDuckToken, DuckToken } from "@/features/game/components/duck-token";
import { findWinningLines } from "@/features/game/logic";
import type { Game } from "@/features/game/types";

const SCORE_STORAGE_KEY = "duck-tac-toe-scores";
const SCORE_IDLE_TTL = 24 * 60 * 60 * 1000;

type ScoreState = { X: number; O: number; draws: number };

class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = "ApiError";
  }
}

async function readData<T>(response: Response): Promise<T> {
  const body = await response.json();
  if (!response.ok) throw new ApiError(body?.error?.message ?? "Something went wrong.", response.status);
  return body.data as T;
}

export function GameScreen() {
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [ducksSinking, setDucksSinking] = useState(false);
  const [message, setMessage] = useState("");
  const [score, setScore] = useState<ScoreState>({ X: 0, O: 0, draws: 0 });
  const [scoresLoaded, setScoresLoaded] = useState(false);
  const [lastScoreActivity, setLastScoreActivity] = useState<number | null>(null);
  const [dismissedResultId, setDismissedResultId] = useState<string | null>(null);
  const start = useCallback(async () => {
    setBusy(true);
    setMessage("");
    try {
      setGame(await readData<Game>(await fetch("/api/v1/games", { method: "POST" })));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not start a game.");
    } finally {
      setBusy(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void start();
  }, [start]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(SCORE_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as { score?: ScoreState; lastActivity?: number };
        const validScore = parsed.score && [parsed.score.X, parsed.score.O, parsed.score.draws]
          .every((value) => Number.isInteger(value) && value >= 0);
        const stillActive = typeof parsed.lastActivity === "number"
          && Date.now() - parsed.lastActivity < SCORE_IDLE_TTL;
        if (validScore && stillActive) {
          setScore(parsed.score!);
          setLastScoreActivity(parsed.lastActivity!);
        } else {
          localStorage.removeItem(SCORE_STORAGE_KEY);
        }
      }
    } catch {
      localStorage.removeItem(SCORE_STORAGE_KEY);
    } finally {
      setScoresLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!scoresLoaded) return;
    if (lastScoreActivity === null) {
      localStorage.removeItem(SCORE_STORAGE_KEY);
      return;
    }
    localStorage.setItem(SCORE_STORAGE_KEY, JSON.stringify({ score, lastActivity: lastScoreActivity }));
  }, [score, lastScoreActivity, scoresLoaded]);

  useEffect(() => {
    if (!scoresLoaded || lastScoreActivity === null) return;
    const remaining = lastScoreActivity + SCORE_IDLE_TTL - Date.now();
    if (remaining <= 0) {
      setScore({ X: 0, O: 0, draws: 0 });
      setLastScoreActivity(null);
      return;
    }
    const timer = window.setTimeout(() => {
      setScore({ X: 0, O: 0, draws: 0 });
      setLastScoreActivity(null);
    }, remaining);
    return () => window.clearTimeout(timer);
  }, [lastScoreActivity, scoresLoaded]);

  const gameId = game?.id;
  const gameStatus = game?.status;
  const gameWinner = game?.winner;
  const winningLines: ReturnType<typeof findWinningLines> = game?.status === "won"
    ? findWinningLines(game.board)
    : [];
  useEffect(() => {
    if (!scoresLoaded || !gameId || !gameStatus || gameStatus === "in_progress") return;
    setScore((current) => gameStatus === "draw"
      ? { ...current, draws: current.draws + 1 }
      : { ...current, [gameWinner as "X" | "O"]: current[gameWinner as "X" | "O"] + 1 });
  }, [gameId, gameStatus, gameWinner, scoresLoaded]);

  function resetScore() {
    setScore({ X: 0, O: 0, draws: 0 });
    setLastScoreActivity(null);
  }

  async function beginNewRound() {
    if (busy) return;
    if (game) setDismissedResultId(game.id);
    setBusy(true);
    setMessage("");
    setDucksSinking(true);
    await new Promise((resolve) => window.setTimeout(resolve, 680));
    try {
      setGame(await readData<Game>(await fetch("/api/v1/games", { method: "POST" })));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not start a game.");
    } finally {
      setDucksSinking(false);
      setBusy(false);
    }
  }
  async function move(index: number) {
    if (!game || busy || game.board[index] || game.status !== "in_progress") return;
    setBusy(true);
    setMessage("");
    try {
      setGame(await readData<Game>(await fetch(`/api/v1/games/${game.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ index }),
      })));
      setLastScoreActivity(Date.now());
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        // The server may have restarted since this board was created. Start a
        // fresh round automatically instead of leaving the player stuck.
        try {
          setGame(await readData<Game>(await fetch("/api/v1/games", { method: "POST" })));
        } catch (restartError) {
          setMessage(restartError instanceof Error ? restartError.message : "Could not start a fresh game.");
        }
      } else {
        setMessage(error instanceof Error ? error.message : "Could not play that move.");
      }
    } finally {
      setBusy(false);
    }
  }

  const finished = game?.status !== "in_progress";
  const showResult = !!game && game.status !== "in_progress" && dismissedResultId !== game.id;
  const statusText = !game
    ? "Getting your board ready…"
    : game.status === "won"
      ? `Team ${game.winner} wins the round!`
      : game.status === "draw"
        ? "A perfectly matched draw."
        : `Team ${game.currentPlayer}’s turn`;

  return (
    <main className="page-shell">
      <header className="topbar">
        <a className="brand" href="#" aria-label="Duck Tac Toe home">
          <span className="brand-mark"><DuckToken mark="X"/><DuckToken mark="O"/></span>
          <span>duck <strong>tac toe</strong></span>
        </a>
        <div className="top-note"><span className="live-dot"/> TWO PLAYERS · ONE QUACK</div>
      </header>

      <section className="hero">
        <div className="eyebrow"><Sparkles size={14}/> THE CLASSIC, WITH A LITTLE QUACK</div>
        <h1>Duck Tac Toe</h1>
        <p>Pick your duck. Pick your square. Make your mark.</p>
      </section>

      <section className="play-layout" aria-label="Duck Tac Toe game">
        <div className="game-card">
          <div className="game-card-top">
            <div className="round-label"><span className="round-dot"/> ROUND 01</div>
            <div className="game-clock"><Clock3 size={14}/> JUST FOR FUN</div>
          </div>

          <div className="players-row">
            <div className={`player-card ${game?.currentPlayer === "X" && !finished ? "active x-active" : ""}`}>
              <span className="player-icon x-color"><DuckToken mark="X"/></span>
              <div><span className="player-name">Player one</span><span className="player-caption">TEAM X</span></div>
              <span className="player-score">{score.X}</span>
            </div>
            <span className="versus">VS</span>
            <div className={`player-card right-player ${game?.currentPlayer === "O" && !finished ? "active o-active" : ""}`}>
              <span className="player-score">{score.O}</span>
              <div className="player-info-right"><span className="player-name">Player two</span><span className="player-caption">TEAM O</span></div>
              <span className="player-icon o-color"><DuckToken mark="O"/></span>
            </div>
          </div>

          <div className={`turn-banner ${finished ? "turn-finished" : ""}`} aria-live="polite">
            <span className="turn-indicator">
              {game?.status === "won" ? <Crown size={16}/> : game?.status === "draw" ? <Sparkles size={15}/> : game?.currentPlayer ? <DuckToken mark={game.currentPlayer}/> : <Sparkles size={15}/>}
            </span>
            <strong>{statusText}</strong>
            {game?.status === "in_progress" && <span className="turn-hint">Make it count</span>}
          </div>

          <div className={`board ${ducksSinking ? "is-sinking" : game?.status === "won" ? "is-celebrating" : ""}`} role="grid" aria-label="Duck Tac Toe board">
            {(game?.board ?? Array(9).fill(null)).map((cell, index) => {
              const isWinnerCell = winningLines.some((line) => line.some((winningIndex) => winningIndex === index));
              return (
              <button
                key={index}
                role="gridcell"
                aria-label={`Square ${index + 1}${cell ? `, team ${cell} duck${isWinnerCell ? ", part of the winning line" : ""}` : ", empty"}`}
                className={`square ${cell === "X" ? "square-x" : cell === "O" ? "square-o" : ""} ${isWinnerCell ? "square-winner" : ""}`}
                disabled={!!cell || finished || busy || loading}
                onClick={() => void move(index)}
              >
                {cell && <BoardDuckToken mark={cell} isWinner={isWinnerCell}/>}
              </button>
              );
            })}
          </div>

          {message && <p className="error-message" role="alert">{message}</p>}
          <div className="game-footer">
            <span><span className="footer-pip"/>{game ? `${game.moves} ${game.moves === 1 ? "MOVE" : "MOVES"} PLAYED` : "CONNECTING"}</span>
            <Button variant="ghost" size="sm" onClick={() => void beginNewRound()} disabled={busy}><RotateCcw size={14}/> New round</Button>
          </div>
        </div>

        <aside className="side-column">
          <div className="score-card">
            <div className="aside-heading"><span className="aside-icon trophy-icon"><Trophy size={17}/></span><div><h2>Duck leaderboard</h2><p>Today’s friendly rivalry</p></div><button className="score-reset" type="button" onClick={resetScore}>Reset score</button></div>
            <div className="score-line"><span className="score-symbol coral"><DuckToken mark="X"/></span><span className="score-player">Team X</span><strong>{score.X}<small>W</small></strong></div>
            <div className="score-line"><span className="score-symbol teal"><DuckToken mark="O"/></span><span className="score-player">Team O</span><strong>{score.O}<small>W</small></strong></div>
            <div className="score-divider"/><div className="draw-line"><span>Draws</span><strong>{score.draws}</strong></div>
            <div className="leaderboard-foot"><span>EVERY QUACK COUNTS</span><span className="tiny-stars">✳ ✳ ✳</span></div>
          </div>
          <div className="tip-card"><span className="tip-star"><Sparkles size={16}/></span><div><span className="tip-label">A LITTLE REMINDER</span><p>It’s not about winning.<br/><strong>Okay, maybe a little.</strong></p></div><ArrowRight size={16} className="tip-arrow"/></div>
          <div className="how-card"><h3>How to play</h3><div><span className="step-number">01</span><p>Take turns placing your duck.</p></div><div><span className="step-number">02</span><p>Get three in a row to win.</p></div><div><span className="step-number">03</span><p>Have fun. That’s the whole point.</p></div></div>
        </aside>
      </section>
      <footer className="page-footer"><span>MADE BY JAMES VENTURA</span><span>✳ &nbsp;MAY THE BEST QUACK WIN!</span></footer>

      {showResult && game && (
        <div
          className="celebration-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setDismissedResultId(game.id);
          }}
        >
          <div className="celebration-confetti" aria-hidden="true">
            {Array.from({ length: 14 }, (_, index) => (
              <span
                key={index}
                className={`confetti-piece confetti-color-${index % 5}`}
                style={{ left: `${(index * 41 + 6) % 100}%`, animationDelay: `${(index % 8) * 0.08}s` }}
              />
            ))}
          </div>
          <section
            className={`celebration-dialog ${game.status === "draw" ? "is-draw" : "is-win"}`}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="result-title"
            aria-describedby="result-description"
            onKeyDown={(event) => {
              if (event.key === "Escape") setDismissedResultId(game.id);
            }}
          >
            <button
              className="celebration-close"
              type="button"
              aria-label="Close result"
              autoFocus
              onClick={() => setDismissedResultId(game.id)}
            >×</button>
            <div className="celebration-burst" aria-hidden="true"><Sparkles size={20}/></div>
            <p className="celebration-kicker">{game.status === "won" ? "POND CHAMPIONS" : "ROUND COMPLETE"}</p>
            <div className="celebration-ducks" aria-hidden="true">
              {game.status === "won" && game.winner ? (
                <span className="celebration-duck champion-duck"><DuckToken mark={game.winner}/></span>
              ) : (
                <>
                  <span className="celebration-duck draw-duck draw-duck-x"><DuckToken mark="X"/></span>
                  <span className="celebration-duck draw-duck draw-duck-o"><DuckToken mark="O"/></span>
                </>
              )}
            </div>
            <h2 id="result-title">
              {game.status === "won" ? `Team ${game.winner} wins!` : "It's a duck tie!"}
            </h2>
            <p id="result-description" className="celebration-description">
              {game.status === "won"
                ? "Three in a row! That was a quack-tacular finish."
                : "Nine squares, two great teams, and a perfectly matched pond."}
            </p>
            <div className="celebration-scoreline">
              <span>TEAM X <strong>{score.X}</strong></span>
              <i>·</i>
              <span>TEAM O <strong>{score.O}</strong></span>
              <i>·</i>
              <span>DRAWS <strong>{score.draws}</strong></span>
            </div>
            <Button className="celebration-next" size="lg" onClick={() => void beginNewRound()}>
              <RotateCcw size={17}/> Play another round
            </Button>
            <button className="celebration-back" type="button" onClick={() => setDismissedResultId(game.id)}>
              Take a look at the board
            </button>
          </section>
        </div>
      )}
    </main>
  );
}


