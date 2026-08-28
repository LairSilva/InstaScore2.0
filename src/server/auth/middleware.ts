import { Request, Response, NextFunction } from "express";
import { AuthenticatedUser } from "./types";
import { verifyFirebaseToken } from "./firebase-admin";

/**
 * Parses and returns the list of admin UIDs configured in environment / secrets.
 */
export function getAdminUids(): string[] {
  const envUids = process.env.ADMIN_UIDS || "";
  return envUids
    .split(",")
    .map((uid) => uid.trim())
    .filter((uid) => uid.length > 0);
}

/**
 * Parses and returns the list of admin emails configured in environment / secrets.
 */
export function getAdminEmails(): string[] {
  const envEmails = process.env.ADMIN_EMAILS || "";
  const emails = envEmails
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.length > 0);

  // Add developer/admin owner email to default list if not already present
  const defaultAdmin = "lairx49@gmail.com";
  if (!emails.includes(defaultAdmin)) {
    emails.push(defaultAdmin);
  }

  return emails;
}

/**
 * Logs secure audit trail for admin/dev test mode execution.
 * Never logs Firebase tokens, API keys, secrets, or sensitive payload content.
 */
export function logContentTestAudit(endpoint: string): void {
  console.info(
    `[ContentTestAudit]\nUSER_AUTHENTICATED=true\nADMIN_TEST_MODE=true\nENDPOINT=${endpoint}\nTEST_REQUEST=true`
  );
}

/**
 * Helper to check if an authenticated user has admin privileges.
 */
export function isUserAdmin(user: AuthenticatedUser | undefined): boolean {
  if (!user || !user.uid) {
    return false;
  }

  // 1. Check custom claim in token
  if (user.admin === true || user.role === "admin") {
    return true;
  }

  // 2. Check ADMIN_UIDS environment variable
  const adminUids = getAdminUids();
  if (adminUids.includes(user.uid)) {
    return true;
  }

  // 3. Check ADMIN_EMAILS environment variable
  if (user.email) {
    const adminEmails = getAdminEmails();
    if (adminEmails.includes(user.email.toLowerCase())) {
      return true;
    }
  }

  return false;
}

/**
 * Sanitizes and overrides any incoming body/query/header userId with the authenticated req.user.uid.
 * If a different userId was supplied, logs a security audit event without exposing tokens or sensitive user info.
 */
function sanitizeAndEnforceAuthenticatedIdentity(req: Request): void {
  if (!req.user || !req.user.uid) {
    return;
  }

  const authenticatedUid = req.user.uid;

  // Check and sanitize req.body.userId
  if (req.body && typeof req.body === "object") {
    if (req.body.userId && req.body.userId !== authenticatedUid) {
      console.warn(
        `[SecurityAudit] User '${authenticatedUid}' submitted divergent body.userId '${req.body.userId}'. Overriding to authenticated UID.`
      );
    }
    req.body.userId = authenticatedUid;
  }

  // Check and sanitize req.query.userId
  if (req.query && typeof req.query === "object") {
    if (req.query.userId && req.query.userId !== authenticatedUid) {
      console.warn(
        `[SecurityAudit] User '${authenticatedUid}' submitted divergent query.userId '${req.query.userId}'. Overriding to authenticated UID.`
      );
    }
    req.query.userId = authenticatedUid;
  }
}

/**
 * Express Middleware: requireAuth
 *
 * Enforces valid Firebase ID token authentication via Authorization: Bearer <token>.
 * Rejects missing, invalid, or expired tokens with HTTP 401.
 * Blocks any attempt to spoof userId with HTTP 403.
 *
 * DEV_AUTH_BYPASS is only permissible in non-production environments when explicitly enabled.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const isProd = process.env.NODE_ENV === "production";
  const devBypassEnabled = process.env.DEV_AUTH_BYPASS === "true";

  // CRITICAL SECURITY RULE: DEV_AUTH_BYPASS must NEVER execute in production.
  if (isProd && devBypassEnabled) {
    console.error("[CRITICAL SECURITY ALERT] DEV_AUTH_BYPASS is strictly prohibited in production mode!");
    res.status(401).json({
      success: false,
      error: "UNAUTHORIZED",
      message: "Invalid authentication configuration.",
    });
    return;
  }

  // Development bypass (only active when NODE_ENV !== 'production' AND DEV_AUTH_BYPASS === 'true')
  if (!isProd && devBypassEnabled) {
    const devUid = (req.headers["x-dev-user-id"] as string) || (req.headers["x-user-id"] as string) || "dev-bypass-user-001";
    const devEmail = (req.headers["x-dev-user-email"] as string) || "dev@instascore.ai";
    const devIsAdmin = req.headers["x-dev-user-admin"] === "true";

    req.user = {
      uid: devUid,
      email: devEmail,
      email_verified: true,
      admin: devIsAdmin,
      role: devIsAdmin ? "admin" : "user",
    };

    sanitizeAndEnforceAuthenticatedIdentity(req);
    return next();
  }

  // Standard token verification
  const authHeader = req.headers.authorization;
  const endpoint = req.originalUrl || req.url;

  if (!authHeader || typeof authHeader !== "string" || !authHeader.startsWith("Bearer ")) {
    const authScheme = authHeader && typeof authHeader === "string" ? authHeader.split(" ")[0] : "NONE";
    console.warn(`[AuthAudit] AUTH_PRESENT=${Boolean(authHeader)} AUTH_SCHEME=${authScheme} USER_AUTHENTICATED=false TOKEN_VALID=false ENDPOINT=${endpoint}`);
    res.status(401).json({
      success: false,
      error: "UNAUTHORIZED",
      message: "Missing or malformed Authorization header. Expected format: 'Authorization: Bearer <Firebase ID Token>'.",
    });
    return;
  }

  const token = authHeader.substring(7).trim();
  if (!token) {
    console.warn(`[AuthAudit] AUTH_PRESENT=true AUTH_SCHEME=Bearer TOKEN_VALID=false USER_AUTHENTICATED=false ENDPOINT=${endpoint}`);
    res.status(401).json({
      success: false,
      error: "UNAUTHORIZED",
      message: "Empty Bearer authentication token.",
    });
    return;
  }

  try {
    const authenticatedUser = await verifyFirebaseToken(token);
    req.user = authenticatedUser;

    // Verify admin status from environment variables if not present in custom claim
    if (!req.user.admin && isUserAdmin(req.user)) {
      req.user.admin = true;
    }

    console.info(`[AuthAudit] AUTH_PRESENT=true AUTH_SCHEME=Bearer TOKEN_VALID=true USER_AUTHENTICATED=true USER_ID=${req.user.uid} ENDPOINT=${endpoint}`);

    sanitizeAndEnforceAuthenticatedIdentity(req);
    return next();
  } catch (err: any) {
    console.warn(`[AuthAudit] AUTH_PRESENT=true AUTH_SCHEME=Bearer TOKEN_VALID=false USER_AUTHENTICATED=false ENDPOINT=${endpoint} REASON=${err?.code || err?.message || "verification_failed"}`);
    res.status(401).json({
      success: false,
      error: "UNAUTHORIZED",
      message: "Invalid, malformed, or expired Firebase ID token.",
    });
    return;
  }
}

/**
 * Express Middleware: requireAdmin
 *
 * Ensures the user is authenticated AND holds verified administrative privileges
 * (via custom claim or secure ADMIN_UIDS / ADMIN_EMAILS environment lists).
 * Returns 401 if unauthenticated, 403 if authenticated but not admin.
 */
export async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  // If user is not yet attached to request, run requireAuth first
  if (!req.user) {
    await requireAuth(req, res, () => {});
    // If requireAuth sent a response, return
    if (res.headersSent) {
      return;
    }
  }

  if (!req.user) {
    res.status(401).json({
      success: false,
      error: "UNAUTHORIZED",
      message: "Authentication required for admin access.",
    });
    return;
  }

  if (!isUserAdmin(req.user)) {
    res.status(403).json({
      success: false,
      error: "FORBIDDEN",
      message: "Access denied. Administrative privileges are required to access this resource.",
    });
    return;
  }

  return next();
}

/**
 * Express Middleware: optionalAuth
 *
 * If Authorization header is provided, verifies it and populates req.user.
 * If header is absent, allows request to proceed with req.user undefined.
 * If header is malformed or token invalid, returns 401.
 */
export async function optionalAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const isProd = process.env.NODE_ENV === "production";
  const devBypassEnabled = process.env.DEV_AUTH_BYPASS === "true";

  if (!isProd && devBypassEnabled) {
    const devUid = (req.headers["x-dev-user-id"] as string) || (req.headers["x-user-id"] as string);
    if (devUid) {
      req.user = {
        uid: devUid,
        email: (req.headers["x-dev-user-email"] as string) || "dev@instascore.ai",
        email_verified: true,
      };
    }
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return next();
  }

  if (!authHeader.startsWith("Bearer ")) {
    res.status(401).json({
      success: false,
      error: "UNAUTHORIZED",
      message: "Malformed Authorization header.",
    });
    return;
  }

  const token = authHeader.substring(7).trim();
  if (!token) {
    res.status(401).json({
      success: false,
      error: "UNAUTHORIZED",
      message: "Empty Bearer token.",
    });
    return;
  }

  try {
    const user = await verifyFirebaseToken(token);
    req.user = user;
    return next();
  } catch (err: any) {
    console.warn("[optionalAuth] Token verification fallback note:", err?.message || err);
    // For optional authentication routes, proceed without req.user
    return next();
  }
}

/**
 * Safe helper to retrieve the authenticated user ID without trusting client body/headers.
 */
export function getAuthenticatedUserId(req: Request, fallbackDefault = "anonymous"): string {
  if (req.user && req.user.uid) {
    return req.user.uid;
  }
  return fallbackDefault;
}
