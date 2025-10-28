import { render } from "preact";
import { LocationProvider, Router, Route } from "preact-iso";

import { Footer } from "./components/Footer.jsx";
import { BlogHome } from "./pages/Blog/index.js";
import { BlogPost } from "./pages/Blog/post.js";
import { Home } from "./pages/Home/index.jsx";
import { About } from "./pages/Info/about.js";
import { Changelog } from "./pages/Info/changelog.js";
import { Login } from "./pages/Login/index.js";
import { Projects } from "./pages/Projects/index.js";
import { ChessGame } from "./pages/Projects/chess.js";
import { Arithmetic } from "./pages/Projects/arithmetic.js";
import { Quizspire } from "./pages/Projects/quizspire.js";
import { QuizspireView } from "./pages/Projects/quizspire-view.js";
import { QuizspireLearn } from "./pages/Projects/quizspire-learn.js";
import { Tetris } from "./pages/Projects/tetris.js";
import { Signup } from "./pages/Signup/index.js";
import { EmailVerification } from "./pages/EmailVerification/index.js";
import { AdminHome } from "./pages/Admin/index";
import { AdminUsers } from "./pages/Admin/Users";
import { AdminComments } from "./pages/Admin/Comments";
import { AdminConnections } from "./pages/Admin/Connections";
import { AdminProfiles } from "./pages/Admin/Profiles";
import { Settings } from "./pages/Settings/index";
import { NameSettings } from "./pages/Settings/Name";
import { PasswordSettings } from "./pages/Settings/Password";
import { ConnectedAccountsSettings } from "./pages/Settings/ConnectedAccounts";
import { SessionsSettings } from "./pages/Settings/Sessions";
import { ImagesSettings } from "./pages/Settings/Images";
import { NotificationsSettings } from "./pages/Settings/Notifications";
import { DeleteAccountSettings } from "./pages/Settings/DeleteAccount";
import { NotFound } from "./pages/404.js";
import { Profile } from "./pages/Profile/index.js";
import "./style.css";
import { Leaderboards } from "./pages/Leaderboards/index.js";
import { Navbar } from "./components/Navbar.js";
import { ToastProvider } from "./components/technical/ToastProvider.js";
import { Connection } from "./components/technical/Connection.js";

export function App() {
  return (
    <LocationProvider>
      <ToastProvider>
        <Connection />
        <div class="flex min-h-screen flex-col">
          <Navbar />
          <main>
            <Router>
              <Route path="/" component={Home} />
              <Route path="/blog" component={BlogHome} />
              {/* Dynamic route */}
              <Route path="/blog/:id" component={BlogPost} />
              <Route path="/about" component={About} />
              <Route path="/changelog" component={Changelog} />
              <Route path="/leaderboards" component={Leaderboards} />
              <Route path="/login" component={Login} />
              <Route path="/projects" component={Projects} />
              <Route path="/projects/chess" component={ChessGame} />
              <Route path="/projects/arithmetic" component={Arithmetic} />
              <Route path="/projects/quizspire" component={Quizspire} />
              <Route path="/projects/quizspire/:id" component={QuizspireView} />
              <Route
                path="/projects/quizspire/:id/learn"
                component={QuizspireLearn}
              />
              <Route path="/projects/tetris" component={Tetris} />
              <Route path="/signup" component={Signup} />
              <Route path="/email-verification" component={EmailVerification} />
              <Route path="/admin" component={AdminHome} />
              <Route path="/admin/users" component={AdminUsers} />
              <Route path="/admin/comments" component={AdminComments} />
              <Route path="/admin/connections" component={AdminConnections} />
              <Route path="/admin/profiles" component={AdminProfiles} />
              <Route path="/settings" component={Settings} />
              <Route path="/settings/name" component={NameSettings} />
              <Route path="/settings/password" component={PasswordSettings} />
              <Route
                path="/settings/accounts"
                component={ConnectedAccountsSettings}
              />
              <Route path="/settings/sessions" component={SessionsSettings} />
              <Route
                path="/settings/notifications"
                component={NotificationsSettings}
              />
              <Route path="/settings/images" component={ImagesSettings} />
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
