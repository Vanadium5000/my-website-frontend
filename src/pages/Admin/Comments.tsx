import { useEffect, useState } from "preact/hooks";
import { CommentCard } from "../../components/CommentCard";
import { api } from "../../api/client";
import { FaCommentDots } from "react-icons/fa";
import { Comment } from "../../api/api";

export function AdminComments() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchComments();
  }, []);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await api.blog.getBlogAdminCommentsPending();
      setComments(response.data);
      setError("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch pending comments"
      );
      console.error("Error fetching comments:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptComment = async (commentId: string) => {
    try {
      await api.blog.patchBlogAdminCommentsByCommentIdModerate(commentId, {
        action: "accept",
      });
      // Remove the accepted comment from the list
      setComments((prev) =>
        prev.filter((comment) => comment._id !== commentId)
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to accept comment");
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await api.blog.patchBlogAdminCommentsByCommentIdModerate(commentId, {
        action: "delete",
      });
      // Remove the deleted comment from the list
      setComments((prev) =>
        prev.filter((comment) => comment._id !== commentId)
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete comment");
    }
  };

  return (
    <>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <a href="/admin" class="btn btn-ghost btn-sm">
            ← Back to Admin
          </a>
          <FaCommentDots />
          Pending Comments
        </h1>

        {error && (
          <div role="alert" className="alert alert-error mb-4">
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
        )}

        {loading ? (
          <div className="flex justify-center">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8">
            <h2 className="text-lg font-medium text-base-content/70">
              No pending comments
            </h2>
          </div>
        ) : (
          <div className="space-y-6">
            {comments.map((comment, index) => (
              <CommentCard
                key={comment._id || index}
                content={comment.content}
                createdAt={comment.createdAt}
                authorId={comment.authorId}
                showAcceptButton={true}
                onAccept={handleAcceptComment}
                showDeleteButton={true}
                onDelete={handleDeleteComment}
                commentId={comment._id}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
