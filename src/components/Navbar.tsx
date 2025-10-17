import { useLocation } from "preact-iso";
import { ThemeDropdown } from "./ThemeDropdown";
import { useEffect, useState } from "preact/hooks";
import { api } from "../api/client.js";
import { User } from "../api/api";
import { FaSignInAlt, FaSignOutAlt, FaUser } from "react-icons/fa";
import { FiSettings } from "react-icons/fi";

export function Navbar() {
  const { route } = useLocation();

  const [user, setUser] = useState<User | null>(null);
  const [imageURL, setImageURL] = useState("");
  const [error, setError] = useState("");

  // Load user data from backend
  useEffect(() => {
    async function fetchUserData() {
      try {
        // Fetch user's current username
        const sessionResponse = (await api.auth.apiGetSessionList()).data;

        setUser(sessionResponse.user);
      } catch (error) {
        if (error?.error?.status == 401) {
          console.log("Not logged in: can't fetch user data");
          return;
        }

        const errorMessage =
          error instanceof Error ? error.message : "Fetching user data failed";
        setError(errorMessage);
        console.error("Error:", error);
      }
    }

    fetchUserData();
  }, []);

  // Generate or set the user's avatar
  useEffect(() => {
    (async () => {
      try {
        if (!user) {
          return;
        }
        // Generate or set the user's avatar
        const imageURL =
          user.image ||
          (await (await api.avatar.getAvatar({ name: user.name })).text());
        console.log("GOT IMAGE URL:", imageURL);

        setImageURL(imageURL);
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Generating or setting the user's avatar failed";
        setError(errorMessage);
        console.error("Error:", error);
      }
    })();
  }, [user]);

  function logout() {
    api.auth.apiSignOutCreate({});
    route("/login");
  }

  return (
    <div className="navbar bg-neutral text-neutral-content shadow-sm">
      <div className="navbar-start">
        <a className="btn btn-ghost text-xl" href="/">
          My Website
        </a>
      </div>
      <div className="navbar-center">
        <ul className="menu menu-horizontal px-1">
          <li>
            <a href="/">Home</a>
          </li>
          <li>
            <details>
              <summary>Info</summary>
              <ul className="dropdown-content bg-base-300 rounded-box z-1 w-26 p-2 shadow-2xl">
                <li>
                  <a href="/about" className="btn btn-sm btn-block">
                    About
                  </a>
                </li>
                <li>
                  <a href="/contact" className="btn btn-sm btn-block">
                    Contact
                  </a>
                </li>
              </ul>
            </details>
          </li>
          <li>
            <a href="/blog">Blog</a>
          </li>
          <li>
            <a href="/projects">Projects</a>
          </li>
        </ul>
      </div>
      <div className="navbar-end">
        <ThemeDropdown />
        {user ? (
          <div className="mx-2 dropdown dropdown-end">
            <div
              tabIndex={0}
              role="button"
              className="btn btn-ghost btn-circle avatar"
            >
              <div className="w-10 rounded-full">
                <img alt="USER ICON" src={imageURL} />
              </div>
            </div>
            <ul
              tabIndex={-1}
              className="menu menu-sm dropdown-content bg-base-300 rounded-box z-1 w-36 p-2 shadow-2xl mt-3"
            >
              <li>
                <a className="justify-between">
                  <FaUser /> Profile
                  <span className="badge">New</span>
                </a>
              </li>
              <li>
                <a>
                  <FiSettings /> Settings
                </a>
              </li>
              <li>
                <button onClick={logout}>
                  <FaSignOutAlt /> Logout
                </button>
              </li>
            </ul>
          </div>
        ) : (
          <a className="btn btn-sm" href="/login">
            <FaSignInAlt />
            Login
          </a>
        )}
      </div>
    </div>
  );
}
