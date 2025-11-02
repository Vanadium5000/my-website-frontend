import { Helmet } from "react-helmet-async";
import { useState } from "preact/hooks";
import { api } from "../../api/client";
import { useLocation } from "preact-iso";
import { FaCheck, FaTimes } from "react-icons/fa";

interface PasswordSettingsProps {}

export function PasswordSettings(props: PasswordSettingsProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [revokeOthers, setRevokeOthers] = useState(false);
  const { route } = useLocation();

  const validatePasswords = () => {
    if (!currentPassword.trim()) {
      setError("Current password is required");
      return false;
    }
    if (!newPassword.trim()) {
      setError("New password is required");
      return false;
    }
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters long");
      return false;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return false;
    }
    if (currentPassword === newPassword) {
      setError("New password must be different from current password");
      return false;
    }
    return true;
  };

  const handleUpdatePassword = async () => {
    if (!validatePasswords()) {
      return;
    }

    try {
      setUpdating(true);
      setError(null);
      setSuccess(false);

      await api.auth.apiChangePasswordCreate({
        newPassword,
        currentPassword,
        revokeOtherSessions: revokeOthers,
      });

      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      // Clear success message after 5 seconds and redirect
      setTimeout(() => {
        setSuccess(false);
        route("/settings");
      }, 5000);
    } catch (err: any) {
      console.error("Password update error:", err);
      setError(
        err?.error?.message || err?.message || "Failed to update password"
      );
    } finally {
      setUpdating(false);
    }
  };

  const passwordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const getStrengthLabel = (strength: number) => {
    const labels = ["Very Weak", "Weak", "Fair", "Good", "Strong"];
    return labels[strength - 1] || "Very Weak";
  };

  const getStrengthColor = (strength: number) => {
    const colors = [
      "bg-red-500",
      "bg-orange-500",
      "bg-yellow-500",
      "bg-blue-500",
      "bg-green-500",
    ];
    return colors[strength - 1] || "bg-red-500";
  };

  return (
    <>
      <Helmet>
        <title>Password Settings - My Website</title>
        <meta
          name="description"
          content="Change your account password securely. Update your login credentials and optionally revoke other active sessions."
        />
        <meta
          name="keywords"
          content="password settings, change password, account security, password update, session management"
        />
        <link rel="canonical" href="/settings/password" />
        <meta property="og:title" content="Password Settings - My Website" />
        <meta
          property="og:description"
          content="Change your account password securely. Update your login credentials and optionally revoke other active sessions."
        />
        <meta property="og:image" content="/logo.png" />
        <meta property="og:url" content="/settings/password" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Password Settings - My Website" />
        <meta
          name="twitter:description"
          content="Change your account password securely. Update your login credentials and optionally revoke other active sessions."
        />
        <meta name="twitter:image" content="/logo.png" />
      </Helmet>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <a href="/settings" className="btn btn-ghost btn-sm">
              ← Back to Settings
            </a>
            <h1 className="text-3xl font-bold">Change Password</h1>
          </div>

          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Current Password</span>
                </label>
                <input
                  type="password"
                  placeholder="Enter current password"
                  className="input input-bordered w-full"
                  value={currentPassword}
                  onInput={(e) =>
                    setCurrentPassword((e.target as HTMLInputElement).value)
                  }
                />
              </div>

              <div className="form-control mt-4">
                <label className="label">
                  <span className="label-text">New Password</span>
                </label>
                <input
                  type="password"
                  placeholder="Enter new password"
                  className="input input-bordered w-full"
                  value={newPassword}
                  onInput={(e) =>
                    setNewPassword((e.target as HTMLInputElement).value)
                  }
                />
                {newPassword && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Password strength:</span>
                      <span
                        className={`font-medium ${getStrengthColor(
                          passwordStrength(newPassword)
                        ).replace("bg-", "text-")}`}
                      >
                        {getStrengthLabel(passwordStrength(newPassword))}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div
                        className={`h-2 rounded-full ${getStrengthColor(
                          passwordStrength(newPassword)
                        )}`}
                        style={{
                          width: `${
                            (passwordStrength(newPassword) / 5) * 100
                          }%`,
                        }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>

              <div className="form-control mt-4">
                <label className="label">
                  <span className="label-text">Confirm New Password</span>
                </label>
                <input
                  type="password"
                  placeholder="Confirm new password"
                  className="input input-bordered w-full"
                  value={confirmPassword}
                  onInput={(e) =>
                    setConfirmPassword((e.target as HTMLInputElement).value)
                  }
                />
                {confirmPassword && newPassword && (
                  <div className="mt-1 flex items-center gap-1">
                    {newPassword === confirmPassword ? (
                      <span className="text-success text-sm">
                        <FaCheck /> Passwords match
                      </span>
                    ) : (
                      <span className="text-error text-sm">
                        <FaTimes /> Passwords do not match
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="form-control mt-4">
                <label className="label cursor-pointer">
                  <input
                    type="checkbox"
                    className="checkbox"
                    checked={revokeOthers}
                    onChange={(e) =>
                      setRevokeOthers((e.target as HTMLInputElement).checked)
                    }
                  />
                  <span className="label-text">
                    Revoke all other sessions
                    <span className="text-sm opacity-70 block">
                      Log out from all devices and browsers after password
                      change
                    </span>
                  </span>
                </label>
              </div>

              {error && (
                <div className="alert alert-error mt-4">
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="alert alert-success mt-4">
                  <span>
                    Password updated successfully! All other sessions have been
                    revoked if selected.
                  </span>
                </div>
              )}

              <div className="card-actions justify-between mt-6">
                <a href="/settings" className="btn btn-ghost">
                  Cancel
                </a>
                <button
                  className={`btn btn-primary ${updating ? "loading" : ""}`}
                  onClick={handleUpdatePassword}
                  disabled={
                    updating ||
                    !currentPassword ||
                    !newPassword ||
                    !confirmPassword
                  }
                >
                  {updating ? "Updating..." : "Update Password"}
                </button>
              </div>
            </div>
          </div>

          <div className="alert alert-info mt-6">
            <div>
              <h3 className="font-bold">Password Requirements</h3>
              <div className="text-sm">
                <ul className="list-disc list-inside space-y-1 mt-2">
                  <li>Minimum 8 characters long</li>
                  <li>Use a mix of uppercase and lowercase letters</li>
                  <li>Include at least one number</li>
                  <li>Add special characters for extra strength</li>
                  <li>Choose a password different from your current one</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
