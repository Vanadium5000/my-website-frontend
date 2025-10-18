import { useEffect, useState } from "preact/hooks";
import { api } from "../api/client.js";
import { Profile } from "./CommentCard.js";
import { ProfilePicture } from "./ProfilePicture.js";

interface Props {
  attribute: string;
  attributeTitle?: string;
}

export function Leaderboard(props: Props) {
  if (!props.attribute) return;

  const [leaderboardUsers, setLeaderboardUsers] = useState<Profile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        // Fetch users
        const users = (
          await api.leaderboards.getLeaderboards({ attribute: props.attribute })
        ).data;
        console.log("FETCHED LEADERBOARD");

        setLeaderboardUsers(users);
        setLoading(false);
      } catch (error) {
        if (error?.status == 404) {
          console.log("404 error: no users with attribute");
          setError(`No users found with attribute "${props.attribute}"`);
          setLoading(false);
          return;
        }

        setError(
          error instanceof Error ? error.message : "Failed to fetch leaderboard"
        );
        console.error("Error:", error);
        setLoading(false);
      }
    })();
  }, [props]);

  return (
    <>
      {error ? (
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
      ) : loading ? (
        <div className="flex justify-center">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="table table-zebra table-fixed w-full">
            <thead>
              <tr>
                <th className="w-1/2">Name</th>
                <th className="w-1/2">
                  {props.attributeTitle || props.attribute}
                </th>
              </tr>
            </thead>
            <tbody>
              {leaderboardUsers.map((user) => (
                <tr key={user.id}>
                  <td>
                    <a
                      href={`/profile/${user.id}`}
                      className="flex items-center gap-3"
                    >
                      <ProfilePicture name={user.name} image={user.image} />
                      <div className="font-bold">{user.name}</div>
                    </a>
                  </td>
                  <td>{String(user[props.attribute])}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
