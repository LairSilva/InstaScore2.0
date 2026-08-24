import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Zap, 
  Target, 
  Calendar, 
  Rocket, 
  Sparkles, 
  Layers, 
  Video, 
  Instagram, 
  FileText, 
  ArrowRight, 
  Check, 
  AlertCircle, 
  RefreshCw, 
  Bookmark, 
  Clock, 
  ChevronRight,
  ShieldCheck,
  Compass,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Plus
} from "lucide-react";

import { 
  ContentDNA, 
  ContentIdea, 
  ContentFormatType, 
  ContentObjectiveType, 
  CagePillarId, 
  ContentCalendarPlan, 
  CampaignBlueprint,
  CampaignType
} from "../../types/content-engine";
import { ContentDNACard } from "../../components/content/ContentDNACard";
import { ContentDetailModal } from "../../components/content/ContentDetailModal";
import { ContentGenerationErrorBoundary } from "./ContentGenerationErrorBoundary";
import { buildContentDNA } from "../../engine/content/ContentDNAEngine";
import { FeedbackEngine } from "../../engine/intelligence/FeedbackEngine";
import { ExpandedContentMemory } from "../../engine/content/ContentMemoryEngine";
import { createDefaultDigitalTwin, DigitalTwin } from "../../core/DigitalTwin";
import { apiFetch, ApiError } from "../../lib/api-client";

interface ContentEngineViewProps {
  diagnosisResult?: any | null;
  startModeResult?: any | null;
  profileDNA?: any | null;
  digitalTwin?: any | null;
  isPro?: boolean;
  onOpenPaywall?: (reason?: string) => void;
  onNavigateToLibrary?: () => void;
  initialOptions?: {
    pillar?: string;
    gap?: string;
    format?: string;
    objective?: string;
    brief?: any;
  } | null;
}

type EngineMode = "overview" | "create_now" | "fix_problem" | "plan_calendar" | "campaign";

export const ContentEngineView: React.FC<ContentEngineViewProps> = ({
  diagnosisResult,
  startModeResult,
  profileDNA,
  digitalTwin: propDigitalTwin,
  isPro = false,
  onOpenPaywall,
  onNavigateToLibrary,
  initialOptions
}) => {
  // 1. Build initial unified ContentDNA deterministically
  const [dna, setDna] = useState<ContentDNA>(() => {
    return buildContentDNA({
      diagnosisResult,
      startModeResult,
      profileDNA,
      digitalTwin: propDigitalTwin
    });
  });

  // Digital Twin local evolution state
  const [twinState, setTwinState] = useState<DigitalTwin>(() => {
    return propDigitalTwin || createDefaultDigitalTwin();
  });

  const [contentMemory, setContentMemory] = useState<ExpandedContentMemory>({
    userId: dna.handle || "user-default",
    usedThemes: [],
    usedHooks: [],
    usedCtas: [],
    pillarDistribution: {
      conversion: 0,
      authority: 0,
      growth: 0,
      expression: 0
    },
    fingerprints: [],
    historyRecords: [],
    feedbackHistory: [],
    lastUpdated: new Date().toISOString()
  });

  const handleFeedbackSubmit = (feedback: {
    contentId?: string;
    title?: string;
    theme?: string;
    format?: ContentFormatType;
    rating: any;
    reason?: any;
    customNote?: string;
  }) => {
    const result = FeedbackEngine.applyFeedback(twinState, contentMemory, feedback);
    setTwinState(result.updatedTwin);
    setContentMemory(result.updatedMemory);
  };

  // Active Mode State
  const [currentMode, setCurrentMode] = useState<EngineMode>(() => {
    return initialOptions ? "create_now" : "overview";
  });

  // Creation States
  const [selectedFormat, setSelectedFormat] = useState<ContentFormatType>(() => {
    return (initialOptions?.format as ContentFormatType) || "reel";
  });
  const [selectedObjective, setSelectedObjective] = useState<ContentObjectiveType>(() => {
    return (initialOptions?.objective as ContentObjectiveType) || "authority";
  });
  const [customTheme, setCustomTheme] = useState<string>(() => {
    return initialOptions?.brief?.theme || "";
  });
  const [selectedProblem, setSelectedProblem] = useState<string>(() => {
    return initialOptions?.gap || "";
  });

  // Apply initialOptions dynamically if they change
  useEffect(() => {
    if (initialOptions) {
      setCurrentMode("create_now");
      if (initialOptions.format) setSelectedFormat(initialOptions.format as ContentFormatType);
      if (initialOptions.objective) setSelectedObjective(initialOptions.objective as ContentObjectiveType);
      if (initialOptions.brief?.theme) setCustomTheme(initialOptions.brief.theme);
      if (initialOptions.gap) setSelectedProblem(initialOptions.gap);
    }
  }, [initialOptions]);

  // Plan Calendar States
  const [calendarDays, setCalendarDays] = useState<7 | 15 | 30>(15);
  const [calendarFrequency, setCalendarFrequency] = useState<number>(5);
  const [activePlan, setActivePlan] = useState<ContentCalendarPlan | null>(null);

  // Campaign States
  const [campaignType, setCampaignType] = useState<CampaignType>("product_launch");
  const [campaignProductName, setCampaignProductName] = useState("");
  const [activeCampaign, setActiveCampaign] = useState<CampaignBlueprint | null>(null);

  // Generated Ideas & Active Working Item
  const [generatedIdeas, setGeneratedIdeas] = useState<ContentIdea[]>([]);
  const [strategicRationale, setStrategicRationale] = useState<string>("");
  const [activeIdea, setActiveIdea] = useState<ContentIdea | null>(null);
  const [inspectModalOpen, setInspectModalOpen] = useState(false);

  // Pipeline Progress States
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState<string>("");
  const [generationProgress, setGenerationProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [savedItemsCount, setSavedItemsCount] = useState(0);

  // Sync DNA if props change
  useEffect(() => {
    const fresh = buildContentDNA({
      diagnosisResult,
      startModeResult,
      profileDNA,
      digitalTwin: propDigitalTwin
    });
    setDna(fresh);
  }, [diagnosisResult, startModeResult, profileDNA, propDigitalTwin]);


  // Handle Mode 1: Criar Agora - Generate Ideas
  const handleGenerateIdeas = async (problemDescription?: string) => {
    try {
      setIsGenerating(true);
      setErrorMessage(null);
      setGeneratedIdeas([]);
      
      setGenerationStep("Lendo o Strategic Content DNA do seu perfil...");
      setGenerationProgress(20);

      const data = await apiFetch<{
        success: boolean;
        ideas: ContentIdea[];
        strategicRationale?: string;
        primaryFocusPillar?: string;
      }>("/api/content/generate-idea", {
        method: "POST",
        body: JSON.stringify({
          dna,
          format: selectedFormat,
          objective: selectedObjective,
          problemId: problemDescription ? "gargalo_cage" : undefined,
          problemDescription,
          themeCustom: customTheme.trim() || undefined
        })
      });

      setGenerationStep("Estruturando ganchos anti-clichê e alinhamento C.A.G.E....");
      setGenerationProgress(65);

      setGenerationStep("Finalizando sugestões estratégicas...");
      setGenerationProgress(100);

      setGeneratedIdeas(data.ideas || []);
      setStrategicRationale(data.strategicRationale || "");
    } catch (err: any) {
      console.error("[Generate Ideas Error]", err);
      if (err instanceof ApiError && err.status === 403 && onOpenPaywall) {
        onOpenPaywall(err.message);
        return;
      }
      setErrorMessage(err.message || "Não foi possível gerar as ideias agora.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle Generate Full Deliverable (Post/Carousel/Reel/Story)
  const handleGenerateFullContent = async (idea: ContentIdea) => {
    try {
      setIsGenerating(true);
      setErrorMessage(null);

      setGenerationStep(`Redigindo estrutura completa de ${idea.type.toUpperCase()}...`);
      setGenerationProgress(40);

      const data = await apiFetch<{
        success: boolean;
        content: any;
        quality?: any;
      }>("/api/content/generate-full", {
        method: "POST",
        body: JSON.stringify({
          dna,
          idea,
          format: idea.type
        })
      });

      setGenerationStep("Submetendo ao Quality Gate Anti-Clichê...");
      setGenerationProgress(80);

      setGenerationProgress(100);

      const completeIdea: ContentIdea = {
        ...idea,
        content: {
          format: idea.type as any,
          data: data.content
        },
        caption: data.content?.caption || "",
        cta: data.content?.cta || data.content?.finalCta || "",
        status: "ready",
        whyThisTheme: idea.strategicReason
      };

      setActiveIdea(completeIdea);
      setInspectModalOpen(true);

      // Auto save to local storage and backend
      saveToLibrary(completeIdea);
    } catch (err: any) {
      console.error("[Generate Full Content Error]", err);
      if (err instanceof ApiError && err.status === 403 && onOpenPaywall) {
        onOpenPaywall(err.message);
        return;
      }
      setErrorMessage(err.message || "Erro durante a redação profunda do conteúdo.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle Mode 3: Plan Calendar
  const handlePlanCalendar = async () => {
    if (!isPro && onOpenPaywall) {
      onOpenPaywall("O Planejador Editorial de 15/30 dias é exclusivo do plano InstaScore PRO.");
      return;
    }

    try {
      setIsGenerating(true);
      setErrorMessage(null);
      setGenerationStep(`Planejando cronograma editorial de ${calendarDays} dias...`);
      setGenerationProgress(50);

      const data = await apiFetch<{
        success: boolean;
        plan: ContentCalendarPlan;
      }>("/api/content/plan-calendar", {
        method: "POST",
        body: JSON.stringify({
          dna,
          daysCount: calendarDays,
          frequencyPerWeek: calendarFrequency,
          primaryGoal: dna.primaryGoal
        })
      });

      setActivePlan(data.plan);
      setGenerationProgress(100);
    } catch (err: any) {
      console.error("[Calendar Error]", err);
      if (err instanceof ApiError && err.status === 403 && onOpenPaywall) {
        onOpenPaywall(err.message);
        return;
      }
      setErrorMessage(err.message || "Erro ao planejar calendário.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle Mode 4: Create Campaign
  const handleCreateCampaign = async () => {
    if (!isPro && onOpenPaywall) {
      onOpenPaywall("O Campaign Builder em 6 Fases é exclusivo do plano InstaScore PRO.");
      return;
    }

    if (!campaignProductName.trim()) {
      setErrorMessage("Por favor, informe o nome do produto ou serviço da campanha.");
      return;
    }

    try {
      setIsGenerating(true);
      setErrorMessage(null);
      setGenerationStep("Construindo as 6 Fases Estratégicas da Campanha...");
      setGenerationProgress(50);

      const data = await apiFetch<{
        success: boolean;
        campaign: CampaignBlueprint;
      }>("/api/content/create-campaign", {
        method: "POST",
        body: JSON.stringify({
          dna,
          campaignType,
          productOrServiceName: campaignProductName.trim(),
          primaryObjective: dna.primaryGoal
        })
      });

      setActiveCampaign(data.campaign);
      setGenerationProgress(100);
    } catch (err: any) {
      console.error("[Campaign Error]", err);
      if (err instanceof ApiError && err.status === 403 && onOpenPaywall) {
        onOpenPaywall(err.message);
        return;
      }
      setErrorMessage(err.message || "Erro ao construir campanha.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Save Item to Library
  const saveToLibrary = async (item: ContentIdea) => {
    try {
      const local = localStorage.getItem("instascore_content_library");
      const list: ContentIdea[] = local ? JSON.parse(local) : [];
      const index = list.findIndex(i => i.id === item.id);
      if (index >= 0) {
        list[index] = item;
      } else {
        list.unshift(item);
      }
      localStorage.setItem("instascore_content_library", JSON.stringify(list));
      setSavedItemsCount(list.length);

      // Authenticated async save to backend
      apiFetch("/api/content/library/save", {
        method: "POST",
        body: JSON.stringify({ item })
      }).catch(e => console.warn("Backend save skipped", e));
    } catch (e) {
      console.error("Save local error", e);
    }
  };

  return (
    <ContentGenerationErrorBoundary>
      <div className="w-full max-w-6xl mx-auto space-y-6 px-1 sm:px-2 pb-16">
        
        {/* Dynamic Main Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#FF5E36] via-[#E1306C] to-[#833AB4] flex items-center justify-center text-white shadow-[0_0_20px_rgba(225,48,108,0.3)] shrink-0">
                <Sparkles size={20} />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white font-display tracking-tight">
                  InstaScore Content Engine
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 font-medium mt-0.5">
                  Seu motor estratégico de criação orientado por dados e C.A.G.E.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            {onNavigateToLibrary && (
              <button
                type="button"
                onClick={onNavigateToLibrary}
                className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-300 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Bookmark size={15} />
                <span>Biblioteca Salva</span>
              </button>
            )}

            {currentMode !== "overview" && (
              <button
                type="button"
                onClick={() => {
                  setCurrentMode("overview");
                  setGeneratedIdeas([]);
                }}
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-white transition-all cursor-pointer"
              >
                ← Voltar aos Modos
              </button>
            )}
          </div>
        </div>

        {/* Content DNA Card */}
        <ContentDNACard dna={dna} />

        {/* Action Modes Grid (Shown in Overview) */}
        {currentMode === "overview" && (
          <div className="space-y-4">
            <h2 className="text-xs uppercase font-mono font-bold tracking-widest text-slate-400">
              Escolha seu modo de criação
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* MODE 1: CRIAR AGORA */}
              <motion.div
                whileHover={{ y: -3, scale: 1.01 }}
                onClick={() => setCurrentMode("create_now")}
                className="p-5 rounded-2xl bg-gradient-to-b from-[#121626] to-[#0A0D18] border border-white/10 hover:border-[#FF5E36]/50 transition-all cursor-pointer group shadow-xl flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-[#FF5E36]/20 border border-[#FF5E36]/40 flex items-center justify-center text-[#FF5E36] mb-3 group-hover:scale-110 transition-transform">
                    <Zap size={20} />
                  </div>
                  <h3 className="text-base font-bold text-white font-display mb-1 group-hover:text-[#FF5E36] transition-colors">
                    Criar Agora
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Escolha formato (Reels, Carrossel, Stories ou Post) e gere pautas de alta retenção em segundos.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs font-bold text-[#FF5E36]">
                  <span>Iniciar Criação</span>
                  <ArrowRight size={14} />
                </div>
              </motion.div>

              {/* MODE 2: RESOLVER UM PROBLEMA */}
              <motion.div
                whileHover={{ y: -3, scale: 1.01 }}
                onClick={() => setCurrentMode("fix_problem")}
                className="p-5 rounded-2xl bg-gradient-to-b from-[#121626] to-[#0A0D18] border border-white/10 hover:border-[#FA26A0]/50 transition-all cursor-pointer group shadow-xl flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-[#FA26A0]/20 border border-[#FA26A0]/40 flex items-center justify-center text-[#FA26A0] mb-3 group-hover:scale-110 transition-transform">
                    <Target size={20} />
                  </div>
                  <h3 className="text-base font-bold text-white font-display mb-1 group-hover:text-[#FA26A0] transition-colors">
                    Resolver um Problema
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Ataque o gargalo prioritário do seu C.A.G.E. com pautas que explicam sua oferta e quebram objeções.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs font-bold text-[#FA26A0]">
                  <span>Sanar Gargalo</span>
                  <ArrowRight size={14} />
                </div>
              </motion.div>

              {/* MODE 3: PLANEJAR CONTEÚDO */}
              <motion.div
                whileHover={{ y: -3, scale: 1.01 }}
                onClick={() => setCurrentMode("plan_calendar")}
                className="p-5 rounded-2xl bg-gradient-to-b from-[#121626] to-[#0A0D18] border border-white/10 hover:border-emerald-500/50 transition-all cursor-pointer group shadow-xl flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                      <Calendar size={20} />
                    </div>
                    {!isPro && (
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        PRO
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-white font-display mb-1 group-hover:text-emerald-400 transition-colors">
                    Planejar Conteúdo
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Cronograma de 7, 15 ou 30 dias com distribuição balanceada de pilares e alternância de formatos.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs font-bold text-emerald-400">
                  <span>Abrir Calendário</span>
                  <ArrowRight size={14} />
                </div>
              </motion.div>

              {/* MODE 4: CRIAR CAMPANHA */}
              <motion.div
                whileHover={{ y: -3, scale: 1.01 }}
                onClick={() => setCurrentMode("campaign")}
                className="p-5 rounded-2xl bg-gradient-to-b from-[#121626] to-[#0A0D18] border border-white/10 hover:border-[#833AB4]/50 transition-all cursor-pointer group shadow-xl flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-[#833AB4]/20 border border-[#833AB4]/40 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                      <Rocket size={20} />
                    </div>
                    {!isPro && (
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        PRO
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-white font-display mb-1 group-hover:text-purple-400 transition-colors">
                    Criar Campanha
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Campaign Builder em 6 Fases: Aquecimento, Consciência, Autoridade, Objeções, Oferta e Fechamento.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs font-bold text-purple-400">
                  <span>Montar Campanha</span>
                  <ArrowRight size={14} />
                </div>
              </motion.div>

            </div>
          </div>
        )}

        {/* LOADING PROGRESSION BAR */}
        {isGenerating && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-5 rounded-2xl bg-[#090C16] border border-white/15 shadow-2xl space-y-3"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white flex items-center gap-2">
                <Sparkles size={14} className="text-[#FA26A0] animate-spin" />
                {generationStep || "Processando motor de inteligência..."}
              </span>
              <span className="font-mono text-slate-400 font-bold">{generationProgress}%</span>
            </div>
            <div className="w-full bg-black/60 h-2 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#FF5E36] via-[#E1306C] to-[#833AB4] transition-all duration-500"
                style={{ width: `${generationProgress}%` }}
              />
            </div>
          </motion.div>
        )}

        {/* ERROR MESSAGE */}
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-3 text-xs text-rose-300">
            <AlertCircle size={18} className="text-rose-400 shrink-0" />
            <div className="flex-1">{errorMessage}</div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-xs font-bold underline hover:text-white"
            >
              Fechar
            </button>
          </div>
        )}

        {/* MODE 1: CRIAR AGORA INTERFACE */}
        {currentMode === "create_now" && (
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-[#0B0F1D] border border-white/10 space-y-5">
              <h2 className="text-base sm:text-lg font-bold text-white font-display">
                ⚡ Modo: Criar Agora
              </h2>

              {/* Step 1: Format Selector */}
              <div>
                <label className="text-xs font-mono uppercase font-bold text-slate-400 block mb-2">
                  1. Escolha o Formato
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { id: "reel", label: "Reels", icon: Video, desc: "Vídeo curto de alta retenção" },
                    { id: "carousel", label: "Carrossel", icon: Layers, desc: "Slide a slide de autoridade" },
                    { id: "story", label: "Stories", icon: Instagram, desc: "Sequência de conversão direta" },
                    { id: "post", label: "Post Estático", icon: FileText, desc: "Conceito e imagem única" }
                  ].map(f => {
                    const Icon = f.icon;
                    const active = selectedFormat === f.id;
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setSelectedFormat(f.id as ContentFormatType)}
                        className={`p-3.5 rounded-2xl text-left border transition-all cursor-pointer ${
                          active 
                            ? "bg-[#E1306C]/20 border-[#FA26A0] text-white shadow-lg" 
                            : "bg-white/[0.02] border-white/10 text-slate-400 hover:text-white"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Icon size={16} className={active ? "text-[#FA26A0]" : "text-slate-400"} />
                          <span className="text-xs font-bold text-white">{f.label}</span>
                        </div>
                        <p className="text-[10px] text-slate-400">{f.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Objective Selector */}
              <div>
                <label className="text-xs font-mono uppercase font-bold text-slate-400 block mb-2">
                  2. Escolha o Objetivo
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                  {[
                    { id: "authority", label: "Autoridade" },
                    { id: "conversion", label: "Conversão" },
                    { id: "growth", label: "Descoberta" },
                    { id: "engagement", label: "Engajamento" },
                    { id: "education", label: "Educação" },
                    { id: "sales", label: "Venda Direta" }
                  ].map(obj => (
                    <button
                      key={obj.id}
                      type="button"
                      onClick={() => setSelectedObjective(obj.id as ContentObjectiveType)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                        selectedObjective === obj.id
                          ? "bg-white/20 border-white text-white"
                          : "bg-white/[0.02] border-white/5 text-slate-400 hover:text-white"
                      }`}
                    >
                      {obj.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 3: Optional Custom Theme */}
              <div>
                <label className="text-xs font-mono uppercase font-bold text-slate-400 block mb-2">
                  3. Tema Específico (Opcional)
                </label>
                <input
                  type="text"
                  value={customTheme}
                  onChange={(e) => setCustomTheme(e.target.value)}
                  placeholder="Deixe em branco para o IA sugerir pautas do seu ContentDNA..."
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#E1306C]"
                />
              </div>

              {/* Action Button */}
              <button
                type="button"
                disabled={isGenerating}
                onClick={() => handleGenerateIdeas()}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-[#FF5E36] via-[#E1306C] to-[#833AB4] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xl hover:opacity-90 transition-all cursor-pointer disabled:opacity-50"
              >
                <Sparkles size={16} />
                <span>Gerar Ideias com Content DNA</span>
              </button>
            </div>

            {/* Generated Ideas Result List */}
            {generatedIdeas.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider">
                    Ideias Geradas sob Medida ({generatedIdeas.length})
                  </h3>
                  {strategicRationale && (
                    <span className="text-xs text-slate-400 hidden sm:inline">
                      {strategicRationale}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {generatedIdeas.map((idea) => (
                    <div
                      key={idea.id}
                      className="p-5 rounded-2xl bg-[#0D1120] border border-white/10 hover:border-[#E1306C]/50 transition-all flex flex-col justify-between shadow-xl"
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded bg-white/10 text-white">
                            {idea.type.toUpperCase()}
                          </span>
                          <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded bg-[#FA26A0]/15 text-[#FA26A0] border border-[#FA26A0]/30">
                            {idea.cagePillar?.toUpperCase()}
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-white font-display">
                          {idea.title}
                        </h4>

                        <p className="text-xs text-slate-400 italic">
                          "{idea.hook}"
                        </p>

                        <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 text-[11px] text-slate-300">
                          <strong className="text-slate-200">Razão Estratégica:</strong> {idea.strategicReason}
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={isGenerating}
                        onClick={() => handleGenerateFullContent(idea)}
                        className="mt-4 w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <span>Redigir Conteúdo Completo</span>
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* MODE 2: RESOLVER UM PROBLEMA INTERFACE */}
        {currentMode === "fix_problem" && (
          <div className="p-6 rounded-3xl bg-[#0B0F1D] border border-white/10 space-y-6">
            <div className="space-y-1">
              <h2 className="text-base sm:text-lg font-bold text-white font-display flex items-center gap-2">
                <Target size={20} className="text-[#FA26A0]" />
                <span>🎯 Modo: Resolver um Problema C.A.G.E.</span>
              </h2>
              <p className="text-xs text-slate-400">
                Criamos peças direcionadas para eliminar a principal fraqueza diagnosticada no seu perfil.
              </p>
            </div>

            {/* Problem Presets */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { title: "Explicar Minha Oferta com Clareza", desc: "Para quando seguidores chegam, mas não entendem o que você vende ou como contratar." },
                { title: "Quebrar Objeções Ocultas", desc: "Eliminar medos de preço, falta de tempo ou descrença no método." },
                { title: "Gerar Prova Social & Autoridade", desc: "Demonstrar resultados práticos e estudos de caso que provam seu valor." },
                { title: "Criar CTA Direto para o Direct", desc: "Estimular o envio de palavras-chave para fechar vendas na conversa privada." }
              ].map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedProblem(p.title)}
                  className={`p-4 rounded-2xl text-left border transition-all cursor-pointer ${
                    selectedProblem === p.title
                      ? "bg-[#FA26A0]/15 border-[#FA26A0] text-white shadow-lg"
                      : "bg-white/[0.02] border-white/10 text-slate-300 hover:text-white"
                  }`}
                >
                  <h4 className="text-xs font-bold text-white mb-1">{p.title}</h4>
                  <p className="text-[11px] text-slate-400">{p.desc}</p>
                </button>
              ))}
            </div>

            <button
              type="button"
              disabled={isGenerating || !selectedProblem}
              onClick={() => handleGenerateIdeas(selectedProblem)}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#FF5E36] via-[#E1306C] to-[#833AB4] text-white font-bold text-xs flex items-center gap-2 shadow-xl hover:opacity-90 transition-all cursor-pointer disabled:opacity-50"
            >
              <Target size={16} />
              <span>Gerar Solução para "{selectedProblem || "Escolha um problema"}"</span>
            </button>

            {/* Generated Ideas Result List */}
            {generatedIdeas.length > 0 && (
              <div className="pt-4 border-t border-white/10 space-y-4">
                <h3 className="text-sm font-bold text-white uppercase font-mono">
                  Pautas Recomendadas para o Gargalo
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {generatedIdeas.map((idea) => (
                    <div
                      key={idea.id}
                      className="p-5 rounded-2xl bg-[#0D1120] border border-white/10 hover:border-[#FA26A0]/50 transition-all flex flex-col justify-between shadow-xl"
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded bg-white/10 text-white">
                            {idea.type.toUpperCase()}
                          </span>
                          <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            ANTI-GARGALO
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-white font-display">
                          {idea.title}
                        </h4>

                        <p className="text-xs text-slate-400 italic">
                          "{idea.hook}"
                        </p>

                        <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 text-[11px] text-slate-300">
                          <strong className="text-slate-200">Por que estamos criando isto:</strong> {idea.strategicReason}
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={isGenerating}
                        onClick={() => handleGenerateFullContent(idea)}
                        className="mt-4 w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <span>Redigir Conteúdo Completo</span>
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* MODE 3: PLANEJAR CONTEÚDO (CALENDAR) */}
        {currentMode === "plan_calendar" && (
          <div className="p-6 rounded-3xl bg-[#0B0F1D] border border-white/10 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white font-display flex items-center gap-2">
                  <Calendar size={20} className="text-emerald-400" />
                  <span>📅 Modo: Planejador de Conteúdo Editorial</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Distribuição equilibrada dos 4 pilares C.A.G.E. com expansão de roteiro sob demanda.
                </p>
              </div>
            </div>

            {/* Plan Duration Selector */}
            <div className="flex items-center gap-3">
              {[7, 15, 30].map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setCalendarDays(d as any)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    calendarDays === d
                      ? "bg-emerald-500/20 border-emerald-500 text-white"
                      : "bg-white/[0.02] border-white/10 text-slate-400 hover:text-white"
                  }`}
                >
                  {d} Dias
                </button>
              ))}

              <button
                type="button"
                disabled={isGenerating}
                onClick={handlePlanCalendar}
                className="ml-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg transition-all cursor-pointer"
              >
                <Sparkles size={14} />
                <span>Gerar Cronograma de {calendarDays} Dias</span>
              </button>
            </div>

            {/* Calendar Plan Result */}
            {activePlan && (
              <div className="space-y-3 pt-3 border-t border-white/10">
                <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span>Total de {activePlan.items?.length || 0} publicações programadas</span>
                  <span>{activePlan.cadenceDescription}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {activePlan.items?.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-2xl bg-[#070A14] border border-white/10 hover:border-emerald-500/40 transition-all space-y-2 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-mono font-bold text-emerald-400">
                            {item.date || `Dia ${item.dayNumber}`}
                          </span>
                          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-white/5 text-slate-300">
                            {item.format.toUpperCase()}
                          </span>
                        </div>

                        <h4 className="text-xs font-bold text-white font-display line-clamp-2">
                          {item.theme}
                        </h4>

                        <p className="text-[11px] text-slate-400 mt-1">
                          <strong>Razão:</strong> {item.strategicReason}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleGenerateFullContent({
                          id: item.id,
                          type: item.format,
                          objective: item.objective,
                          cagePillar: item.cagePillar,
                          strategicReason: item.strategicReason,
                          title: item.theme,
                          hook: item.theme,
                          previewSummary: item.theme,
                          whyThisTheme: item.strategicReason,
                          status: "draft",
                          createdAt: new Date().toISOString(),
                          updatedAt: new Date().toISOString()
                        })}
                        className="mt-3 w-full py-2 rounded-xl bg-white/5 hover:bg-white/15 text-white font-bold text-[11px] flex items-center justify-center gap-1 cursor-pointer transition-all"
                      >
                        <span>Redigir Peça Completa</span>
                        <ChevronRight size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* MODE 4: CRIAR CAMPANHA (CAMPAIGN BUILDER) */}
        {currentMode === "campaign" && (
          <div className="p-6 rounded-3xl bg-[#0B0F1D] border border-white/10 space-y-6">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white font-display flex items-center gap-2">
                <Rocket size={20} className="text-purple-400" />
                <span>🚀 Modo: Campaign Builder (6 Fases Estratégicas)</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Estruturação de funil com Aquecimento, Consciência, Autoridade, Objeções, Oferta e Conversão.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-mono uppercase font-bold text-slate-400 block mb-1">
                  Nome do Produto / Serviço ou Oferta
                </label>
                <input
                  type="text"
                  value={campaignProductName}
                  onChange={(e) => setCampaignProductName(e.target.value)}
                  placeholder="Ex: Consultoria Premium de Vendas, Curso Online..."
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-xs font-mono uppercase font-bold text-slate-400 block mb-1">
                  Tipo de Campanha
                </label>
                <select
                  value={campaignType}
                  onChange={(e) => setCampaignType(e.target.value as CampaignType)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="product_launch">Lançamento de Produto</option>
                  <option value="sell_service">Venda de Serviço / Consultoria</option>
                  <option value="lead_generation">Captação de Leads Qualificados</option>
                  <option value="build_authority">Construção Acelerada de Autoridade</option>
                  <option value="event">Evento / Masterclass</option>
                  <option value="promotion">Campanha Promocional com Escassez</option>
                </select>
              </div>
            </div>

            <button
              type="button"
              disabled={isGenerating || !campaignProductName.trim()}
              onClick={handleCreateCampaign}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-[#E1306C] text-white font-bold text-xs flex items-center gap-2 shadow-xl hover:opacity-90 transition-all cursor-pointer disabled:opacity-50"
            >
              <Rocket size={16} />
              <span>Gerar Blueprint da Campanha</span>
            </button>

            {/* Campaign Result View */}
            {activeCampaign && (
              <div className="space-y-4 pt-4 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white font-display">
                    {activeCampaign.title}
                  </h3>
                  <span className="text-xs font-mono text-purple-300">
                    Duração Total: {activeCampaign.totalDurationDays} dias
                  </span>
                </div>

                <div className="space-y-4">
                  {activeCampaign.phases.map((phase) => (
                    <div
                      key={phase.phaseNumber}
                      className="p-4 rounded-2xl bg-[#080B15] border border-white/10 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center text-xs font-mono font-bold">
                            {phase.phaseNumber}
                          </span>
                          <h4 className="text-xs font-bold text-white">
                            FASE {phase.phaseNumber}: {phase.phaseName}
                          </h4>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-slate-400">
                          {phase.durationDays} dias
                        </span>
                      </div>

                      <p className="text-xs text-slate-300">
                        <strong>Objetivo da Fase:</strong> {phase.objective}
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {phase.ideas?.map((idea, iIdx) => (
                          <div key={iIdx} className="p-3 rounded-xl bg-black/40 border border-white/5 text-xs space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-white truncate">{idea.title}</span>
                              <span className="text-[9px] uppercase font-mono px-1.5 py-0.2 rounded bg-white/10 text-slate-300">
                                {idea.format}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 italic">"{idea.hook}"</p>
                            <p className="text-[10px] text-purple-300 font-medium">CTA: {idea.cta}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modal Visualizador e Editor de Conteúdo */}
        <ContentDetailModal
          isOpen={inspectModalOpen}
          onClose={() => setInspectModalOpen(false)}
          idea={activeIdea}
          onSaveToLibrary={saveToLibrary}
          onFeedbackSubmit={handleFeedbackSubmit}
          isSaved={true}
        />

      </div>
    </ContentGenerationErrorBoundary>
  );
};
