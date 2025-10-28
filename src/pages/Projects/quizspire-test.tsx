import { useEffect, useState } from "preact/hooks";
import { useLocation } from "preact-iso";
import { FlashcardDeckSchema } from "../../api/api";
import { api } from "../../api/client";
import {
  FiChevronLeft,
  FiChevronRight,
  FiTarget,
  FiCheck,
  FiX,
  FiArrowLeft,
  FiRotateCcw,
  FiPlay,
  FiBookOpen,
} from "react-icons/fi";
import { getApiImageUrl } from "../../components/ProfilePicture";
import { fetchDeck } from "../../utils/quizspire";

// Helper function to parse test seed from URL
const parseTestSeed = (seed: string): TestConfig | null => {
  try {
    const decoded = atob(seed);
    const [questionCount, testType] = decoded.split("-");
    return {
      questionCount: parseInt(questionCount),
      testType: testType as "match" | "typing",
    };
  } catch {
    return null;
  }
};

// Helper function to generate test seed for URL
const generateTestSeed = (config: TestConfig): string => {
  return btoa(`${config.questionCount}-${config.testType}`);
};

// Test configuration types
interface TestConfig {
  questionCount: number;
  testType: "match" | "typing";
}

// Question types
interface MatchQuestion {
  id: string;
  question: string;
  answer: string;
  options: string[];
  userAnswer?: string;
}

interface TypingQuestion {
  id: string;
  question: string;
  answer: string;
  userAnswer?: string;
}

type Question = MatchQuestion | TypingQuestion;

// Test result types
interface TestResult {
  score: number;
  totalQuestions: number;
  timeTaken: number;
  answers: Array<{
    questionId: string;
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
  }>;
}

/**
 * Test configuration modal component
 */
function TestConfigModal({
  deck,
  onStart,
  onClose,
}: {
  deck: FlashcardDeckSchema;
  onStart: (config: TestConfig) => void;
  onClose: () => void;
}) {
  const [questionCount, setQuestionCount] = useState(
    Math.min(10, deck.cards.length)
  );
  const [testType, setTestType] = useState<"match" | "typing">("match");
  const [showShareLink, setShowShareLink] = useState(false);
  const [shareUrl, setShareUrl] = useState("");

  const maxQuestions = deck.cards.length;

  const handleStartTest = (config: TestConfig) => {
    // Generate shareable URL
    const testSeed = generateTestSeed(config);
    const url = `${window.location.origin}${window.location.pathname}?test=${testSeed}`;
    setShareUrl(url);
    setShowShareLink(true);
    onStart(config);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      // Could add a toast notification here
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  if (showShareLink) {
    return (
      <div class="modal modal-open">
        <div class="modal-box animate-in fade-in-0 zoom-in-95 duration-300">
          <h3 class="font-bold text-xl mb-4 flex items-center gap-2">
            <FiTarget class="text-primary" />
            Test Link Generated!
          </h3>

          <div class="alert alert-success mb-4">
            <FiCheck class="w-5 h-5" />
            <span>
              Your test has been configured. Share this link to let others take
              the same test!
            </span>
          </div>

          <div class="form-control">
            <label class="label">
              <span class="label-text">Shareable Test Link</span>
            </label>
            <div class="join">
              <input
                type="text"
                class="input input-bordered join-item flex-1"
                value={shareUrl}
                readonly
              />
              <button
                class="btn btn-primary join-item"
                onClick={copyToClipboard}
              >
                <FiBookOpen class="w-4 h-4" />
                Copy
              </button>
            </div>
          </div>

          <div class="modal-action">
            <button
              class="btn btn-outline"
              onClick={() => setShowShareLink(false)}
            >
              Back
            </button>
            <button class="btn btn-primary" onClick={onClose}>
              Start Test
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div class="modal modal-open">
      <div class="modal-box max-w-lg animate-in fade-in-0 zoom-in-95 duration-300">
        <h3 class="font-bold text-2xl mb-6 flex items-center gap-3">
          <div class="p-2 bg-primary/10 rounded-full">
            <FiTarget class="w-6 h-6 text-primary" />
          </div>
          Configure Your Test
        </h3>

        <div class="space-y-6">
          <div class="card bg-base-100 shadow-sm border">
            <div class="card-body p-4">
              <div class="flex items-center gap-3 mb-3">
                <FiBookOpen class="w-5 h-5 text-primary" />
                <span class="font-semibold">Number of Questions</span>
              </div>
              <input
                type="range"
                min="1"
                max={maxQuestions}
                value={questionCount}
                class="range range-primary range-lg w-full"
                onInput={(e) =>
                  setQuestionCount(parseInt(e.currentTarget.value))
                }
              />
              <div class="flex justify-between text-sm text-base-content/70 mt-2">
                <span class="badge badge-outline">1</span>
                <span class="badge badge-primary badge-lg font-bold">
                  {questionCount}
                </span>
                <span class="badge badge-outline">{maxQuestions}</span>
              </div>
            </div>
          </div>

          <div class="card bg-base-100 shadow-sm border">
            <div class="card-body p-4">
              <div class="flex items-center gap-3 mb-3">
                <FiPlay class="w-5 h-5 text-primary" />
                <span class="font-semibold">Test Type</span>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div
                  class={`card cursor-pointer transition-all duration-200 ${
                    testType === "match"
                      ? "bg-primary text-primary-content shadow-lg scale-105"
                      : "bg-base-100 hover:bg-base-200"
                  }`}
                  onClick={() => setTestType("match")}
                >
                  <div class="card-body p-4 text-center">
                    <div class="text-2xl mb-2">🎯</div>
                    <div class="font-bold">Match</div>
                    <div class="text-xs opacity-80">Multiple Choice</div>
                  </div>
                </div>
                <div
                  class={`card cursor-pointer transition-all duration-200 ${
                    testType === "typing"
                      ? "bg-primary text-primary-content shadow-lg scale-105"
                      : "bg-base-100 hover:bg-base-200"
                  }`}
                  onClick={() => setTestType("typing")}
                >
                  <div class="card-body p-4 text-center">
                    <div class="text-2xl mb-2">⌨️</div>
                    <div class="font-bold">Typing</div>
                    <div class="text-xs opacity-80">Type Answer</div>
                  </div>
                </div>
              </div>
              <div class="text-sm text-base-content/70 mt-3 p-3 bg-base-200 rounded-lg">
                {testType === "match"
                  ? "Select the correct answer from multiple choices. Perfect for quick testing!"
                  : "Type the exact answer as shown. Great for memorization practice!"}
              </div>
            </div>
          </div>
        </div>

        <div class="modal-action mt-8">
          <button class="btn btn-ghost" onClick={onClose}>
            <FiArrowLeft class="w-4 h-4 mr-2" />
            Cancel
          </button>
          <button
            class="btn btn-primary btn-lg"
            onClick={() => handleStartTest({ questionCount, testType })}
          >
            <FiPlay class="w-5 h-5 mr-2" />
            Generate Test Link
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Match test component with multiple choice questions
 */
function MatchTest({
  questions,
  onAnswer,
  onComplete,
}: {
  questions: MatchQuestion[];
  onAnswer: (questionId: string, answer: string) => void;
  onComplete: () => void;
}) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [startTime] = useState(Date.now());
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  const handleAnswer = (answer: string, optionIndex: number) => {
    if (showFeedback) return;

    setSelectedOption(optionIndex);
    setShowFeedback(true);

    const newAnswers = { ...answers, [currentQuestion.id]: answer };
    setAnswers(newAnswers);
    onAnswer(currentQuestion.id, answer);

    // Delay before moving to next question
    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setSelectedOption(null);
        setShowFeedback(false);
      } else {
        onComplete();
      }
    }, 1500);
  };

  return (
    <div class="min-h-full bg-gradient-to-br from-primary/5 via-base-100 to-secondary/5">
      <div class="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div class="text-center mb-8">
          <div class="inline-flex items-center gap-3 mb-4">
            <div class="p-3 bg-primary/10 rounded-full">
              <FiTarget class="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 class="text-3xl font-bold">Match Test</h1>
              <p class="text-base-content/70">Multiple Choice Questions</p>
            </div>
          </div>

          {/* Progress */}
          <div class="max-w-md mx-auto mb-6">
            <div class="flex justify-between text-sm mb-2">
              <span>
                Question {currentQuestionIndex + 1} of {questions.length}
              </span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <progress
              class="progress progress-primary w-full h-3"
              value={progress}
              max="100"
            ></progress>
          </div>
        </div>

        {/* Question Card */}
        <div class="card bg-base-100 shadow-2xl border animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
          <div class="card-body p-8">
            <div class="text-center mb-8">
              <div class="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                <span class="text-2xl font-bold text-primary">
                  {currentQuestionIndex + 1}
                </span>
              </div>
              <h2 class="card-title text-2xl justify-center mb-2">
                {currentQuestion.question}
              </h2>
              <p class="text-base-content/60">Select the correct answer</p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentQuestion.options.map((option, index) => {
                let buttonClass =
                  "btn btn-outline justify-start h-auto py-4 px-6 transition-all duration-200 hover:scale-105";
                let isCorrect = false;
                let isSelected = selectedOption === index;

                if (showFeedback) {
                  isCorrect = option === currentQuestion.answer;
                  if (isCorrect) {
                    buttonClass += " btn-success text-success-content";
                  } else if (isSelected) {
                    buttonClass += " btn-error text-error-content";
                  } else {
                    buttonClass += " btn-ghost opacity-50";
                  }
                } else if (isSelected) {
                  buttonClass += " btn-primary";
                }

                return (
                  <button
                    key={index}
                    class={`group ${buttonClass}`}
                    onClick={() => handleAnswer(option, index)}
                    disabled={showFeedback}
                  >
                    <div class="flex items-center w-full">
                      <div
                        class={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center mr-4 font-bold text-lg transition-all ${
                          showFeedback
                            ? isCorrect
                              ? "bg-success text-success-content"
                              : isSelected
                              ? "bg-error text-error-content"
                              : "bg-base-300"
                            : isSelected
                            ? "bg-primary text-primary-content"
                            : "bg-base-200 group-hover:bg-base-300"
                        }`}
                      >
                        {String.fromCharCode(65 + index)}
                      </div>
                      <span class="text-left flex-1">{option}</span>
                      {showFeedback && isCorrect && (
                        <FiCheck class="w-6 h-6 ml-2 text-success animate-in zoom-in-50 duration-300" />
                      )}
                      {showFeedback && isSelected && !isCorrect && (
                        <FiX class="w-6 h-6 ml-2 text-error animate-in zoom-in-50 duration-300" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {showFeedback && (
              <div class="text-center mt-6 animate-in fade-in-0 slide-in-from-bottom-2 duration-500">
                <div
                  class={`alert ${
                    selectedOption !== null &&
                    currentQuestion.options[selectedOption] ===
                      currentQuestion.answer
                      ? "alert-success"
                      : "alert-error"
                  }`}
                >
                  <div class="flex items-center justify-center gap-2">
                    {selectedOption !== null &&
                    currentQuestion.options[selectedOption] ===
                      currentQuestion.answer ? (
                      <>
                        <FiCheck class="w-5 h-5" />
                        <span class="font-semibold">Correct!</span>
                      </>
                    ) : (
                      <>
                        <FiX class="w-5 h-5" />
                        <span class="font-semibold">Incorrect</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Typing test component with input fields
 */
function TypingTest({
  questions,
  onAnswer,
  onComplete,
}: {
  questions: TypingQuestion[];
  onAnswer: (questionId: string, answer: string) => void;
  onComplete: () => void;
}) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [startTime] = useState(Date.now());
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  const handleSubmit = () => {
    if (!currentAnswer.trim()) return;

    const correct =
      currentAnswer.toLowerCase().trim() ===
      currentQuestion.answer.toLowerCase().trim();
    setIsCorrect(correct);
    setShowFeedback(true);

    const newAnswers = { ...answers, [currentQuestion.id]: currentAnswer };
    setAnswers(newAnswers);
    onAnswer(currentQuestion.id, currentAnswer);

    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setCurrentAnswer("");
        setShowFeedback(false);
      } else {
        onComplete();
      }
    }, 2000);
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  return (
    <div class="min-h-full bg-gradient-to-br from-secondary/5 via-base-100 to-accent/5">
      <div class="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div class="text-center mb-8">
          <div class="inline-flex items-center gap-3 mb-4">
            <div class="p-3 bg-secondary/10 rounded-full">
              <FiBookOpen class="w-8 h-8 text-secondary" />
            </div>
            <div>
              <h1 class="text-3xl font-bold">Typing Test</h1>
              <p class="text-base-content/70">Type the exact answer</p>
            </div>
          </div>

          {/* Progress */}
          <div class="max-w-md mx-auto mb-6">
            <div class="flex justify-between text-sm mb-2">
              <span>
                Question {currentQuestionIndex + 1} of {questions.length}
              </span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <progress
              class="progress progress-secondary w-full h-3"
              value={progress}
              max="100"
            ></progress>
          </div>
        </div>

        {/* Question Card */}
        <div class="card bg-base-100 shadow-2xl border animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
          <div class="card-body p-8">
            <div class="text-center mb-8">
              <div class="inline-flex items-center justify-center w-16 h-16 bg-secondary/10 rounded-full mb-4">
                <span class="text-2xl font-bold text-secondary">
                  {currentQuestionIndex + 1}
                </span>
              </div>
              <h2 class="card-title text-2xl justify-center mb-2">
                {currentQuestion.question}
              </h2>
              <p class="text-base-content/60">
                Type the answer exactly as shown
              </p>
            </div>

            <div class="max-w-md mx-auto">
              <div class="form-control">
                <input
                  type="text"
                  class={`input input-bordered input-lg text-center text-xl py-6 transition-all duration-200 ${
                    showFeedback
                      ? isCorrect
                        ? "input-success"
                        : "input-error"
                      : ""
                  }`}
                  placeholder="Type your answer..."
                  value={currentAnswer}
                  onInput={(e) => setCurrentAnswer(e.currentTarget.value)}
                  onKeyPress={handleKeyPress}
                  autoFocus
                  disabled={showFeedback}
                />
              </div>

              {showFeedback && (
                <div class="text-center mt-6 animate-in fade-in-0 slide-in-from-bottom-2 duration-500">
                  <div
                    class={`alert ${
                      isCorrect ? "alert-success" : "alert-error"
                    }`}
                  >
                    <div class="flex items-center justify-center gap-2">
                      {isCorrect ? (
                        <>
                          <FiCheck class="w-5 h-5" />
                          <span class="font-semibold">Correct!</span>
                        </>
                      ) : (
                        <>
                          <FiX class="w-5 h-5" />
                          <span class="font-semibold">Incorrect</span>
                        </>
                      )}
                    </div>
                  </div>
                  {!isCorrect && (
                    <div class="mt-2 text-sm">
                      <span class="font-medium">Correct answer: </span>
                      <span class="font-mono">{currentQuestion.answer}</span>
                    </div>
                  )}
                </div>
              )}

              {!showFeedback && (
                <div class="text-center mt-6">
                  <button
                    class="btn btn-secondary btn-lg px-8"
                    onClick={handleSubmit}
                    disabled={!currentAnswer.trim()}
                  >
                    {currentQuestionIndex < questions.length - 1
                      ? "Submit & Next"
                      : "Finish Test"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Test results component
 */
function TestResults({
  result,
  questions,
  testType,
  onRestart,
  onBack,
}: {
  result: TestResult;
  questions: Question[];
  testType: "match" | "typing";
  onRestart: () => void;
  onBack: () => void;
}) {
  const percentage = Math.round((result.score / result.totalQuestions) * 100);
  const timeInMinutes = Math.round((result.timeTaken / 60000) * 10) / 10;

  const getPerformanceMessage = () => {
    if (percentage >= 90)
      return { message: "Outstanding!", color: "text-success", icon: "🏆" };
    if (percentage >= 80)
      return { message: "Great job!", color: "text-success", icon: "🎉" };
    if (percentage >= 70)
      return { message: "Good work!", color: "text-warning", icon: "👍" };
    if (percentage >= 60)
      return { message: "Keep practicing!", color: "text-warning", icon: "📚" };
    return { message: "Room for improvement", color: "text-error", icon: "💪" };
  };

  const performance = getPerformanceMessage();

  return (
    <div class="min-h-full bg-gradient-to-br from-base-100 via-base-200/20 to-base-100">
      <div class="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div class="text-center mb-12">
          <div class="inline-flex items-center gap-4 mb-6">
            <div class="text-6xl">{performance.icon}</div>
            <div>
              <h1 class="text-4xl font-bold mb-2">Test Complete!</h1>
              <p class={`text-xl font-semibold ${performance.color}`}>
                {performance.message}
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div class="card bg-base-100 shadow-xl border">
              <div class="card-body text-center">
                <div
                  class="radial-progress text-primary mb-4 mx-auto"
                  style={`--value:${percentage}; --size:4rem; --thickness:0.5rem;`}
                >
                  <span class="text-lg font-bold">{percentage}%</span>
                </div>
                <h3 class="font-semibold">Accuracy</h3>
                <p class="text-sm text-base-content/70">
                  {result.score} out of {result.totalQuestions} correct
                </p>
              </div>
            </div>

            <div class="card bg-base-100 shadow-xl border">
              <div class="card-body text-center">
                <div class="text-4xl mb-4">⏱️</div>
                <h3 class="font-semibold">Time Taken</h3>
                <p class="text-2xl font-bold text-primary">{timeInMinutes}m</p>
                <p class="text-sm text-base-content/70">minutes</p>
              </div>
            </div>

            <div class="card bg-base-100 shadow-xl border">
              <div class="card-body text-center">
                <div
                  class={`text-4xl mb-4 ${
                    percentage >= 70
                      ? "text-success"
                      : percentage >= 50
                      ? "text-warning"
                      : "text-error"
                  }`}
                >
                  {percentage >= 70 ? "🎯" : percentage >= 50 ? "🎯" : "🎯"}
                </div>
                <h3 class="font-semibold">Score</h3>
                <p class="text-2xl font-bold">
                  {result.score}/{result.totalQuestions}
                </p>
                <p class="text-sm text-base-content/70">questions</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <button class="btn btn-primary btn-lg" onClick={onRestart}>
              <FiRotateCcw class="w-5 h-5 mr-2" />
              Take Test Again
            </button>
            <button class="btn btn-outline btn-lg" onClick={onBack}>
              <FiArrowLeft class="w-5 h-5 mr-2" />
              Back to Deck
            </button>
          </div>
        </div>

        {/* Review Answers */}
        <div class="card bg-base-100 shadow-xl border">
          <div class="card-body">
            <h2 class="text-2xl font-bold mb-6 flex items-center gap-2">
              <FiBookOpen class="w-6 h-6" />
              Review Your Answers
            </h2>

            <div class="space-y-6">
              {result.answers.map((answer, index) => {
                const question = questions.find(
                  (q) => q.id === answer.questionId
                );
                if (!question) return null;

                const isCorrect = answer.isCorrect;

                return (
                  <div
                    key={answer.questionId}
                    class={`border-l-4 rounded-lg p-6 transition-all duration-300 hover:shadow-md ${
                      isCorrect
                        ? "border-l-success bg-success/5"
                        : "border-l-error bg-error/5"
                    }`}
                  >
                    <div class="flex items-start gap-4">
                      <div
                        class={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                          isCorrect
                            ? "bg-success text-success-content"
                            : "bg-error text-error-content"
                        }`}
                      >
                        {isCorrect ? (
                          <FiCheck class="w-6 h-6" />
                        ) : (
                          <FiX class="w-6 h-6" />
                        )}
                      </div>

                      <div class="flex-1">
                        <div class="flex items-center gap-2 mb-3">
                          <span class="badge badge-outline">
                            Question {index + 1}
                          </span>
                          <span
                            class={`badge ${
                              isCorrect ? "badge-success" : "badge-error"
                            }`}
                          >
                            {isCorrect ? "Correct" : "Incorrect"}
                          </span>
                        </div>

                        <h3 class="font-semibold text-lg mb-4">
                          {question.question}
                        </h3>

                        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div class="space-y-2">
                            <p class="text-sm font-medium text-base-content/70 uppercase tracking-wide">
                              Your Answer
                            </p>
                            <div
                              class={`p-3 rounded-lg border-2 ${
                                isCorrect
                                  ? "border-success bg-success/10 text-success"
                                  : "border-error bg-error/10 text-error"
                              }`}
                            >
                              <p class="font-medium">
                                {answer.userAnswer || "(no answer)"}
                              </p>
                            </div>
                          </div>

                          <div class="space-y-2">
                            <p class="text-sm font-medium text-base-content/70 uppercase tracking-wide">
                              Correct Answer
                            </p>
                            <div class="p-3 rounded-lg border-2 border-success bg-success/10 text-success">
                              <p class="font-medium">{answer.correctAnswer}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Main Quizspire Test component
 */
export function QuizspireTest({ deckId }: { deckId: string }) {
  const { route, query } = useLocation();

  // Check if we have a test configuration in the URL
  const testSeed = query.test;

  const [deck, setDeck] = useState<FlashcardDeckSchema | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [testStarted, setTestStarted] = useState(false);
  const [testCompleted, setTestCompleted] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [testConfig, setTestConfig] = useState<TestConfig | null>(null);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);

  // Load deck data
  useEffect(() => {
    const loadDeck = async () => {
      try {
        const deckData = await fetchDeck(deckId);
        setDeck(deckData);

        // If we have a test seed, generate the test immediately
        if (testSeed) {
          const config = parseTestSeed(testSeed);
          if (config) {
            const generatedQuestions = generateQuestions(deckData, config);
            setQuestions(generatedQuestions);
            setTestConfig(config);
            setTestStarted(true);
            setStartTime(Date.now());
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

    loadDeck();
  }, [deckId, testSeed]);

  // Generate questions based on configuration
  const generateQuestions = (
    deckData: FlashcardDeckSchema,
    config: TestConfig,
    seed?: string
  ): Question[] => {
    // Use seed for reproducible randomization if provided
    let shuffledCards = [...deckData.cards];
    if (seed) {
      // Simple seeded shuffle for reproducibility
      const seedNum = seed.split("").reduce((a, b) => a + b.charCodeAt(0), 0);
      shuffledCards = shuffledCards.sort((a, b) => {
        const hashA = (
          a.word.map((w) => (w.type === "text" ? w.text : "")).join("") +
          seedNum
        )
          .split("")
          .reduce((h, c) => h + c.charCodeAt(0), 0);
        const hashB = (
          b.word.map((w) => (w.type === "text" ? w.text : "")).join("") +
          seedNum
        )
          .split("")
          .reduce((h, c) => h + c.charCodeAt(0), 0);
        return hashA - hashB;
      });
    } else {
      shuffledCards = shuffledCards.sort(() => Math.random() - 0.5);
    }

    const selectedCards = shuffledCards.slice(0, config.questionCount);

    if (config.testType === "match") {
      return selectedCards.map((card, index) => {
        // Get the text content from word/definition
        const questionText =
          card.word.find((w) => w.type === "text")?.text || "";
        const answerText =
          card.definition.find((d) => d.type === "text")?.text || "";

        // Generate wrong options from other cards
        const wrongOptions = selectedCards
          .filter((_, i) => i !== index)
          .map((c) => c.definition.find((d) => d.type === "text")?.text || "")
          .filter((text) => text && text !== answerText)
          .slice(0, 3);

        const options = [answerText, ...wrongOptions].sort(
          () => Math.random() - 0.5
        );

        return {
          id: `q-${index}`,
          question: questionText,
          answer: answerText,
          options,
        } as MatchQuestion;
      });
    } else {
      return selectedCards.map(
        (card, index) =>
          ({
            id: `q-${index}`,
            question: card.word.find((w) => w.type === "text")?.text || "",
            answer: card.definition.find((d) => d.type === "text")?.text || "",
          } as TypingQuestion)
      );
    }
  };

  const handleStartTest = (config: TestConfig) => {
    if (!deck || deck.cards.length < config.questionCount) {
      setError("Not enough cards in deck");
      return;
    }

    const generatedQuestions = generateQuestions(deck, config);
    setQuestions(generatedQuestions);
    setTestConfig(config);
    setShowConfigModal(false);
    setTestStarted(true);
    setStartTime(Date.now());
  };

  const handleAnswer = (questionId: string, answer: string) => {
    setUserAnswers((prev) => ({ ...prev, [questionId]: answer }));
    setQuestions((prev) =>
      prev.map((q) => (q.id === questionId ? { ...q, userAnswer: answer } : q))
    );
  };

  const handleTestComplete = () => {
    if (!startTime || !questions.length) return;

    const endTime = Date.now();
    const timeTaken = endTime - startTime;

    const answers = questions.map((q) => ({
      questionId: q.id,
      userAnswer: q.userAnswer || "",
      correctAnswer: q.answer,
      isCorrect:
        (q.userAnswer || "").toLowerCase().trim() ===
        q.answer.toLowerCase().trim(),
    }));

    const score = answers.filter((a) => a.isCorrect).length;

    setTestResult({
      score,
      totalQuestions: questions.length,
      timeTaken,
      answers,
    });

    setTestCompleted(true);
  };

  const handleRestart = () => {
    setTestStarted(false);
    setTestCompleted(false);
    setQuestions([]);
    setTestResult(null);
    setStartTime(null);
    setShowConfigModal(true);
  };

  const handleBack = () => {
    route(query.referrer || `/projects/quizspire/${deckId}`);
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
        <div class="alert alert-error max-w-md mx-auto">
          <span>{error || "Deck not found"}</span>
        </div>
        <div class="text-center mt-4">
          <button
            class="btn btn-primary"
            onClick={() => route("/projects/quizspire")}
          >
            <FiArrowLeft class="w-4 h-4 mr-2" />
            Back to Quizspire
          </button>
        </div>
      </div>
    );
  }

  if (deck.cards.length < 2) {
    return (
      <div class="container mx-auto px-4 py-8">
        <div class="alert alert-warning max-w-md mx-auto">
          <span>This deck needs at least 2 cards to take a test</span>
        </div>
        <div class="text-center mt-4">
          <button
            class="btn btn-primary"
            onClick={() => route(`/projects/quizspire/${deckId}`)}
          >
            <FiArrowLeft class="w-4 h-4 mr-2" />
            Back to Deck
          </button>
        </div>
      </div>
    );
  }

  return (
    <div class="min-h-full bg-base-100">
      {/* Header */}
      <div class="bg-base-200 border-b border-base-300 px-4 py-3">
        <div class="navbar w-full min-h-0">
          <div class="navbar-start">
            <button class="btn btn-ghost btn-sm" onClick={handleBack}>
              <FiArrowLeft class="w-4 h-4" />
            </button>
            <div class="ml-4">
              <h1 class="text-xl font-bold">{deck.title}</h1>
              <p class="text-sm text-base-content/70">Test Mode</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      {!testStarted && !testCompleted && (
        <div class="container mx-auto px-4 py-8 text-center">
          <div class="max-w-md mx-auto">
            <FiTarget class="w-16 h-16 mx-auto mb-4 text-primary" />
            <h1 class="text-2xl font-bold mb-4">Ready to Test?</h1>
            <p class="text-base-content/70 mb-6">
              Put your knowledge to the test with flashcards from this deck.
            </p>
            <button
              class="btn btn-primary btn-lg"
              onClick={() => setShowConfigModal(true)}
            >
              <FiPlay class="w-5 h-5 mr-2" />
              Start Test
            </button>
          </div>
        </div>
      )}

      {testStarted &&
        !testCompleted &&
        testConfig &&
        (testConfig.testType === "match" ? (
          <MatchTest
            questions={questions as MatchQuestion[]}
            onAnswer={handleAnswer}
            onComplete={handleTestComplete}
          />
        ) : (
          <TypingTest
            questions={questions as TypingQuestion[]}
            onAnswer={handleAnswer}
            onComplete={handleTestComplete}
          />
        ))}

      {testCompleted && testResult && (
        <TestResults
          result={testResult}
          questions={questions}
          testType={testConfig?.testType || "match"}
          onRestart={handleRestart}
          onBack={handleBack}
        />
      )}

      {/* Configuration Modal */}
      {showConfigModal && (
        <TestConfigModal
          deck={deck}
          onStart={handleStartTest}
          onClose={() => setShowConfigModal(false)}
        />
      )}
    </div>
  );
}
