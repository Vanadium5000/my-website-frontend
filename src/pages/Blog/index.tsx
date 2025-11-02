import { useEffect, useState } from "preact/hooks";
import {
  highlightText,
  getHighlightedPreview,
  highlightSearchTerms,
} from "../../utils/highlight.js";
import { api } from "../../api/client.js";
import { Reactions } from "../../components/Reactions.js";
import DOMPurify from "dompurify"; // HTML SANITIZATION
import Fuse from "fuse.js";
import { IoSearch, IoDocumentText } from "react-icons/io5";
import { BlogIndexSchema } from "../../api/api.js";
import { Helmet } from "react-helmet";

export type BlogPostType = BlogIndexSchema;
export interface CommentType {
  content: string;
  createdAt: string;
  authorID: string;
}

export function BlogHome() {
  const [allPosts, setAllPosts] = useState<BlogPostType[]>([]);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 5;
  const [search, setSearch] = useState("");
  const [fuse, setFuse] = useState<Fuse<BlogPostType> | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const blogResponse = (await api.blog.getBlog()).data;
        setAllPosts(blogResponse);
        const fuseInstance = new Fuse(blogResponse, {
          keys: ["title", "snippet", "markdownContent"],
          includeMatches: true,
          threshold: 0.4,
          isCaseSensitive: false,
        });
        setFuse(fuseInstance);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Fetching blogs failed";
        setError(errorMessage);
        console.error("Error:", error);
      }
    })();
  }, []);

  // Filtered posts based on search
  const filteredPosts = search
    ? fuse
        ?.search(search)
        .map((result) => ({ post: result.item, matches: result.matches })) || []
    : allPosts.map((post) => ({ post, matches: [] }));

  // Reset to page 1 if filtered results change
  useEffect(() => {
    if (filteredPosts.length > 0) {
      const totalPagesFiltered = Math.ceil(filteredPosts.length / postsPerPage);
      if (currentPage > totalPagesFiltered) {
        setCurrentPage(1);
      }
    }
  }, [filteredPosts.length, postsPerPage, currentPage]);

  // Calculate total pages for filtered
  const totalPages = Math.ceil(filteredPosts.length / postsPerPage);

  // Get posts for current page
  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = filteredPosts.slice(indexOfFirstPost, indexOfLastPost);

  // Change page
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  if (error) {
    return (
      <>
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

  return (
    <>
      <Helmet>
        <title>Blog - My Website</title>
        <meta
          name="description"
          content="Explore articles and insights on web development, programming, and gaming. Stay updated with the latest tutorials, tips, and trends in technology."
        />
        <meta
          name="keywords"
          content="blog, web development, programming, gaming, tutorials, technology, insights, articles"
        />
        <link rel="canonical" href={`${window.location.origin}/blog`} />
      </Helmet>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Blog Posts</h1>
        <div className="mb-4">
          <label className="input items-center">
            <IoSearch className="opacity-50" />
            <input
              type="text"
              className="grow"
              placeholder="Search blog posts..."
              value={search}
              onInput={(e) => setSearch(e.currentTarget.value)}
            />
          </label>
        </div>
        <div className="space-y-6">
          {currentPosts.map((postData, index) => (
            <PostCard key={index} postData={postData} search={search} />
          ))}
        </div>
        {/* Pagination Navigator */}
        {totalPages > 1 && (
          <div className="join mt-6 flex justify-center">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                className={`join-item btn ${
                  currentPage === page ? "btn-active" : ""
                }`}
                onClick={() => paginate(page)}
              >
                {page}
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export function PostCard(props: {
  post?: {
    id: string;
    title: string;
    snippet: string;
    likes: number;
    dislikes: number;
    createdAt: string;
    commentCount: number;
    markdownContent?: string;
  };
  postData?: any; // Accepts either post object or { post, matches }
  search?: string;
}) {
  const { postData, search, post: legacyPost } = props;

  // Determine the post and matches
  let post;
  let matches: any[] = [];

  if (postData) {
    if (postData.post && postData.matches) {
      // New format: { post, matches }
      post = postData.post;
      matches = postData.matches || [];
    } else {
      // Old format: just the post object
      post = postData;
    }
  } else {
    // Legacy prop
    post = legacyPost;
  }

  if (!post) return null;

  // Backwards compatibility: if post has 'content', map to markdownContent
  if (!post.markdownContent && post.content) {
    post = { ...post, markdownContent: post.content };
  }

  // Configure allowed tags/attributes for comments (customize as needed)
  const sanitizerConfig = {
    ALLOWED_TAGS: [
      "p",
      "br",
      "strong",
      "em",
      "u",
      "a",
      "ul",
      "ol",
      "li",
      "blockquote",
      "code",
      "mark", // For highlighting
    ],
    ALLOWED_ATTR: ["href", "target", "rel", "class"], // e.g., safe links and classes
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel):|[^&\s]+)$/i, // Restrict link protocols
  };

  // Highlighted strings using search terms
  const highlightedTitle = search
    ? highlightSearchTerms(post.title, search)
    : post.title;
  const highlightedSnippet = search
    ? highlightSearchTerms(post.snippet, search)
    : post.snippet;
  const sanitizedSnippet = DOMPurify.sanitize(
    highlightedSnippet,
    sanitizerConfig
  );

  // Preview for markdown if search is active
  const markdownPreview =
    post.markdownContent &&
    search &&
    post.markdownContent.toLowerCase().includes(search.toLowerCase())
      ? (() => {
          const truncated =
            post.markdownContent.length > 200
              ? post.markdownContent.substring(0, 200) + "..."
              : post.markdownContent;
          return highlightSearchTerms(truncated, search);
        })()
      : null;

  return (
    <div class="card shadow transition-transform ease-in-out delay-0 hover:-translate-y-1 hover:scale-[1.02] duration-300">
      <a class="card-body" href={`/blog/${post.id}`}>
        <h1
          class="text-4xl font-bold"
          dangerouslySetInnerHTML={{ __html: highlightedTitle }}
        />
        <time>
          {new Date(post.createdAt).toLocaleDateString("en-uk", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </time>
        <div
          class="prose max-w-full mt-4"
          dangerouslySetInnerHTML={{ __html: sanitizedSnippet }}
        />
        {markdownPreview && (
          <div class="mt-4 p-2 bg-neutral text-neutral-content rounded">
            <div class="flex items-center gap-2 mb-1">
              <IoDocumentText class="text-lg" />
              <span class="text-sm font-semibold">Content preview:</span>
            </div>
            <div
              class="text-sm"
              dangerouslySetInnerHTML={{ __html: markdownPreview }}
            />
          </div>
        )}
      </a>
      <div class="card-body pt-0">
        <Reactions
          id={post.id}
          likes={post.likes}
          dislikes={post.dislikes}
          comments={post.commentCount}
        />
      </div>
    </div>
  );
}
