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
          setStatus("Connected, joining game...");
        });

        newSocket.on("init", (data) => {
          console.log("Received init:", data);
          chess.load(data.fen);
          setFen(data.fen);
          setYourColor(data.your_color);
          setOpponent(data.opponent);
          if (data.opponent === null) {
            setStatus("Waiting for opponent...");
            setDraggable(false);
          } else {
            setStatus(`Playing against ${data.opponent}`);
            setDraggable(true);
          }
        });

        newSocket.on("opponent_joined", (data) => {
          console.log("Received opponent_joined:", data);
          setOpponent(data.opponent);
          setStatus(`Playing against ${data.opponent}`);
          setDraggable(true);
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
          const youWin = opponent && data.winner !== opponent;
          const message = youWin
            ? "You win!"
            : `${data.winner || yourColor} wins!`;
          const reason = data.reason ? ` (${data.reason})` : "";
          setStatus(`Game over: ${message}${reason}`);
        });

        newSocket.on("draw", () => {
          console.log("Received draw");
          setDraggable(false);
          setStatus("Game over: Draw!");
        });

        newSocket.on("error", (data) => {
          console.log("Received error:", data);
          if (pending) {
            chess.undo();
            setFen(chess.fen());
            setPending(false);
          }
          setStatus(`Error: ${data.message}`);
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

  return (
    <>
      <Navbar />
      <h1 class="text-3xl mx-4 my-8">Multiplayer Chess:</h1>
      <div class="mx-auto w-1/4 max-lg:w-1/3 max-md:w-1/2 max-sm:w-full">
        <div
          role="alert"
          className="justify-center my-4 alert bg-neutral text-neutral-content"
        >
          <span>{status}</span>
        </div>
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
