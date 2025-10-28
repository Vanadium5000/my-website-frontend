import { useEffect, useState } from "preact/hooks";
import { useLocation } from "preact-iso";
import { FlashcardDeckSchema } from "../../api/api";
import { api } from "../../api/client";
import { Tetris } from "./tetris";
import { FiArrowLeft, FiCheck, FiX } from "react-icons/fi";

/**
 * Quizspire Tetris component that integrates flashcard questions into the Tetris gameplay.
 * Shows multiple choice questions every 5 piece drops, requiring correct answers to continue.
 */
export function QuizspireTetris({ id }: { id: string }) {
  const { route, query } = useLocation();
  const [deck, setDeck] = useState<FlashcardDeckSchema | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showQuestion, setShowQuestion] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [questionFeedback, setQuestionFeedback] = useState<{
    correct: boolean;
    show: boolean;
  }>({ correct: false, show: false });
  const [resolveCallback, setResolveCallback] = useState<(() => void) | null>(
    null
  );
  const [dropCount, setDropCount] = useState(0);

  /**
   * Fetches the flashcard deck data.
   */
  const fetchDeck = async () => {
    try {
      const response = await api.quizspire.getQuizspireDecksById(id);
      setDeck(response.data);
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
    fetchDeck();
  }, [id]);

  /**
   * Generates a random multiple choice question from the deck.
   */
  const generateQuestion = () => {
    if (!deck || deck.cards.length === 0) return null;

    const randomCard =
      deck.cards[Math.floor(Math.random() * deck.cards.length)];
    const correctAnswer =
      randomCard.definition.find((d) => d.type === "text")?.text || "";
    const question = randomCard.word.find((w) => w.type === "text")?.text || "";

    // Generate 3 incorrect answers from other cards
    const incorrectAnswers = deck.cards
      .filter((card) => card !== randomCard)
      .map((card) => card.definition.find((d) => d.type === "text")?.text || "")
      .filter((answer) => answer && answer !== correctAnswer)
      .slice(0, 3);

    // If we don't have enough incorrect answers, add some generic ones
    while (incorrectAnswers.length < 3) {
      incorrectAnswers.push(`Option ${incorrectAnswers.length + 1}`);
    }

    // Shuffle all answers
    const allAnswers = [correctAnswer, ...incorrectAnswers].sort(
      () => Math.random() - 0.5
    );

    return {
      question,
      answers: allAnswers,
      correctAnswer,
    };
  };

  /**
   * Shows feedback animation for the answer.
   */
  const showFeedback = (correct: boolean) => {
    setQuestionFeedback({ correct, show: true });
    setTimeout(() => {
      setQuestionFeedback({ correct: false, show: false });
      if (correct) {
        // Correct answer - resolve promise and continue game
        setShowQuestion(false);
        if (resolveCallback) {
          resolveCallback();
          setResolveCallback(null);
        }
      } else {
        // Wrong answer - generate new question and keep modal open
        const newQuestion = generateQuestion();
        if (newQuestion) {
          setCurrentQuestion(newQuestion);
          // Modal stays open for new question - don't call setShowQuestion(false)
        } else {
          // No more questions available - resolve and continue
          setShowQuestion(false);
          if (resolveCallback) {
            resolveCallback();
            setResolveCallback(null);
          }
        }
      }
    }, 1500);
  };

  /**
   * Handles answer selection.
   */
  const handleAnswer = (selectedAnswer: string) => {
    const correct = selectedAnswer === currentQuestion.correctAnswer;
    showFeedback(correct);
  };

  /**
   * Intermediate callback for Tetris game - called every piece drop.
   * Shows a question every 5 drops and waits for correct answer.
   */
  const intermediateCallback = async (): Promise<void> => {
    return new Promise((resolve) => {
      setDropCount((prev) => {
        const newCount = prev + 1;
        // Show question every 5 drops
        if (newCount % 5 === 0) {
          const question = generateQuestion();
          if (question) {
            setCurrentQuestion(question);
            setShowQuestion(true);
            setResolveCallback(() => resolve);
            return newCount; // Don't reset count
          }
        }
        // No question shown, continue immediately
        resolve();
        return newCount;
      });
    });
  };

  if (loading) {
    return (
      <div class="h-full bg-base-100 flex items-center justify-center">
        <div class="text-center">
          <span class="loading loading-spinner loading-lg"></span>
          <p class="mt-4 text-base-content/70">Loading Tetris Quiz...</p>
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
            onClick={() => route(query.referrer || "/projects/quizspire")}
          >
            <FiArrowLeft class="w-4 h-4 mr-2" />
            Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div class="h-full bg-base-100 relative">
      {/* Header */}
      <div class="bg-base-200 border-b border-base-300 px-4 py-3">
        <div class="navbar w-full min-h-0">
          <div class="navbar-start">
            <button
              class="btn btn-ghost btn-sm"
              onClick={() => route(query.referrer || "/projects/quizspire")}
              aria-label="Back"
            >
              <FiArrowLeft class="w-4 h-4" />
            </button>
            <div class="ml-4">
              <h1 class="text-xl font-bold">{deck.title} - Tetris Quiz</h1>
              <p class="text-sm text-base-content/70">
                Answer questions correctly to keep playing!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tetris Game */}
      <div class="h-[calc(100%-4rem)]">
        <Tetris intermediateCallback={intermediateCallback} />
      </div>

      {/* Question Modal */}
      {showQuestion && currentQuestion && (
        <div class="modal modal-open">
          <div class="modal-box max-w-md">
            <h3 class="font-bold text-lg mb-4">Quiz Question!</h3>
            <p class="text-lg mb-6">{currentQuestion.question}</p>

            <div class="space-y-3">
              {currentQuestion.answers.map((answer: string, index: number) => (
                <button
                  key={index}
                  class="btn btn-outline w-full text-left justify-start"
                  onClick={() => handleAnswer(answer)}
                  disabled={questionFeedback.show}
                >
                  {answer}
                </button>
              ))}
            </div>

            {/* Feedback Animation */}
            {questionFeedback.show && (
              <div
                class={`mt-6 text-center transition-all duration-500 ${
                  questionFeedback.correct ? "text-success" : "text-error"
                }`}
              >
                <div
                  class={`inline-flex items-center gap-2 text-2xl font-bold ${
                    questionFeedback.correct
                      ? "animate-bounce"
                      : "animate-pulse"
                  }`}
                >
                  {questionFeedback.correct ? (
                    <>
                      <FiCheck class="w-8 h-8" />
                      Correct!
                    </>
                  ) : (
                    <>
                      <FiX class="w-8 h-8" />
                      Try Again!
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
