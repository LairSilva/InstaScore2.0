/**
 * Centralized Gemini Response Parser & Error Handling Utility
 * Ensures bulletproof JSON extraction, robust syntax repair, and structured HTTP error formatting.
 */

export interface StructuredAiError {
  status: number;
  code: string;
  message: string;
}

/**
 * Bulletproof JSON cleaning and parsing utility for AI model responses.
 * Handles Markdown fences, root objects, root arrays, and common syntax issues (trailing commas, control chars).
 */
export function cleanAndParseJson<T = any>(rawText: string | undefined | null): T {
  if (!rawText || typeof rawText !== "string" || !rawText.trim()) {
    throw new Error("AI_EMPTY_RESPONSE");
  }

  let cleaned = rawText.trim();

  // Strip Markdown code fences if present (```json ... ``` or ``` ...)
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  }

  // Find outermost json structure: either { ... } or [ ... ]
  const firstCurly = cleaned.indexOf("{");
  const lastCurly = cleaned.lastIndexOf("}");
  const firstSquare = cleaned.indexOf("[");
  const lastSquare = cleaned.lastIndexOf("]");

  let startIndex = -1;
  let endIndex = -1;

  if (firstCurly !== -1 && (firstSquare === -1 || firstCurly < firstSquare)) {
    if (lastCurly !== -1 && lastCurly > firstCurly) {
      startIndex = firstCurly;
      endIndex = lastCurly;
    }
  } else if (firstSquare !== -1) {
    if (lastSquare !== -1 && lastSquare > firstSquare) {
      startIndex = firstSquare;
      endIndex = lastSquare;
    }
  }

  if (startIndex !== -1 && endIndex !== -1) {
    cleaned = cleaned.substring(startIndex, endIndex + 1);
  }

  try {
    return JSON.parse(cleaned) as T;
  } catch (err: any) {
    // Attempt sanitized repair: strip trailing commas and non-printable control characters
    try {
      const sanitized = cleaned
        .replace(/,\s*([}\]])/g, "$1")
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, (c) => (c === "\n" || c === "\r" || c === "\t" ? c : " "));
      return JSON.parse(sanitized) as T;
    } catch {
      throw new Error(`AI_INVALID_JSON: ${err.message || "Invalid JSON structure"}`);
    }
  }
}

/**
 * Maps any AI execution error into a standard structured HTTP error.
 */
export function handleAiError(err: any): StructuredAiError {
  const errMsg = err?.message || String(err);
  const errCode = err?.status || err?.code || err?.error?.code;

  if (errMsg === "API_KEY_MISSING" || errMsg.includes("API_KEY_MISSING")) {
    return {
      status: 503,
      code: "AI_CONFIG_ERROR",
      message: "Chave da API de IA não configurada no servidor."
    };
  }

  if (
    errCode === 429 ||
    errCode === "RESOURCE_EXHAUSTED" ||
    errMsg.includes("RESOURCE_EXHAUSTED") ||
    errMsg.includes("Quota exceeded") ||
    errMsg.includes("quota")
  ) {
    return {
      status: 429,
      code: "AI_QUOTA_EXCEEDED",
      message: "Limite de requisições de IA atingido. Tente novamente em instantes."
    };
  }

  if (errCode === 404 || errMsg.includes("is not found") || errMsg.includes("NOT_FOUND")) {
    return {
      status: 502,
      code: "AI_MODEL_NOT_FOUND",
      message: "Modelo de IA configurado indisponível no momento."
    };
  }

  if (
    errMsg.includes("DEADLINE_EXCEEDED") ||
    errMsg.includes("ETIMEDOUT") ||
    errMsg.includes("TimeoutError") ||
    err?.name === "TimeoutError"
  ) {
    return {
      status: 504,
      code: "AI_TIMEOUT",
      message: "Tempo limite da IA excedido. Tente novamente."
    };
  }

  if (errMsg.includes("SAFETY") || errMsg.includes("BLOCKED") || errMsg.includes("HARM_CATEGORY")) {
    return {
      status: 422,
      code: "AI_SAFETY_BLOCKED",
      message: "A resposta foi bloqueada pelos filtros de segurança da IA."
    };
  }

  if (errMsg === "AI_EMPTY_RESPONSE" || errMsg.includes("EMPTY_AI_RESPONSE") || errMsg.includes("AI_EMPTY_RESPONSE")) {
    return {
      status: 502,
      code: "AI_EMPTY_RESPONSE",
      message: "A IA não retornou conteúdo válido para esta solicitação."
    };
  }

  if (errMsg.startsWith("AI_INVALID_JSON") || errMsg.includes("JSON_PARSE_FAILED")) {
    return {
      status: 502,
      code: "AI_INVALID_JSON",
      message: "A IA retornou uma resposta com estrutura inválida. Tente novamente."
    };
  }

  return {
    status: 500,
    code: "AI_EXECUTION_FAILED",
    message: err?.message || "Não foi possível processar a requisição de IA neste momento."
  };
}
