import { BsFileEarmarkText } from "react-icons/bs";
import { Helmet } from "react-helmet-async";

export function Changelog() {
  return (
    <>
      <Helmet>
        <title>Changelog - My Website</title>
        <meta
          name="description"
          content="Stay updated with the latest changes and improvements to My Website. View version history, new features, bug fixes, and technical updates."
        />
        <meta
          name="keywords"
          content="changelog, version history, updates, releases, features, bug fixes, My Website"
        />
        <link rel="canonical" href="https://mywebsite.com/changelog" />
        <meta property="og:title" content="Changelog - My Website" />
        <meta
          property="og:description"
          content="Stay updated with the latest changes and improvements to My Website. View version history, new features, bug fixes, and technical updates."
        />
        <meta property="og:url" content="https://mywebsite.com/changelog" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://mywebsite.com/logo.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Changelog - My Website" />
        <meta
          name="twitter:description"
          content="Stay updated with the latest changes and improvements to My Website. View version history, new features, bug fixes, and technical updates."
        />
        <meta name="twitter:image" content="https://mywebsite.com/logo.png" />
      </Helmet>
      <div class="container mx-auto p-6 max-w-4xl">
        <div class="flex items-center gap-3 mb-8">
          <BsFileEarmarkText class="text-4xl text-primary" />
          <h1 class="text-4xl font-bold">Changelog</h1>
        </div>

        <div class="space-y-8">
          <div class="card bg-base-100 shadow-xl">
            <div class="card-body">
              <div class="flex items-start justify-between mb-4">
                <div>
                  <h2 class="card-title text-2xl text-primary">
                    Version 0.6.9
                  </h2>
                  <p class="text-sm text-base-content/70">
                    Complete platform release •{" "}
                    {new Date().toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <div class="badge badge-success mb-2">FEATURES</div>
                  <ul class="list-disc list-inside space-y-1 text-sm">
                    <li>
                      <strong>Blog Platform:</strong> Full blogging with search,
                      comments, reactions
                    </li>
                    <li>
                      <strong>Gaming Hub:</strong> Chess and arithmetic games
                      with leaderboards
                    </li>
                    <li>
                      <strong>User System:</strong> Authentication, profiles,
                      settings, admin panel
                    </li>
                    <li>
                      <strong>Real-time Features:</strong> Live connections and
                      notifications
                    </li>
                    <li>
                      <strong>Theming:</strong> DaisyUI with 30+ themes and dark
                      mode
                    </li>
                  </ul>
                </div>

                <div>
                  <div class="badge badge-info mb-2">TECHNOLOGY</div>
                  <ul class="list-disc list-inside space-y-1 text-sm">
                    <li>
                      <strong>Frontend:</strong> Preact + TypeScript + Tailwind
                    </li>
                    <li>
                      <strong>Backend:</strong> RESTful API with security
                      middleware
                    </li>
                    <li>
                      <strong>Database:</strong> Optimized schemas with
                      relationships
                    </li>
                    <li>
                      <strong>Search:</strong> Advanced fuzzy search with
                      Fuse.js
                    </li>
                    <li>
                      <strong>UI Components:</strong> Custom components with
                      accessibility
                    </li>
                  </ul>
                </div>
              </div>

              <div class="mb-4">
                <div class="badge badge-warning mb-2">PRODUCTIVITY</div>
                <ul class="list-disc list-inside space-y-1 text-sm">
                  <li>
                    <strong>PWA Ready:</strong> Progressive web app capabilities
                  </li>
                  <li>
                    <strong>Responsive:</strong> Mobile-first design across all
                    pages
                  </li>
                  <li>
                    <strong>Performance:</strong> Optimized loading and bundle
                    splitting
                  </li>
                  <li>
                    <strong>Security:</strong> CSRF, CORS, input validation,
                    sanitization
                  </li>
                  <li>
                    <strong>Developer Experience:</strong> Hot reload, type
                    safety, error boundaries
                  </li>
                </ul>
              </div>

              <div class="mb-4">
                <div class="badge badge-accent mb-2">CHANGES</div>
                <ul class="list-disc list-inside space-y-1 text-sm">
                  <li>Added changelog page to documentation</li>
                  <li>Enhanced navigation with changelog link in Info menu</li>
                  <li>Improved project documentation and version tracking</li>
                </ul>
              </div>

              <div class="alert alert-info">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  class="stroke-current shrink-0 w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
                <span>
                  This consolidated release includes all features from versions
                  0.6.1 through 0.6.8
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="text-center mt-8 p-4 bg-base-200 rounded-lg">
          <p class="text-sm text-base-content/60">
            Want to contribute or report an issue?
            <a href="/contact" class="link link-primary ml-1">
              Get in touch
            </a>
          </p>
        </div>
      </div>
    </>
  );
}
