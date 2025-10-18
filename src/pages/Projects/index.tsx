import { Navbar } from "../../components/Navbar.js";
import { GameCard } from "../../components/GameCard.js";

export function Projects() {
  return (
    <>
      <h1 class="text-3xl mx-4 my-8">Projects</h1>

      {/* Cards */}
      <div class="m-8">
        <GameCard
          title="Chess"
          description="A multiplayer chess web app built with Rust and Poem-WebSocket, enabling multiplayer gameplay."
          technicalSpecs="Move validation • Real-time multiplayer"
          backgroundImage="/chess-board.png"
          href="/projects/chess"
        />
      </div>
      <div class="m-8">
        <GameCard
          title="Arithmetic Game"
          description="Challenge your mental arithmetic skills in this arithmetic puzzle game."
          technicalSpecs="Dynamic problem generation • Multiplayer leaderboards • Timed solo mode"
          backgroundImage="/stragedy-rush.png"
          href="/projects/arithmetic"
        />
      </div>
      <a
        href="https://altus.deno.dev/projects"
        class="mx-8 my-4 btn btn-success"
      >
        More Projects
      </a>
    </>
  );
}
