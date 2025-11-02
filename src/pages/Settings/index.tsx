import { Helmet } from "react-helmet";
import { useState, useEffect } from "preact/hooks";
import { api } from "../../api/client";
import { Session, User } from "../../api/api";
import {
  FaUser,
  FaLock,
  FaEnvelope,
  FaLink,
  FaMobileAlt,
  FaImages,
  FaBell,
  FaExclamationTriangle,
  FaCheck,
  FaTimes,
} from "react-icons/fa";

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
      <Helmet>
        <title>Settings - My Website</title>
        <meta
          name="description"
          content="Manage your account settings including profile information, password, notifications, connected accounts, and session management."
        />
        <meta
          name="keywords"
          content="settings, account settings, profile settings, user preferences, account management"
        />
        <link rel="canonical" href="/settings" />
        <meta property="og:title" content="Settings - My Website" />
        <meta
          property="og:description"
          content="Manage your account settings including profile information, password, notifications, connected accounts, and session management."
        />
        <meta property="og:image" content="/logo.png" />
        <meta property="og:url" content="/settings" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Settings - My Website" />
        <meta
          name="twitter:description"
          content="Manage your account settings including profile information, password, notifications, connected accounts, and session management."
        />
        <meta name="twitter:image" content="/logo.png" />
      </Helmet>
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
                    <span className="label-text">Verified</span>
                  </label>
                  <div className="flex items-center gap-2">
                    {currentUser.emailVerified ? (
                      <>
                        <FaCheck className="text-success" />
                        <span>Email Verified</span>
                      </>
                    ) : (
                      <>
                        <FaTimes className="text-error" />
                        <span>Email Not verified</span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {currentUser.verifiedName == currentUser.name &&
                    (currentUser.verifiedImage || null) ==
                      (currentUser.image || null) ? (
                      <>
                        <FaCheck className="text-success" />
                        <span>Profile Verified</span>
                      </>
                    ) : (
                      <>
                        <FaTimes className="text-error" />
                        <span>Profile Not verified</span>
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
                  <FaUser size={32} />

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
                  <FaLock size={32} />
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

            {!currentUser.emailVerified && (
              <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow border-warning border-2">
                <div className="card-body">
                  <div className="flex items-center gap-3">
                    <FaEnvelope size={32} className="text-warning" />
                    <div>
                      <h3 className="card-title text-lg">Verify Email</h3>
                      <p className="text-sm opacity-70">
                        Your email is not verified. Verify it to access all
                        features.
                      </p>
                    </div>
                  </div>
                  <div className="card-actions justify-end mt-4">
                    <a
                      href={`/email-verification?email=${encodeURIComponent(
                        currentUser.email
                      )}`}
                      className="btn btn-warning btn-sm"
                    >
                      Verify Email
                    </a>
                  </div>
                </div>
              </div>
            )}

            <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
              <div className="card-body">
                <div className="flex items-center gap-3">
                  <FaLink size={32} />
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
                  <FaMobileAlt size={32} />
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

            <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
              <div className="card-body">
                <div className="flex items-center gap-3">
                  <FaBell size={32} />
                  <div>
                    <h3 className="card-title text-lg">Notifications</h3>
                    <p className="text-sm opacity-70">
                      Manage email and push notification preferences
                    </p>
                  </div>
                </div>
                <div className="card-actions justify-end mt-4">
                  <a
                    href="/settings/notifications"
                    className="btn btn-primary btn-sm"
                  >
                    Notification Settings
                  </a>
                </div>
              </div>
            </div>

            <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
              <div className="card-body">
                <div className="flex items-center gap-3">
                  <FaImages size={32} />
                  <div>
                    <h3 className="card-title text-lg">Uploaded Images</h3>
                    <p className="text-sm opacity-70">
                      Manage your account images, including profile picture
                    </p>
                  </div>
                </div>
                <div className="card-actions justify-end mt-4">
                  <a href="/settings/images" className="btn btn-primary btn-sm">
                    Manage Images
                  </a>
                </div>
              </div>
            </div>

            <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow border-red-500 border-2">
              <div className="card-body">
                <div className="flex items-center gap-3">
                  <FaExclamationTriangle size={32} className="text-red-500" />
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
