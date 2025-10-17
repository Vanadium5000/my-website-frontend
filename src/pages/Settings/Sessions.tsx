import { useState, useEffect } from "preact/hooks";
import { Navbar } from "../../components/Navbar";
import { api } from "../../api/client";
import { Session } from "../../api/api";
import {
  FaDesktop,
  FaMobileAlt,
  FaTabletAlt,
  FaCheck,
  FaLock,
} from "react-icons/fa";

interface SessionsProps {}

export function SessionsSettings(props: SessionsProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [revokingAll, setRevokingAll] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current session
      const sessionResponse = await api.auth.apiGetSessionList();

      if (!sessionResponse.data) {
        throw new Error("No session data received");
      }

      setCurrentSessionId(sessionResponse.data.session.id);

      // Load all sessions
      const sessionsResponse = await api.auth.apiListSessionsList();
      setSessions(sessionsResponse.data || []);
    } catch (err: any) {
      console.error("Sessions load error:", err);

      if (err?.error?.status === 401) {
        setError("Session expired. Please log in again.");
        return;
      }

      setError(
        err?.error?.message ||
          err?.message ||
          "Failed to load sessions. Please try refreshing the page."
      );
    } finally {
      setLoading(false);
    }
  };

  const getDeviceIcon = (userAgent: string) => {
    if (!userAgent) return <FaDesktop />;

    const ua = userAgent.toLowerCase();

    if (
      ua.includes("mobile") ||
      ua.includes("android") ||
      ua.includes("iphone")
    ) {
      return <FaMobileAlt />;
    }
    if (ua.includes("tablet") || ua.includes("ipad")) {
      return <FaTabletAlt />;
    }

    return <FaDesktop />;
  };

  const formatDeviceInfo = (userAgent: string) => {
    if (!userAgent) return "Desktop";

    const ua = userAgent.toLowerCase();

    if (ua.includes("mobile")) return "Mobile";
    if (ua.includes("tablet")) return "Tablet";
    if (ua.includes("android")) return "Android";
    if (ua.includes("iphone") || ua.includes("ipad")) return "iOS";
    if (ua.includes("windows")) return "Windows";
    if (ua.includes("mac")) return "macOS";
    if (ua.includes("linux")) return "Linux";

    return "Desktop";
  };

  const handleRevokeSession = async (
    sessionToken: string,
    isCurrentSession: boolean = false
  ) => {
    if (isCurrentSession) {
      // For current session, use revoke-other-sessions
      await handleRevokeOtherSessions();
      return;
    }

    try {
      setRevoking(sessionToken);
      setError(null);

      await api.auth.apiRevokeSessionCreate({
        token: sessionToken,
      });

      setSuccess("Session revoked successfully");
      await loadSessions();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error("Revoke session error:", err);
      setError(
        err?.error?.message || err?.message || "Failed to revoke session"
      );
    } finally {
      setRevoking(null);
    }
  };

  const handleRevokeOtherSessions = async () => {
    try {
      setRevokingAll(true);
      setError(null);

      await api.auth.apiRevokeOtherSessionsCreate({});

      setSuccess("All other sessions revoked successfully");
      await loadSessions();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error("Revoke other sessions error:", err);
      setError(
        err?.error?.message || err?.message || "Failed to revoke other sessions"
      );
    } finally {
      setRevokingAll(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;

    return (
      date.toLocaleDateString() +
      " " +
      date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    );
  };

  const otherSessions = sessions.filter(
    (session) => session.id !== currentSessionId
  );
  const hasOtherSessions = otherSessions.length > 0;

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <a href="/settings" className="btn btn-ghost btn-sm">
              ← Back to Settings
            </a>
            <h1 className="text-3xl font-bold">Active Sessions</h1>
          </div>

          {/* Bulk Actions */}
          {hasOtherSessions && (
            <div className="card bg-base-100 shadow-xl mb-8">
              <div className="card-body">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="card-title text-lg">Active Sessions</h3>
                    <p className="text-sm opacity-70">
                      {otherSessions.length} other session
                      {otherSessions.length !== 1 ? "s" : ""} active
                    </p>
                  </div>
                  <button
                    className={`btn btn-outline btn-error ${
                      revokingAll ? "loading" : ""
                    }`}
                    onClick={handleRevokeOtherSessions}
                    disabled={revokingAll}
                  >
                    {revokingAll ? "Revoking..." : "Revoke All Others"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Current Session */}
          {currentSessionId && (
            <div className="card bg-base-100 shadow-xl mb-8">
              <div className="card-body">
                <h2 className="card-title text-xl mb-4">Current Session</h2>
                <div className="space-y-4">
                  {sessions
                    .filter((session) => session.id === currentSessionId)
                    .map((session) => (
                      <div
                        key={session.id}
                        className="flex items-center justify-between p-4 border border-base-300 rounded-lg bg-success bg-opacity-10 border-success border-opacity-30"
                      >
                        <div className="flex items-center gap-3">
                          <div className="avatar placeholder">
                            <div className="bg-success text-white rounded-full w-10 flex items-center justify-center">
                              <FaCheck />
                            </div>
                          </div>
                          <div>
                            <div className="font-semibold flex items-center gap-2">
                              {formatDeviceInfo(session.userAgent || "")}
                              <span className="badge badge-success badge-sm">
                                Current
                              </span>
                            </div>
                            <div className="text-sm text-gray-500">
                              IP: {session.ipAddress || "Unknown"}
                            </div>
                            <div className="text-sm text-gray-500">
                              Started: {formatTime(session.createdAt)}
                            </div>
                          </div>
                        </div>
                        <div className="text-xs opacity-50">Active now</div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* Other Sessions */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title text-xl mb-4">Other Sessions</h2>

              {!hasOtherSessions ? (
                <div className="text-center py-8">
                  <FaLock className="text-6xl mb-4 mx-auto" />
                  <h3 className="font-bold text-lg mb-2">
                    No Other Active Sessions
                  </h3>
                  <p className="text-gray-500 text-sm">
                    Other devices and browsers where you're signed in will
                    appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {otherSessions.map((session) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-4 border border-base-300 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="avatar placeholder">
                          <div className="bg-neutral text-neutral-content rounded-full w-10 flex items-center justify-center text-sm">
                            {getDeviceIcon(session.userAgent || "")}
                          </div>
                        </div>
                        <div>
                          <div className="font-semibold">
                            {formatDeviceInfo(session.userAgent || "")}
                          </div>
                          <div className="text-sm text-gray-500">
                            IP: {session.ipAddress || "Unknown"}
                          </div>
                          <div className="text-sm text-gray-500">
                            Started: {formatTime(session.createdAt)}
                          </div>
                          <div className="text-sm text-gray-500">
                            Last active: {formatTime(session.updatedAt)}
                          </div>
                        </div>
                      </div>
                      <button
                        className={`btn btn-sm btn-outline btn-error ${
                          revoking === session.token ? "loading" : ""
                        }`}
                        onClick={() => handleRevokeSession(session.token)}
                        disabled={revoking !== null || revokingAll}
                      >
                        {revoking === session.token ? "Revoking..." : "Revoke"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="alert alert-error mt-6">
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="alert alert-success mt-6">
              <span>{success}</span>
            </div>
          )}

          <div className="alert alert-info mt-6">
            <div>
              <h3 className="font-bold">Session Security</h3>
              <div className="text-sm mt-2">
                <p className="mb-2">
                  Active sessions represent devices and browsers where you're
                  currently signed in.
                </p>
                <ul className="list-disc list-inside space-y-1">
                  <li>
                    Monitor and revoke access from suspicious or unused devices
                  </li>
                  <li>Regularly review your active sessions for security</li>
                  <li>Revoking a session immediately logs it out</li>
                  <li>
                    If you suspect unauthorized access, change your password
                    immediately
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
