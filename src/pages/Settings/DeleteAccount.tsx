import { useState } from "preact/hooks";
import { Navbar } from "../../components/Navbar";
import { api } from "../../api/client";
import { useLocation } from "preact-iso";
import {
  FaUser,
  FaComments,
  FaLink,
  FaLock,
  FaCogs,
  FaExclamationTriangle,
} from "react-icons/fa";

interface DeleteAccountProps {}

export function DeleteAccountSettings(props: DeleteAccountProps) {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteToken, setDeleteToken] = useState<string | null>(null);
  const { route } = useLocation();

  const handleDeleteAccount = async () => {
    if (!password.trim()) {
      setError("Password is required to delete your account");
      return;
    }

    if (confirmation !== "DELETE") {
      setError("Please type 'DELETE' to confirm account deletion");
      return;
    }

    try {
      setDeleting(true);
      setError(null);

      const deleteResult = await api.auth.apiDeleteUserCreate({
        password: password.trim(),
        callbackURL: `${window.location.origin}/settings`,
      });

      if (deleteResult.data?.message === "Verification email sent") {
        // Account deletion requires email verification
        alert(
          "A confirmation email has been sent to your email address. Please check your email and click the confirmation link to complete the account deletion."
        );
        route("/settings");
      } else if (deleteResult.data?.success) {
        // Account deleted immediately
        alert("Your account has been successfully deleted.");
        // Redirect to logout or home page
        route("/");
      }
    } catch (err: any) {
      console.error("Delete account error:", err);
      setError(
        err?.error?.message || err?.message || "Failed to delete account"
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <a href="/settings" className="btn btn-ghost btn-sm">
              ← Back to Settings
            </a>
            <h1 className="text-3xl font-bold text-error">Delete Account</h1>
          </div>

          {/* Danger Warning */}
          <div className="alert alert-error mb-8">
            <div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="stroke-current shrink-0 h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.268 16.5c-.77.833 0 2.5 1.732 2.5z"
                />
              </svg>
              <div>
                <h3 className="font-bold text-lg">Danger Zone</h3>
                <div className="text-sm">
                  Deleting your account is permanent and cannot be undone. All
                  your data, posts, comments, and settings will be permanently
                  removed.
                </div>
              </div>
            </div>
          </div>

          {/* What will be deleted */}
          <div className="card bg-base-100 shadow-xl mb-8">
            <div className="card-body">
              <h2 className="card-title text-xl text-error">
                What will be deleted?
              </h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-base-200 rounded-lg">
                  <FaUser className="text-error text-xl" />
                  <div className="text-sm">
                    <strong>Profile & Personal Data:</strong> Your name, email,
                    profile picture, and personal information
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-base-200 rounded-lg">
                  <FaComments className="text-error text-xl" />
                  <div className="text-sm">
                    <strong>Content & Activity:</strong> All posts, comments,
                    likes, and any content you've created
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-base-200 rounded-lg">
                  <FaLink className="text-error text-xl" />
                  <div className="text-sm">
                    <strong>Connected Accounts:</strong> All social media links
                    and connected services will be disconnected
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-base-200 rounded-lg">
                  <FaLock className="text-error text-xl" />
                  <div className="text-sm">
                    <strong>Sessions:</strong> All active sessions will be
                    terminated
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-base-200 rounded-lg">
                  <FaCogs className="text-error text-xl" />
                  <div className="text-sm">
                    <strong>Settings & Preferences:</strong> All personal
                    settings, themes, and customizations
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-warning text-warning-content bg-opacity-10 border border-warning rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <FaExclamationTriangle />
                  Important Considerations
                </h4>
                <ul className="text-sm list-disc list-inside space-y-1">
                  <li>
                    <strong>Backup your data:</strong> Download or save any
                    important content before deleting
                  </li>
                  <li>
                    <strong>Connected services:</strong> You may need to
                    re-authorize with other services
                  </li>
                  <li>
                    <strong>Premium features:</strong> Any paid features or
                    subscriptions will be immediately canceled
                  </li>
                  <li>
                    <strong>No recovery:</strong> Once deleted, accounts cannot
                    be recovered
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Delete Confirmation Form */}
          <div className="card bg-base-100 shadow-xl border-red-500 border-2">
            <div className="card-body">
              <h2 className="card-title text-xl text-error">
                Confirm Account Deletion
              </h2>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">
                    Enter your password to confirm
                  </span>
                </label>
                <input
                  type="password"
                  placeholder="Enter your current password"
                  className="input input-bordered w-full"
                  value={password}
                  onInput={(e) =>
                    setPassword((e.target as HTMLInputElement).value)
                  }
                />
              </div>

              <div className="form-control mt-4">
                <label className="label">
                  <span className="label-text">
                    Type "DELETE" to confirm permanent deletion
                  </span>
                </label>
                <input
                  type="text"
                  placeholder="Type DELETE here"
                  className="input input-bordered w-full"
                  value={confirmation}
                  onInput={(e) =>
                    setConfirmation((e.target as HTMLInputElement).value)
                  }
                />
                <label className="label">
                  <span className="label-text-alt">
                    This action cannot be undone
                  </span>
                </label>
              </div>

              {error && (
                <div className="alert alert-error mt-4">
                  <span>{error}</span>
                </div>
              )}

              <div className="card-actions justify-between mt-8">
                <a href="/settings" className="btn btn-ghost">
                  Cancel
                </a>
                <button
                  className={`btn btn-error ${deleting ? "loading" : ""}`}
                  onClick={handleDeleteAccount}
                  disabled={
                    deleting || !password.trim() || confirmation !== "DELETE"
                  }
                >
                  {deleting ? "Deleting Account..." : "Delete My Account"}
                </button>
              </div>
            </div>
          </div>

          <div className="alert alert-warning mt-6">
            <div>
              <h3 className="font-bold">Think twice before deleting</h3>
              <div className="text-sm mt-2">
                <p className="mb-2">
                  Before you proceed, consider these alternatives:
                </p>
                <ul className="list-disc list-inside space-y-1">
                  <li>
                    <strong>Take a break:</strong> Temporarily deactivate your
                    account instead (contact support)
                  </li>
                  <li>
                    <strong>Download your data:</strong> Export your content and
                    data first
                  </li>
                  <li>
                    <strong>Think about recovery:</strong> Consider if you might
                    want to return in the future
                  </li>
                  <li>
                    <strong>Contact support:</strong> Reach out to us if you're
                    experiencing issues we can help resolve
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
