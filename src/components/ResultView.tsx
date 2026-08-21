import React, { useState, Suspense, lazy } from "react";
import { motion } from "motion/react";
import { 
  Share2, RefreshCw, CheckCircle, AlertCircle, TrendingUp, 
  ChevronRight, ArrowRight, Target, Users, Zap, LayoutTemplate,
  Sparkles, ShieldCheck, Flame, Compass, Eye, Layers, Lock,
  FileText, Check, BarChart3
} from "lucide-react";
import { AnalysisResponse } from "../types";
import { DigitalTwin } from "../core/DigitalTwin";
import { CategoryResult, CRITERIA } from "../config/methodology";
import { DashboardSubTab } from "../config/navigation";
import { useEntitlements } from "../hooks/useEntitlements";
import { MissionExecutionResult, MissionType, BioModifier } from "../types/missions";
import { ProfileDNAService } from "../engine/strategic/ProfileDNAService";
import { ProfileDNA } from "../types/strategic-brain";
import { GlobalIntelligenceEngine } from "../engine/analytics/GlobalIntelligenceEngine";
import { apiFetch, ApiError } from "../lib/api-client";
import LazyFallback from "./LazyFallback";
import ErrorBoundary from "./ErrorBoundary";

// Lazy-loaded strategic PRO modules
const StrategicDashboard = lazy(() => import("./strategic/StrategicDashboard").then(m => ({ default: m.StrategicDashboard })));
const ContentLab = lazy(() => import("./strategic/ContentLab").then(m => ({ default: m.ContentLab })));
const ProContentGenerator = lazy(() => import("./ProContentGenerator").then(m => ({ default: m.ProContentGenerator })));
const MissionDeliverableModal = lazy(() => import("./MissionDeliverableModal").then(m => ({ default: m.MissionDeliverableModal })));

interface ResultViewProps {
  digitalTwin?: DigitalTwin | null;
  diagnosisResult: AnalysisResponse;
  isDemoMode: boolean;
  userName: string;
  niche: string;
  handle?: string;
  onReset: () => void;
  onShare: () => void;
  activeTab?: DashboardSubTab;
  onTabChange?: (tab: DashboardSubTab) => void;
}

export function ResultView({
  diagnosisResult,
  digitalTwin,
  isDemoMode,
  userName,
  niche,
  handle,
  onReset,
  onShare,
  activeTab: propActiveTab,
  onTabChange,
}: ResultViewProps) {
  const { openPaywall, userId } = useEntitlements();
  const { scoring, diagnosis } = diagnosisResult;
  const currentScore = scoring?.score || 0;
  
  // Mission Modal state
  const [isMissionModalOpen, setIsMissionModalOpen] = useState(false);
  const [activeMissionResult, setActiveMissionResult] = useState<MissionExecutionResult | null>(null);
  const [missionLoading, setMissionLoading] = useState(false);
  const [missionLoadingStage, setMissionLoadingStage] = useState("Iniciando IA estratégica...");
  const [missionError, setMissionError] = useState<string | null>(null);
  const [lastMissionParams, setLastMissionParams] = useState<{
    missionType: MissionType;
    gap?: { criterion_id?: string; title?: string; impact?: string; reason?: string };
    modifier: BioModifier;
  } | null>(null);
  const [activeBioModifier, setActiveBioModifier] = useState<BioModifier>("default");
  
  // Real niche cohort benchmarks from GlobalIntelligenceEngine
  const nicheBenchmark = GlobalIntelligenceEngine.getBenchmarkForNiche(niche);
  const nicheAvg = nicheBenchmark.averageScore;
  const top10 = nicheBenchmark.topPercentileScore;
  
  // Wasted potential calculation
  const wastedPotential = 100 - currentScore;
  
  // Gamification & OS Metrics
  const userLevel = Math.floor(currentScore / 20) + 1;
  const userXP = currentScore * 125;
  const nextLevelXP = userLevel * 20 * 125;
  const progressToNextLevel = ((userXP - ((userLevel - 1) * 20 * 125)) / (nextLevelXP - ((userLevel - 1) * 20 * 125))) * 100;
  
  const twinMetrics = digitalTwin?.metrics || {
    executionScore: Math.round(currentScore * 0.95),
    consistencyScore: Math.round(currentScore * 0.9),
    momentumScore: Math.round(currentScore * 0.85),
    overallScore: currentScore,
  };
  const executionScore = twinMetrics.executionScore;
  const consistencyScore = twinMetrics.consistencyScore;
  const momentumScore = twinMetrics.momentumScore;
  const cageScore = twinMetrics.overallScore;

  // Timeline completion state
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({});

  // Active View Tab State (Synchronized with parent or internal)
  const [internalActiveTab, setInternalActiveTab] = useState<DashboardSubTab>('strategy');
  const activeTab = propActiveTab !== undefined ? propActiveTab : internalActiveTab;

  const handleSelectTab = (tab: DashboardSubTab) => {
    if (onTabChange) {
      onTabChange(tab);
    } else {
      setInternalActiveTab(tab);
    }
  };

  // Initialized DNA based on diagnosis
  const [profileDna, setProfileDna] = useState<ProfileDNA>(() => {
    const cleanHandle = (handle || userName || 'usuario').replace('@', '');
    const criticalGapStr = diagnosis?.critical_gaps?.[0]?.title || 'Ganchos dos primeiros 3 segundos e clareza de posicionamento';
    const strengthStr = diagnosis?.strengths?.[0]?.title || 'Conhecimento técnico no nicho';
    
    return ProfileDNAService.createDefaultDNA(cleanHandle, userId || 'anonymous', {
      niche: niche || 'Negócios e Serviços',
      account_name: userName || cleanHandle,
      username: cleanHandle,
      audience_pain: criticalGapStr,
      strengths: [strengthStr],
      weaknesses: diagnosis?.critical_gaps?.map(g => g.title) || []
    });
  });

  const toggleStep = (idx: number) => {
    setCompletedSteps(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleExecuteMission = async (
    missionType: MissionType,
    gap?: { criterion_id?: string; title?: string; impact?: string; reason?: string },
    modifier: BioModifier = "default"
  ) => {
    setIsMissionModalOpen(true);
    setMissionLoading(true);
    setMissionError(null);
    setActiveBioModifier(modifier);
    setLastMissionParams({ missionType, gap, modifier });
    setMissionLoadingStage("Consultando IA especializada e parâmetros do diagnóstico...");

    try {
      const data = await apiFetch<{ success: boolean; result: MissionExecutionResult }>("/api/mission/execute", {
        method: "POST",
        body: JSON.stringify({
          userId,
          missionType,
          criterionId: gap?.criterion_id,
          criterionTitle: gap?.title,
          criterionImpact: gap?.impact || gap?.reason,
          userName: userName || "Criador",
          handle: handle || "@usuario",
          niche: niche || "Geral",
          objective: "Crescimento e Conversão",
          targetAudience: "Público Alvo do Nicho",
          currentBio: (diagnosis as any)?.bio_analysis?.verbatim_text || "",
          currentName: userName,
          score: currentScore,
          identifiedGaps: diagnosis.critical_gaps,
          modifier
        })
      });

      if (data.success && data.result) {
        setActiveMissionResult(data.result);
      } else {
        throw new Error("Falha na estruturação dos dados pela IA");
      }
    } catch (err: any) {
      console.error("Mission execution error:", err);
      setMissionError(err?.message || "Ocorreu um erro ao processar a missão com IA. Tente novamente.");
    } finally {
      setMissionLoading(false);
    }
  };

  const handleRegenerateBio = (modifier: BioModifier) => {
    handleExecuteMission("bio_generator_pro", { criterion_id: "bio_clarity_positioning" }, modifier);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="space-y-12 max-w-5xl mx-auto"
    >
      {/* Gamification OS Status Header */}
      <div className="flex items-center justify-between glass-panel rounded-2xl p-4.5 mb-6 shadow-2xl border border-white/10 backdrop-blur-2xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#FF5E36] via-[#E1306C] to-[#833AB4] p-0.5 shadow-[0_0_20px_rgba(225,48,108,0.4)]">
            <div className="w-full h-full bg-[#080B14] rounded-2xl flex items-center justify-center font-black text-white text-sm font-mono">
              L{userLevel}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="font-bold text-white text-sm sm:text-base font-display">{userName}</h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#E1306C]/20 text-[#FA26A0] border border-[#E1306C]/40 uppercase tracking-wide font-mono">
                {currentScore >= 80 ? "Level Expert" : currentScore >= 50 ? "Creator Pro" : "Iniciante OS"}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1.5">
              <div className="w-36 h-2 bg-[#0D1222] rounded-full overflow-hidden border border-white/10">
                <motion.div initial={{ width: 0 }} animate={{ width: `${progressToNextLevel}%` }} transition={{ duration: 1 }} className="h-full bg-gradient-to-r from-[#FF5E36] via-[#E1306C] to-[#38BDF8]" />
              </div>
              <span className="text-[10px] text-slate-400 font-mono font-semibold">{userXP} / {nextLevelXP} XP</span>
            </div>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-6">
          <div className="text-center">
            <span className="block text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1 font-mono">Sequência</span>
            <span className="text-white font-mono font-bold flex items-center gap-1.5 text-xs"><Zap size={14} className="text-[#FF5E36]" /> 1 Dia Ativo</span>
          </div>
          <div className="text-center">
            <span className="block text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1 font-mono">Conquistas</span>
            <span className="text-white font-mono font-bold flex items-center gap-1.5 text-xs"><Target size={14} className="text-[#38BDF8]" /> 2/15 Destravadas</span>
          </div>
        </div>
      </div>

      {/* 1. Header Banner & Identity */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-8">
        <div className="space-y-3">
          {isDemoMode && (
            <div className="inline-flex px-3 py-1 rounded-full bg-[#FF5E36]/20 text-[#FF5E36] border border-[#FF5E36]/40 text-xs font-bold font-mono tracking-wide uppercase select-none">
              Exemplo Demonstrativo V6
            </div>
          )}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight font-display">
            Consultoria Estratégica
          </h1>
          <p className="text-base text-slate-300 max-w-xl leading-relaxed">
            Diagnóstico do perfil <strong className="text-white font-bold">{handle ? `@${handle.replace("@", "")}` : userName.split(" ")[0]}</strong> no nicho de <strong className="text-[#FA26A0] font-bold">{niche}</strong>.
          </p>
        </div>

        {/* Action Button Controls */}
        <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2.5 sm:gap-3 shrink-0 w-full md:w-auto">
          <button
            type="button"
            id="btn_share_result_card"
            onClick={onShare}
            className="btn-premium-primary px-4 sm:px-6 py-3 text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer active:scale-95 w-full xs:w-auto min-h-[44px]"
          >
            <Share2 size={16} /> <span>Compartilhar Card</span>
          </button>
          <button
            type="button"
            id="btn_redo_analysis"
            onClick={onReset}
            className="btn-premium-secondary px-4 sm:px-5 py-3 text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer active:scale-95 w-full xs:w-auto min-h-[44px]"
          >
            <RefreshCw size={14} /> <span>Refazer</span>
          </button>
        </div>
      </div>

      {/* Strategic Navigation Tabs with Accessible Scroll & Visual Gradient Indicator (Desktop & Tablet only - on mobile access is centralized in the top hamburger drawer) */}
      <div className="hidden md:block relative w-full">
        <div 
          role="tablist" 
          aria-label="Abas do resultado da análise" 
          className="tabs-scroll-container flex items-center gap-2 p-1.5 bg-[#0b0f19] border border-white/10 rounded-2xl overflow-x-auto max-w-full touch-pan-x scrollbar-thin"
        >
          <button
            type="button"
            id="tab_strategy"
            role="tab"
            aria-selected={activeTab === 'strategy'}
            aria-controls="panel_strategy"
            onClick={() => handleSelectTab('strategy')}
            className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer min-h-[44px] shrink-0 ${
              activeTab === 'strategy'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Compass size={16} aria-hidden="true" className="shrink-0" />
            <span>Sua Estratégia & DNA</span>
          </button>

          <button
            type="button"
            id="tab_content_lab"
            role="tab"
            aria-selected={activeTab === 'content_lab'}
            aria-controls="panel_content_lab"
            onClick={() => handleSelectTab('content_lab')}
            className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer min-h-[44px] shrink-0 ${
              activeTab === 'content_lab'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Sparkles size={16} aria-hidden="true" className="shrink-0" />
            <span>Content Lab (PRO)</span>
          </button>

          <button
            type="button"
            id="tab_audit"
            role="tab"
            aria-selected={activeTab === 'audit'}
            aria-controls="panel_audit"
            onClick={() => handleSelectTab('audit')}
            className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer min-h-[44px] shrink-0 ${
              activeTab === 'audit'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <BarChart3 size={16} aria-hidden="true" className="shrink-0" />
            <span>Diagnóstico & C.A.G.E.</span>
          </button>

          <button
            type="button"
            id="tab_pro_tools"
            role="tab"
            aria-selected={activeTab === 'pro_tools'}
            aria-controls="panel_pro_tools"
            onClick={() => handleSelectTab('pro_tools')}
            className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer min-h-[44px] shrink-0 ${
              activeTab === 'pro_tools'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Zap size={16} aria-hidden="true" className="shrink-0" />
            <span>Central PRO</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Strategic Dashboard (Profile DNA & Clarity Score) */}
      {activeTab === 'strategy' && (
        <div id="panel_strategy" role="tabpanel" aria-labelledby="tab_strategy">
          <ErrorBoundary fallbackTitle="Erro ao carregar Dashboard Estratégico">
            <Suspense fallback={<LazyFallback message="Carregando DNA e Métricas Estratégicas..." />}>
              <StrategicDashboard
                initialDna={profileDna}
                username={(handle || userName || 'usuario').replace('@', '')}
                onOpenContentLab={() => handleSelectTab('content_lab')}
                onOpenPaywall={() => openPaywall()}
                isPro={true}
              />
            </Suspense>
          </ErrorBoundary>
        </div>
      )}

      {/* Tab 2: Content Lab */}
      {activeTab === 'content_lab' && (
        <div id="panel_content_lab" role="tabpanel" aria-labelledby="tab_content_lab">
          <ErrorBoundary fallbackTitle="Erro ao carregar Laboratório de Conteúdo">
            <Suspense fallback={<LazyFallback message="Carregando Content Lab PRO..." />}>
              <ContentLab
                dna={profileDna}
                onOpenPaywall={() => openPaywall()}
                isPro={true}
              />
            </Suspense>
          </ErrorBoundary>
        </div>
      )}

      {/* Tab 3: Diagnostic & C.A.G.E. Audit Details */}
      {activeTab === 'audit' && (
        <div id="panel_audit" role="tabpanel" aria-labelledby="tab_audit">
          <div className="space-y-12">
            {/* 2. Hero Score Experience with Pulsing Halo */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Main Score Display with Ambient Light Halo */}
        <div className="lg:col-span-5 glass-panel rounded-3xl p-5 sm:p-8 relative overflow-hidden flex flex-col justify-center items-center text-center shadow-2xl border border-white/10 w-full min-w-0">
          
          {/* Ambient Glow Aura */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 sm:w-64 h-48 sm:h-64 bg-gradient-to-tr from-[#FF5E36]/20 via-[#E1306C]/25 to-[#833AB4]/20 rounded-full blur-3xl animate-pulse-halo pointer-events-none"></div>

          <h2 className="text-xs font-extrabold text-[#FA26A0] tracking-widest uppercase mb-4 sm:mb-6 font-mono">SEU INSTASCORE ATUAL</h2>
          
          <motion.div 
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.2 }}
            className="relative my-2 max-w-full"
          >
            <svg viewBox="0 0 208 208" className="w-44 h-44 sm:w-52 sm:h-52 transform -rotate-90 overflow-visible max-w-full">
              <defs>
                <linearGradient id="score-ring-v6" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FF5E36" />
                  <stop offset="50%" stopColor="#E1306C" />
                  <stop offset="100%" stopColor="#833AB4" />
                </linearGradient>
              </defs>
              <circle cx="104" cy="104" r="92" stroke="#0D1222" strokeWidth="14" fill="none" />
              <motion.circle 
                cx="104" 
                cy="104" 
                r="92" 
                stroke="url(#score-ring-v6)" 
                strokeWidth="14" 
                fill="none"
                strokeLinecap="round"
                initial={{ strokeDasharray: "0, 1000" }}
                animate={{ strokeDasharray: `${(currentScore / 100) * 578}, 1000` }}
                transition={{ duration: 1.8, ease: "easeOut", delay: 0.4 }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <span className="text-5xl sm:text-6xl font-black text-white tracking-tighter font-display">{currentScore}</span>
              <span className="text-xs font-bold text-slate-400 mt-1 font-mono">/ 100 PONTOS</span>
            </div>
          </motion.div>

          <div className="mt-4 sm:mt-6 pt-4 border-t border-white/10 w-full">
             <p className="text-xs text-slate-300 leading-relaxed max-w-xs mx-auto">
                Espaço para otimização estrutural de até <strong className="text-[#FF5E36] font-bold">{wastedPotential} pontos</strong> de acordo com a matriz de critérios da metodologia C.A.G.E.
             </p>
          </div>
        </div>

        {/* Benchmark & Growth Projection Cards */}
        <div className="lg:col-span-7 space-y-6 flex flex-col justify-between">
          
          {/* Benchmark Panel */}
          <div className="glass-panel rounded-3xl p-6 border border-white/10 space-y-5">
            <h3 className="text-xs font-extrabold text-slate-300 tracking-widest uppercase mb-4 flex items-center gap-2 font-mono">
              <Target size={16} className="text-[#38BDF8]" /> Benchmark de Mercado ({niche})
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-300">Média do Nicho</span>
                  <span className="text-slate-400 font-mono">{nicheAvg} pts</span>
                </div>
                <div className="w-full bg-[#080B14] h-2 rounded-full overflow-hidden border border-white/5">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${nicheAvg}%` }} transition={{ duration: 1, delay: 0.8 }} className="bg-slate-700 h-full"></motion.div>
                </div>
              </div>
              
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-white">Seu Score Atual</span>
                  <span className="text-[#FA26A0] font-mono">{currentScore} pts</span>
                </div>
                <div className="w-full bg-[#080B14] h-2.5 rounded-full overflow-hidden border border-white/10">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${currentScore}%` }} transition={{ duration: 1, delay: 1 }} className="bg-gradient-to-r from-[#FF5E36] to-[#E1306C] h-full"></motion.div>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-amber-300">Top 10% do Nicho</span>
                  <span className="text-amber-400 font-mono">{top10} pts</span>
                </div>
                <div className="w-full bg-[#080B14] h-2 rounded-full overflow-hidden border border-white/5">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${top10}%` }} transition={{ duration: 1, delay: 1.2 }} className="bg-amber-500 h-full"></motion.div>
                </div>
              </div>
            </div>
          </div>

          {/* Evolution Projection Card */}
          <div className="glass-panel rounded-3xl p-6 border border-white/10 bg-gradient-to-r from-[#120924]/80 to-[#1D0C3A]/80">
            <h3 className="text-xs font-extrabold text-[#FA26A0] tracking-widest uppercase mb-3 flex items-center gap-2 font-mono">
              <TrendingUp size={16} /> Simulação de Score Alvo (Projeção Matemática)
            </h3>
            <p className="text-xs text-slate-300 mb-5 leading-relaxed">
              Simulação matemática do score potencial ao implementar as 5 ações prioritárias de conformidade estrutural:
            </p>
            
            <div className="flex items-center justify-between bg-[#080B14]/70 p-4 rounded-2xl border border-white/10">
               <div className="text-center">
                 <span className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1 font-mono">Pontuação Atual</span>
                 <span className="text-2xl font-black text-slate-300 font-display">{currentScore}</span>
               </div>
               <div className="text-slate-500">
                 <ArrowRight size={22} className="text-[#FF5E36]" />
               </div>
               <div className="text-center">
                 <span className="block text-[10px] text-[#FA26A0] uppercase tracking-wider mb-1 font-mono font-bold">Score Alvo Simulado</span>
                 <span className="text-3xl font-black text-white font-display">{scoring.targetScore || currentScore + 18}</span>
               </div>
            </div>
            <p className="text-[10px] text-slate-400 mt-3 font-mono">
              * O Score Alvo é uma simulação matemática de conformidade com a metodologia C.A.G.E. e não representa garantia de alcance, seguidores ou vendas.
            </p>
          </div>

        </div>
      </div>

      {/* 3. C.A.G.E. Framework Cards with Distinct Colors */}
      <div className="space-y-6 pt-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-white font-display">Matriz C.A.G.E. de Performance</h2>
          <p className="text-slate-400 text-xs">As 4 dimensões fundamentais da sua inteligência no Instagram.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* C - Conversion */}
          <div className="cage-conversion rounded-2xl p-5 space-y-4 transition-all hover:scale-[1.02]">
            <div className="flex items-center justify-between">
              <span className="w-10 h-10 rounded-xl bg-[#FF5E36]/20 text-[#FF5E36] flex items-center justify-center font-black text-sm border border-[#FF5E36]/30">
                C
              </span>
              <span className="text-xs font-mono font-bold text-[#FF5E36]">{cageScore} pts</span>
            </div>
            <div>
              <h3 className="font-bold text-white text-base font-display">Conversion</h3>
              <p className="text-xs text-slate-300 leading-relaxed mt-1">Capacidade de transformar visitantes em clientes e seguidores qualificados.</p>
            </div>
            <div className="w-full bg-[#080B14] h-1.5 rounded-full overflow-hidden">
              <div className="bg-[#FF5E36] h-full" style={{ width: `${cageScore}%` }}></div>
            </div>
          </div>

          {/* A - Authority */}
          <div className="cage-authority rounded-2xl p-5 space-y-4 transition-all hover:scale-[1.02]">
            <div className="flex items-center justify-between">
              <span className="w-10 h-10 rounded-xl bg-[#38BDF8]/20 text-[#38BDF8] flex items-center justify-center font-black text-sm border border-[#38BDF8]/30">
                A
              </span>
              <span className="text-xs font-mono font-bold text-[#38BDF8]">{executionScore} pts</span>
            </div>
            <div>
              <h3 className="font-bold text-white text-base font-display">Authority</h3>
              <p className="text-xs text-slate-300 leading-relaxed mt-1">Sinais visuais e prova social que estabelecem liderança de nicho.</p>
            </div>
            <div className="w-full bg-[#080B14] h-1.5 rounded-full overflow-hidden">
              <div className="bg-[#38BDF8] h-full" style={{ width: `${executionScore}%` }}></div>
            </div>
          </div>

          {/* G - Growth */}
          <div className="cage-growth rounded-2xl p-5 space-y-4 transition-all hover:scale-[1.02]">
            <div className="flex items-center justify-between">
              <span className="w-10 h-10 rounded-xl bg-[#10B981]/20 text-[#10B981] flex items-center justify-center font-black text-sm border border-[#10B981]/30">
                G
              </span>
              <span className="text-xs font-mono font-bold text-[#10B981]">{momentumScore} pts</span>
            </div>
            <div>
              <h3 className="font-bold text-white text-base font-display">Growth</h3>
              <p className="text-xs text-slate-300 leading-relaxed mt-1">Eficácia em SEO e descoberta orgânica por novos públicos.</p>
            </div>
            <div className="w-full bg-[#080B14] h-1.5 rounded-full overflow-hidden">
              <div className="bg-[#10B981] h-full" style={{ width: `${momentumScore}%` }}></div>
            </div>
          </div>

          {/* E - Expression */}
          <div className="cage-expression rounded-2xl p-5 space-y-4 transition-all hover:scale-[1.02]">
            <div className="flex items-center justify-between">
              <span className="w-10 h-10 rounded-xl bg-[#E1306C]/20 text-[#FA26A0] flex items-center justify-center font-black text-sm border border-[#E1306C]/30">
                E
              </span>
              <span className="text-xs font-mono font-bold text-[#FA26A0]">{consistencyScore} pts</span>
            </div>
            <div>
              <h3 className="font-bold text-white text-base font-display">Expression</h3>
              <p className="text-xs text-slate-300 leading-relaxed mt-1">Consistência estética e clareza de comunicação no feed.</p>
            </div>
            <div className="w-full bg-[#080B14] h-1.5 rounded-full overflow-hidden">
              <div className="bg-[#E1306C] h-full" style={{ width: `${consistencyScore}%` }}></div>
            </div>
          </div>

        </div>
      </div>

      {/* 4. Critical Gaps as Tactical Missions */}
      <div className="space-y-6 pt-6">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-white font-display">Missões Táticas Prioritárias</h2>
          <p className="text-slate-400 text-xs">Ações imediatas para estancar o vazamento de audiência e clientes.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {diagnosis.critical_gaps.slice(0, 4).map((gap, idx) => {
            const cid = (gap.criterion_id || "").toLowerCase();
            let missionType: MissionType = "custom_mission_resolver";
            let buttonLabel = "Resolver esta Missão com IA";

            if (cid.includes("seo") || cid.includes("name") || cid.includes("nome")) {
              missionType = "seo_name_optimization";
              buttonLabel = "Otimizar Nome & SEO com IA";
            } else if (cid.includes("highlight") || cid.includes("destaque")) {
              missionType = "strategic_highlights";
              buttonLabel = "Estruturar Destaques Estratégicos";
            } else if (cid.includes("human") || cid.includes("pessoal") || cid.includes("rostos")) {
              missionType = "humanization_plan";
              buttonLabel = "Criar Plano de Humanização";
            } else if (cid.includes("authority") || cid.includes("prova") || cid.includes("autoridade")) {
              missionType = "authority_strategy";
              buttonLabel = "Gerar Estratégia de Autoridade";
            } else if (cid.includes("bio") || cid.includes("posicionamento") || cid.includes("proposta")) {
              missionType = "bio_generator_pro";
              buttonLabel = "Gerar 5 Bios com IA";
            }

            return (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                key={idx}
                className="glass-panel glass-panel-hover rounded-3xl p-6 flex flex-col justify-between group space-y-5 border border-white/10"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-mono font-bold text-[#FF5E36] tracking-wider uppercase">
                      MISSÃO 0{idx + 1}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#E1306C]/20 text-[#FA26A0] border border-[#E1306C]/30 text-[10px] font-bold uppercase font-mono">
                      Impacto Alto
                    </span>
                  </div>
                  
                  <h3 className="font-bold text-lg text-white font-display leading-snug">{gap.title}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">{gap.impact}</p>
                </div>

                {/* Tactical Action Trigger */}
                <button 
                  type="button"
                  onClick={() => handleExecuteMission(missionType, gap)}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-[#0F1424] to-[#182038] hover:from-[#182038] hover:to-[#222C4E] border border-white/15 hover:border-[#E1306C]/50 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer active:scale-98"
                >
                  <Zap size={15} className="text-[#FF5E36]" />
                  <span>{buttonLabel}</span>
                </button>
              </motion.div>
            );
          })}
        </div>

        {/* Dedicated Bio Generator Action Card */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/15 bg-gradient-to-br from-[#130E26]/80 via-[#0A0E1A] to-[#0A1826] space-y-4 shadow-xl">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-mono font-bold uppercase tracking-wider">
              <Sparkles size={14} className="text-[#FA26A0]" />
              <span>Bio Engine V12 — 5 Arquétipos Estratégicos</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-bold">
              ✓ Zero Clichês
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-xl sm:text-2xl font-bold text-white font-display">
                Gerador de Bios de Alta Conversão
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
                Gere 5 opções exclusivas (Autoridade, Conversão, Posicionamento, Humana e Premium) alinhadas aos gargalos do seu diagnóstico.
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleExecuteMission("bio_generator_pro", { criterion_id: "bio_clarity_positioning" })}
              className="px-6 py-3.5 rounded-2xl font-bold text-xs bg-gradient-to-r from-[#FF5E36] via-[#E1306C] to-[#833AB4] hover:opacity-95 text-white shadow-xl shadow-[#FF5E36]/20 transition-all flex items-center gap-2 cursor-pointer shrink-0 active:scale-98"
            >
              <Sparkles size={16} />
              <span>Gerar 5 Bios Estratégicas</span>
            </button>
          </div>
        </div>
      </div>

      {/* 5. Connected Action Plan Timeline */}
      <div className="glass-panel rounded-3xl p-8 space-y-8 border border-white/10">
         <div className="space-y-1">
           <h3 className="text-xl font-bold text-white flex items-center gap-2 font-display">
             <LayoutTemplate size={22} className="text-[#38BDF8]" />
             Plano de Ação Conectado (Timeline OS)
           </h3>
           <p className="text-xs text-slate-400">Roteiro tático passo a passo para os próximos 7 dias.</p>
         </div>

         <div className="relative border-l-2 border-[#E1306C]/30 ml-4 pl-6 space-y-8">
           {diagnosis.recommended_actions.slice(0, 4).map((act, idx) => {
             const days = ["Dia 1", "Dia 2", "Dia 3", "Dia 7"];
             const isDone = completedSteps[idx];

             return (
               <div key={idx} className="relative group">
                 {/* Connected Node Dot */}
                 <div 
                   onClick={() => toggleStep(idx)}
                   className={`absolute -left-[35px] top-1 w-6 h-6 rounded-full flex items-center justify-center cursor-pointer transition-all ${
                     isDone 
                       ? "bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)]" 
                       : "bg-[#080B14] border-2 border-[#E1306C] text-[#FA26A0]"
                   }`}
                 >
                   {isDone ? <CheckCircle size={14} /> : <span className="text-[10px] font-mono font-bold">{idx + 1}</span>}
                 </div>

                 <div className={`glass-panel p-5 rounded-2xl border transition-all ${
                   isDone ? "border-emerald-500/30 bg-emerald-950/10 opacity-75" : "border-white/10 hover:border-white/20"
                 }`}>
                   <div className="flex items-center justify-between gap-4 mb-2">
                     <span className="text-xs font-mono font-bold text-[#38BDF8] uppercase tracking-wider">
                       {days[idx] || `Dia ${idx + 1}`}
                     </span>
                     <span className="text-[10px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-400">
                       Tempo estimado: 5-10 min
                     </span>
                   </div>

                   <h4 className={`font-bold text-base font-display ${isDone ? "line-through text-slate-400" : "text-white"}`}>
                     {act.title}
                   </h4>
                   <p className="text-xs text-slate-300 leading-relaxed mt-1">
                     {act.instruction}
                   </p>

                   <div className="mt-4 flex justify-end">
                     <button
                       type="button"
                       onClick={() => toggleStep(idx)}
                       className={`text-xs font-bold px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                         isDone 
                           ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
                           : "bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10"
                       }`}
                     >
                       {isDone ? "✓ Concluído" : "Marcar como Concluído"}
                     </button>
                   </div>
                 </div>
               </div>
             );
           })}
         </div>
      </div>

        </div>
        </div>
      )}

      {/* Tab 4: Pro AI Content Generator & Resolution Hub */}
      {activeTab === 'pro_tools' && (
        <div id="panel_pro_tools" role="tabpanel" aria-labelledby="tab_pro_tools">
          <ErrorBoundary fallbackTitle="Erro ao carregar Gerador PRO">
            <Suspense fallback={<LazyFallback message="Carregando Ferramentas PRO..." />}>
              <ProContentGenerator
                niche={niche || "Geral"}
                objective="Vendas & Conversão"
                targetAudience="Público Alvo Qualificado"
                criticalGaps={diagnosis?.critical_gaps?.map(g => `${g.title}: ${g.reason}`) || []}
                strengths={diagnosis?.strengths?.map(s => `${s.title}: ${s.reason}`) || []}
                score={currentScore}
                handle={handle}
                onOpenPaywall={() => openPaywall()}
              />
            </Suspense>
          </ErrorBoundary>
        </div>
      )}

      {/* Mission Execution & Deliverable Modal */}
      {isMissionModalOpen && (
        <ErrorBoundary fallbackTitle="Erro ao abrir Modal de Missão">
          <Suspense fallback={null}>
            <MissionDeliverableModal
              isOpen={isMissionModalOpen}
              onClose={() => setIsMissionModalOpen(false)}
              missionResult={activeMissionResult}
              loading={missionLoading}
              loadingStage={missionLoadingStage}
              errorMessage={missionError}
              onRetry={() => {
                if (lastMissionParams) {
                  handleExecuteMission(
                    lastMissionParams.missionType,
                    lastMissionParams.gap,
                    lastMissionParams.modifier
                  );
                }
              }}
              onRegenerateBio={handleRegenerateBio}
              activeBioModifier={activeBioModifier}
              onOpenPaywall={() => openPaywall()}
            />
          </Suspense>
        </ErrorBoundary>
      )}

    </motion.div>
  );
}
