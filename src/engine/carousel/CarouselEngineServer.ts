/**
 * INSTASCORE OS V14 — CAROUSEL ENGINE SERVER ORCHESTRATOR
 * Coordinates Strategy Brief, Structure Engine, Copy Engine, Quality Gate 2.0,
 * Single Slide Regeneration, and the Learning/Feedback Loop.
 */

import { CarouselStrategyBrief, CarouselOutputPro, CarouselSlidePro, CarouselFeedbackInput } from "../../types/carousel-engine";
import { CarouselStrategyAdapter, BuildCarouselBriefOptions } from "./CarouselStrategyAdapter";
import { CarouselCopyEngine } from "./CarouselCopyEngine";
import { DigitalTwin } from "../../core/DigitalTwin";
import { ExpandedContentMemory, recordContentInMemory } from "../content/ContentMemoryEngine";
import { FeedbackEngine } from "../intelligence/FeedbackEngine";

export class CarouselEngineServer {
  private copyEngine: CarouselCopyEngine;

  constructor(callGemini: (params: { contents: any; config?: any }) => Promise<{ text: string; modelUsed: string }>) {
    this.copyEngine = new CarouselCopyEngine(callGemini);
  }

  /**
   * Prepares and returns the Strategic Content Brief for user review (Progressive Disclosure Step 1 & 2)
   */
  prepareBrief(options: BuildCarouselBriefOptions): CarouselStrategyBrief {
    return CarouselStrategyAdapter.createBrief(options);
  }

  /**
   * Generates the complete Carousel with Quality Gate 2.0 validation
   */
  async generateCarousel(brief: CarouselStrategyBrief): Promise<CarouselOutputPro> {
    return this.copyEngine.generateFullCarousel(brief);
  }

  /**
   * Regenerates a single slide with full narrative continuity
   */
  async regenerateSlide(
    carousel: CarouselOutputPro,
    slideNumber: number,
    customInstruction?: string
  ): Promise<CarouselSlidePro> {
    return this.copyEngine.regenerateSingleSlide(carousel, slideNumber, customInstruction);
  }

  /**
   * Processes user feedback and updates user-isolated Learning Engine, Digital Twin, and Memory
   */
  processFeedback(
    userId: string,
    carousel: CarouselOutputPro,
    feedback: CarouselFeedbackInput,
    currentTwin?: DigitalTwin | null,
    currentMemory?: ExpandedContentMemory | null
  ): { updatedTwin?: DigitalTwin | null; updatedMemory: ExpandedContentMemory } {
    let memory = currentMemory || {
      userId,
      usedThemes: [],
      usedHooks: [],
      usedCtas: [],
      pillarDistribution: { conversion: 0, authority: 0, growth: 0, expression: 0 },
      fingerprints: [],
      lastUpdated: new Date().toISOString()
    };

    // If rated well, record in content memory
    if (feedback.rating === "excellent" || feedback.rating === "good") {
      memory = recordContentInMemory(
        memory,
        carousel.title,
        carousel.coverHeadline,
        carousel.finalCta,
        carousel.cagePillar
      );
    }

    let updatedTwin = currentTwin;

    if (updatedTwin) {
      const fbResult = FeedbackEngine.applyFeedback(updatedTwin, memory, {
        contentId: carousel.id,
        title: carousel.title,
        theme: carousel.brief?.theme,
        format: "carousel",
        rating: feedback.rating,
        reason: feedback.reason === "depth" ? "other" : feedback.reason === "tone" ? "doesnt_represent_brand" : "disliked_theme",
        customNote: feedback.customNotes
      });
      updatedTwin = fbResult.updatedTwin;
      memory = fbResult.updatedMemory;
    }

    return { updatedTwin, updatedMemory: memory };
  }
}

