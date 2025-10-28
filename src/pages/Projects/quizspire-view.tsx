import { useEffect, useRef, useState } from "preact/hooks";
import { useLocation } from "preact-iso";
import { FlashcardDeckSchema, User } from "../../api/api";
import { api } from "../../api/client";
import {
  FiChevronLeft,
  FiChevronRight,
  FiRotateCcw,
  FiEdit3,
  FiShare2,
  FiArrowLeft,
  FiBookOpen,
  FiPlay,
  FiTarget,
  FiGrid,
  FiZap,
  FiShuffle,
  FiMaximize,
  FiMinimize,
  FiCopy,
} from "react-icons/fi";
import { FaArrowsUpDown } from "react-icons/fa6";
import { getApiImageUrl } from "../../components/ProfilePicture";
import { ProfilePicture } from "../../components/ProfilePicture";
import { DeckModal } from "./quizspire";
import {
  fetchDeck,
  fetchUserProfile,
  fetchCurrentUser,
  reverseCards,
} from "../../utils/quizspire";

/**
 * Full-screen flashcard viewer component for Quizspire.
 * Displays a specific deck with navigation, flip functionality, and metadata.
 */
export function QuizspireView({ id }: { id: string }) {
  const { route, url } = useLocation();
  const [deck, setDeck] = useState<FlashcardDeckSchema | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [isCardFullscreen, setIsCardFullscreen] = useState(false);
  const [isBrowserFullscreen, setIsBrowserFullscreen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  /**
   * Loads the deck data by ID from the API.
   */
  const loadDeck = async () => {
    if (!id) {
      setError("Invalid deck ID");
      setLoading(false);
      return;
    }
    try {
      const deckData = await fetchDeck(id);
      setDeck(deckData);
      // Fetch user information
      if (deckData.userId) {
        try {
          const userData = await fetchUserProfile(deckData.userId);
          setUser(userData);
          const currentUserData = await fetchCurrentUser();
          setCurrentUser(currentUserData);
        } catch (userErr) {
          console.error("Failed to fetch user profile:", userErr);
        }
      }
    } catch (err: any) {
      if (err.status === 401) {
        route("/login");
        return;
      }
      setError("Failed to load deck");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDeck();
    // Check URL for fullscreen parameter
    const urlParams = new URLSearchParams(window.location.search);
    setIsCardFullscreen(urlParams.get("fullscreen") === "true");
  }, [id]);

  /**
   * Handles keyboard shortcuts for navigation and flip.
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!deck) return;

      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          goToPreviousCard();
          break;
        case "ArrowRight":
          e.preventDefault();
          goToNextCard();
          break;
        case " ":
          e.preventDefault();
          toggleFlip();
          break;
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [deck, currentCardIndex, isFlipped]);

  /**
   * Navigates to the previous card.
   */
  const goToPreviousCard = () => {
    if (!deck) return;
    setCurrentCardIndex((prev) =>
      prev > 0 ? prev - 1 : deck.cards.length - 1
    );
    setIsFlipped(false);
  };

  /**
   * Navigates to the next card.
   */
  const goToNextCard = () => {
    if (!deck) return;
    setCurrentCardIndex((prev) =>
      prev < deck.cards.length - 1 ? prev + 1 : 0
    );
    setIsFlipped(false);
  };

  /**
   * Toggles the flip state of the current card.
   */
  const toggleFlip = () => {
    setIsFlipped((prev) => !prev);
  };

  /**
   * Toggles the card full-screen mode.
   */
  const toggleCardFullscreen = () => {
    setIsCardFullscreen((prev) => !prev);
  };

  /**
   * Toggles the browser full-screen mode.
   */
  const toggleBrowserFullscreen = async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
      setIsBrowserFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsBrowserFullscreen(false);
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsBrowserFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  /**
   * Handles deck update after editing.
   */
  const handleUpdateDeck = async (
    deckId: string,
    deckData: Partial<FlashcardDeckSchema>
  ) => {
    try {
      await api.quizspire.putQuizspireDecksById(deckId, deckData);
      setShowEditModal(false);
      loadDeck(); // Refresh the deck data
    } catch (err) {
      console.error("Failed to update deck:", err);
      setError("Failed to update deck");
    }
  };

  /**
   * Reverses the Q&A for each card in the deck by swapping word and definition.
   */
  const reverseQuestionsAnswers = async () => {
    if (!deck || !currentUser || currentUser.id !== user?.id) return;

    try {
      const reversedDeck = reverseCards(deck);
      await handleUpdateDeck(deck._id, { cards: reversedDeck.cards });
    } catch (err) {
      console.error("Failed to reverse Q&A:", err);
      setError("Failed to reverse Q&A");
    }
  };

  /**
   * Copies the deck to the user's collection.
   */
  const copyDeckToCollection = async () => {
    if (!deck || !currentUser) return;

    try {
      const copiedDeck = {
        ...deck,
        title: `${deck.title} (Copy)`,
        userId: currentUser.id,
        _id: undefined, // Remove original ID
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const response = await api.quizspire.postQuizspireDecks(copiedDeck);
      setShowCopyModal(false);
      route(`/projects/quizspire/${response.data._id}`);
    } catch (err) {
      console.error("Failed to copy deck:", err);
      setError("Failed to copy deck to collection");
    }
  };

  /**
   * Copies the current URL to clipboard for sharing.
   */
  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      // Show visual feedback
      const shareBtn = document.querySelector(
        '.btn-outline[aria-label="Share deck"]'
      );
      if (shareBtn) {
        shareBtn.classList.add("btn-success");
        shareBtn.textContent = "Copied!";
        setTimeout(() => {
          shareBtn.classList.remove("btn-success");
          shareBtn.innerHTML =
            '<svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"></path></svg>Share';
        }, 2000);
      }
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  if (loading) {
    return (
      <div class="h-full bg-base-100 flex items-center justify-center">
        <div class="text-center">
          <span class="loading loading-spinner loading-lg"></span>
          <p class="mt-4 text-base-content/70">Loading deck...</p>
        </div>
      </div>
    );
  }

  if (error || !deck) {
    return (
      <div class="h-full bg-base-100 flex items-center justify-center">
        <div class="text-center">
          <div class="alert alert-error max-w-md">
            <span>{error || "Deck not found"}</span>
          </div>
          <button
            class="btn btn-primary mt-4"
            onClick={() => route("/projects/quizspire")}
          >
            <FiArrowLeft class="w-4 h-4 mr-2" />
            Back to Quizspire
          </button>
        </div>
      </div>
    );
  }

  if (deck.cards.length === 0) {
    return (
      <div class="h-full bg-base-100 flex items-center justify-center">
        <div class="text-center">
          <div class="alert alert-warning max-w-md">
            <span>This deck has no cards</span>
          </div>
          <button
            class="btn btn-primary mt-4"
            onClick={() => route("/projects/quizspire")}
          >
            <FiArrowLeft class="w-4 h-4 mr-2" />
            Back to Quizspire
          </button>
        </div>
      </div>
    );
  }

  const currentCard = deck.cards[currentCardIndex];
  const frontContent = currentCard.word;
  const backContent = currentCard.definition;

  return (
    <div class="h-full bg-base-100">
      {/* Header with metadata */}
      <div class="bg-base-200 border-b border-base-300 px-4 py-3 w-full">
        <div class="navbar w-full min-h-0">
          <div class="navbar-start">
            <div class="flex items-center gap-4">
              <button
                class="btn btn-ghost btn-sm"
                onClick={() => route("/projects/quizspire")}
                aria-label="Back to Quizspire"
              >
                <FiArrowLeft class="w-4 h-4" />
              </button>
              <div>
                <h1 class="text-xl font-bold">{deck.title}</h1>
                <p class="text-sm text-base-content/70">{deck.description}</p>
              </div>
              <div>
                <span class="text-xs text-base-content/50">
                  Created: {new Date(deck.createdAt).toLocaleDateString()} •{" "}
                  {deck.cards.length} cards
                </span>
              </div>
            </div>
          </div>
          <div class="navbar-center">
            {user && (
              <a
                href={`/profile/${user.id}`}
                class="flex items-center gap-2 link link-hover text-lg"
              >
                <ProfilePicture
                  name={user.name}
                  image={user.image || ""}
                  widthClass="w-8"
                />
                <span>{user.name}</span>
              </a>
            )}
          </div>
          <div class="flex gap-2 navbar-end">
            <button
              class="btn btn-outline btn-sm"
              onClick={handleShare}
              aria-label="Share deck"
            >
              <FiShare2 class="w-4 h-4 mr-1" />
              Share
            </button>
            {currentUser?.id === user?.id && (
              <button
                class="btn btn-accent btn-sm"
                onClick={reverseQuestionsAnswers}
                aria-label="Reverse Q&A"
              >
                <FaArrowsUpDown class="w-4 h-4 mr-1" />
                Reverse Q&A
              </button>
            )}
            {currentUser && currentUser.id !== user.id ? (
              <button
                class="btn btn-primary btn-sm"
                onClick={() => setShowCopyModal(true)}
                aria-label="Add to collection"
              >
                <FiCopy class="w-4 h-4 mr-1" />
                Add to Collection
              </button>
            ) : currentUser?.id === user.id ? (
              <button
                class="btn btn-primary btn-sm"
                onClick={() => setShowEditModal(true)}
                aria-label="Edit deck"
              >
                <FiEdit3 class="w-4 h-4 mr-1" />
                Edit
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div
        class={`flex flex-col items-center ${
          isBrowserFullscreen ? "pt-8" : "pt-4"
        } h-[95%]`}
      >
        {/* Card counter - don't hide in fullscreen */}
        {/* {!isCardFullscreen && ( */}
        <div class="mb-4 text-base-content/70">
          {currentCardIndex + 1} / {deck.cards.length}
        </div>
        {/* )} */}

        {/* Card titles outside - hide in fullscreen */}
        {!isCardFullscreen && (
          <div class="mb-4 text-center">
            <h3 class="text-lg font-semibold text-base-content/80">
              {isFlipped ? "Definition/Answer" : "Word/Question"}
            </h3>
          </div>
        )}

        {/* Quiz buttons - hide in fullscreen */}
        {!isCardFullscreen && (
          <div class="mb-8 w-full max-w-4xl">
            <div class="grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-2 w-full">
              <button
                class={`btn btn-sm ${
                  isCardFullscreen ? "btn-primary" : "btn-info"
                }`}
                onClick={toggleCardFullscreen}
              >
                <FiBookOpen class="w-4 h-4 mr-1" />
                Flashcards
              </button>
              <button
                class="btn btn-info btn-sm"
                onClick={() => {
                  const targetUrl = `/projects/quizspire/${
                    deck._id
                  }/learn?referrer=${encodeURIComponent(url)}`;

                  route(targetUrl);
                }}
              >
                <FiPlay class="w-4 h-4 mr-1" />
                Learn
              </button>
              <button
                class="btn btn-info btn-sm"
                onClick={() => route(`/projects/quizspire/${deck._id}/test`)}
              >
                <FiTarget class="w-4 h-4 mr-1" />
                Test
              </button>
              <button class="btn btn-info btn-sm">
                <FiGrid class="w-4 h-4 mr-1" />
                Blocks
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
        )}

        {/* Flashcard */}
        <div
          ref={cardRef}
          class={`w-full ${
            isCardFullscreen
              ? "max-w-[90%] h-[75%] min-h-128"
              : "max-w-4xl h-128"
          } cursor-pointer transition-transform duration-300 hover:scale-105 focus:outline focus:outline-primary`}
          onClick={toggleFlip}
          role="button"
          tabIndex={0}
          aria-label={`Flashcard ${
            currentCardIndex + 1
          }. Click or press space to flip.`}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              toggleFlip();
            }
          }}
        >
          <div
            class={`card bg-base-100 shadow h-full transition-transform duration-500 ${
              isFlipped ? "rotate-y-180" : ""
            }`}
            style={{
              transformStyle: "preserve-3d",
            }}
          >
            {/* Front side */}
            <div
              class={`card-body absolute inset-0 backface-hidden ${
                isFlipped ? "opacity-0" : "opacity-100"
              } transition-opacity duration-250`}
            >
              <div class="h-full flex items-center justify-center">
                <div
                  class={`grid gap-2 w-full h-full max-h-full ${
                    frontContent.length === 1
                      ? "grid-cols-1 grid-rows-1"
                      : frontContent.length === 2
                      ? "grid-cols-1 grid-rows-2 sm:grid-cols-2 sm:grid-rows-1"
                      : frontContent.length === 3
                      ? "grid-cols-2 grid-rows-2"
                      : frontContent.length === 4
                      ? "grid-cols-2 grid-rows-2"
                      : "grid-cols-3 grid-rows-2"
                  }`}
                >
                  {frontContent.map((item, index) => (
                    <div
                      key={index}
                      class={`flex items-center justify-center p-2 ${
                        frontContent.length === 1
                          ? "col-span-1 row-span-1"
                          : frontContent.length === 2
                          ? "col-span-1 row-span-1"
                          : frontContent.length === 3 && index === 0
                          ? "col-span-2 row-span-1"
                          : "col-span-1 row-span-1"
                      }`}
                    >
                      {item.type === "text" ? (
                        <p class="text-lg text-center break-words">
                          {item.text}
                        </p>
                      ) : (
                        <img
                          src={getApiImageUrl(item.mediaUrl)}
                          alt="Word media"
                          class="w-full h-full max-w-full max-h-full object-contain rounded"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Back side */}
            <div
              class={`card-body absolute inset-0 backface-hidden rotate-y-180 ${
                isFlipped ? "opacity-100" : "opacity-0"
              } transition-opacity duration-250`}
            >
              <div class="h-full flex items-center justify-center">
                <div
                  class={`grid gap-2 w-full h-full max-h-full ${
                    backContent.length === 1
                      ? "grid-cols-1 grid-rows-1"
                      : backContent.length === 2
                      ? "grid-cols-1 grid-rows-2 sm:grid-cols-2 sm:grid-rows-1"
                      : backContent.length === 3
                      ? "grid-cols-2 grid-rows-2"
                      : backContent.length === 4
                      ? "grid-cols-2 grid-rows-2"
                      : "grid-cols-3 grid-rows-2"
                  }`}
                >
                  {backContent.map((item, index) => (
                    <div
                      key={index}
                      class={`flex items-center justify-center p-2 ${
                        backContent.length === 1
                          ? "col-span-1 row-span-1"
                          : backContent.length === 2
                          ? "col-span-1 row-span-1"
                          : backContent.length === 3 && index === 0
                          ? "col-span-2 row-span-1"
                          : "col-span-1 row-span-1"
                      }`}
                    >
                      {item.type === "text" ? (
                        <p class="text-lg text-center break-words">
                          {item.text}
                        </p>
                      ) : (
                        <img
                          src={getApiImageUrl(item.mediaUrl)}
                          alt="Definition media"
                          class="w-full h-full max-w-full max-h-full object-contain rounded"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div
          className={`relative h-16 flex items-center w-full ${
            isCardFullscreen ? "max-w-[90%]" : "max-w-4xl"
          } mt-8`}
        >
          {/* Centered middle buttons - perfectlycentered regardless of sides */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transform flex space-x-4">
            <button
              className="btn btn-outline btn-lg"
              onClick={goToPreviousCard}
              disabled={deck.cards.length <= 1}
              aria-label="Previous card"
            >
              <FiChevronLeft className="w-6 h-6" />
            </button>
            <button
              className="btn btn-primary btn-lg"
              onClick={toggleFlip}
              aria-label="Flip card"
            >
              <FiRotateCcw className="w-6 h-6 mr-2" />
              Flip
            </button>
            <button
              className="btn btn-outline btn-lg"
              onClick={goToNextCard}
              disabled={deck.cards.length <= 1}
              aria-label="Next card"
            >
              <FiChevronRight className="w-6 h-6" />
            </button>
          </div>

          {/* Right-aligned fullscreen button */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 transform">
            {/* Card Fullscreen Toggle */}
            <button
              className="btn btn-outline btn-lg"
              onClick={toggleCardFullscreen}
              aria-label={
                isCardFullscreen
                  ? "Exit card fullscreen"
                  : "Enter card fullscreen"
              }
            >
              {isCardFullscreen ? (
                <FiMinimize className="w-6 h-6" />
              ) : (
                <FiMaximize className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Keyboard shortcuts hint */}
        <div class="mt-4 text-sm text-base-content/50 text-center">
          Use arrow keys to navigate, spacebar to flip, escape to go back
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <DeckModal
          deck={deck}
          onSave={(deckData) => {
            if (deck._id) {
              handleUpdateDeck(deck._id, deckData);
            }
          }}
          onClose={() => setShowEditModal(false)}
        />
      )}

      {/* Copy Modal */}
      {showCopyModal && (
        <dialog className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Add to Collection</h3>
            <p className="py-4">
              Are you sure you want to add this deck to your collection? This
              will create a copy of the deck in your account.
            </p>
            <div className="alert alert-warning">
              <span>
                ⚠️ Note: Images in the deck will still be managed by {user.name}
                : they cannot edit the images, but they can delete them.
              </span>
            </div>
            <div className="modal-action">
              <button className="btn" onClick={() => setShowCopyModal(false)}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={copyDeckToCollection}
              >
                Add to Collection
              </button>
            </div>
          </div>
        </dialog>
      )}
    </div>
  );
}
