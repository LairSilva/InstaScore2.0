import { DigitalTwin } from "../../core/DigitalTwin";

export interface GlobalNicheBenchmark {
  niche: string;
  methodologySource: string;
  sampleSizeLabel: string;
  averageScore: number;
  topPercentileScore: number;
  averageConversionVelocity: number;
  topPercentileConversionVelocity: number;
  winningPatterns: string[];
  decliningPatterns: string[];
}

export class GlobalIntelligenceEngine {
  /**
   * Base de Conhecimento Estratégica consolidada da metodologia InstaScore C.A.G.E.
   * Modelagem de coortes baseada nos 25 critérios estruturais.
   */
  private static readonly globalDatabase: Record<string, GlobalNicheBenchmark> = {
    "moda": {
      niche: "Moda & Vestuário",
      methodologySource: "InstaScore Benchmark V6 • Coorte Moda e E-commerce",
      sampleSizeLabel: "Base de +1.400 auditorias estruturais",
      averageScore: 48,
      topPercentileScore: 84,
      averageConversionVelocity: 16,
      topPercentileConversionVelocity: 48,
      winningPatterns: [
        "Vídeos curtos de provador com contexto real de uso (Lookbook dinâmico)",
        "CTAs claros direcionando para link único de catálogo com busca",
        "Provas sociais em formato carrossel narrativo com depoimentos reais"
      ],
      decliningPatterns: [
        "Fotos estáticas de catálogo isoladas sem modelo ou contexto",
        "Preço por Direct ('Valor no direct') reduzindo em 70% a conversão",
        "Uso excessivo de hashtags genéricas sem palavras-chave na Bio"
      ]
    },
    "estética": {
      niche: "Estética & Beleza",
      methodologySource: "InstaScore Benchmark V6 • Coorte Saúde & Estética",
      sampleSizeLabel: "Base de +1.200 auditorias estruturais",
      averageScore: 52,
      topPercentileScore: 88,
      averageConversionVelocity: 19,
      topPercentileConversionVelocity: 54,
      winningPatterns: [
        "Vídeos de processo humanizado (Storytelling do procedimento)",
        "Destaque de Localização e WhatsApp direto com link pré-preenchido",
        "Tirar dúvidas reais de pacientes nos Stories com respostas em vídeo"
      ],
      decliningPatterns: [
        "Apenas fotos de resultados sem contexto ou explicação técnica",
        "Bio confusa com múltiplos links e sem especialidade destacada",
        "Banners promocionais poluídos no feed principal"
      ]
    },
    "fitness": {
      niche: "Fitness & Personal Trainer",
      methodologySource: "InstaScore Benchmark V6 • Coorte Educação Física & Treino",
      sampleSizeLabel: "Base de +950 auditorias estruturais",
      averageScore: 46,
      topPercentileScore: 83,
      averageConversionVelocity: 14,
      topPercentileConversionVelocity: 47,
      winningPatterns: [
        "Correções de erros comuns de execução nos primeiros 3 segundos de Reels",
        "Estudos de caso de alunos com evolução de postura e rotina",
        "Bio com foco em quem o profissional ajuda (público específico: ex: mulheres 40+)"
      ],
      decliningPatterns: [
        "Apenas fotos pessoais de treino sem ensinar ou gerar valor para o seguidor",
        "Falta de chamada para consultoria ou link para questionário de anamnese",
        "Treinos genéricos sem explicar para quem é a indicação"
      ]
    },
    "psicologia": {
      niche: "Psicologia & Terapia",
      methodologySource: "InstaScore Benchmark V6 • Coorte Saúde Mental & Bem-estar",
      sampleSizeLabel: "Base de +850 auditorias estruturais",
      averageScore: 51,
      topPercentileScore: 86,
      averageConversionVelocity: 17,
      topPercentileConversionVelocity: 50,
      winningPatterns: [
        "Carrosséis reflexivos que nomeiam sentimentos e dores reais do paciente",
        "Bio com CRP visível, abordagem (ex: TCC, Psicanálise) e público-alvo claro",
        "Link direto para agendamento humanizado de sessão ou triagem"
      ],
      decliningPatterns: [
        "Postagens com textos acadêmicos difíceis de compreender pelo leigo",
        "Falta de foto humanizada no perfil (uso de logomarcas genéricas)",
        "Ausência de instruções de como funciona a primeira consulta"
      ]
    },
    "gastronomia": {
      niche: "Gastronomia & Restaurantes",
      methodologySource: "InstaScore Benchmark V6 • Coorte Negócios Locais & Gastronomia",
      sampleSizeLabel: "Base de +1.100 auditorias estruturais",
      averageScore: 49,
      topPercentileScore: 85,
      averageConversionVelocity: 22,
      topPercentileConversionVelocity: 60,
      winningPatterns: [
        "Reels de Food Porn com áudio ambiente e close nos pratos",
        "Destaques com Cardápio atualizado, Horários e Como Chegar",
        "Link direto para pedido (iFood/Delivery próprio) no topo da Bio"
      ],
      decliningPatterns: [
        "Fotos com iluminação ruim que desvalorizam o prato",
        "Falta de endereço fixo ou link de delivery na Bio",
        "Feed desatualizado há mais de 7 dias"
      ]
    },
    "advocacia": {
      niche: "Advocacia & Jurídico",
      methodologySource: "InstaScore Benchmark V6 • Coorte Serviços Jurídicos",
      sampleSizeLabel: "Base de +700 auditorias estruturais",
      averageScore: 47,
      topPercentileScore: 81,
      averageConversionVelocity: 13,
      topPercentileConversionVelocity: 42,
      winningPatterns: [
        "Explicação de direitos do consumidor/trabalhista com exemplos práticos",
        "Bio com área de atuação específica (ex: Direito Previdenciário ou Família)",
        "Destaque de Dúvidas Frequentes esclarecendo mitos jurídicos"
      ],
      decliningPatterns: [
        "Linguagem excessivamente técnica e jargões jurídicos",
        "Panfletagem digital sem conteúdo educativo",
        "Falta de canal direto e sigiloso para atendimento preliminar"
      ]
    },
    "mentoria": {
      niche: "Mentoria & Infoprodutos",
      methodologySource: "InstaScore Benchmark V6 • Coorte Educação Online & Consultoria",
      sampleSizeLabel: "Base de +1.800 auditorias estruturais",
      averageScore: 54,
      topPercentileScore: 89,
      averageConversionVelocity: 20,
      topPercentileConversionVelocity: 58,
      winningPatterns: [
        "Demonstração de método próprio com passos claros de transformação",
        "Depoimentos em vídeo de alunos com resultados tangíveis",
        "Pilar forte de distribuição (40% autoridade / 25% descoberta)"
      ],
      decliningPatterns: [
        "Promessas vagas de 'fature múltiplos 6 dígitos' sem validação de método",
        "Ausência de posicionamento anti-concorrente bem fundamentado",
        "Stories sem rotina de trabalho ou bastidores reais"
      ]
    }
  };

  /**
   * Módulo 5: Benchmarking por Nicho
   * Retorna os dados agregados dos players do mesmo mercado com normalização inteligente.
   */
  static getBenchmarkForNiche(niche: string): GlobalNicheBenchmark {
    const raw = (niche || "").toLowerCase().trim();
    
    // Normalização semântica
    for (const [key, benchmark] of Object.entries(this.globalDatabase)) {
      if (raw.includes(key) || raw.includes(benchmark.niche.toLowerCase())) {
        return benchmark;
      }
    }
    
    if (raw.includes("roupa") || raw.includes("loja") || raw.includes("calçado") || raw.includes("semijoia")) {
      return this.globalDatabase["moda"];
    }
    if (raw.includes("dentista") || raw.includes("odonto") || raw.includes("médico") || raw.includes("saúde") || raw.includes("dermat")) {
      return this.globalDatabase["estética"];
    }
    if (raw.includes("trein") || raw.includes("personal") || raw.includes("academia") || raw.includes("nutri")) {
      return this.globalDatabase["fitness"];
    }
    if (raw.includes("terapia") || raw.includes("psico") || raw.includes("coach") || raw.includes("desenvolvimento")) {
      return this.globalDatabase["psicologia"];
    }
    if (raw.includes("comida") || raw.includes("restaurante") || raw.includes("bar") || raw.includes("café") || raw.includes("hamburguer")) {
      return this.globalDatabase["gastronomia"];
    }
    if (raw.includes("direito") || raw.includes("advog") || raw.includes("jurid") || raw.includes("contabil")) {
      return this.globalDatabase["advocacia"];
    }
    if (raw.includes("curso") || raw.includes("mentor") || raw.includes("consult") || raw.includes("criador") || raw.includes("infoprod")) {
      return this.globalDatabase["mentoria"];
    }

    // Baseline consolidado para nichos gerais
    return {
      niche: niche || "Serviços e Negócios",
      methodologySource: "InstaScore Benchmark V6 • Coorte Geral Estrutural",
      sampleSizeLabel: "Base agregada de +8.000 auditorias estruturais",
      averageScore: 47,
      topPercentileScore: 82,
      averageConversionVelocity: 15,
      topPercentileConversionVelocity: 45,
      winningPatterns: [
        "Retenção nos 3 primeiros segundos de Reels com gancho direto", 
        "CTAs claros direcionando para uma única ação objetiva na Bio",
        "Carrosséis educativos resolvendo 1 problema específico do seguidor"
      ],
      decliningPatterns: [
        "Conteúdo excessivamente genérico sem diferenciação de público", 
        "Bio com múltiplos links dispersos sem hierarquia",
        "Postagens esporádicas sem consistência temática"
      ]
    };
  }

  /**
   * Módulo 12 e 4: Avalia o Digital Twin contra a Inteligência Global
   */
  static compareTwinToGlobal(twin: DigitalTwin): {
    status: "ABOVE_AVERAGE" | "BELOW_AVERAGE" | "TOP_PERFORMER";
    gapToTop: number;
    recommendedPatternToAdopt: string;
    patternToDrop: string;
  } {
    const benchmark = this.getBenchmarkForNiche(twin.identity.niche);
    
    const overallScore = twin?.metrics?.overallScore || 50;
    const conversionVelocity = twin?.metrics?.conversionVelocity || 40;

    let status: "ABOVE_AVERAGE" | "BELOW_AVERAGE" | "TOP_PERFORMER" = "BELOW_AVERAGE";
    if (overallScore >= benchmark.topPercentileScore) {
      status = "TOP_PERFORMER";
    } else if (overallScore >= benchmark.averageScore) {
      status = "ABOVE_AVERAGE";
    }

    const gapToTop = Math.max(0, benchmark.topPercentileScore - overallScore);

    // Extração de padrões de alto impacto
    const recommendedPatternToAdopt = conversionVelocity < benchmark.averageConversionVelocity 
      ? benchmark.winningPatterns[1] // Foco em CTAs e conversão
      : benchmark.winningPatterns[0];  // Foco em ganchos e topo de funil

    const patternToDrop = benchmark.decliningPatterns[0];

    return {
      status,
      gapToTop,
      recommendedPatternToAdopt,
      patternToDrop
    };
  }
}

