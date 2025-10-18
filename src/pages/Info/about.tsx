import { Navbar } from "../../components/Navbar.jsx";
import logo from "../../assets/logo.png";

export function About() {
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
    </>
  );
}
