import { io } from "socket.io-client";
import { useState, useEffect } from "preact/hooks";
import { api } from "../../../api/client";
import { ProfilePicture } from "../../../components/ProfilePicture";
import {
  FaCopy,
  FaUsers,
  FaClock,
  FaPlay,
  FaExclamationTriangle,
  FaCheck,
  FaTimes,
  FaTrophy,
  FaCrown,
  FaUser,
  FaQuestion,
  FaList,
  FaMedal,
} from "react-icons/fa";

interface Player {
  userId: string;
  username: string;
  isHost: boolean;
}

interface QuizspireSettings {
  winCondition: "time" | "correct_answers" | "score";
  timeLimit?: number;
  correctAnswersThreshold?: number;
  scoreThreshold?: number;
  resetOnIncorrect: boolean;
  questionTimeLimit: number;
  allowLateJoin: boolean;
  hostParticipates: boolean;
}

interface LobbyState {
  code: string;
  players: Player[];
  status: "waiting" | "starting" | "playing" | "ended";
  deckId: string;
  settings: QuizspireSettings;
}

interface QuestionData {
  questionIndex: number;
  question: Array<
    { text: string; type: "text" } | { mediaUrl: string; type: "media" }
  >;
  options: Array<
    Array<{ text: string; type: "text" } | { mediaUrl: string; type: "media" }>
  >;
  timeLimit: number;
}

interface AnswerFeedback {
  isCorrect: boolean;
  pointsGained: number;
  correctIndex: number;
  selectedIndex: number;
}

interface QuestionResults {
  questionIndex: number;
  correctIndex: number;
  results: Array<{
    userId: string;
    username: string;
    selectedIndex: number;
    isCorrect: boolean;
    timeTaken: number | null;
    score: number;
  }>;
}

interface LeaderboardEntry {
  userId: string;
  username: string;
  score: number;
  correctAnswers: number;
}

interface LeaderboardUpdate {
  leaderboard: LeaderboardEntry[];
  winCondition: "time" | "correct_answers" | "score";
  threshold?: number;
}

interface GameEndData {
  reason: string;
  finalScores: LeaderboardEntry[];
  winner: LeaderboardEntry;
}

export function QuizspireJoin() {
  const [socket, setSocket] = useState<any>(null);
  const [phase, setPhase] = useState<
    "connecting" | "joining" | "waiting" | "playing" | "results" | "ended"
  >("connecting");
  const [lobbyCode, setLobbyCode] = useState("");
  const [username, setUsername] = useState("");
  const [lobbyState, setLobbyState] = useState<LobbyState | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<QuestionData | null>(
    null
  );
  const [timeLeft, setTimeLeft] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answerFeedback, setAnswerFeedback] = useState<AnswerFeedback | null>(
    null
  );
  const [questionResults, setQuestionResults] =
    useState<QuestionResults | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [gameEndData, setGameEndData] = useState<GameEndData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [myName, setMyName] = useState<string | null>(null);
  const [myImage, setMyImage] = useState<string | null>(null);
  const [playerProfiles, setPlayerProfiles] = useState<Record<string, any>>({});

  useEffect(() => {
    async function init() {
      try {
        console.log("[QUIZSPIRE] [JOIN] Initializing join session...");
        const response = await (await api.auth.apiGetSessionList()).json();
        if (response?.user) {
          setMyUserId(response.user.id);
          setMyName(response.user.name);
          setMyImage(response.user.image);
          console.log(
            "[QUIZSPIRE] [JOIN] Session authenticated for user:",
            response.user.name
          );
        } else {
          console.log(
            "[QUIZSPIRE] [JOIN] No authenticated session - guest mode enabled"
          );
        }
      } catch (error) {
        console.error("[QUIZSPIRE] [JOIN] Failed to get session:", error);
      }
    }
    init();
  }, []);

  /**
   * Establishes socket connection for joining a quiz game
   * Sets up all event listeners for game flow and real-time updates
   */
  const connectSocket = () => {
    console.log(
      "[QUIZSPIRE] [JOIN] Establishing socket connection for joining game"
    );

    // Construct WebSocket URL and path for Socket.IO connection
    const baseUrl = api.baseUrl;
    const fullPath = new URL("/sockets/quizspire", baseUrl).href;
    const transportPath = new URL("sockets/", `${baseUrl}/`).pathname;

    const newSocket = io(fullPath, {
      path: transportPath,
      transports: ["websocket", "polling"], // Fallback to polling if WebSocket fails
      withCredentials: true, // Include cookies for authentication
    });

    // Socket event handlers for join-specific events

    /**
     * Handles successful socket connection
     * Transitions to joining phase to prepare for lobby entry
     */
    newSocket.on("connect", () => {
      console.log(
        `[QUIZSPIRE] [JOIN] Socket connected successfully - ID: ${newSocket.id}`
      );
      setPhase("joining");
      setErrorMessage(null);
      // Automatically attempt to join the lobby once connected
      if (lobbyCode.trim()) {
        const emitData = {
          code: lobbyCode.trim().toUpperCase(),
          username: username.trim() || undefined,
        };
        console.log(
          `[QUIZSPIRE] [JOIN] Attempting to join lobby: ${emitData.code} as ${
            emitData.username || "guest"
          }`
        );
        console.log(
          `[QUIZSPIRE] [JOIN] SENT join_lobby:`,
          JSON.stringify(emitData, null, 2)
        );
        newSocket.emit("join_lobby", emitData);
      } else {
        console.warn(
          "[QUIZSPIRE] [JOIN] Cannot join lobby - lobby code is empty"
        );
      }
    });

    /**
     * Handles successful lobby join confirmation
     * Updates lobby code and transitions to waiting phase
     */
    newSocket.on("lobby_joined", (data: { code: string }) => {
      console.log(`[QUIZSPIRE] [JOIN] Successfully joined lobby: ${data.code}`);
      console.log(
        `[QUIZSPIRE] [JOIN] RECEIVED lobby_joined:`,
        JSON.stringify(data, null, 2)
      );
      setLobbyCode(data.code);
      setPhase("waiting");
    });

    /**
     * Handles lobby state updates (player joins/leaves, settings changes)
     * Fetches and caches player profiles for display optimization
     */
    newSocket.on("lobby_update", async (data: LobbyState) => {
      console.log(
        `[QUIZSPIRE] [JOIN] Lobby update - Players: ${data.players.length}, Status: ${data.status}`
      );
      console.log(
        `[QUIZSPIRE] [JOIN] RECEIVED lobby_update:`,
        JSON.stringify(data, null, 2)
      );
      setLobbyState(data);

      // Fetch and cache profiles for new players to avoid repeated API calls
      for (const player of data.players) {
        if (!playerProfiles[player.userId] && player.userId !== myUserId) {
          try {
            console.log(
              `[QUIZSPIRE] [JOIN] Fetching profile for player: ${player.username}`
            );
            const profileResponse = await api.profile.getProfileByUserId(
              player.userId
            );
            setPlayerProfiles((prev) => ({
              ...prev,
              [player.userId]: profileResponse.data,
            }));
          } catch (error) {
            console.error(
              `[QUIZSPIRE] [JOIN] Failed to fetch profile for ${player.username}:`,
              error
            );
          }
        }
      }
    });

    /**
     * Handles new question delivery from server
     * Resets UI state for new question and starts timer
     */
    newSocket.on("question", (data: QuestionData) => {
      console.log(
        `[QUIZSPIRE] [JOIN] Received question ${data.questionIndex + 1} with ${
          data.timeLimit
        }s timer`
      );
      console.log(
        `[QUIZSPIRE] [JOIN] RECEIVED question:`,
        JSON.stringify(data, null, 2)
      );
      setCurrentQuestion(data);
      setTimeLeft(data.timeLimit);
      setSelectedAnswer(null);
      setAnswerFeedback(null);
      setQuestionResults(null);
      setPhase("playing");
    });

    /**
     * Handles immediate feedback after answer submission
     * Shows correct/incorrect status and points gained
     */
    newSocket.on("answer_feedback", (data: AnswerFeedback) => {
      console.log(
        `[QUIZSPIRE] [JOIN] Answer feedback - Correct: ${data.isCorrect}, Points: ${data.pointsGained}`
      );
      console.log(
        `[QUIZSPIRE] [JOIN] RECEIVED answer_feedback:`,
        JSON.stringify(data, null, 2)
      );
      setAnswerFeedback(data);
    });

    /**
     * Handles question results showing all players' answers
     * Transitions to results phase for leaderboard viewing
     */
    newSocket.on("question_results", (data: QuestionResults) => {
      console.log(
        `[QUIZSPIRE] [JOIN] Question ${data.questionIndex + 1} results received`
      );
      console.log(
        `[QUIZSPIRE] [JOIN] RECEIVED question_results:`,
        JSON.stringify(data, null, 2)
      );
      setQuestionResults(data);
      setPhase("results");
    });

    /**
     * Handles leaderboard updates during gameplay
     * Updates real-time standings for all players
     */
    newSocket.on("leaderboard_update", (data: LeaderboardUpdate) => {
      console.log(
        `[QUIZSPIRE] [JOIN] Leaderboard update - ${data.leaderboard.length} players`
      );
      console.log(
        `[QUIZSPIRE] [JOIN] RECEIVED leaderboard_update:`,
        JSON.stringify(data, null, 2)
      );
      setLeaderboard(data.leaderboard);
    });

    /**
     * Handles game end with final results and winner
     * Transitions to ended phase showing final standings
     */
    newSocket.on("game_ended", (data: GameEndData) => {
      console.log(
        `[QUIZSPIRE] [JOIN] Game ended - Winner: ${data.winner.username}, Reason: ${data.reason}`
      );
      console.log(
        `[QUIZSPIRE] [JOIN] RECEIVED game_ended:`,
        JSON.stringify(data, null, 2)
      );
      setGameEndData(data);
      setPhase("ended");
    });

    /**
     * Handles being kicked from the lobby by host
     * Shows kick reason and returns to connecting phase
     */
    newSocket.on("kicked", (data: { reason: string }) => {
      console.warn(
        `[QUIZSPIRE] [JOIN] Kicked from lobby - Reason: ${data.reason}`
      );
      console.warn(
        `[QUIZSPIRE] [JOIN] RECEIVED kicked:`,
        JSON.stringify(data, null, 2)
      );
      setErrorMessage(`You were kicked: ${data.reason}`);
      setPhase("connecting");
    });

    /**
     * Handles server-side errors
     * Displays error message and logs for debugging
     */
    newSocket.on("error", (data: { message: string }) => {
      console.error(
        `[QUIZSPIRE] [JOIN] Socket error received: ${data.message}`
      );
      console.error(
        `[QUIZSPIRE] [JOIN] RECEIVED error:`,
        JSON.stringify(data, null, 2)
      );
      setErrorMessage(data.message);
    });

    /**
     * Handles socket disconnection
     * Updates UI and attempts reconnection logic could be added here
     */
    newSocket.on("disconnect", (reason) => {
      console.warn(
        `[QUIZSPIRE] [JOIN] Socket disconnected - Reason: ${reason}`
      );
      console.warn(
        `[QUIZSPIRE] [JOIN] RECEIVED disconnect - Reason: ${reason}`
      );
      setErrorMessage("Disconnected from server");
      setPhase("connecting");
    });

    setSocket(newSocket);
  };

  /**
   * Attempts to join a lobby with the provided code
   * Validates input and emits join_lobby event to server
   */
  const joinLobby = () => {
    if (!socket || !lobbyCode.trim()) {
      console.warn(
        "[QUIZSPIRE] [JOIN] Cannot join lobby - missing socket or lobby code"
      );
      return;
    }

    const emitData = {
      code: lobbyCode.trim().toUpperCase(),
      username: username.trim() || undefined,
    };
    console.log(
      `[QUIZSPIRE] [JOIN] Attempting to join lobby: ${emitData.code} as ${
        emitData.username || "guest"
      }`
    );
    console.log(
      `[QUIZSPIRE] [JOIN] SENT join_lobby:`,
      JSON.stringify(emitData, null, 2)
    );

    socket.emit("join_lobby", emitData);
  };

  /**
   * Submits the player's answer for the current question
   * Prevents multiple submissions and sends answer to server
   */
  const submitAnswer = (selectedIndex: number) => {
    if (!socket || selectedAnswer !== null) {
      console.warn(
        "[QUIZSPIRE] [JOIN] Cannot submit answer - socket missing or already answered"
      );
      return;
    }

    const emitData = { selectedIndex };
    console.log(
      `[QUIZSPIRE] [JOIN] Submitting answer: Option ${selectedIndex + 1}`
    );
    console.log(
      `[QUIZSPIRE] [JOIN] SENT submit_answer:`,
      JSON.stringify(emitData, null, 2)
    );
    setSelectedAnswer(selectedIndex);
    socket.emit("submit_answer", emitData);
  };

  /**
   * Renders question/answer content elements (text or media)
   * Handles both text strings and media URLs for rich content display
   */
  const renderContentElement = (element: any) => {
    if (element.type === "text") {
      return <span>{element.text}</span>;
    } else if (element.type === "media") {
      return (
        <img
          src={element.mediaUrl}
          alt="Media"
          className="max-w-full h-auto rounded"
        />
      );
    }
    return null;
  };

  /**
   * Formats seconds into MM:SS display format
   * Used for question timers and time displays
   */
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  /**
   * Retrieves cached player profile information
   * Returns current user's profile or cached profile for other players
   * Falls back to loading state for uncached profiles
   */
  const getPlayerProfile = (userId: string) => {
    if (userId === myUserId) {
      return { name: myName || "You", image: myImage };
    }
    return playerProfiles[userId] || { name: "Loading...", image: null };
  };

  if (phase === "connecting") {
    return (
      <div className="container mx-auto p-4 max-w-md">
        <h1 className="text-3xl font-bold mb-8 text-center">
          Join Quizspire Game
        </h1>
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Enter Lobby Code</h2>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Lobby Code</span>
              </label>
              <input
                type="text"
                placeholder="ABC123"
                className="input input-bordered"
                value={lobbyCode}
                onInput={(e) =>
                  setLobbyCode(
                    (e.target as HTMLInputElement).value.toUpperCase()
                  )
                }
                maxLength={6}
              />
            </div>
            {!myUserId && (
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Username (optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="Your name"
                  className="input input-bordered"
                  value={username}
                  onInput={(e) =>
                    setUsername((e.target as HTMLInputElement).value)
                  }
                />
              </div>
            )}
            <div className="card-actions justify-end">
              <button
                className="btn btn-primary"
                onClick={connectSocket}
                disabled={!lobbyCode.trim()}
              >
                Connect & Join
              </button>
            </div>
          </div>
        </div>
        {errorMessage && (
          <div className="alert alert-error mt-4">
            <FaExclamationTriangle className="h-5 w-5" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>
    );
  }

  if (phase === "joining") {
    return (
      <div className="container mx-auto p-4 max-w-md text-center">
        <h1 className="text-3xl font-bold mb-8">Joining Lobby...</h1>
        <div className="loading loading-spinner loading-lg"></div>
        <p className="mt-4">Connecting to lobby {lobbyCode}...</p>
      </div>
    );
  }

  if (phase === "waiting" && lobbyState) {
    return (
      <div className="container mx-auto p-4 max-w-2xl">
        <h1 className="text-3xl font-bold mb-8 text-center">
          Waiting for Game to Start
        </h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Lobby Info */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title">
                <FaUsers className="h-5 w-5" />
                Lobby: {lobbyState.code}
              </h2>
              <div className="flex items-center gap-2 mb-4">
                <FaCopy
                  className="h-4 w-4 cursor-pointer"
                  onClick={() => navigator.clipboard.writeText(lobbyState.code)}
                />
                <span className="text-sm opacity-70">Click to copy code</span>
              </div>
              <div className="stats stats-vertical lg:stats-horizontal shadow">
                <div className="stat">
                  <div className="stat-title">Players</div>
                  <div className="stat-value">{lobbyState.players.length}</div>
                </div>
                <div className="stat">
                  <div className="stat-title">Status</div>
                  <div className="stat-value text-primary">
                    {lobbyState.status}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Players */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title">Players</h2>
              <div className="space-y-2">
                {lobbyState.players.map((player) => {
                  const profile = getPlayerProfile(player.userId);
                  return (
                    <div
                      key={player.userId}
                      className="flex items-center gap-3 p-2 rounded-lg bg-base-200"
                    >
                      <ProfilePicture
                        name={profile.name}
                        image={profile.image}
                        widthClass="w-8"
                      />
                      <div className="flex-1">
                        <div className="font-semibold">{profile.name}</div>
                        {player.isHost && (
                          <div className="badge badge-primary">Host</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Game Settings */}
        <div className="card bg-base-100 shadow-xl mt-8">
          <div className="card-body">
            <h2 className="card-title">Game Settings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="stat">
                <div className="stat-title">Win Condition</div>
                <div className="stat-value text-sm">
                  {lobbyState.settings.winCondition.replace("_", " ")}
                </div>
              </div>
              <div className="stat">
                <div className="stat-title">Question Time</div>
                <div className="stat-value">
                  {lobbyState.settings.questionTimeLimit}s
                </div>
              </div>
              <div className="stat">
                <div className="stat-title">Late Join</div>
                <div className="stat-value">
                  {lobbyState.settings.allowLateJoin ? "Yes" : "No"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "playing" && currentQuestion) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold">
                Question {currentQuestion.questionIndex + 1}
              </h1>
              <div className="flex items-center gap-2">
                <FaClock className="h-5 w-5" />
                <span className="text-xl font-mono">
                  {formatTime(timeLeft)}
                </span>
              </div>
            </div>

            <div className="mb-8 p-6 bg-base-200 rounded-lg">
              <div className="text-lg">
                {currentQuestion.question.map((element, index) => (
                  <span key={index}>{renderContentElement(element)}</span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  className={`btn btn-lg h-auto p-4 ${
                    selectedAnswer === index
                      ? answerFeedback
                        ? answerFeedback.isCorrect &&
                          answerFeedback.correctIndex === index
                          ? "btn-success"
                          : answerFeedback.correctIndex === index
                          ? "btn-success"
                          : "btn-error"
                        : "btn-primary"
                      : answerFeedback && answerFeedback.correctIndex === index
                      ? "btn-success"
                      : "btn-outline"
                  }`}
                  onClick={() => submitAnswer(index)}
                  disabled={selectedAnswer !== null}
                >
                  <span className="text-left">
                    {option.map((element, i) => (
                      <span key={i}>{renderContentElement(element)}</span>
                    ))}
                  </span>
                </button>
              ))}
            </div>

            {answerFeedback && (
              <div
                className={`alert mt-6 ${
                  answerFeedback.isCorrect ? "alert-success" : "alert-error"
                }`}
              >
                {answerFeedback.isCorrect ? (
                  <FaCheck className="h-5 w-5" />
                ) : (
                  <FaTimes className="h-5 w-5" />
                )}
                <span>
                  {answerFeedback.isCorrect ? "Correct!" : "Incorrect!"}
                  {answerFeedback.pointsGained > 0 &&
                    ` (+${answerFeedback.pointsGained} points)`}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (phase === "results" && questionResults) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h1 className="text-2xl font-bold mb-6">
              Question {questionResults.questionIndex + 1} Results
            </h1>

            <div className="overflow-x-auto">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th>Player</th>
                    <th>Answer</th>
                    <th>Time</th>
                    <th>Points</th>
                    <th>Result</th>
                  </tr>
                </thead>
                <tbody>
                  {questionResults.results.map((result) => {
                    const profile = getPlayerProfile(result.userId);
                    return (
                      <tr key={result.userId}>
                        <td>
                          <div className="flex items-center gap-2">
                            <ProfilePicture
                              name={profile.name}
                              image={profile.image}
                              widthClass="w-6"
                            />
                            <span>{profile.name}</span>
                          </div>
                        </td>
                        <td>
                          {result.selectedIndex === -1
                            ? "No answer"
                            : `Option ${result.selectedIndex + 1}`}
                        </td>
                        <td>
                          {result.timeTaken
                            ? `${(result.timeTaken / 1000).toFixed(1)}s`
                            : "N/A"}
                        </td>
                        <td>{result.score}</td>
                        <td>
                          {result.isCorrect ? (
                            <FaCheck className="h-5 w-5 text-success" />
                          ) : (
                            <FaTimes className="h-5 w-5 text-error" />
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "ended" && gameEndData) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body text-center">
            <FaTrophy className="h-16 w-16 mx-auto text-warning mb-4" />
            <h1 className="text-3xl font-bold mb-4">Game Over!</h1>
            <p className="text-lg mb-6">
              {gameEndData.reason.replace("_", " ")}
            </p>

            <div className="mb-8">
              <h2 className="text-xl font-bold mb-4">Winner</h2>
              <div className="flex items-center justify-center gap-4">
                <ProfilePicture
                  name={getPlayerProfile(gameEndData.winner.userId).name}
                  image={getPlayerProfile(gameEndData.winner.userId).image}
                  widthClass="w-12"
                />
                <div>
                  <div className="text-lg font-bold">
                    {gameEndData.winner.username}
                  </div>
                  <div className="text-sm opacity-70">
                    {gameEndData.winner.score} points,{" "}
                    {gameEndData.winner.correctAnswers} correct
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Player</th>
                    <th>Score</th>
                    <th>Correct Answers</th>
                  </tr>
                </thead>
                <tbody>
                  {gameEndData.finalScores.map((entry, index) => {
                    const profile = getPlayerProfile(entry.userId);
                    return (
                      <tr key={entry.userId}>
                        <td>
                          {index === 0 && (
                            <FaCrown className="h-5 w-5 text-warning" />
                          )}
                          {index + 1}
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <ProfilePicture
                              name={profile.name}
                              image={profile.image}
                              widthClass="w-6"
                            />
                            <span>{entry.username}</span>
                          </div>
                        </td>
                        <td>{entry.score}</td>
                        <td>{entry.correctAnswers}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 text-center">
      <div className="loading loading-spinner loading-lg"></div>
      <p className="mt-4">Loading...</p>
    </div>
  );
}
