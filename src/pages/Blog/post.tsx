// pages/Blog/post.js
import { useState, useEffect } from "preact/hooks";
import { Navbar } from "../../components/Navbar.jsx";
import { api } from "../../api/client.js";
import { BlogPostType, PostCard } from "./index.js";

export function BlogPost({ id }) {
  const [blogPost, setBlogPost] = useState<BlogPostType | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const response = await api.post.postCreate({ post_id: parseInt(id) });
        const data = await response.json();
        setBlogPost(data);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Fetching blog failed";
        setError(errorMessage);
        console.error("Error:", error);
      }
    })();
  }, [id]);

  if (error) {
    return (
      <>
        <Navbar />
        <div role="alert" className="alert alert-error">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 shrink-0 stroke-current"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{error}</span>
        </div>
      </>
    );
  }

  if (!blogPost) {
    return (
      <>
        <Navbar />
        <p>Loading...</p>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div class="card card-body max-w-full">
        <div class="text-center justify-center">
          <PostCard post={blogPost} />
        </div>
      </div>
      <div
        class="prose max-w-full mx-8"
        dangerouslySetInnerHTML={{ __html: blogPost?.content }}
      />
    </>
  );
}
