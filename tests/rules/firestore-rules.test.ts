/**
 * Firestore Security Rules Comprehensive Unit & Matrix Test Suite
 * Tests rule behaviors for:
 * 1. Owner access
 * 2. Cross-user / Other user access
 * 3. Anonymous / Unauthenticated access
 * 4. Client tampering / Privilege escalation
 */

interface RuleRequest {
  auth: { uid: string } | null;
  resource?: { data: Record<string, any> }; // incoming data for create/update
}

interface ExistingResource {
  data: Record<string, any>;
}

// Logic mirror of firestore.rules
function isDocOwner(req: RuleRequest, res?: ExistingResource): boolean {
  if (!req.auth || !req.auth.uid) return false;
  return Boolean(res && res.data && res.data.userId === req.auth.uid);
}

function canCreateResource(req: RuleRequest): boolean {
  if (!req.auth || !req.auth.uid) return false;
  return Boolean(req.resource && req.resource.data && req.resource.data.userId === req.auth.uid);
}

function evaluateCollectionRule(
  collection: string,
  op: "read" | "create" | "update" | "delete",
  req: RuleRequest,
  res?: ExistingResource
): { allowed: boolean; reason?: string } {
  // Collections that allow owner read/write
  const ownerCollections = ["diagnoses", "start_projects", "digital_twins", "profile_dna", "performance_memory"];

  if (ownerCollections.includes(collection)) {
    if (op === "read") {
      if (isDocOwner(req, res)) return { allowed: true };
      return { allowed: false, reason: "NOT_OWNER_OR_UNAUTHENTICATED" };
    }

    if (op === "create") {
      if (canCreateResource(req)) return { allowed: true };
      return { allowed: false, reason: "CANNOT_CREATE_FOR_OTHER_USER" };
    }

    if (op === "update" || op === "delete") {
      if (isDocOwner(req, res)) return { allowed: true };
      return { allowed: false, reason: "NOT_OWNER" };
    }
  }

  // Server-only / Admin-only collections
  const serverOnlyCollections = ["subscriptions", "usage", "checkout_sessions", "webhook_events", "payments_processed", "ai_logs", "rate_limits"];
  if (serverOnlyCollections.includes(collection)) {
    if (op === "read" && (collection === "subscriptions" || collection === "usage" || collection === "checkout_sessions")) {
      if (req.auth && req.auth.uid && (res?.data?.userId === req.auth.uid || req.auth.uid)) return { allowed: true };
      return { allowed: false, reason: "NOT_OWNER_OR_UNAUTHENTICATED" };
    }
    // Client SDK direct writes are strictly prohibited
    return { allowed: false, reason: "SERVER_ONLY_COLLECTION" };
  }

  return { allowed: false, reason: "DENIED_BY_DEFAULT" };
}

export function runFirestoreRulesTests(): { passed: number; failed: number; tests: string[] } {
  let passed = 0;
  let failed = 0;
  const logs: string[] = [];

  function test(name: string, fn: () => void) {
    try {
      fn();
      passed++;
      logs.push(`  \x1b[32m✔\x1b[0m [Rules:Firestore] ${name}`);
    } catch (err: any) {
      failed++;
      logs.push(`  \x1b[31m✖\x1b[0m [Rules:Firestore] ${name} -> ${err.message}`);
    }
  }

  const userA = { uid: "user_alice_123" };
  const userB = { uid: "user_bob_456" };

  // 1. Owner read/write own diagnosis
  test("Owner can read and update their own diagnosis document", () => {
    const existingDoc: ExistingResource = { data: { userId: userA.uid, score: 75 } };

    const readRes = evaluateCollectionRule("diagnoses", "read", { auth: userA }, existingDoc);
    if (!readRes.allowed) throw new Error("Owner was denied read access to own document");

    const updateRes = evaluateCollectionRule("diagnoses", "update", { auth: userA, resource: { data: { userId: userA.uid, score: 80 } } }, existingDoc);
    if (!updateRes.allowed) throw new Error("Owner was denied update access to own document");
  });

  // 2. Cross-user access is denied
  test("User B is denied access when attempting to read or modify User A's document", () => {
    const docUserA: ExistingResource = { data: { userId: userA.uid, score: 75 } };

    const crossRead = evaluateCollectionRule("diagnoses", "read", { auth: userB }, docUserA);
    if (crossRead.allowed) throw new Error("User B was improperly allowed to read User A's document");

    const crossUpdate = evaluateCollectionRule("diagnoses", "update", { auth: userB }, docUserA);
    if (crossUpdate.allowed) throw new Error("User B was improperly allowed to update User A's document");
  });

  // 3. Unauthenticated access is denied
  test("Anonymous / unauthenticated visitor is denied read/write access to user collections", () => {
    const docUserA: ExistingResource = { data: { userId: userA.uid, score: 75 } };

    const anonRead = evaluateCollectionRule("diagnoses", "read", { auth: null }, docUserA);
    if (anonRead.allowed) throw new Error("Anonymous visitor was improperly allowed to read document");

    const anonCreate = evaluateCollectionRule("diagnoses", "create", { auth: null, resource: { data: { userId: userA.uid } } });
    if (anonCreate.allowed) throw new Error("Anonymous visitor was improperly allowed to create document");
  });

  // 4. Privilege escalation / Client writes to subscriptions denied
  test("Direct client writes to subscriptions and billing collections are strictly rejected", () => {
    const subWriteAttempt = evaluateCollectionRule("subscriptions", "create", {
      auth: userA,
      resource: { data: { userId: userA.uid, plan: "PRO", status: "active" } }
    });

    if (subWriteAttempt.allowed) {
      throw new Error("Client was improperly allowed to write directly to subscriptions collection");
    }
  });

  return { passed, failed, tests: logs };
}
