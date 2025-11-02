import { useState } from "preact/hooks";
import { Helmet } from "react-helmet";
import logo from "../../assets/logo.png";
import { useSpawnToast } from "../../components/technical/ToastProvider";

export function About() {
  const spawnToast = useSpawnToast();
  const [amount, setAmount] = useState(0);

  const handleClick = () => {
    spawnToast({
      text: `Number: ${amount}`,
      type: "success",
      time: 3000, // time in milliseconds
    });

    setAmount(amount + 1);
  };

  return (
    <>
      <Helmet>
        <title>About - My Website</title>
        <meta
          name="description"
          content="Learn about My Website - a comprehensive platform featuring gaming, blogging, user management, and real-time features. Discover our mission, features, and technology stack."
        />
        <meta
          name="keywords"
          content="about, website, platform, gaming, blogging, user management, real-time features, Preact, TypeScript, Tailwind CSS"
        />
        <link rel="canonical" href="https://mywebsite.com/about" />
        <meta property="og:title" content="About - My Website" />
        <meta
          property="og:description"
          content="Learn about My Website - a comprehensive platform featuring gaming, blogging, user management, and real-time features."
        />
        <meta property="og:url" content="https://mywebsite.com/about" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://mywebsite.com/logo.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="About - My Website" />
        <meta
          name="twitter:description"
          content="Learn about My Website - a comprehensive platform featuring gaming, blogging, user management, and real-time features."
        />
        <meta name="twitter:image" content="https://mywebsite.com/logo.png" />
      </Helmet>
      <div className="sm:float-left sm:w-1/2 p-4">
        <h1 class="text-4xl font-bold mb-3">About</h1>
        <p>Hello!</p>
        <p>This is my website, which is yet to be completed.</p>
        <p>
          Check out{" "}
          <a href="/projects/pong" class="text-blue-500">
            my Rust pong game
          </a>
        </p>
      </div>
      <div className="sm:float-right sm:w-1/2 mx-auto">
        <img src={logo} className="p-4 w-[80%]" />
      </div>
      <button class="btn btn-active" onClick={handleClick}>
        Click me
      </button>
    </>
  );
}
