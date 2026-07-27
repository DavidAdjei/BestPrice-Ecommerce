import { create } from "zustand";

interface Feedback {
  id: number;
  type: "success" | "error";
  message: string;
}

interface FeedbackState {
  feedback: Feedback | null;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  clear: () => void;
}

export const useFeedbackStore = create<FeedbackState>((set) => ({
  feedback: null,
  showSuccess: (message) => set({ feedback: { id: Date.now(), type: "success", message } }),
  showError: (message) => set({ feedback: { id: Date.now(), type: "error", message } }),
  clear: () => set({ feedback: null }),
}));
