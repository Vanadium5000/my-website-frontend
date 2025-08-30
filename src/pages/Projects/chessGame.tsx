import { useState, useEffect, useRef } from "preact/hooks";
import { Navbar } from "../../components/Navbar";
import Chessboard from "chessboardjsx";
import { Chess } from "chess.js";

export function ChessGame({ id }) {
  // id is the game_id
  const [chess] = useState(new Chess());
  const [fen, setFen] = useState(chess.fen());
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Initialize WebSocket connection with game_id and token
    const token = encodeURIComponent(localStorage.getItem("token") || "");
    wsRef.current = new WebSocket(`ws://localhost:3000/ws/${id}/${token}`);

    // Handle WebSocket open
    wsRef.current.onopen = () => {
      console.log("WebSocket connected");
    };

    // Handle incoming messages
    wsRef.current.onmessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "update" && data.fen) {
          // Update the board with the new FEN
          chess.load(data.fen);
          setFen(data.fen);
          console.log("Board updated with FEN:", data.fen);
        }
      } catch (error) {
        console.error("Error processing WebSocket message:", error);
      }
    };

    // Handle errors
    wsRef.current.onerror = (error: Event) => {
      console.error("WebSocket error:", error);
    };

    // Handle WebSocket close
    wsRef.current.onclose = () => {
      console.log("WebSocket closed");
    };

    // Cleanup on component unmount
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [id]); // Add id as a dependency to reconnect if game_id changes

  function sendMove(move: string) {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ move }));
    }
  }

  const onDrop = ({
    sourceSquare,
    targetSquare,
  }: {
    sourceSquare: string;
    targetSquare: string;
  }) => {
    try {
      const move = chess.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: "q", // Auto-promote to queen for simplicity
      });

      if (move) {
        setFen(chess.fen());
        // Send move in SAN notation (e.g., "e2e4") to backend
        sendMove(move.san);
      }
    } catch (error) {
      console.log("Move failed");
    }
  };

  return (
    <>
      <Navbar />
      <Chessboard position={fen} onDrop={onDrop} />
    </>
  );
}
