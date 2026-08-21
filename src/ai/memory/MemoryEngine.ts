import { DigitalTwin } from "../../core/DigitalTwin";

export type MemoryActionType = "PROFILE_UPDATE" | "CONTENT_POSTED" | "STRATEGY_CHANGE" | "SYSTEM_DIAGNOSIS";

export interface MemoryNode {
  id: string;
  timestamp: string;
  actionType: MemoryActionType;
  context: Record<string, any>;
  impact: {
    scoreDelta?: number;
    conversionDelta?: number;
    authorityDelta?: number;
  };
  insights: string[];
}

export class MemoryEngine {
  static recordEvent(twin: DigitalTwin, action: Omit<MemoryNode, "id" | "timestamp" | "insights">): MemoryNode {
    const newNode: MemoryNode = {
      id: `mem_${Date.now()}`,
      timestamp: new Date().toISOString(),
      ...action,
      insights: this.generateInsights(twin, action)
    };
    return newNode;
  }

  private static generateInsights(twin: DigitalTwin, action: Omit<MemoryNode, "id" | "timestamp" | "insights">): string[] {
    const insights: string[] = [];
    const executionScore = twin?.metrics?.executionScore || 50;
    const conversionVelocity = twin?.metrics?.conversionVelocity || 40;
    
    if (action.actionType === "PROFILE_UPDATE" && action.impact.scoreDelta && action.impact.scoreDelta > 0) {
      if (executionScore < 50) {
         insights.push("Você frequentemente melhora SEO primeiro, mas perde consistência em poucas semanas.");
      } else {
         insights.push("Mudanças estruturais no perfil estão gerando ROI consistente.");
      }
    }
    
    if (conversionVelocity < 20) {
      insights.push("Seu maior gargalo continua sendo a conversão. Ajustes visuais não resolverão a falta de CTA.");
    }
    
    return insights;
  }

  static getHistoricalContext(twin: DigitalTwin): string[] {
    const context: string[] = [];
    const executionScore = twin?.metrics?.executionScore || 50;
    
    if (twin.historyData && twin.historyData.events && twin.historyData.events.length > 3) {
       context.push("Usuário apresenta padrão de engajamento emocional elevado, o que gera mais retenção.");
    }

    if (executionScore > 70) {
       context.push("Alta taxa de execução. O sistema pode recomendar tarefas mais avançadas.");
    } else {
       context.push("Baixa consistência. O sistema deve sugerir micro-ações de fácil execução (Quick Wins).");
    }

    return context;
  }
}
