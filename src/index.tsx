import { render } from "preact";
import { LocationProvider, Router, Route } from "preact-iso";

import { Footer } from "./components/Footer.jsx";
import { BlogHome } from "./pages/Blog/index.js";
import { BlogPost } from "./pages/Blog/post.js";
import { Home } from "./pages/Home/index.jsx";
import { About } from "./pages/Info/about.js";
import { Login } from "./pages/Login/index.js";
import { Projects } from "./pages/Projects/index.js";
import { Signup } from "./pages/Signup/index.js";
import { NotFound } from "./pages/404.js";
import "./style.css";

export function App() {
  return (
    <LocationProvider>
      <div
        class="flex min-h-screen flex-col"
        // data-theme={localStorage.getItem("theme") || "dark"}
      >
        {/* <Navbar /> */}
        <script
          src="https://kit.fontawesome.com/783385aa49.js"
          crossorigin="anonymous"
        ></script>
        <main>
          <Router>
            <Route path="/" component={Home} />
            <Route path="/blog" component={BlogHome} />
            <Route path="/blog/:id" component={BlogPost} />
            {/* Dynamic route */}
            <Route path="/about" component={About} />
            <Route path="/login" component={Login} />
            <Route path="/projects" component={Projects} />
            <Route path="/signup" component={Signup} />
            <Route default component={NotFound} />
          </Router>
        </main>
        <Footer />
      </div>
    </LocationProvider>
  );
}

render(<App />, document.getElementById("app"));
