/**
 * INSTASCORE V12 — STRATEGIC BRAIN TYPES
 * Centralized Type System for AI Social Media Strategist
 */

export interface ContentPillar {
  id: string;
  name: string;
  objective: string;
  target_audience: string;
  pain_or_problem: string;
  desire: string;
  content_type: string;
  formats: string[];
  example_topics: string[];
  angles: string[];
  description?: string;
}

export interface ProfileDNA {
  id: string;
  userId: string;
  account_name: string;
  username: string;
  niche: string;
  subniche: string;
  microsegment: string;
  target_audience: string;
  audience_pain: string;
  audience_desire: string;
  transformation: string;
  offer: string;
  offer_type?: string;
  business_model?: string;
  core_problem?: string;
  positioning: string;
  unique_value_proposition: string;
  differentiator: string;
  authority: string;
  personality: string;
  tone_of_voice: string;
  content_style: string;
  primary_goal: string;
  secondary_goal: string;
  content_pillars: ContentPillar[];
  preferred_formats: string[];
  brand_keywords: string[];
  forbidden_topics: string[];
  competitors: string[];
  strategic_opportunities: string[];
  weaknesses: string[];
  strengths: string[];
  content_distribution: {
    autoridade: number;
    descoberta: number;
    prova: number;
    relacionamento: number;
    conversao: number;
  };
  content_dna?: {
    distribution?: {
      authority?: number;
      discovery?: number;
      conversion?: number;
      connection?: number;
      autoridade?: number;
      descoberta?: number;
      conversao?: number;
      relacionamento?: number;
      prova?: number;
    };
    consultative_rationale?: string;
  };
  clarity_score: number | any;
  last_updated: string;
}

export interface PositioningReport {
  current_niche: string;
  subniche: string;
  microsegment: string;
  audience: string;
  core_problem: string;
  core_desire: string;
  transformation: string;
  perceived_differentiator: string;
  positioning_bottleneck: string;
  strategic_opportunity: string;
  recommended_positioning: string;
  rationale: string;
  anti_broad_analysis: {
    broad_term: string;
    drilldown_path: string[];
    selected_depth: string;
  };
}

export interface ProfileClarityScore {
  overall_score: number; // 0-100
  dimensions: {
    positioning: number;
    audience_clarity: number;
    value_proposition: number;
    differentiation: number;
    authority: number;
    bio: number;
    content: number;
    strategic_consistency: number;
  };
  biggest_bottleneck: string;
  second_opportunity: string;
  priority_recommendation: string;
}

export interface BioStrategyOption {
  type: 'authority' | 'conversion' | 'personality';
  label: string;
  bio_lines: string[];
  formatted_bio: string;
  why_it_works: string;
  strategic_goal: string;
  strong_point: string;
  limitation: string;
}

export interface BioStrategyReport {
  evaluation: {
    clarity_score: number;
    audience_score: number;
    transformation_score: number;
    differentiation_score: number;
    proof_score: number;
    cta_score: number;
    overall_assessment: string;
  };
  options: BioStrategyOption[];
  anti_cliche_notes: string[];
}

export interface NameStrategyRecommendation {
  category: 'descritivo' | 'autoridade' | 'marca' | 'conceitual' | 'diferenciador';
  suggested_name: string;
  handle_ideas: string[];
  logic: string;
  positioning_connection: string;
  memorability: number; // 0-100
  clarity: number; // 0-100
  differentiation: number; // 0-100
  brand_potential: number; // 0-100
  overall_score: number; // 0-100
}

export type NameRecommendation = NameStrategyRecommendation;

export type StrategicAngleType =
  | 'curiosidade'
  | 'contradição'
  | 'erro'
  | 'dor'
  | 'desejo'
  | 'opinião'
  | 'história'
  | 'prova'
  | 'demonstração'
  | 'comparação'
  | 'tutorial'
  | 'diagnóstico'
  | 'estudo de caso'
  | 'objeção'
  | 'mito'
  | 'bastidor'
  | 'transformação';

export interface ContentAngle {
  id: string;
  angle_type: StrategicAngleType;
  angle_title: string;
  premise: string;
  hook_concept: string;
  why_it_converts: string;
  recommended_format: 'reel' | 'carousel' | 'stories' | 'post';
}

export interface QualityGateReport {
  clarity: number; // 0-10
  specificity: number; // 0-10
  originality: number; // 0-10
  audience_fit: number; // 0-10
  hook: number; // 0-10
  retention: number; // 0-10
  shareability: number; // 0-10
  saveability: number; // 0-10
  business_value: number; // 0-10
  brand_fit: number; // 0-10
  total_score: number; // sum (0-100)
  passed: boolean; // >= 75
  attempts_taken: number;
  anti_generic_check: 'passed' | 'rejected_and_regenerated';
  strategic_rationale: {
    primary_objective: string;
    target_audience: string;
    core_pain: string;
    angle: string;
    format: string;
    hook: string;
    why_this_recommendation: {
      problem_identified: string;
      data_used: string;
      hypothesis: string;
      reason: string;
    };
  };
}

export interface StrategicContentItem {
  id: string;
  primary_objective: string;
  pilar_id: string;
  pilar_name: string;
  angle: StrategicAngleType;
  angle_title: string;
  format: 'reel' | 'carousel' | 'stories';
  reel_model?: 'educational' | 'storytelling' | 'opinion' | 'demonstration' | 'case';
  title: string;
  hook: string;
  visual_hook_3s?: string;
  spoken_hook_3s?: string;
  scenes_or_slides?: any[];
  caption: string;
  cta: string;
  strategic_rationale: {
    primary_objective: string;
    target_audience: string;
    core_pain: string;
    angle: string;
    format: string;
    hook: string;
    why_this_recommendation: {
      problem_identified: string;
      data_used: string;
      hypothesis: string;
      reason: string;
    };
  };
  quality_report: QualityGateReport;
  created_at: string;
}

export interface PerformanceMemoryRecord {
  id: string;
  userId: string;
  post_id?: string;
  profile_id?: string;
  format: string;
  objective: string;
  pilar: string;
  angle: string;
  hook: string;
  date: string;
  metrics?: {
    reach?: number;
    likes?: number;
    comments?: number;
    saves?: number;
    shares?: number;
    followers_generated?: number;
    clicks?: number;
    conversions?: number;
  };
}
