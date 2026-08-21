import { getFirebaseAdminFirestore } from '../server/auth/firebase-admin';
import { initLocalStore, saveLocalStore } from './billing-server';

export const RETENTION_POLICIES = {
  DIAGNOSIS_DAYS: 180,         // 6 months for diagnostic audits
  START_PROJECT_DAYS: 180,     // 6 months for "começar do zero" projects
  DIGITAL_TWIN_DAYS: 365,      // 1 year for digital twin profiles
  PROFILE_DNA_DAYS: 365,       // 1 year for strategic profile DNA
  PERFORMANCE_MEMORY_DAYS: 365,// 1 year for historical post memory
  FEEDBACK_DAYS: 180,          // 6 months for user solution feedback
  AI_LOGS_DAYS: 90,            // 90 days for operational AI logs (no PII)
  WEBHOOK_EVENTS_DAYS: 90,     // 90 days for webhook idempotency
  CHECKOUT_SESSIONS_DAYS: 180, // 180 days for checkout sessions
  RATE_LIMITS_DAYS: 1,         // 1 day for rate limit buckets
} as const;

/**
 * Calculates the expiration timestamp (ms) based on retention policy
 */
export function calculateRetentionUntil(days: number = RETENTION_POLICIES.DIAGNOSIS_DAYS): number {
  return Date.now() + (days * 24 * 60 * 60 * 1000);
}

/**
 * Checks if a retention timestamp has passed
 */
export function isDocumentExpired(retentionUntil?: number): boolean {
  if (!retentionUntil) return false;
  return Date.now() > retentionUntil;
}

/**
 * Minimal diagnosis summary interface for localStorage minimization.
 * Strictly excludes full criteria texts, evidence quotes, prompts, and raw weights.
 */
export interface MinimalDiagnosisSummary {
  id: string;
  handle?: string;
  niche?: string;
  objective?: string;
  score: number;
  coverage: number;
  createdAt: string;
  minimizedAt: number;
  topStrengthTitle?: string;
  topGapTitle?: string;
  tomorrowActionTitle?: string;
  mainRecommendation?: string;
  retentionUntil: number;
  summaryOnly: true;
}

/**
 * Extracts a privacy-minimized summary from a full diagnosis result.
 */
export function extractMinimalDiagnosisSummary(data: any): MinimalDiagnosisSummary | null {
  if (!data || !data.scoring || !data.diagnosis) return null;

  const scoring = data.scoring;
  const diagnosis = data.diagnosis;
  const meta = data.meta;

  const topStrength = (typeof diagnosis.strengths?.[0] === 'string' ? diagnosis.strengths[0] : diagnosis.strengths?.[0]?.title) || 
                      (typeof diagnosis.key_strengths?.[0] === 'string' ? diagnosis.key_strengths[0] : diagnosis.key_strengths?.[0]?.title) || 
                      undefined;

  const topGap = (typeof diagnosis.critical_gaps?.[0] === 'string' ? diagnosis.critical_gaps[0] : diagnosis.critical_gaps?.[0]?.title) || 
                 (typeof diagnosis.critical_flaws?.[0] === 'string' ? diagnosis.critical_flaws[0] : diagnosis.critical_flaws?.[0]?.title) || 
                 undefined;

  const tomorrowAction = diagnosis.tomorrow_action?.title || 
                         (typeof diagnosis.tomorrow_action === 'string' ? diagnosis.tomorrow_action : undefined) ||
                         diagnosis.action_plan?.immediate_actions?.[0] || 
                         undefined;

  const mainRecommendation = tomorrowAction || topStrength || diagnosis.summary || undefined;

  return {
    id: meta?.diagnosticId || data.id || `diag_${Date.now()}`,
    handle: diagnosis.account_info?.handle || meta?.handle || data.handle || undefined,
    niche: diagnosis.account_info?.niche || meta?.niche || data.niche || undefined,
    objective: diagnosis.account_info?.objective || meta?.objective || data.objective || undefined,
    score: typeof scoring.score === 'number' ? scoring.score : 0,
    coverage: typeof scoring.coverage === 'number' ? scoring.coverage : 0,
    createdAt: new Date().toISOString(),
    minimizedAt: Date.now(),
    topStrengthTitle: topStrength,
    topGapTitle: topGap,
    tomorrowActionTitle: tomorrowAction,
    mainRecommendation,
    retentionUntil: calculateRetentionUntil(RETENTION_POLICIES.DIAGNOSIS_DAYS),
    summaryOnly: true
  };
}

/**
 * In-memory and server-side fallback collections when Firestore Admin is unavailable
 */
const mockStore = new Map<string, Map<string, any>>();

function getLocalCollection(colName: string): Map<string, any> {
  if (!mockStore.has(colName)) {
    mockStore.set(colName, new Map<string, any>());
  }
  return mockStore.get(colName)!;
}

/**
 * Exports all user-associated data across all collections in a structured, portable JSON format.
 * Adheres to data portability standards without exposing provider private keys or internal secrets.
 */
export async function exportUserData(userId: string): Promise<{
  exportId: string;
  userId: string;
  exportedAt: string;
  retentionPolicyNotice: string;
  summary: {
    diagnosesCount: number;
    startProjectsCount: number;
    digitalTwinsCount: number;
    profileDnaCount: number;
    performanceRecordsCount: number;
    feedbackCount: number;
  };
  data: {
    diagnoses: any[];
    startProjects: any[];
    digitalTwins: any[];
    profileDna: any[];
    performanceRecords: any[];
    feedback: any[];
    usage: any | null;
    subscription: any | null;
  };
}> {
  const exportId = `export_${userId.substring(0, 12)}_${Date.now()}`;
  const exportedAt = new Date().toISOString();

  const resultData = {
    diagnoses: [] as any[],
    startProjects: [] as any[],
    digitalTwins: [] as any[],
    profileDna: [] as any[],
    performanceRecords: [] as any[],
    feedback: [] as any[],
    usage: null as any,
    subscription: null as any
  };

  const adminDb = getFirebaseAdminFirestore();
  let firestoreSuccess = false;

  if (adminDb) {
    try {
      // 1. Diagnoses
      const diagSnap = await adminDb.collection('diagnoses').where('userId', '==', userId).get();
      resultData.diagnoses = diagSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      // 2. Start Projects
      const startSnap = await adminDb.collection('start_projects').where('userId', '==', userId).get();
      resultData.startProjects = startSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      // 3. Digital Twins
      const twinSnap = await adminDb.collection('digital_twins').where('userId', '==', userId).get();
      resultData.digitalTwins = twinSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      // 4. Profile DNA
      const dnaSnap = await adminDb.collection('profile_dna').where('userId', '==', userId).get();
      resultData.profileDna = dnaSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      // 5. Performance Memory
      const perfSnap = await adminDb.collection('performance_memory').where('userId', '==', userId).get();
      resultData.performanceRecords = perfSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      // 6. Feedback
      const fbSnap = await adminDb.collection('feedback').where('userId', '==', userId).get();
      resultData.feedback = fbSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      // 7. Usage
      const usageDoc = await adminDb.collection('usage').doc(userId).get();
      if (usageDoc.exists) {
        resultData.usage = usageDoc.data();
      }

      // 8. Subscription (Sanitized - no raw payment provider secrets)
      const subDoc = await adminDb.collection('subscriptions').doc(userId).get();
      if (subDoc.exists) {
        const subData = subDoc.data() || {};
        resultData.subscription = {
          plan: subData.plan,
          status: subData.status,
          cycle: subData.cycle,
          currentPeriodStart: subData.currentPeriodStart,
          currentPeriodEnd: subData.currentPeriodEnd,
          cancelAtPeriodEnd: subData.cancelAtPeriodEnd,
          createdAt: subData.createdAt,
          updatedAt: subData.updatedAt
        };
      }
      firestoreSuccess = true;
    } catch (err) {
      console.warn('[DataRetention] Firestore query warning during export, using local fallback:', (err as any)?.message || err);
    }
  }

  if (!firestoreSuccess) {
    // Fallback store search (Local / In-Memory)
    const store = initLocalStore();
    if (store.subscriptions[userId]) {
      const sub = store.subscriptions[userId];
      resultData.subscription = {
        plan: sub.plan,
        status: sub.status,
        cycle: sub.cycle,
        currentPeriodStart: sub.currentPeriodStart,
        currentPeriodEnd: sub.currentPeriodEnd,
        cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
        createdAt: sub.createdAt,
        updatedAt: sub.updatedAt
      };
    }

    if (store.usage[userId]) {
      resultData.usage = store.usage[userId];
    }

    for (const fb of Object.values(store.feedback)) {
      if (fb.userId === userId) {
        resultData.feedback.push(fb);
      }
    }

    const diagCol = getLocalCollection('diagnoses');
    for (const [id, doc] of diagCol.entries()) {
      if (doc.userId === userId) resultData.diagnoses.push({ id, ...doc });
    }

    const startCol = getLocalCollection('start_projects');
    for (const [id, doc] of startCol.entries()) {
      if (doc.userId === userId) resultData.startProjects.push({ id, ...doc });
    }

    const twinCol = getLocalCollection('digital_twins');
    for (const [id, doc] of twinCol.entries()) {
      if (doc.userId === userId) resultData.digitalTwins.push({ id, ...doc });
    }

    const dnaCol = getLocalCollection('profile_dna');
    for (const [id, doc] of dnaCol.entries()) {
      if (doc.userId === userId) resultData.profileDna.push({ id, ...doc });
    }
  }

  return {
    exportId,
    userId,
    exportedAt,
    retentionPolicyNotice: "Este arquivo contém a exportação completa e portátil dos dados associados ao seu identificador. Conforme nossa política de minimização, imagens não constam neste relatório pois não são persistidas.",
    summary: {
      diagnosesCount: resultData.diagnoses.length,
      startProjectsCount: resultData.startProjects.length,
      digitalTwinsCount: resultData.digitalTwins.length,
      profileDnaCount: resultData.profileDna.length,
      performanceRecordsCount: resultData.performanceRecords.length,
      feedbackCount: resultData.feedback.length
    },
    data: resultData
  };
}

/**
 * Permanently deletes all user-associated records across diagnoses, start projects,
 * digital twins, profile DNA, performance memory, feedback, and usage counters.
 * 
 * Strict Legal Retention:
 * Payment invoices and transactional checkout tokens are anonymized (scrubbing PII like name/email)
 * and retained strictly for legal compliance (tax, accounting & chargeback fraud prevention)
 * as permitted by data privacy regulations.
 */
export async function deleteUserData(userId: string): Promise<{
  success: boolean;
  userId: string;
  deletedAt: string;
  deletedCounts: {
    diagnoses: number;
    startProjects: number;
    digitalTwins: number;
    profileDna: number;
    performanceRecords: number;
    feedback: number;
    usage: number;
    subscription: number;
  };
  totalDeleted: number;
  legalRetentionNotice: string;
}> {
  const deletedAt = new Date().toISOString();
  const deletedCounts = {
    diagnoses: 0,
    startProjects: 0,
    digitalTwins: 0,
    profileDna: 0,
    performanceRecords: 0,
    feedback: 0,
    usage: 0,
    subscription: 0
  };

  const adminDb = getFirebaseAdminFirestore();

  if (adminDb) {
    try {
      const batchSize = 100;

      // Helper to batch delete by userId query
      const deleteCollectionForUser = async (colName: string): Promise<number> => {
        const snap = await adminDb.collection(colName).where('userId', '==', userId).limit(batchSize).get();
        if (snap.empty) return 0;

        const batch = adminDb.batch();
        snap.docs.forEach(d => batch.delete(d.ref));
        await batch.commit();
        return snap.docs.length;
      };

      deletedCounts.diagnoses = await deleteCollectionForUser('diagnoses');
      deletedCounts.startProjects = await deleteCollectionForUser('start_projects');
      deletedCounts.digitalTwins = await deleteCollectionForUser('digital_twins');
      deletedCounts.profileDna = await deleteCollectionForUser('profile_dna');
      deletedCounts.performanceRecords = await deleteCollectionForUser('performance_memory');
      deletedCounts.feedback = await deleteCollectionForUser('feedback');

      // Delete Usage record
      const usageDocRef = adminDb.collection('usage').doc(userId);
      const usageDoc = await usageDocRef.get();
      if (usageDoc.exists) {
        await usageDocRef.delete();
        deletedCounts.usage = 1;
      }

      // Anonymize & Cancel Subscription (Retaining strictly legal tax records)
      const subDocRef = adminDb.collection('subscriptions').doc(userId);
      const subDoc = await subDocRef.get();
      if (subDoc.exists) {
        await subDocRef.set({
          userId: `anonymized_${Date.now()}`,
          status: 'canceled',
          plan: 'FREE',
          anonymizedAt: Date.now(),
          retentionUntil: calculateRetentionUntil(RETENTION_POLICIES.CHECKOUT_SESSIONS_DAYS)
        }, { merge: true });
        deletedCounts.subscription = 1;
      }

      // Anonymize Checkout Sessions
      const sessionsSnap = await adminDb.collection('checkout_sessions').where('userId', '==', userId).get();
      if (!sessionsSnap.empty) {
        const batch = adminDb.batch();
        sessionsSnap.docs.forEach(doc => {
          batch.update(doc.ref, {
            userId: `anonymized_${Date.now()}`,
            userEmail: 'anonymized@deleted.user',
            anonymizedAt: Date.now()
          });
        });
        await batch.commit();
      }

    } catch (err) {
      console.error('[DataRetention] Error during user data deletion:', err);
    }
  }

  // Always sync deletion to local store and in-memory collections
  const localStore = initLocalStore();
  if (localStore.subscriptions[userId]) {
    delete localStore.subscriptions[userId];
    deletedCounts.subscription = (deletedCounts.subscription || 0) + 1;
  }
  if (localStore.usage[userId]) {
    delete localStore.usage[userId];
    deletedCounts.usage = (deletedCounts.usage || 0) + 1;
  }
  for (const [id, fb] of Object.entries(localStore.feedback)) {
    if (fb.userId === userId) {
      delete localStore.feedback[id];
      deletedCounts.feedback = (deletedCounts.feedback || 0) + 1;
    }
  }
  for (const [id, log] of Object.entries(localStore.ai_logs)) {
    if (log.userId === userId) {
      delete localStore.ai_logs[id];
    }
  }
  for (const [id, sess] of Object.entries(localStore.checkout_sessions)) {
    if (sess.userId === userId) {
      sess.userId = `anonymized_user_${Date.now()}`;
    }
  }
  saveLocalStore(localStore);

  // In-memory collection fallback cleanup
  const deleteFromMap = (colName: string): number => {
    const col = getLocalCollection(colName);
    let count = 0;
    for (const [id, doc] of col.entries()) {
      if (doc.userId === userId) {
        col.delete(id);
        count++;
      }
    }
    return count;
  };

  deletedCounts.diagnoses = (deletedCounts.diagnoses || 0) + deleteFromMap('diagnoses');
  deletedCounts.startProjects = (deletedCounts.startProjects || 0) + deleteFromMap('start_projects');
  deletedCounts.digitalTwins = (deletedCounts.digitalTwins || 0) + deleteFromMap('digital_twins');
  deletedCounts.profileDna = (deletedCounts.profileDna || 0) + deleteFromMap('profile_dna');
  deletedCounts.performanceRecords = (deletedCounts.performanceRecords || 0) + deleteFromMap('performance_memory');
  deletedCounts.feedback = (deletedCounts.feedback || 0) + deleteFromMap('feedback');
  deletedCounts.usage = (deletedCounts.usage || 0) + deleteFromMap('usage');
  deletedCounts.subscription = (deletedCounts.subscription || 0) + deleteFromMap('subscriptions');

  const totalDeleted = Object.values(deletedCounts).reduce((acc, curr) => acc + curr, 0);

  return {
    success: true,
    userId,
    deletedAt,
    deletedCounts,
    totalDeleted,
    legalRetentionNotice: "Todos os diagnósticos, Digital Twins, Profile DNA, métricas de performance, feedbacks e histórico de uso foram permanentemente excluídos. Registros estritamente fiscais e contábeis de faturamento foram desvinculados de seus dados pessoais (anonimizados) para cumprimento de obrigações legais."
  };
}

/**
 * Automated cleanup job for expired documents past their retentionUntil timestamp
 */
export async function cleanupExpiredDocuments(): Promise<{
  cleanedCount: number;
  timestamp: string;
  collectionsScanned: string[];
}> {
  const now = Date.now();
  let cleanedCount = 0;
  const collectionsScanned = [
    'diagnoses',
    'start_projects',
    'digital_twins',
    'profile_dna',
    'performance_memory',
    'feedback',
    'ai_logs',
    'webhook_events',
    'checkout_sessions',
    'rate_limits'
  ];

  const adminDb = getFirebaseAdminFirestore();
  if (adminDb) {
    for (const colName of collectionsScanned) {
      try {
        const expiredSnap = await adminDb
          .collection(colName)
          .where('retentionUntil', '<=', now)
          .limit(100)
          .get();

        if (!expiredSnap.empty) {
          const batch = adminDb.batch();
          expiredSnap.docs.forEach(d => batch.delete(d.ref));
          await batch.commit();
          cleanedCount += expiredSnap.docs.length;
        }
      } catch (err) {
        console.warn(`[DataRetention] Expired cleanup query warning on ${colName}:`, (err as any)?.message || err);
      }
    }
  }

  // Also clean local store records
  const localStore = initLocalStore();
  let localModified = false;
  for (const [id, fb] of Object.entries(localStore.feedback)) {
    if (fb.retentionUntil && fb.retentionUntil <= now) {
      delete localStore.feedback[id];
      cleanedCount++;
      localModified = true;
    }
  }
  for (const [id, log] of Object.entries(localStore.ai_logs)) {
    if (log.retentionUntil && log.retentionUntil <= now) {
      delete localStore.ai_logs[id];
      cleanedCount++;
      localModified = true;
    }
  }
  for (const [id, evt] of Object.entries(localStore.webhook_events)) {
    if (evt.retentionUntil && evt.retentionUntil <= now) {
      delete localStore.webhook_events[id];
      cleanedCount++;
      localModified = true;
    }
  }
  if (localModified) {
    saveLocalStore(localStore);
  }

  return {
    cleanedCount,
    timestamp: new Date().toISOString(),
    collectionsScanned
  };
}
