/**
 * Centralized Plan, Pricing, Quota & Entitlement Configuration for InstaScore OS V13
 */

export type PlanType = 'FREE' | 'PRO';
export type BillingCycle = 'monthly' | 'annual';

export interface PlanConfig {
  id: PlanType;
  name: string;
  description: string;
  priceMonthly: number; // in BRL
  priceAnnual: number;  // in BRL
  formattedPriceMonthly: string;
  formattedPriceAnnual: string;
  quotas: {
    maxDiagnosesTotal: number;          // For Free (-1 = unlimited or reset monthly)
    maxDiagnosesPerMonth: number;       // For Pro
    maxAiGenerationsPerDay: number;     // Anti-abuse daily limit
    maxImageGenerationsPerMonth: number;// For Pro image generation
    maxVideoGenerationsPerMonth: number;// For Pro video/storyboard scripts
  };
  entitlements: {
    diagnosticBasic: boolean;
    diagnosticFull: boolean;
    contentAi: boolean;
    mission_execution: boolean;
    bio_generation: boolean;
    reelsGenerator: boolean;
    carouselGenerator: boolean;
    storiesGenerator: boolean;
    positioning_generation: boolean;
    cta_generation: boolean;
    calendar_generation: boolean;
    image_generation: boolean;
    video_generation: boolean;
    startMode: boolean;
    historyFull: boolean;
    advancedAnalysis: boolean;
  };
}

export const PLANS: Record<PlanType, PlanConfig> = {
  FREE: {
    id: 'FREE',
    name: 'InstaScore Free',
    description: '1 Diagnóstico gratuito e análise tática inicial dos gargalos do seu perfil.',
    priceMonthly: 0,
    priceAnnual: 0,
    formattedPriceMonthly: 'R$ 0',
    formattedPriceAnnual: 'R$ 0',
    quotas: {
      maxDiagnosesTotal: 1,
      maxDiagnosesPerMonth: 1,
      maxAiGenerationsPerDay: 3,
      maxImageGenerationsPerMonth: 0,
      maxVideoGenerationsPerMonth: 0
    },
    entitlements: {
      diagnosticBasic: true,
      diagnosticFull: false,
      contentAi: false,
      mission_execution: false,
      bio_generation: false,
      reelsGenerator: false,
      carouselGenerator: false,
      storiesGenerator: false,
      positioning_generation: false,
      cta_generation: false,
      calendar_generation: false,
      image_generation: false,
      video_generation: false,
      startMode: true,
      historyFull: false,
      advancedAnalysis: false
    }
  },
  PRO: {
    id: 'PRO',
    name: 'InstaScore Pro',
    description: 'Experiência executiva completa: resolva todos os gargalos com IA profunda, roteiros prontos, matriz C.A.G.E., carrosséis, stories e bios de alta conversão.',
    priceMonthly: 39.90,
    priceAnnual: 399.00,
    formattedPriceMonthly: 'R$ 39,90/mês',
    formattedPriceAnnual: 'R$ 399,00/ano',
    quotas: {
      maxDiagnosesTotal: -1, // Unlimited total
      maxDiagnosesPerMonth: 15,
      maxAiGenerationsPerDay: 50,
      maxImageGenerationsPerMonth: 20,
      maxVideoGenerationsPerMonth: 5
    },
    entitlements: {
      diagnosticBasic: true,
      diagnosticFull: true,
      contentAi: true,
      mission_execution: true,
      bio_generation: true,
      reelsGenerator: true,
      carouselGenerator: true,
      storiesGenerator: true,
      positioning_generation: true,
      cta_generation: true,
      calendar_generation: true,
      image_generation: true,
      video_generation: true,
      startMode: true,
      historyFull: true,
      advancedAnalysis: true
    }
  }
};

export type EntitlementKey = keyof PlanConfig['entitlements'];
export type QuotaKey = keyof PlanConfig['quotas'];

export function getPlanConfig(plan: PlanType): PlanConfig {
  return PLANS[plan] || PLANS.FREE;
}

export function hasEntitlement(plan: PlanType, entitlement: EntitlementKey): boolean {
  const config = getPlanConfig(plan);
  return Boolean(config.entitlements[entitlement]);
}

export function isWithinQuota(plan: PlanType, quotaKey: QuotaKey, currentUsage: number): boolean {
  const config = getPlanConfig(plan);
  const limit = config.quotas[quotaKey];
  if (limit === -1) return true; // Unlimited
  return currentUsage < limit;
}

/**
 * Dynamic calculation of Annual Discount and Economy relative to 12 months of monthly subscription
 */
export function getAnnualDiscountInfo(plan: PlanType = 'PRO') {
  const config = getPlanConfig(plan);
  const monthlyAnnualized = Number((config.priceMonthly * 12).toFixed(2));
  const annualPrice = config.priceAnnual;
  const economyAmount = Number((monthlyAnnualized - annualPrice).toFixed(2));
  const discountPercent = monthlyAnnualized > 0 
    ? Math.round(((monthlyAnnualized - annualPrice) / monthlyAnnualized) * 100) 
    : 0;
  const monthlyEquivalent = annualPrice > 0 
    ? Number((annualPrice / 12).toFixed(2)) 
    : 0;

  return {
    monthlyPrice: config.priceMonthly,
    annualPrice,
    monthlyAnnualized,
    economyAmount,
    discountPercent,
    formattedEconomy: `R$ ${economyAmount.toFixed(2).replace('.', ',')}`,
    formattedMonthlyEquivalent: `R$ ${monthlyEquivalent.toFixed(2).replace('.', ',')}`,
    discountBadgeText: `${discountPercent}% OFF`,
    economyBadgeText: `Economize R$ ${economyAmount.toFixed(2).replace('.', ',')}`
  };
}

export function calculateEstimatedAiCost(modelUsed: string, inputTokens: number, outputTokens: number) {
  // Estimated prices per 1M tokens (USD)
  let inputRatePerM = 0.075;  // Gemini 2.5 Flash
  let outputRatePerM = 0.30;   // Gemini 2.5 Flash

  if (modelUsed.includes('pro')) {
    inputRatePerM = 1.25;
    outputRatePerM = 5.00;
  }

  const costUsd = (inputTokens / 1_000_000) * inputRatePerM + (outputTokens / 1_000_000) * outputRatePerM;
  const usdToBrlRate = 5.70;
  const costBrl = costUsd * usdToBrlRate;

  return {
    inputTokens,
    outputTokens,
    costUsd: Number(costUsd.toFixed(6)),
    costBrl: Number(costBrl.toFixed(6))
  };
}
