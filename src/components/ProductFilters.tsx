"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Filter, X } from "lucide-react";

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

  const updateFilter = (key: keyof FilterState, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
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

  const hasActiveFilters =
    filters.search !== "" ||
    filters.priceMin > 0 ||
    filters.priceMax < maxPrice ||
    filters.availability !== "all" ||
    filters.sortBy !== "name";

  return (
    <Card className="mb-6 bg-white/95 backdrop-blur-sm border-2">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold text-[#3da874] flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-2">
                Active
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">
              {productCount} products found
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-[#3da874]"
            >
              {isExpanded ? "Hide" : "Show"} Filters
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Search - always visible */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search products..."
            value={filters.search}
            onChange={(e) => updateFilter("search", e.target.value)}
            className="pl-10 text-base h-12"
          />
        </div>

        {/* Active Filter Badges */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className="text-sm font-medium text-gray-600">Active filters:</span>
            
            {filters.search && (
              <Badge 
                variant="secondary" 
                className="bg-blue-100 text-blue-800 hover:bg-blue-200 cursor-pointer flex items-center gap-1"
                onClick={() => updateFilter("search", "")}
              >
                Search: {filters.search}
                <X className="h-3 w-3" />
              </Badge>
            )}
            
            {filters.priceMin > 0 && (
              <Badge 
                variant="secondary" 
                className="bg-green-100 text-green-800 hover:bg-green-200 cursor-pointer flex items-center gap-1"
                onClick={() => updateFilter("priceMin", 0)}
              >
                Min: ${filters.priceMin}
                <X className="h-3 w-3" />
              </Badge>
            )}
            
            {filters.priceMax < maxPrice && (
              <Badge 
                variant="secondary" 
                className="bg-green-100 text-green-800 hover:bg-green-200 cursor-pointer flex items-center gap-1"
                onClick={() => updateFilter("priceMax", maxPrice)}
              >
                Max: ${filters.priceMax}
                <X className="h-3 w-3" />
              </Badge>
            )}
            
            {filters.availability !== "all" && (
              <Badge 
                variant="secondary" 
                className="bg-purple-100 text-purple-800 hover:bg-purple-200 cursor-pointer flex items-center gap-1"
                onClick={() => updateFilter("availability", "all")}
              >
                {filters.availability === "in-stock" ? "In Stock Only" : "Out of Stock Only"}
                <X className="h-3 w-3" />
              </Badge>
            )}
            
            {filters.sortBy !== "name" && (
              <Badge 
                variant="secondary" 
                className="bg-orange-100 text-orange-800 hover:bg-orange-200 cursor-pointer flex items-center gap-1"
                onClick={() => updateFilter("sortBy", "name")}
              >
                Sort: {
                  filters.sortBy === "price-low" ? "Price: Low to High" :
                  filters.sortBy === "price-high" ? "Price: High to Low" :
                  filters.sortBy === "stock" ? "Stock Level" : filters.sortBy
                }
                <X className="h-3 w-3" />
              </Badge>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-gray-600 hover:text-gray-800"
            >
              Clear all
            </Button>
          </div>
        )}

        {/* Expandable filters */}
        {isExpanded && (
          <div className="space-y-6 border-t pt-4">
            {/* Sort */}
            <div>
              <Label className="text-base font-semibold mb-3 block">
                Sort By
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: "name", label: "Name A-Z" },
                  { value: "price-low", label: "Price: Low to High" },
                  { value: "price-high", label: "Price: High to Low" },
                  { value: "stock", label: "Stock Level" },
                ].map((option) => (
                  <Button
                    key={option.value}
                    variant={
                      filters.sortBy === option.value ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => updateFilter("sortBy", option.value)}
                    className="justify-start"
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div>
              <Label className="text-base font-semibold mb-3 block">
                Price Range: ${filters.priceMin} - ${filters.priceMax}
              </Label>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm">Min Price</Label>
                    <Input
                      type="number"
                      value={filters.priceMin}
                      onChange={(e) =>
                        updateFilter("priceMin", Number(e.target.value) || 0)
                      }
                      min={0}
                      max={maxPrice}
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Max Price</Label>
                    <Input
                      type="number"
                      value={filters.priceMax}
                      onChange={(e) =>
                        updateFilter(
                          "priceMax",
                          Number(e.target.value) || maxPrice
                        )
                      }
                      min={0}
                      max={maxPrice}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Availability */}
            <div>
              <Label className="text-base font-semibold mb-3 block">
                Availability
              </Label>
              <div className="space-y-2">
                {[
                  { value: "all", label: "All Products" },
                  { value: "in-stock", label: "In Stock Only" },
                  { value: "out-of-stock", label: "Out of Stock" },
                ].map((option) => (
                  <div
                    key={option.value}
                    className="flex items-center space-x-2"
                  >
                    <Checkbox
                      checked={filters.availability === option.value}
                      onCheckedChange={() =>
                        updateFilter("availability", option.value)
                      }
                    />
                    <Label className="text-sm font-normal cursor-pointer">
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
                  className="w-full text-red-600 border-red-200 hover:bg-red-50"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear All Filters
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
