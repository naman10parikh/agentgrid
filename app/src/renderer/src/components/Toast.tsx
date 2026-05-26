/**
 * Toast — Lightweight notification system for AgentGrid.
 * Shows success, error, info, warning messages that auto-dismiss.
 */

import { useState, useCallback, useEffect, useRef } from "react";

type ToastType = "success" | "error" | "info" | "warning";

interface ToastMessage {
  id: number;
  type: ToastType;
  message: string;
  duration: number;
}

const TOAST_COLORS: Record<ToastType, { bg: string; border: string; text: string }> = {
  success: {
    bg: "rgba(34, 197, 94, 0.12)",
    border: "rgba(34, 197, 94, 0.3)",
    text: "#22c55e",
  },
  error: {
    bg: "rgba(239, 68, 68, 0.12)",
    border: "rgba(239, 68, 68, 0.3)",
    text: "#ef4444",
  },
  info: {
    bg: "rgba(59, 130, 246, 0.12)",
    border: "rgba(59, 130, 246, 0.3)",
    text: "#3b82f6",
  },
  warning: {
    bg: "rgba(234, 179, 8, 0.12)",
    border: "rgba(234, 179, 8, 0.3)",
    text: "#eab308",
  },
};

let toastIdCounter = 0;
let globalAddToast: ((type: ToastType, message: string, duration?: number) => void) | null = null;

/** Call from anywhere to show a toast */
export function showToast(type: ToastType, message: string, duration = 3000): void {
  globalAddToast?.(type, message, duration);
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((type: ToastType, message: string, duration = 3000) => {
    const id = ++toastIdCounter;
    setToasts((prev) => [...prev, { id, type, message, duration }]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Register global accessor
  useEffect(() => {
    globalAddToast = addToast;
    return () => {
      globalAddToast = null;
    };
  }, [addToast]);

  return (
    <div
      style={{
        position: "fixed",
        bottom: 40,
        right: 16,
        display: "flex",
        flexDirection: "column",
        gap: 6,
        zIndex: 9999,
        pointerEvents: "none",
      }}
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDismiss }: { toast: ToastMessage; onDismiss: () => void }) {
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const colors = TOAST_COLORS[toast.type];

  useEffect(() => {
    timerRef.current = setTimeout(onDismiss, toast.duration);
    return () => clearTimeout(timerRef.current);
  }, [toast.duration, onDismiss]);

  return (
    <div
      style={{
        padding: "8px 14px",
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        borderRadius: 8,
        color: colors.text,
        fontSize: 12,
        fontFamily: "var(--font-mono)",
        pointerEvents: "auto",
        cursor: "pointer",
        backdropFilter: "blur(8px)",
        animation: "toast-in 200ms ease-out",
        maxWidth: 320,
      }}
      onClick={onDismiss}
    >
      {toast.message}
      <style>{`
        @keyframes toast-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
