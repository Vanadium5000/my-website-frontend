// import { GameCard } from "../../components/GameCard.js";
import { GameCard } from "../../components/GameCard";
import { ProjectCard } from "../../components/ProjectCard";
import { FaChessKnight, FaCalculator } from "react-icons/fa";
import { FiBookOpen } from "react-icons/fi";

export function Projects() {
  return (
    <>
      {/* <h1 className="text-3xl font-bold text-center">Projects</h1> */}

      {/* <div className="container mx-auto p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <ProjectCard
            title="Chess"
            description="A multiplayer chess web app built with Rust and Poem-WebSocket, enabling multiplayer gameplay."
            technicalSpecs="Move validation • Real-time multiplayer"
            backgroundImage="/chess-board.png"
            href="/projects/chess"
            icon={<FaChessKnight className="w-20 h-20" />}
          />
          <ProjectCard
            title="Arithmetic Game"
            description="Challenge your mental arithmetic skills in this arithmetic puzzle game."
            technicalSpecs="Dynamic problem generation • Multiplayer leaderboards • Timed solo mode"
            backgroundImage="/stragedy-rush.png"
            href="/projects/arithmetic"
            icon={<FaCalculator className="w-20 h-20" />}
          />
        </div>
        <div className="text-center">
          <a
            href="https://altus.deno.dev/projects"
            className="btn btn-success px-8 py-3"
          >
            More Projects
          </a>
        </div>
      </div> */}

      {/* Commented out old code */}
      <h1 class="text-3xl mx-4 my-8">Projects</h1>

      {/* <div className="grid grid-cols-1 sm:grid-cols-2 gap-6"></div> */}
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
      <div class="m-8">
        <GameCard
          title="Quizspire"
          description="Master your flashcards with various study modes and revision games."
          technicalSpecs="Flashcard decks • Multiple study modes • Progress tracking"
          backgroundImage="/quizspire.png"
          href="/projects/quizspire"
        />
      </div>
      <div class="m-8">
        <GameCard
          title="Tetris"
          description="Classic Tetris game built with PixiJS."
          technicalSpecs="Real-time gameplay • High score tracking"
          backgroundImage="/colorful-tetris.png"
          href="/projects/tetris"
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
