import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
});

export function setAuthToken(token) {
  if (token) {
    API.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete API.defaults.headers.common.Authorization;
  }
}

// Intercept 401 responses to auto-logout users with expired tokens.
// Without this, the UI stays "logged in" while every API call silently fails.
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401 &&
      !error.config.url?.includes("/api/auth/")
    ) {
      localStorage.removeItem("smart-cafe-finder-auth");
      delete API.defaults.headers.common.Authorization;
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export const registerUser = (payload) => API.post("/api/auth/register", payload);
export const loginUser = (payload) => API.post("/api/auth/login", payload);

export const getCafes = (params) => API.get("/api/cafes", { params });
export const getCafeById = (id) => API.get(`/api/cafes/${id}`);
export const createCafe = (payload) => API.post("/api/cafes", payload);
export const updateCafe = (id, payload) => API.put(`/api/cafes/${id}`, payload);
export const deleteCafe = (id) => API.delete(`/api/cafes/${id}`);

export const addFavorite = (payload) => API.post("/api/favorites", payload);
export const getFavorites = (userId) => API.get(`/api/favorites/${userId}`);
export const removeFavorite = (favoriteId) => API.delete(`/api/favorites/${favoriteId}`);

export const getReviews = (cafeId) => API.get(`/api/reviews/cafe/${cafeId}`);
export const addReview = (payload) => API.post("/api/reviews", payload);

export const getRecommendations = (params) => API.get("/api/recommendations", { params });
export const getDirections = (params) => API.get("/api/maps/directions", { params });
export const searchPlaces = (params) => API.get("/api/maps/places", { params });
export const importCafesFromPlaces = (payload) => API.post("/api/maps/import-cafes", payload);

export const sendChatMessage = (payload) => API.post("/api/chat", payload);

export default API;
