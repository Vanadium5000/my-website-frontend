import { useEffect, useState } from "preact/hooks";
import { api } from "../api/client.js";
import { ProfilePicture } from "./ProfilePicture.js";
import { PublicUser } from "../api/api.js";
import { SortableTable, TableColumn } from "./SortableTable.jsx";
import { FaBan } from "react-icons/fa";

interface Props {
  attribute?: string;
  attributeTitle?: string;
  attributes?: string[];
  attributeTitles?: (string | null)[];
}

export function Leaderboard(props: Props) {
  const primaryAttribute = props.attributes
    ? props.attributes[0]
    : props.attribute;
  if (!primaryAttribute) return;

  const allAttributes = props.attributes || [props.attribute];
  const allTitles = props.attributeTitles || [props.attributeTitle];

  const [leaderboardUsers, setLeaderboardUsers] = useState<PublicUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        // Fetch users
        const users = (
          await api.leaderboards.getLeaderboards({
            attribute: primaryAttribute,
          })
        ).data;
        console.log("FETCHED LEADERBOARD");

        setLeaderboardUsers(users);
        setLoading(false);
      } catch (error) {
        if (error?.status == 404) {
          console.log("404 error: no users with attribute");
          setError(`No users found with attribute "${primaryAttribute}"`);
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
  }, [primaryAttribute]);

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
        <SortableTable
          columns={[
            {
              key: "name",
              title: "Name",
              sortable: true,
              width: "300px",
            },
            ...allAttributes.map((attr, i) => ({
              key: attr,
              title: allTitles[i] || attr,
              sortable: true,
            })),
          ]}
          data={leaderboardUsers}
          renderCell={(user, columnKey) => {
            if (columnKey === "name") {
              // Check if user is currently banned (not expired)
              const now = new Date();
              const isBanned =
                user.banned &&
                (!user.banExpires || new Date(user.banExpires) > now);

              return (
                <a
                  href={`/profile/${user.id}`}
                  className="flex items-center gap-3"
                >
                  <ProfilePicture name={user.name} image={user.image} />
                  <div className="font-bold flex items-center gap-2">
                    {user.name}
                    {isBanned && (
                      <FaBan
                        className="text-error text-sm"
                        title="Banned user"
                      />
                    )}
                  </div>
                </a>
              );
            }
            return user[columnKey] || "-";
          }}
          loading={false}
          emptyMessage="No users found"
        />
      )}
    </>
  );
}
