import { useEffect, useState } from "preact/hooks";
import { useLocation } from "preact-iso";
import { api } from "../../../api/client";
import { FiShuffle, FiCheck, FiX, FiRotateCcw, FiHome } from "react-icons/fi";
import { FlashcardDeckSchema } from "../../../api/api";
import { Helmet } from "react-helmet";

type Deck = FlashcardDeckSchema;

interface GameCard {
  id: string;
  type: "question" | "answer";
  content: string;
  cardId: string;
  isFlipped: boolean;
  isMatched: boolean;
  isAnimating: boolean;
}

interface GameStats {
  attempts: number;
  correctMatches: number;
  startTime: number;
  endTime?: number;
  completionTime?: number;
}

/**
 * Matching game component for flashcard decks.
 * Players match question cards with their corresponding answer cards.
 */
export function QuizspireMatch({ deckId }: { deckId: string }) {
  const { route, query } = useLocation();

  // Game state
  const [deck, setDeck] = useState<Deck | null>(null);
  const [cards, setCards] = useState<GameCard[]>([]);
  const [flippedCards, setFlippedCards] = useState<GameCard[]>([]);
  const [matchedPairs, setMatchedPairs] = useState<Set<string>>(new Set());
  const [gameStats, setGameStats] = useState<GameStats>({
    attempts: 0,
    correctMatches: 0,
    startTime: Date.now(),
  });
  const [gameCompleted, setGameCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load deck data
  useEffect(() => {
    if (!deckId) {
      setError("No deck ID provided");
      setLoading(false);
      return;
    }

    const loadDeck = async () => {
      try {
        const response = await api.quizspire.getQuizspireDecksById(deckId);
        setDeck(response.data);
        initializeGame(response.data);
      } catch (err) {
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

    loadDeck();
  }, [deckId]);

  /**
   * Initialize the matching game with shuffled cards
   */
  const initializeGame = (deckData: Deck) => {
    const gameCards: GameCard[] = [];
    const usedCards = Math.min(deckData.cards.length, 8); // Max 8 pairs (16 cards) for 4x4 grid

    // Create question and answer cards
    for (let i = 0; i < usedCards; i++) {
      const card = deckData.cards[i];

      // Question card
      gameCards.push({
        id: `q-${i}`,
        type: "question",
        content: card.word.find((w) => w.type === "text")?.text || "Question",
        cardId: `card-${i}`,
        isFlipped: false,
        isMatched: false,
        isAnimating: false,
      });

      // Answer card
      gameCards.push({
        id: `a-${i}`,
        type: "answer",
        content:
          card.definition.find((d) => d.type === "text")?.text || "Answer",
        cardId: `card-${i}`,
        isFlipped: false,
        isMatched: false,
        isAnimating: false,
      });
    }

    // Shuffle cards
    const shuffledCards = gameCards.sort(() => Math.random() - 0.5);
    setCards(shuffledCards);
    setGameStats({
      attempts: 0,
      correctMatches: 0,
      startTime: Date.now(),
    });
  };

  /**
   * Handle card click for matching logic
   */
  const handleCardClick = (clickedCard: GameCard) => {
    if (
      clickedCard.isFlipped ||
      clickedCard.isMatched ||
      flippedCards.length >= 2
    ) {
      return;
    }

    const newFlippedCards = [...flippedCards, clickedCard];

    // Update card state to show as flipped
    setCards((prevCards) =>
      prevCards.map((card) =>
        card.id === clickedCard.id
          ? { ...card, isFlipped: true, isAnimating: true }
          : card
      )
    );

    setFlippedCards(newFlippedCards);

    // Check for match when two cards are flipped
    if (newFlippedCards.length === 2) {
      const [firstCard, secondCard] = newFlippedCards;
      const isMatch = firstCard.cardId === secondCard.cardId;

      setGameStats((prev) => ({
        ...prev,
        attempts: prev.attempts + 1,
        correctMatches: isMatch ? prev.correctMatches + 1 : prev.correctMatches,
      }));

      setTimeout(() => {
        if (isMatch) {
          // Mark cards as matched
          setCards((prevCards) =>
            prevCards.map((card) =>
              card.id === firstCard.id || card.id === secondCard.id
                ? { ...card, isMatched: true, isAnimating: false }
                : card
            )
          );
          setMatchedPairs((prev) => new Set([...prev, firstCard.cardId]));
        } else {
          // Flip cards back
          setCards((prevCards) =>
            prevCards.map((card) =>
              card.id === firstCard.id || card.id === secondCard.id
                ? { ...card, isFlipped: false, isAnimating: false }
                : card
            )
          );
        }
        setFlippedCards([]);
      }, 1000);
    } else {
      // Remove animation class after flip animation
      setTimeout(() => {
        setCards((prevCards) =>
          prevCards.map((card) =>
            card.id === clickedCard.id ? { ...card, isAnimating: false } : card
          )
        );
      }, 300);
    }
  };

  /**
   * Check if game is completed
   */
  useEffect(() => {
    const totalPairs = cards.length / 2;
    if (matchedPairs.size === totalPairs && totalPairs > 0 && !gameCompleted) {
      const endTime = Date.now();
      const completionTime = endTime - gameStats.startTime;

      const finalStats = {
        ...gameStats,
        endTime,
        completionTime,
      };

      setGameStats(finalStats);
      setGameCompleted(true);

      // Save stats to localStorage
      saveGameStats(finalStats);
    }
  }, [matchedPairs, cards.length, gameStats, gameCompleted]);

  /**
   * Save game statistics to localStorage
   */
  const saveGameStats = (stats: GameStats) => {
    if (!deckId) return;

    const storageKey = `quizspire-match-${deckId}`;
    const existingStats = JSON.parse(localStorage.getItem(storageKey) || "[]");

    const gameResult = {
      date: new Date().toISOString(),
      attempts: stats.attempts,
      completionTime: stats.completionTime,
      accuracy: (stats.correctMatches / (stats.attempts || 1)) * 100,
    };

    existingStats.push(gameResult);
    localStorage.setItem(storageKey, JSON.stringify(existingStats));
  };

  /**
   * Restart the game
   */
  const restartGame = () => {
    if (deck) {
      setGameCompleted(false);
      setMatchedPairs(new Set());
      setFlippedCards([]);
      initializeGame(deck);
    }
  };

  /**
   * Format time display
   */
  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
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

  if (error || !deck) {
    return (
      <div class="container mx-auto px-4 py-8">
        <div class="alert alert-error">
          <span>{error || "Deck not found"}</span>
        </div>
      </div>
    );
  }

  // Calculate grid dimensions based on card count
  const totalCards = cards.length;
  const gridCols = Math.min(4, Math.ceil(Math.sqrt(totalCards)));
  const gridRows = Math.ceil(totalCards / gridCols);

  if (gameCompleted) {
    // Show completion screen
    const accuracy = Math.round(
      (gameStats.correctMatches / gameStats.attempts) * 100
    );

    return (
      <div class="container mx-auto px-4 py-8">
        <div class="max-w-2xl mx-auto">
          <div class="card bg-base-100 shadow-2xl">
            <div class="card-body text-center">
              <div class="text-6xl mb-4">🎉</div>
              <h2 class="card-title justify-center text-3xl mb-6">
                Congratulations!
              </h2>
              <p class="text-lg mb-6">You've completed the matching game!</p>

              <div class="stats stats-vertical lg:stats-horizontal shadow mb-6">
                <div class="stat">
                  <div class="stat-title">Completion Time</div>
                  <div class="stat-value text-primary">
                    {formatTime(gameStats.completionTime || 0)}
                  </div>
                </div>
                <div class="stat">
                  <div class="stat-title">Attempts</div>
                  <div class="stat-value text-secondary">
                    {gameStats.attempts}
                  </div>
                </div>
                <div class="stat">
                  <div class="stat-title">Accuracy</div>
                  <div class="stat-value text-accent">{accuracy}%</div>
                </div>
              </div>

              <div class="card-actions justify-center gap-4">
                <button class="btn btn-primary btn-lg" onClick={restartGame}>
                  <FiRotateCcw class="w-5 h-5 mr-2" />
                  Play Again
                </button>
                <button
                  class="btn btn-outline btn-lg"
                  onClick={() =>
                    route(
                      (query.referrer && decodeURIComponent(query.referrer)) ||
                        `/projects/quizspire/${deckId}`
                    )
                  }
                >
                  <FiHome class="w-5 h-5 mr-2" />
                  Back
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Quizspire Match - Memory Game</title>
        <meta
          name="description"
          content="Play Quizspire's matching game to memorize flashcards. Match question cards with their corresponding answer cards in this interactive memory challenge."
        />
        <meta
          name="keywords"
          content="quizspire match, memory game, flashcards matching, memorization game, concentration game"
        />
        <link rel="canonical" href={`/projects/quizspire/${deckId}/match`} />
        <meta property="og:title" content="Quizspire Match - Memory Game" />
        <meta
          property="og:description"
          content="Play Quizspire's matching game to memorize flashcards. Match question cards with their corresponding answer cards in this interactive memory challenge."
        />
        <meta property="og:image" content="/quizspire.png" />
        <meta
          property="og:url"
          content={`/projects/quizspire/${deckId}/match`}
        />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Quizspire Match - Memory Game" />
        <meta
          name="twitter:description"
          content="Play Quizspire's matching game to memorize flashcards. Match question cards with their corresponding answer cards in this interactive memory challenge."
        />
        <meta name="twitter:image" content="/quizspire.png" />
      </Helmet>
      <div class="container mx-auto px-4 py-8">
        <div class="mb-6">
          <h1 class="text-3xl font-bold mb-2">{deck.title} - Match Game</h1>
          <p class="text-base-content/70">
            Match the questions with their answers!
          </p>
        </div>

        {/* Game Stats */}
        <div class="flex justify-center mb-6">
          <div class="stats stats-horizontal shadow">
            <div class="stat">
              <div class="stat-title">Attempts</div>
              <div class="stat-value">{gameStats.attempts}</div>
            </div>
            <div class="stat">
              <div class="stat-title">Matches</div>
              <div class="stat-value text-success">
                {matchedPairs.size}/{cards.length / 2}
              </div>
            </div>
            <div class="stat">
              <div class="stat-title">Time</div>
              <div class="stat-value countdown">
                <span
                  style={`--value:${Math.floor(
                    (Date.now() - gameStats.startTime) / 1000
                  )};`}
                >
                  {Math.floor((Date.now() - gameStats.startTime) / 1000)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Game Grid */}
        <div
          class="grid gap-4 mx-auto"
          style={`grid-template-columns: repeat(${gridCols}, minmax(0, 1fr)); grid-template-rows: repeat(${gridRows}, minmax(0, 1fr))`}
        >
          {cards.map((card) => (
            <div
              key={card.id}
              class={`card bg-base-100 shadow cursor-pointer transition-all duration-300 ${
                card.isMatched
                  ? "bg-success/20 border-success"
                  : card.isFlipped
                  ? "bg-primary/20 border-primary"
                  : "hover:bg-base-200"
              } ${card.isAnimating ? "animate-pulse" : ""}`}
              onClick={() => handleCardClick(card)}
            >
              <div class="card-body p-4 min-h-[120px] flex items-center justify-center">
                <div
                  class={`text-center transition-all duration-500 ${
                    card.isFlipped || card.isMatched
                      ? "opacity-100"
                      : "opacity-0"
                  }`}
                >
                  <div
                    class={`badge badge-outline mb-2 ${
                      card.type === "question"
                        ? "badge-primary"
                        : "badge-secondary"
                    }`}
                  >
                    {card.type === "question" ? "Question" : "Answer"}
                  </div>
                  <div class="text-sm font-medium break-words">
                    {card.content}
                  </div>
                </div>

                {/* Card back */}
                <div
                  class={`absolute inset-0 flex items-center justify-center transition-all duration-500 ${
                    card.isFlipped || card.isMatched
                      ? "opacity-0 rotate-y-180"
                      : "opacity-100"
                  }`}
                >
                  <div class="text-4xl opacity-50">
                    {card.type === "question" ? "❓" : "💡"}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div class="flex justify-center gap-4 mt-8">
          <button class="btn btn-outline" onClick={restartGame}>
            <FiRotateCcw class="w-4 h-4 mr-2" />
            Restart
          </button>
          <button
            class="btn btn-ghost"
            onClick={() =>
              route(
                (query.referrer && decodeURIComponent(query.referrer)) ||
                  `/projects/quizspire/${deckId}`
              )
            }
          >
            <FiHome class="w-4 h-4 mr-2" />
            Back
          </button>
        </div>
      </div>
    </>
  );
}
