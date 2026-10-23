import { create } from 'zustand';

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
}

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isInitialized: boolean;
  authError: string | null;

  fetchUser: () => Promise<AuthUser | null>;
  signInWithGoogle: () => void;
  signOut: () => Promise<void>;
  devLogin: (email: string, name?: string) => Promise<boolean>;
  setAuthError: (error: string | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isInitialized: false,
  authError: null,

  fetchUser: async () => {
    set({ isLoading: true });
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        set({ user: data.user || null, isLoading: false, isInitialized: true });
        return data.user || null;
      }
      set({ user: null, isLoading: false, isInitialized: true });
      return null;
    } catch {
      set({ user: null, isLoading: false, isInitialized: true });
      return null;
    }
  },

  signInWithGoogle: () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/api/auth/google';
    }
  },

  signOut: async () => {
    set({ isLoading: true });
    try {
      await fetch('/api/auth/signout', { method: 'POST' });
      set({ user: null, isLoading: false });
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    } catch (e) {
      console.error('Sign out error:', e);
      set({ isLoading: false });
    }
  },

  devLogin: async (email: string, name?: string) => {
    set({ isLoading: true });
    try {
      const res = await fetch('/api/auth/dev-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name }),
      });
      if (res.ok) {
        const data = await res.json();
        set({ user: data.user, isLoading: false });
        return true;
      }
      set({ isLoading: false });
      return false;
    } catch {
      set({ isLoading: false });
      return false;
    }
  },

  setAuthError: (error) => set({ authError: error }),
}));
