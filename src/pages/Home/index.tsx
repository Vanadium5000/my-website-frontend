import "./style.css";

export function Home() {
  return (
    <>
      <div className="h-[100%] grid place-items-center" id="homescreen">
        <div className="min-w-1/4 text-center p-8 bg-black/80 text-white">
          <h1 className="text-8xl font-semibold mb-2">
            My
            <br />
            Website
            <span className="blink">_</span>
          </h1>
          <p>Hi</p>
        </div>
      </div>
    </>
  );
}
