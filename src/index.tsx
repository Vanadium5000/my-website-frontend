import { render } from "preact";
import { LocationProvider, Router, Route } from "preact-iso";

import { Footer } from "./components/Footer.jsx";
import { BlogHome } from "./pages/Blog/index.js";
import { BlogPost } from "./pages/Blog/post.js";
import { Home } from "./pages/Home/index.jsx";
import { About } from "./pages/Info/about.js";
import { Login } from "./pages/Login/index.js";
import { Projects } from "./pages/Projects/index.js";
import { ChessGame } from "./pages/Projects/chess.js";
import { Arithmetic } from "./pages/Projects/arithmetic.js";
import { Signup } from "./pages/Signup/index.js";
import { AdminHome } from "./pages/Admin/index";
import { AdminUsers } from "./pages/Admin/Users";
import { AdminComments } from "./pages/Admin/Comments";
import { Settings } from "./pages/Settings/index";
import { NameSettings } from "./pages/Settings/Name";
import { PasswordSettings } from "./pages/Settings/Password";
import { ConnectedAccountsSettings } from "./pages/Settings/ConnectedAccounts";
import { SessionsSettings } from "./pages/Settings/Sessions";
import { DeleteAccountSettings } from "./pages/Settings/DeleteAccount";
import { NotFound } from "./pages/404.js";
import { Profile } from "./pages/Profile/index.js";
import "./style.css";
import { Leaderboards } from "./pages/Leaderboards/index.js";
import { Navbar } from "./components/Navbar.js";
import { ToastProvider } from "./components/technical/ToastProvider.js";

export function App() {
  return (
    <LocationProvider>
      <ToastProvider>
        <div class="flex min-h-screen flex-col">
          <Navbar />
          <main>
            <Router>
              <Route path="/" component={Home} />
              <Route path="/blog" component={BlogHome} />
              {/* Dynamic route */}
              <Route path="/blog/:id" component={BlogPost} />
              <Route path="/about" component={About} />
              <Route path="/leaderboards" component={Leaderboards} />
              <Route path="/login" component={Login} />
              <Route path="/projects" component={Projects} />
              <Route path="/projects/chess" component={ChessGame} />
              <Route path="/projects/arithmetic" component={Arithmetic} />
              <Route path="/signup" component={Signup} />
              <Route path="/admin" component={AdminHome} />
              <Route path="/admin/users" component={AdminUsers} />
              <Route path="/admin/comments" component={AdminComments} />
              <Route path="/settings" component={Settings} />
              <Route path="/settings/name" component={NameSettings} />
              <Route path="/settings/password" component={PasswordSettings} />
              <Route
                path="/settings/accounts"
                component={ConnectedAccountsSettings}
              />
              <Route path="/settings/sessions" component={SessionsSettings} />
              <Route
                path="/settings/delete"
                component={DeleteAccountSettings}
              />
              <Route path="/profile/:id?" component={Profile} />
              <Route default component={NotFound} />
            </Router>
          </main>
          <Footer />
        </div>
      </ToastProvider>
    </LocationProvider>
  );
}

render(<App />, document.getElementById("app"));
