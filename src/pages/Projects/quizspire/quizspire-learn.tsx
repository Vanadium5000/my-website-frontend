import { useEffect, useState } from "preact/hooks";
import { useLocation } from "preact-iso";
import { FlashcardDeckSchema } from "../../../api/api";
import { api } from "../../../api/client";
import {
  FiArrowLeft,
  FiCheck,
  FiX,
  FiRotateCcw,
  FiChevronRight,
} from "react-icons/fi";
import { fetchDeck } from "../../../utils/quizspire";

/**
 * Interface for a quiz question with multiple choice options
 */
interface QuizQuestion {
  /** The card being tested */
  card: FlashcardDeckSchema["cards"][0];
  /** The question text (word/question side) */
  question: string;
  /** Array of answer options (definitions) */
  options: string[];
  /** Index of the correct answer in the options array */
  correctIndex: number;
}

/**
 * Interface for quiz session state
 */
interface QuizSession {
  /** Current question index */
  currentQuestionIndex: number;
  /** Array of questions for this session */
  questions: QuizQuestion[];
  /** User's answers (null if not answered) */
  answers: (number | null)[];
  /** Whether the current question has been answered */
  answered: boolean;
  /** Whether the quiz is completed */
  completed: boolean;
}

/**
 * Quizspire Learn component - implements a match-style learning system
 * similar to Quizlet, where users match questions to answers with immediate feedback
 */
export function QuizspireLearn({ id }: { id: string }) {
  const { route, query } = useLocation();
  const deckId = id;

  // State management
  const [deck, setDeck] = useState<FlashcardDeckSchema | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<QuizSession | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  /**
   * Loads the deck data and initializes the quiz session
   */
  const loadDeck = async () => {
    if (!deckId) {
      setError("Invalid deck ID");
      setLoading(false);
      return;
    }

    try {
      const deckData = await fetchDeck(deckId);
      setDeck(deckData);

      // Initialize quiz session
      const questions = generateQuestions(deckData);
      setSession({
        currentQuestionIndex: 0,
        questions,
        answers: new Array(questions.length).fill(null),
        answered: false,
        completed: false,
      });
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

  /**
   * Generates quiz questions by shuffling cards and creating multiple choice options
   * Uses other card definitions as distractors for better learning
   */
  const generateQuestions = (deck: FlashcardDeckSchema): QuizQuestion[] => {
    const shuffledCards = [...deck.cards].sort(() => Math.random() - 0.5);
    const questions: QuizQuestion[] = [];

    for (const card of shuffledCards) {
      // Get the question text (word/question side)
      const questionText =
        card.word.find((w) => w.type === "text")?.text || "Question";

      // Get the correct answer (definition/answer side)
      const correctAnswer =
        card.definition.find((d) => d.type === "text")?.text || "Answer";

      // Create options array with correct answer and distractors
      const allDefinitions = deck.cards
        .filter((c) => c !== card) // Exclude current card
        .map((c) => c.definition.find((d) => d.type === "text")?.text)
        .filter((text) => text && text !== correctAnswer) // Remove empty and duplicate correct answers
        .slice(0, 3); // Take up to 3 distractors

      // Ensure we have at least 2 options total (correct + at least 1 distractor)
      const options = [correctAnswer, ...allDefinitions];
      if (options.length < 2) {
        // If not enough distractors, add generic options
        while (options.length < 4) {
          options.push(`Option ${options.length + 1}`);
        }
      }

      // Shuffle options
      const shuffledOptions = options.sort(() => Math.random() - 0.5);
      const correctIndex = shuffledOptions.indexOf(correctAnswer);

      questions.push({
        card,
        question: questionText,
        options: shuffledOptions,
        correctIndex,
      });
    }

    return questions;
  };

  /**
   * Handles user selecting an answer option
   */
  const handleAnswerSelect = (optionIndex: number) => {
    if (showFeedback || !session) return;

    setSelectedAnswer(optionIndex);
    setShowFeedback(true);

    // Update session answers
    const newAnswers = [...session.answers];
    newAnswers[session.currentQuestionIndex] = optionIndex;

    setSession({
      ...session,
      answers: newAnswers,
      answered: true,
    });
  };

  /**
   * Moves to the next question or completes the quiz
   */
  const handleNext = () => {
    if (!session) return;

    if (session.currentQuestionIndex < session.questions.length - 1) {
      // Move to next question
      setSession({
        ...session,
        currentQuestionIndex: session.currentQuestionIndex + 1,
        answered: false,
      });
      setSelectedAnswer(null);
      setShowFeedback(false);
    } else {
      // Complete the quiz
      setSession({
        ...session,
        completed: true,
      });
    }
  };

  /**
   * Restarts the quiz with new shuffled questions
   */
  const handleRestart = () => {
    if (!deck) return;

    const questions = generateQuestions(deck);
    setSession({
      currentQuestionIndex: 0,
      questions,
      answers: new Array(questions.length).fill(null),
      answered: false,
      completed: false,
    });
    setSelectedAnswer(null);
    setShowFeedback(false);
  };

  // Load deck on component mount
  useEffect(() => {
    loadDeck();
  }, [deckId]);

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

  if (deck.cards.length === 0) {
    return (
      <div class="container mx-auto px-4 py-8">
        <div class="text-center">
          <div class="alert alert-warning max-w-md">
            <span>This deck has no cards</span>
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

  if (deck.cards.length < 2) {
    return (
      <div class="container mx-auto px-4 py-8">
        <div class="text-center">
          <div class="alert alert-warning max-w-md">
            <span>This deck needs at least 2 cards for the learn mode</span>
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

  if (!session) {
    return null; // Should not happen
  }

  // Calculate progress
  const progress =
    ((session.currentQuestionIndex + (session.answered ? 1 : 0)) /
      session.questions.length) *
    100;
  const correctAnswers = session.answers.filter(
    (answer, index) =>
      answer !== null && answer === session.questions[index].correctIndex
  ).length;

  if (session.completed) {
    // Completion screen
    return (
      <div class="container mx-auto px-4 py-8">
        <div class="max-w-2xl mx-auto">
          <div class="text-center mb-8">
            <h1 class="text-3xl font-bold mb-2">Quiz Complete!</h1>
            <p class="text-lg text-base-content/70">
              {deck.title} - Learn Mode
            </p>
          </div>

          <div class="card bg-base-100 shadow-xl">
            <div class="card-body text-center">
              <div class="stats stats-vertical lg:stats-horizontal shadow mb-6">
                <div class="stat">
                  <div class="stat-title">Questions</div>
                  <div class="stat-value">{session.questions.length}</div>
                </div>
                <div class="stat">
                  <div class="stat-title">Correct</div>
                  <div class="stat-value text-success">{correctAnswers}</div>
                </div>
                <div class="stat">
                  <div class="stat-title">Accuracy</div>
                  <div class="stat-value text-primary">
                    {Math.round(
                      (correctAnswers / session.questions.length) * 100
                    )}
                    %
                  </div>
                </div>
              </div>

              <div class="flex gap-4 justify-center">
                <button class="btn btn-primary btn-lg" onClick={handleRestart}>
                  <FiRotateCcw class="w-5 h-5 mr-2" />
                  Try Again
                </button>
                <button
                  class="btn btn-outline btn-lg"
                  onClick={() => {
                    route(query.referrer || "/projects/quizspire");
                  }}
                >
                  <FiArrowLeft class="w-5 h-5 mr-2" />
                  Back
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = session.questions[session.currentQuestionIndex];

  return (
    <div class="container mx-auto px-4 py-8">
      <div class="max-w-2xl mx-auto">
        {/* Header */}
        <div class="flex items-center justify-between mb-6">
          <button
            class="btn btn-ghost"
            onClick={() => route(query.referrer || "/projects/quizspire")}
          >
            <FiArrowLeft class="w-4 h-4 mr-2" />
            Back
          </button>
          <div class="text-center">
            <h1 class="text-xl font-bold">{deck.title}</h1>
            <p class="text-sm text-base-content/70">Learn Mode</p>
          </div>
          <div class="text-right">
            <div class="text-sm font-medium">
              {session.currentQuestionIndex + 1} / {session.questions.length}
            </div>
            <div class="text-xs text-base-content/50">
              {correctAnswers} correct
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div class="mb-8">
          <progress
            class="progress progress-primary w-full"
            value={progress}
            max="100"
          ></progress>
        </div>

        {/* Question */}
        <div class="card bg-base-100 shadow-xl mb-6">
          <div class="card-body">
            <h2 class="card-title text-xl mb-4">Match the definition:</h2>
            <div class="text-center">
              <div class="bg-base-200 rounded-lg p-6 mb-6">
                <p class="text-2xl font-semibold">{currentQuestion.question}</p>
              </div>
            </div>

            {/* Answer options */}
            <div class="grid grid-cols-1 gap-3">
              {currentQuestion.options.map((option, index) => {
                let buttonClass =
                  "btn btn-outline btn-block justify-start h-auto py-4";

                if (showFeedback) {
                  if (index === currentQuestion.correctIndex) {
                    buttonClass += " btn-success";
                  } else if (index === selectedAnswer) {
                    buttonClass += " btn-error";
                  }
                } else if (index === selectedAnswer) {
                  buttonClass += " btn-primary";
                }

                return (
                  <button
                    key={index}
                    class={buttonClass}
                    onClick={() => handleAnswerSelect(index)}
                    disabled={showFeedback}
                  >
                    <div class="flex items-center w-full">
                      <span class="flex-shrink-0 w-8 h-8 rounded-full bg-base-300 flex items-center justify-center mr-3 font-medium">
                        {String.fromCharCode(65 + index)}
                      </span>
                      <span class="text-left flex-1">{option}</span>
                      {showFeedback &&
                        index === currentQuestion.correctIndex && (
                          <FiCheck class="w-5 h-5 ml-2 text-success" />
                        )}
                      {showFeedback &&
                        index === selectedAnswer &&
                        index !== currentQuestion.correctIndex && (
                          <FiX class="w-5 h-5 ml-2 text-error" />
                        )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Next button */}
        {showFeedback && (
          <div class="text-center">
            <button class="btn btn-primary btn-lg" onClick={handleNext}>
              {session.currentQuestionIndex < session.questions.length - 1 ? (
                <>
                  Next Question
                  <FiChevronRight class="w-5 h-5 ml-2" />
                </>
              ) : (
                "View Results"
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
