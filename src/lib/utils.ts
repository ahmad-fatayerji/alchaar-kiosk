import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

// This file contains utility functions for class name manipulation.
// It exports a single function `cn` that merges class names using clsx and tailwind-merge.    
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
