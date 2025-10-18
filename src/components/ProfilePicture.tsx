import { useEffect, useState } from "preact/hooks";
import { api } from "../api/client.js";

interface Props {
  id: string;
  name: string;
  image: string;
}

export function ProfilePicture(props: Props) {
  if (!props.name) return;

  const [imageURL, setImageURL] = useState("");

  // Generate or set the user's avatar
  useEffect(() => {
    (async () => {
      try {
        // Generate or set the user's avatar
        const imageURL =
          props.image ||
          (await (await api.avatar.getAvatar({ name: props.name })).text());
        console.log("GOT IMAGE URL:", imageURL);

        setImageURL(imageURL);
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Generating or setting the user's avatar failed";
        alert(errorMessage);
        console.error("Error:", error);
      }
    })();
  }, [props]);

  return (
    <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
      <div className="w-10 rounded-full">
        <img alt="USER ICON" src={imageURL} />
      </div>
    </div>
  );
}
