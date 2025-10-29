import { io } from "socket.io-client";
import { useState, useEffect } from "preact/hooks";
import { useRoute } from "preact-iso";
import { api } from "../../../api/client.js";
import { ProfilePicture } from "../../../components/ProfilePicture.js";
import {
  FaPlay,
  FaUsers,
  FaCog,
  FaCopy,
  FaUserMinus,
  FaTrophy,
  FaClock,
  FaCheck,
  FaTimes,
  FaExclamationTriangle,
  FaSpinner,
  FaRocket,
  FaGamepad,
  FaCrown,
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

export function QuizspireHost() {
  const route = useRoute();
  const id = route?.params?.id as string;
  const [socket, setSocket] = useState<any>(null);
  const [phase, setPhase] = useState<"connecting" | "lobby" | "game" | "ended">(
    "connecting"
  );
  const [lobby, setLobby] = useState<LobbyState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [myName, setMyName] = useState<string | null>(null);
  const [myImage, setMyImage] = useState<string | null>(null);
  const [settings, setSettings] = useState<QuizspireSettings>({
    winCondition: "correct_answers",
    correctAnswersThreshold: 10,
    resetOnIncorrect: false,
    questionTimeLimit: 15,
    allowLateJoin: false,
    hostParticipates: true,
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        // Get user session for authentication
        console.log("[QUIZSPIRE] [HOST] Initializing host session...");
        const response = await (await api.auth.apiGetSessionList()).json();
        if (!response || !response.user) {
          console.log(
            "[QUIZSPIRE] [HOST] No valid session found, redirecting to login"
          );
          window.location.href = "/login";
          return;
        }
        setMyUserId(response.user.id);
        setMyName(response.user.name);
        setMyImage(response.user.image);
        console.log(
          "[QUIZSPIRE] [HOST] Session authenticated for user:",
          response.user.name
        );

        // Deck ID comes from URL, no need to fetch decks

        // Setup socket connection for real-time game management
        // Constructs WebSocket URL and path for Socket.IO connection
        const baseUrl = api.baseUrl;
        const fullPath = new URL("/sockets/quizspire", baseUrl).href;
        const transportPath = new URL("sockets/", `${baseUrl}/`).pathname;

        console.log(
          "[QUIZSPIRE] [HOST] Establishing socket connection to:",
          fullPath
        );
        const newSocket = io(fullPath, {
          path: transportPath,
          transports: ["websocket", "polling"], // Fallback to polling if WebSocket fails
          withCredentials: true, // Include cookies for authentication
        });

        setSocket(newSocket);

        // Socket event handlers for host-specific events

        /**
         * Handles successful socket connection
         * Transitions from connecting phase to lobby phase
         */
        newSocket.on("connect", () => {
          console.log(
            `[QUIZSPIRE] [HOST] Socket connected successfully - ID: ${newSocket.id}`
          );
          setPhase("lobby");
          setError(null);
        });

        /**
         * Handles lobby creation confirmation from server
         * Initializes lobby state with generated code and default settings
         */
        newSocket.on("lobby_created", (data: { code: string }) => {
          console.log(
            `[QUIZSPIRE] [HOST] Lobby created with code: ${data.code}`
          );
          console.log(
            `[QUIZSPIRE] [HOST] RECEIVED lobby_created:`,
            JSON.stringify(data, null, 2)
          );
          setLobby({
            code: data.code,
            players: [],
            status: "waiting",
            deckId: "",
            settings: settings,
          });
        });

        /**
         * Handles lobby state updates (player joins/leaves, status changes)
         * Updates local lobby state to reflect current server state
         */
        newSocket.on("lobby_update", (data: LobbyState) => {
          console.log(
            `[QUIZSPIRE] [HOST] Lobby update - Players: ${data.players.length}, Status: ${data.status}`
          );
          console.log(
            `[QUIZSPIRE] [HOST] RECEIVED lobby_update:`,
            JSON.stringify(data, null, 2)
          );
          setLobby(data);
        });

        /**
         * Handles server-side errors
         * Displays error message to user and logs for debugging
         */
        newSocket.on("error", (data: { message: string }) => {
          console.error(
            `[QUIZSPIRE] [HOST] Socket error received: ${data.message}`
          );
          console.error(
            `[QUIZSPIRE] [HOST] RECEIVED error:`,
            JSON.stringify(data, null, 2)
          );
          setError(data.message);
        });

        /**
         * Handles socket disconnection
         * Updates UI to show disconnected state
         */
        newSocket.on("disconnect", (reason) => {
          console.warn(
            `[QUIZSPIRE] [HOST] Socket disconnected - Reason: ${reason}`
          );
          console.warn(
            `[QUIZSPIRE] [HOST] RECEIVED disconnect - Reason: ${reason}`
          );
          setError("Disconnected from server");
        });
      } catch (error) {
        console.error("[QUIZSPIRE] [HOST] Initialization error:", error);
        setError("Failed to initialize");
      }
    }

    init();

    // Cleanup: disconnect socket on component unmount
    return () => {
      if (socket) {
        console.log("[QUIZSPIRE] [HOST] Cleaning up socket connection");
        socket.disconnect();
      }
    };
  }, []);

  /**
   * Creates a new lobby with the specified deck and settings
   * Emits create_lobby event to server with deck ID and game configuration
   */
  const createLobby = () => {
    if (!socket || !id) {
      console.warn(
        "[QUIZSPIRE] [HOST] Cannot create lobby - socket or deck ID missing"
      );
      return;
    }

    const emitData = {
      deckId: id,
      settings: settings,
    };
    console.log(`[QUIZSPIRE] [HOST] Creating lobby for deck: ${id}`);
    console.log(
      `[QUIZSPIRE] [HOST] SENT create_lobby:`,
      JSON.stringify(emitData, null, 2)
    );
    socket.emit("create_lobby", emitData);
  };

  /**
   * Starts the game for all players in the lobby
   * Only available when lobby status is 'waiting'
   */
  const startGame = () => {
    if (!socket) {
      console.warn(
        "[QUIZSPIRE] [HOST] Cannot start game - no socket connection"
      );
      return;
    }
    console.log("[QUIZSPIRE] [HOST] Starting game for lobby");
    console.log(`[QUIZSPIRE] [HOST] SENT start_game: {} (no data)`);
    socket.emit("start_game");
  };

  /**
   * Removes a player from the lobby
   * Host-only action to kick disruptive players
   */
  const kickPlayer = (userId: string) => {
    if (!socket) {
      console.warn(
        "[QUIZSPIRE] [HOST] Cannot kick player - no socket connection"
      );
      return;
    }
    const emitData = { userId };
    console.log(`[QUIZSPIRE] [HOST] Kicking player: ${userId}`);
    console.log(
      `[QUIZSPIRE] [HOST] SENT kick_player:`,
      JSON.stringify(emitData, null, 2)
    );
    socket.emit("kick_player", emitData);
  };

  /**
   * Copies the lobby code to clipboard for easy sharing
   * Provides visual feedback when copy succeeds
   */
  const copyCode = async () => {
    if (!lobby?.code) {
      console.warn(
        "[QUIZSPIRE] [HOST] Cannot copy code - no lobby code available"
      );
      return;
    }
    try {
      await navigator.clipboard.writeText(lobby.code);
      console.log(
        `[QUIZSPIRE] [HOST] Lobby code copied to clipboard: ${lobby.code}`
      );
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error("[QUIZSPIRE] [HOST] Failed to copy lobby code:", err);
    }
  };

  /**
   * Updates a specific game setting
   * Used by form controls to modify lobby configuration before creation
   */
  const updateSetting = (key: keyof QuizspireSettings, value: any) => {
    console.log(`[QUIZSPIRE] [HOST] Updating setting ${key} to:`, value);
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  if (phase === "connecting") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-base-100 to-secondary/10 flex items-center justify-center p-4">
        <div className="card bg-base-100 shadow-2xl max-w-md w-full">
          <div className="card-body text-center">
            <div className="loading loading-spinner loading-lg text-primary mx-auto mb-4"></div>
            <h2 className="card-title justify-center text-2xl">
              Connecting to Quizspire
            </h2>
            <p className="text-base-content/70">
              Setting up your game session...
            </p>
            <div className="divider"></div>
            <div className="flex justify-center gap-2">
              <div className="status status-primary animate-pulse"></div>
              <span className="text-sm">Initializing</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-base-100 to-accent/5">
      <div className="container mx-auto p-4 max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
            Host Quizspire Game
          </h1>
          <p className="text-base-content/70">
            Create and manage your quiz game session
          </p>
        </div>

        {error && (
          <div className="alert alert-error shadow-lg mb-6 animate-bounce">
            <FaExclamationTriangle className="h-5 w-5" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {!lobby ? (
          // Lobby Creation Phase
          <div className="card bg-base-100 shadow-2xl max-w-2xl mx-auto border border-primary/20 animate-fade-in">
            <div className="card-body">
              <div className="flex items-center gap-3 mb-4">
                <FaRocket className="text-primary text-2xl animate-pulse" />
                <h2 className="card-title text-2xl">Create New Lobby</h2>
              </div>

              <div className="alert alert-info mb-6 shadow-lg">
                <FaGamepad className="h-5 w-5" />
                <div>
                  <div className="font-semibold">Game Configuration</div>
                  <div className="text-sm">
                    Hosting game with deck ID:{" "}
                    <kbd className="kbd kbd-sm">{id}</kbd>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">
                      Win Condition
                    </span>
                  </label>
                  <select
                    className="select select-bordered select-primary"
                    value={settings.winCondition}
                    onChange={(e) =>
                      updateSetting(
                        "winCondition",
                        (e.target as HTMLSelectElement).value
                      )
                    }
                  >
                    <option value="correct_answers">🎯 Correct Answers</option>
                    <option value="score">🏆 Score</option>
                    <option value="time">⏱️ Time Limit</option>
                  </select>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">
                      Question Time
                    </span>
                  </label>
                  <input
                    type="number"
                    className="input input-bordered input-primary"
                    value={settings.questionTimeLimit}
                    onChange={(e) =>
                      updateSetting(
                        "questionTimeLimit",
                        parseInt((e.target as HTMLInputElement).value)
                      )
                    }
                    min="5"
                    max="60"
                  />
                  <div className="label">
                    <span className="label-text-alt text-base-content/60">
                      Seconds per question
                    </span>
                  </div>
                </div>
              </div>

              {settings.winCondition === "correct_answers" && (
                <div className="form-control mb-4">
                  <label className="label">
                    <span className="label-text">
                      Correct Answers Threshold
                    </span>
                  </label>
                  <input
                    type="number"
                    className="input input-bordered"
                    value={settings.correctAnswersThreshold}
                    onChange={(e) =>
                      updateSetting(
                        "correctAnswersThreshold",
                        parseInt((e.target as HTMLInputElement).value)
                      )
                    }
                    min="1"
                  />
                </div>
              )}

              {settings.winCondition === "score" && (
                <div className="form-control mb-4">
                  <label className="label">
                    <span className="label-text">Score Threshold</span>
                  </label>
                  <input
                    type="number"
                    className="input input-bordered"
                    value={settings.scoreThreshold}
                    onChange={(e) =>
                      updateSetting(
                        "scoreThreshold",
                        parseInt((e.target as HTMLInputElement).value)
                      )
                    }
                    min="1"
                  />
                </div>
              )}

              {settings.winCondition === "time" && (
                <div className="form-control mb-4">
                  <label className="label">
                    <span className="label-text">Time Limit (seconds)</span>
                  </label>
                  <input
                    type="number"
                    className="input input-bordered"
                    value={settings.timeLimit}
                    onChange={(e) =>
                      updateSetting(
                        "timeLimit",
                        parseInt((e.target as HTMLInputElement).value)
                      )
                    }
                    min="60"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="form-control">
                  <label className="cursor-pointer label justify-start gap-3">
                    <input
                      type="checkbox"
                      className="toggle toggle-info"
                      checked={settings.allowLateJoin}
                      onChange={(e) =>
                        updateSetting(
                          "allowLateJoin",
                          (e.target as HTMLInputElement).checked
                        )
                      }
                    />
                    <div>
                      <span className="label-text font-semibold">
                        Allow Late Join
                      </span>
                      <p className="text-xs text-base-content/60">
                        Players can join after game starts
                      </p>
                    </div>
                  </label>
                </div>

                <div className="form-control">
                  <label className="cursor-pointer label justify-start gap-3">
                    <input
                      type="checkbox"
                      className="toggle toggle-secondary"
                      checked={settings.hostParticipates}
                      onChange={(e) =>
                        updateSetting(
                          "hostParticipates",
                          (e.target as HTMLInputElement).checked
                        )
                      }
                    />
                    <div>
                      <span className="label-text font-semibold">
                        Host Participates
                      </span>
                      <p className="text-xs text-base-content/60">
                        You play as a regular player
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="card-actions justify-end">
                <button
                  className="btn btn-primary btn-lg gap-2 hover:scale-105 transition-transform"
                  onClick={createLobby}
                  disabled={!id}
                >
                  <FaRocket className="h-5 w-5" />
                  Create Lobby
                </button>
              </div>
            </div>
          </div>
        ) : (
          // Lobby Management Phase
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
            {/* Main Lobby Info */}
            <div className="lg:col-span-2">
              <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="card-title">Lobby: {lobby.code}</h2>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={copyCode}
                    >
                      <FaCopy className="h-4 w-4 mr-2" />
                      {copySuccess ? "Copied!" : "Copy Code"}
                    </button>
                  </div>

                  <div className="stats stats-vertical md:stats-horizontal shadow mb-4">
                    <div className="stat">
                      <div className="stat-figure text-primary">
                        <FaUsers className="h-8 w-8" />
                      </div>
                      <div className="stat-title">Players</div>
                      <div className="stat-value">{lobby.players.length}</div>
                    </div>
                    <div className="stat">
                      <div className="stat-figure text-secondary">
                        <FaCog className="h-8 w-8" />
                      </div>
                      <div className="stat-title">Status</div>
                      <div className="stat-value text-sm">{lobby.status}</div>
                    </div>
                  </div>

                  {lobby.status === "waiting" && (
                    <div className="card-actions justify-end">
                      <button
                        className="btn btn-success"
                        onClick={startGame}
                        disabled={lobby.players.length < 1}
                      >
                        <FaPlay className="h-4 w-4 mr-2" />
                        Start Game
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Players List */}
            <div className="card bg-base-100 shadow-2xl border border-secondary/20 lg:col-span-1">
              <div className="card-body">
                <div className="flex items-center gap-3 mb-4">
                  <FaUsers className="text-secondary text-xl animate-pulse" />
                  <h3 className="card-title">
                    Players ({lobby.players.length})
                  </h3>
                </div>
                <div className="space-y-3">
                  {lobby.players.map((player) => (
                    <div
                      key={player.userId}
                      className="flex items-center justify-between p-3 bg-gradient-to-r from-base-200 to-base-300 rounded-xl hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center gap-3">
                        <ProfilePicture
                          name={player.username}
                          image={null} // TODO: Fetch player images
                          widthClass="w-10"
                        />
                        <div>
                          <div className="font-semibold">{player.username}</div>
                          {player.isHost && (
                            <div className="badge badge-primary badge-sm gap-1">
                              <FaCrown className="h-3 w-3" />
                              Host
                            </div>
                          )}
                        </div>
                      </div>
                      {player.userId !== myUserId && (
                        <button
                          className="btn btn-ghost btn-sm text-error hover:bg-error/10 tooltip tooltip-left"
                          data-tip="Remove player"
                          onClick={() => kickPlayer(player.userId)}
                        >
                          <FaUserMinus className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
