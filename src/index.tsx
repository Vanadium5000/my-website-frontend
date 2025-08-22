import { render } from "preact";
import { LocationProvider, Router, Route } from "preact-iso";

import { Footer } from "./components/Footer.jsx";
import { Home } from "./pages/Home/index.jsx";
import { Projects } from "./pages/Projects/index.js";
import { About } from "./pages/Info/about.js";
import { NotFound } from "./pages/_404.jsx";
import "./style.css";

export function App() {
  return (
    <LocationProvider>
      <div class="flex min-h-screen flex-col">
        {/* <Navbar /> */}
        <main>
          <Router>
            <Route path="/" component={Home} />
            <Route path="/projects" component={Projects} />
            <Route path="/about" component={About} />
            <Route default component={NotFound} />
          </Router>
        </main>
        <Footer />
      </div>
    </LocationProvider>
  );
}

render(<App />, document.getElementById("app"));
