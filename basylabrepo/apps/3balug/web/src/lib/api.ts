import axios, { type AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from "axios";
import { toast } from "react-toastify";
import { storage } from "@/utils/storage";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: string) => void;
  reject: (reason?: Error) => void;
}> = [];

let navigationCallback: ((path: string, replace?: boolean) => void) | null = null;

function processQueue(error: Error | null, token: string | null = null): void {
  for (const prom of failedQueue) {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  }
  failedQueue = [];
}

export function setNavigationCallback(callback: (path: string, replace?: boolean) => void): void {
  navigationCallback = callback;
}

function performLogout(message?: string): void {
  storage.clearAll();
  toast.error(message || "Sua sessão expirou. Faça login novamente.");
  if (navigationCallback) {
    navigationCallback("/login", true);
  }
}

function redirectToPayment(): void {
  const publicPaths = ["/", "/terms", "/privacy"];
  const currentPath = window.location.pathname;
  const isPublicPage = publicPaths.includes(currentPath);

  if (!currentPath.startsWith("/pending-payment") && !isPublicPage && navigationCallback) {
    navigationCallback("/pending-payment", true);
  }
}

export const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = storage.getAccessToken();

    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  async (
    error: AxiosError<{
      code?: string | number;
      error?: string;
      message?: string;
      details?: unknown;
      needsVerification?: boolean;
      needsPayment?: boolean;
      userId?: string;
      subscriptionId?: string;
      email?: string;
      type?: string;
    }>,
  ) => {
    // Interceptor atualizado para preservar mensagens do backend
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (!error.response) {
      const networkError = new Error("Erro de conexão. Verifique sua internet.");
      Object.assign(networkError, {
        status: 0,
        message: "Erro de conexão. Verifique sua internet.",
        details: error.message,
      });
      return Promise.reject(networkError);
    }

    const { data, status } = error.response;
    const errorType = data?.type;
    const isRefreshRequest = originalRequest?.url?.includes("/auth/refresh");

    // USER_NOT_FOUND e ACCOUNT_DEACTIVATED são tratados separadamente pois retornam 404/403
    const sessionInvalidatingErrors = new Set([
      "TOKEN_EXPIRED",
      "INVALID_TOKEN",
      "TOKEN_NOT_FOUND",
      "AUTHENTICATION_REQUIRED",
    ]);

    if (!originalRequest) {
      return Promise.reject(error);
    }

    if (errorType === "TOO_MANY_ATTEMPTS" && status === 429) {
      const retryAt = (data as { retryAt?: string }).retryAt;
      const rateLimitError = new Error(data?.message || "Muitas tentativas");
      Object.assign(rateLimitError, {
        status,
        message: data?.message || "Muitas tentativas",
        type: "TOO_MANY_ATTEMPTS",
        retryAt,
      });
      return Promise.reject(rateLimitError);
    }

    if (status && status >= 500) {
      // Prioriza mensagem do backend, usa genérica apenas como fallback
      const errorMessage =
        data?.message ||
        data?.error ||
        "Ocorreu um erro no servidor. Caso o problema persista, entre em contato com o suporte.";
      const serverError = new Error(errorMessage);
      Object.assign(serverError, {
        status,
        message: errorMessage,
        code: data?.code,
        type: data?.type,
        details: data?.details || data,
      });
      return Promise.reject(serverError);
    }

    // Tratamento específico para conta desativada - logout imediato
    if (errorType === "ACCOUNT_DEACTIVATED") {
      performLogout(
        data?.message ||
          "Sua conta foi desativada. Entre em contato com o administrador da sua empresa para mais informações.",
      );
      const deactivatedError = new Error(data?.message || "Conta desativada");
      Object.assign(deactivatedError, {
        status,
        code: "ACCOUNT_DEACTIVATED",
        type: errorType,
        message: data?.message,
        handledByInterceptor: true, // Flag para evitar duplicação de toast
      });
      return Promise.reject(deactivatedError);
    }

    if (data?.needsPayment) {
      redirectToPayment();
      const errorMessage = data?.message || "Pagamento necessário para continuar.";
      const paymentError = new Error(errorMessage);
      Object.assign(paymentError, {
        status,
        message: errorMessage,
        code: "PAYMENT_REQUIRED",
        needsPayment: true,
      });
      return Promise.reject(paymentError);
    }

    // Tratamento específico para usuário não encontrado - logout imediato
    // Isso acontece quando o usuário foi deletado mas ainda tem token válido
    if (errorType === "USER_NOT_FOUND") {
      performLogout(data?.message || "Usuário não encontrado. Por favor, faça login novamente.");
      const userNotFoundError = new Error(data?.message || "Usuário não encontrado");
      Object.assign(userNotFoundError, {
        status,
        code: "USER_NOT_FOUND",
        type: errorType,
        message: data?.message,
        handledByInterceptor: true,
      });
      return Promise.reject(userNotFoundError);
    }

    // Se é a própria requisição de refresh falhando, faz logout imediatamente
    if (isRefreshRequest && status === 401) {
      performLogout();
      const errorMessage = data?.message || "Sua sessão expirou. Por favor, faça login novamente.";
      const sessionError = new Error(errorMessage);
      Object.assign(sessionError, {
        status: 401,
        message: errorMessage,
        code: "SESSION_EXPIRED",
        type: errorType,
      });
      return Promise.reject(sessionError);
    }

    const shouldAttemptRefresh =
      !originalRequest._retry &&
      storage.isAuthenticated() &&
      !isRefreshRequest &&
      status === 401 &&
      sessionInvalidatingErrors.has(errorType ?? "");

    if (shouldAttemptRefresh) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (newToken: string) => {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              resolve(api(originalRequest));
            },
            reject: (err?: Error) => reject(err),
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data: refreshData } = await axios.post<{
          accessToken?: string;
          token?: string;
        }>(
          `${API_URL}/auth/refresh`,
          {},
          {
            withCredentials: true,
          },
        );

        const newAccessToken = refreshData.accessToken ?? refreshData.token;

        if (!newAccessToken) {
          throw new Error("Token de renovação inválido");
        }

        storage.setAccessToken(newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        processQueue(null, newAccessToken);
        isRefreshing = false;

        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as Error, null);
        isRefreshing = false;
        performLogout();
        return Promise.reject(refreshError);
      }
    }

    // Se é 401 e já tentou refresh, faz logout
    if (
      status === 401 &&
      originalRequest._retry &&
      sessionInvalidatingErrors.has(errorType ?? "") &&
      storage.isAuthenticated()
    ) {
      performLogout();
      const errorMessage = data?.message || "Sua sessão expirou. Por favor, faça login novamente.";
      const sessionError = new Error(errorMessage);
      Object.assign(sessionError, {
        status: 401,
        message: errorMessage,
        code: "SESSION_EXPIRED",
        type: errorType,
      });
      return Promise.reject(sessionError);
    }

    const errorMessage = (data?.error ||
      data?.message ||
      "Ocorreu um erro na requisição") as string;

    const apiError = new Error(errorMessage);
    Object.assign(apiError, {
      status,
      message: errorMessage,
      details: data?.details || data,
      code: data?.code,
      type: errorType,
      needsVerification: data?.needsVerification,
      needsPayment: data?.needsPayment,
      userId: data?.userId,
      subscriptionId: data?.subscriptionId,
      email: data?.email,
    });

    return Promise.reject(apiError);
  },
);
