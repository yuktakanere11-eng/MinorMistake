import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';

interface UserState {
  user: any | null;
  setUser: (user: any) => void;
  fetchUser: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const useStore = create<UserState>((set) => ({
  user: null,
  
  setUser: (user) => set({ user }),

  fetchUser: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    set({ user });
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null });
  },
}));