import { useLocation } from "preact-iso";

export function Navbar() {
  const { url } = useLocation();
  const path = url;

  return (
    // <header>
    //   <nav>
    //     <a href="/" class={url == "/" && "active"}>
    //       Home
    //     </a>
    //     <a href="/404" class={url == "/404" && "active"}>
    //       404
    //     </a>
    //   </nav>
    // </header>
    <div
      className={
        "z-10 m-0 p-0 overflow-hidden border-b-2 border-[#eaecef] dark:border-[#ffffff1a] bg-white dark:bg-[#1a1a1a]"
      }
      id="navbar"
    >
      <Element url="/" name="Home" />
      <div class="group float-left text-[#2c3e50] dark:text-white">
        <div
          // Toggle info-dropdown on hover
          data-dropdown-toggle="info-dropdown"
          data-dropdown-trigger="hover"
          className={`px-4 py-4 text-center ${
            path == "/about" || path == "/contact"
              ? " text-[#2196f3]"
              : "text-[#2c3e50] dark:text-white"
          } group-hover:text-[#2196f3] hover:border-b-4 hover:border-[#2196f3] hover:pb-3 font-semibold mx-1 hover:cursor-default`}
        >
          Info <i class="fa-solid fa-caret-down" />
        </div>
        <div
          class="hidden absolute z-[1] group-hover:block max-w-[160px] font-semibold pt-4"
          id="info-dropdown"
        >
          <a
            href="/about"
            // The "box" class is defined in pages/style.css, it includes background color & top to bottom transition on hover
            class={`p-4 hover:text-[#2196f3] inline float-none text-left box${
              path == "/about" ? " text-[#2196f3]" : ""
            }`}
          >
            About
          </a>
          <a
            href="/contact"
            class={`p-4 hover:text-[#2196f3] inline float-none text-left box${
              path == "/contact" ? " text-[#2196f3]" : ""
            }`}
          >
            Contact
          </a>
        </div>
      </div>
      <Element url="/blog" name="Blog" />
      <Element url="/projects" name="Projects" />
      <a
        href="/login"
        class="float-right max-xsm:float-left m-2 px-2 py-2 text-center text-white bg-[#2196f3] rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
      >
        Log In
      </a>
      <a
        href="/"
        className={
          "float-right max-xsm:float-left px-4 py-4 text-center text-[#2c3e50] dark:text-white hover:text-[#2196f3]"
        }
      >
        Discord <LinkIcon />
      </a>
      <a
        href="/"
        className={
          "float-right max-xsm:float-left max-xsm:block px-4 py-4 text-center text-[#2c3e50] dark:text-white hover:text-[#2196f3]"
        }
      >
        GitHub <LinkIcon />
      </a>
    </div>
  );
}

function Element(props) {
  const { url } = useLocation();

  return (
    <a
      href={props.url}
      className={`float-left px-4 py-4 text-center${
        (url.startsWith(props.url) && props.url != "/") || url === props.url
          ? " text-[#2196f3]"
          : " text-[#2c3e50] dark:text-white"
      } hover:text-[#2196f3] hover:border-b-4 hover:border-[#2196f3] hover:pb-3 font-semibold mx-1`}
    >
      {props.name}
    </a>
  );
}

function LinkIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
      x="0px"
      y="0px"
      viewBox="0 0 100 100"
      width="16"
      height="16"
      className={
        "inline-block align-middle relative -top-px text-[#aaa]" // animate-spin"
      }
    >
      <path
        fill="currentColor"
        d="M18.8,85.1h56l0,0c2.2,0,4-1.8,4-4v-32h-8v28h-48v-48h28v-8h-32l0,0c-2.2,0-4,1.8-4,4v56C14.8,83.3,16.6,85.1,18.8,85.1z"
      ></path>
      <polygon
        fill="currentColor"
        points="45.7,48.7 51.3,54.3 77.2,28.5 77.2,37.2 85.2,37.2 85.2,14.9 62.8,14.9 62.8,22.9 71.5,22.9"
      ></polygon>
    </svg>
  );
}
