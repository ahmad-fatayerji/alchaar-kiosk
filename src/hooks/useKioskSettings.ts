"use client";

import { useEffect, useState } from "react";
import {
    DEFAULT_IDLE_TIMEOUT_SECONDS,
    parseIdleTimeoutSeconds,
} from "@/lib/idleTimeout";

export type KioskSettings = {
    hidePrices: boolean;
    salesEnabled: boolean;
    showQuantities: boolean;
    idleTimeoutSeconds: number;
};

/**
 * useKioskSettings
 * Fetches kiosk UI settings from /api/settings and exposes normalized booleans.
 */
export function useKioskSettings() {
    const [settings, setSettings] = useState<KioskSettings>({
        hidePrices: false,
        salesEnabled: true,
        showQuantities: false,
        idleTimeoutSeconds: DEFAULT_IDLE_TIMEOUT_SECONDS,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        let cancelled = false;
        fetch("/api/settings")
            .then((res) => res.json())
            .then((data) => {
                if (cancelled) return;
                const idleTimeoutSeconds = parseIdleTimeoutSeconds(
                    data.idle_timeout ?? data.idle_timeout_seconds,
                    DEFAULT_IDLE_TIMEOUT_SECONDS
                );
                setSettings({
                    hidePrices: data.hide_prices === "true",
                    salesEnabled: data.sales_enabled !== "false",
                    showQuantities: data.show_quantities === "true",
                    idleTimeoutSeconds,
                });
                setLoading(false);
            })
            .catch((err) => {
                if (cancelled) return;
                setError(err instanceof Error ? err : new Error("Failed to load settings"));
                // keep defaults
                setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    return { ...settings, loading, error };
}
