import { Helmet } from "react-helmet";
import {
  FaShieldAlt,
  FaUserShield,
  FaCommentDots,
  FaPlug,
  FaUserCheck,
} from "react-icons/fa";

export function AdminHome() {
  return (
    <>
      <Helmet>
        <title>Admin Panel - My Website</title>
        <meta
          name="description"
          content="Administrative control panel for managing users, comments, connections, and profile verifications. Access administrative tools and moderation features."
        />
        <meta
          name="keywords"
          content="admin panel, administration, user management, moderation, admin tools, control panel"
        />
        <link rel="canonical" href="/admin" />
        <meta property="og:title" content="Admin Panel - My Website" />
        <meta
          property="og:description"
          content="Administrative control panel for managing users, comments, connections, and profile verifications. Access administrative tools and moderation features."
        />
        <meta property="og:image" content="/logo.png" />
        <meta property="og:url" content="/admin" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Admin Panel - My Website" />
        <meta
          name="twitter:description"
          content="Administrative control panel for managing users, comments, connections, and profile verifications. Access administrative tools and moderation features."
        />
        <meta name="twitter:image" content="/logo.png" />
      </Helmet>
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
          <FaShieldAlt />
          Admin Panel
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <a
            href="/admin/users"
            className="card shadow-lg hover:shadow-xl transition-shadow duration-300"
          >
            <div className="card-body items-center text-center">
              <FaUserShield className="w-12 h-12 text-primary mb-4" />
              <h2 className="card-title">User Management</h2>
              <p>
                Manage users, ban/unban, change passwords, and add custom fields
              </p>
            </div>
          </a>

          <a
            href="/admin/comments"
            className="card shadow-lg hover:shadow-xl transition-shadow duration-300"
          >
            <div className="card-body items-center text-center">
              <FaCommentDots className="w-12 h-12 text-secondary mb-4" />
              <h2 className="card-title">Pending Comments</h2>
              <p>Review and accept pending blog comments</p>
            </div>
          </a>

          <a
            href="/admin/connections"
            className="card shadow-lg hover:shadow-xl transition-shadow duration-300"
          >
            <div className="card-body items-center text-center">
              <FaPlug className="w-12 h-12 text-success mb-4" />
              <h2 className="card-title">Connection Management</h2>
              <p>
                Monitor active WebSocket connections, send events and
                notifications
              </p>
            </div>
          </a>

          <a
            href="/admin/profiles"
            className="card shadow-lg hover:shadow-xl transition-shadow duration-300"
          >
            <div className="card-body items-center text-center">
              <FaUserCheck className="w-12 h-12 text-info mb-4" />
              <h2 className="card-title">Profile Verification</h2>
              <p>
                Verify or reject changes to user profiles including names and
                icons
              </p>
            </div>
          </a>
        </div>
      </div>
    </>
  );
}
