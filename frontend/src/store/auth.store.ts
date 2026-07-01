import { create } from 'zustand';
import Cookies from 'js-cookie';

interface User {
  userId: number;
  email: string;
  roles: string[];
}

interface AuthStore {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  isAdmin: () => boolean;
  isStudent: () => boolean;
  isCompany: () => boolean;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  token: Cookies.get('token') ?? null,

  setAuth: (user, token) => {
    Cookies.set('token', token, { expires: 1 });
    set({ user, token });
  },

  logout: () => {
    Cookies.remove('token');
    set({ user: null, token: null });
  },

  isAdmin: () => get().user?.roles.includes('ADMIN') ?? false,
  isStudent: () => get().user?.roles.includes('STUDENT') ?? false,
  isCompany: () => get().user?.roles.includes('COMPANY') ?? false,
}));