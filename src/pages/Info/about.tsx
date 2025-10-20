import { useState } from "preact/hooks";
import logo from "../../assets/logo.png";
import { useSpawnToast } from "../../components/technical/ToastProvider";

export function About() {
  const spawnToast = useSpawnToast();
  const [amount, setAmount] = useState(0);

  const handleClick = () => {
    spawnToast({
      text: `Number: ${amount}`,
      type: "success",
      time: 3000, // time in milliseconds
    });

    setAmount(amount + 1);
  };

  return (
    <>
      <div className="sm:float-left sm:w-1/2 p-4">
        <h1 class="text-4xl font-bold mb-3">About</h1>
        <p>Hello!</p>
        <p>This is my website, which is yet to be completed.</p>
        <p>
          Check out{" "}
          <a href="/projects/pong" class="text-blue-500">
            my Rust pong game
          </a>
        </p>
      </div>
      <div className="sm:float-right sm:w-1/2 mx-auto">
        <img src={logo} className="p-4 w-[80%]" />
      </div>
      <button class="btn btn-active" onClick={handleClick}>
        Click me
      </button>
    </>
  );
}
