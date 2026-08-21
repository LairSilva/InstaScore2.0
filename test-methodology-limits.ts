import { calculateScoring, CRITERIA, EvaluationItem, CATEGORIES } from "./src/config/methodology";
import { GrowthEngine } from "./src/core/GrowthEngine";
import { createDefaultDigitalTwin } from "./src/core/DigitalTwin";

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, message: string) {
  totalTests++;
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    throw new Error(`Test failed: ${message}`);
  }
  passedTests++;
  console.log(`✅ PASS: ${message}`);
}

async function runMethodologyLimitTests() {
  console.log("\n=========================================");
  console.log("🧪 TESTING SCORE, TARGET SCORE & CATEGORY LIMITS");
  console.log("=========================================\n");

  // 1. Test Extreme Case: Perfect Score (All grades = 4)
  console.log("--- 1. Testing Maximum Boundaries (All grades = 4) ---");
  const maxEvaluations: EvaluationItem[] = CRITERIA.map(c => ({
    criterion_id: c.id,
    grade: 4,
    confidence: 1.0,
    evidence: "Exemplo perfeito",
    justification: "Atende perfeitamente"
  }));

  const maxResult = calculateScoring(maxEvaluations);
  assert(maxResult.score !== null && maxResult.score === 100, `Max score must equal exactly 100 (got ${maxResult.score})`);
  assert(maxResult.targetScore !== null && maxResult.targetScore === 100, `Max targetScore must equal 100 (got ${maxResult.targetScore})`);
  assert(maxResult.score <= 100, "Score must not exceed 100");
  assert(maxResult.targetScore <= 100, "Target score must not exceed 100");

  for (const catKey of Object.keys(CATEGORIES)) {
    const cat = maxResult.categories[catKey];
    assert(cat !== undefined, `Category ${catKey} must exist`);
    assert(cat.percentage <= 100 && cat.percentage >= 0, `Category ${catKey} percentage must be between 0 and 100 (got ${cat.percentage})`);
    assert(cat.score <= cat.maxPoints && cat.score >= 0, `Category ${catKey} score must be <= maxPoints (${cat.score}/${cat.maxPoints})`);
  }

  // 2. Test Extreme Case: Minimum Score (All grades = 0)
  console.log("\n--- 2. Testing Minimum Boundaries (All grades = 0) ---");
  const minEvaluations: EvaluationItem[] = CRITERIA.map(c => ({
    criterion_id: c.id,
    grade: 0,
    confidence: 1.0,
    evidence: "Ausente",
    justification: "Não atende"
  }));

  const minResult = calculateScoring(minEvaluations);
  assert(minResult.score !== null && minResult.score === 0, `Min score must equal 0 (got ${minResult.score})`);
  assert(minResult.targetScore !== null && minResult.targetScore >= minResult.score, `Target score must be >= score (got ${minResult.targetScore})`);
  assert(minResult.targetScore <= 100, `Min targetScore must be <= 100 (got ${minResult.targetScore})`);

  for (const catKey of Object.keys(CATEGORIES)) {
    const cat = minResult.categories[catKey];
    assert(cat.percentage === 0, `Category ${catKey} percentage must be 0 for all 0 grades (got ${cat.percentage})`);
    assert(cat.score === 0, `Category ${catKey} score must be 0 (got ${cat.score})`);
  }

  // 3. Test Random & Partial Combinations for Invariant Violations
  console.log("\n--- 3. Testing 100 Random Grade Distributions ---");
  for (let i = 0; i < 100; i++) {
    const randomEvaluations: EvaluationItem[] = CRITERIA.map(c => ({
      criterion_id: c.id,
      grade: Math.floor(Math.random() * 5), // 0, 1, 2, 3, 4
      confidence: Math.random(),
      evidence: "Test evidence",
      justification: "Test reasoning"
    }));

    const res = calculateScoring(randomEvaluations);
    if (res.score !== null) {
      assert(res.score >= 0 && res.score <= 100, `Random test #${i}: score ${res.score} must be within [0, 100]`);
      if (res.targetScore !== null) {
        assert(res.targetScore >= res.score && res.targetScore <= 100, `Random test #${i}: targetScore ${res.targetScore} must be >= score (${res.score}) and <= 100`);
      }
      for (const catKey of Object.keys(CATEGORIES)) {
        const cat = res.categories[catKey];
        assert(cat.score >= 0 && cat.score <= cat.maxPoints, `Random test #${i}: category ${catKey} score (${cat.score}) must be <= ${cat.maxPoints}`);
        assert(cat.percentage >= 0 && cat.percentage <= 100, `Random test #${i}: category ${catKey} percentage (${cat.percentage}) must be <= 100`);
      }
    }
  }

  // 4. Test GrowthEngine Limit Safety
  console.log("\n--- 4. Testing GrowthEngine Score Limits ---");
  const testBaseScores = [-50, 0, 10, 45, 64, 85, 100, 150];

  for (const base of testBaseScores) {
    const scores = GrowthEngine.bootstrapScores(base);
    assert(scores.overallScore >= 0 && scores.overallScore <= 100, `GrowthEngine overallScore (${scores.overallScore}) for base ${base} must be in [0, 100]`);
    assert(scores.executionScore >= 0 && scores.executionScore <= 100, `GrowthEngine executionScore (${scores.executionScore}) must be in [0, 100]`);
    assert(scores.consistencyScore >= 0 && scores.consistencyScore <= 100, `GrowthEngine consistencyScore (${scores.consistencyScore}) must be in [0, 100]`);
    assert(scores.momentumScore >= 0 && scores.momentumScore <= 100, `GrowthEngine momentumScore (${scores.momentumScore}) must be in [0, 100]`);
    assert(scores.authorityVelocity >= 0 && scores.authorityVelocity <= 100, `GrowthEngine authorityVelocity (${scores.authorityVelocity}) must be in [0, 100]`);
    assert(scores.growthVelocity >= 0 && scores.growthVelocity <= 100, `GrowthEngine growthVelocity (${scores.growthVelocity}) must be in [0, 100]`);
    assert(scores.conversionVelocity >= 0 && scores.conversionVelocity <= 100, `GrowthEngine conversionVelocity (${scores.conversionVelocity}) must be in [0, 100]`);
    assert(scores.learningScore >= 0 && scores.learningScore <= 100, `GrowthEngine learningScore (${scores.learningScore}) must be in [0, 100]`);
  }

  // 5. Test DigitalTwin Bounded Default Creation
  console.log("\n--- 5. Testing DigitalTwin Initialization Limits ---");
  const mockDiagnosis = {
    scoring: {
      score: 120, // out of bounds input
      categories: {
        authority: { percentage: 110 },
        seo: { percentage: -10 },
        conversion: { percentage: 95 },
        positioning: { percentage: 80 },
        content: { percentage: 70 }
      }
    }
  };
  const twin = createDefaultDigitalTwin(mockDiagnosis);
  assert(twin.metrics.overallScore <= 100, `DigitalTwin overallScore clamped to <= 100 (got ${twin.metrics.overallScore})`);
  assert(twin.metrics.growthVelocity >= 0, `DigitalTwin growthVelocity clamped to >= 0 (got ${twin.metrics.growthVelocity})`);
  assert(twin.historyData.conversionRate >= 0 && twin.historyData.conversionRate <= 100, `ConversionRate must be valid percentage (got ${twin.historyData.conversionRate})`);

  console.log(`\n🎉 ALL ${passedTests}/${totalTests} METHODOLOGY AND LIMIT TESTS PASSED SUCCESSFULLY!`);
}

runMethodologyLimitTests().catch(err => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
