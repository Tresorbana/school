import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import type { ReactNode } from "react";
import { BiX } from "react-icons/bi";

type ToastType = "success" | "error" | "info" | "warning";

type Toast = {
  id: number;
  title?: string;
  message: string;
  type?: ToastType;
  duration?: number;
  startTime?: number;
};

type ToastContextType = {
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: number) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within a ToastProvider");
  return context;
};

const DEFAULT_DURATION = 4000;

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((toast: Omit<Toast, "id" | "startTime">) => {
    const id = Date.now() + Math.random();
    const duration = toast.duration ?? DEFAULT_DURATION;
    const startTime = Date.now();

    setToasts((prev) => [...prev, { id, ...toast, duration, startTime }]);
    setTimeout(() => removeToast(id), duration);
  }, [removeToast]);

  const value = useMemo(() => ({ addToast, removeToast }), [addToast, removeToast]);

  const ToastItem = ({ toast, onRemove }: { toast: Toast; onRemove: (id: number) => void }) => {
    const [progress, setProgress] = useState(100);
    const [remainingSeconds, setRemainingSeconds] = useState(0);

    useEffect(() => {
      if (!toast.duration || !toast.startTime) return;

      const interval = setInterval(() => {
        const elapsed = Date.now() - toast.startTime!;
        const remaining = Math.max(0, toast.duration! - elapsed);
        const progressPercent = (remaining / toast.duration!) * 100;
        const seconds = Math.ceil(remaining / 1000);

        setProgress(progressPercent);
        setRemainingSeconds(seconds);

        if (remaining <= 0) {
          clearInterval(interval);
        }
      }, 50); // Update every 50ms for smooth animation

      return () => clearInterval(interval);
    }, [toast.duration, toast.startTime]);

    const typeColor: Record<ToastType, string> = {
      success: "#22c55e",
      error: "#ef4444",
      warning: "#facc15",
      info: "#3b82f6",
    };

    const mainColor = "#001240";

    return (
      <div
        className="relative px-3 py-2 rounded shadow-lg flex items-start gap-2 min-w-[280px] max-w-[320px] bg-white overflow-hidden"
        style={{
          border: `1px solid ${mainColor}`,
          boxShadow: `0 2px 4px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.05)`,
        }}
      >
        {/* Progress Bar */}
        <div
          className="absolute bottom-0 left-0 h-1 transition-all duration-75 ease-linear"
          style={{
            width: `${progress}%`,
            backgroundColor: toast.type ? typeColor[toast.type] : "#3b82f6",
            opacity: 0.3
          }}
        />

        {/* Colored Type Box */}
        <div
          className="w-3 h-3 mt-0.5 rounded-sm flex-shrink-0"
          style={{ backgroundColor: toast.type ? typeColor[toast.type] : "#3b82f6" }}
        ></div>

        {/* Content */}
        <div className="flex-1">
          {toast.title && (
            <div
              className="font-semibold text-sm"
              style={{ color: toast.type ? typeColor[toast.type] : "#3b82f6" }}
            >
              {toast.title}
            </div>
          )}
          <div className="text-gray-700 text-xs mt-0.5">{toast.message}</div>
          {/* Time remaining indicator */}
          {toast.duration && toast.duration > 4000 && remainingSeconds > 0 && (
            <div className="text-gray-400 text-xs mt-1 hidden">
              {remainingSeconds}s remaining
            </div>
          )}
        </div>

        {/* Close Button */}
        <button
          className="text-gray-400 hover:text-gray-600 text-sm hover:bg-main/10 p-1 rounded-full"
          onClick={() => onRemove(toast.id)}
        >
          <BiX size={14} />
        </button>
      </div>
    );
  };

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div className="fixed top-4 right-4 flex flex-col gap-2 z-50">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};
