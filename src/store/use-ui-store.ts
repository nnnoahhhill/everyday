"use client";

import { create } from "zustand";

interface UIState {
  selectedDate: string; // YYYY-MM-DD
  setSelectedDate: (date: string) => void;
}

const getTodayDate = (): string => {
  if (typeof window === "undefined") {
    return "1970-01-01"; // Fallback for SSR
  }
  return new Date().toISOString().split("T")[0];
};

export const useUIStore = create<UIState>((set) => ({
  selectedDate: getTodayDate(),
  setSelectedDate: (date) => set({ selectedDate: date }),
}));
