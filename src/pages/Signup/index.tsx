import { Helmet } from "react-helmet-async";
import { useState } from "preact/hooks";
import { api } from "../../api/client.js";
import { useLocation } from "preact-iso";
import { FaEnvelope, FaKey, FaUser } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { FcGoogle } from "react-icons/fc";

export function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { route } = useLocation();

  const updateName = (e) => {
    setName(e.target.value);
  };
  const updateEmail = (e) => {
    setEmail(e.target.value);
  };
  const updatePassword = (e) => {
    setPassword(e.target.value);
  };
  const updatePassword2 = (e) => {
    setPassword2(e.target.value);
  };

  async function register() {
    setLoading(true);

    if (password != password2) {
      setError("Passwords must match");
      setLoading(false);
      return;
    }

    try {
      const response = await api.auth.apiSignUpEmailCreate({
        name,
        email,
        password,
        rememberMe: true,
      });

      // If user exists and is returned in response
      if (response.data?.user) {
        const user = response.data.user;

        // If email is not verified, redirect to email verification page
        if (!user.emailVerified) {
          route(`/email-verification?email=${encodeURIComponent(email)}`);
          return;
        }
      }

      // If email is already verified, redirect to home page
      route("/");
    } catch (error) {
      console.log(error);
      const errorMessage = error?.error?.message || "ERROR: REGISTER FAILED";

      setError(errorMessage);
      console.log("ERROR:", error?.error?.message || error);

      setLoading(false);
    }
  }

  async function registerWithAuth(provider: "google" | "twitter") {
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
      const errorMessage = error?.error?.message || "ERROR: REGISTER FAILED";

      setError(errorMessage);
      console.log("ERROR:", error?.error?.message || error);

      setLoading(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    register();
  }

  return (
    <>
      <Helmet>
        <title>Sign Up - My Website</title>
        <meta
          name="description"
          content="Create a new account to access interactive games, leaderboards, and community features. Join the platform with secure registration."
        />
        <meta
          name="keywords"
          content="sign up, register, create account, new user, registration, join platform"
        />
        <link rel="canonical" href="/signup" />
        <meta property="og:title" content="Sign Up - My Website" />
        <meta
          property="og:description"
          content="Create a new account to access interactive games, leaderboards, and community features. Join the platform with secure registration."
        />
        <meta property="og:image" content="/logo.png" />
        <meta property="og:url" content="/signup" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Sign Up - My Website" />
        <meta
          name="twitter:description"
          content="Create a new account to access interactive games, leaderboards, and community features. Join the platform with secure registration."
        />
        <meta name="twitter:image" content="/logo.png" />
      </Helmet>
      <div className="mx-auto w-1/4 max-lg:w-1/3 max-md:w-1/2 max-sm:w-full">
        <div className="card-body">
          <h1 className="text-center text-xl font-bold">Create Your Account</h1>

          <form className="fieldset" onSubmit={handleSubmit}>
            <label className="label">Name</label>
            <label className="input w-full">
              <FaUser />
              <input
                type="text"
                required
                placeholder="Name"
                onInput={updateName}
              />
            </label>

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

            <label className="label">Confirm Password</label>
            <label className="input w-full">
              <FaKey />
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
              type="submit"
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
          </form>
          {error && <p className="text-error">{error}</p>}
          <div className="divider">Sign Up With</div>
          <button
            className="btn text-black bg-white font-bold"
            onClick={() => registerWithAuth("google")}
          >
            <FcGoogle />
            Google
          </button>
          <button
            className="btn text-white bg-black font-bold"
            onClick={() => registerWithAuth("twitter")}
          >
            <FaXTwitter />
            Twitter (X)
          </button>
          <div className="alert alert-info mt-3">
            <div>
              <h3 className="font-bold">Note</h3>
              <div className="text-sm">
                Account name & icon changes require manual verification before
                being publicly displayed.
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
