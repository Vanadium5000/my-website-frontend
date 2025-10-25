import { useEffect, useMemo, useState } from "preact/hooks";
import { api } from "../api/client.js";

interface Props {
  name: string;
  image: string;
  widthClass?: string;
}

export function ProfilePicture(props: Props) {
  if (!props.name) return;

  const [imageURL, setImageURL] = useState("");

  // Memoize the promise for the image URL (recomputes only if inputs change)
  const getImageURL = useMemo(() => {
    if (props.image) {
      return Promise.resolve(props.image);
    }
    return api.avatar
      .getAvatar({ name: props.name })
      .then((response) => response.text());
  }, [props?.image, props?.name]);

  // Resolve the memoized promise and update state
  useEffect(() => {
    let cancelled = false;

    getImageURL
      .then((url) => {
        if (!cancelled) {
          console.log("GOT IMAGE URL:", url);
          setImageURL(url);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Generating or setting the user's avatar failed";
          alert(errorMessage);
          console.error("Error:", error);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [getImageURL]);

  return (
    <div tabIndex={0} className="avatar cursor-pointer">
      <div className={"rounded-full " + (props.widthClass || "w-10")}>
        <img alt="USER ICON" src={imageURL} />
      </div>
    </div>
  );
}
