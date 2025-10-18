import { useState, useEffect } from "preact/hooks";
import { Navbar } from "../../components/Navbar";
import { api } from "../../api/client";
import { User } from "../../api/api";

interface NameSettingsProps {}

export function NameSettings(props: NameSettingsProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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

      setCurrentUser(sessionResponse.data.user);
      setNewName(sessionResponse.data.user.name);
    } catch (err: any) {
      console.error("Name settings user data load error:", err);

      if (err?.error?.status === 401) {
        setError("Session expired. Please log in again.");
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

  const handleUpdateName = async () => {
    if (!newName.trim() || newName.trim() === currentUser?.name) {
      return;
    }

    try {
      setUpdating(true);
      setError(null);
      setSuccess(false);

      await api.auth.apiUpdateUserCreate({
        name: newName.trim(),
      });

      // Reload user data to get updated information
      await loadUserData();
      setSuccess(true);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error("Name update error:", err);
      setError(err?.error?.message || err?.message || "Failed to update name");
    } finally {
      setUpdating(false);
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

  if (error && !currentUser) {
    return (
      <>
        <div className="container mx-auto px-4 py-8">
          <div className="alert alert-error">
            <span>{error}</span>
          </div>
        </div>
      </>
    );
  }

  const hasChanges =
    newName.trim() !== currentUser?.name && newName.trim() !== "";

  return (
    <>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <a href="/settings" className="btn btn-ghost btn-sm">
              ← Back to Settings
            </a>
            <h1 className="text-3xl font-bold">Change Name</h1>
          </div>

          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Display Name</span>
                  <span className="label-text-alt">Visible to other users</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter your name"
                  className="input input-bordered w-full"
                  value={newName}
                  onInput={(e) =>
                    setNewName((e.target as HTMLInputElement).value)
                  }
                  maxLength={50}
                />
                <label className="label">
                  <span className="label-text-alt">
                    {newName.length}/50 characters
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
                  <span>Name updated successfully!</span>
                </div>
              )}

              <div className="card-actions justify-between mt-6">
                <a href="/settings" className="btn btn-ghost">
                  Cancel
                </a>
                <button
                  className={`btn btn-primary ${updating ? "loading" : ""}`}
                  onClick={handleUpdateName}
                  disabled={!hasChanges || updating}
                >
                  {updating ? "Updating..." : "Update Name"}
                </button>
              </div>
            </div>
          </div>

          <div className="alert alert-info mt-6">
            <div>
              <h3 className="font-bold">Name Guidelines</h3>
              <div className="text-sm">
                <ul className="list-disc list-inside space-y-1 mt-2">
                  <li>Your name should be appropriate and respectful</li>
                  <li>Maximum 50 characters allowed</li>
                  <li>This name will be visible to other users</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
