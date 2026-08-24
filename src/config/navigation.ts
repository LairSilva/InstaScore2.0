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
  Crown,
  Bookmark,
  Layers,
  Video
} from "lucide-react";

export type NavAreaId = "analisar" | "evoluir" | "criar" | "estrategia";

export type NavItemId =
  | "audit"
  | "twin"
  | "benchmark"
  | "simulator"
  | "growth"
  | "history"
  | "content_engine"
  | "content_library"
  | "strategy"
  | "mentor"
  | "content_lab"
  | "pro_tools";

export type OsModuleId =
  | "dashboard"
  | "twin"
  | "benchmark"
  | "growth"
  | "simulator"
  | "mentor"
  | "history"
  | "content_engine"
  | "content_library";

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
  area: NavAreaId;
  section: "strategy_core" | "os_modules";
  ariaLabel: string;
}

export interface NavAreaConfig {
  id: NavAreaId;
  title: string;
  badge?: string;
  items: NavItemConfig[];
}

export const NAV_ITEMS: NavItemConfig[] = [
  // 1. ÁREA: CRIAR (Content Engine & Library)
  {
    id: "content_engine",
    label: "Content Engine",
    shortLabel: "Content Engine",
    description: "Motor estratégico de criação orientado por dados e C.A.G.E.",
    module: "content_engine",
    area: "criar",
    section: "os_modules",
    ariaLabel: "Navegar para InstaScore Content Engine"
  },
  {
    id: "content_library",
    label: "Biblioteca de Conteúdo",
    shortLabel: "Biblioteca",
    description: "Roteiros, carrosséis e posts salvos prontos para publicação",
    module: "content_library",
    area: "criar",
    section: "os_modules",
    ariaLabel: "Navegar para Biblioteca de Conteúdo"
  },

  // 2. ÁREA: ANALISAR (Auditoria, Twin, Benchmark, Simulador)
  {
    id: "audit",
    label: "Diagnóstico & C.A.G.E.",
    shortLabel: "Diagnóstico",
    description: "Auditoria detalhada dos 15 critérios de conversão",
    module: "dashboard",
    subTab: "audit",
    area: "analisar",
    section: "strategy_core",
    ariaLabel: "Navegar para Diagnóstico e Auditoria C.A.G.E."
  },
  {
    id: "twin",
    label: "Digital Twin",
    shortLabel: "Digital Twin",
    description: "Clone virtual e inteligência de conteúdo",
    module: "twin",
    area: "analisar",
    section: "os_modules",
    ariaLabel: "Navegar para Digital Twin"
  },
  {
    id: "benchmark",
    label: "Global Benchmark",
    shortLabel: "Benchmark",
    description: "Comparativo setorial com top 10% do nicho",
    module: "benchmark",
    area: "analisar",
    section: "os_modules",
    ariaLabel: "Navegar para Global Benchmark"
  },
  {
    id: "simulator",
    label: "Simulador AI",
    shortLabel: "Simulador",
    description: "Previsão de crescimento e testes de Bio/CTA",
    module: "simulator",
    area: "analisar",
    section: "os_modules",
    ariaLabel: "Navegar para Simulador AI"
  },

  // 3. ÁREA: EVOLUIR (Growth Center, Linha do Tempo)
  {
    id: "growth",
    label: "Growth Center",
    shortLabel: "Growth",
    description: "Missões práticas e plano de aceleração",
    module: "growth",
    area: "evoluir",
    section: "os_modules",
    ariaLabel: "Navegar para Growth Center"
  },
  {
    id: "history",
    label: "Linha do Tempo",
    shortLabel: "Histórico",
    description: "Histórico de evolução e auditorias passadas",
    module: "history",
    area: "evoluir",
    section: "os_modules",
    ariaLabel: "Navegar para Linha do Tempo e Histórico"
  },

  // 4. ÁREA: ESTRATÉGIA (DNA, Mentor IA, Content Lab, Central PRO)
  {
    id: "strategy",
    label: "Sua Estratégia & DNA",
    shortLabel: "Estratégia",
    description: "DNA do perfil e clareza de posicionamento",
    module: "dashboard",
    subTab: "strategy",
    area: "estrategia",
    section: "strategy_core",
    ariaLabel: "Navegar para Sua Estratégia e DNA"
  },
  {
    id: "mentor",
    label: "Mentor IA",
    shortLabel: "Mentor",
    description: "Consultoria estratégica conversacional em tempo real",
    module: "mentor",
    area: "estrategia",
    section: "os_modules",
    ariaLabel: "Navegar para Mentor IA"
  },
  {
    id: "content_lab",
    label: "Content Lab",
    shortLabel: "Content Lab",
    description: "Gerador de pautas e roteiros estratégicos",
    module: "dashboard",
    subTab: "content_lab",
    isPro: true,
    area: "estrategia",
    section: "strategy_core",
    ariaLabel: "Navegar para Content Lab Pro"
  },
  {
    id: "pro_tools",
    label: "Central PRO",
    shortLabel: "Central PRO",
    description: "Ferramentas táticas e geradores avançados",
    module: "dashboard",
    subTab: "pro_tools",
    isPro: true,
    area: "estrategia",
    section: "strategy_core",
    ariaLabel: "Navegar para Central PRO"
  }
];

// Helper to organize navigation in 4 Major Areas
export const NAV_AREAS: NavAreaConfig[] = [
  {
    id: "criar",
    title: "CRIAR",
    badge: "NOVO",
    items: NAV_ITEMS.filter(item => item.area === "criar")
  },
  {
    id: "analisar",
    title: "ANALISAR",
    items: NAV_ITEMS.filter(item => item.area === "analisar")
  },
  {
    id: "evoluir",
    title: "EVOLUIR",
    items: NAV_ITEMS.filter(item => item.area === "evoluir")
  },
  {
    id: "estrategia",
    title: "ESTRATÉGIA",
    items: NAV_ITEMS.filter(item => item.area === "estrategia")
  }
];

// Helper to determine active nav item
export function getActiveNavId(
  activeModule: OsModuleId,
  activeSubTab: DashboardSubTab = "strategy"
): NavItemId {
  if (activeModule === "dashboard") {
    return activeSubTab;
  }
  return activeModule as NavItemId;
}

// Navigation sections (retro-compatibility)
export const STRATEGY_NAV_ITEMS = NAV_ITEMS.filter(item => item.section === "strategy_core");
export const OS_NAV_ITEMS = NAV_ITEMS.filter(item => item.section === "os_modules");
