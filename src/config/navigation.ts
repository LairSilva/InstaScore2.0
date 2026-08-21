import React from "react";
import {
  Compass,
  Sparkles,
  BarChart3,
  Zap,
  Cpu,
  Globe,
  Rocket,
  BrainCircuit,
  History,
  ShieldCheck,
  LogOut,
  Crown
} from "lucide-react";

export type NavItemId =
  | "strategy"
  | "content_lab"
  | "audit"
  | "pro_tools"
  | "twin"
  | "benchmark"
  | "growth"
  | "simulator"
  | "mentor"
  | "history";

export type OsModuleId =
  | "dashboard"
  | "twin"
  | "benchmark"
  | "growth"
  | "simulator"
  | "mentor"
  | "history";

export type DashboardSubTab =
  | "strategy"
  | "content_lab"
  | "audit"
  | "pro_tools";

export interface NavItemConfig {
  id: NavItemId;
  label: string;
  shortLabel?: string;
  description?: string;
  module: OsModuleId;
  subTab?: DashboardSubTab;
  isPro?: boolean;
  section: "strategy_core" | "os_modules";
  ariaLabel: string;
}

export const NAV_ITEMS: NavItemConfig[] = [
  // 1. Core Strategic Items (Dashboard subtabs)
  {
    id: "strategy",
    label: "Sua Estratégia & DNA",
    shortLabel: "Estratégia",
    description: "DNA do perfil e clareza de posicionamento",
    module: "dashboard",
    subTab: "strategy",
    section: "strategy_core",
    ariaLabel: "Navegar para Sua Estratégia e DNA"
  },
  {
    id: "content_lab",
    label: "Content Lab (PRO)",
    shortLabel: "Content Lab",
    description: "Gerador de pautas e roteiros estratégicos",
    module: "dashboard",
    subTab: "content_lab",
    isPro: true,
    section: "strategy_core",
    ariaLabel: "Navegar para Content Lab Pro"
  },
  {
    id: "audit",
    label: "Diagnóstico & C.A.G.E.",
    shortLabel: "Diagnóstico",
    description: "Auditoria detalhada dos 15 critérios",
    module: "dashboard",
    subTab: "audit",
    section: "strategy_core",
    ariaLabel: "Navegar para Diagnóstico e Auditoria C.A.G.E."
  },
  {
    id: "pro_tools",
    label: "Central PRO",
    shortLabel: "Central PRO",
    description: "Ferramentas táticas e geradores avançados",
    module: "dashboard",
    subTab: "pro_tools",
    isPro: true,
    section: "strategy_core",
    ariaLabel: "Navegar para Central PRO"
  },

  // 2. OS Modules
  {
    id: "twin",
    label: "Digital Twin",
    shortLabel: "Digital Twin",
    description: "Clone virtual e inteligência de conteúdo",
    module: "twin",
    section: "os_modules",
    ariaLabel: "Navegar para Digital Twin"
  },
  {
    id: "benchmark",
    label: "Global Benchmark",
    shortLabel: "Benchmark",
    description: "Comparativo setorial com top 10% do nicho",
    module: "benchmark",
    section: "os_modules",
    ariaLabel: "Navegar para Global Benchmark"
  },
  {
    id: "growth",
    label: "Growth Center",
    shortLabel: "Growth",
    description: "Missões práticas e plano de aceleração",
    module: "growth",
    section: "os_modules",
    ariaLabel: "Navegar para Growth Center"
  },
  {
    id: "simulator",
    label: "Simulador AI",
    shortLabel: "Simulador",
    description: "Previsão de crescimento e testes de Bio/CTA",
    module: "simulator",
    section: "os_modules",
    ariaLabel: "Navegar para Simulador AI"
  },
  {
    id: "mentor",
    label: "Mentor IA",
    shortLabel: "Mentor",
    description: "Consultoria estratégica conversacional em tempo real",
    module: "mentor",
    section: "os_modules",
    ariaLabel: "Navegar para Mentor IA"
  },
  {
    id: "history",
    label: "Linha do Tempo",
    shortLabel: "Histórico",
    description: "Histórico de evolução e auditorias passadas",
    module: "history",
    section: "os_modules",
    ariaLabel: "Navegar para Linha do Tempo e Histórico"
  }
];

// Helper to determine the current active nav item id
export function getActiveNavId(
  activeModule: OsModuleId,
  activeSubTab: DashboardSubTab = "strategy"
): NavItemId {
  if (activeModule === "dashboard") {
    return activeSubTab;
  }
  return activeModule as NavItemId;
}

// Navigation sections
export const STRATEGY_NAV_ITEMS = NAV_ITEMS.filter(item => item.section === "strategy_core");
export const OS_NAV_ITEMS = NAV_ITEMS.filter(item => item.section === "os_modules");
