import { Helmet } from "react-helmet";
import { MdLeaderboard } from "react-icons/md";
import { Leaderboard } from "../../components/Leaderboard.js";

export function Leaderboards() {
  return (
    <>
      <Helmet>
        <title>Leaderboards - My Website</title>
        <meta
          name="description"
          content="View competitive rankings and achievements across games including Chess, Draughts, Arithmetic, and Tetris. Track your progress and compare with other players."
        />
        <meta
          name="keywords"
          content="leaderboards, rankings, competitive gaming, chess, draughts, arithmetic, tetris, achievements, scores"
        />
        <link rel="canonical" href="/leaderboards" />
        <meta property="og:title" content="Leaderboards - My Website" />
        <meta
          property="og:description"
          content="View competitive rankings and achievements across games including Chess, Draughts, Arithmetic, and Tetris. Track your progress and compare with other players."
        />
        <meta property="og:image" content="/logo.png" />
        <meta property="og:url" content="/leaderboards" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Leaderboards - My Website" />
        <meta
          name="twitter:description"
          content="View competitive rankings and achievements across games including Chess, Draughts, Arithmetic, and Tetris. Track your progress and compare with other players."
        />
        <meta name="twitter:image" content="/logo.png" />
      </Helmet>
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <MdLeaderboard />
          Leaderboards
        </h1>
        <p className="mb-8">
          For Chess | Draughts, get at least 1 win to show up on the
          leaderboards
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">Chess Wins/Losses</h2>
            <Leaderboard
              attributes={["chessWins", "chessLosses"]}
              attributeTitles={["Chess Wins", "Chess Losses"]}
            />
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-2">Draughts Wins/Losses</h2>
            <Leaderboard
              attributes={["draughtsWins", "draughtsLosses"]}
              attributeTitles={["Draughts Wins", "Draughts Losses"]}
            />
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-2">Arithmetic Score</h2>
            <Leaderboard
              attributes={["arithmeticScore"]}
              attributeTitles={["Arithmetic Score"]}
            />
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-2">Tetris Score</h2>
            <Leaderboard
              attributes={["tetrisScore"]}
              attributeTitles={["Tetris Score"]}
            />
          </div>
        </div>
      </div>
    </>
  );
}
