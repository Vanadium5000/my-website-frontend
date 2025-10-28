import { useEffect, useMemo, useState } from "preact/hooks";
import { api } from "../api/client.js";

interface Props {
  name: string;
  image: string;
  widthClass?: string;
}

/**
 * Constructs a full URL for API-hosted images.
 * @param imagePath The relative image path (e.g., "/images/...") or a http url
 * @returns Full URL to the image on the API server
 */
export const getApiImageUrl = (imagePath: string): string => {
  if (!imagePath.startsWith("/")) {
    return imagePath;
  } else {
    // Paths not beginning with / with be added to baseUrl, those beginning with / will replace every after the main host
    // .slice(1) removes the starting "/"
    return new URL(imagePath.slice(1), `${api.baseUrl}`).href;
  }
};

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
        <img alt="USER ICON" src={getApiImageUrl(imageURL)} />
      </div>
    </div>
  );
}
