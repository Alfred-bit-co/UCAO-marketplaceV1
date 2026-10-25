"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, X } from "@/lib/icons";

type ToastKind = "success" | "error";

type ToastItem = {
  id: number;
  kind: ToastKind;
  title: string;
  description?: string;
};

type ToastApi = {
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
};

const MAX_TOASTS = 4;
const DURATION_MS: Record<ToastKind, number> = { success: 4000, error: 6000 };

const noop = () => {};
const ToastContext = createContext<ToastApi>({ success: noop, error: noop });

/** Affiche une notification : const toast = useToast(); toast.success("Produit ajouté"); */
export function useToast(): ToastApi {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(1);
  const timers = useRef(new Map<number, number>());

  const dismiss = useCallback((id: number) => {
    const timer = timers.current.get(id);
    if (timer !== undefined) {
      window.clearTimeout(timer);
      timers.current.delete(id);
    }
    setToasts((current) => current.filter((item) => item.id !== id));
  }, []);

  const push = useCallback(
    (kind: ToastKind, title: string, description?: string) => {
      const id = nextId.current++;
      setToasts((current) => [...current, { id, kind, title, description }].slice(-MAX_TOASTS));
      timers.current.set(id, window.setTimeout(() => dismiss(id), DURATION_MS[kind]));
    },
    [dismiss],
  );

  useEffect(() => {
    const active = timers.current;
    return () => {
      active.forEach((timer) => window.clearTimeout(timer));
      active.clear();
    };
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      success: (title, description) => push("success", title, description),
      error: (title, description) => push("error", title, description),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:bottom-6 sm:right-6 sm:top-auto sm:items-end sm:px-0"
      >
        {toasts.map((item) => (
          <div
            key={item.id}
            role={item.kind === "error" ? "alert" : "status"}
            className="toast-enter pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-ucao border border-ucao-line bg-white p-4 shadow-ucao dark:border-[#2a3a52] dark:bg-[#132238]"
          >
            <span
              className={
                "grid size-9 shrink-0 place-items-center rounded-full " +
                (item.kind === "error" ? "bg-ucao-red-soft text-ucao-red" : "bg-ucao-success-soft text-ucao-success")
              }
            >
              {item.kind === "error" ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="text-sm font-semibold">{item.title}</p>
              {item.description && (
                <p className="mt-0.5 text-sm text-ucao-muted dark:text-[#a8b8cc]">{item.description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => dismiss(item.id)}
              aria-label="Fermer la notification"
              className="grid size-7 shrink-0 place-items-center rounded-full text-ucao-muted transition hover:bg-ucao-soft dark:hover:bg-[#1b2d47]"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
