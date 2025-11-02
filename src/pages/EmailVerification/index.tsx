import { Helmet } from "react-helmet";
import { useState, useEffect } from "preact/hooks";
import { api } from "../../api/client.js";
import { User, Session } from "../../api/api.js";
import {
  FaEnvelope,
  FaCheckCircle,
  FaExclamationTriangle,
  FaRedo,
} from "react-icons/fa";

export function EmailVerification() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentSession, setCurrentSession] = useState<{
    session: Session;
    user: User;
  } | null>(null);
  const [status, setStatus] = useState<
    "loading" | "success" | "idle" | "error"
  >("loading");
  const [isLoading, setIsLoading] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);

  const searchParams = new URLSearchParams(window.location.search);
  const email = searchParams.get("email");

  useEffect(() => {
    checkVerificationStatus();
  }, []);

  const checkVerificationStatus = async () => {
    try {
      const sessionData = await api.auth.apiGetSessionList();
      if (sessionData.data) {
        setCurrentSession(sessionData.data);
        setCurrentUser(sessionData.data.user);

        if (sessionData.data.user.emailVerified) {
          setStatus("success");
        } else if (email) {
          // User came from settings or signup - send verification email
          await sendVerificationEmail(email);
        } else {
          // No email in params and not verified - show error
          setStatus("error");
        }
      } else {
        // Not authenticated
        setStatus("error");
      }
    } catch (error) {
      console.error("Session check error:", error);
      setStatus("error");
    }
  };

  const sendVerificationEmail = async (emailAddress: string) => {
    setIsLoading(true);
    try {
      await api.auth.apiSendVerificationEmailCreate({
        email: emailAddress,
        callbackURL: window.location.origin + "/email-verification",
      });

      setStatus("idle");
      startResendCooldown();
    } catch (error: any) {
      console.error("Send email error:", error);
      setStatus("error");
    } finally {
      setIsLoading(false);
    }
  };

  const startResendCooldown = () => {
    setCanResend(false);
    let timeLeft = 60;
    setResendCooldown(timeLeft);

    const countdown = setInterval(() => {
      timeLeft -= 1;
      setResendCooldown(timeLeft);

      if (timeLeft <= 0) {
        clearInterval(countdown);
        setCanResend(true);
      }
    }, 1000);
  };

  const resendVerificationEmail = async () => {
    if (!currentUser || !canResend) return;
    await sendVerificationEmail(currentUser.email);
  };

  return (
    <>
      <Helmet>
        <title>Email Verification - My Website</title>
        <meta
          name="description"
          content="Verify your email address to complete account setup and access all platform features. Check your inbox for the verification link."
        />
        <meta
          name="keywords"
          content="email verification, verify email, account verification, email confirmation, account setup"
        />
        <link rel="canonical" href="/email-verification" />
        <meta property="og:title" content="Email Verification - My Website" />
        <meta
          property="og:description"
          content="Verify your email address to complete account setup and access all platform features. Check your inbox for the verification link."
        />
        <meta property="og:image" content="/logo.png" />
        <meta property="og:url" content="/email-verification" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Email Verification - My Website" />
        <meta
          name="twitter:description"
          content="Verify your email address to complete account setup and access all platform features. Check your inbox for the verification link."
        />
        <meta name="twitter:image" content="/logo.png" />
      </Helmet>
      <div className="min-h-full flex items-center justify-center bg-base-200 px-4">
        <div className="max-w-md w-full">
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body text-center">
              <div className="mb-4">
                {status === "loading" && (
                  <div className="flex justify-center mb-4">
                    <span className="loading loading-spinner loading-lg"></span>
                  </div>
                )}

                {status === "success" && (
                  <FaCheckCircle className="mx-auto text-6xl text-success mb-4" />
                )}

                {status === "error" && (
                  <FaExclamationTriangle className="mx-auto text-6xl text-error mb-4" />
                )}

                {status === "idle" && (
                  <FaEnvelope className="mx-auto text-6xl text-primary mb-4" />
                )}
              </div>

              <h1 className="card-title text-2xl justify-center mb-4">
                {status === "loading" && "Checking Status..."}
                {status === "success" && "Email Verified!"}
                {status === "error" && "Verification Failed"}
                {status === "idle" && "Check Your Email"}
              </h1>

              <p className="text-base-content/70 mb-6">
                {status === "loading" &&
                  "Checking your email verification status..."}
                {status === "success" &&
                  "Your email has been successfully verified! You can now access all features of the application."}
                {status === "error" &&
                  "There was an issue with email verification. Please try again or contact support."}
                {status === "idle" &&
                  `Please check your email (${currentUser?.email}) for a verification link.`}
              </p>

              {status === "success" && (
                <div className="space-y-4">
                  <a href="/profile" className="btn btn-primary w-full">
                    Go to Profile
                  </a>
                </div>
              )}

              {(status === "error" || status === "idle") && email && (
                <div className="space-y-4">
                  <button
                    onClick={resendVerificationEmail}
                    disabled={!canResend || isLoading}
                    className="btn btn-outline btn-primary w-full"
                  >
                    {isLoading ? (
                      <span className="loading loading-spinner loading-sm"></span>
                    ) : (
                      <>
                        <FaRedo className="mr-2" />
                        Resend Verification Email
                      </>
                    )}
                  </button>

                  {!canResend && resendCooldown > 0 && (
                    <p className="text-sm text-base-content/60">
                      Resend available in {resendCooldown} seconds
                    </p>
                  )}

                  <div className="divider">Already verified?</div>

                  <a href="/profile" className="btn btn-neutral w-full">
                    Go to Profile
                  </a>
                </div>
              )}

              <div className="mt-8 text-xs text-base-content/50">
                <p>
                  Didn't receive the email? Check your spam folder or contact
                  support if you're still having issues.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
