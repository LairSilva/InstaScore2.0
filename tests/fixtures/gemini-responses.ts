/**
 * Fixtures for Gemini AI Responses
 * Includes:
 * 1. Valid pure JSON response
 * 2. Valid JSON wrapped in Markdown codeblocks (```json ... ``` and ``` ... ```)
 * 3. Invalid syntax JSON (broken formatting / unparseable)
 * 4. Incomplete / truncated JSON response (model cut off)
 */

import { CRITERIA } from "../../src/config/methodology";

export const MOCK_VALID_DIAGNOSIS_OBJECT = {
  methodology_version: "instascore-structural-0.1-alpha",
  analysis_type: "structural",
  metadata: {
    is_data_sufficient: true,
    missing_elements: [],
    overall_confidence: 0.92,
    epistemic_summary: {
      evidência_observada: "Captura de tela nítida contendo cabeçalho de perfil, bio, destaques e 9 postagens do feed.",
      inferência_técnica: "Perfil comercial de serviços com foco em captação de clientes para consultoria individual.",
      limite_metodológico: "Sem acesso aos stories ativos das últimas 24 horas ou painel de métricas privadas."
    }
  },
  evaluations: CRITERIA.map((c, i) => ({
    criterion_id: c.id,
    grade: (i % 4) + 1, // 1 to 4
    confidence: 0.9,
    evidence: `Evidência estrutural observada para o critério ${c.id}`,
    justification: `Justificativa baseada nas diretrizes metodológicas do critério ${c.id}`
  })),
  strengths: [
    {
      criterion_id: "positioning.offer_clarity",
      title: "Clareza da Proposta Principal",
      reason: "A bio define imediatamente o serviço oferecido nos primeiros 3 segundos."
    },
    {
      criterion_id: "seo.username_clarity",
      title: "Nome de Usuário Limpo",
      reason: "O @ é direto, memorável e livre de caracteres especiais desnecessários."
    },
    {
      criterion_id: "authority.social_proof",
      title: "Destaques de Depoimentos",
      reason: "Presença de destaques organizados com provas sociais e resultados de clientes."
    }
  ],
  critical_gaps: [
    {
      criterion_id: "seo.name_keyword",
      title: "Ausência de Palavra-chave no Nome",
      reason: "O campo de nome não contém o termo do nicho para buscas orgânicas.",
      impact: "Perda de descobertas gratuitas na pesquisa do Instagram."
    },
    {
      criterion_id: "conversion.explicit_cta",
      title: "Falta de Chamada para Ação no Link",
      reason: "O link da bio não é precedido por uma orientação clara.",
      impact: "Redução de até 40% na taxa de cliques para a página de vendas."
    }
  ],
  recommended_actions: [
    {
      criterion_id: "seo.name_keyword",
      title: "Adicionar Nicho ao Nome do Perfil",
      instruction: "Edite o campo Nome para '[Seu Nome] | [Nicho Principal]' imediatamente.",
      effort: "low",
      expected_effect: "Indexação nas buscas da aba Explorar."
    },
    {
      criterion_id: "conversion.explicit_cta",
      title: "Inserir CTA Direta na Última Linha da Bio",
      instruction: "Adicione uma instrução clara apontando para o link único.",
      effort: "low",
      expected_effect: "Aumento imediato na taxa de conversão do perfil."
    },
    {
      criterion_id: "content.thematic_coherence",
      title: "Fixar 3 Posts Estratégicos no Topo",
      instruction: "Fixe: 1 de apresentação, 1 de produto/serviço e 1 de depoimento/prova social.",
      effort: "medium",
      expected_effect: "Retenção superior de novos visitantes orgânicos."
    }
  ],
  tomorrow_action: {
    criterion_id: "seo.name_keyword",
    title: "Ajuste Imediato do Campo Nome",
    instruction: "Abra o aplicativo agora e inclua sua palavra-chave principal no campo Nome."
  }
};

/** 1. Pure valid JSON */
export const FIXTURE_VALID_GEMINI_JSON = JSON.stringify(MOCK_VALID_DIAGNOSIS_OBJECT, null, 2);

/** 2. Valid JSON surrounded by Markdown codeblock (```json ... ```) */
export const FIXTURE_MARKDOWN_WRAPPED_JSON = `
Aqui está o diagnóstico estrutural do perfil com base na metodologia C.A.G.E.:

\`\`\`json
${JSON.stringify(MOCK_VALID_DIAGNOSIS_OBJECT, null, 2)}
\`\`\`

Espero que este plano de ação acelere o crescimento do seu perfil!
`;

/** 2b. Valid JSON surrounded by generic codeblock (``` ... ```) */
export const FIXTURE_GENERIC_CODEBLOCK_JSON = `
\`\`\`
${JSON.stringify(MOCK_VALID_DIAGNOSIS_OBJECT, null, 2)}
\`\`\`
`;

/** 3. Invalid syntax JSON (missing quotes, trailing commas, illegal characters) */
export const FIXTURE_INVALID_SYNTAX_JSON = `
{
  "methodology_version": "instascore-structural-0.1-alpha",
  "analysis_type": "structural",
  "metadata": {
    "is_data_sufficient": true,
    "missing_elements": [
  },
  "evaluations": [
    { criterion_id: "positioning.offer_clarity", grade: 2, }
  ]
}
`;

/** 4. Incomplete / Truncated JSON response (token limit cutoff) */
export const FIXTURE_INCOMPLETE_TRUNCATED_JSON = `
{
  "methodology_version": "instascore-structural-0.1-alpha",
  "analysis_type": "structural",
  "metadata": {
    "is_data_sufficient": true,
    "missing_elements": [],
    "overall_confidence": 0.88
  },
  "evaluations": [
    {
      "criterion_id": "positioning.offer_clarity",
      "grade": 3,
      "confidence": 0.9,
      "evidence": "A bio apresenta claramente a mentoria",
      "justification": "Boa clareza
`;

/**
 * Robust JSON Extractor & Sanitizer (Helper used in production pipeline)
 */
export function extractAndParseGeminiJSON(rawResponse: string): { success: boolean; data?: any; error?: string } {
  if (!rawResponse || typeof rawResponse !== "string" || rawResponse.trim().length === 0) {
    return { success: false, error: "Empty or null response" };
  }

  let text = rawResponse.trim();

  // Handle Markdown codeblock wrappers
  if (text.includes("```")) {
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      text = jsonMatch[1].trim();
    }
  }

  // Fallback to substring between first { and last }
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    return { success: false, error: "No JSON object structure found in response" };
  }

  const jsonCandidate = text.substring(firstBrace, lastBrace + 1);

  try {
    const parsed = JSON.parse(jsonCandidate);
    return { success: true, data: parsed };
  } catch (err: any) {
    return { success: false, error: `JSON Parse error: ${err.message || String(err)}` };
  }
}
