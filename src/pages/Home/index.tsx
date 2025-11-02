import { Helmet } from "react-helmet-async";
import "./style.css";

export function Home() {
  return (
    <>
      <Helmet>
        <title>Home - My Website</title>
        <meta
          name="description"
          content="Welcome to My Website, a platform featuring interactive games, projects, and community features."
        />
        <meta
          name="keywords"
          content="games, projects, interactive, community, web development"
        />
        <link rel="canonical" href="/" />
        <meta property="og:title" content="Home - My Website" />
        <meta
          property="og:description"
          content="Welcome to My Website, a platform featuring interactive games, projects, and community features."
        />
        <meta property="og:image" content="/logo.png" />
        <meta property="og:url" content="/" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Home - My Website" />
        <meta
          name="twitter:description"
          content="Welcome to My Website, a platform featuring interactive games, projects, and community features."
        />
        <meta name="twitter:image" content="/logo.png" />
      </Helmet>
      <div className="h-[100%] grid place-items-center" id="homescreen">
        <div className="min-w-1/4 text-center p-8 bg-black/80 text-white">
          <h1 className="text-8xl font-semibold mb-2">
            My
            <br />
            Website
            <span className="blink">_</span>
          </h1>
          <p>Hi</p>
        </div>
      </div>
    </>
  );
}
