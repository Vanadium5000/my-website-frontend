import { Helmet } from "react-helmet-async";
import { useState } from "preact/hooks";
import { api } from "../../api/client.js";
import { useLocation } from "preact-iso";
import { FaEnvelope, FaKey } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { FcGoogle } from "react-icons/fc";

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { route } = useLocation();

  const updateEmail = (e) => {
    setEmail(e.target.value);
  };
  const updatePassword = (e) => {
    setPassword(e.target.value);
  };
  const updateRememberMe = (e) => {
    setRememberMe(e.target.checked);
  };

  async function login() {
    setLoading(true);

    try {
      await api.auth.apiSignInEmailCreate({
        email,
        password,
        // HACK: rememberMe only works as a boolean, but the OpenAPI spec wants it as a string
        rememberMe: rememberMe as any,
      });

      // Redirect to home page, as login didn't fail
      route("/");
    } catch (error) {
      const errorMessage = error?.error?.message || "ERROR: LOGIN FAILED";

      setError(errorMessage);
      console.log("ERROR:", error?.error?.message || error);

      setLoading(false);
    }
  }

  async function loginWithAuth(provider: "google" | "twitter") {
    setLoading(true);

    try {
      // HACK: It is meant to return a url field, which is not in the type
      const authData: any = (
        await api.auth.socialSignIn({
          provider,
          // Gets the / url (home page) of the current location
          callbackURL: new URL("/", window.location.origin).href,
        })
      ).data;

      window.location.href = authData.url;
      return;
    } catch (error) {
      const errorMessage = error?.error?.message || "ERROR: LOGIN FAILED";

      setError(errorMessage);
      console.log("ERROR:", error?.error?.message || error);

      setLoading(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    login();
  }

  return (
    <>
      <Helmet>
        <title>Login - My Website</title>
        <meta
          name="description"
          content="Secure user authentication page. Sign in to your account to access games, leaderboards, and personalized features."
        />
        <meta
          name="keywords"
          content="login, sign in, authentication, user login, secure login, account access"
        />
        <link rel="canonical" href="/login" />
        <meta property="og:title" content="Login - My Website" />
        <meta
          property="og:description"
          content="Secure user authentication page. Sign in to your account to access games, leaderboards, and personalized features."
        />
        <meta property="og:image" content="/logo.png" />
        <meta property="og:url" content="/login" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Login - My Website" />
        <meta
          name="twitter:description"
          content="Secure user authentication page. Sign in to your account to access games, leaderboards, and personalized features."
        />
        <meta name="twitter:image" content="/logo.png" />
      </Helmet>
      <div className="mx-auto w-1/4 max-lg:w-1/3 max-md:w-1/2 max-sm:w-full">
        <div className="card-body">
          <h1 className="text-center text-xl font-bold">Login</h1>

          <form className="fieldset" onSubmit={handleSubmit}>
            <label className="label">Email</label>
            <label className="input w-full">
              <FaEnvelope />
              <input
                type="text"
                required
                placeholder="Email"
                onInput={updateEmail}
              />
            </label>

            <label className="label">Password</label>
            <label className="input w-full">
              <FaKey />
              <input
                type="password"
                required
                placeholder="Password"
                onInput={updatePassword}
              />
            </label>
            <label className="label">
              <input
                type="checkbox"
                onChange={updateRememberMe}
                checked={rememberMe}
              />
              Remember me
            </label>
            <button
              disabled={isLoading}
              className="btn btn-neutral mt-4"
              type="submit"
            >
              Login
            </button>

            <div>
              <p className="text-center">
                Don't have an account?{" "}
                <a className="link-accent" href="/signup">
                  Sign up here
                </a>
              </p>
            </div>
          </form>
          {error && <p className="text-error">{error}</p>}
          <div className="divider">Sign In With</div>
          <button
            className="btn text-black bg-white font-bold"
            onClick={() => loginWithAuth("google")}
          >
            <FcGoogle />
            Google
          </button>
          <button
            className="btn text-white bg-black font-bold"
            onClick={() => loginWithAuth("twitter")}
          >
            <FaXTwitter />
            Twitter (X)
          </button>
        </div>
      </div>
    </>
  );
}
