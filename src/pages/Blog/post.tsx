// pages/Blog/post.js
import { useState, useEffect } from "preact/hooks";
import { CommentCard } from "../../components/CommentCard";
import { api } from "../../api/client.js";
import { PostCard, CommentType } from "./index.js";

// Code highlighting
import "prismjs/themes/prism-dark.min.css";
import DOMPurify from "dompurify"; // HTML SANITIZATION

interface FullBlogPostType {
  blog: {
    id: string;
    title: string;
    snippet: string;
    content: string;
    likes: number;
    dislikes: number;
    commentCount: number;
    createdAt: any;
    updatedAt: any;
  };
  comments: {
    _id?: string;
    blogId: string;
    authorId: string;
    content: string;
    accepted: boolean;
    createdAt: any;
  }[];
}

export function BlogPost({ id }: { id: string }) {
  const [comment, setComment] = useState("");
  const [blogPost, setBlogPost] = useState<FullBlogPostType | null>(null);
  const [error, setError] = useState("");

  const updateComment = (e) => {
    setComment(e.target.value);
  };

  function postComment() {
    (async () => {
      try {
        if (!comment) {
          alert("Comment cannot be empty");
          return;
        }

        const response = (
          await api.blog.postBlogByIdComment(id, {
            content: comment,
          })
        ).data;
        console.log("Comment post data:", response);
        alert(
          response.success
            ? "Successfully posted a comment"
            : "Failed to post a comment"
        );
      } catch (error) {
        if (error?.status == 401) {
          console.log("401 error: redirecting to /login");
          window.location.href = "/login";
          return;
        }

        if (error?.status == 429) {
          console.log("421 error: sending alert");
          alert("You are posting too many comments, try posting again later.");
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
        const blogsResponse = (await api.blog.getBlogById(id)).data;
        setBlogPost(blogsResponse);
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
        <p>Loading...</p>
      </>
    );
  }

  return (
    <>
      <div class="card card-body max-w-full">
        <div class="text-center justify-center">
          <PostCard postData={blogPost.blog} />
        </div>
      </div>
      <div
        class="prose max-w-full mx-8"
        dangerouslySetInnerHTML={{ __html: blogPost.blog.content }}
      />
      <div class="mx-8 mb-8">
        <div className="divider" />
        <h1 class="text-3xl font-bold">Comments</h1>
        <p>
          Comments do not allow any HTML, but they allow Markdown for styling.
          Once submitted, they need to be reviewed by the site administrator to
          be displayed for{" "}
          <i>
            <b>obvious reasons</b>
          </i>
          .
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

        {blogPost.comments
          // .filter((value) => value.accepted)
          .map((comment, index) => (
            <CommentCard
              content={comment.content}
              createdAt={comment.createdAt}
              authorId={comment.authorId}
            />
          ))}
      </div>
    </>
  );
}
