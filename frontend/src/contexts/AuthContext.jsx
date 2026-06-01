import { createContext, useContext, useEffect, useState } from "react";
import { loginUser, registerUser, setAuthToken } from "../api";

const AUTH_STORAGE_KEY = "smart-cafe-finder-auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // FIX: Wrap localStorage read in try/catch.
  // Corrupted JSON (from browser extensions, partial writes, etc.) previously
  // caused an uncaught SyntaxError that crashed the entire React tree on startup.
  const [auth, setAuth] = useState(() => {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      return saved ? JSON.parse(saved) : { token: "", user: null };
    } catch {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      return { token: "", user: null };
    }
  });

  useEffect(() => {
    setAuthToken(auth.token);
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
    } catch {
      // localStorage can throw if storage quota is exceeded (e.g. private mode on some browsers)
      console.warn("Could not persist auth state to localStorage");
    }
  }, [auth]);

  const login = async (payload) => {
    const response = await loginUser(payload);
    setAuth(response.data);
    return response.data;
  };

  const register = async (payload) => {
    const response = await registerUser(payload);
    setAuth(response.data);
    return response.data;
  };

  const logout = () => {
    setAuth({ token: "", user: null });
    setAuthToken("");
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  return (
    <AuthContext.Provider
      value={{
        token: auth.token,
        user: auth.user,
        isAuthenticated: Boolean(auth.token && auth.user),
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
