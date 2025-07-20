"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Settings, Eye, EyeOff, Tag, Save } from "lucide-react";

type Settings = {
  hide_prices: string;
  sales_enabled: string;
};

export default function SettingsPanel() {
  const [settings, setSettings] = useState<Settings>({
    hide_prices: "false",
    sales_enabled: "true",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  // Load settings on mount
  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        setSettings({
          hide_prices: data.hide_prices || "false",
          sales_enabled: data.sales_enabled || "true",
        });
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load settings:", err);
        setLoading(false);
      });
  }, []);

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
      alert("Failed to update setting");
    } finally {
      setSaving(null);
    }
  };

  const toggleSetting = (key: string) => {
    const currentValue = settings[key as keyof Settings];
    const newValue = currentValue === "true" ? "false" : "true";
    updateSetting(key, newValue);
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
              <Label className="text-base font-medium">Sales & Discounts</Label>
              <p className="text-sm text-muted-foreground">
                Enable sales functionality and discount features
              </p>
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
              disabled={saving === "sales_enabled"}
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

        {/* Settings Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <div className="text-blue-600 text-sm">
              <strong>Note:</strong> These settings affect the customer-facing
              kiosk interface. Changes take effect immediately without requiring
              a restart.
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
