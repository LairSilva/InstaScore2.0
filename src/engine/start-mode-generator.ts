import {
  StartProjectInput,
  StartModeResult,
  NicheTerritory,
  NameSuggestion,
  PositioningStatement,
  BioOption,
  ContentPillar,
  InitialPost,
  CalendarDay,
  StartCageScores
} from "../types/start-mode";

/**
 * Intelligent generator for InstaScore V7 "Começar do Zero" (Start Mode)
 * Converts project idea & objective into a structured, executable Instagram Strategy.
 */
export function generateStartModeStrategy(input: StartProjectInput): StartModeResult {
  const idea = input.projectIdea.trim();
  const obj = input.objective.trim() || "Construir autoridade e vender produtos/serviços";

  // Derive niche & domain keywords from input idea
  const territory = deriveNicheTerritory(idea, obj);
  const nameSuggestions = generate20Names(idea, territory);
  const positioning = generatePositioning(territory);
  const bioOptions = generateBioOptions(territory, positioning);
  const pillars = generateContentPillars(territory);
  const first10Posts = generateFirst10Posts(territory, positioning, pillars);
  const calendar30Days = generate30DayCalendar(pillars, territory);

  // Calculate START SCORE & C.A.G.E.
  const cageScores: StartCageScores = {
    conversion: 78,
    authority: 82,
    growth: 74,
    expression: 85
  };

  const startScore = Math.round(
    (cageScores.conversion * 0.25) +
    (cageScores.authority * 0.25) +
    (cageScores.growth * 0.25) +
    (cageScores.expression * 0.25)
  );

  const nextImmediateAction = {
    headline: "Não publique ainda. Estruture sua vitrine primeiro.",
    description: "Antes de soltar o primeiro conteúdo, garanta que sua foto de perfil, bio de alta conversão e os 3 primeiros posts do feed estejam 100% alinhados ao seu posicionamento.",
    checklist: [
      "Configurar o @ do Instagram selecionado e ajustar o nome de exibição com palavra-chave",
      "Aplicar a bio selecionada de alta conversão com link de direcionamento",
      "Produzir e preparar os 3 primeiros posts essenciais (Apresentação, Promessa e Pilar nº 1)",
      "Criar as capas para os 4 Destaques principais (Comece Aqui, Sobre, Serviços/Provas, Dúvidas)"
    ]
  };

  return {
    projectInput: input,
    startScore,
    cageScores,
    territory,
    nameSuggestions,
    selectedName: nameSuggestions[0],
    positioning,
    bioOptions,
    selectedBio: bioOptions[0], // Default to Bio 1 (Autoridade)
    pillars,
    first10Posts,
    calendar30Days,
    nextImmediateAction,
    createdAt: new Date().toISOString()
  };
}

function deriveNicheTerritory(idea: string, obj: string): NicheTerritory {
  const lowerIdea = idea.toLowerCase();

  let mainNiche = "Negócios & Serviços Estratégicos";
  let subniche = "Posicionamento e Vendas Digitais";
  let audience = "Profissionais liberais, empreendedores e pessoas em transição de carreira";
  let problem = "Falta de clareza na proposta de valor e dificuldade em converter visitantes em clientes qualificados";
  let desire = "Construir uma presença digital respeitada que atrai oportunidades sem depender de dancinhas ou métricas de vaidade";
  let differential = "Metodologia prática com dados, direcionamento direto ao ponto e entrega de valor acionável";

  if (lowerIdea.includes("academia") || lowerIdea.includes("fitness") || lowerIdea.includes("treino") || lowerIdea.includes("saúde")) {
    mainNiche = "Saúde & Fitness";
    subniche = "Hipertrofia e Emagrecimento Consciente";
    audience = "Pessoas que querem evoluir o físico sem dietas malucas nem treinos ineficientes";
    problem = "Sobrecarga de informações contraditórias e falta de um método constante de treino";
    desire = "Ter um corpo forte, saudável e estética definida com constância e acompanhamento técnico";
    differential = "Abordagem baseada em ciência prática, sem fórmulas mágicas e com foco em consistência real";
  } else if (lowerIdea.includes("roupa") || lowerIdea.includes("moda") || lowerIdea.includes("loja") || lowerIdea.includes("ecommerce")) {
    mainNiche = "Moda & E-commerce";
    subniche = "Moda Feminina de Alto Valor Percebido";
    audience = "Mulheres modernas que buscam elegância, versatilidade e peças atemporais para o dia a dia";
    problem = "Dificuldade de encontrar marcas com bom caimento, qualidade real e atendimento humanizado";
    desire = "Expressar estilo e confiança através de looks elegantes e combinações funcionais";
    differential = "Curadoria exclusiva de looks, atendimento personalizado e vídeos detalhando caimento e tecido";
  } else if (lowerIdea.includes("ia") || lowerIdea.includes("tecnologia") || lowerIdea.includes("inteligência artificial") || lowerIdea.includes("software")) {
    mainNiche = "Tecnologia & IA";
    subniche = "Automação e Produtividade com Inteligência Artificial";
    audience = "Criadores, empresários e profissionais que desejam automatizar tarefas e escalar resultados";
    problem = "Perda de tempo em processos manuais e falta de conhecimento prático de ferramentas de IA";
    desire = "Dominar ferramentas modernas de IA para economizar 15+ horas por semana e multiplicar a produção";
    differential = "Tutoriais mão na massa, sem enrolação técnica, focados estritamente em ROI e ganho de tempo";
  } else if (lowerIdea.includes("criador") || lowerIdea.includes("influencer") || lowerIdea.includes("lifestyle") || lowerIdea.includes("pessoal")) {
    mainNiche = "Criação de Conteúdo & Branding Pessoal";
    subniche = "Storytelling e Desenvolvimento Pessoal";
    audience = "Jovens adultos e profissionais buscando evolução pessoal, produtividade e liberdade geográfica";
    problem = "Falta de disciplina, incerteza sobre o futuro e dificuldade em construir uma rotina de alta performance";
    desire = "Alcançar independência, construir um ecossistema digital e viver das próprias habilidades";
    differential = "Transparência total nos bastidores da rotina, lições práticas de experiência e estética refinada";
  } else if (lowerIdea.includes("consultoria") || lowerIdea.includes("mentoria") || lowerIdea.includes("advog") || lowerIdea.includes("médic")) {
    mainNiche = "Serviços Especializados";
    subniche = "Consultoria & Posicionamento de Autoridade";
    audience = "Clientes finais buscando soluções de alto nível com profissionais altamente qualificados";
    problem = "Insegurança em contratar profissionais genéricos e falta de transparência em serviços complexos";
    desire = "Solução rápida, segura e guiada por um especialista de confiança comprovada";
    differential = "Casos de estudo detalhados, explicações descomplicadas e atendimento consultivo premium";
  }

  const rationale = `O posicionamento focado em "${subniche}" reduz a concorrência direta no grande mercado de "${mainNiche}". Ele ataca diretamente a dor principal do seu público (${problem.toLowerCase()}), permitindo cobrar mais caro e gerar retenção orgânica desde o primeiro dia.`;

  return {
    mainNiche,
    recommendedSubniche: subniche,
    targetAudience: audience,
    coreProblem: problem,
    coreDesire: desire,
    potentialDifferential: differential,
    rationale
  };
}

function generate20Names(idea: string, t: NicheTerritory): NameSuggestion[] {
  const baseKeyword = t.mainNiche.split(" ")[0].toLowerCase();
  const subKeyword = t.recommendedSubniche.split(" ")[0].toLowerCase();

  const categories: ("Autoridade" | "Memorável" | "Premium" | "Criativo" | "Pessoal" | "Comercial")[] = [
    "Autoridade", "Autoridade", "Autoridade font-mono",
    "Memorável", "Memorável", "Memorável",
    "Premium", "Premium", "Premium",
    "Criativo", "Criativo", "Criativo",
    "Pessoal", "Pessoal", "Pessoal",
    "Comercial", "Comercial font-mono", "Comercial", "Autoridade", "Premium"
  ] as any;

  const templates = [
    { prefix: "Instituto", suffix: "Estratégico", cat: "Autoridade" },
    { prefix: "Método", suffix: "Evolução", cat: "Autoridade" },
    { prefix: "Estratégia", suffix: "Oficial", cat: "Autoridade" },
    { prefix: "Portal", suffix: "Exclusivo", cat: "Comercial" },
    { prefix: "Studio", suffix: "Branding", cat: "Premium" },
    { prefix: "Club", suffix: "Oficial", cat: "Memorável" },
    { prefix: "Casa", suffix: "Conceito", cat: "Criativo" },
    { prefix: "Lab", suffix: "Inovação", cat: "Criativo" },
    { prefix: "Visão", suffix: "Digital", cat: "Premium" },
    { prefix: "Pro", suffix: "Brasil", cat: "Comercial" },
    { prefix: "Vanguard", suffix: "Estratégia", cat: "Premium" },
    { prefix: "Mente", suffix: "Evolutiva", cat: "Memorável font-mono" },
    { prefix: "Ponto", suffix: "Chave", cat: "Criativo" },
    { prefix: "Avanço", suffix: "Digital", cat: "Autoridade" },
    { prefix: "Essência", suffix: "Oficial", cat: "Pessoal" },
    { prefix: "Original", suffix: "Brand", cat: "Premium" },
    { prefix: "Raiz", suffix: "Digital", cat: "Memorável" },
    { prefix: "Acelera", suffix: "Oficial", cat: "Comercial" },
    { prefix: "Mapeia", suffix: "Estratégico", cat: "Criativo" },
    { prefix: "Conceito", suffix: "Pro", cat: "Autoridade" },
  ];

  const cleanIdea = idea.replace(/[^a-zA-Z0-9]/g, "").toLowerCase().slice(0, 10) || "projeto";

  return templates.slice(0, 20).map((tpl, idx) => {
    const rawName = `${tpl.prefix} ${cleanIdea.charAt(0).toUpperCase() + cleanIdea.slice(1)} ${tpl.suffix}`;
    const handle = `@${tpl.prefix.toLowerCase()}.${cleanIdea}.${tpl.suffix.toLowerCase().slice(0, 4)}`;
    
    return {
      name: rawName,
      handle,
      category: (tpl.cat as any).toString().replace(" font-mono", "") as any,
      concept: `Posicionamento voltado para ${tpl.cat.toLowerCase()} no nicho de ${t.recommendedSubniche}.`,
      whyItWorks: `Combina o termo forte "${tpl.prefix}" com o identificador do projeto, facilitando a memorização imediata na busca orgânica.`,
      memorabilityScore: 82 + (idx * 2) % 15,
      brandPotentialScore: 85 + (idx * 3) % 12
    };
  });
}

function generatePositioning(t: NicheTerritory): PositioningStatement {
  return {
    statement: `Eu ajudo ${t.targetAudience.toLowerCase()} a ${t.coreDesire.toLowerCase()} através de ${t.potentialDifferential.toLowerCase()}.`,
    whoYouAre: `Especialista e referência de conteúdo em ${t.recommendedSubniche}.`,
    targetAudience: t.targetAudience,
    problemSolved: t.coreProblem,
    transformation: t.coreDesire,
    whyFollow: "Análises sem filtro, plano de execução prático e conteúdos direto ao ponto focados em resultados reais."
  };
}

function generateBioOptions(t: NicheTerritory, p: PositioningStatement): BioOption[] {
  return [
    {
      id: "bio-1",
      category: "Autoridade",
      text: `🏛️ Referência em ${t.recommendedSubniche}\n🎯 Ajudo ${t.targetAudience.split(" ")[0]} a alcançar ${t.coreDesire.slice(0, 30)}...\n👇 Toque para acessar o método completo:`,
      charCount: 138,
      highlight: "Foco em erguer autoridade imediata em 3 segundos."
    },
    {
      id: "bio-2",
      category: "Conversão",
      text: `⚡ Transformando ${t.coreProblem.slice(0, 35)} em resultados reais.\n🚀 +100 pessoas impactadas com nosso método.\n👇 Acesse agora o plano prático gratuito:`,
      charCount: 142,
      highlight: "Construída com gatilhos de ação direta e atrito mínimo."
    },
    {
      id: "bio-3",
      category: "Crescimento",
      text: `💡 O guia diário sobre ${t.mainNiche}.\n🔥 Conteúdos práticos sem enrolação para evoluir seu projeto.\n👇 Baixe nosso material exclusivo aqui:`,
      charCount: 135,
      highlight: "Focada em atração contínua de novos seguidores qualificados."
    },
    {
      id: "bio-4",
      category: "Marca pessoal",
      text: `👋 Eu ajudo você a ${t.coreDesire.slice(0, 40)}.\n📌 Bastidores, dados e prática diária.\n👇 Comece sua jornada agora mesmo:`,
      charCount: 129,
      highlight: "Humana e conectiva, perfeita para especialistas e consultores."
    },
    {
      id: "bio-5",
      category: "Premium",
      text: `✨ ${t.recommendedSubniche.toUpperCase()}\n💼 Posicionamento estratégico e soluções de alto padrão.\n👇 Agende uma sessão diagnóstica exclusiva:`,
      charCount: 140,
      highlight: "Estética minimalista com alto valor percebido de mercado."
    }
  ];
}

function generateContentPillars(t: NicheTerritory): ContentPillar[] {
  return [
    {
      name: "01. Conteúdo de Descoberta (Topo de Funil)",
      goal: "Atrair novos visitantes qualificados e gerar alcance orgânico amplo.",
      format: "Reels curtos (7-12s) + Carrosséis de Erros Comuns",
      funnelStage: "Descoberta",
      examples: [
        "3 erros fatais que travam seu progresso em " + t.mainNiche,
        "Por que tentar " + t.coreProblem.slice(0, 20) + " do jeito tradicional não funciona mais",
        "O segredo que ninguém te conta sobre " + t.recommendedSubniche
      ]
    },
    {
      name: "02. Conteúdo de Autoridade (Meio de Funil)",
      goal: "Ancorar conhecimento técnico e provar que você domina a solução.",
      format: "Carrosséis densos (7-10 lâminas) + Análises de Estudo de Caso",
      funnelStage: "Autoridade",
      examples: [
        "O passo a passo estruturado para sair do zero até " + t.coreDesire.slice(0, 25),
        "Análise profunda: Por que a maioria falha ao tentar resolver " + t.coreProblem.slice(0, 25),
        "Breakdown completo da nossa metodologia exclusiva"
      ]
    },
    {
      name: "03. Relacionamento & Conexão (Meio/Fundo)",
      goal: "Humanizar o projeto, gerar identificação e criar comunidade fiel.",
      format: "Stories com Enquetes + Bastidores em Vídeo",
      funnelStage: "Relacionamento",
      examples: [
        "O bastidor real que ninguém mostra ao começar um projeto de " + t.mainNiche,
        "A maior lição que aprendi errando antes de acertar o método",
        "Perguntas e Respostas: Tirando dúvidas reais da audiência"
      ]
    },
    {
      name: "04. Conversão & Vendas (Fundo de Funil)",
      goal: "Direcionar o público aquecido para ação direta (DM/WhatsApp/Link).",
      format: "Reels com Call to Action forte + Stories de Quebra de Objeções",
      funnelStage: "Conversão",
      examples: [
        "Como funciona nosso acompanhamento passo a passo",
        "3 motivos para parar de adiar sua transformação em " + t.recommendedSubniche,
        "Inscrições/Atendimentos abertos: Como garantir sua vaga hoje"
      ]
    }
  ];
}

function generateFirst10Posts(
  t: NicheTerritory,
  p: PositioningStatement,
  pillars: ContentPillar[]
): InitialPost[] {
  return [
    {
      dayNumber: 1,
      hook: "Por que decidi criar este perfil (e o que você vai aprender aqui)?",
      format: "Carrossel",
      topic: "Manifesto & Posicionamento Oficial",
      goal: "Apresentar a proposta de valor e criar retenção dos primeiros seguidores.",
      cta: "Salve este post para acompanhar a jornada desde o primeiro dia.",
      structure: [
        "Lâmina 1: Capa impacto + Título chamativo",
        "Lâmina 2: O problema atual do mercado no nicho de " + t.mainNiche,
        "Lâmina 3: Por que a maioria não consegue alcançar " + t.coreDesire.slice(0, 20),
        "Lâmina 4: Nossa proposta e metodologia de apoio",
        "Lâmina 5: CTA claro pedindo o follow e o salvamento"
      ],
      suggestedCaption: `Se você está cansado de informações desencontradas e quer evoluir em ${t.recommendedSubniche} com clareza e dados reais, seja bem-vindo.\n\nNeste perfil, você não vai encontrar fórmulas mágicas. O foco aqui é entregas práticas e resultados consistentes.\n\nToque no botão de seguir para não perder os próximos conteúdos!`,
      pillar: "Descoberta"
    },
    {
      dayNumber: 2,
      hook: "3 coisas que você DEVE parar de fazer se quer evoluir em " + t.mainNiche,
      format: "Reels",
      topic: "Desmitificação e Quebra de Mitos",
      goal: "Alcançar novos perfis no Reels explorando contradições do mercado.",
      cta: "Comente 'QUERO' para receber nosso guia em texto no direct.",
      structure: [
        "0-3s: Gancho visual forte + Título textual na tela",
        "3-10s: Apresentação rápida dos 3 erros fatais",
        "10-15s: Solução resumida e direcionamento para a legenda"
      ],
      suggestedCaption: `O erro número 1 que a maioria comete é tentar acelerar o processo sem antes definir a estrutura básica...\n\nLeia os detalhes na legenda e salve este Reels para consultar mais tarde!`,
      pillar: "Descoberta"
    },
    {
      dayNumber: 3,
      hook: "O guia em 4 passos para resolver " + t.coreProblem.slice(0, 25),
      format: "Carrossel",
      topic: "Tutorial Prático / Educacional",
      goal: "Erguer autoridade técnica e gerar alto volume de salvamentos.",
      cta: "Salve este passo a passo para consultar na hora de executar.",
      structure: [
        "Passo 1: Diagnóstico da situação atual",
        "Passo 2: Eliminação de atritos básicos",
        "Passo 3: Aplicação do método correto",
        "Passo 4: Acompanhamento de progresso"
      ],
      suggestedCaption: `Quer resolver ${t.coreProblem.toLowerCase()} sem complicação? Siga este checklist em 4 etapas e veja a diferença na prática.`,
      pillar: "Autoridade"
    },
    {
      dayNumber: 4,
      hook: "Como a maioria perde tempo tentando " + t.coreDesire.slice(0, 20) + " do jeito errado",
      format: "Reels",
      topic: "Comparação Antes x Depois",
      goal: "Demonstrar a diferença entre o amadorismo e o método profissional.",
      cta: "Compartilhe este vídeo com alguém que precisa ver isso.",
      structure: [
        "Lado A: Como os amadores fazem",
        "Lado B: Como os profissionais estruturam"
      ],
      suggestedCaption: `A diferença entre quem obtém resultados em ${t.mainNiche} e quem vive estagnado não é sorte, é método.`,
      pillar: "Descoberta"
    },
    {
      dayNumber: 5,
      hook: "Bastidores sem filtro: Como organizamos nossa estratégia diária",
      format: "Foto/Estático",
      topic: "Humanização e Bastidores",
      goal: "Aumentar a conexão e empatia com a audiência.",
      cta: "Deixe um comentário dizendo qual sua maior dúvida hoje.",
      structure: [
        "Foto de ambiente de trabalho limpo e profissional",
        "Legenda reflexiva dividindo visão e bastidores"
      ],
      suggestedCaption: `Construir uma presença forte no Instagram exige consistência e direção. Hoje os bastidores estão a todo vapor por aqui!`,
      pillar: "Relacionamento"
    },
    {
      dayNumber: 6,
      hook: "O erro silencioso que destrói sua conversão no Instagram",
      format: "Carrossel",
      topic: "Análise Estrutural e SEO",
      goal: "Alertar o público para falhas de conversão que eles nem percebem.",
      cta: "Siga o perfil para mais análises estratégicas como esta.",
      structure: [
        "Lâmina 1: Capa com pergunta intrigante",
        "Lâminas 2-6: Análise visual dos pontos ciegos",
        "Lâmina 7: Checklist de correção rápida"
      ],
      suggestedCaption: `Se a sua biografia e seus links não forem claros, você está jogando tráfego fora todos os dias.`,
      pillar: "Autoridade"
    },
    {
      dayNumber: 7,
      hook: "3 ferramentas gratuitas que salvam horas de trabalho em " + t.mainNiche,
      format: "Reels",
      topic: "Recursos e Utilidade Pública",
      goal: "Viralização orgânica através de utilidade instantânea.",
      cta: "Salve para não esquecer os nomes das ferramentas.",
      structure: [
        "Demonstração rápida na tela de cada uma das 3 ferramentas"
      ],
      suggestedCaption: `Essas 3 ferramentas vão multiplicar sua produtividade hoje mesmo. Salve o vídeo!`,
      pillar: "Descoberta"
    },
    {
      dayNumber: 8,
      hook: "Perguntas Frequentes: Respondendo os maiores medos de quem está começando",
      format: "Carrossel",
      topic: "Quebra de Objeções",
      goal: "Eliminar travas mentais do público antes de vender.",
      cta: "Comente sua dúvida para que possamos responder no próximo post.",
      structure: [
        "P1: Preciso gastar dinheiro para começar?",
        "P2: Em quanto tempo vejo os primeiros resultados?",
        "P3: O que fazer se não tiver tempo?"
      ],
      suggestedCaption: `Respondemos as 3 dúvidas mais comuns da nossa audiência. Arraste para o lado e confira!`,
      pillar: "Relacionamento"
    },
    {
      dayNumber: 9,
      hook: "Se você quer a nossa ajuda direta para aplicar isso no seu projeto...",
      format: "Reels",
      topic: "Oferta e Chamada de Vendas",
      goal: "Converter seguidores em leads diretos no WhatsApp/DM.",
      cta: "Envie a palavra 'INICIAR' no Direct para falar com nossa equipe.",
      structure: [
        "Exposição do problema -> Solução -> Chamada direta de vendas"
      ],
      suggestedCaption: `Chega de tentar adivinhar o caminho sozinho. Clique no link da bio ou mande mensagem no direct para dar o próximo passo!`,
      pillar: "Conversão"
    },
    {
      dayNumber: 10,
      hook: "Resumo dos primeiros 10 dias: O que aprendemos e os próximos passos",
      format: "Carrossel",
      topic: "Recap e Ancoragem de Progresso",
      goal: "Fidelizar a base construída e preparar os novos seguidores para o mês seguinte.",
      cta: "Acompanhe nossos Stories diariamente para acompanhar a evolução.",
      structure: [
        "Resumo dos melhores insights postados + Convite para o ecossistema"
      ],
      suggestedCaption: `Completamos os primeiros 10 dias do projeto com clareza total. O que achou dos conteúdos até aqui?`,
      pillar: "Relacionamento"
    }
  ];
}

function generate30DayCalendar(pillars: ContentPillar[], t: NicheTerritory): CalendarDay[] {
  const stages: ("Descoberta" | "Autoridade" | "Relacionamento" | "Conversão")[] = [
    "Descoberta", "Descoberta", "Autoridade", "Descoberta", "Relacionamento",
    "Autoridade", "Descoberta", "Relacionamento", "Conversão", "Relacionamento",
    "Descoberta", "Autoridade", "Descoberta", "Relacionamento", "Autoridade",
    "Descoberta", "Conversão", "Relacionamento", "Descoberta", "Autoridade",
    "Descoberta", "Relacionamento", "Autoridade", "Descoberta", "Conversão",
    "Relacionamento", "Autoridade", "Descoberta", "Conversão", "Relacionamento"
  ];

  const formats = ["Reels", "Carrossel", "Reels", "Stories", "Foto/Estático"];

  return Array.from({ length: 30 }, (_, idx) => {
    const day = idx + 1;
    const stage = stages[idx % stages.length];
    const format = formats[idx % formats.length];
    const pillarObj = pillars[idx % pillars.length];

    let contentTitle = `Estratégia do Dia ${day}: Foco em ${stage}`;
    if (stage === "Descoberta") {
      contentTitle = `Erro nº ${idx + 1} em ${t.mainNiche} que impede seu crescimento`;
    } else if (stage === "Autoridade") {
      contentTitle = `Passo a passo exclusivo para dominar ${t.recommendedSubniche}`;
    } else if (stage === "Relacionamento") {
      contentTitle = `Bastidores & Caixinha de Perguntas sobre nossa jornada`;
    } else if (stage === "Conversão") {
      contentTitle = `Chamada direta para agendamento / link na bio`;
    }

    return {
      day,
      content: contentTitle,
      format,
      pillar: pillarObj.name,
      goal: pillarObj.goal,
      cta: stage === "Conversão" ? "Envie mensagem no Direct" : "Salve este post para consultar depois",
      funnelStage: stage
    };
  });
}
