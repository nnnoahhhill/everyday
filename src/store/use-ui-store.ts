import { create } from "zustand";

interface UIState {
  selectedDate: string; // YYYY-MM-DD
  setSelectedDate: (date: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  selectedDate: new Date().toISOString().split("T")[0],
  setSelectedDate: (date) => set({ selectedDate: date }),
}));
