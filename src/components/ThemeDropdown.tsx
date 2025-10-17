import { useEffect } from "preact/hooks";
import { PiPaintBrushHousehold } from "react-icons/pi";

export function ThemeDropdown() {
  const handleClick = (event) => {
    const newTheme = event.target.value;
    localStorage.setItem("theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "dark";
    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);

  return (
    <div className="dropdown">
      <div tabIndex={0} role="button" className="btn btn-sm mx-2">
        Theme
        <svg
          width="12px"
          height="12px"
          className="inline-block h-2 w-2 fill-current opacity-60"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 2048 2048"
        >
          <path d="M1799 349l242 241-1017 1017L7 590l242-241 775 775 775-775z"></path>
        </svg>
      </div>
      <ul
        tabIndex={0}
        className="dropdown-content bg-base-300 rounded-box z-1 w-36 p-2 shadow-2xl mt-4"
      >
        <li>
          <input
            type="radio"
            name="theme-dropdown"
            className="theme-controller w-full btn btn-sm btn-block justify-start"
            aria-label="System theme"
            value="default"
            onClick={handleClick}
          />
        </li>
        <li>
          <input
            type="radio"
            name="theme-dropdown"
            className="theme-controller w-full btn btn-sm btn-block justify-start"
            aria-label="Dark"
            value="dark"
            onClick={handleClick}
          />
        </li>
        <li>
          <input
            type="radio"
            name="theme-dropdown"
            className="theme-controller w-full btn btn-sm btn-block justify-start"
            aria-label="Light"
            value="light"
            onClick={handleClick}
          />
        </li>
        <li>
          <input
            type="radio"
            name="theme-dropdown"
            className="theme-controller w-full btn btn-sm btn-block justify-start"
            aria-label="Retro"
            value="retro"
            onClick={handleClick}
          />
        </li>
        <li>
          <input
            type="radio"
            name="theme-dropdown"
            className="theme-controller w-full btn btn-sm btn-block justify-start"
            aria-label="Cyberpunk"
            value="cyberpunk"
            onClick={handleClick}
          />
        </li>
        <li>
          <input
            type="radio"
            name="theme-dropdown"
            className="theme-controller w-full btn btn-sm btn-block justify-start"
            aria-label="Aqua"
            value="aqua"
            onClick={handleClick}
          />
        </li>
      </ul>
    </div>
  );
}
