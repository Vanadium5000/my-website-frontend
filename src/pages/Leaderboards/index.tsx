import { MdLeaderboard } from "react-icons/md";
import { Leaderboard } from "../../components/Leaderboard.js";

export function Leaderboards() {
  return (
    <>
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
          <MdLeaderboard />
          Leaderboards
        </h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">Chess Scores</h2>
            <Leaderboard
              attributes={["chessWins", "chessLosses"]}
              attributeTitles={["Chess Wins", "Chess Losses"]}
            />
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-2">Draughts Scores</h2>
            <Leaderboard
              attributes={["draughtsWins", "draughtsLosses"]}
              attributeTitles={["Draughts Wins", "Draughts Losses"]}
            />
          </div>
        </div>
      </div>
    </>
  );
}
