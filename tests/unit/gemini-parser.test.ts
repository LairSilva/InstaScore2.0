import { 
  FIXTURE_VALID_GEMINI_JSON,
  FIXTURE_MARKDOWN_WRAPPED_JSON,
  FIXTURE_GENERIC_CODEBLOCK_JSON,
  FIXTURE_INVALID_SYNTAX_JSON,
  FIXTURE_INCOMPLETE_TRUNCATED_JSON,
  extractAndParseGeminiJSON
} from "../fixtures/gemini-responses";
import { DiagnosisSchema } from "../../src/schemas/diagnosis";

export function runGeminiParserUnitTests(): { passed: number; failed: number; tests: string[] } {
  let passed = 0;
  let failed = 0;
  const logs: string[] = [];

  function test(name: string, fn: () => void) {
    try {
      fn();
      passed++;
      logs.push(`  \x1b[32m✔\x1b[0m [Unit:GeminiParser] ${name}`);
    } catch (err: any) {
      failed++;
      logs.push(`  \x1b[31m✖\x1b[0m [Unit:GeminiParser] ${name} -> ${err.message}`);
    }
  }

  // 1. Pure valid JSON
  test("extractAndParseGeminiJSON extracts and parses pure raw JSON response", () => {
    const res = extractAndParseGeminiJSON(FIXTURE_VALID_GEMINI_JSON);
    if (!res.success) throw new Error(`Parse failed: ${res.error}`);
    const zodCheck = DiagnosisSchema.safeParse(res.data);
    if (!zodCheck.success) throw new Error("Parsed data does not conform to DiagnosisSchema");
  });

  // 2. Markdown-wrapped JSON (```json ... ```)
  test("extractAndParseGeminiJSON strips ```json codeblocks cleanly", () => {
    const res = extractAndParseGeminiJSON(FIXTURE_MARKDOWN_WRAPPED_JSON);
    if (!res.success) throw new Error(`Markdown extract failed: ${res.error}`);
    if (res.data.methodology_version !== "instascore-structural-0.1-alpha") {
      throw new Error("Extracted data is corrupted");
    }
    const zodCheck = DiagnosisSchema.safeParse(res.data);
    if (!zodCheck.success) throw new Error("Parsed markdown-wrapped data failed Zod schema");
  });

  // 3. Generic codeblock wrapped JSON (``` ... ```)
  test("extractAndParseGeminiJSON strips generic ``` codeblocks cleanly", () => {
    const res = extractAndParseGeminiJSON(FIXTURE_GENERIC_CODEBLOCK_JSON);
    if (!res.success) throw new Error(`Generic codeblock extract failed: ${res.error}`);
    const zodCheck = DiagnosisSchema.safeParse(res.data);
    if (!zodCheck.success) throw new Error("Parsed generic block data failed Zod schema");
  });

  // 4. Invalid syntax JSON
  test("extractAndParseGeminiJSON fails gracefully with clear error on syntax errors", () => {
    const res = extractAndParseGeminiJSON(FIXTURE_INVALID_SYNTAX_JSON);
    if (res.success) throw new Error("Expected parser to fail for invalid syntax JSON");
    if (!res.error || !res.error.includes("Parse error")) {
      throw new Error(`Expected parse error message, got: ${res.error}`);
    }
  });

  // 5. Incomplete / Truncated JSON
  test("extractAndParseGeminiJSON fails gracefully on incomplete/truncated responses", () => {
    const res = extractAndParseGeminiJSON(FIXTURE_INCOMPLETE_TRUNCATED_JSON);
    if (res.success) throw new Error("Expected parser to fail on truncated JSON");
    if (!res.error) throw new Error("Expected error description for truncated payload");
  });

  // 6. Null or Empty String
  test("extractAndParseGeminiJSON handles empty, null or whitespace input safely", () => {
    const emptyRes = extractAndParseGeminiJSON("");
    if (emptyRes.success) throw new Error("Expected failure on empty string");

    const spacesRes = extractAndParseGeminiJSON("   \n\t  ");
    if (spacesRes.success) throw new Error("Expected failure on whitespace string");
  });

  return { passed, failed, tests: logs };
}
