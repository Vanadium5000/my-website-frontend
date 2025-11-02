import { Helmet } from "react-helmet";
import { useEffect, useState } from "preact/hooks";
import { api } from "../../api/client";
import { FaUserShield, FaCheck, FaBan, FaUnlockAlt } from "react-icons/fa";
import { ProfilePicture } from "../../components/ProfilePicture";
import { BanInfo } from "../../components/BanInfo";
import { useBanDialog, BanDialog } from "./Users";
import { UnverifiedProfile, User } from "../../api/api";

export function AdminProfiles() {
  const [profiles, setProfiles] = useState<UnverifiedProfile[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [profilesResponse, usersResponse] = await Promise.all([
        api.admin.getAdminProfileUnverified(),
        api.auth.listUsers(),
      ]);
      setProfiles(profilesResponse.data);
      setUsers(usersResponse.data.users || []);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch data");
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Use the ban dialog hook after fetchData is defined
  const banDialog = useBanDialog(fetchData);

  useEffect(() => {
    fetchData();
  }, []);

  const getUserById = (userId: string) => {
    return users.find((user) => user.id === userId);
  };

  const handleVerifyProfile = async (userId: string) => {
    try {
      await api.admin.postAdminProfileByUserIdVerify(userId);
      await fetchData(); // Refresh data after verification
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to verify profile");
    }
  };

  const handleBanUser = async (userId: string) => {
    try {
      await api.auth.banUser({ userId, banReason: "Admin ban" });
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to ban user");
    }
  };

  const handleUnbanUser = async (userId: string) => {
    try {
      await api.auth.unbanUser({ userId });
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to unban user");
    }
  };

  return (
    <>
      <Helmet>
        <title>Profile Verification - My Website</title>
        <meta
          name="description"
          content="Admin panel for verifying user profile changes including names and images. Review and approve or reject profile modifications."
        />
        <meta
          name="keywords"
          content="admin profiles, profile verification, user verification, profile moderation, admin panel"
        />
        <link rel="canonical" href="/admin/profiles" />
        <meta property="og:title" content="Profile Verification - My Website" />
        <meta
          property="og:description"
          content="Admin panel for verifying user profile changes including names and images. Review and approve or reject profile modifications."
        />
        <meta property="og:image" content="/logo.png" />
        <meta property="og:url" content="/admin/profiles" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="Profile Verification - My Website"
        />
        <meta
          name="twitter:description"
          content="Admin panel for verifying user profile changes including names and images. Review and approve or reject profile modifications."
        />
        <meta name="twitter:image" content="/logo.png" />
      </Helmet>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <a href="/admin" className="btn btn-ghost btn-sm">
            ← Back to Admin
          </a>
          <FaUserShield />
          Profile Verification
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
        ) : profiles.length === 0 ? (
          <div className="text-center py-8">
            <h2 className="text-lg font-medium text-base-content/70">
              No unverified profiles
            </h2>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-zebra w-full">
              <thead>
                <tr>
                  <th>User ID</th>
                  <th>Current Profile</th>
                  <th>Proposed Changes</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map((profile) => {
                  const user = getUserById(profile.id);
                  return (
                    <tr key={profile.id}>
                      <td>{profile.id}</td>
                      <td>
                        <a
                          href={`/profile/${profile.id}`}
                          className="flex items-center gap-3"
                        >
                          <ProfilePicture
                            name={profile.verifiedName || "No Name"}
                            image={profile.verifiedImage}
                          />
                          <div>
                            <div className="font-bold">
                              {profile.verifiedName || "No verified name"}
                            </div>
                          </div>
                        </a>
                      </td>
                      <td>
                        <a
                          href={`/profile/${profile.id}`}
                          className="flex items-center gap-3"
                        >
                          <ProfilePicture
                            name={profile.name}
                            image={profile.image}
                          />
                          <div>
                            <div className="font-bold">{profile.name}</div>
                            <div className="text-sm opacity-70">
                              New Icon:{" "}
                              {profile.image != profile.verifiedImage
                                ? "Yes"
                                : "No"}
                            </div>
                          </div>
                        </a>
                      </td>
                      <td>
                        {user ? (
                          user.banned ? (
                            <BanInfo
                              banned={user.banned}
                              banReason={user.banReason}
                              banExpires={user.banExpires}
                              className="text-xs"
                            />
                          ) : (
                            <span className="badge badge-success">Active</span>
                          )
                        ) : (
                          <span className="badge badge-neutral">Unknown</span>
                        )}
                      </td>
                      <td>
                        <div className="flex gap-1">
                          <button
                            className="btn btn-sm btn-success"
                            onClick={() => handleVerifyProfile(profile.id)}
                            title="Verify profile changes"
                          >
                            <FaCheck />
                          </button>
                          {user?.banned ? (
                            <button
                              className="btn btn-sm btn-success"
                              onClick={() => handleUnbanUser(profile.id)}
                              title="Unban user"
                            >
                              <FaUnlockAlt />
                            </button>
                          ) : (
                            <button
                              className="btn btn-sm btn-error"
                              onClick={() => {
                                const user = getUserById(profile.id);
                                if (user) banDialog.openBanDialog(user);
                              }}
                              title="Ban user"
                            >
                              <FaBan />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Ban Dialog Component */}
        <BanDialog
          isOpen={!!banDialog.banUserSelected}
          user={banDialog.banUserSelected}
          onClose={() => banDialog.setBanUserSelected(null)}
          onSubmit={banDialog.handleAdvancedBanUser}
          banReason={banDialog.banReason}
          setBanReason={banDialog.setBanReason}
          banDuration={banDialog.banDuration}
          setBanDuration={banDialog.setBanDuration}
          banDurationValue={banDialog.banDurationValue}
          setBanDurationValue={banDialog.setBanDurationValue}
          getPresetBanReasons={banDialog.getPresetBanReasons}
        />
      </div>
    </>
  );
}
