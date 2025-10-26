import { useEffect, useState } from "preact/hooks";
import { api } from "../../api/client";
import {
  FaUserShield,
  FaBan,
  FaUnlockAlt,
  FaKey,
  FaPlus,
  FaEdit,
  FaTrash,
  FaClock,
  FaExclamationTriangle,
  FaInfinity,
} from "react-icons/fa";
import { ProfilePicture } from "../../components/ProfilePicture";
import { User } from "../../api/api";

export function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showCustomFieldModal, setShowCustomFieldModal] = useState(false);
  const [showBanModal, setShowBanModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [customField, setCustomField] = useState("");
  const [banUserSelected, setBanUserSelected] = useState<User | null>(null);
  const [banReason, setBanReason] = useState("");
  const [banDuration, setBanDuration] = useState("permanent");
  const [banDurationValue, setBanDurationValue] = useState(1);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.auth.listUsers();
      setUsers(response.data.users);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch users");
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleBanUser = async (userId: string) => {
    try {
      await api.auth.banUser({ userId, banReason: "Admin ban" });
      await fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to ban user");
    }
  };

  const handleUnbanUser = async (userId: string) => {
    try {
      await api.auth.unbanUser({ userId });
      await fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to unban user");
    }
  };

  const handleChangePassword = async () => {
    if (!selectedUser || !newPassword.trim()) return;

    try {
      await api.auth.setUserPassword({
        userId: selectedUser.id!,
        newPassword: newPassword,
      });
      setShowPasswordModal(false);
      setNewPassword("");
      setSelectedUser(null);
      setError("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to change password"
      );
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this user? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      await api.auth.removeUser({ userId });
      await fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete user");
    }
  };

  const handleAddCustomField = async () => {
    if (!selectedUser || !customField.trim()) return;

    try {
      // Using updateUser with custom data - assuming the API accepts custom fields
      // The API expects 'data' as string, so we'll pass JSON string
      const customData = { customField: customField };
      await api.auth.updateUser({
        userId: selectedUser.id!,
        data: JSON.stringify(customData),
      });
      setShowCustomFieldModal(false);
      setCustomField("");
      setSelectedUser(null);
      await fetchUsers();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to add custom field"
      );
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-uk", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const calculateBanExpiry = (
    duration: string,
    value: number
  ): number | null => {
    if (duration === "permanent") return null;

    const now = new Date();
    switch (duration) {
      case "hours":
        return now.getTime() + value * 60 * 60 * 1000;
      case "days":
        return now.getTime() + value * 24 * 60 * 60 * 1000;
      case "weeks":
        return now.getTime() + value * 7 * 24 * 60 * 60 * 1000;
      case "months":
        return now.getTime() + value * 30 * 24 * 60 * 60 * 1000;
      default:
        return null;
    }
  };

  const openBanDialog = (user: User) => {
    setBanUserSelected(user);
    setBanReason("");
    setBanDuration("permanent");
    setBanDurationValue(1);
    setShowBanModal(true);
  };

  const handleAdvancedBanUser = async () => {
    if (!banUserSelected) return;

    const banExpiresIn =
      banDuration === "permanent"
        ? undefined
        : calculateBanExpiry(banDuration, banDurationValue);

    try {
      const banData: any = { userId: banUserSelected.id! };
      if (banReason.trim()) {
        banData.banReason = banReason.trim();
      }
      if (banExpiresIn !== undefined && banExpiresIn !== null) {
        banData.banExpiresIn = Math.floor(banExpiresIn / 1000); // Convert to seconds as expected by API
      }

      await api.auth.banUser(banData);
      setShowBanModal(false);
      setBanUserSelected(null);
      setBanReason("");
      await fetchUsers();
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to ban user");
    }
  };

  const getPresetBanReasons = () => [
    "Spam",
    "Harassment",
    "Inappropriate content",
    "Violation of terms",
    "Multiple complaints",
    "Impersonation",
    "Malicious behavior",
    "Admin discretion",
  ];

  return (
    <>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <a href="/admin" class="btn btn-ghost btn-sm">
            ← Back to Admin
          </a>
          <FaUserShield />
          User Management
        </h1>

        {error && (
          <div role="alert" className="alert alert-error mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 shrink-0 stroke-current"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
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
                  <th>Name</th>
                  <th>Email</th>
                  <th>ID</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <a
                        href={`/profile/${user.id}`}
                        className="flex items-center gap-3"
                      >
                        <ProfilePicture name={user.name} image={user.image} />
                        <div>
                          <div className="font-bold">{user.name}</div>
                          {user.emailVerified && (
                            <span className="badge badge-success badge-sm">
                              Verified Email
                            </span>
                          )}
                        </div>
                      </a>
                    </td>
                    <td>{user.email}</td>
                    <td>{user.id}</td>
                    <td>
                      <span
                        className={`badge ${
                          user.role === "admin"
                            ? "badge-primary"
                            : "badge-secondary"
                        }`}
                      >
                        {user.role || "user"}
                      </span>
                    </td>
                    <td>
                      {user.banned ? (
                        <span className="badge badge-error">Banned</span>
                      ) : (
                        <span className="badge badge-success">Normal</span>
                      )}
                    </td>
                    <td>{formatDate(user.createdAt)}</td>
                    <td>
                      <div className="flex gap-1">
                        {user.banned ? (
                          <button
                            className="btn btn-sm btn-success"
                            onClick={() => handleUnbanUser(user.id!)}
                            title="Unban user"
                          >
                            <FaUnlockAlt />
                          </button>
                        ) : (
                          <button
                            className="btn btn-sm btn-error"
                            onClick={() => openBanDialog(user)}
                            title="Ban user"
                          >
                            <FaBan />
                          </button>
                        )}
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => {
                            setSelectedUser(user);
                            setShowPasswordModal(true);
                          }}
                          title="Change password"
                        >
                          <FaKey />
                        </button>
                        <button
                          className="btn btn-sm btn-info"
                          onClick={() => {
                            setSelectedUser(user);
                            setShowCustomFieldModal(true);
                          }}
                          title="Set user data"
                        >
                          <FaPlus />
                        </button>
                        <button
                          className="btn btn-sm btn-error"
                          onClick={() => handleDeleteUser(user.id!)}
                          title="Delete user"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Password Change Modal */}
        {showPasswordModal && selectedUser && (
          <div className="modal modal-open">
            <div className="modal-box">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <FaKey />
                Change Password for {selectedUser.name}
              </h3>
              <div className="py-4">
                <input
                  type="password"
                  placeholder="Enter new password"
                  className="input input-bordered w-full"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.currentTarget.value)}
                />
              </div>
              <div className="modal-action">
                <button
                  className="btn btn-ghost"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setNewPassword("");
                    setSelectedUser(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleChangePassword}
                  disabled={!newPassword.trim()}
                >
                  Change Password
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Custom Field Modal */}
        {showCustomFieldModal && selectedUser && (
          <div className="modal modal-open">
            <div className="modal-box">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <FaEdit />
                Set User Data for {selectedUser.name}
              </h3>
              <p className="text-sm text-base-content/70 mb-4">
                Store arbitrary JSON data with this user (e.g., custom fields,
                metadata). This will be stored as {'{ "customField": "value" }'}
                .
              </p>
              <div className="py-4">
                <input
                  type="text"
                  placeholder="Enter value (e.g., admin notes, internal flags)"
                  className="input input-bordered w-full"
                  value={customField}
                  onChange={(e) => setCustomField(e.currentTarget.value)}
                />
              </div>
              <div className="modal-action">
                <button
                  className="btn btn-ghost"
                  onClick={() => {
                    setShowCustomFieldModal(false);
                    setCustomField("");
                    setSelectedUser(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleAddCustomField}
                  disabled={!customField.trim()}
                >
                  Save Data
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Ban Dialog Component */}
        <BanDialog
          isOpen={showBanModal}
          user={banUserSelected}
          onClose={() => {
            setShowBanModal(false);
            setBanUserSelected(null);
            setBanReason("");
          }}
          onSubmit={() => handleAdvancedBanUser()}
          banReason={banReason}
          setBanReason={setBanReason}
          banDuration={banDuration}
          setBanDuration={setBanDuration}
          banDurationValue={banDurationValue}
          setBanDurationValue={setBanDurationValue}
          getPresetBanReasons={getPresetBanReasons}
        />
      </div>
    </>
  );
}

// Utility function for calculating ban expiry
const calculateBanExpiry = (duration: string, value: number): number | null => {
  if (duration === "permanent") return null;

  const now = new Date();
  switch (duration) {
    case "hours":
      return now.getTime() + value * 60 * 60 * 1000;
    case "days":
      return now.getTime() + value * 24 * 60 * 60 * 1000;
    case "weeks":
      return now.getTime() + value * 7 * 24 * 60 * 60 * 1000;
    case "months":
      return now.getTime() + value * 30 * 24 * 60 * 60 * 1000;
    default:
      return null;
  }
};

// Export BanDialog hook for reuse in other admin pages
export function useBanDialog(refreshCallback: () => void) {
  const [banUserSelected, setBanUserSelected] = useState<User | null>(null);
  const [banReason, setBanReason] = useState("");
  const [banDuration, setBanDuration] = useState("permanent");
  const [banDurationValue, setBanDurationValue] = useState(1);

  const openBanDialog = (user: User) => {
    setBanUserSelected(user);
    setBanReason("");
    setBanDuration("permanent");
    setBanDurationValue(1);
  };

  const handleAdvancedBanUser = async () => {
    if (!banUserSelected) return;

    const banExpiresIn =
      banDuration === "permanent"
        ? undefined
        : calculateBanExpiry(banDuration, banDurationValue);

    try {
      const banData: any = { userId: banUserSelected.id! };
      if (banReason.trim()) {
        banData.banReason = banReason.trim();
      }
      if (banExpiresIn !== undefined && banExpiresIn !== null) {
        banData.banExpiresIn = Math.floor(banExpiresIn / 1000);
      }

      await api.auth.banUser(banData);
      setBanUserSelected(null);
      setBanReason("");
      refreshCallback();
    } catch (err) {
      console.error("Failed to ban user:", err);
    }
  };

  const getPresetBanReasons = () => [
    "Spam",
    "Harassment",
    "Inappropriate content",
    "Violation of terms",
    "Multiple complaints",
    "Impersonation",
    "Malicious behavior",
    "Admin discretion",
  ];

  return {
    banUserSelected,
    setBanUserSelected,
    banReason,
    setBanReason,
    banDuration,
    setBanDuration,
    banDurationValue,
    setBanDurationValue,
    openBanDialog,
    handleAdvancedBanUser,
    getPresetBanReasons,
  };
}

// Export BanDialog component for reuse
export function BanDialog({
  isOpen,
  user,
  onClose,
  onSubmit,
  banReason,
  setBanReason,
  banDuration,
  setBanDuration,
  banDurationValue,
  setBanDurationValue,
  getPresetBanReasons,
}: {
  isOpen: boolean;
  user: User | null;
  onClose: () => void;
  onSubmit: () => void;
  banReason: string;
  setBanReason: (reason: string) => void;
  banDuration: string;
  setBanDuration: (duration: string) => void;
  banDurationValue: number;
  setBanDurationValue: (value: number) => void;
  getPresetBanReasons: () => string[];
}) {
  if (!isOpen || !user) return null;

  const calculateBanExpiry = (
    duration: string,
    value: number
  ): number | null => {
    if (duration === "permanent") return null;

    const now = new Date();
    switch (duration) {
      case "hours":
        return now.getTime() + value * 60 * 60 * 1000;
      case "days":
        return now.getTime() + value * 24 * 60 * 60 * 1000;
      case "weeks":
        return now.getTime() + value * 7 * 24 * 60 * 60 * 1000;
      case "months":
        return now.getTime() + value * 30 * 24 * 60 * 60 * 1000;
      default:
        return null;
    }
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-md">
        <h3 className="font-bold text-lg flex items-center gap-2 mb-4">
          <FaExclamationTriangle className="text-error" />
          Ban User: {user.name}
        </h3>

        <div className="space-y-4">
          {/* Ban Reason */}
          <div>
            <label className="label">
              <span className="label-text">Ban Reason (Optional)</span>
            </label>
            <textarea
              className="textarea textarea-bordered w-full h-24 resize-none"
              placeholder="Enter reason for ban..."
              value={banReason}
              onChange={(e) => setBanReason(e.currentTarget.value)}
              maxLength={500}
            />
            <div className="label">
              <span className="label-text-alt text-base-content/60">
                {banReason.length}/500 characters
              </span>
            </div>

            {/* Preset Reasons */}
            <div className="mt-2">
              <label className="label">
                <span className="label-text text-sm">Quick Select:</span>
              </label>
              <div className="flex flex-wrap gap-1">
                {getPresetBanReasons().map((reason) => (
                  <button
                    key={reason}
                    className="btn btn-xs btn-outline"
                    onClick={() => setBanReason(reason)}
                    type="button"
                  >
                    {reason}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Ban Duration */}
          <div>
            <label className="label">
              <span className="label-text">Ban Duration</span>
            </label>
            <div className="flex gap-2">
              <select
                className="select select-bordered flex-1"
                value={banDuration}
                onChange={(e) => setBanDuration(e.currentTarget.value)}
              >
                <option value="permanent">
                  <FaInfinity className="inline mr-2" />
                  Permanent
                </option>
                <option value="hours">
                  <FaClock className="inline mr-2" />
                  Hours
                </option>
                <option value="days">
                  <FaClock className="inline mr-2" />
                  Days
                </option>
                <option value="weeks">
                  <FaClock className="inline mr-2" />
                  Weeks
                </option>
                <option value="months">
                  <FaClock className="inline mr-2" />
                  Months
                </option>
              </select>
              {banDuration !== "permanent" && (
                <input
                  type="number"
                  className="input input-bordered w-20"
                  min="1"
                  max="999"
                  value={banDurationValue}
                  onChange={(e) =>
                    setBanDurationValue(parseInt(e.currentTarget.value) || 1)
                  }
                />
              )}
            </div>

            {/* Preview expiration */}
            {banDuration !== "permanent" && (
              <div className="label">
                <span className="label-text-alt text-base-content/60">
                  Expires:{" "}
                  {calculateBanExpiry(banDuration, banDurationValue)
                    ? new Date(
                        calculateBanExpiry(banDuration, banDurationValue)!
                      ).toLocaleString()
                    : "Invalid date"}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Warning */}
        <div className="alert alert-warning mt-4">
          <FaExclamationTriangle />
          <div>
            <div className="font-semibold">Warning</div>
            <div className="text-sm">
              This will restrict the user's access. Ensure the ban is justified
              and follows community guidelines.
            </div>
          </div>
        </div>

        <div className="modal-action">
          <button
            className="btn btn-ghost"
            onClick={() => {
              onClose();
              setBanReason("");
            }}
          >
            Cancel
          </button>
          <button className="btn btn-error" onClick={onSubmit}>
            <FaBan className="mr-2" />
            Ban User
          </button>
        </div>
      </div>
    </div>
  );
}
