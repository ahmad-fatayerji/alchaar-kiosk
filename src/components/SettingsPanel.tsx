"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Settings, Eye, EyeOff, Tag, Save } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DEFAULT_IDLE_TIMEOUT_SECONDS,
  MAX_IDLE_TIMEOUT_SECONDS,
  parseIdleTimeoutSeconds,
} from "@/lib/idleTimeout";

type Settings = {
  hide_prices: string;
  sales_enabled: string;
  show_quantities: string;
  idle_timeout: string;
  inactivity_timeout_ms?: string;
};

export default function SettingsPanel() {
  const [settings, setSettings] = useState<Settings>({
    hide_prices: "false",
    sales_enabled: "true",
    show_quantities: "false",
    idle_timeout: String(DEFAULT_IDLE_TIMEOUT_SECONDS),
    inactivity_timeout_ms: "60000",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [idleMinutes, setIdleMinutes] = useState(
    Math.floor(DEFAULT_IDLE_TIMEOUT_SECONDS / 60)
  );
  const [idleSeconds, setIdleSeconds] = useState(
    DEFAULT_IDLE_TIMEOUT_SECONDS % 60
  );

  // Load settings on mount
  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        const idleTimeoutSeconds = parseIdleTimeoutSeconds(
          data.idle_timeout ?? data.idle_timeout_seconds,
          DEFAULT_IDLE_TIMEOUT_SECONDS
        );
        setSettings({
          hide_prices: data.hide_prices || "false",
          sales_enabled: data.sales_enabled || "true",
          show_quantities: data.show_quantities || "false",
          idle_timeout: String(idleTimeoutSeconds),
          inactivity_timeout_ms: String(
            data.inactivity_timeout_ms ?? data.INACTIVITY_TIMEOUT_MS ?? "60000"
          ),
        });
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load settings:", err);
        setLoading(false);
      });
  }, []);
  useEffect(() => {
    const totalSeconds = parseIdleTimeoutSeconds(
      settings.idle_timeout,
      DEFAULT_IDLE_TIMEOUT_SECONDS
    );
    setIdleMinutes(Math.floor(totalSeconds / 60));
    setIdleSeconds(totalSeconds % 60);
  }, [settings.idle_timeout]);

  // If prices are hidden from a previous session, ensure sales are disabled too
  useEffect(() => {
    if (
      settings.hide_prices === "true" &&
      settings.sales_enabled !== "false" &&
      !saving
    ) {
      updateSetting("sales_enabled", "false");
    }
    // Only react to the values, not the function identity
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.hide_prices, settings.sales_enabled, saving]);

  const updateSetting = async (key: string, value: string) => {
    setSaving(key);
    try {
      await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
      });

      setSettings((prev) => ({ ...prev, [key]: value }));
    } catch (error) {
      console.error("Failed to update setting:", error);
      setErrorMessage("Failed to update setting. Please try again.");
    } finally {
      setSaving(null);
    }
  };

  const toggleSetting = async (key: string) => {
    const currentValue = settings[key as keyof Settings];
    const newValue = currentValue === "true" ? "false" : "true";
    await updateSetting(key, newValue);
    // If prices are hidden, force sales off as well
    if (key === "hide_prices" && newValue === "true") {
      await updateSetting("sales_enabled", "false");
    }
  };

  const normalizeIdleTimeout = (minutes: number, seconds: number) => {
    const safeMinutes = Number.isFinite(minutes) ? Math.max(0, minutes) : 0;
    const safeSeconds = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
    const total = Math.min(
      safeMinutes * 60 + safeSeconds,
      MAX_IDLE_TIMEOUT_SECONDS
    );
    return {
      total,
      minutes: Math.floor(total / 60),
      seconds: total % 60,
    };
  };

  const saveIdleTimeout = async () => {
    const normalized = normalizeIdleTimeout(idleMinutes, idleSeconds);
    setIdleMinutes(normalized.minutes);
    setIdleSeconds(normalized.seconds);
    await updateSetting("idle_timeout", String(normalized.total));
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Loading settings...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Kiosk Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Hide Prices Setting */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              {settings.hide_prices === "true" ? (
                <EyeOff className="h-5 w-5 text-orange-500" />
              ) : (
                <Eye className="h-5 w-5 text-green-500" />
              )}
              <div>
                <Label className="text-base font-medium">
                  Hide Prices from Customers
                </Label>
                <p className="text-sm text-muted-foreground">
                  When enabled, customers won't see product prices in the kiosk
                  interface
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={
                  settings.hide_prices === "true" ? "destructive" : "default"
                }
              >
                {settings.hide_prices === "true" ? "Hidden" : "Visible"}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleSetting("hide_prices")}
                disabled={saving === "hide_prices"}
              >
                {saving === "hide_prices" ? (
                  <Save className="h-4 w-4 animate-spin" />
                ) : settings.hide_prices === "true" ? (
                  "Show Prices"
                ) : (
                  "Hide Prices"
                )}
              </Button>
            </div>
          </div>

          {/* Sales Feature Setting */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <Tag
                className={`h-5 w-5 ${
                  settings.sales_enabled === "true"
                    ? "text-green-500"
                    : "text-gray-400"
                }`}
              />
              <div>
                <Label className="text-base font-medium">
                  Sales & Discounts
                </Label>
                <p className="text-sm text-muted-foreground">
                  Enable sales functionality and discount features
                </p>
                {settings.hide_prices === "true" && (
                  <p className="text-xs text-orange-600 mt-1">
                    Disabled while prices are hidden
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={
                  settings.sales_enabled === "true" ? "default" : "secondary"
                }
              >
                {settings.sales_enabled === "true" ? "Enabled" : "Disabled"}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleSetting("sales_enabled")}
                disabled={
                  saving === "sales_enabled" || settings.hide_prices === "true"
                }
              >
                {saving === "sales_enabled" ? (
                  <Save className="h-4 w-4 animate-spin" />
                ) : settings.sales_enabled === "true" ? (
                  "Disable"
                ) : (
                  "Enable"
                )}
              </Button>
            </div>
          </div>

          {/* Show Quantities Setting */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <Tag
                className={`h-5 w-5 ${
                  settings.show_quantities === "true"
                    ? "text-green-500"
                    : "text-gray-400"
                }`}
              />
              <div>
                <Label className="text-base font-medium">
                  Show Product Quantities
                </Label>
                <p className="text-sm text-muted-foreground">
                  Display remaining stock quantities on product cards
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={
                  settings.show_quantities === "true" ? "default" : "secondary"
                }
              >
                {settings.show_quantities === "true" ? "Shown" : "Hidden"}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleSetting("show_quantities")}
                disabled={saving === "show_quantities"}
              >
                {saving === "show_quantities" ? (
                  <Save className="h-4 w-4 animate-spin" />
                ) : settings.show_quantities === "true" ? (
                  "Hide"
                ) : (
                  "Show"
                )}
              </Button>
            </div>
          </div>

          {/* Idle Timeout */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <Tag className="h-5 w-5 text-blue-500" />
              <div>
                <Label className="text-base font-medium">
                  Idle Return Timeout
                </Label>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Time with no interaction before the kiosk returns to the home
                  screen.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground">Minutes</Label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  className="w-20 border rounded px-2 py-1 text-sm"
                  value={idleMinutes}
                  onChange={(e) =>
                    setIdleMinutes(Math.max(0, Number(e.target.value || 0)))
                  }
                />
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground">Seconds</Label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  className="w-20 border rounded px-2 py-1 text-sm"
                  value={idleSeconds}
                  onChange={(e) =>
                    setIdleSeconds(Math.max(0, Number(e.target.value || 0)))
                  }
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={saving === "idle_timeout"}
                onClick={saveIdleTimeout}
              >
                {saving === "idle_timeout" ? (
                  <Save className="h-4 w-4 animate-spin" />
                ) : (
                  "Save"
                )}
              </Button>
            </div>
          </div>

          {/* Settings Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <div className="text-blue-600 text-sm">
                <strong>Note:</strong> These settings affect the customer-facing
                kiosk interface. Changes take effect immediately without
                requiring a restart.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <Dialog
        open={Boolean(errorMessage)}
        onOpenChange={() => setErrorMessage(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update failed</DialogTitle>
            <DialogDescription>{errorMessage}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setErrorMessage(null)}>Okay</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
