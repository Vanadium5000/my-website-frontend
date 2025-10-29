import { useEffect, useState } from "preact/hooks";
import { api } from "../../../api/client";
import {
  FiBookOpen,
  FiPlay,
  FiTarget,
  FiGrid,
  FiZap,
  FiShuffle,
  FiPlus,
  FiEdit3,
  FiTrash2,
  FiSearch,
  FiDownload,
  FiUpload,
  FiShare2,
} from "react-icons/fi";
import { highlightSearchTerms } from "../../../utils/highlight";
import { getApiImageUrl } from "../../../components/ProfilePicture";

import { FlashcardDeckSchema } from "../../../api/api";
import { useLocation } from "preact-iso";
import { FaArrowsUpDown } from "react-icons/fa6";

type Deck = FlashcardDeckSchema;

/**
 * Main Quizspire component for managing flashcard decks.
 * Provides functionality to create, edit, delete, search, export, and import decks.
 */
export function Quizspire() {
  const { route, url } = useLocation();

  // State management for decks and UI
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingDeck, setEditingDeck] = useState<Deck | null>(null);
  const [thumbnailCache, setThumbnailCache] = useState<Map<string, string>>(
    new Map()
  );

  /**
   * Fetches all decks from the API and updates state.
   */
  const fetchDecks = async () => {
    try {
      const response = await api.quizspire.getQuizspireDecks();
      setDecks(response.data);
      // Generate and cache picsum thumbnails for decks without thumbnails
      const decksWithoutThumbnails = response.data.filter(
        (deck: Deck) => !deck.thumbnail
      );
      for (const deck of decksWithoutThumbnails) {
        if (!thumbnailCache.has(deck._id!)) {
          const picsumUrl = `https://picsum.photos/400/300?random=${Math.random()}`;
          // Fetch the image and upload to backend
          try {
            const response = await fetch(picsumUrl);
            const blob = await response.blob();
            const file = new File([blob], `picsum-${deck._id}.jpg`, {
              type: "image/jpeg",
            });
            const uploadResponse = await api.images.postImagesUpload({
              image: file,
            });
            const uploadedUrl = uploadResponse.data.url;
            setThumbnailCache((prev) =>
              new Map(prev).set(deck._id!, getApiImageUrl(uploadedUrl))
            );
            // Update the deck with the new thumbnail
            await api.quizspire.putQuizspireDecksById(deck._id!, {
              thumbnail: uploadedUrl,
            });
          } catch (uploadErr) {
            console.error("Failed to upload picsum image:", uploadErr);
          }
        }
      }
    } catch (err) {
      if (err.status === 401) {
        route("/login");
        return;
      }

      setError("Failed to load decks");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch decks on component mount
  useEffect(() => {
    fetchDecks();
  }, []);

  /**
   * Filters decks based on search query in title or description.
   * Uses case-insensitive substring matching for better UX.
   */
  const filteredDecks = decks.filter(
    (deck) =>
      deck.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deck.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  /**
   * Creates a new deck via API and refreshes the deck list.
   */
  const handleCreateDeck = async (
    deckData: Omit<
      Deck,
      "_id" | "userId" | "createdAt" | "lastModified" | "publishedTimestamp"
    >
  ) => {
    try {
      await api.quizspire.postQuizspireDecks({
        title: deckData.title,
        description: deckData.description,
        thumbnail: deckData.thumbnail,
        cards: deckData.cards,
      });
      setShowCreateModal(false);
      fetchDecks();
    } catch (err) {
      console.error("Failed to create deck:", err);
      setError("Failed to create deck");
    }
  };

  /**
   * Updates an existing deck via API and refreshes the deck list.
   */
  const handleUpdateDeck = async (deckId: string, deckData: Partial<Deck>) => {
    try {
      await api.quizspire.putQuizspireDecksById(deckId, deckData);
      setEditingDeck(null);
      fetchDecks();
    } catch (err) {
      console.error("Failed to update deck:", err);
      setError("Failed to update deck");
    }
  };

  /**
   * Deletes a deck after user confirmation and refreshes the deck list.
   */
  const handleDeleteDeck = async (deckId: string) => {
    if (confirm("Are you sure you want to delete this deck?")) {
      try {
        await api.quizspire.deleteQuizspireDecksById(deckId);
        fetchDecks();
      } catch (err) {
        console.error("Failed to delete deck:", err);
        setError("Failed to delete deck");
      }
    }
  };

  if (loading) {
    return (
      <div class="container mx-auto px-4 py-8">
        <div class="flex justify-center">
          <span class="loading loading-spinner loading-lg"></span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div class="container mx-auto px-4 py-8">
        <div class="alert alert-error">
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div class="container mx-auto px-4 py-8">
      <div class="mb-8">
        <h1 class="text-4xl font-bold mb-4">Quizspire</h1>
        <p class="text-lg text-base-content/70">
          Master your flashcards with various study modes.
        </p>
      </div>

      <div class="flex flex-col sm:flex-row gap-4 mb-6">
        <div class="flex-1">
          <label class="input input-bordered flex items-center gap-2">
            <FiSearch class="w-4 h-4" />
            <input
              type="text"
              class="grow"
              placeholder="Search decks..."
              value={searchQuery}
              onInput={(e) => setSearchQuery(e.currentTarget.value)}
            />
          </label>
        </div>
        <div class="flex gap-2">
          <button
            class="btn btn-outline"
            onClick={() => {
              try {
                const dataStr = JSON.stringify(decks, null, 2);
                const dataUri =
                  "data:application/json;charset=utf-8," +
                  encodeURIComponent(dataStr);
                const exportFileDefaultName = "quizspire-decks.json";
                const linkElement = document.createElement("a");
                linkElement.setAttribute("href", dataUri);
                linkElement.setAttribute("download", exportFileDefaultName);
                linkElement.click();
              } catch (err) {
                console.error("Failed to export decks:", err);
                alert("Failed to export decks. Please try again.");
              }
            }}
          >
            <FiDownload class="w-4 h-4 mr-2" />
            Export All
          </button>
          <input
            type="file"
            accept=".json"
            class="hidden"
            id="import-decks"
            onChange={async (e) => {
              const file = e.currentTarget.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = async (event) => {
                  try {
                    const importedDecks = JSON.parse(
                      event.target?.result as string
                    );
                    if (Array.isArray(importedDecks)) {
                      // Import decks to backend
                      for (const deck of importedDecks) {
                        try {
                          await api.quizspire.postQuizspireDecks({
                            title: deck.title,
                            description: deck.description,
                            thumbnail: deck.thumbnail,
                            cards: deck.cards,
                          });
                        } catch (importErr) {
                          console.error(
                            "Failed to import deck:",
                            deck.title,
                            importErr
                          );
                        }
                      }
                      // Refresh the deck list
                      fetchDecks();
                      alert("Decks imported successfully!");
                    } else {
                      alert("Invalid JSON format. Expected an array of decks.");
                    }
                  } catch (err) {
                    console.error("Failed to parse JSON file:", err);
                    alert(
                      "Failed to parse JSON file. Please check the file format."
                    );
                  }
                };
                reader.readAsText(file);
              }
              // Reset input value to allow re-uploading the same file
              e.currentTarget.value = "";
            }}
          />
          <label for="import-decks" class="btn btn-outline">
            <FiUpload class="w-4 h-4 mr-2" />
            Import
          </label>
          <button
            class="btn btn-primary"
            onClick={() => setShowCreateModal(true)}
          >
            <FiPlus class="w-4 h-4 mr-2" />
            Create Deck
          </button>
        </div>
      </div>

      {filteredDecks.length === 0 && decks.length > 0 ? (
        <div class="text-center py-12">
          <p class="text-xl text-base-content/50">
            No decks match your search.
          </p>
        </div>
      ) : filteredDecks.length === 0 ? (
        <div class="text-center py-12">
          <p class="text-xl text-base-content/50 mb-4">
            No decks found. Create your first deck to get started!
          </p>
          <button
            class="btn btn-primary btn-lg"
            onClick={() => setShowCreateModal(true)}
          >
            <FiPlus class="w-5 h-5 mr-2" />
            Create Your First Deck
          </button>
        </div>
      ) : (
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDecks.map((deck) => {
            // Highlight search terms in title and description
            const highlightedTitle = searchQuery
              ? highlightSearchTerms(deck.title, searchQuery)
              : deck.title;
            const highlightedDescription = searchQuery
              ? highlightSearchTerms(deck.description, searchQuery)
              : deck.description;

            return (
              <div key={deck._id} class="card bg-base-100 shadow-2xl">
                <div class="card-actions justify-center mb-4">
                  <div class="grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-2 w-full">
                    <button
                      class="btn btn-info btn-sm"
                      onClick={() =>
                        route(`/projects/quizspire/${deck._id}?fullscreen=true`)
                      }
                    >
                      <FiBookOpen class="w-4 h-4 mr-1" />
                      Flashcards
                    </button>
                    <button
                      class="btn btn-info btn-sm"
                      onClick={() => {
                        const params = new URLSearchParams();
                        params.set("referrer", encodeURIComponent(url));
                        const targetUrl = `/projects/quizspire/${deck._id}/learn?${params}`;

                        route(targetUrl);
                      }}
                    >
                      <FiPlay class="w-4 h-4 mr-1" />
                      Learn
                    </button>
                    <button
                      class="btn btn-info btn-sm"
                      onClick={() => {
                        const params = new URLSearchParams();
                        params.set("referrer", encodeURIComponent(url));
                        const targetUrl = `/projects/quizspire/${deck._id}/test?${params}`;

                        route(targetUrl);
                      }}
                    >
                      <FiTarget class="w-4 h-4 mr-1" />
                      Test
                    </button>
                    <button
                      class="btn btn-info btn-sm"
                      onClick={() => {
                        const params = new URLSearchParams();
                        params.set("referrer", encodeURIComponent(url));
                        const targetUrl = `/projects/quizspire/${deck._id}/tetris?${params}`;

                        route(targetUrl);
                      }}
                    >
                      <FiGrid class="w-4 h-4 mr-1" />
                      Tetris
                    </button>
                    <button class="btn btn-info btn-sm">
                      <FiZap class="w-4 h-4 mr-1" />
                      Blast
                    </button>
                    <button class="btn btn-info btn-sm">
                      <FiShuffle class="w-4 h-4 mr-1" />
                      Match
                    </button>
                  </div>
                </div>
                <figure>
                  <img
                    src={
                      deck.thumbnail
                        ? getApiImageUrl(deck.thumbnail)
                        : thumbnailCache.get(deck._id!) ||
                          "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjIwMCIgeT0iMTUwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOUI5QkE0IiBmb250LXNpemU9IjE2IiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiI+TG9hZGluZy4uLjwvdGV4dD4KPHN2Zz4="
                    }
                    alt={deck.title}
                    class="w-full h-48 object-cover cursor-pointer"
                    onClick={() =>
                      (window.location.href = `/projects/quizspire/${deck._id}`)
                    }
                  />
                </figure>
                <div class="card-body">
                  <h2
                    class="card-title gap-0 cursor-pointer"
                    dangerouslySetInnerHTML={{ __html: highlightedTitle }}
                    onClick={() =>
                      (window.location.href = `/projects/quizspire/${deck._id}`)
                    }
                  />
                  <p
                    class="text-sm text-base-content/70"
                    dangerouslySetInnerHTML={{ __html: highlightedDescription }}
                  />
                  <p class="text-xs text-base-content/50">
                    {deck.cards.length} cards • Created:{" "}
                    {new Date(deck.createdAt).toLocaleDateString()} • Last
                    modified: {new Date(deck.lastModified).toLocaleDateString()}
                  </p>
                  <div class="card-actions justify-end mt-4">
                    <div class="flex gap-2 w-full">
                      <button
                        class="btn btn-outline btn-wide flex-1"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(
                              `${window.location.origin}/projects/quizspire/${deck._id}`
                            );
                            // Simple visual feedback - could be enhanced with toast
                            const btn =
                              event?.currentTarget as HTMLButtonElement;
                            if (btn) {
                              const originalText = btn.innerHTML;
                              btn.innerHTML =
                                '<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>Copied!';
                              setTimeout(() => {
                                btn.innerHTML = originalText;
                              }, 2000);
                            }
                          } catch (err) {
                            console.error("Failed to copy link:", err);
                          }
                        }}
                      >
                        <FiShare2 class="w-4 h-4 mr-2" />
                        Share
                      </button>
                      <button
                        class="btn btn-outline btn-wide flex-1"
                        onClick={() => setEditingDeck(deck)}
                      >
                        <FiEdit3 class="w-4 h-4 mr-2" />
                        Edit
                      </button>
                      <button
                        class="btn btn-outline btn-error btn-wide flex-1"
                        onClick={() => handleDeleteDeck(deck._id!)}
                      >
                        <FiTrash2 class="w-4 h-4 mr-2" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Deck Modal */}
      {(showCreateModal || editingDeck) && (
        <DeckModal
          deck={editingDeck}
          onSave={(deckData) => {
            if (editingDeck) {
              handleUpdateDeck(editingDeck._id!, deckData);
            } else {
              handleCreateDeck(
                deckData as Omit<
                  Deck,
                  | "_id"
                  | "userId"
                  | "createdAt"
                  | "lastModified"
                  | "publishedTimestamp"
                >
              );
            }
          }}
          onClose={() => {
            setShowCreateModal(false);
            setEditingDeck(null);
          }}
        />
      )}
    </div>
  );
}

interface DeckModalProps {
  deck: Deck | null;
  onSave: (deckData: Partial<Deck>) => void;
  onClose: () => void;
}

/**
 * Modal component for creating or editing flashcard decks.
 * Handles form state, image uploads, and card management.
 */
export function DeckModal({ deck, onSave, onClose }: DeckModalProps) {
  // Form state
  const [title, setTitle] = useState(deck?.title || "");
  const [description, setDescription] = useState(deck?.description || "");
  const [thumbnail, setThumbnail] = useState(deck?.thumbnail || "");
  const [cards, setCards] = useState(deck?.cards || []);
  const [uploading, setUploading] = useState(false);

  /**
   * Uploads an image file and returns the URL.
   */
  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const response = await api.images.postImagesUpload({ image: file });
      return response.data.url;
    } catch (err) {
      console.error("Failed to upload image:", err);
      return null;
    } finally {
      setUploading(false);
    }
  };

  /**
   * Handles form submission, validates input, and saves the deck.
   */
  const handleSubmit = (e: Event) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave({
      title: title.trim(),
      description: description.trim(),
      thumbnail: thumbnail.trim(),
      cards,
    });
  };

  /**
   * Adds a new empty card to the deck.
   */
  const addCard = () => {
    setCards([
      ...cards,
      {
        word: [{ text: "", type: "text" }],
        definition: [{ text: "", type: "text" }],
      },
    ]);
  };

  /**
   * Updates a specific card's field (word or definition) with new content.
   * Preserves existing content structure while updating the specified field.
   */
  const updateCard = (
    index: number,
    field: "word" | "definition",
    value: any[]
  ) => {
    const newCards = [...cards];
    newCards[index][field] = value;
    setCards(newCards);
  };

  /**
   * Removes a card from the deck at the specified index.
   */
  const removeCard = (index: number) => {
    setCards(cards.filter((_, i) => i !== index));
  };

  return (
    <div class="modal modal-open">
      <div class="modal-box max-w-4xl max-h-[90vh] overflow-y-auto">
        <h3 class="font-bold text-lg mb-4">
          {deck ? "Edit Deck" : "Create New Deck"}
        </h3>

        <form onSubmit={handleSubmit}>
          {/* Improved form layout with consistent alignment */}
          <div class="space-y-4 mb-6">
            <div class="form-control">
              <label class="label">
                <span class="label-text">Title *</span>
              </label>
              <input
                type="text"
                class="input input-bordered w-full"
                value={title}
                onInput={(e) => setTitle(e.currentTarget.value)}
                maxLength={100}
                required
              />
            </div>

            <div class="form-control">
              <label class="label">
                <span class="label-text">Description</span>
              </label>
              <textarea
                class="textarea textarea-bordered w-full"
                value={description}
                onInput={(e) => setDescription(e.currentTarget.value)}
                maxLength={500}
                rows={3}
              />
            </div>
          </div>

          {/* Simplified thumbnail upload only */}
          <div class="form-control mb-6">
            <label class="label">
              <span class="label-text">Thumbnail Image</span>
            </label>
            <input
              type="file"
              class="file-input file-input-bordered"
              accept="image/*"
              disabled={uploading}
              onChange={async (e) => {
                const file = e.currentTarget.files?.[0];
                if (file) {
                  const url = await handleImageUpload(file);
                  if (url) setThumbnail(url);
                }
              }}
            />
            {uploading && (
              <span class="loading loading-spinner loading-sm mt-2"></span>
            )}
          </div>

          <div class="mb-4">
            <div class="flex justify-between items-center mb-2">
              <h4 class="font-semibold">Cards ({cards.length}/1000)</h4>
              <button
                type="button"
                class="btn btn-sm btn-outline"
                onClick={addCard}
                disabled={cards.length >= 1000}
              >
                <FiPlus class="w-4 h-4 mr-1" />
                Add Card
              </button>
            </div>

            <div class="space-y-4 max-h-96 overflow-y-auto">
              {cards.map((card, index) => (
                <div key={index} class="border border-base-300 rounded-lg p-4">
                  <div class="flex justify-between items-center mb-2">
                    <span class="font-medium">Card {index + 1}</span>
                    <button
                      type="button"
                      class="btn btn-ghost btn-sm text-error"
                      onClick={() => removeCard(index)}
                    >
                      <FiTrash2 class="w-4 h-4" />
                    </button>
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label class="label">
                        <span class="label-text">Word/Question</span>
                      </label>
                      <textarea
                        class="textarea textarea-bordered textarea-sm"
                        value={
                          card.word.find((w) => w.type === "text")?.text || ""
                        }
                        onInput={(e) => {
                          const text = e.currentTarget.value;
                          const existingMedia = card.word.filter(
                            (w) => w.type === "media"
                          );
                          updateCard(index, "word", [
                            { text, type: "text" },
                            ...existingMedia,
                          ]);
                        }}
                        placeholder="Enter the word or question"
                        rows={2}
                      />
                      {/* Multiple image uploads for word side */}
                      <div class="mt-2">
                        <label class="label">
                          <span class="label-text-alt">Add Images</span>
                        </label>
                        <input
                          type="file"
                          class="file-input file-input-bordered file-input-xs"
                          accept="image/*"
                          multiple
                          disabled={uploading}
                          onChange={async (e) => {
                            const files = Array.from(
                              e.currentTarget.files || []
                            );
                            const existingText = card.word.find(
                              (w) => w.type === "text"
                            );
                            const existingMedia = card.word.filter(
                              (w) => w.type === "media"
                            );
                            const newMedia = [];
                            for (const file of files) {
                              const url = await handleImageUpload(file);
                              if (url)
                                newMedia.push({ mediaUrl: url, type: "media" });
                            }
                            updateCard(index, "word", [
                              existingText || { text: "", type: "text" },
                              ...existingMedia,
                              ...newMedia,
                            ]);
                          }}
                        />
                        {/* Display existing images */}
                        <div class="flex flex-wrap gap-2 mt-2">
                          {card.word
                            .filter((w) => w.type === "media")
                            .map((media, mediaIndex) => (
                              <div key={mediaIndex} class="relative">
                                <img
                                  src={getApiImageUrl(media.mediaUrl)}
                                  alt={`Word image ${mediaIndex + 1}`}
                                  class="w-16 h-16 object-cover rounded"
                                />
                                <button
                                  type="button"
                                  class="btn btn-circle btn-xs absolute -top-2 -right-2"
                                  onClick={() => {
                                    const updatedWord = card.word.filter(
                                      (_, i) =>
                                        !(i > 0 && card.word[i] === media)
                                    );
                                    updateCard(index, "word", updatedWord);
                                  }}
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label class="label">
                        <span class="label-text">Definition/Answer</span>
                      </label>
                      <textarea
                        class="textarea textarea-bordered textarea-sm"
                        value={
                          card.definition.find((d) => d.type === "text")
                            ?.text || ""
                        }
                        onInput={(e) => {
                          const text = e.currentTarget.value;
                          const existingMedia = card.definition.filter(
                            (d) => d.type === "media"
                          );
                          updateCard(index, "definition", [
                            { text, type: "text" },
                            ...existingMedia,
                          ]);
                        }}
                        placeholder="Enter the definition or answer"
                        rows={2}
                      />
                      {/* Multiple image uploads for definition side */}
                      <div class="mt-2">
                        <label class="label">
                          <span class="label-text-alt">Add Images</span>
                        </label>
                        <input
                          type="file"
                          class="file-input file-input-bordered file-input-xs"
                          accept="image/*"
                          multiple
                          disabled={uploading}
                          onChange={async (e) => {
                            const files = Array.from(
                              e.currentTarget.files || []
                            );
                            const existingText = card.definition.find(
                              (d) => d.type === "text"
                            );
                            const existingMedia = card.definition.filter(
                              (d) => d.type === "media"
                            );
                            const newMedia = [];
                            for (const file of files) {
                              const url = await handleImageUpload(file);
                              if (url)
                                newMedia.push({ mediaUrl: url, type: "media" });
                            }
                            updateCard(index, "definition", [
                              existingText || { text: "", type: "text" },
                              ...existingMedia,
                              ...newMedia,
                            ]);
                          }}
                        />
                        {/* Display existing images */}
                        <div class="flex flex-wrap gap-2 mt-2">
                          {card.definition
                            .filter((d) => d.type === "media")
                            .map((media, mediaIndex) => (
                              <div key={mediaIndex} class="relative">
                                <img
                                  src={getApiImageUrl(media.mediaUrl)}
                                  alt={`Definition image ${mediaIndex + 1}`}
                                  class="w-16 h-16 object-cover rounded"
                                />
                                <button
                                  type="button"
                                  class="btn btn-circle btn-xs absolute -top-2 -right-2"
                                  onClick={() => {
                                    const updatedDefinition =
                                      card.definition.filter(
                                        (_, i) =>
                                          !(
                                            i > 0 &&
                                            card.definition[i] === media
                                          )
                                      );
                                    updateCard(
                                      index,
                                      "definition",
                                      updatedDefinition
                                    );
                                  }}
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div class="modal-action">
            <button type="button" class="btn" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              class="btn btn-primary"
              disabled={!title.trim()}
            >
              {deck ? "Update Deck" : "Create Deck"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
