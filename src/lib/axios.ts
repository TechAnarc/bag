import axios from "axios";

export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://bag-azlo.onrender.com/api/v1";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Sends cookies automatically
});

// Interceptor: Double-Tap Token Injection
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("admin_access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor: Global 401 Session Handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && window.location.pathname.startsWith("/admin")) {
      if (window.location.pathname !== "/admin-signin") {
        localStorage.removeItem("admin_access_token");
        window.location.href = "/admin-signin";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
