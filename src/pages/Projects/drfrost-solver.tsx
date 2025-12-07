import { h } from "preact";
import { useState, useEffect, useRef } from "preact/hooks";
import { Helmet } from "react-helmet";

export function DrFrost() {
  const [theme, setTheme] = useState(
    document.documentElement.getAttribute("data-theme") || "dark"
  );

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
        {/* This div is the key — it allows the iframe to push the page down */}
        <iframe
          ref={iframeRef}
          src={`/drfrost-solver/index.html?theme=${theme}`}
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
      </div>
    </>
  );
}
