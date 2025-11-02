import { Helmet } from "react-helmet-async";
import { useState, useEffect } from "preact/hooks";
import { useLocation } from "preact-iso";
import { ProfilePicture } from "../../components/ProfilePicture";
import { BanInfo } from "../../components/BanInfo";
import { api } from "../../api/client.js";
import {
  FaUser,
  FaIdCard,
  FaCalendarAlt,
  FaEdit,
  FaChessKnight,
  FaCircle,
  FaCalculator,
  FaInfo,
  FaInfoCircle,
  FaCopy,
  FaCheck,
  FaGamepad,
} from "react-icons/fa";
import { User } from "../../api/api";

interface ProfileProps {
  id?: string;
}

export function Profile({ id }: ProfileProps) {
  const { route } = useLocation();
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  const handleCopyToClipboard = async () => {
    const profileUrl = `${window.location.origin}/profile/${profileUser.id}`;
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [id]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      // First, get current session user
      const sessionResponse = await api.auth.apiGetSessionList();
      if (!sessionResponse.data) {
        throw new Error("No session data received");
      }
      setCurrentUser(sessionResponse.data.user);

      // If id is provided, fetch that user's profile
      if (id) {
        const profileResponse = await api.profile.getProfileByUserId(id);
        if (!profileResponse.data) {
          throw new Error("Profile not found");
        }
        // Convert profile data to User-like structure (limited data)
        setProfileUser({
          id: profileResponse.data.id,
          name: profileResponse.data.name,
          image: profileResponse.data.image,
          email: "", // Not available publicly
          emailVerified: false, // Not available publicly
          createdAt: profileResponse.data.createdAt,
          updatedAt: profileResponse.data.updatedAt,
          chessWins: profileResponse.data.chessWins,
          chessLosses: profileResponse.data.chessLosses,
          draughtsWins: profileResponse.data.draughtsWins,
          draughtsLosses: profileResponse.data.draughtsLosses,
          arithmeticScore: profileResponse.data.arithmeticScore,
          tetrisScore: profileResponse.data.tetrisScore,
          role: null,
          banned: profileResponse.data.banned,
          banReason: profileResponse.data.banReason,
          banExpires: profileResponse.data.banExpires,
          age: null,
        } as User);
      } else {
        // No id provided, show current user's full profile
        setProfileUser(sessionResponse.data.user);
      }
    } catch (err: any) {
      console.error("Profile load error:", err);

      // Check if it's a 401/unauthorized error
      if (err?.error?.status === 401) {
        route("/login");
        return;
      }

      setError(
        err?.error?.message ||
          err?.message ||
          "Failed to load profile. Please try refreshing the page."
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <div
          className="h-[100%] flex items-center justify-center"
          id="profile-background"
        >
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </>
    );
  }

  if (error || !profileUser) {
    return (
      <>
        <div
          className="h-[100%] flex items-center justify-center"
          id="profile-background"
        >
          <div className="alert alert-error">
            <span>{error || "Profile not found"}</span>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Profile - My Website</title>
        <meta
          name="description"
          content="View and manage your user profile, including game statistics, achievements, and personalization settings. Connect with other players and track your progress."
        />
        <meta
          name="keywords"
          content="profile, user profile, game statistics, achievements, personalization, user settings, player profile"
        />
        <link rel="canonical" href={`/profile${id ? `/${id}` : ""}`} />
        <meta property="og:title" content="Profile - My Website" />
        <meta
          property="og:description"
          content="View and manage your user profile, including game statistics, achievements, and personalization settings. Connect with other players and track your progress."
        />
        <meta property="og:image" content={profileUser?.image || "/logo.png"} />
        <meta property="og:url" content={`/profile${id ? `/${id}` : ""}`} />
        <meta property="og:type" content="profile" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Profile - My Website" />
        <meta
          name="twitter:description"
          content="View and manage your user profile, including game statistics, achievements, and personalization settings. Connect with other players and track your progress."
        />
        <meta
          name="twitter:image"
          content={profileUser?.image || "/logo.png"}
        />
      </Helmet>
      <div
        className="h-[100%] flex items-center justify-center"
        id="profile-background"
      >
        <div className="card bg-base-100 shadow-2xl max-w-md w-full mx-4">
          <div className="card-body items-center text-center">
            {/* Verification Status for Own Profile */}
            {profileUser.verifiedName &&
              (profileUser.verifiedName !== profileUser.name ||
                profileUser.verifiedImage !== profileUser.image) && (
                <div className="w-full alert alert-info mb-4">
                  <FaInfoCircle />
                  <div>
                    <h3 className="font-bold">Profile Verification Pending</h3>
                    <p>What others currently see:</p>
                    <div className="flex items-center gap-2">
                      <ProfilePicture
                        name={profileUser.verifiedName}
                        image={profileUser.verifiedImage}
                        widthClass="w-8"
                      />

                      <span className="text-lg font-semibold">
                        {profileUser.verifiedName}
                      </span>
                    </div>
                  </div>
                </div>
              )}

            <a href={`/profile/${profileUser.id}`}>
              {/* Profile Picture */}
              <ProfilePicture
                name={profileUser.name}
                image={profileUser.image}
                widthClass="w-16"
              />

              {/* Ban Info */}
              <BanInfo
                banned={profileUser.banned}
                banReason={profileUser.banReason}
                banExpires={profileUser.banExpires}
                className="w-full max-w-sm"
              />

              {/* Name */}
              <h2 className="card-title text-2xl font-bold mt-2">
                <FaUser className="inline mr-2" />
                {profileUser.name}
              </h2>
            </a>

            {/* User ID */}
            <div className="flex items-center gap-2 text-sm opacity-70">
              <FaIdCard />
              <span>{profileUser.id}</span>
              <button
                className="btn btn-ghost btn-xs"
                onClick={handleCopyToClipboard}
                title="Copy profile link"
              >
                {copySuccess ? (
                  <FaCheck className="text-success" />
                ) : (
                  <FaCopy />
                )}
              </button>
            </div>

            {/* Dates */}
            {profileUser.createdAt && (
              <div className="flex items-center gap-2 text-sm opacity-70 mt-2">
                <FaCalendarAlt />
                <span>
                  Created:{" "}
                  {new Date(profileUser.createdAt).toLocaleDateString()}
                </span>
              </div>
            )}
            {profileUser.updatedAt && (
              <div className="flex items-center gap-2 text-sm opacity-70 mt-2">
                <FaCalendarAlt />
                <span>
                  Updated:{" "}
                  {new Date(profileUser.updatedAt).toLocaleDateString()}
                </span>
              </div>
            )}

            {/* Stats Table */}
            <div className="overflow-x-auto mt-4">
              <table className="table table-zebra w-full">
                <thead>
                  <tr>
                    <th>Game</th>
                    <th>Wins</th>
                    <th>Losses</th>
                    <th>Score</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="hover">
                    <td className="flex items-center gap-2">
                      <FaChessKnight />
                      Chess
                    </td>
                    <td>{profileUser.chessWins || 0}</td>
                    <td>{profileUser.chessLosses || 0}</td>
                    <td>-</td>
                  </tr>
                  <tr className="hover">
                    <td className="flex items-center gap-2">
                      <FaCircle />
                      Draughts
                    </td>
                    <td>{profileUser.draughtsWins || 0}</td>
                    <td>{profileUser.draughtsLosses || 0}</td>
                    <td>-</td>
                  </tr>
                  <tr className="hover">
                    <td className="flex items-center gap-2">
                      <FaCalculator />
                      Arithmetic
                    </td>
                    <td>-</td>
                    <td>-</td>
                    <td>{profileUser.arithmeticScore || 0}</td>
                  </tr>
                  <tr className="hover">
                    <td className="flex items-center gap-2">
                      <FaGamepad />
                      Tetris
                    </td>
                    <td>-</td>
                    <td>-</td>
                    <td>{profileUser.tetrisScore || 0}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Edit button if viewing own profile */}
            {currentUser &&
              currentUser.id === profileUser.id &&
              profileUser.createdAt && (
                <div className="card-actions justify-center mt-6">
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => route("/settings")}
                  >
                    <FaEdit className="mr-2" />
                    Edit Profile
                  </button>
                </div>
              )}
          </div>
        </div>
      </div>

      <style jsx>{`
        #profile-background {
          background-image: url("/random-image.jpg");
          background-size: cover;
        }
      `}</style>
    </>
  );
}
