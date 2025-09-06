import { useState } from "preact/hooks";
import { route } from "preact-router";
import { Navbar } from "../../components/Navbar.jsx";
import { api } from "../../api/client.js";

export function Signup() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const updateUsernme = (e) => {
    setUsername(e.target.value);
  };
  const updatePassword = (e) => {
    setPassword(e.target.value);
  };
  const updatePassword2 = (e) => {
    setPassword2(e.target.value);
  };

  const register = async () => {
    setLoading(true);

    try {
      if (password != password2) {
        setError("Passwords must match");
        setLoading(false);
        return;
      }

      if (
        !(
          document.getElementById("username") as HTMLInputElement
        ).checkValidity()
      ) {
        setError("Username is not valid");
        setLoading(false);
        return;
      }

      const userId = await (
        await api.register.registerCreate({ username, password })
      ).text();

      console.log("User ID:", userId);

      setLoading(false);

      // Redirect to login page
      window.location.href = "/login";
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Signup failed";

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
          <h1 className="text-center text-xl font-bold">Create Your Account</h1>
          <fieldset className="fieldset">
            <label className="label">Username</label>
            <label className="input validator w-full">
              <UserIcon />
              <input
                id="username"
                type="text"
                required
                placeholder="Username"
                pattern="[A-Za-z][A-Za-z0-9\-]*"
                minlength={3}
                maxlength={30}
                title="Only letters, numbers or dash"
                onInput={updateUsernme}
              />
            </label>
            <p className="validator-hint hidden">
              Must be 3 to 30 characters containing only letters, numbers or
              dash
            </p>

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

            <label className="label">Confirm Password</label>
            <label className="input w-full">
              <KeyIcon />
              <input
                type="password"
                required
                placeholder="Confirm Password"
                onInput={updatePassword2}
              />
            </label>
            <button
              disabled={isLoading}
              className="btn btn-neutral mt-4"
              onClick={register}
            >
              Sign Up
            </button>
            <div>
              <p className="text-center">
                Already have an account?{" "}
                <a className="link-accent" href="/login">
                  Sign in here
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
