import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/types/user";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  /** Só em memória: nunca é gravado no localStorage. Repõe-se com /auth/refresh (cookie httpOnly). */
  accessToken: string | null;
  setUser: (user: User) => void;
  setSession: (user: User, accessToken: string) => void;
  clearUser: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      accessToken: null,
      setUser: (user) => set({ user, isAuthenticated: true }),
      setSession: (user, accessToken) => set({ user, accessToken, isAuthenticated: true }),
      clearUser: () => set({ user: null, accessToken: null, isAuthenticated: false }),
    }),
    {
      name: "portus-auth",
      // O perfil serve só para mostrar a interface logo; o token fica fora do armazenamento.
      partialize: ({ user, isAuthenticated }) => ({ user, isAuthenticated }),
    },
  ),
);
