import { DiagnosisInput } from "../schemas/diagnosis";
import { ScoringResult } from "../config/methodology";

export const DEMO_DIAGNOSIS: DiagnosisInput = {
  methodology_version: "instascore-structural-0.1-alpha",
  analysis_type: "structural",
  metadata: {
    is_data_sufficient: true,
    missing_elements: [],
    overall_confidence: 0.92
  },
  evaluations: [
    {
      criterion_id: "positioning.offer_clarity",
      grade: 2,
      confidence: 0.95,
      evidence: "A bio contém o termo 'Ajudo pessoas', mas não especifica qual tipo de mentoria ou serviço principal você entrega.",
      justification: "Embora haja boa intenção de ajuda, o visitante comum não consegue entender com clareza qual é o seu produto ou serviço exato nos primeiros 3 segundos."
    },
    {
      criterion_id: "positioning.audience_clarity",
      grade: 3,
      confidence: 0.90,
      evidence: "A bio menciona 'profissionais insatisfeitos', o que define bem o público-alvo.",
      justification: "O público está bem mapeado. Quem está frustrado com a carreira se identificará imediatamente."
    },
    {
      criterion_id: "positioning.value_proposition",
      grade: 2,
      confidence: 0.92,
      evidence: "A bio não apresenta por que seu método ou sua mentoria é diferente de outros consultores de transição de carreira.",
      justification: "Sem um diferencial evidente (ex: anos de experiência, metodologia própria ou selo de validação), você compete apenas por preço."
    },
    {
      criterion_id: "positioning.goal_alignment",
      grade: 3,
      confidence: 0.94,
      evidence: "Seu objetivo declarado é vender mentoria individual de transição de carreira, e o perfil é voltado a isso.",
      justification: "Os temas abordados e a bio orbitam o universo profissional, mantendo um alinhamento estratégico satisfatório."
    },
    {
      criterion_id: "positioning.profile_feed_coherence",
      grade: 2,
      confidence: 0.90,
      evidence: "Os destaques e a bio falam de mentoria, mas o topo do feed possui muitos posts genéricos (frases motivacionais e fotos de café) que dispersam a mensagem.",
      justification: "Existe uma quebra de ritmo visual e temático entre a seriedade da bio e a informalidade excessiva dos últimos posts."
    },
    {
      criterion_id: "seo.name_keyword",
      grade: 1,
      confidence: 0.95,
      evidence: "O seu campo de Nome no Instagram está apenas 'Ana Silva'.",
      justification: "Você está perdendo buscas orgânicas gratuitas. Se alguém pesquisar por 'Mentora de Carreira' ou 'Transição de Carreira', seu perfil não aparecerá nos resultados."
    },
    {
      criterion_id: "seo.username_clarity",
      grade: 4,
      confidence: 0.98,
      evidence: "O nome de usuário é '@anasilva.carreira', que é extremamente limpo e associável.",
      justification: "Fácil de falar, fácil de digitar, sem excesso de pontos ou sublinhados. Excelente apresentação."
    },
    {
      criterion_id: "seo.bio_keywords",
      grade: 3,
      confidence: 0.90,
      evidence: "A bio contém as palavras 'carreira', 'trabalho' e 'descontentamento'.",
      justification: "Termos relevantes que ajudam o mecanismo de indexação interna do Instagram a compreender o seu nicho."
    },
    {
      criterion_id: "seo.location_category",
      grade: 2,
      confidence: 0.85,
      evidence: "A categoria está configurada como 'Criador de Conteúdo', mas poderia ser 'Consultor de Negócios'.",
      justification: "A categoria atual desvaloriza um pouco o aspecto de serviço profissional de alto valor."
    },
    {
      criterion_id: "seo.link_clarity",
      grade: 2,
      confidence: 0.92,
      evidence: "O link na bio é um agregador genérico do Linktree com 6 opções diferentes.",
      justification: "Excesso de opções gera paralisia de decisão. O visitante tem que adivinhar qual botão deve clicar para contratar a mentoria."
    },
    {
      criterion_id: "conversion.explicit_cta",
      grade: 1,
      confidence: 0.96,
      evidence: "Não há nenhuma frase de chamada na bio antes do link. O link apenas aparece ali solto.",
      justification: "Sem instrução explícita (ex: 'Toque para agendar sua sessão experimental'), a taxa de cliques no link cai drasticamente."
    },
    {
      criterion_id: "conversion.offer_visibility",
      grade: 2,
      confidence: 0.92,
      evidence: "O seu serviço de mentoria é citado apenas de passagem. Não há um destaque fixado explicando como ela funciona ou qual é o preço/formato.",
      justification: "O cliente interessado precisa fazer esforço extra para descobrir como pode te contratar, o que aumenta a barreira de entrada."
    },
    {
      criterion_id: "conversion.link_path",
      grade: 2,
      confidence: 0.88,
      evidence: "Ao clicar no link, o usuário é levado a uma página com várias opções, onde o botão do WhatsApp divide espaço com links de posts antigos.",
      justification: "Falta de foco no funil de vendas. O caminho entre o interesse do cliente e o seu WhatsApp comercial possui etapas desnecessárias."
    },
    {
      criterion_id: "conversion.highlights_journey",
      grade: 2,
      confidence: 0.91,
      evidence: "Os destaques ativos são 'Viagens', 'Frases' e 'Feed'. Não há destaques de 'Comece por aqui', 'Como funciona' ou 'Depoimentos'.",
      justification: "Os destaques estão funcionando como repositórios de recordações pessoais, e não como uma trilha estratégica de vendas para novos visitantes."
    },
    {
      criterion_id: "conversion.friction",
      grade: 3,
      confidence: 0.90,
      evidence: "Não existem barreiras técnicas graves, o formulário do WhatsApp funciona quando clicado.",
      justification: "O fluxo técnico básico de contato está operacional, mas o fluxo psicológico de persuasão está fraco."
    },
    {
      criterion_id: "content.thematic_coherence",
      grade: 3,
      confidence: 0.92,
      evidence: "Os carrosséis abordam síndrome do impostor, transição de carreira e postura profissional.",
      justification: "Os temas são muito relevantes para sua audiência e ajudam a construir um ecossistema educativo forte."
    },
    {
      criterion_id: "content.format_variety",
      grade: 2,
      confidence: 0.88,
      evidence: "O topo do feed é composto quase exclusivamente por posts estáticos e carrosséis textuais, sem Reels ou vídeos rápidos explicativos.",
      justification: "Falta dinamismo de formatos. Reels curtos ajudariam a atrair novos visitantes, enquanto os carrosséis educam quem já chegou."
    },
    {
      criterion_id: "content.educational_value",
      grade: 4,
      confidence: 0.95,
      evidence: "O post sobre '3 passos para mudar de emprego sem risco' é de altíssima utilidade prática.",
      justification: "Você entrega valor real de forma clara. Isso gera reciprocidade imediata e demonstra domínio do tema."
    },
    {
      criterion_id: "content.authority_proof",
      grade: 1,
      confidence: 0.94,
      evidence: "Nenhum dos posts recentes ou destaques exibe resultados reais de mentorados seus que conseguiram novos empregos.",
      justification: "As pessoas compram transformações validadas. Sem expor provas de que seu método funciona, você parece apenas uma teórica do assunto."
    },
    {
      criterion_id: "content.goal_support",
      grade: 3,
      confidence: 0.90,
      evidence: "Os posts educativos alimentam o desejo de mudança, gerando necessidade pelo seu serviço.",
      justification: "O conteúdo aquece bem a audiência e apoia de forma consistente o propósito comercial do perfil."
    },
    {
      criterion_id: "content.visual_readability",
      grade: 3,
      confidence: 0.95,
      evidence: "Cores contrastantes nos carrosséis, fontes legíveis e bom espaçamento interno nos cards.",
      justification: "A leitura dos posts é agradável tanto no celular quanto no desktop, sem poluição visual."
    },
    {
      criterion_id: "authority.social_proof",
      grade: 1,
      confidence: 0.93,
      evidence: "Nenhuma prova social visível na página inicial, nos destaques ou nas primeiras publicações do feed.",
      justification: "A ausência de depoimentos ou de relatos de sucesso é a principal responsável pela falta de conversão do seu perfil atual."
    },
    {
      criterion_id: "authority.humanization",
      grade: 3,
      confidence: 0.90,
      evidence: "Sua foto de perfil é profissional, nítida e sorridente. Há posts mostrando seus bastidores no escritório.",
      justification: "O visitante consegue se conectar com você rapidamente ao ver que há uma profissional real e acessível por trás da marca."
    },
    {
      criterion_id: "authority.professional_presentation",
      grade: 3,
      confidence: 0.92,
      evidence: "O feed é organizado, usa paleta de cores sóbria e transmite seriedade.",
      justification: "Passa a credibilidade necessária para quem quer investir em uma mentoria de carreira de alto valor."
    },
    {
      criterion_id: "authority.expertise_evidence",
      grade: 2,
      confidence: 0.90,
      evidence: "Você cita seus conhecimentos em RH na bio, mas não detalha certificações ou anos de prática.",
      justification: "Mencionar 'X anos de experiência' ou 'Especialista em Recrutamento' traria muito mais peso e segurança institucional."
    },
    {
      criterion_id: "authority.information_consistency",
      grade: 4,
      confidence: 0.96,
      evidence: "As informações da bio, do link e das imagens do feed estão alinhadas e não se contradizem.",
      justification: "Coerência impecável. Você se posiciona de forma integrada, o que reduz ruídos de comunicação."
    }
  ],
  strengths: [
    {
      criterion_id: "seo.username_clarity",
      title: "Nome de Usuário Impecável",
      reason: "O nome de usuário '@anasilva.carreira' é extremamente fácil de memorizar e transmite profissionalismo imediato."
    },
    {
      criterion_id: "content.educational_value",
      title: "Conteúdo Altamente Educativo",
      reason: "Seus carrosséis entregam dicas práticas e aplicáveis, criando uma forte conexão de reciprocidade com o leitor."
    },
    {
      criterion_id: "authority.humanization",
      title: "Excelente Conexão Humana",
      reason: "Sua foto de perfil é amigável e profissional, gerando simpatia e quebrando o gelo corporativo."
    }
  ],
  critical_gaps: [
    {
      criterion_id: "conversion.explicit_cta",
      title: "Falta de Chamada para Ação (CTA)",
      reason: "A bio termina sem instruir o visitante sobre o que fazer a seguir, deixando o link sem propósito explícito.",
      impact: "Dezenas de visitantes qualificados acessam seu perfil, mas saem sem clicar no seu contato simplesmente por falta de orientação."
    },
    {
      criterion_id: "seo.name_keyword",
      title: "Nome Sem Palavras-chave de Busca",
      reason: "Usar apenas seu nome próprio no campo de destaque impede que você seja encontrada na barra de buscas do Instagram por termos do seu nicho.",
      impact: "Seu perfil fica totalmente dependente de tráfego pago ou compartilhamentos externos para ser descoberto."
    },
    {
      criterion_id: "authority.social_proof",
      title: "Ausência de Provas Sociais",
      reason: "Não há depoimentos, prints de WhatsApp de agradecimento ou casos de transições bem-sucedidas nos seus destaques.",
      impact: "Mesmo que gostem do seu conteúdo, as pessoas hesitam em comprar porque não vêem evidências de que seu método já deu certo para outros."
    }
  ],
  recommended_actions: [
    {
      criterion_id: "seo.name_keyword",
      title: "Otimizar Campo do Nome para SEO",
      instruction: "Altere seu nome de 'Ana Silva' para 'Ana Silva | Transição de Carreira' ou 'Ana Silva | Mentora de Carreira'.",
      effort: "low",
      expected_effect: "Seu perfil começará a aparecer organicamente quando usuários pesquisarem pelo seu nicho de atuação."
    },
    {
      criterion_id: "conversion.explicit_cta",
      title: "Adicionar CTA Clara na Bio",
      instruction: "Insira uma última linha chamativa na bio, logo acima do link, por exemplo: '👇 Agende sua Sessão de Transição Experimental clicando abaixo:'",
      effort: "low",
      expected_effect: "Reduz o atrito de decisão do visitante, direcionando a atenção diretamente para a ação de contato prioritária."
    },
    {
      criterion_id: "conversion.highlights_journey",
      title: "Estruturar Destaques em Funil",
      instruction: "Crie e ordene 3 destaques principais: 1. 'COMECE AQUI' (sua história e metodologia), 2. 'RESULTADOS' (depoimentos de clientes), 3. 'MENTORIA' (como contratar, benefícios, CTA).",
      effort: "medium",
      expected_effect: "Apresenta a jornada metodológica e depoimentos de forma estruturada para novos visitantes."
    },
    {
      criterion_id: "authority.social_proof",
      title: "Publicar Post de Estudo de Caso",
      instruction: "Escreva um post em carrossel contando a história de transição de um mentorado seu (anonimizando se necessário), mostrando o antes, a estratégia aplicada e o cargo atual dele.",
      effort: "medium",
      expected_effect: "Demonstra aplicação prática da sua metodologia e esclarece o processo para potenciais clientes."
    },
    {
      criterion_id: "seo.link_clarity",
      title: "Simplificar o Link da Bio",
      instruction: "Substitua o Linktree poluído por um link direto para o seu WhatsApp comercial ou uma página de captura focada única e exclusivamente na aplicação da mentoria.",
      effort: "low",
      expected_effect: "Reduz opções conflitantes, facilitando o direcionamento para o canal prioritário."
    }
  ],
  tomorrow_action: {
    "criterion_id": "seo.name_keyword",
    "title": "Configurar SEO no Campo de Nome",
    "instruction": "Abra as configurações do seu perfil e altere o campo 'Nome' de 'Ana Silva' para 'Ana Silva | Mentora de Carreira'. Essa mudança aumenta a relevância estrutural do perfil nas buscas por termos do nicho."
  },
  disclaimer: "Este diagnóstico mede a preparação e conformidade estrutural do perfil com a metodologia C.A.G.E. Trata-se de uma simulação analítica e não representa garantia de crescimento, alcance ou vendas."
};

export const DEMO_SCORING: ScoringResult = {
  score: 64,
  coverage: 100,
  overallConfidence: 0.92,
  categories: {
    positioning: {
      categoryId: "positioning",
      name: "Posicionamento e Clareza",
      score: 15.0,
      maxPoints: 25,
      percentage: 60,
      gradeAverage: 2.40
    },
    seo: {
      categoryId: "seo",
      name: "Descoberta, Nome e SEO",
      score: 9.0,
      maxPoints: 15,
      percentage: 60,
      gradeAverage: 2.40
    },
    conversion: {
      categoryId: "conversion",
      name: "Oferta, CTA e Conversão",
      score: 11.2,
      maxPoints: 20,
      percentage: 56,
      gradeAverage: 2.00
    },
    content: {
      categoryId: "content",
      name: "Estratégia de Conteúdo",
      score: 17.5,
      maxPoints: 25,
      percentage: 70,
      gradeAverage: 2.50
    },
    authority: {
      categoryId: "authority",
      name: "Autoridade e Confiança",
      score: 11.3,
      maxPoints: 15,
      percentage: 75,
      gradeAverage: 2.60
    }
  },
  targetScore: 78,
  strongestCategory: {
    categoryId: "authority",
    name: "Autoridade e Confiança",
    score: 11.3,
    maxPoints: 15,
    percentage: 75,
    gradeAverage: 2.60
  }
};
