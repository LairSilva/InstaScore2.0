import express, { Request, Response } from "express";
import http from "http";
import { 
  requireAuth, 
  requireAdmin, 
  optionalAuth, 
  isUserAdmin, 
  getAdminUids 
} from "../../src/server/auth";

export async function runAuthIntegrationTests(): Promise<{ passed: number; failed: number; tests: string[] }> {
  let passed = 0;
  let failed = 0;
  const logs: string[] = [];

  function test(name: string, fn: () => void | Promise<void>) {
    return (async () => {
      try {
        await fn();
        passed++;
        logs.push(`  \x1b[32m✔\x1b[0m [Integration:Auth] ${name}`);
      } catch (err: any) {
        failed++;
        logs.push(`  \x1b[31m✖\x1b[0m [Integration:Auth] ${name} -> ${err.message}`);
      }
    })();
  }

  // Set up mock Express application
  const app = express();
  app.use(express.json());

  app.get("/test/protected", requireAuth, (req: Request, res: Response) => {
    res.json({ status: "ok", userId: (req as any).user?.uid });
  });

  app.get("/test/admin", requireAuth, requireAdmin, (req: Request, res: Response) => {
    res.json({ status: "ok", admin: true, userId: (req as any).user?.uid });
  });

  app.get("/test/optional", optionalAuth, (req: Request, res: Response) => {
    res.json({ status: "ok", authenticated: Boolean((req as any).user) });
  });

  // Start test server on dynamic port
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", () => resolve()));
  const address = server.address() as any;
  const port = address.port;

  async function request(path: string, headers: Record<string, string> = {}): Promise<{ status: number; body: any }> {
    return new Promise((resolve, reject) => {
      const req = http.request(
        {
          hostname: "127.0.0.1",
          port,
          path,
          method: "GET",
          headers
        },
        (res) => {
          let raw = "";
          res.on("data", chunk => raw += chunk);
          res.on("end", () => {
            let body: any = raw;
            try { body = JSON.parse(raw); } catch {}
            resolve({ status: res.statusCode || 500, body });
          });
        }
      );
      req.on("error", reject);
      req.end();
    });
  }

  try {
    // 1. Missing token on protected endpoint -> 401
    await test("requireAuth returns 401 when Authorization header is missing", async () => {
      const res = await request("/test/protected");
      if (res.status !== 401) throw new Error(`Expected 401 Unauthorized, got ${res.status}`);
      if (!res.body.error) throw new Error("Expected error message in response");
    });

    // 2. Malformed / Invalid token on protected endpoint -> 401
    await test("requireAuth returns 401 when Bearer token is malformed", async () => {
      const res = await request("/test/protected", {
        Authorization: "Bearer invalid.fake.token"
      });
      if (res.status !== 401) throw new Error(`Expected 401 Unauthorized, got ${res.status}`);
    });

    // 3. Optional auth endpoint allows unauthenticated visitors
    await test("optionalAuth allows unauthenticated request without failure", async () => {
      const res = await request("/test/optional");
      if (res.status !== 200) throw new Error(`Expected 200 OK, got ${res.status}`);
      if (res.body.authenticated !== false) throw new Error("Expected authenticated: false");
    });

    // 4. Admin checking utility
    await test("isUserAdmin correctly validates ADMIN_UIDS and admin claims", () => {
      const adminUids = getAdminUids();
      if (adminUids.length > 0) {
        const isAdmin = isUserAdmin({ uid: adminUids[0] });
        if (!isAdmin) throw new Error("Expected user in ADMIN_UIDS to be recognized as admin");
      }
      const regularUserAdmin = isUserAdmin({ uid: "regular_user_123" });
      if (regularUserAdmin) throw new Error("Expected regular user to NOT be recognized as admin");

      const claimAdmin = isUserAdmin({ uid: "user_with_claim", admin: true });
      if (!claimAdmin) throw new Error("Expected user with custom claim admin=true to be recognized as admin");
    });

  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }

  return { passed, failed, tests: logs };
}
