import Image from "next/image";
import type { Player } from "@/features/game/types";

type DuckTokenProps = { mark: Player; className?: string };
type BoardDuckTokenProps = { mark: Player; isWinner?: boolean };

export function DuckToken({ mark, className = "" }: DuckTokenProps) {
  return (
    <Image
      aria-hidden="true"
      alt=""
      className={`duck-token ${className}`}
      height={565}
      src={mark === "X" ? "/ducks/pixel-duck-x.png" : "/ducks/pixel-duck-o.png"}
      width={642}
    />
  );
}

export function BoardDuckToken({ mark, isWinner = false }: BoardDuckTokenProps) {
  return (
    <span className={`board-duck ${isWinner ? "board-duck-winner" : ""}`} aria-hidden="true">
      <Image
        alt=""
        className="board-duck-frame board-duck-dive"
        height={408}
        src="/ducks/pixel-duck-dive.png"
        width={597}
      />
      <Image
        alt=""
        className="board-duck-frame board-duck-paddle"
        height={mark === "X" ? 415 : 417}
        src={mark === "X" ? "/ducks/pixel-duck-paddle-x.png" : "/ducks/pixel-duck-paddle-o.png"}
        width={mark === "X" ? 533 : 599}
      />
      <Image
        alt=""
        className="board-duck-frame board-duck-float"
        height={565}
        src={mark === "X" ? "/ducks/pixel-duck-x.png" : "/ducks/pixel-duck-o.png"}
        width={642}
      />
    </span>
  );
}
