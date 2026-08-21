import { calculateScoring, getPrioritizedActions, CRITERIA, CATEGORIES } from "./src/config/methodology";
import { DiagnosisSchema } from "./src/schemas/diagnosis";
import { generateStartModeStrategy } from "./src/engine/start-mode-generator";

let totalPassed = 0;
let totalFailed = 0;

function assert(description: string, condition: boolean, details: string = "") {
  if (condition) {
    console.log(`✅ [PASS] ${description}`);
    totalPassed++;
  } else {
    console.error(`❌ [FAIL] ${description} ${details}`);
    totalFailed++;
  }
}

console.log("==========================================");
console.log("INICIANDO HOMOLOGAÇÃO REAL PROTOCOLO V10");
console.log("==========================================\n");

// --- 1. TESTE DO MATH ENGINE ---
console.log("--- 1. Testando Math Engine ---");

// Test Grade 0
const evalZeros = CRITERIA.map(c => ({
  criterion_id: c.id,
  grade: 0,
  confidence: 0.9,
  evidence: "Evidência zero",
  justification: "Justificativa zero"
}));
const resZero = calculateScoring(evalZeros);
assert("Todas as notas 0 produzem Score 0", resZero.score === 0, `Obtido: ${resZero.score}`);
assert("Cobertura de notas 0 é 100%", resZero.coverage === 100, `Obtido: ${resZero.coverage}%`);

// Test Grade 4
const evalFours = CRITERIA.map(c => ({
  criterion_id: c.id,
  grade: 4,
  confidence: 1.0,
  evidence: "Evidência máxima",
  justification: "Justificativa máxima"
}));
const resFour = calculateScoring(evalFours);
assert("Todas as notas 4 produzem Score 100", resFour.score === 100, `Obtido: ${resFour.score}`);

// Test Grade 2 (Average 50)
const evalTwos = CRITERIA.map(c => ({
  criterion_id: c.id,
  grade: 2,
  confidence: 0.8,
  evidence: "Evidência média",
  justification: "Justificativa média"
}));
const resTwo = calculateScoring(evalTwos);
assert("Todas as notas 2 produzem Score 50", resTwo.score === 50, `Obtido: ${resTwo.score}`);

// Test Coverage Limit (< 75%)
const evalPartial = CRITERIA.slice(0, 10).map(c => ({
  criterion_id: c.id,
  grade: 3,
  confidence: 0.9,
  evidence: "Evidência parcial",
  justification: "Justificativa parcial"
}));
const resPartial = calculateScoring(evalPartial);
assert("Cobertura < 75% bloqueia Score definitivo (retorna null)", resPartial.score === null, `Obtido: ${resPartial.score}`);

// Sum of Max Points
const totalMax = Object.values(resFour.categories).reduce((acc, cat) => acc + cat.maxPoints, 0);
assert("Soma das pontuações máximas das categorias é exatamente 100", totalMax === 100, `Obtido: ${totalMax}`);


// --- 2. TESTE DE PRIORIDADE MATEMÁTICA ---
console.log("\n--- 2. Testando Motor de Priorização Tática ---");
const prioritized = getPrioritizedActions(evalTwos, "Vender produtos");
assert("Prioridades geradas com sucesso", prioritized.length > 0);
assert("Maior prioridade vem em primeiro lugar no array", prioritized[0].priorityScore >= prioritized[prioritized.length - 1].priorityScore);


// --- 3. TESTE DE VALIDAÇÃO DE SCHEMA E ANTI-ALUCINAÇÃO ---
console.log("\n--- 3. Testando Schema Zod de Diagnóstico ---");
const mockValidDiagnosis = {
  methodology_version: "instascore-structural-0.1-alpha",
  analysis_type: "structural",
  metadata: {
    is_data_sufficient: true,
    missing_elements: [],
    overall_confidence: 0.95
  },
  evaluations: evalFours,
  strengths: [
    { criterion_id: "positioning.offer_clarity", title: "Oferta Clara", reason: "Bio muito explícita" }
  ],
  critical_gaps: [
    { criterion_id: "conversion.explicit_cta", title: "Falta CTA", reason: "Sem link", impact: "Perda de clientes" }
  ],
  recommended_actions: [
    { criterion_id: "conversion.explicit_cta", title: "Adicionar CTA", instruction: "Colocar link na bio", effort: "low", expected_effect: "Aumento de cliques" }
  ],
  tomorrow_action: {
    criterion_id: "conversion.explicit_cta",
    title: "Adicionar CTA",
    instruction: "Colocar link na bio"
  },
  disclaimer: "Diagnóstico baseado em evidências visuais."
};

const parseResult = DiagnosisSchema.safeParse(mockValidDiagnosis);
assert("DiagnosisSchema valida payload de estrutura correta", parseResult.success);

const invalidDiagnosis = { ...mockValidDiagnosis, methodology_version: "wrong-version" };
const parseInvalid = DiagnosisSchema.safeParse(invalidDiagnosis);
assert("DiagnosisSchema rejeita versão de metodologia incorreta", !parseInvalid.success);


// --- 4. TESTE DO MODO START ---
console.log("\n--- 4. Testando Gerador do Modo Start ---");
const startInput = {
  projectIdea: "Consultoria de Finanças Pessoais para Jovens Adultos",
  objective: "Vender consultorias e ebooks de organização financeira",
  targetAudience: "Jovens de 22 a 32 anos no início da carreira"
};

const startResult = generateStartModeStrategy(startInput);
assert("Modo Start calcula StartScore", typeof startResult.startScore === "number" && startResult.startScore > 0);
assert("Modo Start gera 20 sugestões de nome", startResult.nameSuggestions.length === 20);
assert("Modo Start gera 5 opções de bio", startResult.bioOptions.length === 5);
assert("Modo Start gera 10 primeiros posts", startResult.first10Posts.length === 10);
assert("Modo Start gera calendário de 30 dias", startResult.calendar30Days.length === 30);


console.log("\n==========================================");
console.log(`RESULTADO DA HOMOLOGAÇÃO: ${totalPassed} PASS, ${totalFailed} FAIL`);
console.log("==========================================");

if (totalFailed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
