import { useState } from "preact/hooks";
import { Navbar } from "../../components/Navbar.jsx";
import { api } from "../../api/client.js";

export function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const updateUsernme = (e) => {
    setUsername(e.target.value);
  };
  const updatePassword = (e) => {
    setPassword(e.target.value);
  };

  const login = async () => {
    setLoading(true);

    try {
      const token = await (
        await api.login.loginCreate({ username, password })
      ).text();

      console.log("JWT Token:", token);
      localStorage.setItem("token", token);

      setLoading(false);

      // Redirect to another page
      window.location.href = "/";
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Login failed";

      setError(errorMessage);
      console.log("Error:", error);

      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="bg-base-100 mx-auto w-1/4 max-lg:w-1/3 max-md:w-1/2 max-sm:w-full">
        <div className="card-body">
          <h1 className="text-center text-xl font-bold">Login</h1>
          <fieldset className="fieldset">
            <label className="label">Username</label>
            <label className="input w-full">
              <UserIcon />
              <input
                type="text"
                required
                placeholder="Username"
                onInput={updateUsernme}
              />
            </label>

            <label className="label">Password</label>
            <label className="input w-full">
              <KeyIcon />
              <input
                type="password"
                required
                placeholder="Password"
                onInput={updatePassword}
              />
            </label>
            <button
              disabled={isLoading}
              className="btn btn-neutral mt-4"
              onClick={login}
            >
              Sign In
            </button>
            <div>
              <p className="text-center">
                Don't have an account?{" "}
                <a className="link-accent" href="/signup">
                  Sign up here
                </a>
              </p>
            </div>
          </fieldset>
          {error && <p className="text-error">{error}</p>}
        </div>
      </div>
    </>
  );
}
function KeyIcon() {
  return (
    <svg
      className="h-[1em] opacity-50"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
    >
      <g
        strokeLinejoin="round"
        strokeLinecap="round"
        strokeWidth="2.5"
        fill="none"
        stroke="currentColor"
      >
        <path d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z"></path>
        <circle cx="16.5" cy="7.5" r=".5" fill="currentColor"></circle>
      </g>
    </svg>
  );
}

function UserIcon() {
  return (
    <svg
      className="h-[1em] opacity-50"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
    >
      <g
        strokeLinejoin="round"
        strokeLinecap="round"
        strokeWidth="2.5"
        fill="none"
        stroke="currentColor"
      >
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
      </g>
    </svg>
  );
}
