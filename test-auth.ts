/**
 * InstaScore.ai - Server-Side Centralized Authentication Layer Test Suite
 *
 * Validates:
 * 1. Missing token rejection (401 Unauthorized)
 * 2. Malformed or invalid token rejection (401 Unauthorized)
 * 3. User ID spoofing / mismatch prevention (403 Forbidden)
 * 4. Non-admin access to admin routes rejection (403 Forbidden)
 * 5. Authorized admin access via ADMIN_UIDS or custom claims (200 OK)
 * 6. DEV_AUTH_BYPASS security enforcement in production (Strict Rejection)
 * 7. DEV_AUTH_BYPASS functionality in non-production development mode
 */

import express, { Request, Response } from "express";
import http from "http";
import { 
  requireAuth, 
  requireAdmin, 
  optionalAuth, 
  isUserAdmin,
  getAdminUids,
  getAuthenticatedUserId 
} from "./src/server/auth";

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  \x1b[32m✔ PASS\x1b[0m ${testName}`);
    passedCount++;
  } else {
    console.error(`  \x1b[31m✖ FAIL\x1b[0m ${testName}`);
    if (detail) console.error(`    \x1b[33mDetail:\x1b[0m ${detail}`);
    failedCount++;
  }
}

// Simple HTTP request helper
async function makeRequest(
  port: number,
  path: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    body?: any;
  } = {}
): Promise<{ status: number; body: any; headers: http.IncomingHttpHeaders }> {
  return new Promise((resolve, reject) => {
    const data = options.body ? JSON.stringify(options.body) : undefined;
    const req = http.request(
      {
        hostname: "127.0.0.1",
        port,
        path,
        method: options.method || "GET",
        headers: {
          "Content-Type": "application/json",
          ...(data ? { "Content-Length": Buffer.byteLength(data) } : {}),
          ...options.headers,
        },
      },
      (res) => {
        let raw = "";
        res.on("data", (chunk) => (raw += chunk));
        res.on("end", () => {
          let parsed: any = raw;
          try {
            parsed = JSON.parse(raw);
          } catch {}
          resolve({
            status: res.statusCode || 500,
            body: parsed,
            headers: res.headers,
          });
        });
      }
    );

    req.on("error", reject);
    if (data) req.write(data);
    req.end();
  });
}

async function runAuthTests() {
  console.log("\n============================================================");
  console.log("🚀 STARTING INSTASCORE SERVER AUTHENTICATION TEST SUITE");
  console.log("============================================================\n");

  // Configure environment for test suite
  process.env.ADMIN_UIDS = "admin_master_123,admin_super_999";
  process.env.ADMIN_EMAILS = "admin@instascore.ai,lead@instascore.ai";

  // Build test Express server
  const testApp = express();
  testApp.use(express.json());

  // Test route 1: Protected User Route
  testApp.post("/test/user-action", requireAuth, (req: Request, res: Response) => {
    return res.json({
      success: true,
      message: "Action authorized",
      user: req.user,
      effectiveUserId: getAuthenticatedUserId(req),
    });
  });

  // Test route 2: Protected Admin Route
  testApp.get("/test/admin-action", requireAdmin, (req: Request, res: Response) => {
    return res.json({
      success: true,
      message: "Admin action authorized",
      user: req.user,
    });
  });

  // Test route 3: Optional Auth Route
  testApp.get("/test/public-or-auth", optionalAuth, (req: Request, res: Response) => {
    return res.json({
      success: true,
      authenticated: Boolean(req.user),
      userId: getAuthenticatedUserId(req, "anonymous_guest"),
    });
  });

  const server = http.createServer(testApp);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", () => resolve()));
  const address = server.address() as any;
  const port = address.port;

  try {
    // ------------------------------------------------------------
    // TEST SUITE 1: MISSING AUTHENTICATION TOKEN (HTTP 401)
    // ------------------------------------------------------------
    console.log("📋 Group 1: Missing Token Handling");
    
    // Ensure DEV_AUTH_BYPASS is disabled
    process.env.DEV_AUTH_BYPASS = "false";
    process.env.NODE_ENV = "test";

    const resMissing = await makeRequest(port, "/test/user-action", {
      method: "POST",
      body: { action: "create_content" },
    });

    assert(
      resMissing.status === 401,
      "Request without Authorization header returns HTTP 401 Unauthorized",
      `Received status ${resMissing.status}`
    );
    assert(
      resMissing.body?.error === "UNAUTHORIZED",
      "Error code is 'UNAUTHORIZED' for missing token",
      `Received body: ${JSON.stringify(resMissing.body)}`
    );

    // ------------------------------------------------------------
    // TEST SUITE 2: MALFORMED OR INVALID TOKEN (HTTP 401)
    // ------------------------------------------------------------
    console.log("\n📋 Group 2: Malformed & Invalid Token Handling");

    const resMalformedHeader = await makeRequest(port, "/test/user-action", {
      method: "POST",
      headers: { Authorization: "Basic dXNlcjpwYXNz" },
      body: { action: "create_content" },
    });
    assert(
      resMalformedHeader.status === 401,
      "Non-Bearer authorization header is rejected with HTTP 401",
      `Received status ${resMalformedHeader.status}`
    );

    const resInvalidToken = await makeRequest(port, "/test/user-action", {
      method: "POST",
      headers: { Authorization: "Bearer invalid.garbage.token.here" },
      body: { action: "create_content" },
    });
    assert(
      resInvalidToken.status === 401,
      "Invalid or unverifiable token string is rejected with HTTP 401",
      `Received status ${resInvalidToken.status}`
    );

    // ------------------------------------------------------------
    // TEST SUITE 3: USER ID SPOOFING SANITIZATION / ENFORCEMENT (BOLA/IDOR PREVENTION)
    // ------------------------------------------------------------
    console.log("\n📋 Group 3: User ID Spoofing Sanitization (BOLA/IDOR Protection)");

    // Enable dev bypass for deterministic identity testing in test env
    process.env.DEV_AUTH_BYPASS = "true";
    process.env.NODE_ENV = "development";

    // User is authenticated as "user_alice_100", but body claims "victim_bob_200"
    // Per requirements: sanitize and enforce authenticated UID without leaking or trusting client body/query/header
    const resMismatchBody = await makeRequest(port, "/test/user-action", {
      method: "POST",
      headers: { 
        "x-dev-user-id": "user_alice_100",
        "x-dev-user-email": "alice@example.com"
      },
      body: { 
        userId: "victim_bob_200", // Mismatched UID attempting to impersonate Bob!
        data: "sensitive_change" 
      },
    });

    assert(
      resMismatchBody.status === 200,
      "Mismatched body.userId is sanitized/overridden to authenticated UID without trusting spoofed payload (HTTP 200)",
      `Received status ${resMismatchBody.status} (Body: ${JSON.stringify(resMismatchBody.body)})`
    );
    assert(
      resMismatchBody.body?.effectiveUserId === "user_alice_100",
      "Effective user ID resolves strictly to authenticated UID (user_alice_100)"
    );

    // Matching userId is allowed
    const resMatchingBody = await makeRequest(port, "/test/user-action", {
      method: "POST",
      headers: { 
        "x-dev-user-id": "user_alice_100",
        "x-dev-user-email": "alice@example.com"
      },
      body: { 
        userId: "user_alice_100", // Matching UID
        data: "legitimate_change" 
      },
    });

    assert(
      resMatchingBody.status === 200,
      "Matching body.userId passes through successfully (HTTP 200)",
      `Received status ${resMatchingBody.status}`
    );
    assert(
      resMatchingBody.body?.effectiveUserId === "user_alice_100",
      "Effective user ID resolves strictly to authenticated UID"
    );

    // ------------------------------------------------------------
    // TEST SUITE 4: REQUIRE ADMIN AUTHORIZATION & ACCESS CONTROL
    // ------------------------------------------------------------
    console.log("\n📋 Group 4: Admin Privileges & Role Enforcement (HTTP 403 vs 200)");

    // Case 4.1: Regular user accessing admin route
    const resNormalUserAdmin = await makeRequest(port, "/test/admin-action", {
      headers: {
        "x-dev-user-id": "regular_john_doe",
        "x-dev-user-email": "john@example.com",
        "x-dev-user-admin": "false"
      }
    });

    assert(
      resNormalUserAdmin.status === 403,
      "Standard authenticated non-admin user is rejected from admin route with HTTP 403",
      `Received status ${resNormalUserAdmin.status}`
    );

    // Case 4.2: Admin user in ADMIN_UIDS accessing admin route
    const resAdminByUid = await makeRequest(port, "/test/admin-action", {
      headers: {
        "x-dev-user-id": "admin_master_123", // Registered in ADMIN_UIDS
        "x-dev-user-email": "random@example.com"
      }
    });

    assert(
      resAdminByUid.status === 200,
      "User present in ADMIN_UIDS is granted admin access (HTTP 200)",
      `Received status ${resAdminByUid.status}`
    );

    // Case 4.3: Admin user in ADMIN_EMAILS accessing admin route
    const resAdminByEmail = await makeRequest(port, "/test/admin-action", {
      headers: {
        "x-dev-user-id": "some_other_uid",
        "x-dev-user-email": "admin@instascore.ai" // Registered in ADMIN_EMAILS
      }
    });

    assert(
      resAdminByEmail.status === 200,
      "User matching ADMIN_EMAILS is granted admin access (HTTP 200)",
      `Received status ${resAdminByEmail.status}`
    );

    // ------------------------------------------------------------
    // TEST SUITE 5: DEV_AUTH_BYPASS PRODUCTION SAFETY
    // ------------------------------------------------------------
    console.log("\n📋 Group 5: Production Safety Guards (DEV_AUTH_BYPASS Forbidden in Prod)");

    // Simulate NODE_ENV=production with DEV_AUTH_BYPASS=true
    process.env.NODE_ENV = "production";
    process.env.DEV_AUTH_BYPASS = "true";

    const resProdBypassAttempt = await makeRequest(port, "/test/user-action", {
      method: "POST",
      headers: {
        "x-dev-user-id": "hacker_trying_bypass",
      },
      body: { action: "exploit" }
    });

    assert(
      resProdBypassAttempt.status === 401,
      "DEV_AUTH_BYPASS is strictly blocked and rejected in NODE_ENV=production (HTTP 401)",
      `Received status ${resProdBypassAttempt.status}`
    );

    // ------------------------------------------------------------
    // TEST SUITE 6: OPTIONAL AUTH ROUTE BEHAVIOR
    // ------------------------------------------------------------
    console.log("\n📋 Group 6: Optional Auth Route Flexibility");

    process.env.NODE_ENV = "development";
    process.env.DEV_AUTH_BYPASS = "false";

    // Anonymous visitor
    const resAnon = await makeRequest(port, "/test/public-or-auth");
    assert(
      resAnon.status === 200 && resAnon.body.authenticated === false,
      "Anonymous request to optionalAuth route succeeds with authenticated=false",
      `Received body: ${JSON.stringify(resAnon.body)}`
    );

  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }

  console.log("\n============================================================");
  console.log(`📊 TEST RESULTS: ${passedCount} PASSED | ${failedCount} FAILED`);
  console.log("============================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runAuthTests().catch((err) => {
  console.error("Fatal test error:", err);
  process.exit(1);
});
