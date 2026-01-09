import { useEffect, useRef } from "react";
import { MAX_IDLE_TIMEOUT_MS } from "@/lib/idleTimeout";

type IdleTimeoutOptions = {
  timeoutMs: number;
  enabled?: boolean;
  onTimeout: () => void;
};

export function useIdleTimeout({ timeoutMs, enabled = true, onTimeout }: IdleTimeoutOptions) {
  const latestHandler = useRef(onTimeout);

  useEffect(() => {
    latestHandler.current = onTimeout;
  }, [onTimeout]);

  useEffect(() => {
    if (!enabled) return;
    const safeTimeoutMs = Math.min(Math.max(0, timeoutMs), MAX_IDLE_TIMEOUT_MS);
    if (safeTimeoutMs === 0) return;

    let timerId: number | undefined;

    const resetTimer = () => {
      if (timerId !== undefined) {
        window.clearTimeout(timerId);
      }
      timerId = window.setTimeout(() => {
        latestHandler.current();
      }, safeTimeoutMs);
    };

    const events: Array<keyof WindowEventMap> = [
      "mousemove",
      "mousedown",
      "keydown",
      "touchstart",
      "touchmove",
      "wheel",
    ];

    events.forEach((event) => window.addEventListener(event, resetTimer, { passive: true }));
    resetTimer();

    return () => {
      if (timerId !== undefined) {
        window.clearTimeout(timerId);
      }
      events.forEach((event) => window.removeEventListener(event, resetTimer));
    };
  }, [timeoutMs, enabled]);
}
