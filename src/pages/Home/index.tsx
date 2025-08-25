import { Navbar } from "../../components/Navbar.jsx";
import randomImage from "/random-image.jpg";
import "./style.css";

export function Home() {
  return (
    <>
      <Navbar />
      <div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center p-8 bg-black/80 text-white">
          <h1 className="text-8xl font-semibold mb-2">
            My
            <br />
            Website
            <span className="blink">_</span>
          </h1>
          <p>Hi</p>
        </div>
      </div>
      {/* <div id="content">
        <div id="projPics" class="bg-white">
          <div class="image_container1">
            <img src={randomImage} class="proj" />
            <img src={randomImage} class="proj" />
            <img src={randomImage} class="proj" />
          </div>

          <div class="image_container2">
            <img src={randomImage} class="proj" />
            <img src={randomImage} class="proj" />
            <img src={randomImage} class="proj" />
          </div>

          <div class="image_container3">
            <img src={randomImage} class="proj" />
            <img src={randomImage} class="proj" />
            <img src={randomImage} class="proj" />
          </div>
        </div>
        <div
          className={
            "mt-auto border-t-2 border-[#eaecef] dark:border-[hsla(0,0%,100%,.1)] text-[#2c3e50] dark:text-white"
          }
        >
          <p className={"float-left mx-4 my-4"}>&copy; Me, 2023</p>
        </div>
      </div> */}
    </>
  );
}
