import { apiRequest, type ApiSession, toUser } from "@/lib/api-client";
import { defaultRouteFor } from "@/lib/permissions";
import { useAuthStore } from "@/store/auth-store";

function startSession(session: ApiSession) {
  const user = toUser(session.user);
  useAuthStore.getState().setSession(user, session.accessToken);
  return { user, redirectTo: defaultRouteFor(user) };
}

export async function login(email: string, password: string) {
  return startSession(
    await apiRequest<ApiSession>("/auth/login", { method: "POST", body: { email, password }, auth: "none" }),
  );
}

export interface RegisterCustomerPayload {
  name: string;
  email: string;
  phone: string;
  password: string;
}

/** Conta opcional de cliente; fica logo com sessão iniciada. */
export async function registerCustomer(payload: RegisterCustomerPayload) {
  return startSession(await apiRequest<ApiSession>("/auth/register", { method: "POST", body: payload, auth: "none" }));
}

/** Revoga a sessão no servidor e limpa o estado local, mesmo que o servidor não responda. */
export async function logout() {
  try {
    await apiRequest<void>("/auth/logout", { method: "POST", auth: "none" });
  } finally {
    useAuthStore.getState().clearUser();
  }
}
