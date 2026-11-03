// Endereço da API (portus_service). NEXT_PUBLIC_ é incluído no bundle do navegador no build.
export const apiBaseUrl = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api").replace(/\/$/, "");
