import { 
  DiagnosisSchema, 
  EvaluationItemSchema, 
  StrengthItemSchema, 
  CriticalGapItemSchema, 
  RecommendedActionItemSchema, 
  TomorrowActionSchema,
  normalizeEffort,
  normalizeConfidence,
  normalizeGrade
} from "../../src/schemas/diagnosis";
import { MOCK_VALID_DIAGNOSIS_OBJECT } from "../fixtures/gemini-responses";

export function runSchemasUnitTests(): { passed: number; failed: number; tests: string[] } {
  let passed = 0;
  let failed = 0;
  const logs: string[] = [];

  function test(name: string, fn: () => void) {
    try {
      fn();
      passed++;
      logs.push(`  \x1b[32m✔\x1b[0m [Unit:Schemas] ${name}`);
    } catch (err: any) {
      failed++;
      logs.push(`  \x1b[31m✖\x1b[0m [Unit:Schemas] ${name} -> ${err.message}`);
    }
  }

  // 1. Full DiagnosisSchema on valid fixture
  test("DiagnosisSchema safely parses complete structured valid payload", () => {
    const parseResult = DiagnosisSchema.safeParse(MOCK_VALID_DIAGNOSIS_OBJECT);
    if (!parseResult.success) {
      throw new Error(`Failed to parse valid payload: ${JSON.stringify(parseResult.error)}`);
    }
    if (parseResult.data.evaluations.length !== MOCK_VALID_DIAGNOSIS_OBJECT.evaluations.length) {
      throw new Error("Evaluation items count mismatch");
    }
  });

  // 2. normalizeEffort variations
  test("normalizeEffort maps Portuguese/English synonyms to low/medium/high", () => {
    if (normalizeEffort("baixo") !== "low") throw new Error("Expected 'baixo' -> 'low'");
    if (normalizeEffort("FÁCIL") !== "low") throw new Error("Expected 'FÁCIL' -> 'low'");
    if (normalizeEffort("simples") !== "low") throw new Error("Expected 'simples' -> 'low'");
    if (normalizeEffort("alto") !== "high") throw new Error("Expected 'alto' -> 'high'");
    if (normalizeEffort("complexo") !== "high") throw new Error("Expected 'complexo' -> 'high'");
    if (normalizeEffort("difícil") !== "high") throw new Error("Expected 'difícil' -> 'high'");
    if (normalizeEffort("médio") !== "medium") throw new Error("Expected 'médio' -> 'medium'");
    if (normalizeEffort(null) !== "medium") throw new Error("Expected null -> 'medium'");
    if (normalizeEffort(123) !== "medium") throw new Error("Expected number -> 'medium'");
  });

  // 3. normalizeConfidence scaling
  test("normalizeConfidence normalizes percentages (0-100) and fractions (0-1)", () => {
    if (normalizeConfidence(0.95) !== 0.95) throw new Error("Expected 0.95 -> 0.95");
    if (normalizeConfidence(95) !== 0.95) throw new Error("Expected 95 -> 0.95");
    if (normalizeConfidence("85") !== 0.85) throw new Error("Expected '85' -> 0.85");
    if (normalizeConfidence(null) !== 0.85) throw new Error("Expected null -> default 0.85");
    if (normalizeConfidence("invalid") !== 0.85) throw new Error("Expected invalid string -> default 0.85");
  });

  // 4. normalizeGrade bounds and types
  test("normalizeGrade clamps values between 0-4 or converts null/strings safely", () => {
    if (normalizeGrade(3) !== 3) throw new Error("Expected 3 -> 3");
    if (normalizeGrade("4") !== 4) throw new Error("Expected '4' -> 4");
    if (normalizeGrade(5) !== 4) throw new Error("Expected 5 -> clamped 4");
    if (normalizeGrade(-2) !== 0) throw new Error("Expected -2 -> clamped 0");
    if (normalizeGrade("null") !== null) throw new Error("Expected 'null' -> null");
    if (normalizeGrade(null) !== null) throw new Error("Expected null -> null");
    if (normalizeGrade(undefined) !== null) throw new Error("Expected undefined -> null");
  });

  // 5. Preprocessing tolerance in EvaluationItemSchema
  test("EvaluationItemSchema preprocesses string grades and provides fallbacks for missing texts", () => {
    const rawItem = {
      criterion_id: "positioning.offer_clarity",
      grade: "3",
      confidence: "90",
      evidence: "",
      justification: ""
    };
    const parsed = EvaluationItemSchema.safeParse(rawItem);
    if (!parsed.success) throw new Error(`Schema parse failed: ${JSON.stringify(parsed.error)}`);
    if (parsed.data.grade !== 3) throw new Error(`Expected grade 3, got ${parsed.data.grade}`);
    if (parsed.data.confidence !== 0.90) throw new Error(`Expected confidence 0.90, got ${parsed.data.confidence}`);
    if (!parsed.data.evidence) throw new Error("Expected fallback evidence string");
  });

  // 6. Schema rejects invalid structure
  test("DiagnosisSchema rejects payload missing required root keys or with non-array evaluations", () => {
    const invalidPayload = {
      methodology_version: 123, // Should be string
      evaluations: "not an array"
    };
    const parsed = DiagnosisSchema.safeParse(invalidPayload);
    if (parsed.success) throw new Error("Expected schema validation to fail for malformed payload");
  });

  return { passed, failed, tests: logs };
}
