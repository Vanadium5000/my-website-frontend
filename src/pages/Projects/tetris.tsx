import { useEffect } from "preact/hooks";
import { api } from "../../api/client";
import { useLocation } from "preact-iso";
import { Helmet } from "react-helmet-async";

export function Tetris({
  intermediateCallback,
}: {
  intermediateCallback?: () => Promise<void>;
}) {
  return (
    <>
      <Helmet>
        <title>Tetris - Classic Block Puzzle Game</title>
        <meta
          name="description"
          content="Play the classic Tetris block puzzle game built with PixiJS. Experience real-time gameplay with high score tracking and smooth controls."
        />
        <meta
          name="keywords"
          content="tetris, puzzle game, block game, pixijs, classic game, arcade"
        />
        <link rel="canonical" href="/projects/tetris" />
        <meta
          property="og:title"
          content="Tetris - Classic Block Puzzle Game"
        />
        <meta
          property="og:description"
          content="Play the classic Tetris block puzzle game built with PixiJS. Experience real-time gameplay with high score tracking and smooth controls."
        />
        <meta property="og:image" content="/colorful-tetris.png" />
        <meta property="og:url" content="/projects/tetris" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="Tetris - Classic Block Puzzle Game"
        />
        <meta
          name="twitter:description"
          content="Play the classic Tetris block puzzle game built with PixiJS. Experience real-time gameplay with high score tracking and smooth controls."
        />
        <meta name="twitter:image" content="/colorful-tetris.png" />
      </Helmet>
      <TetrisGame intermediateCallback={intermediateCallback} />
    </>
  );
}

function TetrisGame({
  intermediateCallback,
}: {
  intermediateCallback?: () => Promise<void>;
}) {
  const { query } = useLocation();

  if (!query.reloaded) {
    const url = new URL(window.location.href);
    url.searchParams.set("reloaded", "true");
    window.location.href = url.toString();

    return (
      <p
        onClick={() => {
          const url = new URL(window.location.href);
          url.searchParams.set("reloaded", "true");
          window.location.href = url.toString();
        }}
      >
        Click To Manually Load Tetris
      </p>
    );
  }

  useEffect(() => {
    (window as any).tetrisConfig = {
      logHighScore,
      intermediateCallback,
    };

    const script = document.createElement("script");
    script.src = "/dist/bundle.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      console.log("Unmounting Tetris");

      // Call unload method if available
      if ((window as any).tetrisUnload) {
        console.log("Found & running Tetris unload function");

        (window as any).tetrisUnload();
      }

      // Remove the script element
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  async function logHighScore(num: number) {
    const result = (await api.profile.postProfileLogTetris({ finalScore: num }))
      .data;
    console.log("Update Tetris high score message:", result.message);
  }

  return (
    <div class="h-full">
      <canvas id="game-canvas" class="mx-auto mt-4"></canvas>
    </div>
  );
}
