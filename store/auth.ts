import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';
import type { User } from '@/types';

const KEY = 'retailflow.jwt';
const USER_KEY = 'retailflow.user';

const storage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          return window.localStorage.getItem(key);
        }
      } catch (e) {
        console.warn('localStorage error:', e);
      }
      return null;
    }
    return await SecureStore.getItemAsync(key);
  },

  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(key, value);
        }
      } catch (e) {
        console.warn('localStorage error:', e);
      }
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },

  async deleteItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(key);
        }
      } catch (e) {
        console.warn('localStorage error:', e);
      }
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
};

type State = {
  token: string | null;
  user: User | null;
  hydrated: boolean;
  setSession: (token: string, user: User) => Promise<void>;
  setUser: (u: User) => void;
  hydrate: () => Promise<void>;
  logout: () => Promise<void>;
};

export const useAuthStore = create<State>((set) => ({
  token: null,
  user: null,
  hydrated: false,
  setSession: async (token, user) => {
    await storage.setItem(KEY, token);
    await storage.setItem(USER_KEY, JSON.stringify(user));
    set({ token, user });
  },
  setUser: (user) => {
    storage.setItem(USER_KEY, JSON.stringify(user)).catch(() => {});
    set({ user });
  },
  hydrate: async () => {
    try {
      const token = await storage.getItem(KEY);
      const userStr = await storage.getItem(USER_KEY);
      const user = userStr ? (JSON.parse(userStr) as User) : null;
      set({ token, user, hydrated: true });
    } catch {
      set({ token: null, user: null, hydrated: true });
    }
  },
  logout: async () => {
    try {
      await storage.deleteItem(KEY);
      await storage.deleteItem(USER_KEY);
    } catch {
      // ignore
    }
    set({ token: null, user: null, hydrated: true });
  },
}));
