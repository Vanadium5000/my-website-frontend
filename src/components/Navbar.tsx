import { useLocation } from "preact-iso";
import { ThemeDropdown } from "./ThemeDropdown";

export function Navbar() {
  const { url } = useLocation();
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
        <a className="btn btn-sm" href="/login">
          Login
        </a>
      </div>
    </div>
  );
}
