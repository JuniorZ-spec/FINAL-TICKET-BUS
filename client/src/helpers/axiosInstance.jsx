// helpers/axiosInstance.js
import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "",
});

// Intercepteur pour ajouter le token automatiquement
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Rafraîchit le token d'accès expiré (15 min) via le refresh token (7 jours),
// pour éviter une déconnexion silencieuse en pleine session.
let refreshPromise = null;

const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) throw new Error("Aucun refresh token disponible");

  if (!refreshPromise) {
    refreshPromise = axios
      .post((import.meta.env.VITE_API_URL || "") + "/api/users/refresh", { refreshToken })
      .then((res) => {
        const { accessToken } = res.data.data;
        localStorage.setItem("token", accessToken);
        return accessToken;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
};

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const newToken = await refreshAccessToken();
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return axiosInstance(originalRequest);
      } catch {
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        const loginPath = window.location.pathname.startsWith("/admin")
          ? "/admin/login"
          : window.location.pathname.startsWith("/company")
            ? "/company/login"
            : "/login";
        window.location.href = loginPath;
      }
    }

    return Promise.reject(error);
  }
);
