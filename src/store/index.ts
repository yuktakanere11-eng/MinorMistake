// src/store/index.ts
import { create } from 'zustand';

interface UserState {
  user: any; // Ideally, replace 'any' with your User type from Supabase
  setUser: (user: any) => void;
}

export const useStore = create<UserState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}));