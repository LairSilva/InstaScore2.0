import { PLANS, PlanType, EntitlementKey, getPlanConfig, hasEntitlement, calculateEstimatedAiCost } from '../config/plans';
import { getFirebaseAdminFirestore, resolveProjectId, resolveFirestoreDatabaseId } from '../server/auth/firebase-admin';
import { calculateRetentionUntil, RETENTION_POLICIES } from './data-retention';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export const SCHEMA_VERSION = 1;

/**
 * Structured 503 error class for billing & database unavailabilities in production.
 */
export class BillingUnavailableError extends Error {
  public readonly code: 'FIRESTORE_CONFIG_MISSING' | 'BILLING_UNAVAILABLE';
  public readonly status: number;
  public readonly details?: any;

  constructor(code: 'FIRESTORE_CONFIG_MISSING' | 'BILLING_UNAVAILABLE', message: string, details?: any) {
    super(message);
    this.name = 'BillingUnavailableError';
    this.code = code;
    this.status = 503;
    this.details = details;
    Object.setPrototypeOf(this, BillingUnavailableError.prototype);
  }
}

export function isProductionEnvironment(): boolean {
  return process.env.NODE_ENV === 'production';
}

export interface SubscriptionRecord {
  userId: string;
  plan: PlanType;
  status: 'active' | 'trialing' | 'pending' | 'past_due' | 'canceled' | 'expired' | 'refunded';
  cycle: 'monthly' | 'annual';
  provider: 'mercadopago' | 'pix_card_simulated';
  subscriptionId: string;
  providerCustomerId?: string;
  providerSubscriptionId?: string;
  currentPeriodStart: number;
  currentPeriodEnd: number;
  cancelAtPeriodEnd: boolean;
  createdAt: number;
  updatedAt: number;
  expiresAt: number;
  retentionUntil?: number;
  schemaVersion: number;
}

export interface UsageRecord {
  userId: string;
  diagnosesCount: number;
  aiGenerationsCount: number;
  dailyGenerationsCount: number;
  imageGenerationsCount: number;
  videoGenerationsCount: number;
  lastResetTimestamp: number;
  lastDailyResetTimestamp: number;
  createdAt: number;
  updatedAt: number;
  retentionUntil?: number;
  schemaVersion: number;
}

export interface FeedbackRecord {
  id: string;
  userId: string;
  solutionType: string;
  rating: 'useful' | 'not_useful';
  comment?: string;
  itemTitle?: string;
  timestamp: number;
  createdAt: number;
  updatedAt: number;
  retentionUntil?: number;
  schemaVersion: number;
}

export interface WebhookEventRecord {
  eventId: string;
  eventType: string;
  userId: string;
  status: string;
  provider: string;
  processedAt: number;
  payload: any;
  createdAt: number;
  updatedAt: number;
  retentionUntil?: number;
  schemaVersion: number;
}

export interface CheckoutSessionRecord {
  sessionId: string;
  userId: string;
  planId: PlanType;
  cycle: 'monthly' | 'annual';
  amount: number;
  paymentMethod: 'pix' | 'card';
  status: 'pending' | 'approved' | 'failed' | 'canceled';
  provider: 'mercadopago' | 'pix_card_simulated';
  providerPaymentId?: string;
  pixQrCodeText?: string;
  pixQrCodeBase64?: string;
  checkoutUrl?: string;
  createdAt: number;
  updatedAt: number;
  expiresAt: number;
  retentionUntil?: number;
  schemaVersion: number;
}

export interface AiLogRecord {
  id: string;
  diagnosticId?: string;
  userId: string;
  action: string;
  modelUsed: string;
  durationMs: number;
  retries: number;
  fallbackUsed: boolean;
  inputTokens: number;
  outputTokens: number;
  estimatedCostUsd: number;
  estimatedCostBrl: number;
  isTest?: boolean;
  adminTestMode?: boolean;
  timestamp: number;
  createdAt: number;
  retentionUntil?: number;
  schemaVersion: number;
}

// Durable local storage for persistent fallbacks
const DATA_DIR = path.resolve(process.cwd(), '.data');
const STORE_PATH = path.join(DATA_DIR, 'billing_store.json');

interface DurableStore {
  subscriptions: Record<string, SubscriptionRecord>;
  usage: Record<string, UsageRecord>;
  checkout_sessions: Record<string, CheckoutSessionRecord>;
  webhook_events: Record<string, WebhookEventRecord>;
  processed_payments: Record<string, { eventId: string; userId: string; processedAt: number; amount: number; status: string; }>;
  feedback: Record<string, FeedbackRecord>;
  ai_logs: Record<string, AiLogRecord>;
}

// Transactional Mutex for atomic operations
class AsyncLock {
  private queue: (() => void)[] = [];
  private locked = false;

  async acquire(): Promise<() => void> {
    return new Promise((resolve) => {
      const execute = () => {
        this.locked = true;
        resolve(() => {
          this.locked = false;
          if (this.queue.length > 0) {
            const next = this.queue.shift();
            if (next) next();
          }
        });
      };

      if (this.locked) {
        this.queue.push(execute);
      } else {
        execute();
      }
    });
  }
}

const storeLock = new AsyncLock();
let inMemoryStore: DurableStore | null = null;
let firestoreDisabled = false;

export function setFirestoreDisabled(disabled: boolean): void {
  firestoreDisabled = disabled;
}

export function isFirestoreDisabled(): boolean {
  return firestoreDisabled;
}

export function getActivePersistenceBackend(): {
  type: 'firestore' | 'local_store_dev';
  projectId: string;
  databaseId: string;
  isProduction: boolean;
  status: 'online' | 'degraded_dev_fallback' | 'unavailable_fail_closed';
} {
  const isProd = isProductionEnvironment();
  const adminDb = getFirebaseAdminFirestore();
  const projectId = resolveProjectId();
  const databaseId = resolveFirestoreDatabaseId();

  if (adminDb && !firestoreDisabled) {
    return {
      type: 'firestore',
      projectId: projectId ? `${projectId.substring(0, 12)}...` : 'unknown',
      databaseId: databaseId ? `${databaseId.substring(0, 12)}...` : 'unknown',
      isProduction: isProd,
      status: 'online'
    };
  }

  if (isProd) {
    return {
      type: 'firestore',
      projectId: projectId ? `${projectId.substring(0, 12)}...` : 'unknown',
      databaseId: databaseId ? `${databaseId.substring(0, 12)}...` : 'unknown',
      isProduction: true,
      status: 'unavailable_fail_closed'
    };
  }

  return {
    type: 'local_store_dev',
    projectId: 'local-dev-store',
    databaseId: 'local-dev-db',
    isProduction: false,
    status: 'degraded_dev_fallback'
  };
}

export function initLocalStore(): DurableStore {
  if (inMemoryStore) return inMemoryStore;

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, 'utf-8');
      inMemoryStore = JSON.parse(raw);
      return inMemoryStore!;
    }
  } catch (e) {
    console.warn('[BillingServer] Local store init warning:', e);
  }

  inMemoryStore = {
    subscriptions: {},
    usage: {},
    checkout_sessions: {},
    webhook_events: {},
    processed_payments: {},
    feedback: {},
    ai_logs: {}
  };
  saveLocalStore(inMemoryStore);
  return inMemoryStore;
}

export function saveLocalStore(store: DurableStore) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), 'utf-8');
  } catch (e) {
    console.warn('[BillingServer] Local store save warning:', e);
  }
}

/**
 * Sanitizes webhook or payment payloads to ensure zero leakage of tokens, passwords, card numbers or secrets.
 */
function sanitizePaymentPayload(payload: any): any {
  if (!payload || typeof payload !== 'object') {
    return {};
  }
  const sensitiveKeys = ['card_number', 'pan', 'cvv', 'security_code', 'token', 'access_token', 'secret', 'password', 'authorization', 'api_key'];

  const cleanObject = (val: any, depth = 0): any => {
    if (depth > 5) return '[Truncated]';
    if (!val || typeof val !== 'object') return val;
    if (Array.isArray(val)) return val.map(item => cleanObject(item, depth + 1));

    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(val)) {
      const lowerKey = key.toLowerCase();
      if (sensitiveKeys.some(s => lowerKey.includes(s))) {
        result[key] = '[REDACTED_SECURITY]';
      } else if (typeof value === 'object' && value !== null) {
        result[key] = cleanObject(value, depth + 1);
      } else {
        result[key] = value;
      }
    }
    return result;
  };

  return cleanObject(payload);
}

/**
 * Gets or initializes a user's subscription record using a safe atomic transaction.
 * Defaults to FREE tier if no record exists.
 */
export async function getSubscription(userId: string): Promise<SubscriptionRecord> {
  if (!userId) userId = 'anonymous';
  const now = Date.now();
  const isProd = isProductionEnvironment();

  // 1. Try Firestore Transaction
  if (!firestoreDisabled) {
    const db = getFirebaseAdminFirestore();
    if (!db) {
      firestoreDisabled = true;
      if (isProd) {
        throw new BillingUnavailableError(
          'FIRESTORE_CONFIG_MISSING',
          'Firestore Admin não configurado no servidor em ambiente de produção (fail-closed).'
        );
      }
    } else {
      try {
        const subRef = db.collection('subscriptions').doc(userId);

        return await db.runTransaction(async (t) => {
          const doc = await t.get(subRef);

          if (!doc.exists) {
            const defaultSub: SubscriptionRecord = {
              userId,
              plan: 'FREE',
              status: 'active',
              cycle: 'monthly',
              provider: 'mercadopago',
              subscriptionId: `sub_free_${userId}`,
              currentPeriodStart: now,
              currentPeriodEnd: now + 365 * 24 * 60 * 60 * 1000,
              cancelAtPeriodEnd: false,
              createdAt: now,
              updatedAt: now,
              expiresAt: now + 365 * 24 * 60 * 60 * 1000,
              retentionUntil: calculateRetentionUntil(RETENTION_POLICIES.CHECKOUT_SESSIONS_DAYS),
              schemaVersion: SCHEMA_VERSION
            };

            t.set(subRef, defaultSub);
            return defaultSub;
          }

          const data = doc.data() as SubscriptionRecord;

          if (data.plan === 'PRO' && data.currentPeriodEnd < now && data.status === 'active') {
            const updated: SubscriptionRecord = {
              ...data,
              status: 'expired',
              plan: 'FREE',
              updatedAt: now,
              schemaVersion: SCHEMA_VERSION
            };
            t.set(subRef, updated);
            return updated;
          }

          return data;
        });
      } catch (err: any) {
        firestoreDisabled = true;
        if (isProd) {
          throw new BillingUnavailableError(
            'BILLING_UNAVAILABLE',
            `Falha na transação do Firestore para assinaturas em produção: ${err.message}`,
            err
          );
        }
        const isPermissionErr = err?.message?.includes('PERMISSION_DENIED') || err?.code === 7;
        if (!isPermissionErr) {
          console.warn(`[BillingServer] Subscription transaction note for '${userId}':`, err?.message || err);
        } else {
          console.info(`[BillingServer] Sandbox mode: using durable transactional store for '${userId}'.`);
        }
      }
    }
  }

  // 2. Production Fail-Closed Guard: NEVER use local store in production
  if (isProd) {
    throw new BillingUnavailableError(
      'BILLING_UNAVAILABLE',
      'Serviço de assinaturas indisponível em produção (armazenamento local proibido).'
    );
  }

  // 3. Transactional Durable Local Store (Development / Test ONLY)
  const unlock = await storeLock.acquire();
  try {
    const store = initLocalStore();
    let sub = store.subscriptions[userId];

    if (!sub) {
      sub = {
        userId,
        plan: 'FREE',
        status: 'active',
        cycle: 'monthly',
        provider: 'mercadopago',
        subscriptionId: `sub_free_${userId}`,
        currentPeriodStart: now,
        currentPeriodEnd: now + 365 * 24 * 60 * 60 * 1000,
        cancelAtPeriodEnd: false,
        createdAt: now,
        updatedAt: now,
        expiresAt: now + 365 * 24 * 60 * 60 * 1000,
        schemaVersion: SCHEMA_VERSION
      };
      store.subscriptions[userId] = sub;
      saveLocalStore(store);
      return sub;
    }

    if (sub.plan === 'PRO' && sub.currentPeriodEnd < now && sub.status === 'active') {
      sub.status = 'expired';
      sub.plan = 'FREE';
      sub.updatedAt = now;
      sub.schemaVersion = SCHEMA_VERSION;
      store.subscriptions[userId] = sub;
      saveLocalStore(store);
    }

    return sub;
  } finally {
    unlock();
  }
}

/**
 * Gets or resets a user's usage record based on daily and monthly windows.
 */
export async function getUsage(userId: string): Promise<UsageRecord> {
  if (!userId) userId = 'anonymous';
  const now = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;
  const thirtyDaysMs = 30 * oneDayMs;
  const isProd = isProductionEnvironment();

  // 1. Try Firestore Transaction
  if (!firestoreDisabled) {
    const db = getFirebaseAdminFirestore();
    if (!db) {
      firestoreDisabled = true;
      if (isProd) {
        throw new BillingUnavailableError(
          'FIRESTORE_CONFIG_MISSING',
          'Firestore Admin não configurado no servidor em ambiente de produção (fail-closed).'
        );
      }
    } else {
      try {
        const usageRef = db.collection('usage').doc(userId);

        return await db.runTransaction(async (t) => {
          const doc = await t.get(usageRef);

          if (!doc.exists) {
            const defaultUsage: UsageRecord = {
              userId,
              diagnosesCount: 0,
              aiGenerationsCount: 0,
              dailyGenerationsCount: 0,
              imageGenerationsCount: 0,
              videoGenerationsCount: 0,
              lastResetTimestamp: now,
              lastDailyResetTimestamp: now,
              createdAt: now,
              updatedAt: now,
              retentionUntil: calculateRetentionUntil(RETENTION_POLICIES.DIAGNOSIS_DAYS),
              schemaVersion: SCHEMA_VERSION
            };

            t.set(usageRef, defaultUsage);
            return defaultUsage;
          }

          const data = doc.data() as UsageRecord;
          let modified = false;

          if (now - data.lastDailyResetTimestamp > oneDayMs) {
            data.dailyGenerationsCount = 0;
            data.lastDailyResetTimestamp = now;
            modified = true;
          }

          if (now - data.lastResetTimestamp > thirtyDaysMs) {
            data.diagnosesCount = 0;
            data.aiGenerationsCount = 0;
            data.imageGenerationsCount = 0;
            data.videoGenerationsCount = 0;
            data.lastResetTimestamp = now;
            modified = true;
          }

          if (modified) {
            data.updatedAt = now;
            data.schemaVersion = SCHEMA_VERSION;
            t.set(usageRef, data);
          }

          return data;
        });
      } catch (err: any) {
        firestoreDisabled = true;
        if (isProd) {
          throw new BillingUnavailableError(
            'BILLING_UNAVAILABLE',
            `Falha na transação do Firestore para usage em produção: ${err.message}`,
            err
          );
        }
      }
    }
  }

  // 2. Production Fail-Closed Guard
  if (isProd) {
    throw new BillingUnavailableError(
      'BILLING_UNAVAILABLE',
      'Serviço de quotas indisponível em produção (armazenamento local proibido).'
    );
  }

  // 3. Transactional Durable Local Store (Development / Test ONLY)
  const unlock = await storeLock.acquire();
  try {
    const store = initLocalStore();
    let usage = store.usage[userId];

    if (!usage) {
      usage = {
        userId,
        diagnosesCount: 0,
        aiGenerationsCount: 0,
        dailyGenerationsCount: 0,
        imageGenerationsCount: 0,
        videoGenerationsCount: 0,
        lastResetTimestamp: now,
        lastDailyResetTimestamp: now,
        createdAt: now,
        updatedAt: now,
        schemaVersion: SCHEMA_VERSION
      };
      store.usage[userId] = usage;
      saveLocalStore(store);
      return usage;
    }

    let modified = false;
    if (now - usage.lastDailyResetTimestamp > oneDayMs) {
      usage.dailyGenerationsCount = 0;
      usage.lastDailyResetTimestamp = now;
      modified = true;
    }

    if (now - usage.lastResetTimestamp > thirtyDaysMs) {
      usage.diagnosesCount = 0;
      usage.aiGenerationsCount = 0;
      usage.imageGenerationsCount = 0;
      usage.videoGenerationsCount = 0;
      usage.lastResetTimestamp = now;
      modified = true;
    }

    if (modified) {
      usage.updatedAt = now;
      usage.schemaVersion = SCHEMA_VERSION;
      store.usage[userId] = usage;
      saveLocalStore(store);
    }

    return usage;
  } finally {
    unlock();
  }
}

/**
 * Verifies if a user has access to a specific entitlement.
 * When options.isAdminTest is true, grants verified admin/dev access for QA testing without mutating DB subscriptions.
 */
export async function checkUserEntitlement(
  userId: string,
  entitlement: EntitlementKey,
  options?: { isAdminTest?: boolean }
): Promise<{
  allowed: boolean;
  plan: PlanType;
  reason?: string;
  adminTestMode?: boolean;
}> {
  if (options?.isAdminTest) {
    return {
      allowed: true,
      plan: 'PRO',
      adminTestMode: true
    };
  }

  try {
    const sub = await getSubscription(userId);
    const isAllowed = hasEntitlement(sub.plan, entitlement);

    if (!isAllowed) {
      return {
        allowed: false,
        plan: sub.plan,
        reason: `RECURSO_BLOQUEADO: O recurso '${entitlement}' requer o plano InstaScore PRO.`
      };
    }

    return {
      allowed: true,
      plan: sub.plan
    };
  } catch (err: any) {
    if (err instanceof BillingUnavailableError) {
      throw err;
    }
    console.error(`[BillingServer] checkUserEntitlement failed for '${userId}':`, err);
    return {
      allowed: false,
      plan: 'FREE',
      reason: 'Falha na verificação de permissões do plano. Tente novamente.'
    };
  }
}

/**
 * Checks and increments quotas using an ATOMIC TRANSACTION.
 * Guarantees that two concurrent requests cannot exceed the quota limit.
 * When options.isAdminTest is true, permits QA test executions without consuming real user quotas.
 */
export async function checkAndIncrementQuota(
  userId: string,
  actionType: 'DIAGNOSIS' | 'AI_GENERATION' | 'IMAGE_GENERATION' | 'VIDEO_GENERATION',
  options?: { isAdminTest?: boolean }
): Promise<{
  allowed: boolean;
  plan: PlanType;
  currentCount: number;
  maxLimit: number;
  errorCode?: string;
  message?: string;
  adminTestMode?: boolean;
}> {
  if (options?.isAdminTest) {
    return {
      allowed: true,
      plan: 'FREE',
      currentCount: 0,
      maxLimit: 9999,
      adminTestMode: true
    };
  }

  if (!userId) userId = 'anonymous';
  const now = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;
  const thirtyDaysMs = 30 * oneDayMs;
  const isProd = isProductionEnvironment();

  // 1. Try Firestore Transaction
  if (!firestoreDisabled) {
    const db = getFirebaseAdminFirestore();
    if (!db) {
      firestoreDisabled = true;
      if (isProd) {
        return {
          allowed: false,
          plan: 'FREE',
          currentCount: 0,
          maxLimit: 0,
          errorCode: 'FIRESTORE_CONFIG_MISSING',
          message: 'Serviço de cotas indisponível: Firestore Admin não configurado em produção (fail-closed).'
        };
      }
    } else {
      try {
        const subRef = db.collection('subscriptions').doc(userId);
        const usageRef = db.collection('usage').doc(userId);

        return await db.runTransaction(async (t) => {
          const subDoc = await t.get(subRef);
          let sub: SubscriptionRecord;
          if (!subDoc.exists) {
            sub = {
              userId,
              plan: 'FREE',
              status: 'active',
              cycle: 'monthly',
              provider: 'mercadopago',
              subscriptionId: `sub_free_${userId}`,
              currentPeriodStart: now,
              currentPeriodEnd: now + 365 * 24 * 60 * 60 * 1000,
              cancelAtPeriodEnd: false,
              createdAt: now,
              updatedAt: now,
              expiresAt: now + 365 * 24 * 60 * 60 * 1000,
              retentionUntil: calculateRetentionUntil(RETENTION_POLICIES.CHECKOUT_SESSIONS_DAYS),
              schemaVersion: SCHEMA_VERSION
            };
            t.set(subRef, sub);
          } else {
            sub = subDoc.data() as SubscriptionRecord;
            if (sub.plan === 'PRO' && sub.currentPeriodEnd < now && sub.status === 'active') {
              sub.status = 'expired';
              sub.plan = 'FREE';
              sub.updatedAt = now;
              sub.schemaVersion = SCHEMA_VERSION;
              t.set(subRef, sub);
            }
          }

          const usageDoc = await t.get(usageRef);
          let usage: UsageRecord;
          if (!usageDoc.exists) {
            usage = {
              userId,
              diagnosesCount: 0,
              aiGenerationsCount: 0,
              dailyGenerationsCount: 0,
              imageGenerationsCount: 0,
              videoGenerationsCount: 0,
              lastResetTimestamp: now,
              lastDailyResetTimestamp: now,
              createdAt: now,
              updatedAt: now,
              retentionUntil: calculateRetentionUntil(RETENTION_POLICIES.DIAGNOSIS_DAYS),
              schemaVersion: SCHEMA_VERSION
            };
          } else {
            usage = { ...(usageDoc.data() as UsageRecord) };
          }

          if (now - usage.lastDailyResetTimestamp > oneDayMs) {
            usage.dailyGenerationsCount = 0;
            usage.lastDailyResetTimestamp = now;
          }

          if (now - usage.lastResetTimestamp > thirtyDaysMs) {
            usage.diagnosesCount = 0;
            usage.aiGenerationsCount = 0;
            usage.imageGenerationsCount = 0;
            usage.videoGenerationsCount = 0;
            usage.lastResetTimestamp = now;
          }

          const config = getPlanConfig(sub.plan);

          if (actionType === 'DIAGNOSIS') {
            const maxLimit = sub.plan === 'FREE' ? config.quotas.maxDiagnosesTotal : config.quotas.maxDiagnosesPerMonth;
            if (usage.diagnosesCount >= maxLimit) {
              return {
                allowed: false,
                plan: sub.plan,
                currentCount: usage.diagnosesCount,
                maxLimit,
                errorCode: sub.plan === 'FREE' ? 'FREE_QUOTA_EXCEEDED' : 'PRO_MONTHLY_QUOTA_EXCEEDED',
                message: sub.plan === 'FREE'
                  ? 'Você atingiu o limite de 1 diagnóstico gratuito no plano Free. Faça upgrade para o InstaScore PRO para realizar análises adicionais.'
                  : `Você atingiu seu limite de ${maxLimit} diagnósticos mensais do plano Pro.`
              };
            }

            usage.diagnosesCount += 1;
            usage.updatedAt = now;
            usage.schemaVersion = SCHEMA_VERSION;
            t.set(usageRef, usage);

            return {
              allowed: true,
              plan: sub.plan,
              currentCount: usage.diagnosesCount,
              maxLimit
            };
          } else if (actionType === 'IMAGE_GENERATION') {
            const limit = config.quotas.maxImageGenerationsPerMonth;
            if (limit <= 0) {
              return {
                allowed: false,
                plan: sub.plan,
                currentCount: usage.imageGenerationsCount,
                maxLimit: limit,
                errorCode: 'IMAGE_GENERATION_PRO_ONLY',
                message: 'A geração de imagens visuais estratégicas é exclusiva do plano InstaScore PRO.'
              };
            }
            if (usage.imageGenerationsCount >= limit) {
              return {
                allowed: false,
                plan: sub.plan,
                currentCount: usage.imageGenerationsCount,
                maxLimit: limit,
                errorCode: 'IMAGE_MONTHLY_QUOTA_EXCEEDED',
                message: `Você atingiu o limite mensal de ${limit} gerações de imagens do seu plano PRO.`
              };
            }

            usage.imageGenerationsCount += 1;
            usage.updatedAt = now;
            usage.schemaVersion = SCHEMA_VERSION;
            t.set(usageRef, usage);

            return {
              allowed: true,
              plan: sub.plan,
              currentCount: usage.imageGenerationsCount,
              maxLimit: limit
            };
          } else if (actionType === 'VIDEO_GENERATION') {
            const limit = config.quotas.maxVideoGenerationsPerMonth;
            if (limit <= 0) {
              return {
                allowed: false,
                plan: sub.plan,
                currentCount: usage.videoGenerationsCount,
                maxLimit: limit,
                errorCode: 'VIDEO_GENERATION_PRO_ONLY',
                message: 'A geração de roteiros de vídeo é exclusiva do plano InstaScore PRO.'
              };
            }
            if (usage.videoGenerationsCount >= limit) {
              return {
                allowed: false,
                plan: sub.plan,
                currentCount: usage.videoGenerationsCount,
                maxLimit: limit,
                errorCode: 'VIDEO_MONTHLY_QUOTA_EXCEEDED',
                message: `Você atingiu o limite mensal de ${limit} storyboards de vídeo do seu plano PRO.`
              };
            }

            usage.videoGenerationsCount += 1;
            usage.updatedAt = now;
            usage.schemaVersion = SCHEMA_VERSION;
            t.set(usageRef, usage);

            return {
              allowed: true,
              plan: sub.plan,
              currentCount: usage.videoGenerationsCount,
              maxLimit: limit
            };
          } else {
            const dailyLimit = config.quotas.maxAiGenerationsPerDay;
            if (usage.dailyGenerationsCount >= dailyLimit) {
              return {
                allowed: false,
                plan: sub.plan,
                currentCount: usage.dailyGenerationsCount,
                maxLimit: dailyLimit,
                errorCode: 'DAILY_AI_QUOTA_EXCEEDED',
                message: `Você atingiu o limite diário de ${dailyLimit} gerações de IA.`
              };
            }

            usage.dailyGenerationsCount += 1;
            usage.aiGenerationsCount += 1;
            usage.updatedAt = now;
            usage.schemaVersion = SCHEMA_VERSION;
            t.set(usageRef, usage);

            return {
              allowed: true,
              plan: sub.plan,
              currentCount: usage.dailyGenerationsCount,
              maxLimit: dailyLimit
            };
          }
        });
      } catch (err: any) {
        firestoreDisabled = true;
        if (isProd) {
          return {
            allowed: false,
            plan: 'FREE',
            currentCount: 0,
            maxLimit: 0,
            errorCode: 'BILLING_UNAVAILABLE',
            message: `Serviço de cotas indisponível em produção (fail-closed): ${err.message}`
          };
        }
      }
    }
  }

  // 2. Production Fail-Closed Guard
  if (isProd) {
    return {
      allowed: false,
      plan: 'FREE',
      currentCount: 0,
      maxLimit: 0,
      errorCode: 'BILLING_UNAVAILABLE',
      message: 'Serviço de validação de cotas indisponível em produção (armazenamento local proibido).'
    };
  }

  // 3. Transactional Durable Local Store with Strict Mutex (Development / Test ONLY)
  const unlock = await storeLock.acquire();
  try {
    const store = initLocalStore();
    let sub = store.subscriptions[userId];

    if (!sub) {
      sub = {
        userId,
        plan: 'FREE',
        status: 'active',
        cycle: 'monthly',
        provider: 'mercadopago',
        subscriptionId: `sub_free_${userId}`,
        currentPeriodStart: now,
        currentPeriodEnd: now + 365 * 24 * 60 * 60 * 1000,
        cancelAtPeriodEnd: false,
        createdAt: now,
        updatedAt: now,
        expiresAt: now + 365 * 24 * 60 * 60 * 1000,
        schemaVersion: SCHEMA_VERSION
      };
      store.subscriptions[userId] = sub;
    } else if (sub.plan === 'PRO' && sub.currentPeriodEnd < now && sub.status === 'active') {
      sub.status = 'expired';
      sub.plan = 'FREE';
      sub.updatedAt = now;
      sub.schemaVersion = SCHEMA_VERSION;
      store.subscriptions[userId] = sub;
    }

    let usage = store.usage[userId];
    if (!usage) {
      usage = {
        userId,
        diagnosesCount: 0,
        aiGenerationsCount: 0,
        dailyGenerationsCount: 0,
        imageGenerationsCount: 0,
        videoGenerationsCount: 0,
        lastResetTimestamp: now,
        lastDailyResetTimestamp: now,
        createdAt: now,
        updatedAt: now,
        schemaVersion: SCHEMA_VERSION
      };
      store.usage[userId] = usage;
    }

    if (now - usage.lastDailyResetTimestamp > oneDayMs) {
      usage.dailyGenerationsCount = 0;
      usage.lastDailyResetTimestamp = now;
    }

    if (now - usage.lastResetTimestamp > thirtyDaysMs) {
      usage.diagnosesCount = 0;
      usage.aiGenerationsCount = 0;
      usage.imageGenerationsCount = 0;
      usage.videoGenerationsCount = 0;
      usage.lastResetTimestamp = now;
    }

    const config = getPlanConfig(sub.plan);

    if (actionType === 'DIAGNOSIS') {
      const maxLimit = sub.plan === 'FREE' ? config.quotas.maxDiagnosesTotal : config.quotas.maxDiagnosesPerMonth;
      if (usage.diagnosesCount >= maxLimit) {
        return {
          allowed: false,
          plan: sub.plan,
          currentCount: usage.diagnosesCount,
          maxLimit,
          errorCode: sub.plan === 'FREE' ? 'FREE_QUOTA_EXCEEDED' : 'PRO_MONTHLY_QUOTA_EXCEEDED',
          message: sub.plan === 'FREE'
            ? 'Você atingiu o limite de 1 diagnóstico gratuito no plano Free. Faça upgrade para o InstaScore PRO para realizar análises adicionais.'
            : `Você atingiu seu limite de ${maxLimit} diagnósticos mensais do plano Pro.`
        };
      }

      usage.diagnosesCount += 1;
      usage.updatedAt = now;
      usage.schemaVersion = SCHEMA_VERSION;
      store.usage[userId] = usage;
      saveLocalStore(store);

      return {
        allowed: true,
        plan: sub.plan,
        currentCount: usage.diagnosesCount,
        maxLimit
      };
    } else if (actionType === 'IMAGE_GENERATION') {
      const limit = config.quotas.maxImageGenerationsPerMonth;
      if (limit <= 0) {
        return {
          allowed: false,
          plan: sub.plan,
          currentCount: usage.imageGenerationsCount,
          maxLimit: limit,
          errorCode: 'IMAGE_GENERATION_PRO_ONLY',
          message: 'A geração de imagens visuais estratégicas é exclusiva do plano InstaScore PRO.'
        };
      }
      if (usage.imageGenerationsCount >= limit) {
        return {
          allowed: false,
          plan: sub.plan,
          currentCount: usage.imageGenerationsCount,
          maxLimit: limit,
          errorCode: 'IMAGE_MONTHLY_QUOTA_EXCEEDED',
          message: `Você atingiu o limite mensal de ${limit} gerações de imagens do seu plano PRO.`
        };
      }

      usage.imageGenerationsCount += 1;
      usage.updatedAt = now;
      usage.schemaVersion = SCHEMA_VERSION;
      store.usage[userId] = usage;
      saveLocalStore(store);

      return {
        allowed: true,
        plan: sub.plan,
        currentCount: usage.imageGenerationsCount,
        maxLimit: limit
      };
    } else if (actionType === 'VIDEO_GENERATION') {
      const limit = config.quotas.maxVideoGenerationsPerMonth;
      if (limit <= 0) {
        return {
          allowed: false,
          plan: sub.plan,
          currentCount: usage.videoGenerationsCount,
          maxLimit: limit,
          errorCode: 'VIDEO_GENERATION_PRO_ONLY',
          message: 'A geração de roteiros de vídeo é exclusiva do plano InstaScore PRO.'
        };
      }
      if (usage.videoGenerationsCount >= limit) {
        return {
          allowed: false,
          plan: sub.plan,
          currentCount: usage.videoGenerationsCount,
          maxLimit: limit,
          errorCode: 'VIDEO_MONTHLY_QUOTA_EXCEEDED',
          message: `Você atingiu o limite mensal de ${limit} storyboards de vídeo do seu plano PRO.`
        };
      }

      usage.videoGenerationsCount += 1;
      usage.updatedAt = now;
      usage.schemaVersion = SCHEMA_VERSION;
      store.usage[userId] = usage;
      saveLocalStore(store);

      return {
        allowed: true,
        plan: sub.plan,
        currentCount: usage.videoGenerationsCount,
        maxLimit: limit
      };
    } else {
      const dailyLimit = config.quotas.maxAiGenerationsPerDay;
      if (usage.dailyGenerationsCount >= dailyLimit) {
        return {
          allowed: false,
          plan: sub.plan,
          currentCount: usage.dailyGenerationsCount,
          maxLimit: dailyLimit,
          errorCode: 'DAILY_AI_QUOTA_EXCEEDED',
          message: `Você atingiu o limite diário de ${dailyLimit} gerações de IA.`
        };
      }

      usage.dailyGenerationsCount += 1;
      usage.aiGenerationsCount += 1;
      usage.updatedAt = now;
      usage.schemaVersion = SCHEMA_VERSION;
      store.usage[userId] = usage;
      saveLocalStore(store);

      return {
        allowed: true,
        plan: sub.plan,
        currentCount: usage.dailyGenerationsCount,
        maxLimit: dailyLimit
      };
    }
  } finally {
    unlock();
  }
}

/**
 * Restitui atomicamente uma quota deduzida caso a execução da IA falhe (fail-safe refund policy).
 */
export async function refundQuota(
  userId: string,
  actionType: 'DIAGNOSIS' | 'AI_GENERATION' | 'IMAGE_GENERATION' | 'VIDEO_GENERATION'
): Promise<boolean> {
  if (!userId) userId = 'anonymous';
  const now = Date.now();
  const isProd = isProductionEnvironment();

  // 1. Try Firestore Transaction
  if (!firestoreDisabled) {
    const db = getFirebaseAdminFirestore();
    if (!db) {
      firestoreDisabled = true;
      if (isProd) {
        return false;
      }
    } else {
      try {
        const usageRef = db.collection('usage').doc(userId);

        await db.runTransaction(async (t) => {
          const doc = await t.get(usageRef);
          if (!doc.exists) return;
          const usage = doc.data() as UsageRecord;

          if (actionType === 'DIAGNOSIS') {
            if (usage.diagnosesCount > 0) usage.diagnosesCount -= 1;
          } else if (actionType === 'IMAGE_GENERATION') {
            if (usage.imageGenerationsCount > 0) usage.imageGenerationsCount -= 1;
          } else if (actionType === 'VIDEO_GENERATION') {
            if (usage.videoGenerationsCount > 0) usage.videoGenerationsCount -= 1;
          } else {
            if (usage.dailyGenerationsCount > 0) usage.dailyGenerationsCount -= 1;
            if (usage.aiGenerationsCount > 0) usage.aiGenerationsCount -= 1;
          }

          usage.updatedAt = now;
          t.set(usageRef, usage);
        });
        return true;
      } catch (err: any) {
        firestoreDisabled = true;
        if (isProd) {
          return false;
        }
      }
    }
  }

  // 2. Production Guard: Do not modify local store in production
  if (isProd) {
    return false;
  }

  // 3. Transactional Local Fallback Store (Development / Test ONLY)
  const unlock = await storeLock.acquire();
  try {
    const store = initLocalStore();
    const usage = store.usage[userId];
    if (usage) {
      if (actionType === 'DIAGNOSIS') {
        if (usage.diagnosesCount > 0) usage.diagnosesCount -= 1;
      } else if (actionType === 'IMAGE_GENERATION') {
        if (usage.imageGenerationsCount > 0) usage.imageGenerationsCount -= 1;
      } else if (actionType === 'VIDEO_GENERATION') {
        if (usage.videoGenerationsCount > 0) usage.videoGenerationsCount -= 1;
      } else {
        if (usage.dailyGenerationsCount > 0) usage.dailyGenerationsCount -= 1;
        if (usage.aiGenerationsCount > 0) usage.aiGenerationsCount -= 1;
      }
      usage.updatedAt = now;
      store.usage[userId] = usage;
      saveLocalStore(store);
    }
    return true;
  } finally {
    unlock();
  }
}

/**
 * Distributed rate limiter that functions reliably across multiple container instances (Cloud Run).
 * Uses atomic Firestore transactions on the 'rate_limits' collection with local memory fallback.
 */
export async function checkDistributedRateLimit(
  key: string,
  maxRequests: number = 10,
  windowMs: number = 10 * 60 * 1000
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const safeKey = crypto.createHash('sha256').update(key || 'anon').digest('hex').substring(0, 32);
  const now = Date.now();

  // 1. Try Firestore Transaction
  if (!firestoreDisabled) {
    try {
      const db = getFirebaseAdminFirestore();
      if (!db) {
        throw new Error('FIRESTORE_NOT_AVAILABLE');
      }
      const rateLimitRef = db.collection('rate_limits').doc(safeKey);

      return await db.runTransaction(async (t) => {
        const doc = await t.get(rateLimitRef);
        let record: { key: string; count: number; resetAt: number; updatedAt: number };

        if (!doc.exists) {
          record = {
            key: safeKey,
            count: 1,
            resetAt: now + windowMs,
            updatedAt: now
          };
          t.set(rateLimitRef, record);
          return { allowed: true, remaining: maxRequests - 1, resetAt: record.resetAt };
        }

        record = doc.data() as any;

        if (now > record.resetAt) {
          record.count = 1;
          record.resetAt = now + windowMs;
          record.updatedAt = now;
          t.set(rateLimitRef, record);
          return { allowed: true, remaining: maxRequests - 1, resetAt: record.resetAt };
        }

        if (record.count >= maxRequests) {
          return { allowed: false, remaining: 0, resetAt: record.resetAt };
        }

        record.count += 1;
        record.updatedAt = now;
        t.set(rateLimitRef, record);
        return { allowed: true, remaining: maxRequests - record.count, resetAt: record.resetAt };
      });
    } catch (err: any) {
      if (
        err.message === 'FIRESTORE_NOT_AVAILABLE' ||
        err.code === 7 ||
        err.code === 16 ||
        err.message?.includes('PERMISSION_DENIED') ||
        err.message?.includes('credentials') ||
        err.message?.includes('Could not load the default credentials') ||
        err.message?.includes('Cannot read properties of null')
      ) {
        firestoreDisabled = true;
      }
    }
  }

  // 2. Local memory fallback store
  const unlock = await storeLock.acquire();
  try {
    const store = initLocalStore();
    if (!(store as any).rate_limits) {
      (store as any).rate_limits = {};
    }
    const rateLimits = (store as any).rate_limits as Record<string, { count: number; resetAt: number }>;
    let record = rateLimits[safeKey];

    if (!record || now > record.resetAt) {
      record = { count: 1, resetAt: now + windowMs };
      rateLimits[safeKey] = record;
      saveLocalStore(store);
      return { allowed: true, remaining: maxRequests - 1, resetAt: record.resetAt };
    }

    if (record.count >= maxRequests) {
      return { allowed: false, remaining: 0, resetAt: record.resetAt };
    }

    record.count += 1;
    rateLimits[safeKey] = record;
    saveLocalStore(store);
    return { allowed: true, remaining: maxRequests - record.count, resetAt: record.resetAt };
  } finally {
    unlock();
  }
}

export const STAGING_APP_URL = 'https://ais-pre-kjyykzi73x3httzdxpoy6q-162439389760.us-east1.run.app';

export interface WebhookUrlValidationResult {
  valid: boolean;
  notificationUrl?: string;
  baseUrl?: string;
  error?: string;
  errorCode?: string;
}

/**
 * Validates and constructs an absolute HTTPS notification_url for payment gateways.
 * Prevents invalid localhost, null, undefined, or missing protocol values.
 */
export function validateAndBuildWebhookNotificationUrl(customCandidateBaseUrl?: string): WebhookUrlValidationResult {
  let rawCandidate = customCandidateBaseUrl !== undefined 
    ? customCandidateBaseUrl 
    : (process.env.APP_URL || process.env.PUBLIC_URL || '');

  rawCandidate = (rawCandidate || '').trim();

  // If candidate is empty or is a local placeholder, use known staging domain if in staging/dev
  if (!rawCandidate || rawCandidate === 'MY_APP_URL' || rawCandidate.includes('localhost') || rawCandidate.includes('127.0.0.1')) {
    if (customCandidateBaseUrl === undefined) {
      if (process.env.PAYMENT_ENVIRONMENT === 'production' && process.env.APP_URL && !process.env.APP_URL.includes('localhost') && process.env.APP_URL !== 'MY_APP_URL') {
        rawCandidate = process.env.APP_URL.trim();
      } else {
        // Automatic fallback for staging / development
        rawCandidate = STAGING_APP_URL;
      }
    }
  }

  if (!rawCandidate) {
    return {
      valid: false,
      error: 'APP_URL_MISSING: Variável de ambiente APP_URL não configurada no servidor.',
      errorCode: 'APP_URL_MISSING'
    };
  }

  // Check forbidden tokens
  if (
    rawCandidate.includes('undefined') ||
    rawCandidate.includes('null') ||
    rawCandidate.includes('localhost') ||
    rawCandidate.includes('127.0.0.1') ||
    /\s/.test(rawCandidate)
  ) {
    return {
      valid: false,
      error: `INVALID_APP_URL: URL base contém valores proibidos (localhost, espaços, null ou undefined): '${rawCandidate}'`,
      errorCode: 'INVALID_APP_URL'
    };
  }

  let parsedUrl: URL;
  try {
    // If rawCandidate has no protocol (e.g. "my-domain.com"), new URL will throw TypeError
    parsedUrl = new URL('/api/webhook/payment', rawCandidate);
  } catch (err: any) {
    return {
      valid: false,
      error: `INVALID_APP_URL_FORMAT: Não foi possível analisar a URL a partir de '${rawCandidate}': ${err.message}`,
      errorCode: 'INVALID_APP_URL_FORMAT'
    };
  }

  // 1. Must be https:
  if (parsedUrl.protocol !== 'https:') {
    return {
      valid: false,
      error: `INVALID_PROTOCOL: O gateway de pagamentos exige protocolo HTTPS para notification_url. Protocolo recebido: '${parsedUrl.protocol}'`,
      errorCode: 'INVALID_PROTOCOL'
    };
  }

  // 2. Hostname must be valid and contain at least one dot
  if (!parsedUrl.hostname || !parsedUrl.hostname.includes('.') || parsedUrl.hostname.startsWith('.') || parsedUrl.hostname.endsWith('.')) {
    return {
      valid: false,
      error: `INVALID_HOSTNAME: Hostname inválido '${parsedUrl.hostname}' para notification_url pública.`,
      errorCode: 'INVALID_HOSTNAME'
    };
  }

  // Clean pathname to remove any duplicate slashes
  parsedUrl.pathname = parsedUrl.pathname.replace(/\/+/g, '/');

  const notificationUrl = parsedUrl.toString();
  const baseUrl = `${parsedUrl.protocol}//${parsedUrl.host}`;

  return {
    valid: true,
    notificationUrl,
    baseUrl
  };
}

/**
 * Creates a REAL Payment Checkout Session with fail-closed production controls.
 */
export async function createCheckoutSessionServer(params: {
  userId: string;
  planId: 'PRO' | 'FREE';
  cycle: 'monthly' | 'annual';
  paymentMethod: 'pix' | 'card';
  userEmail?: string;
  appUrl?: string;
}): Promise<CheckoutSessionRecord> {
  const { userId, planId, cycle, paymentMethod, userEmail, appUrl } = params;

  const isLiveProduction = process.env.PAYMENT_ENVIRONMENT === 'production' || process.env.NODE_ENV === 'production';
  const isSandbox = process.env.PAYMENT_ENVIRONMENT === 'sandbox' || !process.env.PAYMENT_ENVIRONMENT;
  const mpAccessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

  // STRICT FAIL-CLOSED: In real live production, MERCADOPAGO_ACCESS_TOKEN is mandatory
  if (isLiveProduction && !mpAccessToken) {
    const configErr: any = new Error('GATEWAY_CONFIGURATION_ERROR: MERCADOPAGO_ACCESS_TOKEN é obrigatório em ambiente de produção.');
    configErr.status = 503;
    configErr.code = 'GATEWAY_CONFIG_MISSING';
    throw configErr;
  }

  // Validate and construct notification_url and clean baseUrl
  const webhookUrlValidation = validateAndBuildWebhookNotificationUrl(appUrl);
  if (!webhookUrlValidation.valid || !webhookUrlValidation.notificationUrl || !webhookUrlValidation.baseUrl) {
    const configErr: any = new Error(
      `GATEWAY_CONFIGURATION_ERROR: ${webhookUrlValidation.error || 'notification_url inválida para o gateway de pagamentos.'}`
    );
    configErr.status = 503;
    configErr.code = webhookUrlValidation.errorCode || 'GATEWAY_CONFIG_MISSING';
    throw configErr;
  }

  const notificationUrl = webhookUrlValidation.notificationUrl;
  const baseUrl = webhookUrlValidation.baseUrl;

  const selectedPlanConfig = getPlanConfig(planId);
  const amount = cycle === 'annual' ? selectedPlanConfig.priceAnnual : selectedPlanConfig.priceMonthly;
  const sessionId = `chk_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  const now = Date.now();
  const expiresAt = now + 30 * 60 * 1000;

  let checkoutRecord: CheckoutSessionRecord = {
    sessionId,
    userId,
    planId,
    cycle,
    amount,
    paymentMethod,
    status: 'pending',
    provider: mpAccessToken ? 'mercadopago' : (isLiveProduction ? 'mercadopago' : 'pix_card_simulated'),
    createdAt: now,
    updatedAt: now,
    expiresAt,
    retentionUntil: calculateRetentionUntil(RETENTION_POLICIES.CHECKOUT_SESSIONS_DAYS),
    schemaVersion: SCHEMA_VERSION
  };

  if (mpAccessToken) {
    try {
      if (paymentMethod === 'pix') {
        const mpRes = await fetch('https://api.mercadopago.com/v1/payments', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${mpAccessToken}`,
            'Content-Type': 'application/json',
            'X-Idempotency-Key': sessionId
          },
          body: JSON.stringify({
            transaction_amount: amount,
            description: `InstaScore PRO - Plano ${cycle === 'annual' ? 'Anual' : 'Mensal'}`,
            payment_method_id: 'pix',
            payer: {
              email: userEmail || `user_${userId.substring(0, 8)}@instascore.ai`,
              first_name: 'InstaScore',
              last_name: 'User'
            },
            notification_url: notificationUrl,
            external_reference: sessionId,
            metadata: {
              user_id: userId,
              session_id: sessionId,
              plan_id: planId,
              cycle
            }
          })
        });

        const mpData = await mpRes.json().catch(() => ({}));
        if (mpRes.ok && mpData.point_of_interaction?.transaction_data) {
          const txData = mpData.point_of_interaction.transaction_data;
          checkoutRecord.providerPaymentId = String(mpData.id);
          checkoutRecord.pixQrCodeText = txData.qr_code;
          checkoutRecord.pixQrCodeBase64 = txData.qr_code_base64;
          checkoutRecord.checkoutUrl = txData.ticket_url;
        } else {
          const errDetail = mpData?.message || mpData?.error || `Status HTTP ${mpRes.status}`;
          const pixErr: any = new Error(`PIX_GENERATION_FAILED: ${errDetail}`);
          pixErr.status = mpRes.status === 401 ? 401 : mpRes.status === 400 ? 400 : 503;
          pixErr.code = mpRes.status === 401 ? 'GATEWAY_AUTH_ERROR' : mpRes.status === 400 ? 'GATEWAY_BAD_REQUEST' : 'PIX_GENERATION_FAILED';
          pixErr.details = mpData;
          if (isLiveProduction) {
            throw pixErr;
          }
        }
      } else {
        const prefRes = await fetch('https://api.mercadopago.com/checkout/preferences', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${mpAccessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            items: [
              {
                id: `instascore_pro_${cycle}`,
                title: `InstaScore PRO (${cycle === 'annual' ? 'Anual' : 'Mensal'})`,
                quantity: 1,
                currency_id: 'BRL',
                unit_price: amount
              }
            ],
            external_reference: sessionId,
            payer: {
              email: userEmail || `user_${userId.substring(0, 8)}@instascore.ai`
            },
            back_urls: {
              success: `${baseUrl}/my-plan?checkout=success&session=${sessionId}`,
              failure: `${baseUrl}/my-plan?checkout=failed`,
              pending: `${baseUrl}/my-plan?checkout=pending`
            },
            auto_return: 'approved',
            notification_url: notificationUrl,
            metadata: {
              user_id: userId,
              session_id: sessionId,
              plan_id: planId,
              cycle
            }
          })
        });

        const prefData = await prefRes.json().catch(() => ({}));
        if (prefRes.ok && (prefData.init_point || prefData.sandbox_init_point)) {
          checkoutRecord.checkoutUrl = (isSandbox && prefData.sandbox_init_point) 
            ? prefData.sandbox_init_point 
            : (prefData.init_point || prefData.sandbox_init_point);
          checkoutRecord.providerPaymentId = String(prefData.id);
        } else {
          const errDetail = prefData?.message || prefData?.error || `Status HTTP ${prefRes.status}`;
          const cardErr: any = new Error(`CARD_PREFERENCE_FAILED: ${errDetail}`);
          cardErr.status = prefRes.status === 401 ? 401 : prefRes.status === 400 ? 400 : 503;
          cardErr.code = prefRes.status === 401 ? 'GATEWAY_AUTH_ERROR' : prefRes.status === 400 ? 'GATEWAY_BAD_REQUEST' : 'CARD_PREFERENCE_FAILED';
          cardErr.details = prefData;
          if (isLiveProduction) {
            throw cardErr;
          }
        }
      }
    } catch (err: any) {
      console.error(`[MercadoPago Checkout API Exception] status=${err.status || 500} code=${err.code || 'UNKNOWN'}`, err.message);
      if (isLiveProduction) {
        throw err;
      }
    }
  }

  // FAIL-CLOSED: In production, completely disable simulated Pix and fallback checkout URLs
  if (isLiveProduction) {
    if (paymentMethod === 'pix' && !checkoutRecord.pixQrCodeText) {
      const failErr: any = new Error('PIX_GATEWAY_UNAVAILABLE: Falha ao gerar chave Pix oficial do provedor em produção.');
      failErr.status = 503;
      failErr.code = 'PIX_GATEWAY_UNAVAILABLE';
      throw failErr;
    }
    if (paymentMethod === 'card' && !checkoutRecord.checkoutUrl) {
      const failErr: any = new Error('CARD_GATEWAY_UNAVAILABLE: Falha ao gerar link de pagamento oficial do provedor em produção.');
      failErr.status = 503;
      failErr.code = 'CARD_GATEWAY_UNAVAILABLE';
      throw failErr;
    }
  } else {
    // Only in development/testing mode allow simulated fallback
    if (!checkoutRecord.pixQrCodeText && paymentMethod === 'pix') {
      const formattedAmount = amount.toFixed(2);
      const pixCode = `00020126580014BR.GOV.BCB.PIX0136instascore-pay-${sessionId}5204000053039865405${formattedAmount}5802BR5920InstaScore AI Brasil6009SAO PAULO62070503***63041D2A`;
      checkoutRecord.pixQrCodeText = pixCode;
    }

    if (!checkoutRecord.checkoutUrl && paymentMethod === 'card') {
      checkoutRecord.checkoutUrl = `${baseUrl}/checkout/${sessionId}`;
    }
  }

  // Persist session
  if (!firestoreDisabled) {
    try {
      const db = getFirebaseAdminFirestore();
      if (db) {
        await db.collection('checkout_sessions').doc(sessionId).set(checkoutRecord);
      } else {
        firestoreDisabled = true;
        if (isLiveProduction) {
          throw new BillingUnavailableError('FIRESTORE_CONFIG_MISSING', 'Firestore Admin não configurado para salvar sessão de checkout em produção.');
        }
      }
    } catch (err: any) {
      firestoreDisabled = true;
      if (isLiveProduction) {
        throw new BillingUnavailableError('BILLING_UNAVAILABLE', `Falha ao persistir sessão de checkout no Firestore em produção: ${err.message}`, err);
      }
    }
  } else if (isLiveProduction) {
    throw new BillingUnavailableError('BILLING_UNAVAILABLE', 'Serviço de checkout indisponível em produção (armazenamento local proibido).');
  }

  // Only in dev / testing mode allow local store fallback
  if (!isLiveProduction) {
    const unlock = await storeLock.acquire();
    try {
      const store = initLocalStore();
      store.checkout_sessions[sessionId] = checkoutRecord;
      saveLocalStore(store);
    } finally {
      unlock();
    }
  }

  return checkoutRecord;
}

export interface WebhookValidationResult {
  valid: boolean;
  status: number;
  error?: string;
  message?: string;
  dataId?: string;
  requestId?: string;
  timestamp?: number;
}

/**
 * Validates Webhook Secret/Signature with strict fail-closed posture and constant-time HMAC comparison.
 */
export function validateWebhookSignature(
  reqHeaders: Record<string, any>,
  reqBody: any,
  reqQuery?: Record<string, any>,
  customSecret?: string
): WebhookValidationResult {
  const isProd = process.env.NODE_ENV === 'production' || process.env.PAYMENT_ENVIRONMENT === 'production';
  const webhookSecret = customSecret !== undefined ? customSecret : process.env.MERCADOPAGO_WEBHOOK_SECRET;

  // 1. Fail-closed check for secret presence
  if (!webhookSecret) {
    if (isProd) {
      return {
        valid: false,
        status: 503,
        error: 'WEBHOOK_SECRET_UNCONFIGURED',
        message: 'MERCADOPAGO_WEBHOOK_SECRET não configurado em ambiente de produção (fail-closed).'
      };
    }
    const hasSignatureHeader = Boolean(
      reqHeaders['x-signature'] ||
      reqHeaders['x_signature'] ||
      reqHeaders['x-webhook-secret'] ||
      reqHeaders['x-hub-signature-256']
    );
    if (hasSignatureHeader) {
      return {
        valid: false,
        status: 503,
        error: 'WEBHOOK_SECRET_UNCONFIGURED',
        message: 'MERCADOPAGO_WEBHOOK_SECRET ausente no servidor para validar assinatura.'
      };
    }
    return {
      valid: false,
      status: 401,
      error: 'MISSING_WEBHOOK_SIGNATURE',
      message: 'Cabeçalho de assinatura do webhook ausente (x-signature).'
    };
  }

  // 2. Extract Signature Header
  const signatureHeader = reqHeaders['x-signature'] || reqHeaders['x_signature'] || reqHeaders['x-hub-signature-256'];
  const directSecretHeader = reqHeaders['x-webhook-secret'];

  // Direct secret comparison (if sent via x-webhook-secret)
  if (directSecretHeader && !signatureHeader) {
    const givenBuf = Buffer.from(String(directSecretHeader), 'utf8');
    const secretBuf = Buffer.from(webhookSecret, 'utf8');
    if (givenBuf.length !== secretBuf.length || !crypto.timingSafeEqual(givenBuf, secretBuf)) {
      return {
        valid: false,
        status: 401,
        error: 'INVALID_WEBHOOK_SECRET',
        message: 'O cabeçalho x-webhook-secret fornecido é inválido.'
      };
    }
    return { valid: true, status: 200 };
  }

  if (!signatureHeader || typeof signatureHeader !== 'string') {
    return {
      valid: false,
      status: 401,
      error: 'MISSING_WEBHOOK_SIGNATURE',
      message: 'Cabeçalho x-signature ausente ou inválido.'
    };
  }

  // 3. Parse ts and v1 from x-signature (e.g. ts=1710000000,v1=abcdef...)
  const parts = signatureHeader.split(/[,;]/);
  const tsPart = parts.find(p => p.trim().startsWith('ts='));
  const v1Parts = parts.filter(p => p.trim().startsWith('v1='));

  if (!tsPart || v1Parts.length === 0) {
    return {
      valid: false,
      status: 401,
      error: 'MALFORMED_SIGNATURE',
      message: 'Formato do cabeçalho x-signature malformado (deve conter ts= e v1=).'
    };
  }

  const tsVal = tsPart.trim().substring(3);
  const tsNum = Number(tsVal);
  if (isNaN(tsNum) || tsNum <= 0) {
    return {
      valid: false,
      status: 401,
      error: 'INVALID_TIMESTAMP',
      message: 'Timestamp da assinatura é inválido ou não-numérico.'
    };
  }

  // 4. Replay Attack & Timestamp Expiration Check (5 minutes = 300,000 ms)
  const tsMs = tsNum < 10000000000 ? tsNum * 1000 : tsNum;
  const now = Date.now();
  const TOLERANCE_MS = 5 * 60 * 1000;
  if (Math.abs(now - tsMs) > TOLERANCE_MS) {
    return {
      valid: false,
      status: 401,
      error: 'SIGNATURE_REPLAY_OR_EXPIRED',
      message: `Timestamp fora da janela de tolerância de 5 minutos (${Math.round(Math.abs(now - tsMs) / 1000)}s de diferença). Replay attack rejeitado.`
    };
  }

  // 5. Build Manifest and Verify HMAC with Constant-Time Comparison
  const dataId = reqBody?.data?.id || reqBody?.id || reqQuery?.['data.id'] || reqQuery?.id || '';
  const requestId = reqHeaders['x-request-id'] || '';
  const manifest = `id:${dataId};request-id:${requestId};ts:${tsVal};`;

  const computedHex = crypto.createHmac('sha256', webhookSecret).update(manifest).digest('hex');
  const computedBuf = Buffer.from(computedHex.toLowerCase(), 'utf8');

  // Verify against all v1 signatures in header (Mercado Pago key rotation support)
  let matched = false;
  for (const v1Part of v1Parts) {
    const receivedHash = v1Part.trim().substring(3).toLowerCase();
    const receivedBuf = Buffer.from(receivedHash, 'utf8');
    if (computedBuf.length === receivedBuf.length && crypto.timingSafeEqual(computedBuf, receivedBuf)) {
      matched = true;
      break;
    }
  }

  if (!matched) {
    return {
      valid: false,
      status: 401,
      error: 'HMAC_SIGNATURE_MISMATCH',
      message: 'Assinatura HMAC SHA256 divergente do secret configurado.'
    };
  }

  return {
    valid: true,
    status: 200,
    dataId: String(dataId),
    requestId: String(requestId),
    timestamp: tsMs
  };
}

export interface S2SVerificationResult {
  verified: boolean;
  httpStatus: number;
  errorCode?: string;
  errorMessage?: string;
  paymentDetails?: {
    id: string;
    status: string;
    amount: number;
    currencyId: string;
    userId: string;
    sessionId?: string;
    planId: PlanType;
    cycle: 'monthly' | 'annual';
    rawPayment: any;
  };
}

/**
 * Server-to-Server Payment Verification against Mercado Pago.
 * Verifies payment ID, status, amount, currency (BRL), plan, cycle, session, and server-generated metadata.
 */
export async function verifyMercadoPagoPaymentS2S(params: {
  providerPaymentId: string;
  expectedSessionId?: string;
  expectedUserId?: string;
  fixturePayment?: any;
}): Promise<S2SVerificationResult> {
  const { providerPaymentId, expectedSessionId, expectedUserId, fixturePayment } = params;
  const isProd = process.env.NODE_ENV === 'production' || process.env.PAYMENT_ENVIRONMENT === 'production';
  const mpAccessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

  let paymentData: any = null;

  if (fixturePayment) {
    paymentData = fixturePayment;
  } else {
    if (!mpAccessToken) {
      if (isProd) {
        return {
          verified: false,
          httpStatus: 503,
          errorCode: 'MERCADOPAGO_CREDENTIALS_MISSING',
          errorMessage: 'MERCADOPAGO_ACCESS_TOKEN ausente em produção para verificação S2S.'
        };
      }
      return {
        verified: false,
        httpStatus: 503,
        errorCode: 'MERCADOPAGO_ACCESS_TOKEN_MISSING',
        errorMessage: 'Token de acesso do Mercado Pago não configurado no servidor.'
      };
    }

    try {
      const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${providerPaymentId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${mpAccessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!mpRes.ok) {
        return {
          verified: false,
          httpStatus: mpRes.status >= 500 ? 502 : 400,
          errorCode: 'PAYMENT_LOOKUP_FAILED',
          errorMessage: `Falha ao consultar pagamento ${providerPaymentId} no Mercado Pago (HTTP ${mpRes.status}).`
        };
      }

      paymentData = await mpRes.json();
    } catch (err: any) {
      console.error('[MercadoPago S2S Exception]', err);
      return {
        verified: false,
        httpStatus: 502,
        errorCode: 'GATEWAY_NETWORK_ERROR',
        errorMessage: `Erro de rede ao consultar Mercado Pago: ${err.message}`
      };
    }
  }

  // 1. Payment ID verification
  if (!paymentData || String(paymentData.id) !== String(providerPaymentId)) {
    return {
      verified: false,
      httpStatus: 400,
      errorCode: 'PAYMENT_ID_MISMATCH',
      errorMessage: `ID do pagamento retornado (${paymentData?.id}) difere do providerPaymentId (${providerPaymentId}).`
    };
  }

  // 2. Currency verification
  if (paymentData.currency_id !== 'BRL') {
    return {
      verified: false,
      httpStatus: 400,
      errorCode: 'INVALID_CURRENCY',
      errorMessage: `Moeda inválida: esperado BRL, recebido '${paymentData.currency_id}'.`
    };
  }

  // 3. Status check: Only 'approved' or 'accredited' qualify for PRO upgrade
  const rawStatus = String(paymentData.status || '').toLowerCase();
  const isApproved = rawStatus === 'approved' || rawStatus === 'accredited';

  // 4. Extract Server-Generated Metadata (Do NOT trust client-supplied / body-supplied untrusted userId!)
  const meta = paymentData.metadata || {};
  const metaUserId = meta.user_id || meta.userId || paymentData.external_reference_user_id;
  const metaSessionId = meta.session_id || meta.sessionId || paymentData.external_reference || expectedSessionId;
  const metaPlanId: PlanType = (meta.plan_id || meta.planId || 'PRO') === 'PRO' ? 'PRO' : 'FREE';
  const metaCycle: 'monthly' | 'annual' = meta.cycle === 'annual' ? 'annual' : 'monthly';
  const paymentAmount = Number(paymentData.transaction_amount || paymentData.total_paid_amount || 0);

  // 5. Cross-Check with Server Checkout Session (if sessionId exists)
  let sessionRecord: CheckoutSessionRecord | null = null;
  if (metaSessionId) {
    if (!firestoreDisabled) {
      try {
        const db = getFirebaseAdminFirestore();
        if (db) {
          const doc = await db.collection('checkout_sessions').doc(metaSessionId).get();
          if (doc.exists) {
            sessionRecord = doc.data() as CheckoutSessionRecord;
          }
        }
      } catch {
        firestoreDisabled = true;
      }
    }
    if (!sessionRecord) {
      const store = initLocalStore();
      sessionRecord = store.checkout_sessions[metaSessionId] || null;
    }
  }

  if (sessionRecord) {
    // Validate that metadata user_id matches checkout session user_id
    if (metaUserId && sessionRecord.userId !== metaUserId) {
      return {
        verified: false,
        httpStatus: 403,
        errorCode: 'USER_MISMATCH',
        errorMessage: `O userId da metadata (${metaUserId}) difere do dono da sessão de checkout (${sessionRecord.userId}).`
      };
    }

    // Validate amount matches checkout session
    if (Math.abs(sessionRecord.amount - paymentAmount) > 0.05) {
      return {
        verified: false,
        httpStatus: 400,
        errorCode: 'AMOUNT_MISMATCH',
        errorMessage: `Valor pago (R$ ${paymentAmount}) diverge do valor registrado na sessão (R$ ${sessionRecord.amount}).`
      };
    }

    // Validate plan & cycle match checkout session
    if (sessionRecord.planId !== metaPlanId || sessionRecord.cycle !== metaCycle) {
      return {
        verified: false,
        httpStatus: 400,
        errorCode: 'PLAN_OR_CYCLE_MISMATCH',
        errorMessage: 'Plano ou ciclo do pagamento diverge da sessão criada pelo servidor.'
      };
    }
  }

  // Validate against expectedUserId if provided
  if (expectedUserId && metaUserId && expectedUserId !== metaUserId) {
    return {
      verified: false,
      httpStatus: 403,
      errorCode: 'USER_MISMATCH',
      errorMessage: `UserId solicitado (${expectedUserId}) diverge do userId autenticado na metadata do Mercado Pago (${metaUserId}).`
    };
  }

  // Validate expected plan official price
  const planConfig = getPlanConfig(metaPlanId);
  const expectedPlanPrice = metaCycle === 'annual' ? planConfig.priceAnnual : planConfig.priceMonthly;
  if (Math.abs(paymentAmount - expectedPlanPrice) > 0.05) {
    return {
      verified: false,
      httpStatus: 400,
      errorCode: 'PRICE_MISMATCH',
      errorMessage: `Valor pago (R$ ${paymentAmount}) diverge do valor oficial do plano (R$ ${expectedPlanPrice}).`
    };
  }

  const trustedUserId = metaUserId || sessionRecord?.userId;
  if (!trustedUserId) {
    return {
      verified: false,
      httpStatus: 400,
      errorCode: 'UNIDENTIFIED_USER',
      errorMessage: 'Não foi possível vincular o pagamento a nenhum usuário via metadata ou sessão de checkout.'
    };
  }

  if (!isApproved) {
    return {
      verified: false,
      httpStatus: 200,
      errorCode: 'PAYMENT_NOT_APPROVED',
      errorMessage: `Pagamento com status '${rawStatus}' não qualifica para upgrade PRO.`,
      paymentDetails: {
        id: String(paymentData.id),
        status: rawStatus,
        amount: paymentAmount,
        currencyId: paymentData.currency_id,
        userId: trustedUserId,
        sessionId: metaSessionId,
        planId: metaPlanId,
        cycle: metaCycle,
        rawPayment: paymentData
      }
    };
  }

  return {
    verified: true,
    httpStatus: 200,
    paymentDetails: {
      id: String(paymentData.id),
      status: 'approved',
      amount: paymentAmount,
      currencyId: paymentData.currency_id,
      userId: trustedUserId,
      sessionId: metaSessionId,
      planId: metaPlanId,
      cycle: metaCycle,
      rawPayment: paymentData
    }
  };
}

/**
 * Handles Webhook Events with Fail-Closed S2S Verification, ATOMIC TRANSACTIONS, & Idempotency by eventId AND providerPaymentId.
 */
export async function processWebhookEvent(event: {
  eventId: string;
  eventType: string;
  userId?: string;
  cycle?: 'monthly' | 'annual';
  status?: string;
  incomingStatus?: string;
  provider?: 'mercadopago' | 'pix_card_simulated';
  sessionId?: string;
  providerPaymentId?: string;
  payload?: any;
  headers?: Record<string, any>;
  fixturePayment?: any;
}): Promise<{
  success: boolean;
  processed: boolean;
  httpStatus?: number;
  reason?: string;
  message?: string;
  subscription?: SubscriptionRecord;
}> {
  let { eventId, eventType, cycle, status, incomingStatus, provider, sessionId, providerPaymentId, payload, fixturePayment } = event;

  if (!eventId) {
    return {
      success: false,
      processed: false,
      httpStatus: 400,
      reason: 'INVALID_EVENT_ID',
      message: 'eventId é obrigatório.'
    };
  }

  const paymentId = providerPaymentId || String(payload?.data?.id || payload?.id || '');
  const now = Date.now();
  const sanitizedPayload = sanitizePaymentPayload(payload);

  const isProd = isProductionEnvironment();

  // 1. Transactional Idempotency Check by eventId AND providerPaymentId
  if (!firestoreDisabled) {
    try {
      const db = getFirebaseAdminFirestore();
      if (db) {
        const existingEvent = await db.collection('webhook_events').doc(eventId).get();
        if (existingEvent.exists) {
          const evtData = existingEvent.data() as WebhookEventRecord;
          const sub = await getSubscription(evtData.userId);
          return {
            success: true,
            processed: false,
            httpStatus: 200,
            reason: 'EVENTO_JA_PROCESSADO_IDEMPOTENCIA',
            subscription: sub
          };
        }

        if (paymentId) {
          const existingPayment = await db.collection('payments_processed').doc(paymentId).get();
          if (existingPayment.exists) {
            const payData = existingPayment.data() as any;
            const sub = await getSubscription(payData.userId);
            return {
              success: true,
              processed: false,
              httpStatus: 200,
              reason: 'PAGAMENTO_JA_PROCESSADO_IDEMPOTENCIA',
              subscription: sub
            };
          }
        }
      } else {
        firestoreDisabled = true;
        if (isProd) {
          return {
            success: false,
            processed: false,
            httpStatus: 503,
            reason: 'FIRESTORE_CONFIG_MISSING',
            message: 'Firestore Admin não configurado para processar webhook em produção (fail-closed).'
          };
        }
      }
    } catch (err: any) {
      firestoreDisabled = true;
      if (isProd) {
        return {
          success: false,
          processed: false,
          httpStatus: 503,
          reason: 'BILLING_UNAVAILABLE',
          message: `Falha na verificação de idempotência no Firestore: ${err.message}`
        };
      }
    }
  } else if (isProd) {
    return {
      success: false,
      processed: false,
      httpStatus: 503,
      reason: 'BILLING_UNAVAILABLE',
      message: 'Serviço de webhook indisponível em produção (armazenamento local proibido).'
    };
  }

  // Local Store idempotency check (Development / Test ONLY)
  if (!isProd) {
    const store = initLocalStore();
    if (store.webhook_events[eventId]) {
      const existingEvt = store.webhook_events[eventId];
      const sub = await getSubscription(existingEvt.userId);
      return {
        success: true,
        processed: false,
        httpStatus: 200,
        reason: 'EVENTO_JA_PROCESSADO_IDEMPOTENCIA',
        subscription: sub
      };
    }

    if (paymentId && store.processed_payments && store.processed_payments[paymentId]) {
      const existingPay = store.processed_payments[paymentId];
      const sub = await getSubscription(existingPay.userId);
      return {
        success: true,
        processed: false,
        httpStatus: 200,
        reason: 'PAGAMENTO_JA_PROCESSADO_IDEMPOTENCIA',
        subscription: sub
      };
    }
  }

  // 2. Server-to-Server Verification (when paymentId or fixturePayment is present)
  let trustedUserId = '';
  let verifiedPlanId: PlanType = 'PRO';
  let verifiedCycle: 'monthly' | 'annual' = cycle || 'monthly';
  let isApproved = false;
  let eventStatus = status || incomingStatus || 'pending';

  if (paymentId || fixturePayment) {
    const s2sResult = await verifyMercadoPagoPaymentS2S({
      providerPaymentId: paymentId,
      expectedSessionId: sessionId,
      fixturePayment
    });

    if (!s2sResult.verified) {
      // If payment is pending or not approved, record the event but DO NOT grant PRO access
      if (s2sResult.errorCode === 'PAYMENT_NOT_APPROVED') {
        const recordedUserId = s2sResult.paymentDetails?.userId || 'unknown';
        const rawStatus = s2sResult.paymentDetails?.status || 'pending';

        const webhookRecord: WebhookEventRecord = {
          eventId,
          eventType: eventType || 'payment.updated',
          userId: recordedUserId,
          status: rawStatus,
          provider: provider || 'mercadopago',
          processedAt: now,
          payload: sanitizedPayload,
          createdAt: now,
          updatedAt: now,
          schemaVersion: SCHEMA_VERSION
        };

        if (!firestoreDisabled) {
          try {
            const db = getFirebaseAdminFirestore();
            if (db) {
              await db.collection('webhook_events').doc(eventId).set(webhookRecord);
              if (sessionId) {
                await db.collection('checkout_sessions').doc(sessionId).update({ status: rawStatus as any, updatedAt: now });
              }
            }
          } catch {
            firestoreDisabled = true;
          }
        }

        const unlock = await storeLock.acquire();
        try {
          const s = initLocalStore();
          s.webhook_events[eventId] = webhookRecord;
          if (sessionId && s.checkout_sessions[sessionId]) {
            s.checkout_sessions[sessionId].status = rawStatus as any;
            s.checkout_sessions[sessionId].updatedAt = now;
          }
          saveLocalStore(s);
        } finally {
          unlock();
        }

        return {
          success: true,
          processed: false,
          httpStatus: 200,
          reason: 'PAGAMENTO_PENDENTE_SEM_UPGRADE',
          message: s2sResult.errorMessage
        };
      }

      // Security / Verification error (Amount mismatch, user mismatch, secret/token missing, etc.)
      return {
        success: false,
        processed: false,
        httpStatus: s2sResult.httpStatus || 400,
        reason: s2sResult.errorCode || 'S2S_VERIFICATION_FAILED',
        message: s2sResult.errorMessage || 'Falha na verificação do pagamento com o Mercado Pago.'
      };
    }

    // S2S Verification Succeeded!
    isApproved = true;
    trustedUserId = s2sResult.paymentDetails!.userId;
    verifiedPlanId = s2sResult.paymentDetails!.planId;
    verifiedCycle = s2sResult.paymentDetails!.cycle;
    eventStatus = 'approved';
    sessionId = s2sResult.paymentDetails!.sessionId || sessionId;
  } else {
    // No payment ID: e.g. generic event
    eventStatus = status || incomingStatus || 'pending';
    isApproved = eventStatus === 'approved' || eventStatus === 'accredited' || eventType === 'payment.approved';
    trustedUserId = event.userId || '';
    if (!trustedUserId) {
      return {
        success: false,
        processed: false,
        httpStatus: 400,
        reason: 'USER_ID_REQUIRED',
        message: 'userId é obrigatório para eventos sem paymentId.'
      };
    }
  }

  const durationMs = (verifiedCycle === 'annual' ? 365 : 30) * 24 * 60 * 60 * 1000;

  // 3. Atomically update Subscription & Usage & Webhook Events
  if (!firestoreDisabled) {
    try {
      const db = getFirebaseAdminFirestore();
      if (!db) {
        throw new Error('FIRESTORE_NOT_AVAILABLE');
      }
      const eventRef = db.collection('webhook_events').doc(eventId);
      const subRef = db.collection('subscriptions').doc(trustedUserId);
      const usageRef = db.collection('usage').doc(trustedUserId);
      const paymentRef = paymentId ? db.collection('payments_processed').doc(paymentId) : null;
      const sessionRef = sessionId ? db.collection('checkout_sessions').doc(sessionId) : null;

      return await db.runTransaction(async (t) => {
        const existingEventDoc = await t.get(eventRef);
        if (existingEventDoc.exists) {
          const subDoc = await t.get(subRef);
          const sub = subDoc.exists ? (subDoc.data() as SubscriptionRecord) : null;
          return {
            success: true,
            processed: false,
            httpStatus: 200,
            reason: 'EVENTO_JA_PROCESSADO_IDEMPOTENCIA',
            subscription: sub || undefined
          };
        }

        if (paymentRef) {
          const existingPayDoc = await t.get(paymentRef);
          if (existingPayDoc.exists) {
            const subDoc = await t.get(subRef);
            const sub = subDoc.exists ? (subDoc.data() as SubscriptionRecord) : null;
            return {
              success: true,
              processed: false,
              httpStatus: 200,
              reason: 'PAGAMENTO_JA_PROCESSADO_IDEMPOTENCIA',
              subscription: sub || undefined
            };
          }
        }

        const webhookRecord: WebhookEventRecord = {
          eventId,
          eventType: eventType || 'payment.approved',
          userId: trustedUserId,
          status: eventStatus,
          provider: provider || 'mercadopago',
          processedAt: now,
          payload: sanitizedPayload,
          createdAt: now,
          updatedAt: now,
          retentionUntil: calculateRetentionUntil(RETENTION_POLICIES.WEBHOOK_EVENTS_DAYS),
          schemaVersion: SCHEMA_VERSION
        };
        t.set(eventRef, webhookRecord);

        if (paymentRef) {
          t.set(paymentRef, {
            paymentId,
            eventId,
            userId: trustedUserId,
            status: eventStatus,
            amount: payload?.transaction_amount || (verifiedCycle === 'annual' ? getPlanConfig(verifiedPlanId).priceAnnual : getPlanConfig(verifiedPlanId).priceMonthly),
            processedAt: now,
            schemaVersion: SCHEMA_VERSION
          });
        }

        if (sessionRef) {
          t.update(sessionRef, {
            status: isApproved ? 'approved' : 'pending',
            updatedAt: now
          });
        }

        const subDoc = await t.get(subRef);
        const existingSub = subDoc.exists ? (subDoc.data() as SubscriptionRecord) : null;

        let updatedSub: SubscriptionRecord;

        if (isApproved) {
          updatedSub = {
            userId: trustedUserId,
            plan: verifiedPlanId,
            status: 'active',
            cycle: verifiedCycle,
            provider: provider || 'mercadopago',
            subscriptionId: `sub_pro_${trustedUserId}_${now}`,
            providerSubscriptionId: paymentId || undefined,
            currentPeriodStart: now,
            currentPeriodEnd: now + durationMs,
            cancelAtPeriodEnd: false,
            createdAt: existingSub ? existingSub.createdAt : now,
            updatedAt: now,
            expiresAt: now + durationMs,
            retentionUntil: calculateRetentionUntil(RETENTION_POLICIES.CHECKOUT_SESSIONS_DAYS),
            schemaVersion: SCHEMA_VERSION
          };
          t.set(subRef, updatedSub);

          const usageDoc = await t.get(usageRef);
          const usageData: UsageRecord = usageDoc.exists
            ? {
                ...(usageDoc.data() as UsageRecord),
                diagnosesCount: 0,
                aiGenerationsCount: 0,
                updatedAt: now,
                schemaVersion: SCHEMA_VERSION
              }
            : {
                userId: trustedUserId,
                diagnosesCount: 0,
                aiGenerationsCount: 0,
                dailyGenerationsCount: 0,
                imageGenerationsCount: 0,
                videoGenerationsCount: 0,
                lastResetTimestamp: now,
                lastDailyResetTimestamp: now,
                createdAt: now,
                updatedAt: now,
                schemaVersion: SCHEMA_VERSION
              };
          t.set(usageRef, usageData);
        } else {
          updatedSub = existingSub || {
            userId: trustedUserId,
            plan: 'FREE',
            status: 'active',
            cycle: verifiedCycle,
            provider: provider || 'mercadopago',
            subscriptionId: `sub_free_${trustedUserId}`,
            currentPeriodStart: now,
            currentPeriodEnd: now + 365 * 24 * 60 * 60 * 1000,
            cancelAtPeriodEnd: false,
            createdAt: now,
            updatedAt: now,
            expiresAt: now + 365 * 24 * 60 * 60 * 1000,
            schemaVersion: SCHEMA_VERSION
          };
        }

        return {
          success: true,
          processed: isApproved,
          httpStatus: 200,
          subscription: updatedSub
        };
      });
    } catch (err: any) {
      if (
        err.message === 'FIRESTORE_NOT_AVAILABLE' ||
        err.code === 7 ||
        err.code === 16 ||
        err.message?.includes('PERMISSION_DENIED') ||
        err.message?.includes('credentials') ||
        err.message?.includes('Could not load the default credentials') ||
        err.message?.includes('Cannot read properties of null')
      ) {
        firestoreDisabled = true;
      }
    }
  }

  // Local Store Fallback
  const unlock = await storeLock.acquire();
  try {
    const s = initLocalStore();

    if (!s.processed_payments) {
      s.processed_payments = {};
    }

    if (s.webhook_events[eventId]) {
      return {
        success: true,
        processed: false,
        httpStatus: 200,
        reason: 'EVENTO_JA_PROCESSADO_IDEMPOTENCIA',
        subscription: s.subscriptions[trustedUserId]
      };
    }

    if (paymentId && s.processed_payments[paymentId]) {
      return {
        success: true,
        processed: false,
        httpStatus: 200,
        reason: 'PAGAMENTO_JA_PROCESSADO_IDEMPOTENCIA',
        subscription: s.subscriptions[trustedUserId]
      };
    }

    const webhookRecord: WebhookEventRecord = {
      eventId,
      eventType: eventType || 'payment.approved',
      userId: trustedUserId,
      status: eventStatus,
      provider: provider || 'mercadopago',
      processedAt: now,
      payload: sanitizedPayload,
      createdAt: now,
      updatedAt: now,
      schemaVersion: SCHEMA_VERSION
    };
    s.webhook_events[eventId] = webhookRecord;

    if (paymentId) {
      s.processed_payments[paymentId] = {
        eventId,
        userId: trustedUserId,
        processedAt: now,
        amount: payload?.transaction_amount || (verifiedCycle === 'annual' ? getPlanConfig(verifiedPlanId).priceAnnual : getPlanConfig(verifiedPlanId).priceMonthly),
        status: eventStatus
      };
    }

    if (sessionId && s.checkout_sessions[sessionId]) {
      s.checkout_sessions[sessionId].status = isApproved ? 'approved' : 'pending';
      s.checkout_sessions[sessionId].updatedAt = now;
    }

    const existingSub = s.subscriptions[trustedUserId];
    let updatedSub: SubscriptionRecord;

    if (isApproved) {
      updatedSub = {
        userId: trustedUserId,
        plan: verifiedPlanId,
        status: 'active',
        cycle: verifiedCycle,
        provider: provider || 'mercadopago',
        subscriptionId: `sub_pro_${trustedUserId}_${now}`,
        providerSubscriptionId: paymentId || undefined,
        currentPeriodStart: now,
        currentPeriodEnd: now + durationMs,
        cancelAtPeriodEnd: false,
        createdAt: existingSub ? existingSub.createdAt : now,
        updatedAt: now,
        expiresAt: now + durationMs,
        schemaVersion: SCHEMA_VERSION
      };
      s.subscriptions[trustedUserId] = updatedSub;

      const existingUsage = s.usage[trustedUserId];
      if (existingUsage) {
        existingUsage.diagnosesCount = 0;
        existingUsage.aiGenerationsCount = 0;
        existingUsage.updatedAt = now;
      }
    } else {
      updatedSub = existingSub || {
        userId: trustedUserId,
        plan: 'FREE',
        status: 'active',
        cycle: verifiedCycle,
        provider: provider || 'mercadopago',
        subscriptionId: `sub_free_${trustedUserId}`,
        currentPeriodStart: now,
        currentPeriodEnd: now + 365 * 24 * 60 * 60 * 1000,
        cancelAtPeriodEnd: false,
        createdAt: now,
        updatedAt: now,
        expiresAt: now + 365 * 24 * 60 * 60 * 1000,
        schemaVersion: SCHEMA_VERSION
      };
    }

    saveLocalStore(s);

    return {
      success: true,
      processed: isApproved,
      httpStatus: 200,
      subscription: updatedSub
    };
  } finally {
    unlock();
  }
}

/**
 * Get current checkout session status for polling (with IDOR protection).
 */
export async function getCheckoutSessionStatus(sessionId: string, userId: string): Promise<{
  found: boolean;
  status: string;
  isPro: boolean;
  session?: CheckoutSessionRecord;
}> {
  let session: CheckoutSessionRecord | null = null;
  const isProd = isProductionEnvironment();

  if (!firestoreDisabled) {
    try {
      const db = getFirebaseAdminFirestore();
      if (db) {
        const doc = await db.collection('checkout_sessions').doc(sessionId).get();
        if (doc.exists) {
          session = doc.data() as CheckoutSessionRecord;
        }
      }
    } catch {
      firestoreDisabled = true;
    }
  }

  if (!session && !isProd) {
    const store = initLocalStore();
    session = store.checkout_sessions[sessionId] || null;
  }

  if (!session) {
    return { found: false, status: 'not_found', isPro: false };
  }

  if (session.userId !== userId) {
    return { found: false, status: 'unauthorized', isPro: false };
  }

  const sub = await getSubscription(userId);
  const isPro = sub.plan === 'PRO' && sub.status === 'active';

  return {
    found: true,
    status: isPro ? 'approved' : session.status,
    isPro,
    session
  };
}

/**
 * Cancels a user subscription with external provider failure resilience.
 * Does NOT mark subscription as canceled if the provider call fails, allowing operational retry.
 */
export async function cancelSubscriptionServer(userId: string): Promise<{ success: boolean; subscription?: SubscriptionRecord; error?: string }> {
  const sub = await getSubscription(userId);
  if (sub.plan !== 'PRO' || sub.status !== 'active') {
    return { success: false, error: 'NO_ACTIVE_PRO_SUBSCRIPTION' };
  }

  const isProd = isProductionEnvironment();
  const mpAccessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  // If subscription is linked to Mercado Pago preapproval/subscription
  if (sub.provider === 'mercadopago' && sub.providerSubscriptionId && mpAccessToken) {
    try {
      const mpRes = await fetch(`https://api.mercadopago.com/preapproval/${sub.providerSubscriptionId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${mpAccessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'cancelled' })
      });

      if (!mpRes.ok && mpRes.status !== 404) {
        // Provider call failed: DO NOT mark subscription as canceled locally! Fail-closed for retry
        throw new Error(`MERCADOPAGO_CANCEL_ERROR: Mercado Pago retornou HTTP ${mpRes.status}`);
      }
    } catch (err: any) {
      console.error('[MercadoPago Cancel Subscription Error]', err);
      throw new Error(`PROVIDER_CANCELLATION_FAILED: Falha ao cancelar assinatura no Mercado Pago (${err.message}). Operação abortada para permitir retry operacional.`);
    }
  }

  const now = Date.now();
  let firestoreUpdated = false;

  if (!firestoreDisabled) {
    try {
      const db = getFirebaseAdminFirestore();
      if (db) {
        const subRef = db.collection('subscriptions').doc(userId);
        await subRef.update({
          cancelAtPeriodEnd: true,
          status: 'canceled',
          updatedAt: now,
          schemaVersion: SCHEMA_VERSION
        });
        firestoreUpdated = true;
      }
    } catch (err: any) {
      firestoreDisabled = true;
      if (isProd) {
        throw new BillingUnavailableError('BILLING_UNAVAILABLE', `Falha ao cancelar assinatura no Firestore em produção: ${err.message}`, err);
      }
    }
  }

  if (isProd && !firestoreUpdated) {
    throw new BillingUnavailableError('BILLING_UNAVAILABLE', 'Cancelamento de assinatura indisponível em produção (armazenamento local proibido).');
  }

  let canceled: SubscriptionRecord = {
    ...sub,
    cancelAtPeriodEnd: true,
    status: 'canceled',
    updatedAt: now,
    schemaVersion: SCHEMA_VERSION
  };

  if (!isProd) {
    const unlock = await storeLock.acquire();
    try {
      const store = initLocalStore();
      const existing = store.subscriptions[userId] || sub;
      canceled = {
        ...existing,
        cancelAtPeriodEnd: true,
        status: 'canceled',
        updatedAt: now,
        schemaVersion: SCHEMA_VERSION
      };
      store.subscriptions[userId] = canceled;
      saveLocalStore(store);
    } finally {
      unlock();
    }
  }

  return { success: true, subscription: canceled };
}

/**
 * AI Observability logger.
 */
export async function logAiExecutionCost(data: {
  userId: string;
  diagnosticId?: string;
  action: string;
  modelUsed: string;
  durationMs: number;
  retries: number;
  fallbackUsed: boolean;
  inputTokens?: number;
  outputTokens?: number;
  isTest?: boolean;
  adminTestMode?: boolean;
}): Promise<AiLogRecord> {
  const inTokens = data.inputTokens || 2200;
  const outTokens = data.outputTokens || 1800;
  const { costUsd, costBrl } = calculateEstimatedAiCost(data.modelUsed, inTokens, outTokens);
  const now = Date.now();
  const logId = `log_${now}_${crypto.randomBytes(3).toString('hex')}`;
  const isProd = isProductionEnvironment();
  const isTest = data.isTest === true || data.adminTestMode === true;

  const logRecord: AiLogRecord = {
    id: logId,
    diagnosticId: data.diagnosticId,
    userId: data.userId || 'anonymous',
    action: data.action,
    modelUsed: data.modelUsed,
    durationMs: data.durationMs,
    retries: data.retries,
    fallbackUsed: data.fallbackUsed,
    inputTokens: inTokens,
    outputTokens: outTokens,
    estimatedCostUsd: costUsd,
    estimatedCostBrl: costBrl,
    isTest,
    adminTestMode: isTest,
    timestamp: now,
    createdAt: now,
    retentionUntil: calculateRetentionUntil(RETENTION_POLICIES.AI_LOGS_DAYS),
    schemaVersion: SCHEMA_VERSION
  };

  if (!firestoreDisabled) {
    try {
      const db = getFirebaseAdminFirestore();
      if (db) {
        await db.collection('ai_logs').doc(logId).set(logRecord);
      }
    } catch {
      firestoreDisabled = true;
    }
  }

  if (!isProd) {
    const unlock = await storeLock.acquire();
    try {
      const store = initLocalStore();
      store.ai_logs[logId] = logRecord;
      saveLocalStore(store);
    } finally {
      unlock();
    }
  }

  return logRecord;
}

/**
 * Register user satisfaction feedback.
 */
export async function submitUserFeedback(data: {
  userId: string;
  solutionType: string;
  rating: 'useful' | 'not_useful';
  comment?: string;
  itemTitle?: string;
}): Promise<FeedbackRecord> {
  const now = Date.now();
  const feedbackId = `fb_${now}_${crypto.randomBytes(3).toString('hex')}`;
  const isProd = isProductionEnvironment();

  const record: FeedbackRecord = {
    id: feedbackId,
    userId: data.userId || 'anonymous',
    solutionType: data.solutionType,
    rating: data.rating,
    comment: data.comment,
    itemTitle: data.itemTitle,
    timestamp: now,
    createdAt: now,
    updatedAt: now,
    retentionUntil: calculateRetentionUntil(RETENTION_POLICIES.FEEDBACK_DAYS),
    schemaVersion: SCHEMA_VERSION
  };

  if (!firestoreDisabled) {
    try {
      const db = getFirebaseAdminFirestore();
      if (db) {
        await db.collection('feedback').doc(feedbackId).set(record);
      }
    } catch {
      firestoreDisabled = true;
    }
  }

  if (!isProd) {
    const unlock = await storeLock.acquire();
    try {
      const store = initLocalStore();
      store.feedback[feedbackId] = record;
      saveLocalStore(store);
    } finally {
      unlock();
    }
  }

  return record;
}

/**
 * List recent feedback records.
 */
export async function listFeedbackRecords(limit = 50): Promise<FeedbackRecord[]> {
  const isProd = isProductionEnvironment();

  if (!firestoreDisabled) {
    try {
      const db = getFirebaseAdminFirestore();
      if (db) {
        const snapshot = await db.collection('feedback').orderBy('createdAt', 'desc').limit(limit).get();
        if (!snapshot.empty) {
          return snapshot.docs.map(doc => doc.data() as FeedbackRecord);
        }
      }
    } catch {
      firestoreDisabled = true;
    }
  }

  if (isProd) {
    return [];
  }

  const store = initLocalStore();
  const allFeedbacks = Object.values(store.feedback);
  return allFeedbacks.sort((a, b) => b.createdAt - a.createdAt).slice(0, limit);
}

/**
 * Get metrics for Admin & Observability.
 */
export async function getAdminMetrics() {
  const isProd = isProductionEnvironment();
  let allSubs: SubscriptionRecord[] = [];
  let allAiLogs: AiLogRecord[] = [];
  let feedbacks: FeedbackRecord[] = [];

  if (!firestoreDisabled) {
    try {
      const db = getFirebaseAdminFirestore();
      if (db) {
        const [subsSnap, logsSnap, feedSnap] = await Promise.all([
          db.collection('subscriptions').limit(500).get().catch(() => null),
          db.collection('ai_logs').limit(500).get().catch(() => null),
          db.collection('feedback').limit(500).get().catch(() => null)
        ]);

        if (subsSnap && !subsSnap.empty) {
          allSubs = subsSnap.docs.map(d => d.data() as SubscriptionRecord);
        }
        if (logsSnap && !logsSnap.empty) {
          allAiLogs = logsSnap.docs.map(d => d.data() as AiLogRecord);
        }
        if (feedSnap && !feedSnap.empty) {
          feedbacks = feedSnap.docs.map(d => d.data() as FeedbackRecord);
        }
      }
    } catch {
      firestoreDisabled = true;
    }
  }

  if (!isProd && allSubs.length === 0 && allAiLogs.length === 0) {
    const store = initLocalStore();
    allSubs = Object.values(store.subscriptions);
    allAiLogs = Object.values(store.ai_logs);
    feedbacks = Object.values(store.feedback);
  }

  const totalUsers = allSubs.length;
  const proUsers = allSubs.filter(s => s.plan === 'PRO' && s.status === 'active').length;
  const freeUsers = totalUsers - proUsers;

  const productionAiLogs = allAiLogs.filter(l => !l.isTest && !l.adminTestMode);
  const testAiLogs = allAiLogs.filter(l => l.isTest || l.adminTestMode);

  const totalCostUsd = productionAiLogs.reduce((acc, l) => acc + (l.estimatedCostUsd || 0), 0);
  const totalCostBrl = productionAiLogs.reduce((acc, l) => acc + (l.estimatedCostBrl || 0), 0);
  const totalAiCalls = productionAiLogs.length;
  const totalTestAiCalls = testAiLogs.length;

  const totalFeedbacks = feedbacks.length;
  const usefulFeedbacks = feedbacks.filter(f => f.rating === 'useful').length;
  const satisfactionRatePct = totalFeedbacks > 0 ? Number(((usefulFeedbacks / totalFeedbacks) * 100).toFixed(1)) : 100;

  const estimatedMonthlyRevenueBrl = proUsers * PLANS.PRO.priceMonthly;

  return {
    users: {
      total: totalUsers,
      free: freeUsers,
      pro: proUsers,
      conversionRatePct: totalUsers > 0 ? Number(((proUsers / totalUsers) * 100).toFixed(1)) : 0
    },
    revenue: {
      monthlyEstimatedBrl: Number(estimatedMonthlyRevenueBrl.toFixed(2)),
      formatted: `R$ ${estimatedMonthlyRevenueBrl.toFixed(2)}`
    },
    feedback: {
      total: totalFeedbacks,
      useful: usefulFeedbacks,
      notUseful: totalFeedbacks - usefulFeedbacks,
      satisfactionRatePct,
      recent: feedbacks.slice(0, 10)
    },
    aiObservability: {
      totalCalls: totalAiCalls,
      totalCostUsd: Number(totalCostUsd.toFixed(4)),
      totalCostBrl: Number(totalCostBrl.toFixed(2)),
      logsSample: allAiLogs.slice(0, 10)
    }
  };
}

/**
 * Explicit migration function: Transfers in-memory collections to durable storage.
 * SAFETY RULE: Only executable in development environments; strictly prohibited in production.
 */
export async function migrateInMemoryToFirestore(data?: {
  subscriptions?: SubscriptionRecord[];
  usage?: UsageRecord[];
  checkoutSessions?: CheckoutSessionRecord[];
  webhookEvents?: WebhookEventRecord[];
  feedback?: FeedbackRecord[];
  aiLogs?: AiLogRecord[];
}): Promise<{
  success: boolean;
  migrated: {
    subscriptions: number;
    usage: number;
    checkout_sessions: number;
    webhook_events: number;
    feedback: number;
    ai_logs: number;
  };
}> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('MIGRATION_PROHIBITED: Migração de dados em memória é estritamente proibida em ambiente de produção.');
  }

  const unlock = await storeLock.acquire();
  try {
    const store = initLocalStore();
    const migrated = {
      subscriptions: 0,
      usage: 0,
      checkout_sessions: 0,
      webhook_events: 0,
      feedback: 0,
      ai_logs: 0
    };

    if (data?.subscriptions) {
      for (const s of data.subscriptions) {
        store.subscriptions[s.userId] = { ...s, schemaVersion: SCHEMA_VERSION };
        migrated.subscriptions++;
      }
    }

    if (data?.usage) {
      for (const u of data.usage) {
        store.usage[u.userId] = { ...u, schemaVersion: SCHEMA_VERSION };
        migrated.usage++;
      }
    }

    if (data?.checkoutSessions) {
      for (const cs of data.checkoutSessions) {
        store.checkout_sessions[cs.sessionId] = { ...cs, schemaVersion: SCHEMA_VERSION };
        migrated.checkout_sessions++;
      }
    }

    if (data?.webhookEvents) {
      for (const ev of data.webhookEvents) {
        store.webhook_events[ev.eventId] = { ...ev, schemaVersion: SCHEMA_VERSION };
        migrated.webhook_events++;
      }
    }

    if (data?.feedback) {
      for (const fb of data.feedback) {
        store.feedback[fb.id] = { ...fb, schemaVersion: SCHEMA_VERSION };
        migrated.feedback++;
      }
    }

    if (data?.aiLogs) {
      for (const log of data.aiLogs) {
        store.ai_logs[log.id] = { ...log, schemaVersion: SCHEMA_VERSION };
        migrated.ai_logs++;
      }
    }

    saveLocalStore(store);
    return { success: true, migrated };
  } finally {
    unlock();
  }
}
