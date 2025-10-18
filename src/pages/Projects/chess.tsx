// Frontend: Updated ChessGame component with additional logging

import { io } from "socket.io-client";
import { useState, useEffect } from "preact/hooks";
import { Navbar } from "../../components/Navbar";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import { api } from "../../api/client.js"; // Assuming this is the OpenAPI-generated client

export function ChessGame() {
  const [chess] = useState(new Chess());
  const [fen, setFen] = useState(chess.fen());
  const [yourColor, setYourColor] = useState(null);
  const [opponent, setOpponent] = useState(null);
  const [status, setStatus] = useState("Connecting...");
  const [draggable, setDraggable] = useState(false);
  const [pending, setPending] = useState(false);
  const [socket, setSocket] = useState(null);
  const [phase, setPhase] = useState("connecting");
  const [biddingTime, setBiddingTime] = useState(60);
  const [whiteTime, setWhiteTime] = useState(0);
  const [blackTime, setBlackTime] = useState(0);
  const [bidSent, setBidSent] = useState(false);
  const [myName, setMyName] = useState(null);

  useEffect(() => {
    async function init() {
      try {
        // Check session using the provided API call
        const response = await (await api.auth.apiGetSessionList()).json();
        console.log("Session check response:", response);
        if (!response) {
          console.log("No active session: redirecting to /login");
          window.location.href = "/login";
          return;
        }
        setMyName(response.user.name);

        const base_url =
          import.meta.env.MODE === "production"
            ? "wss://my-website.space/backend"
            : "http://localhost:3000";

        const newSocket = io(base_url, {
          path: "/socket.io/",
          transports: ["websocket", "polling"],
          withCredentials: true, // Send cookies for authentication
        });

        setSocket(newSocket);

        newSocket.on("connect", () => {
          console.log("Socket connected");
          setPhase("connecting");
          setStatus("Connected, joining game...");
        });

        newSocket.on("waiting", () => {
          console.log("Received waiting");
          setPhase("waiting");
          setStatus("Waiting for opponent...");
        });

        newSocket.on("paired", (data) => {
          console.log("Received paired:", data);
          setOpponent(data.opponent);
          setPhase("bidding");
          setBidSent(false);
          setStatus(
            "Paired with " +
              data.opponent +
              ". Please bid your preferred game time (min 60s):"
          );
        });

        newSocket.on("start", (data) => {
          console.log("Received start:", data);
          chess.load(data.fen);
          setFen(data.fen);
          setYourColor(data.your_color);
          setOpponent(data.opponent);
          setWhiteTime(data.whiteTime);
          setBlackTime(data.blackTime);
          setPhase("playing");
          setStatus("Playing against " + data.opponent);
        });

        newSocket.on("time_update", (data) => {
          console.log("Received time_update:", data);
          setWhiteTime(data.whiteTime);
          setBlackTime(data.blackTime);
        });

        newSocket.on("opponent_disconnected", (data) => {
          console.log("Received opponent_disconnected:", data);
          setPhase("waiting");
          setStatus(data.message);
        });

        newSocket.on("update", (data) => {
          console.log("Received update:", data);
          chess.load(data.fen);
          setFen(data.fen);
          setPending(false);
        });

        newSocket.on("win", (data) => {
          console.log("Received win:", data);
          setDraggable(false);
          setPhase("ended");
          const youWin = data.winner === myName;
          const message = youWin ? "You win!" : data.winner + " wins!";
          const reason = data.reason ? " (" + data.reason + ")" : "";
          setStatus("Game over: " + message + reason);
        });

        newSocket.on("draw", (data) => {
          console.log("Received draw:", data);
          setDraggable(false);
          setPhase("ended");
          const reason = data.reason ? " (" + data.reason + ")" : "";
          setStatus("Game over: Draw!" + reason);
        });

        newSocket.on("error", (data) => {
          console.log("Received error:", data);
          if (pending) {
            chess.undo();
            setFen(chess.fen());
            setPending(false);
          }
          setStatus("Error: " + data.message);
        });

        newSocket.on("connect_error", (error) => {
          console.error("Socket connect error:", error);
          setStatus("Connection error: " + error.message);
        });

        newSocket.on("disconnect", (reason) => {
          console.log("Socket disconnected:", reason);
          setStatus("Connection closed: " + reason);
        });

        newSocket.onAny((event, ...args) => {
          console.log("Socket event:", event, args);
        });
      } catch (error) {
        console.error("Init error:", error);
        setStatus("Init error");
      }
    }

    init();

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  const isYourTurn = () => {
    if (!yourColor) return false;
    return (
      (chess.turn() === "w" && yourColor === "white") ||
      (chess.turn() === "b" && yourColor === "black")
    );
  };

  useEffect(() => {
    setDraggable(opponent !== null && isYourTurn());
  }, [fen, yourColor, opponent]);

  function sendBid(time) {
    if (socket && !bidSent && time >= 60) {
      console.log("Sending bid:", time);
      socket.emit("bid", { time });
      setBidSent(true);
      setStatus("Bid sent (" + time + "s), waiting for opponent...");
    } else if (time < 60) {
      setStatus("Bid time must be at least 60s");
    }
  }

  function sendMove(move) {
    if (socket) {
      console.log("Sending move:", move);
      socket.emit("move", { move });
    }
  }

  const onDrop = (sourceSquare, targetSquare) => {
    if (!isYourTurn() || pending) return false;
    try {
      const move = chess.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: "q",
      });
      if (move) {
        setFen(chess.fen());
        sendMove(move.san);
        setPending(true);
        return true;
      }
      return false;
    } catch (error) {
      console.log("Invalid move");
      return false;
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m + ":" + s.toString().padStart(2, "0");
  };

  return (
    <>
      <h1 class="text-3xl mx-4 my-8">Multiplayer Chess:</h1>
      <div class="mx-auto w-1/4 max-lg:w-1/3 max-md:w-1/2 max-sm:w-full">
        {phase === "playing" && (
          <div class="flex justify-around my-4">
            <div>White: {formatTime(whiteTime)}</div>
            <div>Black: {formatTime(blackTime)}</div>
          </div>
        )}
        <div
          role="alert"
          className="justify-center my-4 alert bg-neutral text-neutral-content"
        >
          <span>{status}</span>
        </div>
        {phase === "bidding" && !bidSent && (
          <div class="my-4 flex flex-col items-center">
            <input
              type="number"
              value={biddingTime}
              onInput={(e) =>
                setBiddingTime(
                  parseInt((e.target as HTMLInputElement).value, 10) || 60
                )
              }
              min="60"
              step="1"
              class="input input-bordered"
            />
            <button
              onClick={() => sendBid(biddingTime)}
              class="btn btn-primary mt-2"
            >
              Submit Bid
            </button>
          </div>
        )}
        <Chessboard
          position={fen}
          onPieceDrop={onDrop}
          arePiecesDraggable={draggable}
          isDraggablePiece={({ piece }) => {
            if (yourColor && piece[0] == yourColor[0]) {
              return isYourTurn();
            }
            return false;
          }}
          boardOrientation={yourColor || "white"}
          showPromotionDialog={false}
        />
      </div>
    </>
  );
}
