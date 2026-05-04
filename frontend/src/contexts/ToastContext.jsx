import { createContext, useContext, useMemo, useState } from "react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const api = useMemo(
    () => ({
      showToast(message, type = "info") {
        const id = `${Date.now()}-${Math.random()}`;
        setToasts((current) => [...current, { id, message, type }]);
        setTimeout(() => {
          setToasts((current) => current.filter((toast) => toast.id !== id));
        }, 3200);
      },
    }),
    []
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toast-stack">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast--${toast.type}`}>
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
