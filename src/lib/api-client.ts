import { apiBaseUrl } from "@/lib/config";
import { useAuthStore } from "@/store/auth-store";
import type { Role, User, UserStatus } from "@/types/user";

export interface ApiIssue {
  path: string;
  message: string;
}

/** Erro devolvido pela API, com o estado HTTP e, em erros de validação, os campos inválidos. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly issues: ApiIssue[] = [],
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export interface ApiUser {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: Role;
  status: UserStatus;
  agencyId: string | null;
  portId: string | null;
}

export interface ApiSession {
  accessToken: string;
  expiresIn: number;
  user: ApiUser;
}

export function toUser(user: ApiUser): User {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    company: "",
    status: user.status,
    agencyId: user.agencyId ?? undefined,
    phone: user.phone ?? undefined,
  };
}

interface RequestOptions {
  method?: "GET" | "POST";
  body?: unknown;
  /**
   * required: envia o token e renova a sessão se expirar.
   * optional: envia o token se houver sessão (ex.: pedido público feito por um cliente com conta).
   * none: rota pública.
   */
  auth?: "required" | "optional" | "none";
}

let refreshing: Promise<boolean> | null = null;

/** Renova o access token com o cookie de refresh. Pedidos simultâneos partilham a mesma renovação. */
export function refreshSession() {
  refreshing ??= (async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/auth/refresh`, { method: "POST", credentials: "include" });
      if (!response.ok) {
        useAuthStore.getState().clearUser();
        return false;
      }
      const session = (await response.json()) as ApiSession;
      useAuthStore.getState().setSession(toUser(session.user), session.accessToken);
      return true;
    } catch {
      return false;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

async function send(path: string, options: RequestOptions) {
  const token = options.auth === "none" ? null : useAuthStore.getState().accessToken;
  const headers: Record<string, string> = {};
  if (options.body !== undefined) headers["content-type"] = "application/json";
  if (token) headers.authorization = `Bearer ${token}`;

  return fetch(`${apiBaseUrl}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    credentials: "include",
  });
}

async function toApiError(response: Response) {
  const body = (await response.json().catch(() => null)) as { message?: string | string[]; issues?: ApiIssue[] } | null;
  const message = Array.isArray(body?.message) ? body.message.join(" ") : body?.message;
  return new ApiError(
    response.status,
    message ?? (response.status === 429 ? "Demasiados pedidos. Tente daqui a um minuto." : "Ocorreu um erro inesperado."),
    body?.issues ?? [],
  );
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const auth = options.auth ?? "required";
  const state = useAuthStore.getState();

  // Depois de recarregar a página há perfil mas não há token: renova antes de pedir.
  if (auth !== "none" && state.user && !state.accessToken) {
    await refreshSession();
  }

  let response = await send(path, { ...options, auth });
  if (response.status === 401 && auth === "required" && (await refreshSession())) {
    response = await send(path, { ...options, auth });
  }

  if (!response.ok) {
    throw await toApiError(response);
  }
  return (response.status === 204 ? undefined : await response.json()) as T;
}
