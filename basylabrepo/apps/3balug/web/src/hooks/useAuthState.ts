import { useCallback, useSyncExternalStore } from "react";
import { AUTH_CHANGE_EVENT, storage } from "@/utils/storage";

export type SessionState = "PUBLIC" | "PENDING" | "ACTIVE";

export interface AuthState {
  isAuthenticated: boolean;
  sessionState: SessionState;
}

/**
 * Hook que retorna o estado de autenticação baseado APENAS no localStorage.
 *
 * Lógica:
 * 1. Confiamos no localStorage primeiro (se tem token, está logado)
 * 2. A validação com a API acontece em background via useUser()
 * 3. Se o token for inválido, o interceptor do axios faz logout automaticamente
 *
 * Isso evita "piscar" de telas e loading states desnecessários.
 */
export const useAuthState = (): AuthState => {
  const subscribe = useCallback((callback: () => void) => {
    window.addEventListener(AUTH_CHANGE_EVENT, callback);
    return () => window.removeEventListener(AUTH_CHANGE_EVENT, callback);
  }, []);

  const getSnapshot = useCallback(() => {
    const isAuthenticated = storage.isAuthenticated();
    const status = storage.getSubscriptionStatus();

    const sessionState: SessionState = !isAuthenticated
      ? "PUBLIC"
      : status === "active"
        ? "ACTIVE"
        : status === "pending"
          ? "PENDING"
          : "PUBLIC";

    return JSON.stringify({ isAuthenticated, sessionState });
  }, []);

  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  return JSON.parse(state) as AuthState;
};
