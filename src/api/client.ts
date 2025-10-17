import { Api } from "./api";

export const api = new Api({
  baseUrl:
    import.meta.env.MODE === "production"
      ? "http://my-website.space/backend"
      : "http://localhost:3000",
  securityWorker: () => ({
    // headers: {
    //   Authorization: `Bearer ${localStorage.getItem("token")}`,
    // },
    credentials: "include",
  }),
});
