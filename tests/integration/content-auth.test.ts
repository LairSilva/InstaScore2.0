import express, { Request, Response } from "express";
import http from "http";
import { requireAuth } from "../../src/server/auth";

export async function runContentAuthIntegrationTests(): Promise<{ passed: number; failed: number; tests: string[] }> {
  let passed = 0;
  let failed = 0;
  const logs: string[] = [];

  function test(name: string, fn: () => void | Promise<void>) {
    return (async () => {
      try {
        await fn();
        passed++;
        logs.push(`  \x1b[32m✔\x1b[0m [Integration:ContentAuth] ${name}`);
      } catch (err: any) {
        failed++;
        logs.push(`  \x1b[31m✖\x1b[0m [Integration:ContentAuth] ${name} -> ${err.message}`);
      }
    })();
  }

  // Set up mock Express application simulating Content Engine & Content Lab routes
  const app = express();
  app.use(express.json());

  // Simulate Content Engine endpoints with requireAuth
  app.post("/api/content/generate-idea", requireAuth, (req: Request, res: Response) => {
    res.json({ success: true, ideas: [{ id: "idea-1", title: "Test Idea" }], userId: (req as any).user?.uid });
  });

  app.post("/api/content/generate-full", requireAuth, (req: Request, res: Response) => {
    res.json({ success: true, content: { title: "Full Content", caption: "Test Caption" }, userId: (req as any).user?.uid });
  });

  app.post("/api/content/plan-calendar", requireAuth, (req: Request, res: Response) => {
    res.json({ success: true, plan: { days: [] }, userId: (req as any).user?.uid });
  });

  app.post("/api/content/create-campaign", requireAuth, (req: Request, res: Response) => {
    res.json({ success: true, campaign: { phases: [] }, userId: (req as any).user?.uid });
  });

  app.get("/api/content/library", requireAuth, (req: Request, res: Response) => {
    res.json({ success: true, items: [] });
  });

  app.post("/api/strategic/content-lab", requireAuth, (req: Request, res: Response) => {
    res.json({ success: true, item: { title: "Strategic Piece" }, userId: (req as any).user?.uid });
  });

  // Start test server on dynamic port
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", () => resolve()));
  const address = server.address() as any;
  const port = address.port;

  async function request(path: string, method: string = "POST", headers: Record<string, string> = {}, body?: any): Promise<{ status: number; body: any }> {
    return new Promise((resolve, reject) => {
      const payload = body ? JSON.stringify(body) : undefined;
      const finalHeaders: Record<string, string> = { ...headers };
      if (payload) {
        finalHeaders["Content-Type"] = "application/json";
        finalHeaders["Content-Length"] = Buffer.byteLength(payload).toString();
      }

      const req = http.request(
        {
          hostname: "127.0.0.1",
          port,
          path,
          method,
          headers: finalHeaders
        },
        (res) => {
          let raw = "";
          res.on("data", chunk => raw += chunk);
          res.on("end", () => {
            let parsed: any = raw;
            try { parsed = JSON.parse(raw); } catch {}
            resolve({ status: res.statusCode || 500, body: parsed });
          });
        }
      );
      req.on("error", reject);
      if (payload) req.write(payload);
      req.end();
    });
  }

  try {
    // 1. Content Engine /generate-idea: 401 without auth header
    await test("POST /api/content/generate-idea returns 401 UNAUTHORIZED when Authorization header is absent", async () => {
      const res = await request("/api/content/generate-idea", "POST", {}, { format: "reel" });
      if (res.status !== 401) throw new Error(`Expected 401 Unauthorized, got ${res.status}`);
      if (res.body?.error !== "UNAUTHORIZED") throw new Error(`Expected error UNAUTHORIZED, got ${res.body?.error}`);
      if (!res.body?.message?.includes("Authorization: Bearer <Firebase ID Token>")) {
        throw new Error(`Expected specific authorization format message, got: ${res.body?.message}`);
      }
    });

    // 2. Content Engine /generate-full: 401 with malformed header (Basic instead of Bearer)
    await test("POST /api/content/generate-full returns 401 UNAUTHORIZED with malformed Authorization header scheme", async () => {
      const res = await request("/api/content/generate-full", "POST", { Authorization: "Basic 123456" }, { format: "reel" });
      if (res.status !== 401) throw new Error(`Expected 401 Unauthorized, got ${res.status}`);
      if (res.body?.error !== "UNAUTHORIZED") throw new Error(`Expected error UNAUTHORIZED, got ${res.body?.error}`);
    });

    // 3. Content Engine /plan-calendar: 401 with empty Bearer token
    await test("POST /api/content/plan-calendar returns 401 UNAUTHORIZED with empty Bearer token", async () => {
      const res = await request("/api/content/plan-calendar", "POST", { Authorization: "Bearer " }, { daysCount: 15 });
      if (res.status !== 401) throw new Error(`Expected 401 Unauthorized, got ${res.status}`);
      if (res.body?.error !== "UNAUTHORIZED") throw new Error(`Expected error UNAUTHORIZED, got ${res.body?.error}`);
    });

    // 4. Content Engine /create-campaign: 401 with invalid / expired token
    await test("POST /api/content/create-campaign returns 401 UNAUTHORIZED with invalid token signature", async () => {
      const res = await request("/api/content/create-campaign", "POST", { Authorization: "Bearer invalid.expired.jwt" }, { campaignType: "product_launch" });
      if (res.status !== 401) throw new Error(`Expected 401 Unauthorized, got ${res.status}`);
    });

    // 5. Strategic Content Lab: 401 without auth header
    await test("POST /api/strategic/content-lab returns 401 UNAUTHORIZED when Authorization header is absent", async () => {
      const res = await request("/api/strategic/content-lab", "POST", {}, { format: "reel" });
      if (res.status !== 401) throw new Error(`Expected 401 Unauthorized, got ${res.status}`);
      if (res.body?.error !== "UNAUTHORIZED") throw new Error(`Expected error UNAUTHORIZED, got ${res.body?.error}`);
    });

    // 6. Content Library GET /api/content/library: 401 without auth header
    await test("GET /api/content/library returns 401 UNAUTHORIZED when Authorization header is absent", async () => {
      const res = await request("/api/content/library", "GET", {});
      if (res.status !== 401) throw new Error(`Expected 401 Unauthorized, got ${res.status}`);
    });

  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }

  return { passed, failed, tests: logs };
}
