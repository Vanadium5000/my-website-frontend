// Frontend: Quizspire Host component with DaisyUI, Tailwind, react-icons, socket integration
// This component handles the host side of a real-time quiz game using WebSockets

import { io } from "socket.io-client";
import { useState, useEffect, useMemo } from "preact/hooks";
import { useLocation } from "preact-iso";
import { api } from "../../../api/client";
import { ProfilePicture } from "../../../components/ProfilePicture";
import {
  FaCopy,
  FaUsers,
  FaPlay,
  FaCog,
  FaTrophy,
  FaClock,
  FaCheck,
  FaTimes,
  FaExclamationTriangle,
  FaArrowLeft,
  FaShare,
  FaCrown,
  FaUser,
} from "react-icons/fa";
import { Helmet } from "react-helmet";

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

interface Player {
  userId: string;
  username: string;
  isHost: boolean;
  isGuest: boolean;
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
  question: ContentElement[];
  options: ContentElement[][];
  timeLimit: number;
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
    isGuest: boolean;
  }>;
}

interface GameEndData {
  reason: string;
  finalScores: Array<{
    userId: string;
    username: string;
    score: number;
    correctAnswers: number;
    isGuest: boolean;
  }>;
  winner: {
    userId: string;
    username: string;
    score: number;
    correctAnswers: number;
    isGuest: boolean;
  };
}

interface LeaderboardEntry {
  userId: string;
  username: string;
  score: number;
  correctAnswers: number;
  isGuest: boolean;
}

interface AnswerFeedback {
  isCorrect: boolean;
  pointsGained: number;
  correctIndex: number;
  selectedIndex: number;
}

type ContentElement = TextContent | MediaContent;

interface TextContent {
  text: string;
  type: "text";
}

interface MediaContent {
  mediaUrl: string;
  type: "media";
}

export function QuizspireHost() {
  const { route, query } = useLocation();

  // Socket and connection state
  const [socket, setSocket] = useState(null);

  // Game phase state
  const [phase, setPhase] = useState<
    "connecting" | "lobby" | "settings" | "playing" | "results" | "ended"
  >("connecting");

  // Game data state
  const [lobby, setLobby] = useState<LobbyState | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<QuestionData | null>(
    null
  );
  const [questionResults, setQuestionResults] =
    useState<QuestionResults | null>(null);
  const [gameEndData, setGameEndData] = useState<GameEndData | null>(null);

  // User authentication state
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [myName, setMyName] = useState<string | null>(null);
  const [myImage, setMyImage] = useState<string | null>(null);

  // UI state
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [playerProfiles, setPlayerProfiles] = useState<Record<string, any>>({});
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [answerFeedback, setAnswerFeedback] = useState<AnswerFeedback | null>(
    null
  );
  const [guestUsername, setGuestUsername] = useState<string>("");

  // Settings state
  const [settings, setSettings] = useState<QuizspireSettings>({
    winCondition: "correct_answers",
    correctAnswersThreshold: 10,
    resetOnIncorrect: false,
    questionTimeLimit: 30,
    allowLateJoin: true,
    hostParticipates: true,
  });

  // Helper functions for logging socket events
  const logSocketEmit = (event: string, data?: any) => {
    console.log(`[SOCKET EMIT] ${event}`, data);
  };

  const logSocketReceive = (event: string, data?: any) => {
    console.log(`[SOCKET RECEIVE] ${event}`, data);
  };

  useEffect(() => {
    async function init() {
      try {
        // Check for existing user session
        const response = await (await api.auth.apiGetSessionList()).json();
        const hasSession = response && response.user;
        if (hasSession) {
          setMyUserId(response.user.id);
          setMyName(response.user.name);
          setMyImage(response.user.image);
        } else {
          console.log("No active session, allowing guest access");
        }

        // Construct socket connection URLs
        const baseUrl = api.baseUrl;
        const fullPath = new URL("/sockets/quizspire", baseUrl).href;
        const transportPath = new URL("sockets/", `${baseUrl}/`).pathname;

        console.log("Using Quizspire socket base URL:", baseUrl);
        console.log("Using Quizspire socket full path:", fullPath);
        console.log("Using Quizspire socket transport path:", transportPath);

        // Initialize socket connection
        const newSocket = io(fullPath, {
          path: transportPath,
          transports: ["websocket", "polling"],
          withCredentials: true,
          tryAllTransports: true,
        });

        setSocket(newSocket);

        // Socket event handlers
        newSocket.on("connect", () => {
          logSocketReceive("connect");
          setPhase("lobby");
          setErrorMessage(null);
          // Reset game state on reconnect
          setLobby(null);
          setCurrentQuestion(null);
          setQuestionResults(null);
          setGameEndData(null);
          setLeaderboard([]);
        });

        newSocket.on("lobby_created", (data) => {
          logSocketReceive("lobby_created", data);
          setLobby(data);
          setPhase("settings");
        });

        newSocket.on("lobby_joined", (data) => {
          logSocketReceive("lobby_joined", data);
          setLobby(data);
          setPhase("settings");
        });

        newSocket.on("lobby_update", async (data: LobbyState) => {
          logSocketReceive("lobby_update", data);
          setLobby(data);
          // Fetch profiles for new players (only for non-guest players)
          for (const player of data.players) {
            if (!player.isGuest && !playerProfiles[player.userId]) {
              try {
                const profileResponse = await api.profile.getProfileByUserId(
                  player.userId
                );
                setPlayerProfiles((prev) => ({
                  ...prev,
                  [player.userId]: profileResponse.data,
                }));
              } catch (error) {
                console.error("Failed to fetch player profile:", error);
              }
            }
          }
        });

        newSocket.on("question", (data: QuestionData) => {
          logSocketReceive("question", data);
          setCurrentQuestion(data);
          setSelectedAnswer(null);
          setTimeLeft(data.timeLimit);
          setPhase("playing");
          setQuestionResults(null);
          setAnswerFeedback(null);
        });

        newSocket.on("answer_feedback", (data: AnswerFeedback) => {
          logSocketReceive("answer_feedback", data);
          setAnswerFeedback(data);
        });

        newSocket.on(
          "leaderboard_update",
          (data: {
            leaderboard: LeaderboardEntry[];
            winCondition: string;
            threshold?: number;
          }) => {
            logSocketReceive("leaderboard_update", data);
            setLeaderboard(data.leaderboard);
          }
        );

        newSocket.on("question_results", (data: QuestionResults) => {
          logSocketReceive("question_results", data);
          setQuestionResults(data);
          setPhase("results");
        });

        newSocket.on("game_ended", (data: GameEndData) => {
          logSocketReceive("game_ended", data);
          setGameEndData(data);
          setPhase("ended");
          setCurrentQuestion(null);
          setQuestionResults(null);
        });

        newSocket.on("kicked", (data: { reason: string }) => {
          logSocketReceive("kicked", data);
          setErrorMessage(`You were kicked: ${data.reason}`);
          setPhase("lobby");
          setLobby(null);
          setCurrentQuestion(null);
          setQuestionResults(null);
          setGameEndData(null);
          setLeaderboard([]);
        });

        newSocket.on("error", (data) => {
          logSocketReceive("error", data);
          setErrorMessage(data.message || "An error occurred");
        });

        newSocket.on("connect_error", (error) => {
          logSocketReceive("connect_error", error);
          setErrorMessage(`Connection error: ${error.message}`);

          // Swap to start with polling on next attempt (allows upgrade to WebSocket later if possible)
          socket.io.opts.transports = ["polling", "websocket"];
        });

        newSocket.on("disconnect", (reason) => {
          logSocketReceive("disconnect", reason);
          setErrorMessage(`Disconnected: ${reason}`);
          setPhase("connecting");
          setLobby(null);
          setCurrentQuestion(null);
          setQuestionResults(null);
          setGameEndData(null);
          setLeaderboard([]);
        });
      } catch (error) {
        console.error("Initialization error:", error);
        setErrorMessage("Failed to initialize the game");
      }
    }

    init();

    // Cleanup socket connection on unmount
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  // Timer effect for question countdown
  useEffect(() => {
    if (timeLeft > 0 && phase === "playing") {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft, phase]);

  // Socket action functions with logging
  const createLobby = (deckId: string) => {
    if (socket && myUserId) {
      logSocketEmit("create_lobby", { deckId, settings });
      socket.emit("create_lobby", { deckId, settings });
    } else {
      setErrorMessage("You must be logged in to create a lobby");
    }
  };

  const joinLobby = (code: string, username?: string) => {
    if (socket) {
      const joinData: any = { code };
      if (username) joinData.username = username;
      logSocketEmit("join_lobby", joinData);
      socket.emit("join_lobby", joinData);
    }
  };

  const startGame = () => {
    if (socket) {
      logSocketEmit("start_game", { settings });
      socket.emit("start_game", { settings });
    }
  };

  const submitAnswer = (selectedIndex: number) => {
    if (socket && selectedAnswer === null) {
      setSelectedAnswer(selectedIndex);
      logSocketEmit("submit_answer", { selectedIndex });
      socket.emit("submit_answer", { selectedIndex });
    }
  };

  const kickPlayer = (userId: string) => {
    if (socket) {
      logSocketEmit("kick_player", { userId });
      socket.emit("kick_player", { userId });
    }
  };

  const leaveLobby = () => {
    if (socket) {
      logSocketEmit("leave_lobby");
      socket.emit("leave_lobby");
      setPhase("lobby");
      setLobby(null);
      setCurrentQuestion(null);
      setQuestionResults(null);
      setGameEndData(null);
      setLeaderboard([]);
    }
  };

  const restartGame = () => {
    if (socket) {
      logSocketEmit("restart_game");
      socket.emit("restart_game");
    }
  };

  // Utility functions
  const copyLobbyCode = async () => {
    if (lobby?.code) {
      try {
        await navigator.clipboard.writeText(lobby.code);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (err) {
        console.error("Failed to copy code:", err);
        setErrorMessage("Failed to copy lobby code");
      }
    }
  };

  // Render functions for content elements
  const renderContentElement = (element: ContentElement) => {
    if (element.type === "text") {
      return <span>{element.text}</span>;
    } else {
      return (
        <img
          src={element.mediaUrl}
          alt="Content"
          className="max-w-full max-h-32 object-contain rounded"
        />
      );
    }
  };

  // Render functions for UI components
  const renderPlayerItem = (
    player: Player,
    showKickButton: boolean = false
  ) => {
    const profile = getPlayerProfile(player.userId);
    return (
      <div
        key={player.userId}
        className={`flex items-center gap-3 p-3 rounded-lg ${
          player.isGuest ? "bg-base-300 border border-info/20" : "bg-base-200"
        }`}
      >
        <ProfilePicture
          name={profile.name}
          image={profile.image}
          widthClass="w-10"
        />
        <div className="flex-1">
          <div className="font-medium flex items-center gap-2">
            {profile.name}
            {player.isHost && <FaCrown className="w-4 h-4 text-warning" />}
            {player.isGuest && <FaUser className="w-4 h-4 text-info" />}
          </div>
          <div className="text-sm text-base-content/70">
            {player.isHost ? "Host" : player.isGuest ? "Guest" : "Player"}
          </div>
        </div>
        {showKickButton && (
          <button
            className="btn btn-ghost btn-sm text-error"
            onClick={() => kickPlayer(player.userId)}
            title="Kick player"
          >
            <FaTimes className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  };

  // Helper function to get player profile data
  const getPlayerProfile = (userId: string) => {
    // For guest users, return their username from lobby data
    const player = lobby?.players?.find((p) => p.userId === userId);
    if (player?.isGuest) {
      return { name: player.username, image: null };
    }
    return playerProfiles[userId] || { name: "Loading...", image: null };
  };

  // Helper function to render form controls for settings (removed, using table now)

  if (phase === "connecting") {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-center min-h-full">
          <div className="text-center">
            <span className="loading loading-spinner loading-lg"></span>
            <p className="mt-4 text-base-content/70">
              Connecting to Quizspire...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Quizspire Host - Create Quiz Games</title>
        <meta
          name="description"
          content="Host interactive quiz games with Quizspire. Create multiplayer quiz sessions, manage players, and track scores in real-time. Perfect for educational gaming and competitive learning."
        />
        <meta
          name="keywords"
          content="quizspire host, quiz games, multiplayer quiz, educational games, real-time scoring"
        />
        <link rel="canonical" href="/projects/quizspire/host" />
        <meta
          property="og:title"
          content="Quizspire Host - Create Quiz Games"
        />
        <meta
          property="og:description"
          content="Host interactive quiz games with Quizspire. Create multiplayer quiz sessions, manage players, and track scores in real-time. Perfect for educational gaming and competitive learning."
        />
        <meta property="og:image" content="/quizspire.png" />
        <meta property="og:url" content="/projects/quizspire/host" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="Quizspire Host - Create Quiz Games"
        />
        <meta
          name="twitter:description"
          content="Host interactive quiz games with Quizspire. Create multiplayer quiz sessions, manage players, and track scores in real-time. Perfect for educational gaming and competitive learning."
        />
        <meta name="twitter:image" content="/quizspire.png" />
      </Helmet>
      <div className="container mx-auto p-4">
        <div className="flex flex-col lg:flex-row gap-8 justify-center">
          {/* Main Content */}
          <div className="card bg-base-100 shadow-xl w-full lg:w-2/3">
            <div className="card-body">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() =>
                      route(
                        (query.referrer &&
                          decodeURIComponent(query.referrer)) ||
                          "/projects/quizspire"
                      )
                    }
                  >
                    <FaArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </button>
                  <h1 className="text-2xl font-bold">Quizspire Host</h1>
                </div>
                {lobby && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-base-content/70">
                      Lobby Code:
                    </span>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={copyLobbyCode}
                    >
                      <FaCopy className="w-4 h-4 mr-2" />
                      {lobby.code}
                    </button>
                    {copySuccess && (
                      <span className="text-sm text-success">Copied!</span>
                    )}
                  </div>
                )}
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div className="alert alert-error mb-4">
                  <FaExclamationTriangle className="h-5 w-5" />
                  <span>
                    {errorMessage} - make sure you've navigated to the page from
                    the correct deck & the deck has valid cards.
                  </span>
                </div>
              )}

              {/* Phase Content */}
              {phase === "lobby" && (
                <div className="text-center py-12">
                  <h2 className="text-xl font-semibold mb-4">
                    Create or Join a Lobby
                  </h2>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                      className="btn btn-primary"
                      onClick={() => createLobby(query.deckId)}
                      disabled={!myUserId}
                    >
                      <FaPlay className="w-4 h-4 mr-2" />
                      Create Lobby
                    </button>
                    <button
                      className="btn btn-outline"
                      onClick={() => {
                        const code = prompt("Enter lobby code:");
                        if (code) {
                          if (!myUserId) {
                            const username = prompt("Enter your username:");
                            if (username) {
                              joinLobby(code, username);
                            }
                          } else {
                            joinLobby(code);
                          }
                        }
                      }}
                    >
                      <FaUsers className="w-4 h-4 mr-2" />
                      Join Lobby
                    </button>
                  </div>
                  {!myUserId && (
                    <p className="text-sm text-base-content/70 mt-4">
                      You can join as a guest, but creating a lobby requires
                      login.
                    </p>
                  )}
                </div>
              )}

              {/* Settings Phase - Configure game parameters */}

              {phase === "settings" && lobby && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">Game Settings</h2>
                  <div className="overflow-x-auto mb-6">
                    <table className="table table-zebra">
                      <thead>
                        <tr>
                          <th>Setting</th>
                          <th>Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="font-medium">Win Condition</td>
                          <td>
                            <select
                              className="select select-bordered select-sm"
                              value={settings.winCondition}
                              onChange={(e) =>
                                setSettings((prev) => ({
                                  ...prev,
                                  winCondition: (e.target as HTMLInputElement)
                                    .value as
                                    | "time"
                                    | "correct_answers"
                                    | "score",
                                }))
                              }
                              disabled={
                                lobby?.players &&
                                !lobby?.players?.find(
                                  (p) => p.userId === myUserId
                                )?.isHost
                              }
                            >
                              <option value="correct_answers">
                                Correct Answers
                              </option>
                              <option value="score">Score Threshold</option>
                              <option value="time">Time Limit</option>
                            </select>
                          </td>
                        </tr>
                        {settings.winCondition === "correct_answers" ? (
                          <tr>
                            <td className="font-medium">
                              Correct Answers Threshold
                            </td>
                            <td>
                              <input
                                type="number"
                                className="input input-bordered input-sm"
                                value={settings.correctAnswersThreshold}
                                onChange={(e) =>
                                  setSettings((prev) => ({
                                    ...prev,
                                    correctAnswersThreshold:
                                      parseInt(
                                        (e.target as HTMLInputElement).value
                                      ) || 10,
                                  }))
                                }
                                min="1"
                                disabled={
                                  lobby?.players &&
                                  !lobby?.players?.find(
                                    (p) => p.userId === myUserId
                                  )?.isHost
                                }
                              />
                            </td>
                          </tr>
                        ) : settings.winCondition === "score" ? (
                          <tr>
                            <td className="font-medium">Score Threshold</td>
                            <td>
                              <input
                                type="number"
                                className="input input-bordered input-sm"
                                value={settings.scoreThreshold}
                                onChange={(e) =>
                                  setSettings((prev) => ({
                                    ...prev,
                                    scoreThreshold:
                                      parseInt(
                                        (e.target as HTMLInputElement).value
                                      ) || 1000,
                                  }))
                                }
                                min="1"
                                disabled={
                                  lobby?.players &&
                                  !lobby?.players?.find(
                                    (p) => p.userId === myUserId
                                  )?.isHost
                                }
                              />
                            </td>
                          </tr>
                        ) : (
                          <tr>
                            <td className="font-medium">
                              Time Limit (seconds)
                            </td>
                            <td>
                              <input
                                type="number"
                                className="input input-bordered input-sm"
                                value={settings.timeLimit}
                                onChange={(e) =>
                                  setSettings((prev) => ({
                                    ...prev,
                                    timeLimit:
                                      parseInt(
                                        (e.target as HTMLInputElement).value
                                      ) || 300,
                                  }))
                                }
                                min="60"
                                disabled={
                                  lobby?.players &&
                                  !lobby?.players?.find(
                                    (p) => p.userId === myUserId
                                  )?.isHost
                                }
                              />
                            </td>
                          </tr>
                        )}
                        <tr>
                          <td className="font-medium">
                            Question Time Limit (seconds)
                          </td>
                          <td>
                            <input
                              type="number"
                              className="input input-bordered input-sm"
                              value={settings.questionTimeLimit}
                              onChange={(e) =>
                                setSettings((prev) => ({
                                  ...prev,
                                  questionTimeLimit:
                                    parseInt(
                                      (e.target as HTMLInputElement).value
                                    ) || 30,
                                }))
                              }
                              min="5"
                              max="120"
                              disabled={
                                lobby?.players &&
                                !lobby?.players?.find(
                                  (p) => p.userId === myUserId
                                )?.isHost
                              }
                            />
                          </td>
                        </tr>
                        <tr>
                          <td className="font-medium">
                            Reset on Incorrect Answer
                          </td>
                          <td>
                            <input
                              type="checkbox"
                              className="toggle toggle-sm"
                              checked={settings.resetOnIncorrect}
                              onChange={(e) =>
                                setSettings((prev) => ({
                                  ...prev,
                                  resetOnIncorrect: (
                                    e.target as HTMLInputElement
                                  ).checked,
                                }))
                              }
                              disabled={
                                lobby?.players &&
                                !lobby?.players?.find(
                                  (p) => p.userId === myUserId
                                )?.isHost
                              }
                            />
                          </td>
                        </tr>
                        <tr>
                          <td className="font-medium">Allow Late Join</td>
                          <td>
                            <input
                              type="checkbox"
                              className="toggle toggle-sm"
                              checked={settings.allowLateJoin}
                              onChange={(e) =>
                                setSettings((prev) => ({
                                  ...prev,
                                  allowLateJoin: (e.target as HTMLInputElement)
                                    .checked,
                                }))
                              }
                              disabled={
                                lobby?.players &&
                                !lobby?.players?.find(
                                  (p) => p.userId === myUserId
                                )?.isHost
                              }
                            />
                          </td>
                        </tr>
                        <tr>
                          <td className="font-medium">Host Participates</td>
                          <td>
                            <input
                              type="checkbox"
                              className="toggle toggle-sm"
                              checked={settings.hostParticipates}
                              onChange={(e) =>
                                setSettings((prev) => ({
                                  ...prev,
                                  hostParticipates: (
                                    e.target as HTMLInputElement
                                  ).checked,
                                }))
                              }
                              disabled={
                                lobby?.players &&
                                !lobby?.players?.find(
                                  (p) => p.userId === myUserId
                                )?.isHost
                              }
                            />
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="alert alert-info mb-4">
                    <FaExclamationTriangle className="h-5 w-5" />
                    <div>
                      <div className="font-bold">Host Participates</div>
                      <div>
                        When disabled, the game ends immediately regardless of
                        whether the host has answered the current question.
                      </div>
                    </div>
                  </div>

                  {lobby?.players &&
                  lobby?.players?.find((p) => p.userId === myUserId)?.isHost ? (
                    <div className="flex justify-center">
                      <button
                        className="btn btn-success btn-lg"
                        onClick={startGame}
                        disabled={
                          lobby?.players &&
                          lobby?.players?.length <
                            (settings.hostParticipates ? 1 : 2)
                        }
                      >
                        <FaPlay className="w-5 h-5 mr-2" />
                        Start Game
                      </button>
                    </div>
                  ) : (
                    <div className="text-center text-base-content/70">
                      <FaCog className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>Waiting for host to start the game...</p>
                    </div>
                  )}
                </div>
              )}

              {/* Playing Phase - Display question and answer options */}
              {phase === "playing" && currentQuestion && (
                <div>
                  <div className="text-center mb-6">
                    <div className="text-2xl font-bold mb-2">
                      Question {currentQuestion.questionIndex + 1}
                    </div>
                    <div className="text-lg text-warning font-semibold">
                      Time Left: {timeLeft}s
                    </div>
                    {answerFeedback && (
                      <div
                        className={`alert ${
                          answerFeedback.isCorrect
                            ? "alert-success"
                            : "alert-error"
                        } mt-4`}
                      >
                        <span>
                          {answerFeedback.isCorrect ? "Correct!" : "Incorrect!"}
                          Points gained: {answerFeedback.pointsGained}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mb-8 p-6 bg-base-200 rounded-lg">
                    <div className="text-center">
                      {currentQuestion.question.map((element, index) => (
                        <div key={index} className="mb-2">
                          {renderContentElement(element)}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {currentQuestion.options.map((option, index) => (
                      <button
                        key={index}
                        className={`btn btn-lg h-auto py-4 ${
                          selectedAnswer === index
                            ? answerFeedback?.correctIndex === index
                              ? "btn-success"
                              : "btn-error"
                            : selectedAnswer !== null
                            ? answerFeedback?.correctIndex === index
                              ? "btn-success"
                              : "btn-disabled"
                            : "btn-outline"
                        }`}
                        onClick={() => submitAnswer(index)}
                        disabled={selectedAnswer !== null}
                      >
                        <div className="text-left w-full">
                          {option.map((element, i) => (
                            <div key={i} className="mb-1">
                              {renderContentElement(element)}
                            </div>
                          ))}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Results Phase - Show question results and player answers */}

              {phase === "results" && questionResults && (
                <div>
                  <h2 className="text-xl font-semibold mb-4 text-center">
                    Question {questionResults.questionIndex + 1} Results
                  </h2>

                  <div className="mb-6 p-4 bg-base-200 rounded-lg">
                    <div className="text-center">
                      <div className="text-lg font-semibold mb-2">
                        Correct Answer:
                      </div>
                      <div className="text-success font-bold">
                        {currentQuestion?.options[
                          questionResults.correctIndex
                        ]?.map((element, i) => (
                          <div key={i}>{renderContentElement(element)}</div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {questionResults.results.map((result) => {
                      const profile = getPlayerProfile(result.userId);
                      return (
                        <div
                          key={result.userId}
                          className={`flex items-center justify-between p-3 rounded-lg ${
                            result.isGuest
                              ? "bg-base-300 border border-info/20"
                              : "bg-base-200"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <ProfilePicture
                              name={profile.name}
                              image={profile.image}
                              widthClass="w-8"
                            />
                            <span className="font-medium flex items-center gap-2">
                              {profile.name}
                              {result.isGuest && (
                                <FaUser className="w-3 h-3 text-info" />
                              )}
                            </span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span
                              className={`font-bold ${
                                result.isCorrect ? "text-success" : "text-error"
                              }`}
                            >
                              {result.isCorrect ? (
                                <>
                                  <FaCheck className="inline w-4 h-4 mr-1" />{" "}
                                  Correct
                                </>
                              ) : (
                                <>
                                  <FaTimes className="inline w-4 h-4 mr-1" />{" "}
                                  Incorrect
                                </>
                              )}
                            </span>
                            <span className="text-sm text-base-content/70">
                              Score: {result.score}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Ended Phase - Display final results and winner */}
              {phase === "ended" && gameEndData && (
                <div className="text-center">
                  <div className="mb-6">
                    <FaTrophy className="w-16 h-16 text-warning mx-auto mb-4" />
                    <h2 className="text-2xl font-bold mb-2">Game Over!</h2>
                    <p className="text-base-content/70">{gameEndData.reason}</p>
                  </div>

                  <div className="mb-6">
                    <h3 className="text-xl font-semibold mb-4">Winner</h3>
                    <div className="flex items-center justify-center gap-4 p-4 bg-warning/10 rounded-lg">
                      <ProfilePicture
                        name={getPlayerProfile(gameEndData.winner.userId).name}
                        image={
                          getPlayerProfile(gameEndData.winner.userId).image
                        }
                        widthClass="w-12"
                      />
                      <div>
                        <div className="text-lg font-bold flex items-center gap-2">
                          {gameEndData.winner.username}
                          {gameEndData.winner.isGuest && (
                            <FaUser className="w-4 h-4 text-info" />
                          )}
                        </div>
                        <div className="text-sm text-base-content/70">
                          {gameEndData.winner.score} points •{" "}
                          {gameEndData.winner.correctAnswers} correct
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-4">Final Scores</h3>
                    <div className="space-y-2">
                      {gameEndData.finalScores.map((score, index) => {
                        const profile = getPlayerProfile(score.userId);
                        return (
                          <div
                            key={score.userId}
                            className={`flex items-center justify-between p-3 rounded-lg ${
                              score.isGuest
                                ? "bg-base-300 border border-info/20"
                                : "bg-base-200"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-lg w-8">
                                {index + 1}.
                              </span>
                              <ProfilePicture
                                name={profile.name}
                                image={profile.image}
                                widthClass="w-8"
                              />
                              <span className="font-medium flex items-center gap-2">
                                {profile.name}
                                {score.isGuest && (
                                  <FaUser className="w-3 h-3 text-info" />
                                )}
                              </span>
                            </div>
                            <div className="text-right">
                              <div className="font-bold">{score.score} pts</div>
                              <div className="text-sm text-base-content/70">
                                {score.correctAnswers} correct
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex gap-4 justify-center">
                    {lobby?.players &&
                      lobby?.players?.find((p) => p.userId === myUserId)
                        ?.isHost && (
                        <button
                          className="btn btn-success"
                          onClick={restartGame}
                        >
                          <FaPlay className="w-4 h-4 mr-2" />
                          Restart Game
                        </button>
                      )}
                    <button
                      className="btn btn-primary"
                      onClick={() =>
                        route(
                          (query.referrer &&
                            decodeURIComponent(query.referrer)) ||
                            "/projects/quizspire"
                        )
                      }
                    >
                      <FaArrowLeft className="w-4 h-4 mr-2" />
                      Back to Quizspire
                    </button>
                  </div>
                </div>
              )}

              {/* Sidebar - Player list and leaderboard */}
            </div>
          </div>

          {/* Sidebar */}
          <div className="card bg-base-100 shadow-xl w-full lg:w-1/3">
            <div className="card-body">
              <h2 className="card-title mb-4">
                <FaUsers className="w-5 h-5 mr-2" />
                Players ({lobby?.players?.length || 0})
              </h2>

              {lobby && (
                <div className="space-y-3">
                  {lobby?.players &&
                    lobby.players.map((player) =>
                      renderPlayerItem(
                        player,
                        lobby?.players &&
                          lobby?.players?.find((p) => p.userId === myUserId)
                            ?.isHost &&
                          player.userId !== myUserId
                      )
                    )}
                </div>
              )}

              {/* Leaderboard - Shows current standings during gameplay */}
              {leaderboard.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <FaTrophy className="w-4 h-4 text-warning" />
                    Leaderboard
                  </h3>
                  <div className="space-y-2">
                    {leaderboard.map((entry, index) => {
                      const profile = getPlayerProfile(entry.userId);
                      return (
                        <div
                          key={entry.userId}
                          className={`flex items-center justify-between p-2 rounded ${
                            entry.isGuest
                              ? "bg-base-300 border border-info/20"
                              : "bg-base-200"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-bold w-6">{index + 1}.</span>
                            <ProfilePicture
                              name={profile.name}
                              image={profile.image}
                              widthClass="w-6"
                            />
                            <span className="text-sm flex items-center gap-1">
                              {profile.name}
                              {entry.isGuest && (
                                <FaUser className="w-3 h-3 text-info" />
                              )}
                            </span>
                          </div>
                          <div className="text-right text-sm">
                            <div className="font-bold">{entry.score}</div>
                            <div className="text-base-content/70">
                              {entry.correctAnswers} correct
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {lobby && lobby?.players && lobby.players.length < 2 && (
                <div className="alert alert-info mt-4">
                  <FaShare className="w-4 h-4" />
                  <span>Share the lobby code with friends to join!</span>
                </div>
              )}

              {phase !== "ended" && (
                <div className="mt-6">
                  <button
                    className="btn btn-outline btn-error w-full"
                    onClick={leaveLobby}
                  >
                    <FaArrowLeft className="w-4 h-4 mr-2" />
                    Leave Lobby
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
