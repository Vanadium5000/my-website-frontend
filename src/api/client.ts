import { Api } from "./api";

export const api = new Api({
  securityWorker: () => ({
    // headers: {
    //   Authorization: `Bearer ${localStorage.getItem("token")}`,
    // },
    credentials: "include",
  }),
});
