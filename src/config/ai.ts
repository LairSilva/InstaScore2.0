/**
 * Centralized AI Model Router Configuration for InstaScore OS
 */
export const AI_MODEL_ROUTER = {
  primaryModel: "gemini-3.7-flash",
  fallbackModels: [
    "gemini-3.1-flash-lite"
  ],
  economicModel: "gemini-3.1-flash-lite",
  advancedModel: "gemini-3.7-flash",
  maxAttemptsPerModel: 1, // Strict cost control: 1 primary call (+ 1 correctional retry if needed)
  retryDelayBaseMs: 1500,
  requestTimeoutMs: 120000,
};

export const GEMINI_MODEL = AI_MODEL_ROUTER.primaryModel;


