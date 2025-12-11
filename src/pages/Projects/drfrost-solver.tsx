import { h } from "preact";
import { useState, useEffect, useRef } from "preact/hooks";
import { Helmet } from "react-helmet";
import { useLocation } from "preact-iso";
import { api } from "../../api/client";

export function DrFrost() {
  const { route } = useLocation();
  const [theme, setTheme] = useState(
    document.documentElement.getAttribute("data-theme") || "dark"
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [iframeSrc, setIframeSrc] = useState<string | null>(null);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setTheme(document.documentElement.getAttribute("data-theme") || "dark");
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const checkAuthAndLoad = async () => {
      setLoading(true);
      setError(null);
      try {
        // Check if user is authenticated
        const sessionResponse = await api.auth.apiGetSessionList();
        if (!sessionResponse.data) {
          route("/login");
          return;
        }

        // Construct the backend URL
        const backendUrl =
          api.baseUrl + "/folders/drfrost-solver/index.html?theme=" + theme;

        // Fetch to check accessibility
        const response = await fetch(backendUrl, { credentials: "include" });
        if (response.ok) {
          setIframeSrc(backendUrl);
        } else if (response.status === 403) {
          setError("Request the server admin to allow you to access this");
        } else {
          setError("Failed to load the page. Please try again later.");
        }
      } catch (err) {
        setError("Failed to load the page. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndLoad();
  }, [theme]);

  const iframeRef = useRef<HTMLIFrameElement>(null);

  return (
    <>
      <Helmet>
        <title>DrFrost Solver</title>
        <meta
          name="description"
          content="Dr. Frost is an interactive math learning platform designed to help students master mathematical concepts through engaging exercises and challenges."
        />
        <meta
          name="keywords"
          content="Dr. Frost, math learning, interactive math, mathematics education"
        />
        <link rel="canonical" href="/projects/drfrost-solver" />
        <meta property="og:title" content="DrFrost Solver" />
        <meta
          property="og:description"
          content="Dr. Frost is an interactive math learning platform designed to help students master mathematical concepts through engaging exercises and challenges."
        />
        <meta property="og:image" content="/logo.png" />
        <meta property="og:url" content="/projects/drfrost-solver" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="Dr. Frost - Interactive Math Learning"
        />
        <meta
          name="twitter:description"
          content="Dr. Frost is an interactive math learning platform designed to help students master mathematical concepts through engaging exercises and challenges."
        />
        <meta name="twitter:image" content="/logo.png" />
      </Helmet>
      <div className="flex-1 w-full">
        {loading && (
          <div className="flex justify-center items-center min-h-screen">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        )}
        {error && (
          <div className="flex justify-center items-center min-h-screen">
            <div className="alert alert-error">
              <span>{error}</span>
            </div>
          </div>
        )}
        {iframeSrc && (
          <>
            {/* This div is the key — it allows the iframe to push the page down */}
            <iframe
              ref={iframeRef}
              src={iframeSrc}
              className="w-full border-0 block"
              style={{
                height: "1500px", // initial height
                minHeight: "100vh",
                border: "none",
              }}
              title="Dr. Frost"
              sandbox="allow-scripts allow-same-origin allow-popups allow-modals"
              onLoad={() => {
                // Force a resize on load in case message hasn't fired yet
                setTimeout(() => {
                  if (iframeRef.current?.contentDocument?.body) {
                    const height =
                      iframeRef.current.contentDocument.documentElement
                        .scrollHeight;
                    iframeRef.current.style.height = height + "px";
                  }
                }, 500);
              }}
            />
          </>
        )}
      </div>
    </>
  );
}
