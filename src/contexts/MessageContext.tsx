"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

type MessageVariant = "info" | "success" | "warning" | "error";

type Toast = {
  id: string;
  title?: string;
  message: string;
  variant: MessageVariant;
  duration: number;
};

type NotifyOptions =
  | string
  | {
      title?: string;
      message: string;
      variant?: MessageVariant;
      duration?: number;
    };

type ConfirmOptions = {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: "default" | "destructive";
};

type ConfirmState = {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  confirmVariant: "default" | "destructive";
};

type MessageContextValue = {
  notify: (options: NotifyOptions) => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
};

const MessageContext = createContext<MessageContextValue | undefined>(undefined);

const defaultDurations: Record<MessageVariant, number> = {
  info: 4500,
  success: 4500,
  warning: 6000,
  error: 7000,
};

export function MessageProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const confirmResolverRef = useRef<((value: boolean) => void) | null>(null);
  const toastTimersRef = useRef<Map<string, number>>(new Map());
  const idRef = useRef(0);

  const removeToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
    const timer = toastTimersRef.current.get(id);
    if (timer) {
      window.clearTimeout(timer);
      toastTimersRef.current.delete(id);
    }
  }, []);

  const notify = useCallback(
    (options: NotifyOptions) => {
      const resolved =
        typeof options === "string" ? { message: options } : options;
      const variant = resolved.variant ?? "info";
      const duration = resolved.duration ?? defaultDurations[variant];
      const id = `${Date.now()}-${idRef.current++}`;
      const toast: Toast = {
        id,
        title: resolved.title,
        message: resolved.message,
        variant,
        duration,
      };
      setToasts((current) => [...current, toast]);
      if (duration > 0) {
        const timer = window.setTimeout(() => removeToast(id), duration);
        toastTimersRef.current.set(id, timer);
      }
    },
    [removeToast]
  );

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      if (confirmResolverRef.current) {
        confirmResolverRef.current(false);
      }
      confirmResolverRef.current = resolve;
      setConfirmState({
        title: options.title ?? "Please confirm",
        message: options.message,
        confirmLabel: options.confirmLabel ?? "Confirm",
        cancelLabel: options.cancelLabel ?? "Cancel",
        confirmVariant: options.confirmVariant ?? "default",
      });
    });
  }, []);

  const handleConfirmClose = useCallback((result: boolean) => {
    confirmResolverRef.current?.(result);
    confirmResolverRef.current = null;
    setConfirmState(null);
  }, []);

  useEffect(() => {
    return () => {
      toastTimersRef.current.forEach((timer) => window.clearTimeout(timer));
      toastTimersRef.current.clear();
      if (confirmResolverRef.current) {
        confirmResolverRef.current(false);
        confirmResolverRef.current = null;
      }
    };
  }, []);

  const value = useMemo(() => ({ notify, confirm }), [notify, confirm]);

  return (
    <MessageContext.Provider value={value}>
      {children}
      <div className="app-toast-stack" role="region" aria-live="polite">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="app-toast"
            data-variant={toast.variant}
            role={toast.variant === "error" ? "alert" : "status"}
          >
            <div className="app-toast-body">
              {toast.title && (
                <div className="app-toast-title">{toast.title}</div>
              )}
              <div className="app-toast-message">{toast.message}</div>
            </div>
            <button
              type="button"
              className="app-toast-close"
              onClick={() => removeToast(toast.id)}
              aria-label="Dismiss notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
      <Dialog
        open={Boolean(confirmState)}
        onOpenChange={(open) => {
          if (!open) handleConfirmClose(false);
        }}
      >
        {confirmState && (
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{confirmState.title}</DialogTitle>
              <DialogDescription className="whitespace-pre-line">
                {confirmState.message}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => handleConfirmClose(false)}
              >
                {confirmState.cancelLabel}
              </Button>
              <Button
                variant={confirmState.confirmVariant}
                onClick={() => handleConfirmClose(true)}
              >
                {confirmState.confirmLabel}
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </MessageContext.Provider>
  );
}

export function useMessages() {
  const context = useContext(MessageContext);
  if (!context) {
    throw new Error("useMessages must be used within MessageProvider");
  }
  return context;
}
