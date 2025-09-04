import { useState, useEffect, useRef } from "preact/hooks";
import { Navbar } from "../../components/Navbar";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";

export function ChessGame() {
  const [chess] = useState(new Chess());
  const [fen, setFen] = useState(chess.fen());
  const [yourColor, setYourColor] = useState(null);
  const [opponent, setOpponent] = useState(null);
  const [status, setStatus] = useState("Connecting...");
  const [draggable, setDraggable] = useState(false);
  const [pending, setPending] = useState(false);
  const wsRef = useRef(null);

  useEffect(() => {
    const token = encodeURIComponent(localStorage.getItem("token") || "");
    if (!token) {
      console.log("401 error: redirecting to /login");
      window.location.href = "/login";
      return;
    }

    wsRef.current = new WebSocket(`ws://localhost:3000/ws/${token}`);

    wsRef.current.onopen = () => {
      console.log("WebSocket connected");
    };

    wsRef.current.onmessage = (event) => {
      console.log(event.data);
      try {
        const data = JSON.parse(event.data);
        if (data.type === "init") {
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
        } else if (data.type === "opponent_joined") {
          setOpponent(data.opponent);
          setStatus(`Playing against ${data.opponent}`);
          setDraggable(true);
        } else if (data.type === "update") {
          chess.load(data.fen);
          setFen(data.fen);
          setPending(false);
          //setStatus(`Playing against ${opponent}`);
        } else if (data.type === "win") {
          setDraggable(false);
          const youWin = opponent && data.winner !== opponent;
          const message = youWin ? "You win!" : `${data.winner} wins!`;
          const reason = data.reason ? ` (${data.reason})` : "";
          setStatus(`Game over: ${message}${reason}`);
        } else if (data.type === "draw") {
          setDraggable(false);
          setStatus("Game over: Draw!");
        } else if (data.type === "error") {
          if (pending) {
            chess.undo();
            setFen(chess.fen());
            setPending(false);
          }
          setStatus(`Error: ${data.message}`);
        }
      } catch (error) {
        console.error("Error processing WebSocket message:", error);
      }
    };

    wsRef.current.onerror = (error) => {
      console.error("WebSocket error:", error);
      setStatus("Connection error");
    };

    wsRef.current.onclose = () => {
      console.log("WebSocket closed");
      setStatus("Connection closed");
    };

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
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
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ move }));
    }
  }

  const onDrop = (sourceSquare, targetSquare) => {
    if (!isYourTurn() || pending) return;
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
      }
      return true;
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
            // The piece begins with w or b for color, check if it's the same as the player's
            if (piece[0] == yourColor[0]) {
              return isYourTurn();
            }
          }}
          boardOrientation={yourColor || "white"}
          // TODO: Better promotions
          showPromotionDialog={false}
        />
      </div>
    </>
  );
}
