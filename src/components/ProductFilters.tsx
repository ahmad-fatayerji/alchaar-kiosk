"use client";

import { useMemo, useState, useRef, useCallback } from "react";
import { useI18n } from "@/contexts/LangContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Filter, X } from "lucide-react";
import { useKioskSettings } from "@/hooks/useKioskSettings";

export type FilterState = {
  search: string;
  priceMin: number;
  priceMax: number;
  availability: "all" | "in-stock" | "out-of-stock";
  sortBy: "name" | "price-low" | "price-high" | "stock";
};

type ProductFiltersProps = {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  productCount: number;
  maxPrice?: number;
};

export default function ProductFilters({
  filters,
  onFiltersChange,
  productCount,
  maxPrice = 100,
}: ProductFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { hidePrices, showQuantities } = useKioskSettings();
  const { t, formatDigits } = useI18n();

  const priceFiltersDisabled = hidePrices;
  const stockFiltersDisabled = !showQuantities;

  const updateFilter = (key: keyof FilterState, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({
      search: "",
      priceMin: 0,
      priceMax: maxPrice,
      availability: "all",
      sortBy: "name",
    });
  };

  const hasActiveFilters = useMemo(() => {
    const searchActive = filters.search !== "";
    const priceActive =
      !priceFiltersDisabled &&
      (filters.priceMin > 0 || filters.priceMax < maxPrice);
    const availabilityActive =
      !stockFiltersDisabled && filters.availability !== "all";
    const sortActive =
      filters.sortBy !== "name" &&
      !(
        (priceFiltersDisabled &&
          (filters.sortBy === "price-low" ||
            filters.sortBy === "price-high")) ||
        (stockFiltersDisabled && filters.sortBy === "stock")
      );

    return searchActive || priceActive || availabilityActive || sortActive;
  }, [filters, maxPrice, priceFiltersDisabled, stockFiltersDisabled]);

  return (
    <Card className="mb-6 bg-white/95 backdrop-blur-sm border-2 kiosk-text">
      <CardHeader className="pb-4 kiosk-header">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold text-[#3da874] flex items-center gap-2 kiosk-title">
            <Filter className="h-6 w-6" />
            {t("filters")}
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-2">
                {t("active")}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-4">
            <span className="text-lg sm:text-xl text-gray-700 font-medium">
              {t("products_found", { count: productCount })}
            </span>
            <Button
              variant="ghost"
              size="lg"
              onClick={() => setIsExpanded(!isExpanded)}
              className="kiosk-button text-[#3da874] px-3 py-2 text-lg font-semibold"
            >
              {isExpanded ? t("hide_filters") : t("show_filters")}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 kiosk-text">
        {/* Search - always visible */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-400" />
          <Input
            type="search"
            inputMode="search"
            enterKeyHint="search"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            placeholder={t("search_products_placeholder")}
            value={filters.search}
            onChange={(e) => updateFilter("search", e.target.value)}
            className="pl-12 kiosk-input"
          />
        </div>

        {/* Active Filter Badges */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className="text-base font-medium text-gray-700">
              {t("active")} {t("filters")}:
            </span>

            {filters.search && (
              <Badge
                variant="secondary"
                className="bg-blue-100 text-blue-800 hover:bg-blue-200 cursor-pointer flex items-center gap-1"
                onClick={() => updateFilter("search", "")}
              >
                {t("browse")}: {filters.search}
                <X className="h-4 w-4" />
              </Badge>
            )}

            {!priceFiltersDisabled && filters.priceMin > 0 && (
              <Badge
                variant="secondary"
                className="bg-green-100 text-green-800 hover:bg-green-200 cursor-pointer flex items-center gap-1"
                onClick={() => updateFilter("priceMin", 0)}
              >
                {t("min_label")}: ${formatDigits(filters.priceMin)}
                <X className="h-4 w-4" />
              </Badge>
            )}

            {!priceFiltersDisabled && filters.priceMax < maxPrice && (
              <Badge
                variant="secondary"
                className="bg-green-100 text-green-800 hover:bg-green-200 cursor-pointer flex items-center gap-1"
                onClick={() => updateFilter("priceMax", maxPrice)}
              >
                {t("max_label")}: ${formatDigits(filters.priceMax)}
                <X className="h-4 w-4" />
              </Badge>
            )}

            {!stockFiltersDisabled && filters.availability !== "all" && (
              <Badge
                variant="secondary"
                className="bg-purple-100 text-purple-800 hover:bg-purple-200 cursor-pointer flex items-center gap-1"
                onClick={() => updateFilter("availability", "all")}
              >
                {filters.availability === "in-stock"
                  ? t("in_stock_only")
                  : t("out_of_stock")}
                <X className="h-4 w-4" />
              </Badge>
            )}

            {(() => {
              if (filters.sortBy === "name") return false;
              if (
                priceFiltersDisabled &&
                (filters.sortBy === "price-low" ||
                  filters.sortBy === "price-high")
              )
                return false;
              if (stockFiltersDisabled && filters.sortBy === "stock")
                return false;
              return true;
            })() && (
              <Badge
                variant="secondary"
                className="bg-orange-100 text-orange-800 hover:bg-orange-200 cursor-pointer flex items-center gap-1"
                onClick={() => updateFilter("sortBy", "name")}
              >
                {t("sort_by")}:{" "}
                {filters.sortBy === "price-low"
                  ? t("price_low_to_high")
                  : filters.sortBy === "price-high"
                  ? t("price_high_to_low")
                  : filters.sortBy === "stock"
                  ? t("stock_level")
                  : filters.sortBy}
                <X className="h-4 w-4" />
              </Badge>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="kiosk-button text-gray-700 hover:text-gray-900"
            >
              {t("clear_all")}
            </Button>
          </div>
        )}

        {/* Expandable filters */}
        {isExpanded && (
          <div className="space-y-6 border-t pt-4">
            {/* Sort */}
            <div>
              <Label className="kiosk-label text-base font-semibold mb-3 block">
                {t("sort_by")}
              </Label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: "name", label: t("name_az"), disabled: false },
                  {
                    value: "price-low",
                    label: t("price_low_to_high"),
                    disabled: priceFiltersDisabled,
                  },
                  {
                    value: "price-high",
                    label: t("price_high_to_low"),
                    disabled: priceFiltersDisabled,
                  },
                  {
                    value: "stock",
                    label: t("stock_level"),
                    disabled: stockFiltersDisabled,
                  },
                ].map((option) => (
                  <Button
                    key={option.value}
                    variant={
                      filters.sortBy === option.value ? "default" : "outline"
                    }
                    size="lg"
                    onClick={() =>
                      !option.disabled && updateFilter("sortBy", option.value)
                    }
                    className={`kiosk-button justify-start h-12 text-base active:scale-[0.99] ${
                      option.disabled ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                    disabled={option.disabled}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <PriceRange
              disabled={priceFiltersDisabled}
              min={0}
              max={maxPrice}
              value={[filters.priceMin, filters.priceMax]}
              onChange={(lo, hi) => {
                updateFilter("priceMin", lo);
                updateFilter("priceMax", hi);
              }}
              label={t("price_range", {
                min: filters.priceMin,
                max: filters.priceMax,
              })}
              format={(v: number) => formatDigits(v)}
            />

            {/* Availability */}
            <div
              aria-disabled={stockFiltersDisabled}
              className={
                stockFiltersDisabled ? "opacity-50 pointer-events-none" : ""
              }
            >
              <Label className="kiosk-label text-base font-semibold mb-3 block">
                {t("availability")}
              </Label>
              <div className="space-y-3">
                {[
                  { value: "all", label: t("all_products") },
                  { value: "in-stock", label: t("in_stock_only") },
                  { value: "out-of-stock", label: t("out_of_stock") },
                ].map((option) => (
                  <div
                    key={option.value}
                    className="flex items-center space-x-3"
                  >
                    <Checkbox
                      checked={filters.availability === option.value}
                      onCheckedChange={() =>
                        !stockFiltersDisabled &&
                        updateFilter("availability", option.value)
                      }
                      className="h-6 w-6"
                      disabled={stockFiltersDisabled}
                    />
                    <Label className="kiosk-label text-base font-normal cursor-pointer">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Clear filters */}
            {hasActiveFilters && (
              <div className="pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="kiosk-button w-full text-red-600 border-red-200 hover:bg-red-50"
                >
                  <X className="h-5 w-5 mr-2" />
                  {t("clear_all")} {t("filters")}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Lightweight custom dual-thumb slider for better centering & smoother UX
type PriceRangeProps = {
  min: number;
  max: number;
  value: [number, number];
  onChange: (low: number, high: number) => void;
  disabled?: boolean;
  label: string;
  format?: (v: number) => string | number;
};

function clamp(v: number, a: number, b: number) {
  return Math.min(Math.max(v, a), b);
}

const THUMB_SIZE = 28;

function PriceRange({
  min,
  max,
  value,
  onChange,
  disabled,
  label,
  format,
}: PriceRangeProps) {
  const [lo, hi] = value[0] <= value[1] ? value : [value[1], value[0]];
  const trackRef = useRef<HTMLDivElement | null>(null);
  const activeThumb = useRef<"lo" | "hi" | null>(null);
  const frame = useRef<number | null>(null);

  const percent = useCallback(
    (val: number) => ((val - min) / (max - min)) * 100,
    [min, max]
  );

  const setVals = useCallback(
    (nextLo: number, nextHi: number) => {
      nextLo = Math.round(clamp(nextLo, min, max));
      nextHi = Math.round(clamp(nextHi, min, max));
      if (nextLo > nextHi) [nextLo, nextHi] = [nextHi, nextLo];
      // rAF to avoid flooding React during fast drag
      if (frame.current) cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(() => onChange(nextLo, nextHi));
    },
    [min, max, onChange]
  );

  const handlePointerDown = (e: React.PointerEvent, which: "lo" | "hi") => {
    if (disabled) return;
    activeThumb.current = which;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!activeThumb.current || disabled) return;
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const x = clamp(e.clientX - rect.left, 0, rect.width);
    const val = min + (x / rect.width) * (max - min);
    if (activeThumb.current === "lo") setVals(val, hi);
    else setVals(lo, val);
  };
  const handlePointerUp = (e: React.PointerEvent) => {
    activeThumb.current = null;
  };

  const loPct = percent(lo);
  const hiPct = percent(hi);

  return (
    <div
      aria-disabled={disabled}
      className={disabled ? "opacity-50 pointer-events-none" : ""}
    >
      <Label className="kiosk-label text-base font-semibold mb-3 block">
        {label}
      </Label>
      <div className="space-y-4 px-2 select-none">
        <div
          ref={trackRef}
          className="relative h-10 flex items-center"
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          <div className="absolute inset-x-0 h-2 bg-gray-200 rounded-full" />
          <div
            className="absolute h-2 bg-[#3da874] rounded-full"
            style={{ left: `${loPct}%`, right: `${100 - hiPct}%` }}
          />
          {[["lo", loPct, lo] as const, ["hi", hiPct, hi] as const].map(
            ([id, pct, val]) => (
              <button
                key={id}
                type="button"
                onPointerDown={(e) => handlePointerDown(e, id)}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                className="absolute top-1/2 -translate-y-1/2 bg-white border-2 border-[#3da874] rounded-full shadow focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#3da874] transition-colors"
                style={{
                  width: THUMB_SIZE,
                  height: THUMB_SIZE,
                  left: `calc(${pct}% - ${THUMB_SIZE / 2}px)`,
                }}
                aria-label={id === "lo" ? "Minimum price" : "Maximum price"}
                aria-valuemin={min}
                aria-valuemax={max}
                aria-valuenow={val}
                role="slider"
              />
            )
          )}
        </div>
        <div className="flex justify-between text-base text-gray-800 font-semibold">
          <span>${format ? format(lo) : lo}</span>
          <span>${format ? format(hi) : hi}</span>
        </div>
      </div>
    </div>
  );
}
