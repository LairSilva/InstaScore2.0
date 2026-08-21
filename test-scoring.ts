import { calculateScoring, CRITERIA, getPrioritizedActions } from "./src/config/methodology";
import { DiagnosisSchema } from "./src/schemas/diagnosis";

/**
 * Mathematical Scoring Engine & Pipeline Validation Test Suite.
 */
function runTests() {
  console.log("==========================================");
  console.log("Iniciando testes do motor matemático & pipeline InstaScore...");
  console.log("==========================================");

  let successCount = 0;
  let failCount = 0;

  function assert(name: string, condition: boolean, message?: string) {
    if (condition) {
      console.log(`✅ [PASS] ${name}`);
      successCount++;
    } else {
      console.error(`❌ [FAIL] ${name} ${message ? "- " + message : ""}`);
      failCount++;
    }
  }

  // --- Caso 1: Todas as notas 0 devem gerar Score 0 ---
  const evaluationsAllZero = CRITERIA.map(c => ({
    criterion_id: c.id,
    grade: 0,
    confidence: 0.9,
    evidence: "Evidência zero",
    justification: "Justificativa zero"
  }));
  const resultAllZero = calculateScoring(evaluationsAllZero);
  assert("Todas as notas 0 geram Score 0", resultAllZero.score === 0, `Obtido: ${resultAllZero.score}`);
  assert("Cobertura de todas as notas 0 é 100%", resultAllZero.coverage === 100, `Obtido: ${resultAllZero.coverage}`);

  // --- Caso 2: Todas as notas 4 devem gerar Score 100 ---
  const evaluationsAllFour = CRITERIA.map(c => ({
    criterion_id: c.id,
    grade: 4,
    confidence: 0.9,
    evidence: "Evidência perfeita",
    justification: "Justificativa perfeita"
  }));
  const resultAllFour = calculateScoring(evaluationsAllFour);
  assert("Todas as notas 4 geram Score 100", resultAllFour.score === 100, `Obtido: ${resultAllFour.score}`);

  // --- Caso 3: Todas as notas 2 devem gerar aproximadamente 50 ---
  const evaluationsAllTwo = CRITERIA.map(c => ({
    criterion_id: c.id,
    grade: 2,
    confidence: 0.9,
    evidence: "Evidência média",
    justification: "Justificativa média"
  }));
  const resultAllTwo = calculateScoring(evaluationsAllTwo);
  assert("Todas as notas 2 geram Score em torno de 50", resultAllTwo.score === 50, `Obtido: ${resultAllTwo.score}`);

  // --- Caso 4: Critérios null devem reduzir cobertura ---
  const evaluationsWithNull = CRITERIA.map(c => ({
    criterion_id: c.id,
    grade: c.category === "positioning" ? null : 2,
    confidence: 0.9,
    evidence: "Evidência parcial",
    justification: "Justificativa parcial"
  }));
  const resultWithNull = calculateScoring(evaluationsWithNull);
  assert("Critérios null reduzem a cobertura", resultWithNull.coverage === 75, `Obtido: ${resultWithNull.coverage}`);
  assert("Score ainda é calculado quando cobertura é >= 75%", resultWithNull.score !== null, "Score foi nulo!");

  // --- Caso 5: Cobertura abaixo de 75% deve bloquear o Score definitivo ---
  const evaluationsLowCoverage = CRITERIA.map(c => ({
    criterion_id: c.id,
    grade: (c.category === "positioning" || c.category === "seo") ? null : 2,
    confidence: 0.9,
    evidence: "Evidência baixa cobertura",
    justification: "Justificativa baixa cobertura"
  }));
  const resultLowCoverage = calculateScoring(evaluationsLowCoverage);
  assert("Cobertura de 60% é calculada corretamente", resultLowCoverage.coverage === 60, `Obtido: ${resultLowCoverage.coverage}`);
  assert("Score definitivo é bloqueado se cobertura < 75%", resultLowCoverage.score === null, `Obtido: ${resultLowCoverage.score}`);

  // --- Caso 6: Soma de maxPoints de todas as categorias deve ser exatamente 100 ---
  const totalCategoryMaxPoints = Object.values(resultAllFour.categories).reduce((acc, cat) => acc + cat.maxPoints, 0);
  assert("Soma das pontuações máximas das categorias é 100", totalCategoryMaxPoints === 100, `Obtido: ${totalCategoryMaxPoints}`);

  // --- Caso 7: getPrioritizedActions ordena por maior impacto (gap * peso) ---
  const prioritized = getPrioritizedActions(evaluationsAllZero, "Vender produtos / serviços");
  assert("Priorização retorna lista de ações", prioritized.length > 0, "Lista vazia");
  assert("Primeira ação tem maior prioridade", prioritized[0].priorityScore >= prioritized[prioritized.length - 1].priorityScore, "Ordem incorreta");

  // --- Caso 8: Zod Schema valida e sanitiza payload complexo de IA com resiliência ---
  const rawAiPayload = {
    methodology_version: "instascore-structural-0.1-alpha",
    analysis_type: "structural",
    metadata: {
      is_data_sufficient: "true",
      missing_elements: [],
      overall_confidence: 92 // Scale 0-100 normalized to 0.92
    },
    evaluations: evaluationsAllFour,
    strengths: [
      { criterion_id: "pos_clarity", title: "Clareza", reason: "Excelente clareza" },
      { criterion_id: "pos_niche", title: "Nicho", reason: "Nicho definido" },
      { criterion_id: "vis_palette", title: "Cores", reason: "Cores consistentes" },
      { criterion_id: "vis_quality", title: "Excedente", reason: "Item 4 deve ser fatiado" } // 4th item should be sliced
    ],
    critical_gaps: [
      { criterion_id: "cta_clarity", title: "CTA Fraco", reason: "Falta direcionamento", impact: "Menos conversões" }
    ],
    recommended_actions: [
      { criterion_id: "cta_clarity", title: "Ajustar CTA", instruction: "Adicionar link direto", effort: "baixo", expected_effect: "Mais cliques" }
    ],
    tomorrow_action: {
      criterion_id: "cta_clarity",
      title: "Ajustar link na bio",
      instruction: "Trocar o link da bio por um link direto para o WhatsApp"
    },
    disclaimer: "Auditoria baseada em evidências."
  };

  const parseResult = DiagnosisSchema.safeParse(rawAiPayload);
  assert("Zod Schema aprova payload simulado", parseResult.success, parseResult.success ? "" : JSON.stringify(parseResult.error.issues));
  if (parseResult.success) {
    assert("Strengths é limitado a no máximo 3 itens", parseResult.data.strengths.length <= 3, `Obtido: ${parseResult.data.strengths.length}`);
    assert("Confidence é normalizado para escala 0 a 1", parseResult.data.metadata.overall_confidence <= 1, `Obtido: ${parseResult.data.metadata.overall_confidence}`);
    assert("Effort 'baixo' é normalizado para 'low'", parseResult.data.recommended_actions[0].effort === "low", `Obtido: ${parseResult.data.recommended_actions[0].effort}`);
  }

  console.log("==========================================");
  console.log(`Testes finalizados: ${successCount} PASS, ${failCount} FAIL`);
  console.log("==========================================");

  if (failCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();

