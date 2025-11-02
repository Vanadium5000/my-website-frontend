import { useLocation } from "preact-iso";
import { ThemeDropdown } from "./ThemeDropdown";
import { useEffect, useRef, useState } from "preact/hooks";
import { api } from "../api/client.js";
import { User } from "../api/api";
import { FaSignInAlt, FaSignOutAlt, FaUser, FaDownload } from "react-icons/fa";
import { FiSettings } from "react-icons/fi";
import { ProfilePicture } from "./ProfilePicture";
import { useInstallPrompt } from "../hooks/useInstallPrompt";

export function Navbar() {
  const { route, url } = useLocation();

  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState("");

  const infoDropdownRef = useRef<HTMLDetailsElement>(null);
  const { canInstall, install } = useInstallPrompt();

  // Load user data from backend
  useEffect(() => {
    async function fetchUserData() {
      try {
        // Fetch user's current username
        const sessionResponse = (await api.auth.apiGetSessionList()).data;

        setUser(sessionResponse?.user || null);
      } catch (error) {
        // Reset session
        setUser(null);

        const errorMessage =
          error instanceof Error ? error.message : "Fetching user data failed";
        setError(errorMessage);
        console.error("Error:", error);
      }
    }

    fetchUserData();
  }, [url]);

  // Handle click outside to close info dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // infoDropdownRef.current.open = false;
      if (
        infoDropdownRef.current &&
        !infoDropdownRef.current.contains(event.target as Node)
      ) {
        infoDropdownRef.current.open = false;
      }
    };

    document.addEventListener("click", handleClickOutside);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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
            <details ref={infoDropdownRef}>
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
                <li>
                  <a href="/changelog" className="btn btn-sm btn-block">
                    Changelog
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
          <li>
            <a href="/leaderboards">Leaderboards</a>
          </li>
        </ul>
      </div>
      <div className="navbar-end">
        <ThemeDropdown />
        {canInstall && (
          <button className="btn btn-sm mx-2" onClick={install}>
            <FaDownload />
            Install App
          </button>
        )}
        {user ? (
          <div className="mx-2 dropdown dropdown-end">
            <ProfilePicture name={user.name} image={user.image} />

            <ul
              tabIndex={-1}
              className="menu menu-sm dropdown-content bg-base-300 text-base-content rounded-box z-1 w-36 p-2 shadow-2xl mt-3"
            >
              <li>
                <a href="/profile" className="justify-between">
                  <FaUser /> Profile
                  <span className="badge">New</span>
                </a>
              </li>
              <li>
                <a href="/settings">
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
