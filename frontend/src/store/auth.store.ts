import { create } from "zustand";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";

interface User {
  userId: number;
  email: string;
  roles: string[];
}

interface JwtPayload {
  sub: number;
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

export const useAuthStore = create<AuthStore>((set, get) => {
  const existingToken = Cookies.get("token");
  let initialUser: User | null = null;

  if (existingToken) {
    try {
      const decoded = jwtDecode<JwtPayload>(existingToken);
      initialUser = {
        userId: decoded.sub, // ✅ sub → userId
        email: decoded.email,
        roles: decoded.roles,
      };
    } catch {
      Cookies.remove("token");
    }
  }

  return {
    user: initialUser,
    token: existingToken ?? null,

    setAuth: (user, token) => {
      Cookies.set("token", token, { expires: 7 });
      set({ user, token });
    },

    logout: () => {
      Cookies.remove("token");
      set({ user: null, token: null });
    },

    isAdmin: () => get().user?.roles.includes("ADMIN") ?? false,
    isStudent: () => get().user?.roles.includes("STUDENT") ?? false,
    isCompany: () => get().user?.roles.includes("COMPANY") ?? false,
  };
});
