import { Helmet } from "react-helmet";
import { BsEnvelope, BsGithub, BsTwitter, BsDiscord } from "react-icons/bs";

export function Contact() {
  return (
    <>
      <Helmet>
        <title>Contact - My Website</title>
        <meta
          name="description"
          content="Get in touch with us for support, feedback, or collaboration. Find contact information, social media links, and ways to reach out to the My Website team."
        />
        <meta
          name="keywords"
          content="contact, support, feedback, collaboration, email, social media, GitHub, Twitter, Discord"
        />
        <link rel="canonical" href="https://mywebsite.com/contact" />
        <meta property="og:title" content="Contact - My Website" />
        <meta
          property="og:description"
          content="Get in touch with us for support, feedback, or collaboration. Find contact information, social media links, and ways to reach out to the My Website team."
        />
        <meta property="og:url" content="https://mywebsite.com/contact" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://mywebsite.com/logo.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Contact - My Website" />
        <meta
          name="twitter:description"
          content="Get in touch with us for support, feedback, or collaboration. Find contact information, social media links, and ways to reach out to the My Website team."
        />
        <meta name="twitter:image" content="https://mywebsite.com/logo.png" />
      </Helmet>
      <div class="container mx-auto p-6 max-w-4xl">
        <div class="text-center mb-8">
          <h1 class="text-4xl font-bold mb-4">Contact Us</h1>
          <p class="text-lg text-base-content/70">
            Have questions, feedback, or want to collaborate? We'd love to hear
            from you!
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div class="card bg-base-100 shadow-xl">
            <div class="card-body">
              <h2 class="card-title text-2xl mb-4">Get in Touch</h2>
              <div class="space-y-4">
                <div class="flex items-center gap-3">
                  <BsEnvelope class="text-2xl text-primary" />
                  <div>
                    <p class="font-semibold">Email</p>
                    <p class="text-sm text-base-content/70">
                      support@mywebsite.com
                    </p>
                  </div>
                </div>
                <div class="flex items-center gap-3">
                  <BsGithub class="text-2xl text-primary" />
                  <div>
                    <p class="font-semibold">GitHub</p>
                    <p class="text-sm text-base-content/70">
                      github.com/mywebsite
                    </p>
                  </div>
                </div>
                <div class="flex items-center gap-3">
                  <BsTwitter class="text-2xl text-primary" />
                  <div>
                    <p class="font-semibold">Twitter</p>
                    <p class="text-sm text-base-content/70">@mywebsite</p>
                  </div>
                </div>
                <div class="flex items-center gap-3">
                  <BsDiscord class="text-2xl text-primary" />
                  <div>
                    <p class="font-semibold">Discord</p>
                    <p class="text-sm text-base-content/70">
                      discord.gg/mywebsite
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="card bg-base-100 shadow-xl">
            <div class="card-body">
              <h2 class="card-title text-2xl mb-4">Support & Feedback</h2>
              <div class="space-y-4">
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
                  <div>
                    <h3 class="font-bold">Bug Reports</h3>
                    <div class="text-xs">
                      Found a bug? Let us know on GitHub Issues
                    </div>
                  </div>
                </div>
                <div class="alert alert-success">
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
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    ></path>
                  </svg>
                  <div>
                    <h3 class="font-bold">Feature Requests</h3>
                    <div class="text-xs">
                      Have an idea? Share it with our community
                    </div>
                  </div>
                </div>
                <div class="alert alert-warning">
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
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                    ></path>
                  </svg>
                  <div>
                    <h3 class="font-bold">General Support</h3>
                    <div class="text-xs">
                      Questions about using the platform
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="text-center mt-8 p-4 bg-base-200 rounded-lg">
          <p class="text-sm text-base-content/60">
            We typically respond within 24-48 hours. For urgent issues, please
            use our Discord server.
          </p>
        </div>
      </div>
    </>
  );
}
