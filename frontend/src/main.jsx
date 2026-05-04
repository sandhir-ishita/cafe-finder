import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { setAuthToken } from "./api";
import { AuthProvider } from "./contexts/AuthContext";
import { ToastProvider } from "./contexts/ToastContext";
import ErrorBoundary from "./components/ErrorBoundary";
import "./index.css";

const savedAuth = localStorage.getItem("smart-cafe-finder-auth");
if (savedAuth) {
  const parsed = JSON.parse(savedAuth);
  if (parsed?.token) {
    setAuthToken(parsed.token);
  }
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
