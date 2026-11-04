import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiRequest } from "@/lib/api-client";
import { useAuthStore } from "@/store/auth-store";

const user = {
  id: "u-1",
  email: "agente@portus.cv",
  name: "Rui",
  phone: null,
  role: "agente_recolha" as const,
  status: "active" as const,
  agencyId: "ag-1",
  portId: null,
};

function respond(status: number, body?: unknown) {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("apiRequest", () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    useAuthStore.getState().clearUser();
  });

  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
  });

  it("sends the access token and the cookie", async () => {
    useAuthStore.getState().setSession({ id: "u-1", name: "Rui", email: "a", role: "agente_recolha", company: "" }, "tok-1");
    fetchMock.mockResolvedValueOnce(respond(200, { ok: true }));

    await expect(apiRequest("/auth/me")).resolves.toEqual({ ok: true });

    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("http://localhost:4000/api/auth/me");
    expect(init).toMatchObject({ credentials: "include", headers: { authorization: "Bearer tok-1" } });
  });

  it("refreshes once on 401 and retries with the new token", async () => {
    useAuthStore.getState().setSession({ id: "u-1", name: "Rui", email: "a", role: "agente_recolha", company: "" }, "old");
    fetchMock
      .mockResolvedValueOnce(respond(401, { message: "expirado" }))
      .mockResolvedValueOnce(respond(200, { accessToken: "new", expiresIn: 900, user }))
      .mockResolvedValueOnce(respond(200, ["pedido"]));

    await expect(apiRequest("/agency/shipment-requests")).resolves.toEqual(["pedido"]);
    expect(fetchMock.mock.calls[1]![0]).toBe("http://localhost:4000/api/auth/refresh");
    expect(fetchMock.mock.calls[2]![1]).toMatchObject({ headers: { authorization: "Bearer new" } });
    expect(useAuthStore.getState().accessToken).toBe("new");
  });

  it("clears the session when the refresh fails", async () => {
    useAuthStore.getState().setSession({ id: "u-1", name: "Rui", email: "a", role: "agente_recolha", company: "" }, "old");
    fetchMock.mockResolvedValueOnce(respond(401, {})).mockResolvedValueOnce(respond(401, {}));

    await expect(apiRequest("/auth/me")).rejects.toMatchObject({ status: 401 });
    expect(useAuthStore.getState().user).toBeNull();
  });

  it("exposes validation issues from the API", async () => {
    fetchMock.mockResolvedValueOnce(
      respond(400, { message: "Dados inválidos.", issues: [{ path: "recipient.phone", message: "Telefone inválido." }] }),
    );

    const error = await apiRequest("/shipment-requests", { method: "POST", body: {}, auth: "none" }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 400, issues: [{ path: "recipient.phone" }] });
  });

  it("never persists the access token", () => {
    useAuthStore.getState().setSession({ id: "u-1", name: "Rui", email: "a", role: "agente_recolha", company: "" }, "secret");
    expect(window.localStorage.getItem("portus-auth")).not.toContain("secret");
  });
});

describe("apiRequest with files", () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    useAuthStore.getState().setSession({ id: "u-1", name: "Rui", email: "a", role: "agente_recolha", company: "" }, "tok");
  });

  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
  });

  it("sends FormData as is so the browser sets the multipart boundary", async () => {
    fetchMock.mockResolvedValueOnce(new Response("{}", { status: 201 }));
    const form = new FormData();
    form.append("file", new Blob(["a;b"]), "lista.csv");

    await apiRequest("/imports", { method: "POST", body: form });

    const init = fetchMock.mock.calls[0]![1]!;
    expect(init.body).toBe(form);
    expect(init.headers).not.toHaveProperty("content-type");
  });
});
