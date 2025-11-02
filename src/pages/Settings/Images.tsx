import { Helmet } from "react-helmet";
import { useState, useEffect, useRef } from "preact/hooks";
import { api } from "../../api/client";
import { User } from "../../api/api";
import { FaImages, FaTrash, FaCheck, FaTimes, FaUpload } from "react-icons/fa";
import {
  getApiImageUrl,
  ProfilePicture,
} from "../../components/ProfilePicture";
import { useSpawnToast } from "../../components/technical/ToastProvider";

interface ImageData {
  id: string;
  url: string;
  filename: string;
  createdAt: string;
}

// API response type for images
interface ImageApiResponse {
  id: string;
  filename: string;
  url: string;
  uploadedAt: number;
}

interface ImagesSettingsProps {}

export function ImagesSettings(props: ImagesSettingsProps) {
  const toast = useSpawnToast();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [images, setImages] = useState<ImageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadUserDataAndImages();
  }, []);

  const loadUserDataAndImages = async () => {
    try {
      setLoading(true);
      setError(null);
      const sessionResponse = await api.auth.apiGetSessionList();

      if (!sessionResponse.data) {
        throw new Error("No session data received");
      }

      setCurrentUser(sessionResponse.data.user);

      // Load user's uploaded images
      await loadImages();
    } catch (err: any) {
      console.error("Settings data load error:", err);

      if (err?.error?.status === 401) {
        setError("Session expired. Please log in again.");
        return;
      }

      setError(
        err?.error?.message ||
          err?.message ||
          "Failed to load data. Please try refreshing the page."
      );
    } finally {
      setLoading(false);
    }
  };

  const loadImages = async () => {
    try {
      const imagesResponse = await api.images.getImages();
      if (imagesResponse.data && imagesResponse.data.images) {
        // Convert API response to ImageData format
        const transformedImages: ImageData[] = imagesResponse.data.images.map(
          (img: ImageApiResponse) => ({
            id: img.id,
            filename: img.filename,
            url: img.url,
            createdAt: new Date(img.uploadedAt).toISOString(),
          })
        );
        setImages(transformedImages);
      } else {
        setImages([]);
      }
    } catch (err: any) {
      console.error("Failed to load images:", err);
      // Don't show error for image loading, just set empty array
      setImages([]);
    }
  };

  const validateFile = (file: File): string | null => {
    // Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      return "File size must be less than 5MB";
    }

    // Check file type (allow images only)
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return "Only JPEG, PNG, GIF, and WebP images are allowed";
    }

    return null;
  };

  const handleFileUpload = async (event: Event, retryCount = 0) => {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];

    if (!file) return;

    setFileError(null);
    const validationError = validateFile(file);
    if (validationError) {
      setFileError(validationError);
      // Reset the input
      if (target) target.value = "";
      return;
    }

    try {
      setUploading(true);
      setFileError(null);

      await api.images.postImagesUpload({
        image: file,
      });

      // Reload images after successful upload
      await loadImages();
      toast({
        text: "Image uploaded successfully!",
        type: "success",
        time: 3000,
      });

      // Reset the input
      if (target) target.value = "";
    } catch (err: any) {
      console.error("Upload error:", err);

      if (
        retryCount < 2 &&
        (!err?.error?.status || err?.error?.status >= 500)
      ) {
        // Retry for server errors or network issues
        setFileError(`Upload failed, retrying... (${retryCount + 1}/3)`);
        setTimeout(
          () => handleFileUpload(event, retryCount + 1),
          1000 + retryCount * 2000
        );
        return;
      }

      setFileError(
        err?.error?.message || err?.message || "Failed to upload image"
      );
    } finally {
      setUploading(false);
    }
  };

  const handleSetProfileImage = async (image: string) => {
    try {
      setUpdatingProfile(true);

      await api.auth.apiUpdateUserCreate({
        image,
      });

      // Update the current user state
      setCurrentUser((prev) => (prev ? { ...prev, image } : null));

      toast({
        text: "Profile picture updated successfully!",
        type: "success",
        time: 3000,
      });
    } catch (err: any) {
      console.error("Profile update error:", err);
      toast({
        text:
          err?.error?.message ||
          err?.message ||
          "Failed to update profile picture",
        type: "error",
        time: 5000,
      });
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!confirm("Are you sure you want to delete this image?")) {
      return;
    }

    try {
      setDeletingImageId(imageId);

      await api.images.deleteImagesByImageId(imageId);

      // Reload images after successful deletion
      await loadImages();

      toast({
        text: "Image deleted successfully!",
        type: "success",
        time: 3000,
      });

      // If the deleted image was the current profile picture, it should be cleared
      if (currentUser?.image === imageId) {
        setCurrentUser((prev) => (prev ? { ...prev, image: null } : null));
      }
    } catch (err: any) {
      console.error("Delete error:", err);
      toast({
        text: err?.error?.message || err?.message || "Failed to delete image",
        type: "error",
        time: 5000,
      });
    } finally {
      setDeletingImageId(null);
    }
  };

  if (loading) {
    return (
      <>
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        </div>
      </>
    );
  }

  if (error && !currentUser) {
    return (
      <>
        <div className="container mx-auto px-4 py-8">
          <div className="alert alert-error">
            <span>{error}</span>
          </div>
        </div>
      </>
    );
  }

  for (let x of images) {
    console.log(x?.id);
    console.log(getApiImageUrl(x?.id));
  }

  return (
    <>
      <Helmet>
        <title>Uploaded Images - My Website</title>
        <meta
          name="description"
          content="Manage your uploaded profile images. Upload new images, set profile pictures, and organize your image gallery."
        />
        <meta
          name="keywords"
          content="uploaded images, profile pictures, image gallery, avatar, photo management"
        />
        <link rel="canonical" href="/settings/images" />
        <meta property="og:title" content="Uploaded Images - My Website" />
        <meta
          property="og:description"
          content="Manage your uploaded profile images. Upload new images, set profile pictures, and organize your image gallery."
        />
        <meta property="og:image" content="/logo.png" />
        <meta property="og:url" content="/settings/images" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Uploaded Images - My Website" />
        <meta
          name="twitter:description"
          content="Manage your uploaded profile images. Upload new images, set profile pictures, and organize your image gallery."
        />
        <meta name="twitter:image" content="/logo.png" />
      </Helmet>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <a href="/settings" className="btn btn-ghost btn-sm">
              ← Back to Settings
            </a>
            <h1 className="text-3xl font-bold">Uploaded Images</h1>
          </div>

          {/* Current Profile Picture */}
          <div className="card bg-base-100 shadow-xl mb-6">
            <div className="card-body">
              <h2 className="card-title">
                Current Profile Picture{" "}
                <button
                  class="btn btn-error btn-xs"
                  onClick={() => handleSetProfileImage("")}
                >
                  Reset Profile Picture
                </button>
              </h2>
              <div className="flex items-center gap-4">
                {currentUser && (
                  <ProfilePicture
                    name={currentUser.name}
                    image={currentUser.image || ""}
                  />
                )}
                <div>
                  <p className="text-sm opacity-70">
                    Your profile picture will be visible to other users on the
                    site.
                  </p>
                  {currentUser?.image && (
                    <p className="text-sm mt-2">
                      <FaCheck className="text-success inline mr-1" />
                      Profile picture is set
                    </p>
                  )}
                  {!currentUser?.image && (
                    <p className="text-sm mt-2">
                      <FaTimes className="text-warning inline mr-1" />
                      No profile picture set
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Upload New Image */}
          <div className="card bg-base-100 shadow-xl mb-6">
            <div className="card-body">
              <h2 className="card-title">Upload New Image</h2>
              <div className="form-control">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  className="file-input file-input-bordered w-full"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  aria-label="Upload new profile image"
                  aria-describedby="file-upload-help file-error-message"
                />
                <label className="label">
                  <span id="file-upload-help" className="label-text-alt">
                    Maximum file size: 5MB. Supported formats: JPEG, PNG, GIF,
                    WebP
                  </span>
                </label>
              </div>

              {fileError && (
                <div
                  id="file-error-message"
                  className="alert alert-error mt-4"
                  role="alert"
                  aria-live="polite"
                >
                  <span>{fileError}</span>
                </div>
              )}

              {uploading && (
                <div className="alert alert-info mt-4" aria-live="polite">
                  <span className="loading loading-spinner loading-sm"></span>
                  <span>Uploading image...</span>
                </div>
              )}
            </div>
          </div>

          {/* Image Gallery */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title">Your Images</h2>

              {images.length === 0 ? (
                <div className="text-center py-8 opacity-70">
                  <FaImages size={48} className="mx-auto mb-4" />
                  <p>
                    No images uploaded yet. Upload your first profile image
                    above.
                  </p>
                </div>
              ) : (
                <div
                  className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
                  role="grid"
                  aria-label="Image gallery"
                >
                  {images.map((image) => (
                    <div
                      key={image.id}
                      className="card bg-base-200 shadow-md"
                      role="gridcell"
                    >
                      <figure className="px-4 pt-4">
                        <img
                          src={getApiImageUrl("/images/" + image.id)}
                          alt={image.filename}
                          className="rounded-xl w-full h-32 object-cover"
                          onError={(e) => {
                            // Fallback if image fails to load
                            const target = e.target as HTMLImageElement;
                            target.src =
                              "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBmaWxsPSIjOWNhM2FmIiBkPSJNMTIgMkM5LjIyIDIgNi4xNSA0Ljg3IDUuNTQgOC4wOGMtMC4xNiAwLjQzLTAuMjcgMC44OS0wLjI3IDEuMzh2MTAuNzVjMCAxLjEwLjg5IDIgMiAycTE2LjY3IDAgMTEuMzMtMTMuNzJDMTYuODMgNC42IDE0Ljc5IDIgMTIgMnoiLz48L3N2Zz4=";
                          }}
                        />
                      </figure>
                      <div className="card-body p-4">
                        <div className="card-actions justify-center gap-2">
                          <button
                            className={`btn btn-primary btn-xs ${
                              updatingProfile ? "loading" : ""
                            }`}
                            onClick={() =>
                              handleSetProfileImage("/images/" + image.id)
                            }
                            disabled={
                              updatingProfile || currentUser?.image === image.id
                            }
                            aria-label={
                              currentUser?.image === "/images/" + image.id
                                ? `Current profile picture: ${image.filename}`
                                : `Set ${image.filename} as profile picture`
                            }
                          >
                            {currentUser?.image === "/images/" + image.id ? (
                              <>
                                <FaCheck size={12} />
                                Current
                              </>
                            ) : (
                              "Set as Profile"
                            )}
                          </button>
                          <button
                            className={`btn btn-error btn-xs ${
                              deletingImageId === image.id ? "loading" : ""
                            }`}
                            onClick={() => handleDeleteImage(image.id)}
                            disabled={deletingImageId === image.id}
                            aria-label={`Delete image: ${image.filename}${
                              currentUser?.image === image.id
                                ? " (currently set as profile picture)"
                                : ""
                            }`}
                          >
                            <FaTrash size={12} />
                          </button>
                        </div>
                        {currentUser?.image === image.id && (
                          <p
                            className="text-xs text-center mt-2 text-primary font-medium"
                            aria-live="polite"
                          >
                            Currently set as profile picture
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Error Messages */}
          {error && (
            <div className="alert alert-error mt-6">
              <span>{error}</span>
            </div>
          )}

          {/* Info Section */}
          <div className="alert alert-info mt-6">
            <div>
              <h3 className="font-bold">Image Guidelines</h3>
              <div className="text-sm">
                <ul className="list-disc list-inside space-y-1 mt-2">
                  <li>Maximum file size: 5MB</li>
                  <li>Supported formats: JPEG, PNG, GIF, WebP</li>
                  <li>Images will be accessible to other logged-in users</li>
                  <li>
                    Profile images require verification before public display
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
