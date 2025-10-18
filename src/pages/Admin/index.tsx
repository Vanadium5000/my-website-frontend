import { Navbar } from "../../components/Navbar";
import { FaShieldAlt, FaUserShield, FaCommentDots } from "react-icons/fa";

export function AdminHome() {
  return (
    <>
      <Navbar />
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
        </div>
      </div>
    </>
  );
}
