import { useEffect, useState } from "preact/hooks";
import { api } from "../api/client.js";
import { CommentType } from "../pages/Blog/index.js";
import * as FontAwesome from "react-icons/fa";

interface Props {
  post_id: Number;
  likes: Number;
  dislikes: Number;
  comments: CommentType[];
}

export function Reactions(Props: Props) {
  const [likes, setLikes] = useState(Props.likes.valueOf()); // "Number" into primitive "number"
  const [dislikes, setDislikes] = useState(Props.dislikes.valueOf());
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [error, setError] = useState("");

  // Load liked/disliked status from backend
  useEffect(() => {
    async function fetchReactionStatus() {
      try {
        // Fetch user's like & dislike status for the post
        const response = await api.postReaction.postReactionCreate({
          post_id: Props.post_id.valueOf(),
        });
        const data = await response.json(); // [liked, disliked]

        setLiked(false || data[0]);
        setDisliked(false || data[1]);
      } catch (error) {
        if (error?.status == 401) {
          console.log("Not logged in: won't fetch previous reactions");
          return;
        }

        const errorMessage =
          error instanceof Error
            ? error.message
            : "Fetching previous reactions failed";
        setError(errorMessage);
        console.error("Error:", error);
      }
    }

    fetchReactionStatus();
  }, [Props.post_id]);

  // Simulate react client-side & make appropriate backend request
  async function react(is_like: boolean) {
    try {
      const input = {
        post_id: Object(Props.post_id), // primitive "number" into "Number"
      };
      const response = await (is_like
        ? api.postLike.postLikeCreate(input)
        : api.postDislike.postDislikeCreate(input));
      const data = await response.text;
      console.log("data");

      if (is_like) {
        !liked ? setLikes(likes + 1) : setLikes(likes - 1);
        if (disliked) {
          setDislikes(dislikes - 1);
          setDisliked(false);
        }
      } else {
        !disliked ? setDislikes(dislikes + 1) : setDislikes(dislikes - 1);
        if (liked) {
          setLikes(likes - 1);
          setLiked(false);
        }
      }

      is_like ? setLiked(!liked) : setDisliked(!disliked);
    } catch (error) {
      if (error?.status == 401) {
        console.log("401 error: redirecting to /login");
        window.location.href = "/login";
        return;
      }

      const errorMessage =
        error instanceof Error ? error.message : "Reacting failed";
      setError(errorMessage);
      console.error("Error:", error);
    }
  }

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
    <div class="pt-1 text-lg">
      <div class="inline mr-4">
        <span>{likes}</span>
        <span
          className="cursor-pointer px-2 text-green-500 hover:text-[#2196f3] inline-block"
          onClick={async () => {
            await react(true);
          }}
        >
          {liked ? <FontAwesome.FaThumbsUp /> : <FontAwesome.FaRegThumbsUp />}
        </span>
      </div>
      <div class="inline mr-4">
        <span>{dislikes}</span>
        <span
          className="cursor-pointer px-2 text-red-500 hover:text-[#2196f3] inline-block"
          onClick={async () => {
            await react(false);
          }}
        >
          {disliked ? (
            <FontAwesome.FaThumbsDown />
          ) : (
            <FontAwesome.FaRegThumbsDown />
          )}
        </span>
      </div>
      <div class="inline mr-4">
        <span>{Props.comments?.length}</span>
        <span
          className="cursor-pointer px-2 inline-block"
          onClick={async () => {
            await react(false);
          }}
        >
          <FontAwesome.FaCommentDots />
        </span>
      </div>
    </div>
  );
}
