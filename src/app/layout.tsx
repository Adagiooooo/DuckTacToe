import type { Metadata } from "next";
import "@fontsource/press-start-2p/latin-400.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Duck Tac Toe — Quack and Play",
  description: "A friendly game of tic-tac-toe, played with ducks.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
