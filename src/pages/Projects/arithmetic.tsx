import { h } from "preact";
import { useState, useEffect, useRef } from "preact/hooks";
type Range = {
  min1: number;
  max1: number;
  min2: number;
  max2: number;
};
type Op = "add" | "sub" | "mult" | "div";
type Problem = {
  question: string;
  answer: number;
};
type SelectedOps = Record<Op, boolean>;
const randInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;
const operations: Op[] = ["add", "sub", "mult", "div"];
export function Arithmetic() {
  const params = new URLSearchParams(window.location.search);
  const configStr = params.get("config");
  let initialAddRange: Range = { min1: 0, max1: 100, min2: 0, max2: 100 };
  let initialMultRange: Range = { min1: 2, max1: 20, min2: 2, max2: 20 };
  let initialDuration = 120;
  let initialSelectedOps: SelectedOps = {
    add: true,
    sub: true,
    mult: true,
    div: true,
  };
  let autoStart = false;
  if (configStr) {
    try {
      const config = JSON.parse(atob(configStr));
      initialAddRange = config.addRange;
      initialMultRange = config.multRange;
      initialDuration = config.duration;
      initialSelectedOps = config.selectedOps;
      autoStart = true;
    } catch (e) {}
  }
  const [addRange, setAddRange] = useState<Range>(initialAddRange);
  const [multRange, setMultRange] = useState<Range>(initialMultRange);
  const [duration, setDuration] = useState<number>(initialDuration);
  const [selectedOps, setSelectedOps] =
    useState<SelectedOps>(initialSelectedOps);
  const [gameState, setGameState] = useState<"start" | "playing" | "ended">(
    "start"
  );
  const [score, setScore] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [currentProblem, setCurrentProblem] = useState<Problem | null>(null);
  const [inputValue, setInputValue] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);
  const generateProblem = () => {
    const selectedOperations = operations.filter((op) => selectedOps[op]);
    if (selectedOperations.length === 0) return;
    const op = selectedOperations[randInt(0, selectedOperations.length - 1)];
    let a: number, b: number, question: string, answer: number;
    if (op === "add" || op === "sub") {
      a = randInt(addRange.min1, addRange.max1);
      b = randInt(addRange.min2, addRange.max2);
    } else {
      a = randInt(multRange.min1, multRange.max1);
      b = randInt(multRange.min2, multRange.max2);
    }
    if (op === "add") {
      question = `${a} + ${b} = `;
      answer = a + b;
    } else if (op === "sub") {
      const sum = a + b;
      const subtrahend = Math.random() > 0.5 ? a : b;
      question = `${sum} - ${subtrahend} = `;
      answer = sum - subtrahend;
    } else if (op === "mult") {
      question = `${a} × ${b} = `;
      answer = a * b;
    } else {
      // div
      const product = a * b;
      const divisor = Math.random() > 0.5 ? a : b;
      question = `${product} ÷ ${divisor} = `;
      answer = product / divisor;
    }
    setCurrentProblem({ question, answer });
    setInputValue("");
  };
  const startGame = () => {
    const hasOps = Object.values(selectedOps).some((v) => v);
    if (!hasOps) {
      alert("Please select at least one operation.");
      return;
    }
    setScore(0);
    setTimeLeft(duration);
    setGameState("playing");
    generateProblem();
  };
  useEffect(() => {
    if (autoStart) {
      startGame();
    }
  }, []);
  useEffect(() => {
    if (gameState !== "playing") return;
    if (timeLeft <= 0) {
      setGameState("ended");
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((t) => t - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [gameState, timeLeft]);
  useEffect(() => {
    if (gameState === "playing" && inputRef.current) {
      inputRef.current.focus();
    }
  }, [gameState, currentProblem]);
  useEffect(() => {
    if (gameState === "ended") {
      console.log(
        JSON.stringify(
          {
            additionRange: addRange,
            multiplicationRange: multRange,
            duration: duration,
            finalScore: score,
          },
          null,
          2
        )
      );
    }
  }, [gameState, addRange, multRange, duration, score]);
  const handleSubmit = () => {
    if (!currentProblem) return;
    const userAnswer = parseFloat(inputValue);
    if (isNaN(userAnswer)) {
      setInputValue("");
      return;
    }
    if (Math.abs(userAnswer - currentProblem.answer) < 0.0001) {
      setScore((s) => s + 1);
      generateProblem();
    } else {
      setInputValue("");
    }
  };
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };
  const handleRangeChange = (
    setter: (r: Range) => void,
    range: Range,
    key: keyof Range,
    value: string
  ) => {
    const num = parseInt(value, 10);
    if (!isNaN(num)) {
      setter({ ...range, [key]: num });
    }
  };
  const handleShare = () => {
    const config = {
      addRange,
      multRange,
      duration,
      selectedOps,
    };
    const configStr = btoa(JSON.stringify(config));
    const url = `${window.location.origin}${window.location.pathname}?config=${configStr}`;
    navigator.clipboard.writeText(url).then(() => {
      alert("Shareable link copied to clipboard!");
    });
  };
  if (gameState === "start") {
    return (
      <>
        <div className="bg-base-100 mx-auto w-1/4 max-lg:w-1/3 max-md:w-1/2 max-sm:w-full p-4">
          <h1 className="text-2xl font-bold mb-4">Arithmetic Game</h1>
          <p className="mb-4">
            The Arithmetic Game is a fast-paced speed drill where you are given
            two minutes to solve as many arithmetic problems as you can.
          </p>
          <p className="mb-4">If you have any questions, please contact me.</p>
          <h2 className="text-xl font-semibold mb-2">Addition</h2>
          <p className="mb-4">
            <input
              type="checkbox"
              checked={selectedOps.add}
              onChange={() => setSelectedOps((p) => ({ ...p, add: !p.add }))}
            />{" "}
            Range: (
            <input
              type="number"
              className="border p-1 w-16 mx-1"
              value={addRange.min1}
              onChange={(e: h.JSX.TargetedEvent<HTMLInputElement>) =>
                handleRangeChange(
                  setAddRange,
                  addRange,
                  "min1",
                  e.currentTarget.value
                )
              }
            />
            to
            <input
              type="number"
              className="border p-1 w-16 mx-1"
              value={addRange.max1}
              onChange={(e: h.JSX.TargetedEvent<HTMLInputElement>) =>
                handleRangeChange(
                  setAddRange,
                  addRange,
                  "max1",
                  e.currentTarget.value
                )
              }
            />
            ) + (
            <input
              type="number"
              className="border p-1 w-16 mx-1"
              value={addRange.min2}
              onChange={(e: h.JSX.TargetedEvent<HTMLInputElement>) =>
                handleRangeChange(
                  setAddRange,
                  addRange,
                  "min2",
                  e.currentTarget.value
                )
              }
            />
            to
            <input
              type="number"
              className="border p-1 w-16 mx-1"
              value={addRange.max2}
              onChange={(e: h.JSX.TargetedEvent<HTMLInputElement>) =>
                handleRangeChange(
                  setAddRange,
                  addRange,
                  "max2",
                  e.currentTarget.value
                )
              }
            />
            )
          </p>
          <h2 className="text-xl font-semibold mb-2">Subtraction</h2>
          <p className="mb-4">
            <input
              type="checkbox"
              checked={selectedOps.sub}
              onChange={() => setSelectedOps((p) => ({ ...p, sub: !p.sub }))}
            />{" "}
            Addition problems in reverse.
          </p>
          <h2 className="text-xl font-semibold mb-2">Multiplication</h2>
          <p className="mb-4">
            <input
              type="checkbox"
              checked={selectedOps.mult}
              onChange={() => setSelectedOps((p) => ({ ...p, mult: !p.mult }))}
            />{" "}
            Range: (
            <input
              type="number"
              className="border p-1 w-16 mx-1"
              value={multRange.min1}
              onChange={(e: h.JSX.TargetedEvent<HTMLInputElement>) =>
                handleRangeChange(
                  setMultRange,
                  multRange,
                  "min1",
                  e.currentTarget.value
                )
              }
            />
            to
            <input
              type="number"
              className="border p-1 w-16 mx-1"
              value={multRange.max1}
              onChange={(e: h.JSX.TargetedEvent<HTMLInputElement>) =>
                handleRangeChange(
                  setMultRange,
                  multRange,
                  "max1",
                  e.currentTarget.value
                )
              }
            />
            ) × (
            <input
              type="number"
              className="border p-1 w-16 mx-1"
              value={multRange.min2}
              onChange={(e: h.JSX.TargetedEvent<HTMLInputElement>) =>
                handleRangeChange(
                  setMultRange,
                  multRange,
                  "min2",
                  e.currentTarget.value
                )
              }
            />
            to
            <input
              type="number"
              className="border p-1 w-16 mx-1"
              value={multRange.max2}
              onChange={(e: h.JSX.TargetedEvent<HTMLInputElement>) =>
                handleRangeChange(
                  setMultRange,
                  multRange,
                  "max2",
                  e.currentTarget.value
                )
              }
            />
            )
          </p>
          <h2 className="text-xl font-semibold mb-2">Division</h2>
          <p className="mb-4">
            <input
              type="checkbox"
              checked={selectedOps.div}
              onChange={() => setSelectedOps((p) => ({ ...p, div: !p.div }))}
            />{" "}
            Multiplication problems in reverse.
          </p>
          <h2 className="text-xl font-semibold mb-2">Duration:</h2>
          <input
            type="number"
            className="border p-1 w-20"
            value={duration}
            onChange={(e: h.JSX.TargetedEvent<HTMLInputElement>) => {
              const num = parseInt(e.currentTarget.value, 10);
              if (!isNaN(num)) setDuration(num);
            }}
          />
          <button
            className="bg-blue-500 text-white p-2 rounded mt-4 mr-4"
            onClick={startGame}
          >
            Start
          </button>
          <button
            className="bg-green-500 text-white p-2 rounded"
            onClick={handleShare}
          >
            Share Config
          </button>
        </div>
      </>
    );
  } else if (gameState === "playing") {
    return (
      <>
        <div className="flex flex-col items-center justify-center h-[99%]">
          <div className="flex justify-between w-full max-w-md mb-4">
            <p>Time: {timeLeft} s</p>
            <p>Score: {score}</p>
          </div>
          {currentProblem && (
            <h1 className="text-4xl mb-4">{currentProblem.question}</h1>
          )}
          <input
            type="number"
            className="border p-2 text-2xl w-32 text-center"
            value={inputValue}
            onChange={(e: h.JSX.TargetedEvent<HTMLInputElement>) =>
              setInputValue(e.currentTarget.value)
            }
            onKeyDown={handleKeyDown}
            ref={inputRef}
          />
        </div>
      </>
    );
  } else {
    return (
      <>
        <div className="flex flex-col items-center justify-center h-[99%]">
          <h1 className="text-3xl font-bold mb-4">Game Over</h1>
          <p className="text-2xl mb-4">Score: {score}</p>
          <button
            className="bg-blue-500 text-white p-2 rounded"
            onClick={() => setGameState("start")}
          >
            Play Again
          </button>
        </div>
      </>
    );
  }
}
