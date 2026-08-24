import { ContentMemory, CagePillarId, ContentFormatType } from "../../types/content-engine";
import { UserFeedbackRecord, FeedbackRating, FeedbackReason } from "../../types/intelligence";

export interface ContentHistoryRecord {
  id: string;
  title: string;
  theme: string;
  hook: string;
  cta: string;
  format: ContentFormatType;
  angle?: string;
  structure?: string;
  pillar: CagePillarId;
  qualityScore?: number;
  performanceScore?: number; // e.g. 0-100 based on engagement or user marking
  feedbackRating?: FeedbackRating;
  feedbackReason?: FeedbackReason;
  feedbackNote?: string;
  createdAt: string;
}

export interface ExpandedContentMemory extends ContentMemory {
  historyRecords?: ContentHistoryRecord[];
  feedbackHistory?: UserFeedbackRecord[];
  usedAngles?: string[];
  usedStructures?: string[];
}

/**
 * Normalizes text to extract semantic tokens for fingerprint comparison
 */
export function createContentFingerprint(text: string): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Calculates Jaccard similarity index between two token sets
 */
export function calculateSimilarity(textA: string, textB: string): number {
  const fpA = createContentFingerprint(textA);
  const fpB = createContentFingerprint(textB);

  if (!fpA || !fpB) return 0;
  if (fpA === fpB) return 1.0;

  const tokensA = new Set(fpA.split(" ").filter(t => t.length > 3));
  const tokensB = new Set(fpB.split(" ").filter(t => t.length > 3));

  if (tokensA.size === 0 || tokensB.size === 0) return 0;

  const intersection = new Set([...tokensA].filter(x => tokensB.has(x)));
  const union = new Set([...tokensA, ...tokensB]);

  return intersection.size / union.size;
}

/**
 * Checks if a generated hook or theme is too similar to past generated items
 */
export function isDuplicateOrRepetitive(
  candidateTheme: string,
  candidateHook: string,
  memory: ContentMemory,
  threshold = 0.55
): { isDuplicate: boolean; matchedTheme?: string; similarityScore: number } {
  let highestSimilarity = 0;
  let matched = "";

  for (const usedTheme of memory.usedThemes || []) {
    const sim = calculateSimilarity(candidateTheme, usedTheme);
    if (sim > highestSimilarity) {
      highestSimilarity = sim;
      matched = usedTheme;
    }
  }

  for (const usedHook of memory.usedHooks || []) {
    const sim = calculateSimilarity(candidateHook, usedHook);
    if (sim > highestSimilarity) {
      highestSimilarity = sim;
      matched = usedHook;
    }
  }

  return {
    isDuplicate: highestSimilarity >= threshold,
    matchedTheme: matched || undefined,
    similarityScore: Number(highestSimilarity.toFixed(2))
  };
}

/**
 * Checks for theme fatigue (e.g. if the same broad topic was used 3+ times in recent memory)
 */
export function checkThemeFatigue(candidateTheme: string, memory: ContentMemory, maxOccurrences = 3): boolean {
  const fp = createContentFingerprint(candidateTheme);
  const count = (memory.usedThemes || []).filter(t => calculateSimilarity(t, fp) > 0.6).length;
  return count >= maxOccurrences;
}

/**
 * Updates in-memory content history (standard legacy compatibility)
 */
export function recordContentInMemory(
  memory: ContentMemory,
  theme: string,
  hook: string,
  cta: string,
  pillar: CagePillarId
): ContentMemory {
  const updatedThemes = Array.from(new Set([theme, ...(memory.usedThemes || [])])).slice(0, 100);
  const updatedHooks = Array.from(new Set([hook, ...(memory.usedHooks || [])])).slice(0, 100);
  const updatedCtas = Array.from(new Set([cta, ...(memory.usedCtas || [])])).slice(0, 50);

  const distribution = {
    conversion: memory.pillarDistribution?.conversion || 0,
    authority: memory.pillarDistribution?.authority || 0,
    growth: memory.pillarDistribution?.growth || 0,
    expression: memory.pillarDistribution?.expression || 0
  };
  distribution[pillar] = (distribution[pillar] || 0) + 1;

  const fingerprints = [
    createContentFingerprint(theme),
    createContentFingerprint(hook),
    ...(memory.fingerprints || [])
  ].slice(0, 200);

  return {
    userId: memory.userId,
    usedThemes: updatedThemes,
    usedHooks: updatedHooks,
    usedCtas: updatedCtas,
    pillarDistribution: distribution,
    fingerprints,
    lastUpdated: new Date().toISOString()
  };
}

/**
 * Records full structured content generation event for V13 Learning Engine consumption
 */
export function recordExpandedContentInMemory(
  memory: ExpandedContentMemory,
  record: ContentHistoryRecord
): ExpandedContentMemory {
  const baseMemory = recordContentInMemory(
    memory,
    record.theme,
    record.hook,
    record.cta,
    record.pillar
  );

  const existingRecords = memory.historyRecords || [];
  const updatedRecords = [record, ...existingRecords.filter(r => r.id !== record.id)].slice(0, 100);

  const updatedAngles = record.angle 
    ? Array.from(new Set([record.angle, ...(memory.usedAngles || [])])).slice(0, 50)
    : (memory.usedAngles || []);

  const updatedStructures = record.structure
    ? Array.from(new Set([record.structure, ...(memory.usedStructures || [])])).slice(0, 50)
    : (memory.usedStructures || []);

  return {
    ...baseMemory,
    historyRecords: updatedRecords,
    feedbackHistory: memory.feedbackHistory || [],
    usedAngles: updatedAngles,
    usedStructures: updatedStructures
  };
}

/**
 * Attaches user feedback to a memory record and updates feedback history
 */
export function recordFeedbackInMemory(
  memory: ExpandedContentMemory,
  feedback: UserFeedbackRecord
): ExpandedContentMemory {
  const existingFeedback = memory.feedbackHistory || [];
  const updatedFeedback = [feedback, ...existingFeedback.filter(f => f.id !== feedback.id)].slice(0, 100);

  const updatedHistory = (memory.historyRecords || []).map(rec => {
    if (rec.id === feedback.contentId || rec.title === feedback.title) {
      return {
        ...rec,
        feedbackRating: feedback.rating,
        feedbackReason: feedback.reason,
        feedbackNote: feedback.customNote
      };
    }
    return rec;
  });

  return {
    ...memory,
    historyRecords: updatedHistory,
    feedbackHistory: updatedFeedback,
    lastUpdated: new Date().toISOString()
  };
}

