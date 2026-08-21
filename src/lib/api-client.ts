import { getAuthIdToken } from "./firebase";

export class ApiError extends Error {
  status: number;
  code: string;
  details?: any;

  constructor(status: number, code: string, message: string, details?: any) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/**
 * Robust authenticated fetch client that handles Firebase ID Tokens,
 * automatic error categorization, and graceful error messages.
 */
export async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers || {});
  
  // Set default JSON Content-Type if body is present and not multipart
  if (options.body && !(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  // Inject Firebase Bearer Token if not explicitly provided
  if (!headers.has("Authorization")) {
    try {
      const token = await getAuthIdToken();
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
    } catch (err: any) {
      console.warn("[apiFetch] Could not obtain Firebase auth token:", err?.message || err);
    }
  }

  let res: Response;
  try {
    res = await fetch(endpoint, {
      ...options,
      headers
    });
  } catch (err: any) {
    throw new ApiError(
      0,
      "NETWORK_ERROR",
      "Erro de conexão com o servidor. Verifique sua conexão e tente novamente."
    );
  }

  // Handle token expiration / unauthorized
  if (res.status === 401) {
    let errBody: any = null;
    try {
      errBody = await res.json();
    } catch (_) {}

    throw new ApiError(
      401,
      errBody?.error?.code || errBody?.error || "UNAUTHORIZED",
      errBody?.error?.message || errBody?.message || "Sua sessão expirou ou não está autenticada. Faça login novamente.",
      errBody
    );
  }

  // Handle Paywall / Forbidden (403)
  if (res.status === 403) {
    let errBody: any = null;
    try {
      errBody = await res.json();
    } catch (_) {}

    throw new ApiError(
      403,
      errBody?.error?.code || errBody?.error || "FORBIDDEN",
      errBody?.error?.message || errBody?.message || "Recurso exclusivo do plano InstaScore PRO.",
      errBody
    );
  }

  // Handle Rate Limiting / Quota (429)
  if (res.status === 429) {
    let errBody: any = null;
    try {
      errBody = await res.json();
    } catch (_) {}

    throw new ApiError(
      429,
      errBody?.error?.code || errBody?.error || "QUOTA_EXCEEDED",
      errBody?.error?.message || errBody?.message || "Limite de requisições de IA atingido. Tente novamente em instantes.",
      errBody
    );
  }

  // Parse JSON response
  let data: any = null;
  const contentType = res.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    try {
      data = await res.json();
    } catch (err: any) {
      throw new ApiError(
        res.status,
        "INVALID_JSON_RESPONSE",
        "Resposta do servidor em formato inválido."
      );
    }
  } else {
    try {
      const text = await res.text();
      data = { text };
    } catch (_) {
      data = {};
    }
  }

  if (!res.ok) {
    const errorCode = data?.error?.code || data?.error || `HTTP_${res.status}`;
    const errorMessage =
      data?.error?.message ||
      data?.message ||
      (res.status >= 500
        ? "O serviço de inteligência artificial encontrou uma instabilidade temporária. Tente novamente."
        : "Ocorreu um erro ao processar sua solicitação.");

    throw new ApiError(res.status, errorCode, errorMessage, data);
  }

  return data as T;
}
