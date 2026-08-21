import { GrowthScores } from "./DigitalTwin";

// Módulo 8: Growth Engine
// Responsável por derivar indicadores analíticos determinísticos a partir do score base C.A.G.E.
// Todos os indicadores são simulações analíticas limitadas ao intervalo [0, 100].

export class GrowthEngine {
  /**
   * Deriva os scores táticos iniciais baseados no score C.A.G.E. do diagnóstico.
   * Todos os scores gerados são baselines analíticos limitados estritamente entre 0 e 100.
   */
  static bootstrapScores(baseScore: number): GrowthScores {
    const clamp = (val: number, min = 0, max = 100) => Math.min(max, Math.max(min, Math.round(val)));
    const cleanBase = clamp(baseScore);

    return {
      overallScore: cleanBase,
      
      // Indicadores táticos derivados determinísticos
      executionScore: clamp(cleanBase * 0.85, 10, 100),
      consistencyScore: clamp(cleanBase * 0.70, 10, 100),
      momentumScore: clamp(cleanBase * 1.1, 0, 100),
      
      // Baseline heurístico de aprendizado
      learningScore: 100, 
      
      // Velocidades estruturais derivadas
      authorityVelocity: clamp(cleanBase * 0.8, 10, 100),
      growthVelocity: clamp(cleanBase * 1.05, 0, 100),
      conversionVelocity: clamp(cleanBase * 0.6, 5, 100), 
    };
  }

  /**
   * Atualiza os scores com base em uma nova ação executada (limitado a 100).
   */
  static processActionImpact(currentScores: GrowthScores, actionMultiplier: number): GrowthScores {
    const clamp = (val: number) => Math.min(100, Math.max(0, Math.round(val)));
    return {
      ...currentScores,
      executionScore: clamp(currentScores.executionScore + (2 * actionMultiplier))
    };
  }
}
