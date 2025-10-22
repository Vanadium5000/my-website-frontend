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
      <div
        className="h-[100%] flex items-center justify-center"
        id="profile-background"
      >
        <div className="card bg-base-100 shadow-2xl max-w-md w-full mx-4">
          <div className="card-body items-center text-center">
            {/* Profile Picture */}
            <ProfilePicture name={profileUser.name} image={profileUser.image} />

            {/* Ban Info */}
            <BanInfo
              banned={profileUser.banned}
              banReason={profileUser.banReason}
              banExpires={profileUser.banExpires}
              className="w-full max-w-sm"
            />

            {/* Name */}
            <h2 className="card-title text-2xl font-bold mt-4">
              <FaUser className="inline mr-2" />
              {profileUser.name}
            </h2>

            {/* User ID */}
            <div className="flex items-center gap-2 text-sm opacity-70">
              <FaIdCard />
              <span>{profileUser.id}</span>
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

            {/* Stats */}
            {/* Chess Stats */}
            {(profileUser.chessWins !== undefined ||
              profileUser.chessLosses !== undefined) && (
              <div className="flex items-center gap-2 text-sm opacity-70 mt-2">
                <FaChessKnight />
                <span>
                  Chess: Wins: {profileUser.chessWins ?? 0}, Losses:{" "}
                  {profileUser.chessLosses ?? 0}
                </span>
              </div>
            )}
            {/* Draughts Stats */}
            {(profileUser.draughtsWins !== undefined ||
              profileUser.draughtsLosses !== undefined) && (
              <div className="flex items-center gap-2 text-sm opacity-70 mt-2">
                <FaCircle />
                <span>
                  Draughts: Wins: {profileUser.draughtsWins ?? 0}, Losses:{" "}
                  {profileUser.draughtsLosses ?? 0}
                </span>
              </div>
            )}
            {/* Arithmetic Score */}
            {profileUser.arithmeticScore !== undefined &&
              profileUser.arithmeticScore !== null && (
                <div className="flex items-center gap-2 text-sm opacity-70 mt-2">
                  <FaCalculator />
                  <span>Arithmetic Score: {profileUser.arithmeticScore}</span>
                </div>
              )}

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
