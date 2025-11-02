import { Helmet } from "react-helmet";
import { useEffect, useState } from "preact/hooks";
import { api } from "../../api/client";
import {
  FaPlug,
  FaPaperPlane,
  FaExclamationTriangle,
  FaBell,
  FaTimes,
  FaGlobe,
} from "react-icons/fa";
import { ProfilePicture } from "../../components/ProfilePicture";
import { ConnectionsResponseSchema } from "../../api/api";

interface Connection {
  socketId: string;
  userData?: {
    id: string;
    name: string;
    image?: string;
    banned?: boolean;
    role?: string;
  };
  connectedAt: string;
  route: string;
  socketInfo: {
    ip?: string;
    userAgent?: string;
    origin?: string;
  };
}

export function AdminConnections() {
  const [connections, setConnections] = useState<
    ConnectionsResponseSchema["connections"]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedConnection, setSelectedConnection] = useState<
    ConnectionsResponseSchema["connections"][0] | null
  >(null);

  // Modals
  const [showEventModal, setShowEventModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showGlobalEventModal, setShowGlobalEventModal] = useState(false);
  const [showGlobalNotificationModal, setShowGlobalNotificationModal] =
    useState(false);

  // Form data
  const [eventData, setEventData] = useState({
    eventName: "",
    eventPayload: "",
  });
  const [notificationData, setNotificationData] = useState({
    type: "info" as "info" | "success" | "warning" | "error",
    text: "",
    time: "3000",
  });

  useEffect(() => {
    fetchConnections();
  }, []);

  const fetchConnections = async () => {
    try {
      setLoading(true);
      const response = await api.connections.getConnections();
      setConnections(response.data.connections);
      setError("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch connections"
      );
    } finally {
      setLoading(false);
    }
  };

  const sendEvent = async (socketId?: string) => {
    try {
      let payload: any = undefined;
      try {
        payload = JSON.parse(eventData.eventPayload || "{}");
      } catch (e) {
        setError("Invalid JSON payload");
        return;
      }

      await api.connections.postConnectionsSendEvent({
        socketId,
        event: eventData.eventName,
        data: payload,
      });

      // Close modal and reset
      setShowEventModal(false);
      setShowGlobalEventModal(false);
      setEventData({ eventName: "", eventPayload: "" });
      setError("");

      // Show success message
      setError("Event sent successfully");

      // Clear success message after 3 seconds
      setTimeout(() => setError(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send event");
    }
  };

  const sendNotification = async (socketId?: string) => {
    try {
      const data = {
        type: notificationData.type,
        text: notificationData.text,
        time: parseInt(notificationData.time) || 3000,
      };

      await api.connections.postConnectionsSendEvent({
        socketId,
        event: "notification",
        data,
      });

      // Close modal and reset
      setShowNotificationModal(false);
      setShowGlobalNotificationModal(false);
      setNotificationData({ type: "info", text: "", time: "3000" });
      setError("");

      // Show success message
      setError("Notification sent successfully");

      // Clear success message after 3 seconds
      setTimeout(() => setError(""), 3000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to send notification"
      );
    }
  };

  const disconnectConnection = async (socketId: string) => {
    if (
      !confirm(
        "Are you sure you want to disconnect this connection? The user will reconnect automatically unless their client has issues."
      )
    ) {
      return;
    }

    try {
      await api.connections.postConnectionsDisconnect({ socketId });
      await fetchConnections();
      setError("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to disconnect connection"
      );
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-uk", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <>
      <Helmet>
        <title>Connection Management - My Website</title>
        <meta
          name="description"
          content="Admin panel for managing WebSocket connections. Monitor active users, send events and notifications, and manage real-time connections."
        />
        <meta
          name="keywords"
          content="admin connections, websocket management, real-time connections, user monitoring, connection management"
        />
        <link rel="canonical" href="/admin/connections" />
        <meta
          property="og:title"
          content="Connection Management - My Website"
        />
        <meta
          property="og:description"
          content="Admin panel for managing WebSocket connections. Monitor active users, send events and notifications, and manage real-time connections."
        />
        <meta property="og:image" content="/logo.png" />
        <meta property="og:url" content="/admin/connections" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="Connection Management - My Website"
        />
        <meta
          name="twitter:description"
          content="Admin panel for managing WebSocket connections. Monitor active users, send events and notifications, and manage real-time connections."
        />
        <meta name="twitter:image" content="/logo.png" />
      </Helmet>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <a href="/admin" className="btn btn-ghost btn-sm">
            ← Back to Admin
          </a>
          <FaPlug />
          Connection Management
        </h1>

        {/* Global Actions */}
        <div className="mb-4 flex gap-2">
          <button
            className="btn btn-primary"
            onClick={() => setShowGlobalEventModal(true)}
          >
            <FaPaperPlane />
            Broadcast Event
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => setShowGlobalNotificationModal(true)}
          >
            <FaBell />
            Broadcast Notification
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className={`alert mb-4 ${
              error.includes("success") ? "alert-success" : "alert-error"
            }`}
          >
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-zebra w-full">
              <thead>
                <tr>
                  <th>User</th>
                  <th>IP Address</th>
                  <th>Connected At</th>
                  <th>Route</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {connections.map((conn) => (
                  <tr key={conn.socketId}>
                    <td>
                      {conn.userData ? (
                        <a
                          href={`/profile/${conn.userData.id}`}
                          className="flex items-center gap-3"
                        >
                          <ProfilePicture
                            name={conn.userData.name}
                            image={conn.userData.image}
                          />
                          <div className="flex flex-col">
                            <div className="font-bold">
                              {conn.userData.name}
                            </div>
                            {conn.userData.banned && (
                              <span className="badge badge-error badge-sm">
                                Banned
                              </span>
                            )}
                          </div>
                        </a>
                      ) : (
                        <div className="flex items-center gap-3">
                          <FaPlug className="w-8 h-8 text-base-content opacity-40" />
                          <span>Anonymous</span>
                        </div>
                      )}
                    </td>
                    <td>{conn.socketInfo.ip || "Unknown"}</td>
                    <td>{formatDate(conn.connectedAt)}</td>
                    <td className="font-mono text-sm">{conn.route}</td>
                    <td>
                      <div className="flex gap-1">
                        <button
                          className="btn btn-sm btn-info"
                          title="Send custom event"
                          onClick={() => {
                            setSelectedConnection(conn);
                            setShowEventModal(true);
                          }}
                        >
                          <FaPaperPlane />
                        </button>
                        <button
                          className="btn btn-sm btn-warning"
                          title="Send notification"
                          onClick={() => {
                            setSelectedConnection(conn);
                            setShowNotificationModal(true);
                          }}
                        >
                          <FaBell />
                        </button>
                        <button
                          className="btn btn-sm btn-error"
                          title="Force disconnect"
                          onClick={() => disconnectConnection(conn.socketId)}
                        >
                          <FaTimes />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Send Event Modal */}
        {(showEventModal || showGlobalEventModal) && (
          <div className="modal modal-open">
            <div className="modal-box">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <FaPaperPlane />
                {showEventModal
                  ? "Send Event to Connection"
                  : "Broadcast Event"}
              </h3>
              <div className="py-4">
                <div className="form-control mb-4">
                  <label className="label">
                    <span className="label-text">Event Name</span>
                  </label>
                  <input
                    type="text"
                    placeholder="notification"
                    className="input input-bordered"
                    value={eventData.eventName}
                    onChange={(e) =>
                      setEventData((prev) => ({
                        ...prev,
                        eventName: e.currentTarget.value,
                      }))
                    }
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Event Payload (JSON)</span>
                  </label>
                  <textarea
                    placeholder='{"key": "value"}'
                    className="textarea textarea-bordered"
                    value={eventData.eventPayload}
                    onChange={(e) =>
                      setEventData((prev) => ({
                        ...prev,
                        eventPayload: e.currentTarget.value,
                      }))
                    }
                    rows={4}
                  />
                </div>
              </div>
              <div className="modal-action">
                <button
                  className="btn btn-ghost"
                  onClick={() => {
                    setShowEventModal(false);
                    setShowGlobalEventModal(false);
                    setEventData({ eventName: "", eventPayload: "" });
                  }}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() =>
                    sendEvent(
                      showEventModal ? selectedConnection?.socketId : undefined
                    )
                  }
                  disabled={!eventData.eventName.trim()}
                >
                  Send Event
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Send Notification Modal */}
        {(showNotificationModal || showGlobalNotificationModal) && (
          <div className="modal modal-open">
            <div className="modal-box">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <FaBell />
                {showNotificationModal
                  ? "Send Notification to Connection"
                  : "Broadcast Notification"}
              </h3>
              <div className="py-4">
                <div className="form-control mb-4">
                  <label className="label">
                    <span className="label-text">Notification Type</span>
                  </label>
                  <select
                    className="select select-bordered"
                    value={notificationData.type}
                    onChange={(e) =>
                      setNotificationData((prev) => ({
                        ...prev,
                        type: e.currentTarget.value as any,
                      }))
                    }
                  >
                    <option value="info">Info</option>
                    <option value="success">Success</option>
                    <option value="warning">Warning</option>
                    <option value="error">Error</option>
                  </select>
                </div>
                <div className="form-control mb-4">
                  <label className="label">
                    <span className="label-text">Message Text</span>
                  </label>
                  <textarea
                    placeholder="Enter notification message..."
                    className="textarea textarea-bordered"
                    value={notificationData.text}
                    onChange={(e) =>
                      setNotificationData((prev) => ({
                        ...prev,
                        text: e.currentTarget.value,
                      }))
                    }
                    rows={3}
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Duration (ms)</span>
                  </label>
                  <input
                    type="number"
                    placeholder="3000"
                    className="input input-bordered"
                    value={notificationData.time}
                    onChange={(e) =>
                      setNotificationData((prev) => ({
                        ...prev,
                        time: e.currentTarget.value,
                      }))
                    }
                    min="1000"
                    max="10000"
                  />
                </div>
              </div>
              <div className="modal-action">
                <button
                  className="btn btn-ghost"
                  onClick={() => {
                    setShowNotificationModal(false);
                    setShowGlobalNotificationModal(false);
                    setNotificationData({
                      type: "info",
                      text: "",
                      time: "3000",
                    });
                  }}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() =>
                    sendNotification(
                      showNotificationModal
                        ? selectedConnection?.socketId
                        : undefined
                    )
                  }
                  disabled={!notificationData.text.trim()}
                >
                  Send Notification
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
