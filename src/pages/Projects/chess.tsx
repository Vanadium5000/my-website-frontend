// Frontend: Enhanced ChessGame component with DaisyUI, Tailwind, react-icons, sidebar info, utilities, improved functionality

import { io } from "socket.io-client";
import { useState, useEffect, useMemo } from "preact/hooks";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import { api } from "../../api/client.js"; // Assuming this is the OpenAPI-generated client
import { ProfilePicture } from "../../components/ProfilePicture.js";
import {
  FaCopy,
  FaChessPawn,
  FaChessKing,
  FaClock,
  FaUser,
  FaExclamationTriangle,
  FaHandshake,
  FaFlag,
  FaHourglassHalf,
} from "react-icons/fa";
import { Helmet } from "react-helmet";

export function ChessGame() {
  const chess = useMemo(() => new Chess(), []); // Stable chess instance
  const [fen, setFen] = useState(chess.fen());
  const [yourColor, setYourColor] = useState(null);
  const [opponent, setOpponent] = useState(null);
  const [status, setStatus] = useState("Connecting...");
  const [pending, setPending] = useState(false);
  const [socket, setSocket] = useState(null);
  const [phase, setPhase] = useState("connecting");
  const [biddingTime, setBiddingTime] = useState(60);
  const [whiteTime, setWhiteTime] = useState(0);
  const [blackTime, setBlackTime] = useState(0);
  const [bidSent, setBidSent] = useState(false);
  const [biddingCountdown, setBiddingCountdown] = useState(null);
  const [myUserId, setMyUserId] = useState(null);
  const [myName, setMyName] = useState(null);
  const [myImage, setMyImage] = useState(null);
  const [opponentUser, setOpponentUser] = useState(null);
  const [winnerUser, setWinnerUser] = useState(null);
  const [drawOfferUser, setDrawOfferUser] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [drawOfferPending, setDrawOfferPending] = useState(false);
  const [opponentDrawOffer, setOpponentDrawOffer] = useState(null);
  const [showDrawModal, setShowDrawModal] = useState(false);

  // Derived draggable state
  const [draggable, setDraggable] = useState(false);
  // console.log("Draggable:", draggable);

  useEffect(() => {
    setDraggable(
      phase === "playing" &&
        opponent !== null &&
        yourColor !== null &&
        !pending &&
        isYourTurn()
    );
  }, [phase, opponent, yourColor, pending, fen]);

  const isYourTurn = () => {
    if (!yourColor) return false;
    const turn = chess.turn();
    return (
      (turn === "w" && yourColor === "white") ||
      (turn === "b" && yourColor === "black")
    );
  };

  useEffect(() => {
    async function init() {
      try {
        const response = await (await api.auth.apiGetSessionList()).json();
        if (!response || !response.user) {
          console.warn("No active session, redirecting to login");
          window.location.href = "/login";
          return;
        }
        setMyUserId(response.user.id);
        setMyName(response.user.name);
        setMyImage(response.user.image);

        const baseUrl = api.baseUrl;
        // Paths not beginning with / with be added to baseUrl, those beginning with / will replace every after the main host
        const fullPath = new URL("/sockets/chess", baseUrl).href;
        const transportPath = new URL("sockets/", `${baseUrl}/`).pathname;

        console.log("Using Chess socket base URL:", baseUrl);
        console.log("Using Chess socket full path:", fullPath);
        console.log("Using Chess socket transport path:", transportPath);

        const newSocket = io(fullPath, {
          path: transportPath,
          transports: ["websocket", "polling"],
          withCredentials: true,
        });

        setSocket(newSocket);

        newSocket.on("connect", () => {
          setPhase("connecting");
          setStatus("Connected, joining game...");
        });

        newSocket.on("waiting", () => {
          setPhase("waiting");
          setStatus("Waiting for opponent...");
        });

        newSocket.on("paired", async (data) => {
          console.log("Received paired message:", data);
          try {
            const profileResponse = await api.profile.getProfileByUserId(
              data.opponent
            );
            setOpponentUser(profileResponse.data);
            setOpponent(data.opponent);
            setPhase("bidding");
            setBidSent(false);
            setBiddingCountdown(10); // Start countdown at 10 seconds
            setStatus(
              `Paired with ${profileResponse.data.name}. Bid your preferred game time (min 60s):`
            );
          } catch (error) {
            console.error("Failed to fetch opponent profile:", error);
            setOpponent(data.opponent);
            setPhase("bidding");
            setBidSent(false);
            setBiddingCountdown(10); // Start countdown at 10 seconds
            setStatus(
              `Paired with opponent. Bid your preferred game time (min 60s):`
            );
          }
        });

        newSocket.on("start", async (data) => {
          console.log("Received start message:", data);
          chess.load(data.fen);
          setFen(chess.fen());
          setYourColor(data.your_color);
          setOpponent(data.opponent);
          setWhiteTime(data.whiteTime);
          setBlackTime(data.blackTime);
          setPhase("playing");
          setBiddingCountdown(null); // Clear countdown when game starts
          try {
            const profileResponse = await api.profile.getProfileByUserId(
              data.opponent
            );
            setOpponentUser(profileResponse.data);
            setStatus(
              `Playing as ${data.your_color} against ${profileResponse.data.name}`
            );
          } catch (error) {
            console.error("Failed to fetch opponent profile:", error);
            setStatus(`Playing as ${data.your_color} against opponent`);
          }
          console.log(
            `Game started. Your color: ${
              data.your_color
            }, Turn: ${chess.turn()}`
          );
        });

        newSocket.on("time_update", (data) => {
          setWhiteTime(data.whiteTime);
          setBlackTime(data.blackTime);
        });

        newSocket.on("opponent_disconnected", (data) => {
          console.log("Received opponent_disconnected message:", data);
          setStatus(data.message || "Opponent disconnected");
          setPhase("waiting");
          chess.reset();
          setFen(chess.fen());
          setYourColor(null);
          setOpponent(null);
          setWhiteTime(0);
          setBlackTime(0);
          setBiddingCountdown(null); // Clear countdown on disconnect
          console.warn("Opponent disconnected");
        });

        newSocket.on("update", (data) => {
          console.log("Received update message:", data);
          chess.load(data.fen);
          setFen(chess.fen());
          setPending(false);
          setDrawOfferPending(false);
          setOpponentDrawOffer(null);
          console.log(
            `Board updated. Turn: ${chess.turn()}, Your turn: ${isYourTurn()}`
          );
        });

        newSocket.on("win", async (data) => {
          console.log("Received win message:", data);
          setPhase("ended");
          const youWin = data.winner === myUserId;
          try {
            const profileResponse = await api.profile.getProfileByUserId(
              data.winner
            );
            setWinnerUser(profileResponse.data);
            const message = youWin
              ? "You win!"
              : `${profileResponse.data.name} wins!`;
            const reason = data.reason ? ` (${data.reason})` : "";
            setStatus(`Game over: ${message}${reason}`);
          } catch (error) {
            console.error("Failed to fetch winner profile:", error);
            const message = youWin ? "You win!" : "Opponent wins!";
            const reason = data.reason ? ` (${data.reason})` : "";
            setStatus(`Game over: ${message}${reason}`);
          }
          const reason = data.reason ? ` (${data.reason})` : "";
          let message;
          if (youWin) {
            message = "You win!";
          } else {
            message = winnerUser
              ? `${winnerUser.name} wins!`
              : "Opponent wins!";
          }
          console.log(`Game ended: ${message}${reason}`);
        });

        newSocket.on("draw", (data) => {
          console.log("Received draw message:", data);
          setPhase("ended");
          const reason = data.reason ? ` (${data.reason})` : "";
          setStatus(`Game over: Draw!${reason}`);
          console.log(`Game ended: Draw${reason}`);
        });

        newSocket.on("error", (data) => {
          console.log("Received error message:", data);

          if (pending) {
            chess.undo();
            setFen(chess.fen());
            setPending(false);
          }
          setErrorMessage(data.message || "An error occurred");
          console.error("Server error:", data);
        });

        newSocket.on("draw_offered", async (data) => {
          console.log("Received draw_offered message:", data);
          try {
            const profileResponse = await api.profile.getProfileByUserId(
              data.from
            );
            setDrawOfferUser(profileResponse.data);
          } catch (error) {
            console.error("Failed to fetch draw offer user profile:", error);
          }
          setOpponentDrawOffer(data.from);
          setShowDrawModal(true);
        });

        newSocket.on("draw_offer_sent", () => {
          console.log("Draw offer sent successfully");
          setDrawOfferPending(true);
          setErrorMessage(null);
        });

        newSocket.on("draw_declined", () => {
          console.log("Draw offer declined");
          setDrawOfferPending(false);
          setErrorMessage("Draw offer declined");
        });

        newSocket.on("draw_offer_cancelled", () => {
          console.log("Draw offer cancelled");
          setOpponentDrawOffer(null);
          setShowDrawModal(false);
        });

        newSocket.on("connect_error", (error) => {
          setErrorMessage(`Connection error: ${error.message}`);
          console.error("Connect error:", error);
        });

        newSocket.on("disconnect", (reason) => {
          setStatus(`Disconnected: ${reason}`);
          setBiddingCountdown(null); // Clear countdown on disconnect
          console.warn("Socket disconnected:", reason);
        });

        newSocket.on("bidding_time_update", (data) => {
          console.log("Received bidding_time_update:", data);
          setBiddingCountdown(data.timeLeft);
        });
      } catch (error) {
        console.error("Initialization error:", error);
        setErrorMessage("Failed to initialize the game");
      }
    }

    init();

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  const sendBid = (time) => {
    if (socket && !bidSent && time >= 60) {
      socket.emit("bid", { time });
      setBidSent(true);
      setStatus(`Bid sent (${time}s), waiting for opponent...`);
      setBiddingCountdown(null); // Clear countdown when bid is sent
    } else if (time < 60) {
      setErrorMessage("Bid time must be at least 60s");
    } else {
      setErrorMessage("Unable to send bid");
    }
  };

  const sendMove = (move) => {
    if (socket) {
      socket.emit("move", { move });
      console.log("Move sent:", move);
    }
  };

  const onDrop = (sourceSquare, targetSquare, piece) => {
    if (pending || phase !== "playing" || !isYourTurn()) return false;

    try {
      const originalPiece = chess.get(sourceSquare);
      if (!originalPiece || originalPiece.color !== chess.turn()) return false;

      let move;
      const isPromotion =
        originalPiece.type === "p" &&
        ((originalPiece.color === "w" && targetSquare[1] === "8") ||
          (originalPiece.color === "b" && targetSquare[1] === "1"));

      if (isPromotion) {
        const promotionType = piece ? piece[1].toLowerCase() : "q"; // Default to queen if no piece specified
        move = chess.move({
          from: sourceSquare,
          to: targetSquare,
          promotion: promotionType,
        });
      } else {
        move = chess.move({
          from: sourceSquare,
          to: targetSquare,
        });
      }

      if (move) {
        setFen(chess.fen());
        sendMove(move.san);
        setPending(true);
        console.log("Local move:", move.san);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Invalid move:", error);
      return false;
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const copyFen = async () => {
    try {
      await navigator.clipboard.writeText(chess.fen());
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error("Failed to copy FEN:", err);
      setErrorMessage("Failed to copy FEN");
    }
  };

  const resign = () => {
    if (socket && phase === "playing") {
      socket.emit("resign");
    }
  };

  const offerDraw = () => {
    if (socket && phase === "playing" && !drawOfferPending) {
      socket.emit("offer_draw");
    }
  };

  const acceptDraw = () => {
    if (socket && opponentDrawOffer) {
      socket.emit("accept_draw");
      setShowDrawModal(false);
      setOpponentDrawOffer(null);
    }
  };

  const declineDraw = () => {
    if (socket && opponentDrawOffer) {
      socket.emit("decline_draw");
      setShowDrawModal(false);
      setOpponentDrawOffer(null);
    }
  };

  console.log("Your color", yourColor);

  return (
    <>
      <Helmet>
        <title>Chess - Strategic Board Game</title>
        <meta
          name="description"
          content="Play multiplayer chess with real-time gameplay, move validation, and strategic board game mechanics. Challenge opponents in this classic strategic game."
        />
        <meta
          name="keywords"
          content="chess, multiplayer, strategy game, board game, real-time, competitive"
        />
        <link rel="canonical" href="/projects/chess" />
        <meta property="og:title" content="Chess - Strategic Board Game" />
        <meta
          property="og:description"
          content="Play multiplayer chess with real-time gameplay, move validation, and strategic board game mechanics. Challenge opponents in this classic strategic game."
        />
        <meta property="og:image" content="/chess-board.png" />
        <meta property="og:url" content="/projects/chess" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Chess - Strategic Board Game" />
        <meta
          name="twitter:description"
          content="Play multiplayer chess with real-time gameplay, move validation, and strategic board game mechanics. Challenge opponents in this classic strategic game."
        />
        <meta name="twitter:image" content="/chess-board.png" />
      </Helmet>
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-8 text-center">
          Multiplayer Chess
        </h1>
        <div className="flex flex-col lg:flex-row gap-8 justify-center">
          {/* Chessboard */}
          <div className="card bg-base-100 shadow-xl w-full lg:w-1/2">
            <div className="card-body p-0">
              <Chessboard
                position={fen}
                onPieceDrop={onDrop}
                arePiecesDraggable={draggable}
                isDraggablePiece={({ piece }) => {
                  // FIXME: The code below doesn't work
                  const isDraggable =
                    yourColor &&
                    piece[0].toLowerCase() ===
                      (yourColor && yourColor[0].toLowerCase()) &&
                    isYourTurn() &&
                    !pending;

                  return true;
                }}
                boardOrientation={yourColor || "white"}
                showPromotionDialog={true}
              />
            </div>
          </div>

          {/* Sidebar: Game Info */}
          <div className="card bg-base-100 shadow-2xl w-full lg:w-1/3">
            <div className="card-body">
              <h2 className="card-title mb-4">Game Info</h2>

              {/* Status Alert */}
              <div className="alert alert-info mb-4">
                <FaExclamationTriangle className="h-5 w-5" />
                <span>{status}</span>
              </div>

              {errorMessage && (
                <div className="alert alert-error mb-4">
                  <FaExclamationTriangle className="h-5 w-5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Players */}
              <div className="flex flex-col gap-2 mb-4">
                <a
                  href={`/profile/${myUserId}`}
                  className="flex items-center gap-1 hover:text-info"
                >
                  <ProfilePicture
                    name={myName}
                    image={myImage}
                    widthClass="w-6"
                  />
                  <div className="font-bold flex items-center gap-1">
                    <strong>You:</strong> {myName || "Loading..."}
                  </div>
                </a>
                {opponentUser ? (
                  <a
                    href={`/profile/${opponentUser.id}`}
                    className="flex items-center gap-1 hover:text-info"
                  >
                    <ProfilePicture
                      name={opponentUser.name}
                      image={opponentUser.image}
                      widthClass="w-6"
                    />
                    <div className="font-bold flex items-center gap-1">
                      <strong>Opponent:</strong> {opponentUser.name}
                    </div>
                  </a>
                ) : (
                  <div className="flex items-center gap-2">
                    <FaUser className="h-5 w-5" />
                    <span>
                      <strong>Opponent:</strong>{" "}
                      {opponent ? "Loading..." : "Waiting..."}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <FaChessPawn className="h-5 w-5" />
                  <span>
                    <strong>Your Color:</strong>{" "}
                    {yourColor
                      ? yourColor.charAt(0).toUpperCase() + yourColor.slice(1)
                      : "Not assigned"}
                  </span>
                </div>
              </div>

              {/* Times */}
              {phase === "playing" && (
                <div className="grid grid-cols-1 gap-3 mb-4">
                  <div
                    className={
                      "card shadow-lg " +
                      (isYourTurn()
                        ? "bg-success text-success-content"
                        : "bg-base-300 text-base-content")
                    }
                  >
                    <div className="card-body p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FaClock className="h-5 w-5" />
                          <span className="font-semibold">Your Time</span>
                        </div>
                        <span className="text-lg font-mono">
                          {formatTime(
                            yourColor === "white" ? whiteTime : blackTime
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div
                    className={
                      "card shadow-lg " +
                      (isYourTurn()
                        ? "bg-base-300 text-base-content"
                        : "bg-success text-success-content")
                    }
                  >
                    <div className="card-body p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FaClock className="h-5 w-5" />
                          <span className="font-semibold">Opponent's Time</span>
                        </div>
                        <span className="text-lg font-mono">
                          {formatTime(
                            yourColor === "white" ? blackTime : whiteTime
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Turn Indicator */}
              {phase === "playing" && (
                <div
                  className={`alert ${
                    isYourTurn() ? "alert-success" : "alert-warning"
                  } mb-4`}
                >
                  <FaChessKing className="h-5 w-5" />
                  <span>{isYourTurn() ? "Your Turn" : "Opponent's Turn"}</span>
                </div>
              )}

              {/* Draw Offer Alert */}
              {drawOfferPending && (
                <div className="alert alert-info mb-4">
                  <FaHandshake className="h-5 w-5" />
                  <span>Draw offer sent, waiting for opponent...</span>
                </div>
              )}

              {/* Game Actions */}
              {phase === "playing" && (
                <div className="flex flex-col gap-2 mb-4">
                  <button
                    onClick={offerDraw}
                    disabled={drawOfferPending}
                    className="btn btn-outline btn-info"
                  >
                    <FaHandshake className="h-5 w-5 mr-2" />
                    {drawOfferPending ? "Draw Offered" : "Offer Draw"}
                  </button>
                  <button
                    onClick={resign}
                    className="btn btn-outline btn-error"
                  >
                    <FaFlag className="h-5 w-5 mr-2" />
                    Resign
                  </button>
                </div>
              )}

              {/* Bidding */}
              {phase === "bidding" && !bidSent && (
                <div className="form-control mb-4">
                  <label className="label">
                    <span className="label-text">
                      Bid Time (seconds, min 60)
                    </span>
                  </label>
                  <div className="join">
                    <input
                      type="number"
                      value={biddingTime}
                      onInput={(e) =>
                        setBiddingTime(
                          parseInt((e.target as HTMLInputElement).value, 10) ||
                            60
                        )
                      }
                      min="60"
                      step="1"
                      className="input input-bordered join-item w-full"
                    />
                    <button
                      onClick={() => sendBid(biddingTime)}
                      className="btn btn-primary join-item"
                    >
                      Submit Bid
                    </button>
                  </div>
                  {biddingCountdown !== null && (
                    <div className="alert alert-warning mt-2">
                      <FaHourglassHalf className="h-5 w-5" />
                      <span>Time left to bid: {biddingCountdown}s</span>
                    </div>
                  )}
                </div>
              )}

              {/* Utilities */}
              <div className="flex flex-col gap-2">
                <button onClick={copyFen} className="btn btn-outline">
                  <FaCopy className="h-5 w-5 mr-2" />
                  Copy FEN
                </button>
                {copySuccess && (
                  <div className="alert alert-success text-sm">
                    FEN copied to clipboard!
                  </div>
                )}
                {/* Add more utilities as needed, e.g., Export PGN */}
              </div>
            </div>
          </div>
        </div>

        {/* Draw Offer Modal */}
        {showDrawModal && (
          <div className="modal modal-open">
            <div className="modal-box">
              <h3 className="font-bold text-lg">Draw Offer</h3>
              <p className="py-4">
                {drawOfferUser ? (
                  <a
                    href={`/profile/${drawOfferUser.id}`}
                    className="flex items-center gap-1 inline-flex"
                  >
                    <ProfilePicture
                      name={drawOfferUser.name}
                      image={drawOfferUser.image}
                      widthClass="w-6"
                    />
                    <span className="font-bold">{drawOfferUser.name}</span>
                  </a>
                ) : (
                  "Your opponent"
                )}{" "}
                has offered a draw. Do you accept?
              </p>
              <div className="modal-action">
                <button onClick={declineDraw} className="btn btn-outline">
                  Decline
                </button>
                <button onClick={acceptDraw} className="btn btn-primary">
                  Accept Draw
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
