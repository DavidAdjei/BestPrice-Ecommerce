import { create } from "zustand";
import type { User } from "../types";

interface AuthState {
  user: User | null;
  isAuth: boolean;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuth: false,
  setUser: (user) => set({ user, isAuth: !!user }),
}));
