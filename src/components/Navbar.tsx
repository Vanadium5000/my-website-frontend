import { useLocation } from "preact-iso";
import { ThemeDropdown } from "./ThemeDropdown";
import { useEffect, useState } from "preact/hooks";
import { api } from "../api/client.js";
import * as FontAwesome from "react-icons/fa";

export function Navbar() {
  const { url } = useLocation();

  const [username, setUsername] = useState("");
  const [error, setError] = useState("");

  // Load user data from backend
  useEffect(() => {
    async function fetchUserData() {
      try {
        // Fetch user's current username
        const response = await api.hello.helloList();
        const data = await response.json(); // {userid, username, is_admin}

        setUsername(data.username);
      } catch (error) {
        if (error?.status == 401) {
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
  }, [localStorage.getItem("token")]);
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
        {!error || username ? (
          <a href="/login" class="mx-4 inline">
            <FontAwesome.FaUser class="inline-block" />
            {username}
          </a>
        ) : (
          <a className="btn btn-sm" href="/login">
            Login
          </a>
        )}
      </div>
    </div>
  );
}
