// pages/Blog/post.js
import { useState, useEffect } from "preact/hooks";
import { Navbar } from "../../components/Navbar.jsx";
import { api } from "../../api/client.js";
import { BlogPostType, PostCard, CommentType } from "./index.js";

export function BlogPost({ id }) {
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState<CommentType[]>([]);
  const [blogPost, setBlogPost] = useState<BlogPostType | null>(null);
  const [error, setError] = useState("");

  const updateComment = (e) => {
    setComment(e.target.value);
  };

  function postComment() {
    (async () => {
      try {
        const response = await api.postComment.postCommentCreate({
          post_id: parseInt(id),
          content: comment,
        });
        const data = await response.text();
        console.log(data);
        alert(data);
      } catch (error) {
        if (error?.status == 401) {
          console.log("401 error: redirecting to /login");
          window.location.href = "/login";
          return;
        }

        const errorMessage =
          error instanceof Error
            ? error.message
            : "Posting blog comment failed";
        setError(errorMessage);
        console.error("Error:", error);
      }
    })();
  }

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

  useEffect(() => {
    (async () => {
      try {
        const response = await api.postComments.postCommentsCreate({
          post_id: parseInt(id),
        });
        const data = await response.json();
        setComments(data);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Fetching comments failed";
        setError(errorMessage);
        console.error("Error:", error);
      }
    })();
  }, []);

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
          <PostCard post={blogPost} comments={comments} />
        </div>
      </div>
      <div
        class="prose max-w-full mx-8"
        dangerouslySetInnerHTML={{ __html: blogPost?.content }}
      />
      <div class="mx-8 mb-8">
        <div className="divider" />
        <h1 class="text-3xl font-bold">Comments</h1>
        <p>
          Comments do not allow any HTML, but they allow Markdown for styling.
          Once submitted, they need to be reviewed by the site administrator to
          be displayed for obvious reasons.
        </p>
        <textarea
          id="comment"
          class="min-w-11/12 resize min-h-[10rem] p-4 my-4 rounded-lg outline-1"
          placeholder="Write a Markdown comment..."
          required={true}
          onInput={updateComment}
        />
        <div>
          <button
            class="btn rounded-xl bg-blue-600 text-white"
            onClick={postComment}
          >
            Post comment
          </button>
        </div>

        {comments.map((comment, index) => (
          <CommentCard
            content={comment.content}
            created_at={comment.created_at}
            user_id={comment.user_id}
          />
        ))}
      </div>
    </>
  );
}

export function CommentCard(Props: CommentType) {
  return (
    <div class="card">
      <div class="card-body pb-8 text-[1.0625rem]">
        <div class="inline">
          <span class="font-bold">ID: {Props.user_id}</span>

          <time class="ml-4">
            {new Date(Props.created_at).toLocaleDateString("en-uk", {
              hour: "numeric",
              minute: "numeric",
              year: "numeric",
              month: "numeric",
              day: "numeric",
            })}
          </time>
        </div>
        <div
          class="prose max-w-full"
          dangerouslySetInnerHTML={{ __html: Props.content }}
        />
      </div>
    </div>
  );
}
