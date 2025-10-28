import { useEffect, useCallback, useRef } from "preact/hooks";
import { io, Socket } from "socket.io-client";
import { api } from "../../api/client";
import { useSpawnToast } from "./ToastProvider";

// Interface for notification event data
interface NotificationEventData {
  type?: "info" | "success" | "warning" | "error";
  text: string;
  time?: number;
}

// Main Connection component for handling session-related socket events
export function Connection() {
  const sendToast = useSpawnToast();
  const socketRef = useRef<Socket | null>(null);

  const setupSocketListeners = useCallback(
    (socket: Socket) => {
      // Log every event received
      socket.onAny((eventName: string, data: any) => {
        console.log(`[Connection Socket] Received event: ${eventName}`, data);
      });

      // Handle notification events specifically
      socket.on("notification", (data: NotificationEventData) => {
        try {
          // Validate required properties
          if (!data.text) {
            console.error(
              "[Connection] Notification event missing required 'text' property:",
              data
            );
            return;
          }

          // Parse optional arguments with defaults
          const toastType = data.type || "info";
          const toastTime = data.time || 3000; // Default 3 seconds

          // Send the toast
          sendToast({
            text: data.text,
            type: toastType,
            time: toastTime,
          });

          console.log(
            `[Connection] Notification toast sent: ${toastType} - "${data.text}"`
          );
        } catch (error) {
          console.error(
            "[Connection] Error handling notification event:",
            error
          );
        }
      });

      // Connection events
      socket.on("connect", () => {
        console.log("[Connection Socket] Connected to server");
      });

      socket.on("disconnect", (reason: string) => {
        console.log(`[Connection Socket] Disconnected: ${reason}`);
      });

      socket.on("connect_error", (error: Error) => {
        console.error("[Connection Socket] Connection error:", error.message);
      });

      socket.on("error", (error: any) => {
        console.error("[Connection Socket] Server error:", error);
      });

      // Optional: Handle additional session-related events if needed
      // For example, session updates, authentication events, etc.
      // These can be added as the system evolves
    },
    [sendToast]
  );

  useEffect(() => {
    // Only initialize if socket doesn't exist
    if (socketRef.current) {
      console.log("[Connection] Socket already initialized, skipping");
      return;
    }

    console.log("[Connection] Initializing session connection...");

    try {
      const baseUrl = api.baseUrl;
      // Paths not beginning with / with be added to baseUrl, those beginning with / will replace every after the main host
      const fullPath = new URL("/connection", baseUrl).href;

      // Append relative path to baseUrl for transport (e.g., /backend/sockets/)
      const transportPath = new URL("sockets/", baseUrl).pathname;

      console.log("[Connection] Connecting to:", fullPath);

      // Create socket with same configuration as chess
      const socket: Socket = io(fullPath, {
        path: transportPath,
        transports: ["websocket", "polling"],
        withCredentials: true,
        // Additional security options
        timeout: 20000, // 20 second connection timeout
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      // Set up all event listeners
      setupSocketListeners(socket);

      // Store reference
      socketRef.current = socket;

      // Cleanup function - only disconnect on unmount
      return () => {
        console.log("[Connection] Cleaning up socket connection");
        socketRef.current?.disconnect();
        socketRef.current = null;
      };
    } catch (error) {
      console.error("[Connection] Failed to initialize socket:", error);
    }
  }, [setupSocketListeners]);

  // This component renders nothing - it's purely for side effects
  return null;
}
