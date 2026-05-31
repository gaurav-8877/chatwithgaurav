import axios from "axios";

// In production on Render: set VITE_API_URL in the Render frontend service dashboard
// e.g.  VITE_API_URL = https://chatwithgaurav-api.onrender.com/api
// In local dev: falls back to http://localhost:3000/api automatically
const BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.MODE === "development" ? "http://localhost:3000/api" : "/api");

export const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});
