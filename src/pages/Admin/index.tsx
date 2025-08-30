import { Navbar } from "../../components/Navbar.jsx";
import { api } from "../../api/client.js";
import { useEffect, useState } from "preact/hooks";

export function AdminHome() {
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const response = await api.hello.helloList();
        const data = await response.json();

        if (!data.is_admin) {
          console.log("Not admin: redirecting to /login");
          window.location.href = "/login";
          return;
        }
      } catch (error) {
        if (error?.status == 401) {
          console.log("401 error: redirecting to /login");
          window.location.href = "/login";
          return;
        }

        const errorMessage =
          error instanceof Error ? error.message : "Fetching blogs failed";
        setError(errorMessage);
        console.error("Error:", error);
      }
    })();
  }, []);

  return (
    <>
      <Navbar />
    </>
  );
}
