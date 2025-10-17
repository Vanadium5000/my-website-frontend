import { useState, useEffect } from "preact/hooks";
import { Navbar } from "../../components/Navbar";
import { api } from "../../api/client";
import { Session, User } from "../../api/api";

interface SettingsPageProps {}

export function Settings(props: SettingsPageProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentSession, setCurrentSession] = useState<{
    session: Session;
    user: User;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      setError(null);
      const sessionResponse = await api.auth.apiGetSessionList();

      if (!sessionResponse.data) {
        throw new Error("No session data received");
      }

      setCurrentSession(sessionResponse.data);
      setCurrentUser(sessionResponse.data.user);
    } catch (err: any) {
      console.error("Settings user data load error:", err);

      // Check if it's a 401/unauthorized error
      if (err?.error?.status === 401) {
        setError("Session expired. Please log in again.");
        // Redirect will happen via preact-iso
        return;
      }

      setError(
        err?.error?.message ||
          err?.message ||
          "Failed to load user data. Please try refreshing the page."
      );
    } finally {
      setLoading(false);
    }
  };

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

  if (error || !currentUser) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="alert alert-error">
            <span>{error || "User not authenticated"}</span>
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
          <h1 className="text-3xl font-bold mb-8">Account Settings</h1>

          {/* User Info Card */}
          <div className="card bg-base-100 shadow-xl mb-8">
            <div className="card-body">
              <h2 className="card-title">Profile Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">
                    <span className="label-text">Name</span>
                  </label>
                  <input
                    type="text"
                    value={currentUser.name}
                    className="input input-bordered w-full"
                    readOnly
                  />
                </div>
                <div>
                  <label className="label">
                    <span className="label-text">Email</span>
                  </label>
                  <input
                    type="email"
                    value={currentUser.email}
                    className="input input-bordered w-full"
                    readOnly
                  />
                </div>
                <div>
                  <label className="label">
                    <span className="label-text">Email Verified</span>
                  </label>
                  <div className="flex items-center gap-2">
                    {currentUser.emailVerified ? (
                      <>
                        <span className="text-success">✓</span>
                        <span>Verified</span>
                      </>
                    ) : (
                      <>
                        <span className="text-error">✗</span>
                        <span>Not verified</span>
                      </>
                    )}
                  </div>
                </div>
                <div>
                  <label className="label">
                    <span className="label-text">Joined</span>
                  </label>
                  <div>
                    <span>
                      {new Date(currentUser.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Settings Menu */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
              <div className="card-body">
                <div className="flex items-center gap-3">
                  <div className="avatar placeholder">
                    <div className="bg-neutral text-neutral-content rounded-full w-12">
                      <span className="text-xl">👤</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="card-title text-lg">Change Name</h3>
                    <p className="text-sm opacity-70">
                      Update your display name
                    </p>
                  </div>
                </div>
                <div className="card-actions justify-end mt-4">
                  <a href="/settings/name" className="btn btn-primary btn-sm">
                    Change Name
                  </a>
                </div>
              </div>
            </div>

            <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
              <div className="card-body">
                <div className="flex items-center gap-3">
                  <div className="avatar placeholder">
                    <div className="bg-neutral text-neutral-content rounded-full w-12">
                      <span className="text-xl">🔒</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="card-title text-lg">Change Password</h3>
                    <p className="text-sm opacity-70">Update your password</p>
                  </div>
                </div>
                <div className="card-actions justify-end mt-4">
                  <a
                    href="/settings/password"
                    className="btn btn-primary btn-sm"
                  >
                    Change Password
                  </a>
                </div>
              </div>
            </div>

            <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
              <div className="card-body">
                <div className="flex items-center gap-3">
                  <div className="avatar placeholder">
                    <div className="bg-neutral text-neutral-content rounded-full w-12">
                      <span className="text-xl">🔗</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="card-title text-lg">Connected Accounts</h3>
                    <p className="text-sm opacity-70">Manage social logins</p>
                  </div>
                </div>
                <div className="card-actions justify-end mt-4">
                  <a
                    href="/settings/accounts"
                    className="btn btn-primary btn-sm"
                  >
                    Manage Accounts
                  </a>
                </div>
              </div>
            </div>

            <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
              <div className="card-body">
                <div className="flex items-center gap-3">
                  <div className="avatar placeholder">
                    <div className="bg-neutral text-neutral-content rounded-full w-12">
                      <span className="text-xl">📱</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="card-title text-lg">Active Sessions</h3>
                    <p className="text-sm opacity-70">
                      View and manage sessions
                    </p>
                  </div>
                </div>
                <div className="card-actions justify-end mt-4">
                  <a
                    href="/settings/sessions"
                    className="btn btn-primary btn-sm"
                  >
                    View Sessions
                  </a>
                </div>
              </div>
            </div>

            <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow border-red-500 border-2">
              <div className="card-body">
                <div className="flex items-center gap-3">
                  <div className="avatar placeholder">
                    <div className="bg-error text-white rounded-full w-12">
                      <span className="text-xl">⚠️</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="card-title text-lg text-error">
                      Danger Zone
                    </h3>
                    <p className="text-sm opacity-70">Delete your account</p>
                  </div>
                </div>
                <div className="card-actions justify-end mt-4">
                  <a
                    href="/settings/delete"
                    className="btn btn-error btn-outline btn-sm"
                  >
                    Delete Account
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
