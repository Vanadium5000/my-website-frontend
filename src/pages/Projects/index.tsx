// import { GameCard } from "../../components/GameCard.js";
import { GameCard } from "../../components/GameCard";
import { ProjectCard } from "../../components/ProjectCard";
import { FaChessKnight, FaCalculator } from "react-icons/fa";
import { FiBookOpen } from "react-icons/fi";
import { Helmet } from "react-helmet";

export function Projects() {
  return (
    <>
      <Helmet>
        <title>Projects - My Website</title>
        <meta
          name="description"
          content="Explore interactive projects and games including Chess, Arithmetic, Quizspire, and Tetris. Discover engaging web applications built with modern technologies."
        />
        <meta
          name="keywords"
          content="projects, games, interactive, chess, arithmetic, quizspire, tetris, web development"
        />
        <link rel="canonical" href="/projects" />
        <meta property="og:title" content="Projects - My Website" />
        <meta
          property="og:description"
          content="Explore interactive projects and games including Chess, Arithmetic, Quizspire, and Tetris. Discover engaging web applications built with modern technologies."
        />
        <meta property="og:image" content="/logo.png" />
        <meta property="og:url" content="/projects" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Projects - My Website" />
        <meta
          name="twitter:description"
          content="Explore interactive projects and games including Chess, Arithmetic, Quizspire, and Tetris. Discover engaging web applications built with modern technologies."
        />
        <meta name="twitter:image" content="/logo.png" />
      </Helmet>
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
          extraButtons={[
            { label: "Notification Settings", href: "/settings/notifications" },
          ]}
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
          extraButtons={[
            {
              label: "Join or Host Quizspire",
              href: "/projects/quizspire/host",
            },
          ]}
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
