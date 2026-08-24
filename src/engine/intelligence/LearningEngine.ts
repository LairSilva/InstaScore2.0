/**
 * INSTASCORE OS V13 — LEARNING ENGINE
 * Transforms historical content, feedback, and performance into evidence-based, incremental insights.
 * Guarantees that small samples are labeled with appropriate confidence and never treated as absolute rules.
 */

import { DigitalTwin } from "../../core/DigitalTwin";
import { 
  EvolutionaryInsight, 
  TwinPerformance, 
  TwinBehavior, 
  UserFeedbackRecord 
} from "../../types/intelligence";
import { ExpandedContentMemory, ContentHistoryRecord } from "../content/ContentMemoryEngine";
import { ContentFormatType, CagePillarId } from "../../types/content-engine";

export interface LearningEngineAnalysisResult {
  updatedTwin: DigitalTwin;
  generatedInsights: EvolutionaryInsight[];
  performanceSummary: TwinPerformance;
  behaviorSummary: TwinBehavior;
}

export class LearningEngine {
  /**
   * Calculates mathematical statistical confidence based on observation sample size and consistency
   */
  static calculateConfidence(sampleCount: number, consistencyRate: number): number {
    if (sampleCount <= 0) return 40;
    if (sampleCount === 1) return 55;
    if (sampleCount === 2) return 65;
    if (sampleCount < 10) {
      return Math.min(78, Math.round(65 + (sampleCount * 1.3 * Math.max(0.3, consistencyRate))));
    }
    if (sampleCount < 30) {
      return Math.min(88, Math.round(76 + ((sampleCount - 10) * 0.6 * Math.max(0.3, consistencyRate))));
    }
    
    // 30+ samples with high consistency
    const base = 82;
    const sampleBonus = Math.min(10, (sampleCount - 30) * 0.5);
    const consistencyBonus = (consistencyRate - 0.5) * 10;
    return Math.min(96, Math.max(70, Math.round(base + sampleBonus + consistencyBonus)));
  }

  /**
   * Evaluates historical records and user feedback to update Digital Twin learning memory
   */
  static processLearning(
    twin: DigitalTwin,
    memory?: ExpandedContentMemory | null,
    recentFeedback?: UserFeedbackRecord[]
  ): LearningEngineAnalysisResult {
    const historyRecords: ContentHistoryRecord[] = memory?.historyRecords || [];
    const feedbackList: UserFeedbackRecord[] = [
      ...(recentFeedback || []),
      ...(memory?.feedbackHistory || [])
    ];

    const currentInsights: EvolutionaryInsight[] = [...(twin.learningInsights || [])];
    const newInsights: EvolutionaryInsight[] = [];
    const nowIso = new Date().toISOString();

    // 1. FORMAT PERFORMANCE & BEHAVIOR ANALYSIS
    const formatCounts: Record<ContentFormatType, { total: number; positive: number; negative: number; avgQuality: number }> = {
      carousel: { total: 0, positive: 0, negative: 0, avgQuality: 0 },
      reel: { total: 0, positive: 0, negative: 0, avgQuality: 0 },
      post: { total: 0, positive: 0, negative: 0, avgQuality: 0 },
      story: { total: 0, positive: 0, negative: 0, avgQuality: 0 }
    };

    for (const rec of historyRecords) {
      if (formatCounts[rec.format]) {
        formatCounts[rec.format].total += 1;
        if (rec.feedbackRating === "excellent" || rec.feedbackRating === "good") {
          formatCounts[rec.format].positive += 1;
        } else if (rec.feedbackRating === "does_not_fit" || rec.feedbackRating === "makes_no_sense") {
          formatCounts[rec.format].negative += 1;
        }
      }
    }

    // Identify Winning & Low Performing Formats
    const winningFormats: ContentFormatType[] = [];
    const lowPerfPatterns: string[] = [];

    for (const [fmt, stats] of Object.entries(formatCounts) as [ContentFormatType, typeof formatCounts[ContentFormatType]][]) {
      if (stats.total >= 2) {
        const approvalRate = stats.total > 0 ? (stats.positive / stats.total) : 0.5;
        if (stats.positive >= 2 && stats.negative === 0) {
          winningFormats.push(fmt);
          const confidence = this.calculateConfidence(stats.total, approvalRate);
          newInsights.push({
            id: `ins-fmt-${fmt}-${Date.now()}`,
            insight: `Formato "${fmt.toUpperCase()}" possui alta aceitação e consistência estratégica no perfil.`,
            source: "profile_history",
            evidence: `Amostra de ${stats.total} publicações com ${stats.positive} aprovações positivas.`,
            sampleCount: stats.total,
            confidence,
            category: "format",
            lastUpdated: nowIso
          });
        } else if (stats.negative >= 2) {
          lowPerfPatterns.push(`Formato ${fmt} com baixa aderência percebida (${stats.negative} rejeições)`);
        }
      }
    }

    // 2. THEME & ANGLE ANALYSIS
    const angleCounts: Record<string, { total: number; positive: number }> = {};
    for (const rec of historyRecords) {
      if (rec.angle) {
        if (!angleCounts[rec.angle]) angleCounts[rec.angle] = { total: 0, positive: 0 };
        angleCounts[rec.angle].total += 1;
        if (rec.feedbackRating === "excellent" || rec.feedbackRating === "good") {
          angleCounts[rec.angle].positive += 1;
        }
      }
    }

    for (const [angle, stats] of Object.entries(angleCounts)) {
      if (stats.total >= 2 && stats.positive >= 2) {
        const confidence = this.calculateConfidence(stats.total, stats.positive / stats.total);
        newInsights.push({
          id: `ins-ang-${angle.replace(/\s+/g, "_")}-${Date.now()}`,
          insight: `Ângulo "${angle}" demonstra forte conexão com a audiência e clareza de autoridade.`,
          source: "profile_history",
          evidence: `Observado em ${stats.total} conteúdos com feedback favorável contínuo.`,
          sampleCount: stats.total,
          confidence,
          category: "angle",
          lastUpdated: nowIso
        });
      }
    }

    // 3. FEEDBACK INTEGRATION (Explicit User Dislikes)
    for (const fb of feedbackList) {
      if (fb.rating === "does_not_fit" || fb.rating === "makes_no_sense") {
        const reasonDesc = fb.reason === "not_my_audience" ? "não ressoa com o público-alvo" :
                          fb.reason === "already_spoke_about_this" ? "tema saturado ou já abordado" :
                          fb.reason === "dont_want_to_appear" ? "preferência por não aparecer em vídeo" :
                          fb.reason === "doesnt_represent_brand" ? "desalinhado com o posicionamento da marca" :
                          "desalinhado com as prioridades atuais";

        const subject = fb.theme || fb.title || "Abordagem recente";
        newInsights.push({
          id: `ins-fb-${fb.id || Date.now()}`,
          insight: `Evitar "${subject}" (${reasonDesc}).`,
          source: "user_feedback",
          evidence: `Feedback explícito do criador: "${fb.customNote || reasonDesc}".`,
          sampleCount: 1,
          confidence: 88, // Explicit user feedback has high immediate confidence for vetoes
          category: "theme",
          lastUpdated: nowIso
        });
      }
    }

    // Merge insights without duplicates, keeping latest
    const combinedInsightsMap = new Map<string, EvolutionaryInsight>();
    for (const ins of [...currentInsights, ...newInsights]) {
      combinedInsightsMap.set(ins.insight, ins);
    }
    const finalInsights = Array.from(combinedInsightsMap.values()).slice(-15);

    // Build Behavior summary
    const behaviorSummary: TwinBehavior = {
      postingFrequency: twin.behavior?.postingFrequency || "4-5x / semana",
      formatsUsed: {
        carousel: formatCounts.carousel.total,
        reel: formatCounts.reel.total,
        post: formatCounts.post.total,
        story: formatCounts.story.total
      },
      themesUsed: Array.from(new Set([...(twin.behavior?.themesUsed || []), ...historyRecords.map(r => r.theme)])).slice(0, 30),
      ctasUsed: Array.from(new Set([...(twin.behavior?.ctasUsed || []), ...historyRecords.map(r => r.cta)])).slice(0, 20),
      hooksUsed: Array.from(new Set([...(twin.behavior?.hooksUsed || []), ...historyRecords.map(r => r.hook)])).slice(0, 30)
    };

    // Build Performance summary
    const performanceSummary: TwinPerformance = {
      topPerformingContents: historyRecords
        .filter(r => r.feedbackRating === "excellent" || (r.qualityScore && r.qualityScore >= 85))
        .map(r => ({
          id: r.id,
          title: r.title,
          format: r.format,
          hook: r.hook,
          pillar: r.pillar,
          score: r.qualityScore || 90
        })).slice(0, 10),
      winningFormats: winningFormats.length > 0 ? winningFormats : (twin.performance?.winningFormats || ["carousel", "reel"]),
      winningThemes: Array.from(new Set(historyRecords.filter(r => r.feedbackRating === "excellent").map(r => r.theme))),
      winningHooks: Array.from(new Set(historyRecords.filter(r => r.feedbackRating === "excellent").map(r => r.hook))),
      winningCtas: Array.from(new Set(historyRecords.filter(r => r.feedbackRating === "excellent").map(r => r.cta))),
      lowPerformancePatterns: lowPerfPatterns
    };

    const updatedTwin: DigitalTwin = {
      ...twin,
      learningInsights: finalInsights,
      behavior: behaviorSummary,
      performance: performanceSummary,
      lastLearningUpdate: nowIso
    };

    return {
      updatedTwin,
      generatedInsights: newInsights,
      performanceSummary,
      behaviorSummary
    };
  }
}
