import { useEffect, useState } from "preact/hooks";
import { api } from "../api/client.js";
import {
  ThumbsUp,
  ThumbsUpSolid,
  ThumbsDown,
  ThumbsDownSolid,
} from "../icons/index.js";

interface Props {
  post_id: Number;
  likes: Number;
  dislikes: Number;
}

export function Reactions(Props: Props) {
  const [likes, setLikes] = useState(Props.likes);
  const [dislikes, setDislikes] = useState(Props.dislikes);
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [error, setError] = useState("");

  return (
    <div class="pt-1">
      <div class="inline mr-2">
        <span>{likes}</span>
        <i>{liked ? <ThumbsUp /> : <ThumbsUpSolid />}</i>
        <i
          class={`fa-thumbs-up fa-lg cursor-pointer py-4 px-2 text-green-500 hover:text-[#2196f3]${liked ? "fa-solid" : "fa-regular"}`}
          onClick={async () => {
            await react(true);
          }}
        ></i>
      </div>
      <div class="inline mx-4">
        <span>{dislikes}</span>
        <i
          class={`fa-thumbs-down fa-lg cursor-pointer py-4 px-2 text-red-500 hover:text-[#2196f3]${disliked ? "fa-solid" : "fa-regular"}`}
          onClick={async () => {
            await react(false);
          }}
        ></i>
      </div>
      {/* <div class="inline ml-2">
        <span id={`comments-${id}`}>{comments}</span>
        <i class="fa-solid fa-comment-dots fa-lg py-4 px-2"></i>
      </div> */}
    </div>
  );
}
