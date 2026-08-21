/**
 * Unit & Integration Test Suite for Data Retention, Minimization, and User Data Deletion
 * 
 * Verifies:
 * 1. calculateRetentionUntil / isDocumentExpired calculations
 * 2. extractMinimalDiagnosisSummary data minimization logic
 * 3. exportUserData portability package structure
 * 4. deleteUserData cascading deletion across all collections
 * 5. Isolation: ensuring User A deletion does not affect User B
 * 6. Legal preservation: anonymizing payment/billing records while purging user data
 * 7. cleanupExpiredDocuments purging expired retention records
 */

import {
  calculateRetentionUntil,
  isDocumentExpired,
  extractMinimalDiagnosisSummary,
  exportUserData,
  deleteUserData,
  cleanupExpiredDocuments,
  RETENTION_POLICIES
} from './src/lib/data-retention';
import {
  initLocalStore,
  saveLocalStore,
  submitUserFeedback,
  logAiExecutionCost
} from './src/lib/billing-server';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ Assertion failed: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  } else {
    console.log(`  ✓ ${message}`);
  }
}

async function runTests() {
  console.log('====================================================');
  console.log('🧪 RUNNING DATA RETENTION & USER DELETION TEST SUITE');
  console.log('====================================================\n');

  // TEST 1: Retention calculation
  console.log('TEST 1: Retention Timestamp Calculation & Expiration Check');
  const now = Date.now();
  const future30Days = calculateRetentionUntil(30);
  const diffDays = Math.round((future30Days - now) / (24 * 60 * 60 * 1000));
  assert(diffDays === 30, `Retention calculated 30 days into the future (got ${diffDays} days)`);
  assert(!isDocumentExpired(future30Days), 'Future document is NOT marked as expired');
  assert(isDocumentExpired(now - 1000), 'Past document IS marked as expired');
  assert(!isDocumentExpired(undefined), 'Document without retentionUntil is NOT expired by default');

  // TEST 2: Data Minimization (extractMinimalDiagnosisSummary)
  console.log('\nTEST 2: extractMinimalDiagnosisSummary (Minimization)');
  const sampleDiagnosis: any = {
    id: 'diag_test_123',
    scoring: {
      score: 82,
      level: 'Avançado',
      color: 'emerald',
      categories: {
        positioning: { name: 'Posicionamento', score: 20, maxScore: 25, percentage: 80 },
        content: { name: 'Conteúdo', score: 20, maxScore: 25, percentage: 80 }
      },
      criteria: [
        { id: 'pos_1', name: 'Clareza da Bio', score: 5, evidence: 'Bio clara e direta' }
      ]
    },
    diagnosis: {
      summary: 'Excelente clareza visual e posicionamento de marca.',
      key_strengths: ['Bio clara', 'Destaques organizados'],
      critical_flaws: ['Falta CTA explícito nos posts'],
      action_plan: {
        immediate_actions: ['Adicionar link na bio para WhatsApp', 'Fixar post principal'],
        seven_day_sprint: ['Gravar 3 reels de autoridade'],
        thirty_day_roadmap: ['Estruturar linha editorial']
      },
      evaluations: [
        { criterion_id: 'pos_1', score: 5, observed_evidence: 'Texto conciso', hypothesis: 'Aumenta conversão' }
      ]
    },
    meta: {
      userName: 'Dra. Ana Paula',
      handle: 'dra.anapaula',
      niche: 'Dermatologia',
      diagnosticId: 'diag_test_123',
      timestamp: '2026-08-17T12:00:00Z'
    },
    // Raw sensitive data that should be stripped
    print1: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...',
    print2: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...',
    internalTelemetry: { tokenCount: 4500 }
  };

  const minimal = extractMinimalDiagnosisSummary(sampleDiagnosis);
  assert(minimal.score === 82, 'Minimal summary retains score');
  assert(minimal.niche === 'Dermatologia', 'Minimal summary retains niche');
  assert(minimal.handle === 'dra.anapaula', 'Minimal summary retains handle');
  assert(minimal.mainRecommendation === 'Adicionar link na bio para WhatsApp', 'Minimal summary extracts primary recommendation');
  assert((minimal as any).print1 === undefined, 'Minimal summary completely strips print1');
  assert((minimal as any).print2 === undefined, 'Minimal summary completely strips print2');
  assert((minimal as any).internalTelemetry === undefined, 'Minimal summary completely strips telemetry');
  assert(minimal.minimizedAt > 0, 'Minimal summary includes minimizedAt timestamp');

  // TEST 3: User Data Setup & Cascading Deletion
  console.log('\nTEST 3: User Data Setup, Export, and Cascading Erasure');
  const userA = 'user_alpha_' + Date.now();
  const userB = 'user_beta_' + Date.now();

  // Populate local store with records for User A and User B
  const store = initLocalStore();
  
  // User A records
  store.subscriptions[userA] = {
    userId: userA,
    plan: 'PRO',
    status: 'active',
    cycle: 'monthly',
    provider: 'mercadopago',
    subscriptionId: `sub_${userA}`,
    currentPeriodStart: now,
    currentPeriodEnd: now + 30 * 86400000,
    cancelAtPeriodEnd: false,
    createdAt: now,
    updatedAt: now,
    expiresAt: now + 30 * 86400000,
    schemaVersion: 1
  };

  store.usage[userA] = {
    userId: userA,
    diagnosesCount: 3,
    aiGenerationsCount: 15,
    dailyGenerationsCount: 2,
    imageGenerationsCount: 0,
    videoGenerationsCount: 0,
    lastResetTimestamp: now,
    lastDailyResetTimestamp: now,
    createdAt: now,
    updatedAt: now,
    schemaVersion: 1
  };

  store.feedback[`fb_${userA}_1`] = {
    id: `fb_${userA}_1`,
    userId: userA,
    solutionType: 'mentor',
    rating: 'useful',
    comment: 'Ótima resposta do mentor!',
    timestamp: now,
    createdAt: now,
    updatedAt: now,
    schemaVersion: 1
  };

  store.ai_logs[`log_${userA}_1`] = {
    id: `log_${userA}_1`,
    userId: userA,
    action: 'mentor_chat',
    modelUsed: 'gemini-2.5-flash',
    durationMs: 450,
    retries: 0,
    fallbackUsed: false,
    inputTokens: 350,
    outputTokens: 200,
    estimatedCostUsd: 0.0001,
    estimatedCostBrl: 0.0005,
    timestamp: now,
    createdAt: now,
    schemaVersion: 1
  };

  store.checkout_sessions[`chk_${userA}_1`] = {
    sessionId: `chk_${userA}_1`,
    userId: userA,
    planId: 'PRO',
    cycle: 'monthly',
    amount: 39.9,
    paymentMethod: 'pix',
    status: 'approved',
    provider: 'mercadopago',
    createdAt: now,
    updatedAt: now,
    expiresAt: now + 1800000,
    schemaVersion: 1
  };

  // User B records (Isolation test)
  store.subscriptions[userB] = {
    userId: userB,
    plan: 'PRO',
    status: 'active',
    cycle: 'annual',
    provider: 'mercadopago',
    subscriptionId: `sub_${userB}`,
    currentPeriodStart: now,
    currentPeriodEnd: now + 365 * 86400000,
    cancelAtPeriodEnd: false,
    createdAt: now,
    updatedAt: now,
    expiresAt: now + 365 * 86400000,
    schemaVersion: 1
  };

  store.usage[userB] = {
    userId: userB,
    diagnosesCount: 1,
    aiGenerationsCount: 5,
    dailyGenerationsCount: 1,
    imageGenerationsCount: 0,
    videoGenerationsCount: 0,
    lastResetTimestamp: now,
    lastDailyResetTimestamp: now,
    createdAt: now,
    updatedAt: now,
    schemaVersion: 1
  };

  saveLocalStore(store);

  // Export User A data
  const exportA = await exportUserData(userA);
  assert(exportA !== null && exportA.userId === userA, 'Data export matches userId');
  assert(exportA.data.subscription !== null, 'Data export includes user subscription');
  assert(exportA.data.usage !== null, 'Data export includes user usage');
  assert(exportA.data.feedback.length >= 1, 'Data export includes user feedback');

  // TEST 4: Cascading User Deletion
  console.log('\nTEST 4: Cascading Deletion of User A');
  const deletionResult = await deleteUserData(userA);
  assert(deletionResult.success === true, 'Deletion returned success: true');
  assert(deletionResult.userId === userA, 'Deletion identified correct user');
  assert(deletionResult.totalDeleted > 0, `Deleted total records (${deletionResult.totalDeleted})`);
  assert(deletionResult.legalRetentionNotice !== undefined, 'Includes legal audit trail explanation notice');

  // Verify User A data is purged from local store
  const updatedStore = initLocalStore();
  assert(updatedStore.usage[userA] === undefined, 'Usage record for User A was completely removed');
  assert(updatedStore.subscriptions[userA] === undefined, 'Active subscription record for User A was removed');
  assert(updatedStore.feedback[`fb_${userA}_1`] === undefined, 'Feedback record for User A was deleted');
  assert(updatedStore.ai_logs[`log_${userA}_1`] === undefined, 'AI log record for User A was deleted');

  // Check anonymization of financial records (preserves legal accounting, strips user identifier)
  const session = updatedStore.checkout_sessions[`chk_${userA}_1`];
  assert(session !== undefined, 'Checkout session kept for accounting ledger');
  assert(session.userId.startsWith('anonymized_user_'), `User ID in session was anonymized (got ${session.userId})`);

  // TEST 5: Tenant Isolation Check
  console.log('\nTEST 5: Multi-Tenant Data Isolation Check');
  assert(updatedStore.subscriptions[userB] !== undefined, 'User B subscription is completely intact');
  assert(updatedStore.usage[userB] !== undefined, 'User B usage record is completely intact');
  assert(updatedStore.subscriptions[userB].userId === userB, 'User B ID unmodified');

  // TEST 6: Automated Cleanup of Expired Documents
  console.log('\nTEST 6: Expired Document Cleanup Engine');
  // Inject an expired feedback record into store
  const expiredStore = initLocalStore();
  const expiredKey = 'fb_expired_test_1';
  expiredStore.feedback[expiredKey] = {
    id: expiredKey,
    userId: 'some_old_user',
    solutionType: 'simulator',
    rating: 'useful',
    timestamp: now - 400 * 86400000,
    createdAt: now - 400 * 86400000,
    updatedAt: now - 400 * 86400000,
    retentionUntil: now - 1000, // Expired 1 second ago
    schemaVersion: 1
  };
  saveLocalStore(expiredStore);

  const cleanupResult = await cleanupExpiredDocuments();
  assert(cleanupResult.cleanedCount >= 1, `Purged expired documents (${cleanupResult.cleanedCount})`);

  const storeAfterCleanup = initLocalStore();
  assert(storeAfterCleanup.feedback[expiredKey] === undefined, 'Expired feedback was purged by retention policy');

  console.log('\n====================================================');
  console.log('✅ ALL RETENTION & DELETION TESTS PASSED SUCCESSFULLY!');
  console.log('====================================================');
}

runTests().catch(err => {
  console.error('❌ Test suite failed:', err);
  process.exit(1);
});
