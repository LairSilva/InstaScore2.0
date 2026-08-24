import { ContentDNA, ContentDNAPillar, CageScores, CagePillarId } from "../../types/content-engine";
import { ProfileDNA } from "../../types/strategic-brain";
import { StartModeResult } from "../../types/start-mode";
import { DigitalTwin } from "../../core/DigitalTwin";

export interface BuildContentDNAOptions {
  diagnosisResult?: any | null;
  startModeResult?: StartModeResult | null;
  profileDNA?: ProfileDNA | null;
  digitalTwin?: DigitalTwin | null;
  customGoal?: string;
  nicheOverride?: string;
  handleOverride?: string;
}

/**
 * 1. buildContentDNA()
 * Deterministic, unified aggregation function that extracts and harmonizes all strategic user context.
 * Guarantees that content generation is NEVER generic when user diagnostic data exists.
 */
export function buildContentDNA(options: BuildContentDNAOptions): ContentDNA {
  const { diagnosisResult, startModeResult, profileDNA, digitalTwin, customGoal, nicheOverride, handleOverride } = options;

  let source: "diagnostic" | "start_mode" | "manual" = "manual";
  if (diagnosisResult && diagnosisResult.scoring) {
    source = "diagnostic";
  } else if (startModeResult) {
    source = "start_mode";
  }

  // 1. Extract Niche, Handle and Audience
  const handle = 
    handleOverride ||
    diagnosisResult?.diagnosis?.intelligence?.niche_context?.handle ||
    profileDNA?.username ||
    digitalTwin?.handle ||
    "seu_perfil";

  const niche = 
    nicheOverride ||
    diagnosisResult?.diagnosis?.intelligence?.niche_context?.niche ||
    startModeResult?.territory?.mainNiche ||
    profileDNA?.niche ||
    digitalTwin?.identity?.niche ||
    "Marketing e Negócios Digitais";

  const targetAudience = 
    startModeResult?.territory?.targetAudience ||
    profileDNA?.target_audience ||
    digitalTwin?.identity?.targetAudience ||
    diagnosisResult?.diagnosis?.intelligence?.niche_context?.target_audience ||
    "Profissionais e compradores interessados em resultados práticos";

  const positioning = 
    profileDNA?.positioning ||
    startModeResult?.positioning?.statement ||
    profileDNA?.unique_value_proposition ||
    "Autoridade prática orientada a soluções e resultados concretos";

  const primaryGoal = 
    customGoal ||
    profileDNA?.primary_goal ||
    startModeResult?.projectInput?.objective ||
    digitalTwin?.identity?.objectives?.[0] ||
    "Aumentar autoridade e gerar conversões consistentes";

  const toneOfVoice = 
    profileDNA?.tone_of_voice ||
    digitalTwin?.identity?.toneOfVoice ||
    "Estratégico, direto, assertivo e sem clichês";

  // 2. Extract C.A.G.E. Scores
  let cageScores: CageScores = {
    conversion: 50,
    authority: 50,
    growth: 50,
    expression: 50
  };

  if (diagnosisResult?.scoring?.categories) {
    const cats = diagnosisResult.scoring.categories;
    cageScores = {
      conversion: Math.round(cats.conversion?.percentage ?? (cats.conversion?.score ? cats.conversion.score * 4 : 50)),
      authority: Math.round(cats.authority?.percentage ?? (cats.authority?.score ? cats.authority.score * 4 : 50)),
      growth: Math.round(cats.seo?.percentage ?? (cats.seo?.score ? cats.seo.score * 4 : 50)),
      expression: Math.round(cats.content?.percentage ?? (cats.content?.score ? cats.content.score * 4 : 50))
    };
  } else if (startModeResult?.cageScores) {
    cageScores = {
      conversion: startModeResult.cageScores.conversion,
      authority: startModeResult.cageScores.authority,
      growth: startModeResult.cageScores.growth,
      expression: startModeResult.cageScores.expression
    };
  }

  // 3. Identify Strengths, Weaknesses and Bottlenecks
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const strategicPriorities: string[] = [];

  const scoreMap: { pillar: CagePillarId; score: number; label: string }[] = [
    { pillar: "conversion", score: cageScores.conversion, label: "Conversão & Oferta" },
    { pillar: "authority", score: cageScores.authority, label: "Autoridade & Prova" },
    { pillar: "growth", score: cageScores.growth, label: "Descoberta & Crescimento" },
    { pillar: "expression", score: cageScores.expression, label: "Expressão & Conteúdo" }
  ];

  // Sort by score ascending to identify worst bottleneck
  scoreMap.sort((a, b) => a.score - b.score);
  const worstPillar = scoreMap[0];
  const bestPillar = scoreMap[scoreMap.length - 1];

  if (bestPillar.score >= 60) {
    strengths.push(`${bestPillar.label} estruturada (${bestPillar.score}/100)`);
  } else {
    strengths.push("Potencial de expansão em diferenciação de nicho");
  }

  if (worstPillar.score < 60) {
    weaknesses.push(`${worstPillar.label} com gargalo crítico (${worstPillar.score}/100)`);
    strategicPriorities.push(`Elevar urgência e eficiência em ${worstPillar.label}`);
  }

  // Check specific evaluations from C.A.G.E.
  if (diagnosisResult?.diagnosis?.evaluations) {
    for (const ev of diagnosisResult.diagnosis.evaluations) {
      if (ev.score <= 2 && ev.gap) {
        if (weaknesses.length < 4) weaknesses.push(ev.gap);
      }
    }
  }

  if (strategicPriorities.length === 0) {
    strategicPriorities.push("Construir ganchos visuais e falados de alta retenção nos primeiros 3 segundos");
    strategicPriorities.push("Estruturar CTAs diretas para Direct e quebra de objeções");
  }

  // 4. Derive Content Pillars
  const contentPillars: ContentDNAPillar[] = [];

  if (profileDNA?.content_pillars && profileDNA.content_pillars.length > 0) {
    profileDNA.content_pillars.forEach((p, idx) => {
      let pillarCat: CagePillarId = "authority";
      if (p.objective.toLowerCase().includes("venda") || p.objective.toLowerCase().includes("conversão")) pillarCat = "conversion";
      else if (p.objective.toLowerCase().includes("descoberta") || p.objective.toLowerCase().includes("crescimento")) pillarCat = "growth";
      else if (p.objective.toLowerCase().includes("relacionamento") || p.objective.toLowerCase().includes("conteúdo")) pillarCat = "expression";

      contentPillars.push({
        id: p.id || `pillar_${idx + 1}`,
        name: p.name,
        objective: p.objective,
        cagePillar: pillarCat,
        topics: p.example_topics || [p.pain_or_problem, p.desire],
        targetAudience: p.target_audience
      });
    });
  } else if (startModeResult?.pillars && startModeResult.pillars.length > 0) {
    startModeResult.pillars.forEach((p, idx) => {
      let pillarCat: CagePillarId = "authority";
      if (p.funnelStage === "Conversão") pillarCat = "conversion";
      else if (p.funnelStage === "Descoberta") pillarCat = "growth";
      else if (p.funnelStage === "Relacionamento") pillarCat = "expression";

      contentPillars.push({
        id: `start_pillar_${idx + 1}`,
        name: p.name,
        objective: p.goal,
        cagePillar: pillarCat,
        topics: p.examples || []
      });
    });
  } else {
    // Default pillars mapped to C.A.G.E.
    contentPillars.push(
      {
        id: "p_auth",
        name: "Autoridade Técnica & Método",
        objective: "Demonstrar domínio prático e quebrar mitos comuns",
        cagePillar: "authority",
        topics: ["Como aplicar o método no dia a dia", "Erros ocultos que atrasam resultados", "Estudos de caso reais"]
      },
      {
        id: "p_conv",
        name: "Conversão & Oferta",
        objective: "Explicar a oferta, quebrar objeções e direcionar para o Direct",
        cagePillar: "conversion",
        topics: ["Como funciona o acompanhamento/serviço", "Por que adiar a decisão custa mais caro", "Depoimentos e prova social"]
      },
      {
        id: "p_grow",
        name: "Descoberta & Atração",
        objective: "Atrair novos seguidores qualificados com ganchos anti-senso comum",
        cagePillar: "growth",
        topics: ["A verdade sobre o nicho que ninguém te conta", "3 sinais de que você está no caminho errado", "Tutorial direto ao ponto"]
      },
      {
        id: "p_expr",
        name: "Expressão & Conexão",
        objective: "Valores, bastidores e posicionamento opinativo",
        cagePillar: "expression",
        topics: ["Por que parei de seguir a manada", "Bastidores da nossa rotina", "Lições que aprendi na prática"]
      }
    );
  }

  // 5. Dynamic Subtext & Bottleneck Rationale
  let bottleneckSummary = "Seu perfil está equilibrado, pronto para aceleração em todos os formatos.";
  let opportunityHeadline = "Criamos ideias orientadas a transformar visitantes em seguidores e compradores.";

  if (worstPillar.pillar === "conversion") {
    bottleneckSummary = `Seu maior gargalo atual é Conversão (${worstPillar.score}/100). Visitantes chegam, mas não entendem como comprar.`;
    opportunityHeadline = "Foco estratégico: conteúdos de quebra de objeções, demonstração de oferta e CTAs diretos para o Direct.";
  } else if (worstPillar.pillar === "authority") {
    bottleneckSummary = `Seu maior gargalo atual é Autoridade (${worstPillar.score}/100). Falta demonstrar profundidade e provas concretas.`;
    opportunityHeadline = "Foco estratégico: conteúdos aprofundados, estudos de caso e desconstrução de mitos com posicionamento firme.";
  } else if (worstPillar.pillar === "growth") {
    bottleneckSummary = `Seu maior gargalo atual é Descoberta (${worstPillar.score}/100). Seus posts atingem poucas contas novas.`;
    opportunityHeadline = "Foco estratégico: Reels com quebra de padrão nos primeiros 3 segundos e temas de alta compartilhabilidade.";
  } else if (worstPillar.pillar === "expression") {
    bottleneckSummary = `Seu maior gargalo atual é Expressão & Retenção (${worstPillar.score}/100). Falta conexão e clareza nos formatos.`;
    opportunityHeadline = "Foco estratégico: Carrosséis com design escaneável, histórias autênticas e enquetes envolventes nos Stories.";
  }

  return {
    niche,
    targetAudience,
    positioning,
    primaryGoal,
    toneOfVoice,
    cageScores,
    strengths,
    weaknesses,
    strategicPriorities,
    contentPillars,
    profileStage: (diagnosisResult?.scoring?.score ?? 50) > 70 ? "Escala & Otimização" : "Estruturação & Tração",
    source,
    handle,
    bottleneckSummary,
    opportunityHeadline
  };
}
