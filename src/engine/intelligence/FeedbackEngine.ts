/**
 * INSTASCORE OS V13 — FEEDBACK ENGINE
 * Allows the creator to teach the system what resonates and what to avoid.
 * Updates DigitalTwin preferences and triggers incremental learning.
 */

import { DigitalTwin } from "../../core/DigitalTwin";
import { UserFeedbackRecord, FeedbackRating, FeedbackReason, TwinPreferences } from "../../types/intelligence";
import { ExpandedContentMemory, recordFeedbackInMemory } from "../content/ContentMemoryEngine";
import { LearningEngine } from "./LearningEngine";

export class FeedbackEngine {
  /**
   * Applies user feedback, updates preferences and triggers evolutionary learning
   */
  static applyFeedback(
    twin: DigitalTwin,
    memory: ExpandedContentMemory,
    feedback: {
      contentId?: string;
      title?: string;
      theme?: string;
      format?: any;
      rating: FeedbackRating;
      reason?: FeedbackReason;
      customNote?: string;
    }
  ): {
    updatedTwin: DigitalTwin;
    updatedMemory: ExpandedContentMemory;
    feedbackRecord: UserFeedbackRecord;
  } {
    const feedbackRecord: UserFeedbackRecord = {
      id: `fb-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      contentId: feedback.contentId,
      title: feedback.title,
      theme: feedback.theme,
      format: feedback.format,
      rating: feedback.rating,
      reason: feedback.reason,
      customNote: feedback.customNote,
      createdAt: new Date().toISOString()
    };

    // 1. Update Content Memory with Feedback
    const updatedMemory = recordFeedbackInMemory(memory, feedbackRecord);

    // 2. Update Twin Preferences
    const currentPrefs: TwinPreferences = {
      approvedStrategies: [...(twin.preferences?.approvedStrategies || [])],
      rejectedStrategies: [...(twin.preferences?.rejectedStrategies || [])],
      rejectedFormats: [...(twin.preferences?.rejectedFormats || [])],
      excludedThemes: [...(twin.preferences?.excludedThemes || [])],
      preferredAngles: [...(twin.preferences?.preferredAngles || [])],
      userFeedbackNotes: [...(twin.preferences?.userFeedbackNotes || [])]
    };

    const isPositive = feedback.rating === "excellent" || feedback.rating === "good";
    const isNegative = feedback.rating === "does_not_fit" || feedback.rating === "makes_no_sense";

    if (isPositive) {
      if (feedback.title) {
        currentPrefs.approvedStrategies = Array.from(new Set([feedback.title, ...currentPrefs.approvedStrategies])).slice(0, 20);
      }
      if (feedback.theme) {
        currentPrefs.preferredAngles = Array.from(new Set([feedback.theme, ...currentPrefs.preferredAngles])).slice(0, 20);
      }
    } else if (isNegative) {
      if (feedback.theme) {
        currentPrefs.excludedThemes = Array.from(new Set([feedback.theme, ...currentPrefs.excludedThemes])).slice(0, 30);
      }
      if (feedback.reason === "disliked_format" && feedback.format) {
        currentPrefs.rejectedFormats = Array.from(new Set([feedback.format, ...currentPrefs.rejectedFormats]));
      }
      if (feedback.reason === "dont_want_to_appear" && feedback.format === "reel") {
        currentPrefs.rejectedFormats = Array.from(new Set(["reel" as any, ...currentPrefs.rejectedFormats]));
      }
      if (feedback.reason === "no_such_offer" && feedback.theme) {
        currentPrefs.excludedThemes = Array.from(new Set([feedback.theme, ...currentPrefs.excludedThemes]));
      }
      if (feedback.title) {
        currentPrefs.rejectedStrategies = Array.from(new Set([feedback.title, ...currentPrefs.rejectedStrategies])).slice(0, 20);
      }
    }

    if (feedback.customNote) {
      currentPrefs.userFeedbackNotes = Array.from(new Set([feedback.customNote, ...currentPrefs.userFeedbackNotes])).slice(0, 20);
    }

    const twinWithNewPrefs: DigitalTwin = {
      ...twin,
      preferences: currentPrefs
    };

    // 3. Trigger Learning Engine to refresh insights and performance stats
    const learningResult = LearningEngine.processLearning(twinWithNewPrefs, updatedMemory, [feedbackRecord]);

    return {
      updatedTwin: learningResult.updatedTwin,
      updatedMemory,
      feedbackRecord
    };
  }
}
