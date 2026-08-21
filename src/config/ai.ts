/**
 * Centralized AI Model Router Configuration for InstaScore OS
 */
export const AI_MODEL_ROUTER = {
  primaryModel: "gemini-3.7-flash",
  fallbackModels: [
    "gemini-flash-latest",
    "gemini-3.1-flash-lite"
  ],
  economicModel: "gemini-3.1-flash-lite",
  advancedModel: "gemini-3.7-flash",
  maxAttemptsPerModel: 2, // 1 initial attempt + 1 retry on transient 503/429 errors
  retryDelayBaseMs: 800,
  requestTimeoutMs: 120000,
};

export const GEMINI_MODEL = AI_MODEL_ROUTER.primaryModel;


