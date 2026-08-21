import { DigitalTwin } from "../../core/DigitalTwin";

export interface PredictionResult {
  actionTarget: string; // "Bio", "Nome", "Destaques", etc.
  scoreImpact: number;
  conversionImpact: number;
  authorityImpact: number;
  confidence: number;
  timeToROI: string;
}

export class PredictionEngine {
  /**
   * Avalia o impacto matemático de uma mudança ANTES do usuário executar,
   * cruzando a intenção com os gargalos do DigitalTwin.
   */
  static predictImpact(twin: DigitalTwin, actionTarget: "Bio" | "Nome" | "Destaques" | "Prova Social" | string): PredictionResult {
    let scoreMultiplier = 1.0;
    let conversionMultiplier = 1.0;
    let confidenceBase = 70;
    let timeToROI = "7 dias";

    // 1. Contexto do DigitalTwin altera o peso das predições
    // Se o nicho for altamente estético, "Destaques" tem mais impacto na autoridade.
    if (twin.identity.niche.toLowerCase().includes("estética") || twin.identity.visualStyle.toLowerCase().includes("minimalista")) {
       if (actionTarget === "Destaques") {
          scoreMultiplier = 1.5;
          confidenceBase = 85;
       }
    }

    // Se o gargalo é conversão, mudar a Bio (onde fica o CTA) tem impacto massivo.
    const conversionVelocity = twin?.metrics?.conversionVelocity || 40;
    const executionScore = twin?.metrics?.executionScore || 45;
    const overallScore = twin?.metrics?.overallScore || 50;

    if (conversionVelocity < 30) {
      if (actionTarget === "Bio") {
         conversionMultiplier = 3.0;
         scoreMultiplier = 1.8;
         confidenceBase = 92;
         timeToROI = "48 horas (Imediato)";
      }
    }

    // 2. Base Heurística (Conforme Módulo 3)
    let baseImpact = 0;
    let authorityBase = 0;

    switch (actionTarget) {
      case "Bio":
        baseImpact = 8;
        authorityBase = 4;
        break;
      case "Nome":
        baseImpact = 5;
        authorityBase = 2;
        timeToROI = "14 dias (Algoritmo de Busca)";
        break;
      case "Destaques":
        baseImpact = 4;
        authorityBase = 6;
        break;
      case "Prova Social":
        baseImpact = 12;
        authorityBase = 15;
        conversionMultiplier *= 1.5;
        timeToROI = "Imediato";
        break;
      default:
        baseImpact = 3;
        authorityBase = 2;
    }

    const finalScoreImpact = Math.round(baseImpact * scoreMultiplier);
    
    // Penaliza a confiança se o Execution Score for baixo (o usuário pode fazer a mudança mal feita)
    const finalConfidence = executionScore < 50 
      ? Math.max(50, confidenceBase - 15) 
      : Math.min(99, confidenceBase + (executionScore / 10));

    return {
      actionTarget,
      scoreImpact: overallScore + finalScoreImpact,
      conversionImpact: Number((baseImpact * 0.8 * conversionMultiplier).toFixed(1)),
      authorityImpact: Number((authorityBase * scoreMultiplier).toFixed(1)),
      confidence: Math.round(finalConfidence),
      timeToROI
    };
  }
}
