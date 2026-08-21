export interface Criterion {
  id: string;
  category: string;
  weight: number;
  question: string;
}

export interface CategoryInfo {
  id: string;
  name: string;
  maxPoints: number;
}

export const CATEGORIES: Record<string, CategoryInfo> = {
  positioning: { id: "positioning", name: "Posicionamento e Clareza", maxPoints: 25 },
  seo: { id: "seo", name: "Descoberta, Nome e SEO", maxPoints: 15 },
  conversion: { id: "conversion", name: "Oferta, CTA e Conversão", maxPoints: 20 },
  content: { id: "content", name: "Estratégia de Conteúdo", maxPoints: 25 },
  authority: { id: "authority", name: "Autoridade e Confiança", maxPoints: 15 },
};

export const CRITERIA: Criterion[] = [
  // CATEGORY 1: POSITIONING (25 Points)
  { id: "positioning.offer_clarity", category: "positioning", weight: 7, question: "É possível entender rapidamente o que o perfil oferece?" },
  { id: "positioning.audience_clarity", category: "positioning", weight: 5, question: "Está claro para quem o produto, serviço ou conteúdo é destinado?" },
  { id: "positioning.value_proposition", category: "positioning", weight: 5, question: "Existe uma proposta de valor ou diferencial perceptível?" },
  { id: "positioning.goal_alignment", category: "positioning", weight: 4, question: "O perfil está alinhado ao objetivo declarado pelo usuário?" },
  { id: "positioning.profile_feed_coherence", category: "positioning", weight: 4, question: "Bio, destaques e feed comunicam um posicionamento coerente?" },

  // CATEGORY 2: SEO (15 Points)
  { id: "seo.name_keyword", category: "seo", weight: 4, question: "O campo de nome utiliza uma palavra relevante para busca e descoberta?" },
  { id: "seo.username_clarity", category: "seo", weight: 2, question: "O nome de usuário é legível e facilmente associado à pessoa ou negócio?" },
  { id: "seo.bio_keywords", category: "seo", weight: 4, question: "A bio contém termos que explicam claramente a área de atuação?" },
  { id: "seo.location_category", category: "seo", weight: 2, question: "Localização ou categoria são utilizadas quando relevantes para o negócio?" },
  { id: "seo.link_clarity", category: "seo", weight: 3, question: "O link e seu destino são claros e coerentes com o objetivo do perfil?" },

  // CATEGORY 3: CONVERSION (20 Points)
  { id: "conversion.explicit_cta", category: "conversion", weight: 6, question: "Existe uma chamada para ação explícita e compreensível?" },
  { id: "conversion.offer_visibility", category: "conversion", weight: 5, question: "Está claro o que o usuário pode comprar, contratar, solicitar ou fazer?" },
  { id: "conversion.link_path", category: "conversion", weight: 3, question: "Existe um caminho claro entre interesse e contato ou conversão?" },
  { id: "conversion.highlights_journey", category: "conversion", weight: 3, question: "Os destaques ajudam o visitante a conhecer, confiar e agir?" },
  { id: "conversion.friction", category: "conversion", weight: 3, question: "O próximo passo é simples ou existem obstáculos e ambiguidades?" },

  // CATEGORY 4: CONTENT (25 Points)
  { id: "content.thematic_coherence", category: "content", weight: 5, question: "As publicações seguem temas coerentes com o posicionamento?" },
  { id: "content.format_variety", category: "content", weight: 4, question: "Existe variedade estratégica de formatos e abordagens visíveis?" },
  { id: "content.educational_value", category: "content", weight: 5, question: "O conteúdo entrega conhecimento, orientação ou utilidade real?" },
  { id: "content.authority_proof", category: "content", weight: 4, question: "O conteúdo demonstra experiência, resultados, bastidores ou provas?" },
  { id: "content.goal_support", category: "content", weight: 5, question: "As publicações contribuem para o objetivo declarado pelo usuário?" },
  { id: "content.visual_readability", category: "content", weight: 2, question: "Os conteúdos são visualmente compreensíveis, legíveis e organizados?" },

  // CATEGORY 5: AUTHORITY (15 Points)
  { id: "authority.social_proof", category: "authority", weight: 4, question: "Existem provas sociais, depoimentos, resultados ou demonstrações reais?" },
  { id: "authority.humanization", category: "authority", weight: 3, question: "É possível identificar pessoas, equipe, história ou contexto humano?" },
  { id: "authority.professional_presentation", category: "authority", weight: 3, question: "O perfil apresenta aparência confiável e profissional para seu nicho?" },
  { id: "authority.expertise_evidence", category: "authority", weight: 3, question: "Existem sinais claros de conhecimento, experiência ou competência?" },
  { id: "authority.information_consistency", category: "authority", weight: 2, question: "As informações do perfil são coerentes e não se contradizem?" },
];

/**
 * Maps the user's strategic objective to key criteria IDs that should be boosted in relevance.
 */
export const OBJECTIVE_RELEVANCE_MAP: Record<string, string[]> = {
  "Vender produtos": [
    "conversion.offer_visibility",
    "conversion.explicit_cta",
    "conversion.link_path",
    "positioning.offer_clarity"
  ],
  "Vender serviços": [
    "conversion.offer_visibility",
    "conversion.explicit_cta",
    "conversion.link_path",
    "authority.expertise_evidence"
  ],
  "Gerar contatos e oportunidades": [
    "conversion.explicit_cta",
    "conversion.friction",
    "conversion.link_path"
  ],
  "Fortalecer autoridade": [
    "authority.social_proof",
    "authority.expertise_evidence",
    "content.authority_proof",
    "positioning.value_proposition"
  ],
  "Aumentar alcance e reconhecimento": [
    "seo.name_keyword",
    "seo.bio_keywords",
    "content.format_variety",
    "content.educational_value"
  ],
  "Construir comunidade": [
    "authority.humanization",
    "content.educational_value",
    "content.thematic_coherence"
  ],
};

export interface EvaluationItem {
  criterion_id: string;
  grade: number | null; // 0 to 4 or null
  confidence: number;   // 0 to 1
  evidence: string;
  justification: string;
}

export interface CategoryResult {
  categoryId: string;
  name: string;
  score: number;       // score out of maxPoints
  maxPoints: number;
  percentage: number;  // 0 to 100
  gradeAverage: number | null;
}

export interface ScoringResult {
  score: number | null; // InstaScore 0 to 100, or null if coverage < 75%
  coverage: number;     // 0 to 100
  overallConfidence: number; // 0 to 1
  categories: Record<string, CategoryResult>;
  targetScore: number | null; // target score after implementing top 5 actions
  strongestCategory?: CategoryResult | null;
  weakestCategory?: CategoryResult | null;
}

/**
 * Calculates all mathematical scores based on evaluations and user strategic objective.
 */
export function calculateScoring(
  evaluations: EvaluationItem[],
  objective?: string
): ScoringResult {
  const evalMap = new Map<string, EvaluationItem>();
  for (const ev of evaluations) {
    evalMap.set(ev.criterion_id, ev);
  }

  let totalAvailableWeight = 0;
  let totalObtainedPoints = 0;
  let confidenceSum = 0;
  let evaluatedCount = 0;

  // Track scoring per category
  const categoryWeights: Record<string, number> = {};
  const categoryObtained: Record<string, number> = {};
  const categoryGradeSum: Record<string, number> = {};
  const categoryGradeCount: Record<string, number> = {};

  for (const catId of Object.keys(CATEGORIES)) {
    categoryWeights[catId] = 0;
    categoryObtained[catId] = 0;
    categoryGradeSum[catId] = 0;
    categoryGradeCount[catId] = 0;
  }

  for (const criterion of CRITERIA) {
    const ev = evalMap.get(criterion.id);
    const grade = ev ? ev.grade : null;
    const confidence = ev ? ev.confidence : 0;

    if (grade !== null && grade !== undefined) {
      const points = criterion.weight * (grade / 4);
      totalAvailableWeight += criterion.weight;
      totalObtainedPoints += points;
      confidenceSum += confidence;
      evaluatedCount++;

      // Category tracking
      const catId = criterion.category;
      categoryWeights[catId] += criterion.weight;
      categoryObtained[catId] += points;
      categoryGradeSum[catId] += grade;
      categoryGradeCount[catId]++;
    }
  }

  const coverage = Math.round((totalAvailableWeight / 100) * 100);
  const overallConfidence = evaluatedCount > 0 ? confidenceSum / evaluatedCount : 0;

  let score: number | null = null;
  if (coverage >= 75) {
    score = Math.round((totalObtainedPoints / totalAvailableWeight) * 100);
    // Clamp score
    if (score > 100) score = 100;
    if (score < 0) score = 0;
  }

  // Build category list
  const categoryResults: Record<string, CategoryResult> = {};
  for (const [catId, catInfo] of Object.entries(CATEGORIES)) {
    const availWeight = categoryWeights[catId];
    const obtPoints = categoryObtained[catId];
    const count = categoryGradeCount[catId];

    let catScore = 0;
    let percentage = 0;
    if (availWeight > 0) {
      percentage = Math.round((obtPoints / availWeight) * 100);
      catScore = Number(((percentage / 100) * catInfo.maxPoints).toFixed(1));
    }

    categoryResults[catId] = {
      categoryId: catId,
      name: catInfo.name,
      score: catScore,
      maxPoints: catInfo.maxPoints,
      percentage,
      gradeAverage: count > 0 ? Number((categoryGradeSum[catId] / count).toFixed(2)) : null,
    };
  }

  // Calculate Target Score Simulation
  // The target score increases the grade of the top 5 priority actions by 1 point (up to 4).
  let targetScore: number | null = null;
  if (coverage >= 75 && score !== null) {
    // Sort criteria to find the top 5 priorities
    const priorities = getPrioritizedActions(evaluations, objective);
    const top5Ids = new Set(priorities.slice(0, 5).map(p => p.criterion_id));

    let simulatedObtainedPoints = 0;
    for (const criterion of CRITERIA) {
      const ev = evalMap.get(criterion.id);
      let grade = ev ? ev.grade : null;
      if (grade !== null && grade !== undefined) {
        if (top5Ids.has(criterion.id)) {
          grade = Math.min(4, grade + 1);
        }
        simulatedObtainedPoints += criterion.weight * (grade / 4);
      }
    }
    targetScore = Math.round((simulatedObtainedPoints / totalAvailableWeight) * 100);
    if (targetScore > 100) targetScore = 100;
    if (targetScore < score) targetScore = score; // target score cannot be lower than current
  }

  // Calculate strongest and weakest categories
  const catList = Object.values(categoryResults);
  let strongestCategory: CategoryResult | null = null;
  let weakestCategory: CategoryResult | null = null;
  if (catList.length > 0) {
    const sorted = [...catList].sort((a, b) => b.percentage - a.percentage);
    strongestCategory = sorted[0] || null;
    weakestCategory = sorted[sorted.length - 1] || null;
  }

  return {
    score,
    coverage,
    overallConfidence,
    categories: categoryResults,
    targetScore,
    strongestCategory,
    weakestCategory,
  };
}

export interface PrioritizedItem {
  criterion_id: string;
  priorityScore: number;
  grade: number;
  weight: number;
}

/**
 * Calculates priority score for all evaluated criteria and sorts them descending.
 */
export function getPrioritizedActions(
  evaluations: EvaluationItem[],
  objective?: string
): PrioritizedItem[] {
  const priorityList: PrioritizedItem[] = [];
  const evalMap = new Map<string, EvaluationItem>();
  for (const ev of evaluations) {
    evalMap.set(ev.criterion_id, ev);
  }

  // Map of effort values for criteria action mapping (default low if not provided, or mapping from criteria names)
  // Let's assume some common default effort levels
  // We can also extract effort from the AI's recommendations, but we want a fully deterministic fallback or complete map
  const getEffortValue = (id: string): number => {
    // low = 1, medium = 2, high = 3
    if (id.includes("cta") || id.includes("username") || id.includes("link") || id.includes("location")) {
      return 1; // Low effort
    }
    if (id.includes("clarity") || id.includes("keywords") || id.includes("friction") || id.includes("presentation")) {
      return 2; // Medium effort
    }
    return 3; // High effort (content strategy, authority, coherence)
  };

  const boostIds = objective ? (OBJECTIVE_RELEVANCE_MAP[objective] || []) : [];

  for (const criterion of CRITERIA) {
    const ev = evalMap.get(criterion.id);
    if (!ev || ev.grade === null || ev.grade === undefined) continue;

    const grade = ev.grade;
    const gap = 4 - grade;
    if (gap <= 0) continue; // No gap, no action needed

    const effort = getEffortValue(criterion.id);
    const relevance = boostIds.includes(criterion.id) ? 1.2 : 1.0;
    const confidence = ev.confidence || 0.8;

    // formula: priority_score = peso * gap * relevance * confidence / effort
    const priorityScore = (criterion.weight * gap * relevance * confidence) / effort;

    priorityList.push({
      criterion_id: criterion.id,
      priorityScore,
      grade,
      weight: criterion.weight,
    });
  }

  // Sort descending by priorityScore
  return priorityList.sort((a, b) => b.priorityScore - a.priorityScore);
}
