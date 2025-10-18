import { useState, useEffect } from "preact/hooks";
import { api } from "../api/client";
import DOMPurify from "dompurify";
import { FaCheck, FaTrash } from "react-icons/fa";
import { ProfilePicture } from "./ProfilePicture";

export interface Profile {
  id: string;
  name: string;
  image?: string;
  createdAt: string | number;
  updatedAt: string | number;
}

interface CommentCardProps {
  content: string;
  createdAt: string | number | Date;
  authorId: string;
  showAcceptButton?: boolean;
  onAccept?: (commentId: string) => void;
  showDeleteButton?: boolean;
  onDelete?: (commentId: string) => void;
  commentId?: string;
}

export function CommentCard({
  content,
  createdAt,
  authorId,
  showAcceptButton = false,
  onAccept,
  showDeleteButton = false,
  onDelete,
  commentId,
}: CommentCardProps) {
  const [author, setAuthor] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAuthor();
  }, [authorId]);

  const fetchAuthor = async () => {
    try {
      setLoading(true);
      const response = (await api.profile.getProfileByUserId(authorId)).data;
      setAuthor(response);
    } catch (error) {
      // If we can't fetch user data (likely due to permissions), we'll just show the ID
      console.log("Could not fetch user data:", error);
    } finally {
      setLoading(false);
    }
  };

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
    ],
    ALLOWED_ATTR: ["href", "target", "rel"], // e.g., safe links
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel):|[^&\s]+)$/i, // Restrict link protocols
  };

  const sanitizedContent = DOMPurify.sanitize(content, sanitizerConfig);

  const formatDate = (date: string | number | Date) => {
    return new Date(date).toLocaleDateString("en-uk", {
      hour: "numeric",
      minute: "numeric",
      year: "numeric",
      month: "numeric",
      day: "numeric",
    });
  };

  return (
    <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow mb-6">
      <div className="card-body">
        <div className="flex justify-between items-start">
          <a
            className="flex items-center gap-3 flex-1"
            href={`/profile/${authorId}`}
          >
            {loading ? (
              <div className="w-8 h-8 rounded-full bg-gray-300 animate-pulse"></div>
            ) : (
              <ProfilePicture
                id={authorId}
                name={author?.name}
                image={author?.image}
              />
            )}

            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-bold">
                  {author ? author.name : `Deleted User ${authorId}`}
                </span>
                <time className="text-sm opacity-70">
                  {formatDate(createdAt)}
                </time>
              </div>
            </div>
          </a>

          <div className="flex gap-2">
            {(showAcceptButton || showDeleteButton) && commentId && (
              <>
                {showAcceptButton && onAccept && (
                  <button
                    className="btn btn-sm btn-success"
                    onClick={() => onAccept(commentId)}
                    title="Accept comment"
                  >
                    <FaCheck className="w-4 h-4 mr-1" />
                    Accept
                  </button>
                )}
                {showDeleteButton && onDelete && (
                  <button
                    className="btn btn-sm btn-error"
                    onClick={() => onDelete(commentId)}
                    title="Delete comment"
                  >
                    <FaTrash className="w-4 h-4 mr-1" />
                    Delete
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        <div
          className="prose max-w-full mt-4"
          dangerouslySetInnerHTML={{ __html: sanitizedContent }}
        />
      </div>
    </div>
  );
}
