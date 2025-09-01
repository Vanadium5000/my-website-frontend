import { Navbar } from "../../components/Navbar.js";
import { GameCard } from "../../components/GameCard.js";

export function Projects() {
  return (
    <>
      <Navbar />
      <h1 class="text-3xl mx-4 my-8">Projects</h1>
      <p class="text-blue-500 mt-8 mx-4">
        <a href="https://altus.deno.dev/projects/pong">
          Pong with perfect ai - maybe finished (and that is why this is first),
          but very basic
        </a>
      </p>
      <p class="mx-8">
        Pong: Contols = Up and Down arrow keys for "paddle" movement. It has
        taken about 1-4 days to make, the game (being very basic) itself was
        finished in a few hours, despite it being the first time I have used the
        libraries/even language! This is the first time I have used GGEZ, a game
        library with an unusual/common acronym, and also the first time I have
        used Rust, which is a programming langauge which is modern with often
        good error messages, but is limiting due to its safety features which
        try to minimise errors mostly to do with memory allocation and to
        improve error handling. Embedding it on my website took a long time with
        WASM, and was much more complicated than the game itself, this is due to
        GGEZ not having official WASM support, but a buggy ability to be
        compiled to WASM.
      </p>
      <p class="text-blue-500 mt-8 mx-4">
        <a href="https://altus.deno.dev/projects/connect4">
          Connect4 AI - breaks after 6th move, perfect player before then
        </a>
      </p>
      <p class="mx-8">
        Connect4 AI: Controls = just click (with a mouse) on the column you want
        to move on. Making it took about a day, but debugging why it didn't work
        took 6 more days. I still failed, and stopped working on it, I will
        probably eventually fix it. It also uses GGEZ and Rust, and compiling it
        to WASM was difficult.
      </p>
      <p class="text-blue-500 mt-8 mx-4">
        <a href="https://altus.deno.dev/projects/tetris_clone">
          Not a Tetris Clone - it barely has any features of tetris, really
          unfinished, and of course I don't have legal permission from Tetris
          <sup>TM</sup>, so for now it is not a Tetris clone
        </a>
      </p>
      <p class="mx-8">
        Not a Tetris Clone: Made with Macroquad (a much easier, more reliable,
        higher performant, less bloated, less limited, and so much more compared
        to GGEZ), and at the start it was great to work on. Unfortunately,
        having such an easy game library meant I could compile and test it much
        faster (about 25 minutes to compile GGEZ, a very very long time for
        something like this, and less than 30 seconds with Macroquad), which
        meant I added a lot more features and had higher expectations/goals for
        it. This meant I added around 2000 lines of code for just basic logic,
        and it became difficult to work on, and the editor features/intellisense
        did not work most of the time. In the future, I plan to limit its
        visibility with perhaps a password or something to avoid copyright
        issues.
      </p>
      {/* Cards */}
      <div class="p-4 mx-auto">
        <a href="https://altus.deno.dev/projects/pong">
          <GameCard
            title="Chess"
            description="Multiplayer chess game"
            image="/pong-paddles.png"
          />
        </a>
        <a href="https://altus.deno.dev/projects/pong">
          <GameCard
            title="Pong"
            description="The classic arcade game"
            image="/pong-paddles.png"
          />
        </a>
      </div>
    </>
  );
}
