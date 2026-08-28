/**
 * INSTASCORE OS V14 — CAROUSEL STRUCTURE ENGINE
 * Generates tailored narrative architectures slide by slide.
 * Never relies on static one-size-fits-all templates.
 */

import { CarouselRole } from "../../types/carousel-engine";
import { ContentObjectiveType } from "../../types/content-engine";

export interface NarrativeSlideBlueprint {
  slideNumber: number;
  role: CarouselRole;
  roleLabel: string;
  narrativeGoal: string;
  suggestedLayout: string;
  suggestedVisual: string;
}

export class CarouselStructureEngine {
  /**
   * Generates the structured narrative blueprint based on slide count and strategic context
   */
  static generateNarrativeArc(
    slideCount: 5 | 7 | 8 | 10 | 12,
    objective: ContentObjectiveType,
    funnelStage: "topo" | "meio" | "fundo",
    strategicAngle: string
  ): NarrativeSlideBlueprint[] {
    switch (slideCount) {
      case 5:
        return [
          {
            slideNumber: 1,
            role: "hook",
            roleLabel: "Hook / Capa de Ruptura",
            narrativeGoal: "Parar a rolagem imediatamente atacando um ponto cego ou crença do nicho.",
            suggestedLayout: "Fundo contrastante, tipografia imponente, elemento de foco único.",
            suggestedVisual: "Texto em caixa alta com destaque colorido em uma palavra-chave."
          },
          {
            slideNumber: 2,
            role: "problem",
            roleLabel: "Problema & Tensão",
            narrativeGoal: "Mostrar o custo invisível de insistir no método comum.",
            suggestedLayout: "Layout dividido ou card de comparação.",
            suggestedVisual: "Ícone de alerta ou print simulado com marcação de erro."
          },
          {
            slideNumber: 3,
            role: "insight",
            roleLabel: "Insight & Virada de Chave",
            narrativeGoal: "Apresentar a nova perspectiva ou o princípio fundamental.",
            suggestedLayout: "Citação em destaque com tipografia serifada ou moderna.",
            suggestedVisual: "Foco na frase-chave centralizada com alto respiro visual."
          },
          {
            slideNumber: 4,
            role: "mechanism",
            roleLabel: "Mecanismo & Aplicação",
            narrativeGoal: "Entregar a solução prática e o passo a passo direto.",
            suggestedLayout: "Lista numerada de 3 itens escaneáveis.",
            suggestedVisual: "Badges numeradas 01, 02, 03 com micro-instruções."
          },
          {
            slideNumber: 5,
            role: "cta",
            roleLabel: "Ação & CTA Estratégica",
            narrativeGoal: "Conduzir à conversão ou retenção com comando claro.",
            suggestedLayout: "Card de fechamento com foto/avatar, assinatura e botão visual.",
            suggestedVisual: "Seta de ação apontando para o Direct ou ícone de salvamento."
          }
        ];

      case 8:
        return [
          {
            slideNumber: 1,
            role: "hook",
            roleLabel: "Hook / Capa",
            narrativeGoal: "Capturar atenção com afirmação contra-intuitiva ou contraste forte.",
            suggestedLayout: "Capa minimalista de alto contraste com subtítulo provocativo.",
            suggestedVisual: "Headline forte + indicador visual de arraste sutil."
          },
          {
            slideNumber: 2,
            role: "problem",
            roleLabel: "O Erro Silencioso",
            narrativeGoal: "Identificar o comportamento exato que gera estagnação no perfil.",
            suggestedLayout: "Card de diagnóstico com problema em evidência.",
            suggestedVisual: "Badge 'O QUE PARECE CERTO' vs 'O QUE REALMENTE ACONTECE'."
          },
          {
            slideNumber: 3,
            role: "tension",
            roleLabel: "Tensão / Por que o Mercado Erra",
            narrativeGoal: "Desconstruir as soluções rasas que o público já tentou sem sucesso.",
            suggestedLayout: "Duas colunas de contraste ou lista de mitos.",
            suggestedVisual: "Gráfico conceitual simples ou marcador de 'Custo da Inércia'."
          },
          {
            slideNumber: 4,
            role: "insight",
            roleLabel: "O Ponto de Virada",
            narrativeGoal: "Revelar a lógica por trás de quem tem resultados consistentes.",
            suggestedLayout: "Bloco de texto com destaque de alta legibilidade.",
            suggestedVisual: "Fundo com textura escura e tipografia limpa em evidência."
          },
          {
            slideNumber: 5,
            role: "mechanism",
            roleLabel: "O Método / Framework",
            narrativeGoal: "Apresentar o modelo mental ou ferramenta proprietária.",
            suggestedLayout: "Diagrama em 3 etapas sequenciais.",
            suggestedVisual: "Fluxograma clean com conectores visuais."
          },
          {
            slideNumber: 6,
            role: "application",
            roleLabel: "Aplicação Prática",
            narrativeGoal: "Mostrar como executar hoje em menos de 15 minutos.",
            suggestedLayout: "Checklist com caixas de seleção estilizadas.",
            suggestedVisual: "Checkmarks verdes e comandos práticos objetivos."
          },
          {
            slideNumber: 7,
            role: "proof",
            roleLabel: "Prova / Evidência de Resultado",
            narrativeGoal: "Validar a eficácia através de caso, métrica ou transformação.",
            suggestedLayout: "Card de resultado ou dados numéricos em destaque.",
            suggestedVisual: "Números grandes ou depoimento/resultado antes e depois."
          },
          {
            slideNumber: 8,
            role: "cta",
            roleLabel: "CTA & Próximo Passo",
            narrativeGoal: "Direcionar para a ação principal alinhada ao objetivo.",
            suggestedLayout: "Fechamento com bio do autor e gatilho de Direct.",
            suggestedVisual: "Ícone de Direct estilizado com a palavra-chave em destaque."
          }
        ];

      case 10:
        return [
          {
            slideNumber: 1,
            role: "hook",
            roleLabel: "Hook / Capa de Masterclass",
            narrativeGoal: "Promessa de maestria e desmistificação completa de um tema complexo.",
            suggestedLayout: "Título editorial com subtítulo estruturado.",
            suggestedVisual: "Design editorial limpo com marcação de série ou guia definitivo."
          },
          {
            slideNumber: 2,
            role: "problem",
            roleLabel: "Contexto & Sintomas",
            narrativeGoal: "Fazer o leitor se reconhecer na dor imediatamente.",
            suggestedLayout: "Lista de 3 sintomas comuns.",
            suggestedVisual: "Cards escuros com marcadores de texto precisos."
          },
          {
            slideNumber: 3,
            role: "tension",
            roleLabel: "A Causa Raiz",
            narrativeGoal: "Explicar por que os sintomas persistem apesar do esforço.",
            suggestedLayout: "Estrutura de contraste 'Causa vs Efeito'.",
            suggestedVisual: "Destaque na causa oculta com tipografia de ênfase."
          },
          {
            slideNumber: 4,
            role: "insight",
            roleLabel: "Princípio de Solução",
            narrativeGoal: "Mudar a mentalidade antes de ensinar os passos técnicos.",
            suggestedLayout: "Frase de impacto centralizada.",
            suggestedVisual: "Grande respiro visual e peso tipográfico."
          },
          {
            slideNumber: 5,
            role: "mechanism",
            roleLabel: "Visão Geral do Método",
            narrativeGoal: "Apresentar a jornada de 3 fases que será detalhada a seguir.",
            suggestedLayout: "Card resumo com 3 blocos.",
            suggestedVisual: "Ícones representativos das 3 etapas."
          },
          {
            slideNumber: 6,
            role: "step",
            roleLabel: "Passo 1 — Diagnóstico",
            narrativeGoal: "Instrução técnica do primeiro estágio de implementação.",
            suggestedLayout: "Bloco numerado 'PASSO 01' com exemplo.",
            suggestedVisual: "Foco no comando prático e no que NÃO fazer."
          },
          {
            slideNumber: 7,
            role: "step",
            roleLabel: "Passo 2 — Execução",
            narrativeGoal: "Instrução técnica do segundo estágio de implementação.",
            suggestedLayout: "Bloco numerado 'PASSO 02' com exemplo.",
            suggestedVisual: "Foco no comando prático e na métrica de validação."
          },
          {
            slideNumber: 8,
            role: "step",
            roleLabel: "Passo 3 — Otimização",
            narrativeGoal: "Instrução técnica do terceiro estágio para sustentação.",
            suggestedLayout: "Bloco numerado 'PASSO 03' com exemplo.",
            suggestedVisual: "Foco na escala e refinamento contínuo."
          },
          {
            slideNumber: 9,
            role: "proof",
            roleLabel: "Transformação & Contraste",
            narrativeGoal: "Consolidar a diferença entre o antes e o depois do método.",
            suggestedLayout: "Quadro comparativo 'SEM O MÉTODO' vs 'COM O MÉTODO'.",
            suggestedVisual: "Linhas limpas com colunas vermelho/verde suaves."
          },
          {
            slideNumber: 10,
            role: "cta",
            roleLabel: "CTA Final & Material Complementar",
            narrativeGoal: "Engajar ou converter com oferta de material complementar ou Direct.",
            suggestedLayout: "Banner de ação com chamada específica.",
            suggestedVisual: "Caixa de Direct com palavra-chave de ativação."
          }
        ];

      case 12:
        return [
          {
            slideNumber: 1,
            role: "hook",
            roleLabel: "Hook / Capa Completa",
            narrativeGoal: "Impacto inicial irresistível para um guia profundo e definitivo.",
            suggestedLayout: "Capa imponente com indicador 'Guia Completo'.",
            suggestedVisual: "Título magnético e marcação visual de autoridade."
          },
          {
            slideNumber: 2,
            role: "problem",
            roleLabel: "Contexto Inicial",
            narrativeGoal: "Estabelecer a premissa e qualificar o público certo.",
            suggestedLayout: "Texto contextual com escaneabilidade alta.",
            suggestedVisual: "Card com destaque em quem deve ler até o final."
          },
          {
            slideNumber: 3,
            role: "problem",
            roleLabel: "O Obstáculo Invisível",
            narrativeGoal: "Mapear o erro que consome tempo e recursos sem gerar retorno.",
            suggestedLayout: "Destaque para a armadilha mais comum.",
            suggestedVisual: "Ícone de aviso e bullets explicativos."
          },
          {
            slideNumber: 4,
            role: "tension",
            roleLabel: "Objeção Principal",
            narrativeGoal: "Antecipar a dúvida: 'Será que isso funciona para o meu caso?'.",
            suggestedLayout: "Pergunta provocativa em formato de citação.",
            suggestedVisual: "Caixa de diálogo simulada com a objeção do leitor."
          },
          {
            slideNumber: 5,
            role: "insight",
            roleLabel: "Desconstrução da Objeção",
            narrativeGoal: "Provar com lógica por que a objeção é um mito.",
            suggestedLayout: "Explicação lógica com argumento de autoridade.",
            suggestedVisual: "Fundo contrastante com argumento central em negrito."
          },
          {
            slideNumber: 6,
            role: "insight",
            roleLabel: "O Framework Central",
            narrativeGoal: "Apresentar a espinha dorsal do método de forma memorável.",
            suggestedLayout: "Diagrama do ecossistema.",
            suggestedVisual: "Esquema gráfico limpo das engrenagens da solução."
          },
          {
            slideNumber: 7,
            role: "step",
            roleLabel: "Fase 1 — Fundação",
            narrativeGoal: "Detalhar o ponto de partida indispensável.",
            suggestedLayout: "Passo detalhado com dica de ouro.",
            suggestedVisual: "Card 01 com badge 'ESSENCIAL'."
          },
          {
            slideNumber: 8,
            role: "step",
            roleLabel: "Fase 2 — Estruturação",
            narrativeGoal: "Detalhar o núcleo de execução técnica.",
            suggestedLayout: "Passo detalhado com exemplo real.",
            suggestedVisual: "Card 02 com badge 'EXECUÇÃO'."
          },
          {
            slideNumber: 9,
            role: "step",
            roleLabel: "Fase 3 — Conversão",
            narrativeGoal: "Detalhar a ponte para a monetização ou engajamento.",
            suggestedLayout: "Passo detalhado com modelo de mensagem.",
            suggestedVisual: "Card 03 com badge 'ESCALA'."
          },
          {
            slideNumber: 10,
            role: "application",
            roleLabel: "Caso Prático & Exemplo",
            narrativeGoal: "Mostrar como aplicar em um cenário real do nicho.",
            suggestedLayout: "Estudo de caso estruturado: Situação -> Ação -> Resultado.",
            suggestedVisual: "Print ou mock-up esquemático."
          },
          {
            slideNumber: 11,
            role: "action",
            roleLabel: "Checklist de Execução",
            narrativeGoal: "Recapitulação rápida para aplicação imediata.",
            suggestedLayout: "Tabela de 4 itens rápidos de verificação.",
            suggestedVisual: "Checklist minimalista com design de software."
          },
          {
            slideNumber: 12,
            role: "cta",
            roleLabel: "CTA de Alta Conversão",
            narrativeGoal: "Convite irrecusável para Direct ou próxima etapa.",
            suggestedLayout: "Fechamento com oferta do próximo passo.",
            suggestedVisual: "CTA com botão estilizado e instrução precisa."
          }
        ];

      case 7:
      default:
        return [
          {
            slideNumber: 1,
            role: "hook",
            roleLabel: "Hook / Capa",
            narrativeGoal: "Gerar curiosidade irresistível atacando um ponto cego comum do nicho.",
            suggestedLayout: "Tipografia em destaque no centro superior, fundo escuro com contraste.",
            suggestedVisual: "Headline forte de 2 a 3 linhas com palavra de ênfase em cor quente."
          },
          {
            slideNumber: 2,
            role: "problem",
            roleLabel: "O Grande Erro",
            narrativeGoal: "Explicar o erro que 90% das pessoas cometem acreditando estar no caminho certo.",
            suggestedLayout: "Card central com texto claro e direto.",
            suggestedVisual: "Destaque no contraste entre o que é comum e o que é eficiente."
          },
          {
            slideNumber: 3,
            role: "tension",
            roleLabel: "Tensão & Consequência",
            narrativeGoal: "Evidenciar o impacto negativo de continuar repetindo o mesmo comportamento.",
            suggestedLayout: "Duas linhas de raciocínio conectadas por seta.",
            suggestedVisual: "Marcador visual de consequência com tom de urgência sutil."
          },
          {
            slideNumber: 4,
            role: "insight",
            roleLabel: "A Virada de Chave",
            narrativeGoal: "Apresentar a nova perspectiva que desbloqueia os resultados.",
            suggestedLayout: "Citação ou princípio centralizado.",
            suggestedVisual: "Respiro visual amplo para fixar a ideia principal."
          },
          {
            slideNumber: 5,
            role: "mechanism",
            roleLabel: "O Framework Passo a Passo",
            narrativeGoal: "Entregar a sequência lógica de implementação.",
            suggestedLayout: "Estrutura em 3 etapas com números destacados.",
            suggestedVisual: "Lista limpa com passos curtos e verbos de ação."
          },
          {
            slideNumber: 6,
            role: "application",
            roleLabel: "Aplicação Prática",
            narrativeGoal: "Mostrar um exemplo prático pronto para copiar e adaptar.",
            suggestedLayout: "Card de exemplo 'Faça assim:' vs 'Não faça assim:'.",
            suggestedVisual: "Caixas comparativas verde/vermelho com texto escaneável."
          },
          {
            slideNumber: 7,
            role: "cta",
            roleLabel: "CTA Estratégica",
            narrativeGoal: "Indicar o próximo passo claro e alinhado com o objetivo.",
            suggestedLayout: "Card de encerramento com foto/perfil e comando de ação.",
            suggestedVisual: "Seta ou botão visual indicando salvamento ou Direct."
          }
        ];
    }
  }
}
