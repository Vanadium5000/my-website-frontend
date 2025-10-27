import { MdLeaderboard } from "react-icons/md";
import { Leaderboard } from "../../components/Leaderboard.js";

export function Leaderboards() {
  return (
    <>
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
