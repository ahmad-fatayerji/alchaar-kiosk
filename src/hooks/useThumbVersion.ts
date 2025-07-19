// Simple global version counter for thumbnails
import { useSyncExternalStore } from "react";

let version = 0;
const listeners = new Set<() => void>();

export function bumpThumbVersion() {
    version += 1;
    listeners.forEach((fn) => fn());
}

export function useThumbVersion() {
    return useSyncExternalStore(
        (cb) => {
            listeners.add(cb);
            return () => listeners.delete(cb);
        },
        () => version,
    );
}
