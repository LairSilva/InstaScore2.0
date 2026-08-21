import { DiagnosisInput } from "../schemas/diagnosis";
import { ScoringResult } from "../config/methodology";

export interface OnboardingData {
  userName: string;
  niche: string;
  objective: string;
  targetAudience: string;
  handle?: string;
  print1: string; // Base64 jpeg/png/webp
  print2: string; // Base64 jpeg/png/webp
  print3?: string; // Base64 jpeg/png/webp (Insights)
  consent: boolean;
}

export interface AnalysisResponse {
  success: boolean;
  diagnosis: DiagnosisInput;
  scoring: ScoringResult;
  error?: string;
}

export interface FeedbackData {
  rating: number; // 1 to 5
  mostUseful?: string;
  isGeneric?: string;
  wouldApply?: string;
  wouldPay?: string;
  createdAt: string;
}
