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
  FiUpload,
  FiShare2,
  FiArrowUp,
  FiDownload,
  FiLock,
  FiUnlock,
  FiAlertTriangle,
  FiCheckCircle,
  FiXCircle,
  FiSettings,
  FiFileText,
  FiImage,
  FiHash,
  FiCode,
  FiX,
  FiArrowRight,
  FiExternalLink,
  FiRefreshCw,
} from "react-icons/fi";
import { highlightSearchTerms } from "../../../utils/highlight";
import { getApiImageUrl } from "../../../components/ProfilePicture";
import { Helmet } from "react-helmet-async";

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
  const [showMigrationModal, setShowMigrationModal] = useState(false);

  /**
   * Fetches all decks from the API and updates state.
   */
  const fetchDecks = async () => {
    try {
      const response = await api.quizspire.getQuizspireDecks();
      setDecks(response.data);
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
    <>
      <Helmet>
        <title>Quizspire - Interactive Quiz Platform</title>
        <meta
          name="description"
          content="Master your flashcards with Quizspire's interactive study modes including flashcards, learn, test, match, and Tetris games. Create and manage custom flashcard decks for effective learning."
        />
        <meta
          name="keywords"
          content="quizspire, flashcards, learning, study modes, quiz, education, interactive learning"
        />
        <link rel="canonical" href="/projects/quizspire" />
        <meta
          property="og:title"
          content="Quizspire - Interactive Quiz Platform"
        />
        <meta
          property="og:description"
          content="Master your flashcards with Quizspire's interactive study modes including flashcards, learn, test, match, and Tetris games. Create and manage custom flashcard decks for effective learning."
        />
        <meta property="og:image" content="/quizspire.png" />
        <meta property="og:url" content="/projects/quizspire" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="Quizspire - Interactive Quiz Platform"
        />
        <meta
          name="twitter:description"
          content="Master your flashcards with Quizspire's interactive study modes including flashcards, learn, test, match, and Tetris games. Create and manage custom flashcard decks for effective learning."
        />
        <meta name="twitter:image" content="/quizspire.png" />
      </Helmet>
      <div class="container mx-auto px-4 py-8">
        <div class="mb-8">
          <h1 class="text-4xl font-bold mb-4">Quizspire</h1>
          <p class="text-lg text-base-content/70">
            Master your flashcards with various study modes.
          </p>
        </div>
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
            class="btn btn-secondary"
            onClick={() => setShowMigrationModal(true)}
          >
            <FiArrowUp class="w-4 h-4 mr-2" />
            Import from Quizlet
          </button>
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
                    <button
                      class="btn btn-info btn-sm"
                      onClick={() => {
                        const params = new URLSearchParams();
                        params.set("referrer", encodeURIComponent(url));
                        const targetUrl = `/projects/quizspire/${deck._id}/match?${params}`;

                        route(targetUrl);
                      }}
                    >
                      <FiShuffle class="w-4 h-4 mr-1" />
                      Match
                    </button>
                    <button
                      class="btn btn-success btn-sm"
                      onClick={() => {
                        const params = new URLSearchParams();
                        params.set("referrer", encodeURIComponent(url));
                        params.set("deckId", deck._id);
                        const targetUrl = `/projects/quizspire/host?${params}`;

                        route(targetUrl);
                      }}
                    >
                      <FiPlay class="w-4 h-4 mr-1" />
                      Host
                    </button>
                  </div>
                </div>
                <figure>
                  <img
                    src={
                      deck.thumbnail
                        ? getApiImageUrl(deck.thumbnail)
                        : "/quizspire.png"
                    }
                    alt={deck.title}
                    class="w-full h-48 object-cover cursor-pointer"
                    onClick={() =>
                      (window.location.href = `/projects/quizspire/${deck._id}`)
                    }
                  />
                </figure>
                <div class="card-body">
                  <div
                    class="cursor-pointer"
                    onClick={() =>
                      (window.location.href = `/projects/quizspire/${deck._id}`)
                    }
                  >
                    <h2
                      class="card-title gap-0"
                      dangerouslySetInnerHTML={{ __html: highlightedTitle }}
                    />
                    <p
                      class="text-sm text-base-content/70"
                      dangerouslySetInnerHTML={{
                        __html: highlightedDescription,
                      }}
                    />
                    <p class="text-xs text-base-content/50">
                      {deck.cards.length} cards • Created:{" "}
                      {new Date(deck.createdAt).toLocaleDateString()} • Last
                      modified:{" "}
                      {new Date(deck.lastModified).toLocaleDateString()}
                    </p>
                  </div>
                  <div class="card-actions justify-end mt-4">
                    <div class="flex gap-2 w-full">
                      <button
                        class="btn btn-outline btn-wide flex-1"
                        onClick={async (event) => {
                          try {
                            await navigator.clipboard.writeText(
                              `${window.location.origin}/projects/quizspire/${deck._id}`
                            );
                            // Show visual feedback
                            const btn = event.target as HTMLButtonElement;
                            console.log(btn);
                            if (btn) {
                              btn.classList.add("btn-success");
                              btn.textContent = "Copied!";
                              setTimeout(() => {
                                btn.classList.remove("btn-success");
                                btn.innerHTML =
                                  '<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"></path></svg>Share';
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

      {/* Quizlet Migration Modal */}
      {showMigrationModal && (
        <MigrationModal
          onClose={() => setShowMigrationModal(false)}
          onImportSuccess={fetchDecks}
        />
      )}
    </>
  );
}

/**
 * Modal component for migrating Quizlet flashcards to Quizspire.
 * Attempts direct JSON fetch first, falls back to iframe if needed.
 * Handles deck ID input, data loading, JSON parsing, and deck creation.
 */
export function MigrationModal({
  onClose,
  onImportSuccess,
}: {
  onClose: () => void;
  onImportSuccess: () => void;
}) {
  const [deckId, setDeckId] = useState("");
  const [deckName, setDeckName] = useState("");
  const [deckDescription, setDeckDescription] = useState("");
  const [deckThumbnail, setDeckThumbnail] = useState("");
  const [iframeUrl, setIframeUrl] = useState("");
  const [jsonText, setJsonText] = useState("");
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showIframe, setShowIframe] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);

  /**
   * Constructs the Quizlet API URL for fetching a specific flashcard deck.
   * @param deckId - The numeric Quizlet deck ID
   * @returns The complete API URL string
   */
  const buildQuizletApiUrl = (deckId: string): string => {
    return `https://quizlet.com/webapi/3.4/studiable-item-documents?filters[studiableContainerId]=${deckId}&filters[studiableContainerType]=1&perPage=1000&page=1`;
  };

  /**
   * Attempts to fetch Quizlet data directly as JSON.
   * Falls back to iframe if direct fetch fails (due to CORS or captchas).
   */
  const loadData = async () => {
    if (!deckId.trim()) {
      setError("Please enter a valid numeric Quizlet deck ID.");
      return;
    }

    // Validate that deckId is numeric
    if (!/^\d+$/.test(deckId.trim())) {
      setError("Deck ID must be numeric only (found in the Quizlet deck URL).");
      return;
    }

    setError(null);
    const url = buildQuizletApiUrl(deckId.trim());

    try {
      // Try direct fetch first
      const response = await fetch(url);
      if (response.ok) {
        const jsonData = await response.json();
        setJsonText(JSON.stringify(jsonData, null, 2));
        setShowIframe(false);

        // Check if deck is private
        const studiableItems =
          jsonData.responses?.[0]?.models?.studiableItem || [];
        const hasCardSides = studiableItems.some(
          (item: any) => item.cardSides && item.cardSides.length > 0
        );
        setIsPrivate(!hasCardSides);

        return;
      }
    } catch (fetchErr) {
      console.log("Direct fetch failed, falling back to iframe:", fetchErr);
    }

    // Fallback to iframe
    setIframeUrl(url);
    setShowIframe(true);
  };

  /**
   * Reloads the iframe with the current URL.
   */
  const reloadIframe = () => {
    if (iframeUrl) {
      setIframeUrl("");
      setTimeout(() => setIframeUrl(iframeUrl), 100);
    }
  };

  /**
   * Validates and parses the provided JSON text.
   * @param jsonString - The JSON string to validate
   * @returns Parsed JSON data if valid
   * @throws Error if JSON is invalid or doesn't match expected structure
   */
  const validateAndParseJson = (jsonString: string) => {
    const data = JSON.parse(jsonString);
    if (!data.responses || !data.responses[0]?.models?.studiableItem) {
      throw new Error(
        "Invalid JSON format. Expected Quizlet API response with studiable items."
      );
    }
    return data;
  };

  /**
   * Transforms Quizlet studiable items to Quizspire deck format.
   * @param studiableItems - Array of Quizlet studiable items
   * @returns Quizspire-compatible deck data
   */
  const transformQuizletItemsToDeck = (studiableItems: any[]) => {
    const cards = studiableItems
      .filter((item) => item.cardSides && item.cardSides.length >= 2)
      .map((item) => {
        const wordSide = item.cardSides.find((side: any) => side.sideId === 1);
        const definitionSide = item.cardSides.find(
          (side: any) => side.sideId === 2
        );

        return {
          word: [
            {
              text: wordSide?.media?.[0]?.plainText || "",
              type: "text" as const,
            },
          ],
          definition: [
            {
              text: definitionSide?.media?.[0]?.plainText || "",
              type: "text" as const,
            },
          ],
        };
      });

    return {
      title: deckName || "Imported Quizlet Deck",
      description: deckDescription || `Imported from Quizlet deck ${deckId}`,
      thumbnail: deckThumbnail || "",
      cards: cards,
    };
  };

  /**
   * Imports the JSON data and creates decks in Quizspire.
   */
  const importData = async () => {
    if (!jsonText.trim()) {
      setError("Please paste the JSON response.");
      return;
    }

    setImporting(true);
    setError(null);

    try {
      const data = validateAndParseJson(jsonText);
      const studiableItems = data.responses[0].models.studiableItem || [];

      if (studiableItems.length === 0) {
        throw new Error(
          "No flashcards found in this deck. It may be private or empty."
        );
      }

      // Check for private deck
      const hasValidCards = studiableItems.some(
        (item) => item.cardSides && item.cardSides.length > 0
      );
      if (!hasValidCards) {
        throw new Error(
          "This appears to be a private deck. Private decks cannot be imported due to Quizlet restrictions. Make sure the deck is public and try again."
        );
      }

      const deckData = transformQuizletItemsToDeck(studiableItems);
      await api.quizspire.postQuizspireDecks(deckData);

      // Success animation and feedback
      const successMessage = `Successfully imported deck with ${deckData.cards.length} flashcards!`;
      alert(successMessage);

      // Add a brief delay for visual feedback before closing
      setTimeout(() => {
        onImportSuccess();
        onClose();
      }, 500);
    } catch (err) {
      console.error("Import failed:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to import data. Please check the JSON format."
      );
    } finally {
      setImporting(false);
    }
  };

  return (
    <div class="modal modal-open">
      <div class="modal-box max-w-7xl max-h-[95vh] overflow-y-auto bg-gradient-to-br from-base-100 to-base-200">
        <div class="flex items-center gap-3 mb-6">
          <div class="p-3 bg-primary/10 rounded-full">
            <FiDownload class="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 class="font-bold text-xl text-base-content">
              Import Quizlet Deck
            </h3>
            <p class="text-sm text-base-content/70">
              Import flashcards from a public Quizlet deck
            </p>
          </div>
        </div>

        <div class="space-y-6">
          {/* Instructions */}
          <div class="alert alert-info shadow-lg">
            <FiAlertTriangle class="w-5 h-5" />
            <div>
              <h4 class="font-bold">How to import a Quizlet flashcard deck:</h4>
              <ol class="list-decimal list-inside mt-2 space-y-1 text-sm">
                <li>Fill in the deck information in the form below</li>
                <li>
                  Find the numeric Quizlet deck ID from the deck URL (e.g.,
                  quizlet.com/<strong>48393</strong>/french-verbs - the number
                  only)
                </li>
                <li>Enter the deck ID and click "Load Data"</li>
                <li>
                  If direct loading fails, an iframe will appear - copy the JSON
                  text from it
                </li>
                <li>Paste the JSON in the text area and click "Import Deck"</li>
              </ol>
              <p class="mt-2 text-xs opacity-75">
                <strong>Note:</strong> Private decks cannot be imported due to
                Quizlet restrictions.
              </p>
            </div>
          </div>

          {/* Configuration Form - Table-like layout */}
          <div class="bg-base-100 rounded-xl shadow-lg p-6">
            <h4 class="font-semibold text-lg mb-4 flex items-center gap-2">
              <FiSettings class="w-5 h-5" />
              Deck Configuration
            </h4>

            <div class="overflow-x-auto">
              <table class="table table-zebra w-full">
                <thead>
                  <tr class="bg-base-200">
                    <th class="font-semibold">Field</th>
                    <th class="font-semibold">Value</th>
                    <th class="font-semibold w-32">Required</th>
                  </tr>
                </thead>
                <tbody>
                  <tr class="hover">
                    <td class="font-medium">
                      <div class="flex items-center gap-2">
                        <FiBookOpen class="w-4 h-4 text-primary" />
                        Deck Name
                      </div>
                    </td>
                    <td>
                      <input
                        type="text"
                        class={`input input-bordered input-sm w-full ${
                          !deckName.trim() ? "input-error" : "input-success"
                        }`}
                        placeholder="Enter deck name"
                        value={deckName}
                        onInput={(e) => setDeckName(e.currentTarget.value)}
                      />
                    </td>
                    <td>
                      <div class="badge badge-error gap-1">
                        <span class="text-xs">*</span>
                        Required
                      </div>
                    </td>
                  </tr>
                  <tr class="hover">
                    <td class="font-medium">
                      <div class="flex items-center gap-2">
                        <FiFileText class="w-4 h-4 text-secondary" />
                        Description
                      </div>
                    </td>
                    <td>
                      <input
                        type="text"
                        class="input input-bordered input-sm w-full"
                        placeholder="Optional description"
                        value={deckDescription}
                        onInput={(e) =>
                          setDeckDescription(e.currentTarget.value)
                        }
                      />
                    </td>
                    <td>
                      <div class="badge badge-ghost">Optional</div>
                    </td>
                  </tr>
                  <tr class="hover">
                    <td class="font-medium">
                      <div class="flex items-center gap-2">
                        <FiImage class="w-4 h-4 text-accent" />
                        Thumbnail URL
                      </div>
                    </td>
                    <td>
                      <input
                        type="url"
                        class="input input-bordered input-sm w-full"
                        placeholder="https://example.com/image.jpg"
                        value={deckThumbnail}
                        onInput={(e) => setDeckThumbnail(e.currentTarget.value)}
                      />
                    </td>
                    <td>
                      <div class="badge badge-ghost">Optional</div>
                    </td>
                  </tr>
                  <tr class="hover">
                    <td class="font-medium">
                      <div class="flex items-center gap-2">
                        <FiHash class="w-4 h-4 text-info" />
                        Quizlet Deck ID
                      </div>
                    </td>
                    <td>
                      <div class="join w-full">
                        <input
                          type="text"
                          class={`input input-bordered input-sm join-item flex-1 ${
                            !deckId.trim()
                              ? "input-error"
                              : /^\d+$/.test(deckId.trim())
                              ? "input-success"
                              : "input-warning"
                          }`}
                          placeholder="e.g., 48393"
                          value={deckId}
                          onInput={(e) => setDeckId(e.currentTarget.value)}
                        />
                        <button
                          class="btn btn-primary btn-sm join-item"
                          onClick={loadData}
                          disabled={
                            !deckId.trim() || !/^\d+$/.test(deckId.trim())
                          }
                        >
                          <FiDownload class="w-4 h-4 mr-1" />
                          Load Data
                        </button>
                      </div>
                    </td>
                    <td>
                      <div class="badge badge-error gap-1">
                        <span class="text-xs">*</span>
                        Required
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Private Deck Warning */}
          {isPrivate && (
            <div class="alert alert-warning shadow-lg animate-pulse">
              <FiLock class="w-5 h-5" />
              <div>
                <h4 class="font-bold">Private Deck Detected</h4>
                <p class="text-sm">
                  This appears to be a private Quizlet deck. Private decks
                  cannot be imported due to Quizlet restrictions. Make sure the
                  deck is public and try again.
                </p>
              </div>
            </div>
          )}

          {/* Iframe - only shown if direct fetch fails */}
          {showIframe && iframeUrl && (
            <div class="bg-base-100 rounded-xl shadow-lg p-6">
              <h4 class="font-semibold text-lg mb-4 flex items-center gap-2">
                <FiExternalLink class="w-5 h-5" />
                API Response
              </h4>

              <div class="alert alert-warning mb-4">
                <FiAlertTriangle class="w-4 h-4" />
                <div>
                  <p class="text-sm">
                    Direct loading failed. Copy the JSON text from the iframe
                    below.
                  </p>
                </div>
              </div>

              <div class="relative">
                <iframe
                  src={iframeUrl}
                  class="w-full h-64 border-2 border-dashed border-base-300 rounded-lg bg-base-50"
                  title="Quizlet API Data"
                />
                <button
                  class="btn btn-sm btn-outline absolute top-2 right-2 shadow-lg hover:scale-105 transition-transform"
                  onClick={reloadIframe}
                >
                  <FiRefreshCw class="w-4 h-4 mr-1" />
                  Reload
                </button>
              </div>
            </div>
          )}

          {/* JSON Textarea */}
          <div class="bg-base-100 rounded-xl shadow-lg p-6">
            <h4 class="font-semibold text-lg mb-4 flex items-center gap-2">
              <FiCode class="w-5 h-5" />
              JSON Data
            </h4>

            <div class="form-control">
              <div class="relative">
                <textarea
                  class={`textarea textarea-bordered h-40 font-mono text-sm transition-all duration-300 ${
                    jsonText
                      ? "textarea-success focus:textarea-success"
                      : "textarea-error"
                  }`}
                  placeholder='Paste the JSON starting with {"responses":[...'
                  value={jsonText}
                  onInput={(e) => setJsonText(e.currentTarget.value)}
                />
                <div class="absolute top-2 right-2 text-xs text-base-content/50 bg-base-200 px-2 py-1 rounded">
                  Required for import
                </div>
              </div>
              {jsonText && (
                <div class="label mt-2">
                  <span class="label-text-alt text-success flex items-center gap-1 animate-bounce">
                    <FiCheckCircle class="w-4 h-4" />
                    JSON loaded successfully
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div class="alert alert-error shadow-lg animate-fade-in">
              <FiXCircle class="w-5 h-5" />
              <div>
                <h4 class="font-bold">Import Error</h4>
                <p class="text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div class="modal-action justify-between">
            <button
              type="button"
              class="btn btn-ghost"
              onClick={onClose}
              disabled={importing}
            >
              <FiX class="w-4 h-4 mr-2" />
              Cancel
            </button>
            <div class="flex gap-3">
              {!deckName.trim() && (
                <div class="text-sm text-error flex items-center gap-1">
                  <FiAlertTriangle class="w-4 h-4" />
                  Deck name required
                </div>
              )}
              {!jsonText.trim() && (
                <div class="text-sm text-error flex items-center gap-1">
                  <FiAlertTriangle class="w-4 h-4" />
                  JSON data required
                </div>
              )}
              <button
                type="button"
                class={`btn btn-primary btn-lg transition-all duration-300 ${
                  deckName.trim() && jsonText.trim() && !isPrivate
                    ? "hover:scale-105 shadow-lg"
                    : "btn-disabled"
                }`}
                onClick={importData}
                disabled={
                  !deckName.trim() || !jsonText.trim() || importing || isPrivate
                }
              >
                {importing ? (
                  <>
                    <span class="loading loading-spinner loading-sm"></span>
                    <span class="animate-pulse">Importing...</span>
                  </>
                ) : (
                  <>
                    <FiDownload class="w-5 h-5 mr-2" />
                    Import Deck
                    <FiArrowRight class="w-4 h-4 ml-2" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
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
