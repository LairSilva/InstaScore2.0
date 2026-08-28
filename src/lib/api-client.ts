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
 * controlled 401 token refresh retry (max 1 retry), transient network retry (max 2 retries),
 * automatic error categorization, and strict prohibition of x-user-id headers.
 */
export async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {},
  retryCount: number = 0
): Promise<T> {
  const headers = new Headers(options.headers || {});
  
  // Strictly remove any client-supplied x-user-id header to ensure zero identity spoofing
  headers.delete("x-user-id");
  headers.delete("X-User-Id");

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
    // If transient network error and under max retries (e.g. server restart or network hiccup), retry with backoff
    if (retryCount < 2) {
      const delayMs = 600 * Math.pow(1.5, retryCount);
      console.warn(`[apiFetch] Network hiccup on ${endpoint}. Retrying in ${delayMs}ms (attempt ${retryCount + 1}/2)...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
      return await apiFetch<T>(endpoint, options, retryCount + 1);
    }

    throw new ApiError(
      0,
      "NETWORK_ERROR",
      "Erro de conexão com o servidor. Verifique sua conexão e tente novamente."
    );
  }

  // Handle token expiration / unauthorized with controlled 1-time retry
  if (res.status === 401) {
    if (retryCount === 0) {
      try {
        const freshToken = await getAuthIdToken(true);
        if (freshToken) {
          const retryHeaders = new Headers(headers);
          retryHeaders.set("Authorization", `Bearer ${freshToken}`);
          return await apiFetch<T>(endpoint, { ...options, headers: retryHeaders }, retryCount + 1);
        }
      } catch (refreshErr) {
        console.warn("[apiFetch] Token refresh attempt failed on 401:", refreshErr);
      }
    }

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
