import { useEffect, useState } from "preact/hooks";
import { Navbar } from "../../components/Navbar";
import { api } from "../../api/client";
import {
  FaUserShield,
  FaBan,
  FaUnlockAlt,
  FaKey,
  FaPlus,
  FaEdit,
  FaTrash,
} from "react-icons/fa";

interface User {
  id?: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string;
  createdAt: string;
  updatedAt: string;
  role?: string;
  banned?: boolean;
  banReason?: string;
  banExpires?: string;
  age?: number;
}

export function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showCustomFieldModal, setShowCustomFieldModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [customField, setCustomField] = useState("");

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

  return (
    <>
      <Navbar />
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4 flex items-center gap-2">
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
                      <div className="flex items-center gap-3">
                        <div className="avatar">
                          <div className="mask mask-squircle h-12 w-12">
                            {user.image ? (
                              <img src={user.image} alt={user.name} />
                            ) : (
                              <div className="bg-neutral-focus text-neutral-content rounded-full flex items-center justify-center h-12 w-12">
                                {user.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                        </div>
                        <div>
                          <div className="font-bold">{user.name}</div>
                          {user.emailVerified && (
                            <span className="badge badge-ghost badge-sm">
                              Verified
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>{user.email}</td>
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
                        <span className="badge badge-success">Active</span>
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
                            onClick={() => handleBanUser(user.id!)}
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
                          title="Add custom field"
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
                Add Custom Field for {selectedUser.name}
              </h3>
              <div className="py-4">
                <input
                  type="text"
                  placeholder="Enter custom field value"
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
                  Add Field
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
