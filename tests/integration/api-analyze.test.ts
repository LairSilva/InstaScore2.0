import express, { Request, Response } from "express";
import http from "http";
import { DiagnosisSchema } from "../../src/schemas/diagnosis";
import { calculateScoring } from "../../src/config/methodology";
import { MOCK_VALID_DIAGNOSIS_OBJECT } from "../fixtures/gemini-responses";

export async function runApiAnalyzeIntegrationTests(): Promise<{ passed: number; failed: number; tests: string[] }> {
  let passed = 0;
  let failed = 0;
  const logs: string[] = [];

  function test(name: string, fn: () => void | Promise<void>) {
    return (async () => {
      try {
        await fn();
        passed++;
        logs.push(`  \x1b[32m✔\x1b[0m [Integration:ApiAnalyze] ${name}`);
      } catch (err: any) {
        failed++;
        logs.push(`  \x1b[31m✖\x1b[0m [Integration:ApiAnalyze] ${name} -> ${err.message}`);
      }
    })();
  }

  // Build mock /api/analyze endpoint logic
  const app = express();
  app.use(express.json({ limit: "10mb" }));

  // Middleware to enforce Authorization Bearer token header on /api/analyze
  app.use("/api/analyze", (req: Request, res: Response, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || typeof authHeader !== "string" || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "UNAUTHORIZED",
        message: "Missing or malformed Authorization header. Expected format: Authorization: Bearer <Firebase ID Token>"
      });
    }

    const token = authHeader.substring(7).trim();
    if (!token) {
      return res.status(401).json({
        error: "UNAUTHORIZED",
        message: "Empty Bearer authentication token."
      });
    }

    if (token === "expired-token-simulation") {
      return res.status(401).json({
        error: "TOKEN_EXPIRED",
        message: "Firebase ID token has expired."
      });
    }

    // Valid authenticated token
    next();
  });

  app.post("/api/analyze", async (req: Request, res: Response) => {
    const { images, objective, niche, handle } = req.body;

    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ error: "Pelo menos uma captura de tela é obrigatória para o diagnóstico." });
    }

    // In a test mock context, simulate AI parsing with our validated fixture
    const parsed = DiagnosisSchema.safeParse(MOCK_VALID_DIAGNOSIS_OBJECT);
    if (!parsed.success) {
      return res.status(500).json({ error: "Falha na estrutura de resposta do modelo" });
    }

    const scoring = calculateScoring(parsed.data.evaluations as any, objective);

    return res.status(200).json({
      success: true,
      diagnosis: parsed.data,
      scoring,
      meta: {
        handle: handle || "usuario.teste",
        niche: niche || "Geral",
        objective: objective || "Crescimento"
      }
    });
  });

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", () => resolve()));
  const port = (server.address() as any).port;

  async function postAnalyze(body: any, authHeader?: string): Promise<{ status: number; body: any }> {
    return new Promise((resolve, reject) => {
      const data = JSON.stringify(body);
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "Content-Length": String(Buffer.byteLength(data))
      };
      if (authHeader !== undefined) {
        headers["Authorization"] = authHeader;
      }
      const req = http.request(
        {
          hostname: "127.0.0.1",
          port,
          path: "/api/analyze",
          method: "POST",
          headers
        },
        (res) => {
          let raw = "";
          res.on("data", chunk => raw += chunk);
          res.on("end", () => {
            let parsedBody: any = raw;
            try { parsedBody = JSON.parse(raw); } catch {}
            resolve({ status: res.statusCode || 500, body: parsedBody });
          });
        }
      );
      req.on("error", reject);
      req.write(data);
      req.end();
    });
  }

  try {
    // 1. Missing Authorization header returns 401
    await test("POST /api/analyze rejects requests without Authorization header (HTTP 401)", async () => {
      const res = await postAnalyze({
        images: ["data:image/jpeg;base64,sample"]
      }); // No auth header
      if (res.status !== 401) throw new Error(`Expected 401 Unauthorized, got ${res.status}`);
      if (!res.body.message?.includes("Missing or malformed Authorization header")) {
        throw new Error(`Expected Authorization header format error message, got: ${res.body.message}`);
      }
    });

    // 2. Malformed Authorization header returns 401
    await test("POST /api/analyze rejects requests with malformed Authorization header (HTTP 401)", async () => {
      const res = await postAnalyze(
        { images: ["data:image/jpeg;base64,sample"] },
        "Basic invalid-format-token"
      );
      if (res.status !== 401) throw new Error(`Expected 401 Unauthorized, got ${res.status}`);
    });

    // 3. Missing images validation (with valid Authorization header present)
    await test("POST /api/analyze returns 400 when images array is missing or empty", async () => {
      const res = await postAnalyze({ images: [] }, "Bearer mock-test-token-present");
      if (res.status !== 400) throw new Error(`Expected 400 Bad Request, got ${res.status}`);
      if (!res.body.error) throw new Error("Expected validation error message");
    });

    // 4. Successful analysis processing with Authorization Bearer header
    await test("POST /api/analyze processes valid request with Authorization Bearer header present", async () => {
      const res = await postAnalyze(
        {
          images: ["data:image/jpeg;base64,fakeimagecontent123"],
          handle: "mentor.lucas",
          niche: "Mentoria Executiva",
          objective: "Vender consultoria"
        },
        "Bearer mock-valid-jwt-token"
      );
      if (res.status !== 200) throw new Error(`Expected 200 OK, got ${res.status}`);
      if (!res.body.success) throw new Error("Expected success: true");
      if (!res.body.diagnosis || !res.body.scoring) throw new Error("Expected diagnosis and scoring in response");
      if (typeof res.body.scoring.score !== "number" && res.body.scoring.score !== null) {
        throw new Error("Invalid score format");
      }
      if (res.body.meta.handle !== "mentor.lucas") throw new Error("Meta handle mismatch");
    });

    // 5. Expired token single retry simulation
    await test("POST /api/analyze allows controlled token refresh retry when initial token expires", async () => {
      // Step 1: Initial call with expired token returns 401
      const res1 = await postAnalyze(
        { images: ["data:image/jpeg;base64,sample"] },
        "Bearer expired-token-simulation"
      );
      if (res1.status !== 401) throw new Error(`Expected 401 for expired token, got ${res1.status}`);

      // Step 2: Client refreshes token and retries once
      const res2 = await postAnalyze(
        {
          images: ["data:image/jpeg;base64,sample"],
          handle: "user.retry",
          niche: "Geral",
          objective: "Crescimento"
        },
        "Bearer refreshed-valid-token"
      );
      if (res2.status !== 200) throw new Error(`Expected 200 for retry with refreshed token, got ${res2.status}`);
      if (!res2.body.success) throw new Error("Expected success: true on retry");
    });

  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }

  return { passed, failed, tests: logs };
}
