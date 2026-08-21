import { 
  calculateScoring, 
  getPrioritizedActions, 
  CRITERIA, 
  CATEGORIES, 
  EvaluationItem 
} from "../../src/config/methodology";

export function runMethodologyUnitTests(): { passed: number; failed: number; tests: string[] } {
  let passed = 0;
  let failed = 0;
  const logs: string[] = [];

  function test(name: string, fn: () => void) {
    try {
      fn();
      passed++;
      logs.push(`  \x1b[32m✔\x1b[0m [Unit:Methodology] ${name}`);
    } catch (err: any) {
      failed++;
      logs.push(`  \x1b[31m✖\x1b[0m [Unit:Methodology] ${name} -> ${err.message}`);
    }
  }

  // 1. calculateScoring with 100% coverage and maximum grades
  test("calculateScoring computes deterministic 100/100 score when all grades are 4", () => {
    const perfectEvals: EvaluationItem[] = CRITERIA.map(c => ({
      criterion_id: c.id,
      grade: 4,
      confidence: 1.0,
      evidence: "Evidência perfeita",
      justification: "Critério atendido com excelência"
    }));

    const result = calculateScoring(perfectEvals);
    if (result.score !== 100) throw new Error(`Expected score 100, got ${result.score}`);
    if (result.coverage !== 100) throw new Error(`Expected coverage 100%, got ${result.coverage}%`);
    if (result.overallConfidence !== 1.0) throw new Error(`Expected confidence 1.0, got ${result.overallConfidence}`);
    if (!result.strongestCategory) throw new Error("strongestCategory should not be null");
    if (result.strongestCategory.percentage !== 100) throw new Error(`Expected strongest percentage 100, got ${result.strongestCategory.percentage}`);
  });

  // 2. calculateScoring with 0 grades
  test("calculateScoring computes 0/100 score when all grades are 0", () => {
    const zeroEvals: EvaluationItem[] = CRITERIA.map(c => ({
      criterion_id: c.id,
      grade: 0,
      confidence: 0.9,
      evidence: "Ausência total",
      justification: "Elemento inexistente"
    }));

    const result = calculateScoring(zeroEvals);
    if (result.score !== 0) throw new Error(`Expected score 0, got ${result.score}`);
    if (result.coverage !== 100) throw new Error(`Expected coverage 100%, got ${result.coverage}%`);
  });

  // 3. calculateScoring under 75% coverage rule (must return null score)
  test("calculateScoring returns null score when data coverage is under 75%", () => {
    // Only 2 criteria evaluated (coverage ~ 9%)
    const insufficientEvals: EvaluationItem[] = [
      { criterion_id: CRITERIA[0].id, grade: 3, confidence: 0.9, evidence: "x", justification: "y" },
      { criterion_id: CRITERIA[1].id, grade: 3, confidence: 0.9, evidence: "x", justification: "y" }
    ];

    const result = calculateScoring(insufficientEvals);
    if (result.score !== null) throw new Error(`Expected null score for coverage < 75%, got ${result.score}`);
    if (result.coverage >= 75) throw new Error(`Expected coverage < 75%, got ${result.coverage}%`);
  });

  // 4. calculateScoring category percentages and weight calculations
  test("calculateScoring accurately maps all categories defined in C.A.G.E.", () => {
    const evals: EvaluationItem[] = CRITERIA.map((c, i) => ({
      criterion_id: c.id,
      grade: (i % 3) + 1, // 1 to 3
      confidence: 0.85,
      evidence: "Evidência de teste",
      justification: "Justificativa de teste"
    }));

    const result = calculateScoring(evals);
    for (const catId of Object.keys(CATEGORIES)) {
      if (!result.categories[catId]) {
        throw new Error(`Missing category ${catId} in calculateScoring output`);
      }
      const cat = result.categories[catId];
      if (cat.percentage < 0 || cat.percentage > 100) {
        throw new Error(`Category ${catId} percentage out of bounds: ${cat.percentage}`);
      }
    }
  });

  // 5. Target Score simulation
  test("calculateScoring targetScore simulation predicts improved score after top 5 actions", () => {
    const evals: EvaluationItem[] = CRITERIA.map(c => ({
      criterion_id: c.id,
      grade: 2, // 50%
      confidence: 0.9,
      evidence: "Evidência mediana",
      justification: "Justificativa mediana"
    }));

    const result = calculateScoring(evals, "Vender serviços");
    if (result.score === null) throw new Error("Expected valid score");
    if (result.targetScore === null) throw new Error("Expected targetScore to be computed");
    if (result.targetScore <= result.score) {
      throw new Error(`Target score (${result.targetScore}) should be strictly greater than baseline score (${result.score})`);
    }
  });

  // 6. getPrioritizedActions prioritization logic
  test("getPrioritizedActions ranks items with lowest grades and highest weights at top priority", () => {
    const evals: EvaluationItem[] = CRITERIA.map(c => ({
      criterion_id: c.id,
      grade: 3,
      confidence: 0.9,
      evidence: "Evidência",
      justification: "Justificativa"
    }));

    // Make positioning.offer_clarity critically low (grade 0, high weight)
    const offerIdx = evals.findIndex(e => e.criterion_id === "positioning.offer_clarity");
    if (offerIdx !== -1) {
      evals[offerIdx].grade = 0;
    }

    const priorities = getPrioritizedActions(evals, "Vender serviços");
    if (priorities.length === 0) throw new Error("Expected non-empty priorities list");
    if (priorities[0].criterion_id !== "positioning.offer_clarity") {
      throw new Error(`Expected first priority to be positioning.offer_clarity, got ${priorities[0].criterion_id}`);
    }
  });

  return { passed, failed, tests: logs };
}
