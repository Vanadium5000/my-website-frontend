import { useEffect } from "preact/hooks";
import { api } from "../../api/client";
import { useLocation } from "preact-iso";

export function Tetris({
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
