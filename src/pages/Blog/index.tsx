import { useEffect, useState } from "preact/hooks";
import { Navbar } from "../../components/Navbar.jsx";
import { api } from "../../api/client.js";
import { Reactions } from "../../components/Reactions.js";

export interface BlogPostType {
  post_id: number;
  title: string;
  content: string;
  snippet: string;
  created_at: string;
  likes: number;
  dislikes: number;
}

export interface CommentType {
  content: string;
  created_at: string;
  user_id: number;
}

export function BlogHome() {
  const [blogPosts, setBlogPosts] = useState<BlogPostType[]>([]);
  const [comments, setComments] = useState<Record<number, CommentType[]>>({});
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 5;

  useEffect(() => {
    (async () => {
      try {
        const response = await api.posts.postsList();
        const data = await response.json();
        setBlogPosts(data);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Fetching blogs failed";
        setError(errorMessage);
        console.error("Error:", error);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        // Create an array of promises to fetch comments for each post_id
        const commentPromises = blogPosts.map(async (post) => {
          const response = await api.postComments.postCommentsCreate({
            post_id: post.post_id,
          });
          const commentsData = await response.json();
          return { post_id: post.post_id, comments: commentsData };
        });

        // Wait for all comment fetches to complete
        const commentsArray = await Promise.all(commentPromises);

        // Transform the results into a Record<post_id, CommentType[]>
        const commentsRecord = commentsArray.reduce<
          Record<number, CommentType[]>
        >((acc, { post_id, comments }) => {
          acc[post_id] = comments;
          return acc;
        }, {});

        // Update the comments state
        setComments(commentsRecord);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Fetching comments failed";
        setError(errorMessage);
        console.error("Error:", error);
      }
    })();
  }, [blogPosts]);

  // Calculate total pages
  const totalPages = Math.ceil(blogPosts.length / postsPerPage);

  // Get posts for current page
  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = blogPosts.slice(indexOfFirstPost, indexOfLastPost);

  // Change page
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

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

  return (
    <>
      <Navbar />
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Blog Posts</h1>
        <div className="space-y-6">
          {currentPosts.map((post, index) => (
            <PostCard
              key={index}
              post={post}
              comments={comments[post.post_id]}
            />
          ))}
        </div>
        {/* Pagination Navigator */}
        {totalPages > 1 && (
          <div className="join mt-6 flex justify-center">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                className={`join-item btn ${currentPage === page ? "btn-active" : ""}`}
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

export function PostCard(props) {
  const { post } = props;
  const { comments } = props;
  return (
    <div class="card shadow transition-transform ease-in-out delay-0 hover:-translate-y-1 hover:scale-[1.02] duration-300">
      <a class="card-body" href={`/blog/${post.post_id}`}>
        <h1 class="text-4xl font-bold">{post.title}</h1>
        <time>
          {new Date(post.created_at).toLocaleDateString("en-uk", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </time>
        <div
          class="prose max-w-full mt-4"
          dangerouslySetInnerHTML={{ __html: post.snippet }}
        />
      </a>
      <div class="card-body pt-0">
        <Reactions
          post_id={post.post_id}
          likes={post.likes}
          dislikes={post.dislikes}
          comments={comments}
        />
      </div>
    </div>
  );
}
