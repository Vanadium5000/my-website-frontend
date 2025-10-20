import { useContext, useState } from "preact/hooks";
import { createContext } from "preact";

interface Toast {
  id: number;
  text: string;
  type: "info" | "success" | "warning" | "error";
  time: number;
}

type AddToast = (toast: Omit<Toast, "id">) => void;

const ToastContext = createContext<AddToast | null>(null);

export function ToastProvider({
  children,
}: {
  children: preact.ComponentChildren;
}) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast: AddToast = (newToast) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { ...newToast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, newToast.time);
  };

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div className="toast toast-end">
        {toasts.map((toast) => (
          <div key={toast.id} className={`alert alert-${toast.type}`}>
            <span>{toast.text}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useSpawnToast() {
  const addToast = useContext(ToastContext);
  if (!addToast) {
    throw new Error("useSpawnToast must be used within a ToastProvider");
  }
  return addToast;
}
