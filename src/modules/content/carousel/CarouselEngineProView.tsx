import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  Layers,
  ShieldCheck,
  Check,
  Copy,
  RefreshCw,
  Edit3,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Target,
  Zap,
  Lock,
  Flame,
  Lightbulb,
  AlertTriangle,
  HelpCircle,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  ArrowRight,
  Sliders,
  FileText,
  Palette,
  Eye,
  List,
  Grid
} from "lucide-react";

import { ContentDNA, ContentObjectiveType, CagePillarId } from "../../../types/content-engine";
import {
  CarouselStrategyBrief,
  CarouselOutputPro,
  CarouselSlidePro,
  CarouselFeedbackRating,
  CarouselFeedbackReason
} from "../../../types/carousel-engine";
import { DigitalTwin } from "../../../core/DigitalTwin";
import { apiFetch, ApiError } from "../../../lib/api-client";

interface CarouselEngineProViewProps {
  dna: ContentDNA;
  digitalTwin?: DigitalTwin | null;
  isPro?: boolean;
  onOpenPaywall?: (reason?: string) => void;
  onSavedToLibrary?: (item: any) => void;
  onBackToModes?: () => void;
  initialTopic?: string;
  initialObjective?: ContentObjectiveType;
}

export const CarouselEngineProView: React.FC<CarouselEngineProViewProps> = ({
  dna,
  digitalTwin,
  isPro = true,
  onOpenPaywall,
  onSavedToLibrary,
  onBackToModes,
  initialTopic,
  initialObjective
}) => {
  // Navigation & Step Management
  const [currentStep, setCurrentStep] = useState<"brief" | "config" | "output">("brief");
  const [activeSlideIndex, setActiveSlideIndex] = useState<number>(0);
  const [viewMode, setViewMode] = useState<"carousel" | "list">("carousel");

  // Configuration States
  const [selectedObjective, setSelectedObjective] = useState<ContentObjectiveType>(initialObjective || "authority");
  const [themeMode, setThemeMode] = useState<"strategic_recommendation" | "custom_theme" | "dna_ideation">("strategic_recommendation");
  const [customTheme, setCustomTheme] = useState<string>(initialTopic || "");
  const [slideCount, setSlideCount] = useState<5 | 7 | 8 | 10 | 12>(7);
  const [customCta, setCustomCta] = useState<string>("");
  const [strategicAngle, setStrategicAngle] = useState<string>("Diagnóstico de Erro Silencioso & Framework Prático");

  // Server Communication States
  const [brief, setBrief] = useState<CarouselStrategyBrief | null>(null);
  const [carouselOutput, setCarouselOutput] = useState<CarouselOutputPro | null>(null);
  const [isLoadingBrief, setIsLoadingBrief] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationProgress, setGenerationProgress] = useState<number>(0);
  const [generationStatus, setGenerationStatus] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Interaction & Editing States
  const [editingSlideNumber, setEditingSlideNumber] = useState<number | null>(null);
  const [editedHeadline, setEditedHeadline] = useState<string>("");
  const [editedBody, setEditedBody] = useState<string>("");
  const [editedVisual, setEditedVisual] = useState<string>("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState<boolean>(false);

  // Single Slide Regeneration States
  const [isRegeneratingSlide, setIsRegeneratingSlide] = useState<boolean>(false);
  const [regenerateSlideNumber, setRegenerateSlideNumber] = useState<number | null>(null);
  const [slideInstruction, setSlideInstruction] = useState<string>("");

  // Feedback States
  const [showFeedbackModal, setShowFeedbackModal] = useState<boolean>(false);
  const [feedbackRating, setFeedbackRating] = useState<CarouselFeedbackRating>("excellent");
  const [feedbackReason, setFeedbackReason] = useState<CarouselFeedbackReason>("depth");
  const [feedbackNotes, setFeedbackNotes] = useState<string>("");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<boolean>(false);

  // Load initial brief on component mount
  useEffect(() => {
    loadStrategicBrief();
  }, [selectedObjective, slideCount]);

  const loadStrategicBrief = async () => {
    setIsLoadingBrief(true);
    setErrorMessage(null);
    try {
      const res = await apiFetch<{ success: boolean; brief: CarouselStrategyBrief }>("/api/carousel-engine/brief", {
        method: "POST",
        body: JSON.stringify({
          dna,
          digitalTwin,
          objective: selectedObjective,
          theme: themeMode === "custom_theme" ? customTheme : undefined,
          themeMode,
          slideCount,
          customCta: customCta || undefined,
          strategicAngle: strategicAngle || undefined
        })
      });

      if (res.success && res.brief) {
        setBrief(res.brief);
      }
    } catch (err: any) {
      console.error("[CarouselEnginePro] Failed to prepare brief:", err);
      setErrorMessage(err.message || "Erro ao preparar o Brief Estratégico.");
    } finally {
      setIsLoadingBrief(false);
    }
  };

  const handleGenerateCarousel = async () => {
    if (!isPro) {
      if (onOpenPaywall) onOpenPaywall("O Carrossel Engine Pro é exclusivo do plano InstaScore PRO.");
      return;
    }

    if (!brief) {
      await loadStrategicBrief();
    }

    setIsGenerating(true);
    setErrorMessage(null);
    setGenerationProgress(15);
    setGenerationStatus("Consultando Content DNA e Gargalo C.A.G.E....");

    const timer1 = setTimeout(() => {
      setGenerationProgress(40);
      setGenerationStatus("Construindo Arquitetura Narrativa de " + slideCount + " slides...");
    }, 1200);

    const timer2 = setTimeout(() => {
      setGenerationProgress(75);
      setGenerationStatus("Redigindo Copy e Direção Visual com Quality Gate 2.0...");
    }, 2800);

    try {
      // Re-fetch updated brief if user changed fields
      const freshBriefRes = await apiFetch<{ success: boolean; brief: CarouselStrategyBrief }>("/api/carousel-engine/brief", {
        method: "POST",
        body: JSON.stringify({
          dna,
          digitalTwin,
          objective: selectedObjective,
          theme: themeMode === "custom_theme" ? customTheme : undefined,
          themeMode,
          slideCount,
          customCta: customCta || undefined,
          strategicAngle: strategicAngle || undefined
        })
      });

      const activeBrief = freshBriefRes.brief || brief;

      const data = await apiFetch<{ success: boolean; carousel: CarouselOutputPro }>("/api/carousel-engine/generate", {
        method: "POST",
        body: JSON.stringify({ brief: activeBrief })
      });

      setGenerationProgress(100);
      setGenerationStatus("Carrossel Estratégico homologado e validado!");

      if (data.success && data.carousel) {
        setCarouselOutput(data.carousel);
        setCurrentStep("output");
        setActiveSlideIndex(0);
        setIsSaved(false);
      }
    } catch (err: any) {
      console.error("[CarouselEnginePro] Generation failed:", err);
      setErrorMessage(err.message || "Erro ao gerar Carrossel Estratégico. Tente novamente.");
    } finally {
      clearTimeout(timer1);
      clearTimeout(timer2);
      setIsGenerating(false);
    }
  };

  const handleStartEditSlide = (slide: CarouselSlidePro) => {
    setEditingSlideNumber(slide.slideNumber);
    setEditedHeadline(slide.headline);
    setEditedBody(slide.body);
    setEditedVisual(slide.visualDirection);
  };

  const handleSaveSlideEdit = () => {
    if (!carouselOutput || editingSlideNumber === null) return;
    const updatedSlides = carouselOutput.slides.map(s => {
      if (s.slideNumber === editingSlideNumber) {
        return {
          ...s,
          headline: editedHeadline,
          body: editedBody,
          visualDirection: editedVisual
        };
      }
      return s;
    });

    setCarouselOutput({
      ...carouselOutput,
      slides: updatedSlides
    });
    setEditingSlideNumber(null);
  };

  const handleRegenerateSingleSlide = async () => {
    if (!carouselOutput || regenerateSlideNumber === null) return;
    setIsRegeneratingSlide(true);
    try {
      const res = await apiFetch<{ success: boolean; slide: CarouselSlidePro }>("/api/carousel-engine/regenerate-slide", {
        method: "POST",
        body: JSON.stringify({
          carousel: carouselOutput,
          slideNumber: regenerateSlideNumber,
          customInstruction: slideInstruction
        })
      });

      if (res.success && res.slide) {
        const updatedSlides = carouselOutput.slides.map(s =>
          s.slideNumber === regenerateSlideNumber ? res.slide : s
        );
        setCarouselOutput({
          ...carouselOutput,
          slides: updatedSlides
        });
        setRegenerateSlideNumber(null);
        setSlideInstruction("");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Erro ao regenerar slide.");
    } finally {
      setIsRegeneratingSlide(false);
    }
  };

  const handleSaveToLibrary = async () => {
    if (!carouselOutput) return;
    try {
      const itemToSave = {
        id: carouselOutput.id,
        format: "carousel",
        title: carouselOutput.title,
        hook: carouselOutput.coverHeadline,
        content: {
          coverHeadline: carouselOutput.coverHeadline,
          coverSubtitle: carouselOutput.coverSubtitle,
          slides: carouselOutput.slides,
          caption: carouselOutput.caption,
          finalCta: carouselOutput.finalCta,
          hashtags: carouselOutput.hashtags
        },
        objective: carouselOutput.objective,
        pillar: carouselOutput.cagePillar,
        targetAudience: carouselOutput.targetAudience,
        status: "ready",
        createdAt: new Date().toISOString()
      };

      await apiFetch("/api/content/library/save", {
        method: "POST",
        body: JSON.stringify({ item: itemToSave })
      });

      setIsSaved(true);
      if (onSavedToLibrary) onSavedToLibrary(itemToSave);
    } catch (err: any) {
      setErrorMessage("Erro ao salvar carrossel na biblioteca.");
    }
  };

  const copySlideText = (slide: CarouselSlidePro) => {
    const formatted = `[SLIDE ${slide.slideNumber} — ${slide.roleLabel.toUpperCase()}]\n\nHEADLINE:\n${slide.headline}\n\nCOPY:\n${slide.body}\n\nDIREÇÃO VISUAL:\n${slide.visualDirection}`;
    navigator.clipboard.writeText(formatted);
    setCopiedKey(`slide_${slide.slideNumber}`);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const copyFullCarousel = () => {
    if (!carouselOutput) return;
    const slidesText = carouselOutput.slides
      .map(
        s =>
          `━━━━━━━━━━━━━━━━━━━━━━━━━━━\nSLIDE ${s.slideNumber}: ${s.roleLabel}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n📌 HEADLINE:\n${s.headline}\n\n📝 COPY:\n${s.body}\n\n🎨 DIREÇÃO VISUAL:\n${s.visualDirection}\n`
      )
      .join("\n\n");

    const full = `CARROSSEL ESTRATÉGICO INSTASCORE PRO\nTÍTULO: ${carouselOutput.title}\nOBJETIVO: ${carouselOutput.objective.toUpperCase()} | PILAR C.A.G.E.: ${carouselOutput.cagePillar.toUpperCase()}\n\n${slidesText}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━\nLEGENDA COMPLETA:\n━━━━━━━━━━━━━━━━━━━━━━━━━━━\n${carouselOutput.caption}\n\nCTA FINAL: ${carouselOutput.finalCta}\n\nHASHTAGS: ${carouselOutput.hashtags.join(" ")}`;

    navigator.clipboard.writeText(full);
    setCopiedKey("full");
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleSubmitFeedback = async () => {
    if (!carouselOutput) return;
    try {
      await apiFetch("/api/carousel-engine/feedback", {
        method: "POST",
        body: JSON.stringify({
          carousel: carouselOutput,
          digitalTwin,
          feedback: {
            carouselId: carouselOutput.id,
            rating: feedbackRating,
            reason: feedbackReason,
            customNotes: feedbackNotes
          }
        })
      });
      setFeedbackSubmitted(true);
      setTimeout(() => {
        setShowFeedbackModal(false);
        setFeedbackSubmitted(false);
      }, 2000);
    } catch (err: any) {
      console.warn("[Feedback Error]", err);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 pb-20">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#FA26A0] via-[#E1306C] to-[#FF5E36] flex items-center justify-center text-white shadow-[0_0_20px_rgba(250,38,160,0.3)] shrink-0">
            <Layers size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-white font-display tracking-tight">
                Carrossel Engine PRO
              </h1>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/40">
                V14 STRATEGIC
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Transformação de inteligência de diagnóstico em carrosséis de autoridade e conversão.
            </p>
          </div>
        </div>

        {onBackToModes && (
          <button
            type="button"
            onClick={onBackToModes}
            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-300 hover:text-white transition-all cursor-pointer self-start sm:self-auto"
          >
            ← Voltar ao Content Engine
          </button>
        )}
      </div>

      {/* ERROR ALERT */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between gap-3 text-xs text-rose-300">
          <div className="flex items-center gap-2.5">
            <AlertTriangle size={18} className="text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="px-2 py-1 text-xs font-bold text-slate-400 hover:text-white cursor-pointer"
          >
            Fechar
          </button>
        </div>
      )}

      {/* PROGRESSIVE DISCLOSURE STEPS TABS */}
      <div className="flex items-center justify-between bg-black/40 p-1.5 rounded-2xl border border-white/10 text-xs font-bold">
        <button
          type="button"
          onClick={() => setCurrentStep("brief")}
          className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
            currentStep === "brief"
              ? "bg-white/15 text-white shadow-md border border-white/10"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <span>1. Contexto Estratégico</span>
        </button>
        <button
          type="button"
          onClick={() => setCurrentStep("config")}
          className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
            currentStep === "config"
              ? "bg-white/15 text-white shadow-md border border-white/10"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <span>2. Configuração & Estrutura</span>
        </button>
        <button
          type="button"
          disabled={!carouselOutput}
          onClick={() => setCurrentStep("output")}
          className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
            currentStep === "output"
              ? "bg-[#E1306C]/30 text-white shadow-md border border-[#FA26A0]/50"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Sparkles size={14} className={carouselOutput ? "text-[#FA26A0]" : "text-slate-500"} />
          <span>3. Carrossel Pronto</span>
        </button>
      </div>

      {/* STEP 1: CONTEXTO ESTRATÉGICO ("Por que este carrossel?") */}
      {currentStep === "brief" && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-[#0C1021] border border-white/10 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#FA26A0] font-bold">
                <Target size={16} />
                <span>Diagnóstico & Inteligência Acumulada</span>
              </div>
              {brief && (
                <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                  <ShieldCheck size={13} />
                  <span>Confiança Estatística: {brief.confidence}%</span>
                </span>
              )}
            </div>

            <h2 className="text-lg font-bold text-white font-display">
              Por que este carrossel foi planejado para você?
            </h2>

            {isLoadingBrief ? (
              <div className="p-8 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                <RefreshCw size={16} className="animate-spin text-[#FA26A0]" />
                <span>Calculando Next Best Action e alinhamento C.A.G.E....</span>
              </div>
            ) : brief ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Gargalo */}
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
                  <span className="text-[10px] font-mono uppercase font-bold text-rose-400 flex items-center gap-1.5">
                    <Flame size={13} />
                    Gargalo Crítico Identificado
                  </span>
                  <div className="text-sm font-bold text-white">
                    {brief.whyThisCarousel.identifiedBottleneck}
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {brief.bottleneck}
                  </p>
                </div>

                {/* Próxima Melhor Ação */}
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
                  <span className="text-[10px] font-mono uppercase font-bold text-emerald-400 flex items-center gap-1.5">
                    <Zap size={13} />
                    Próxima Melhor Ação Estratégica
                  </span>
                  <div className="text-sm font-bold text-white">
                    {brief.whyThisCarousel.recommendedStrategy}
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {brief.nextBestAction}
                  </p>
                </div>

                {/* Posicionamento & Tom */}
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1.5">
                  <span className="text-[10px] font-mono uppercase font-bold text-purple-400">
                    Posicionamento & Nicho
                  </span>
                  <div className="text-xs font-semibold text-slate-200">
                    {brief.positioning} · Nicho: {brief.contentDNA.niche}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Tom de Voz: {brief.toneOfVoice}
                  </div>
                </div>

                {/* Racional de Decisão */}
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1.5">
                  <span className="text-[10px] font-mono uppercase font-bold text-amber-400">
                    Gatilho & Justificativa do Algoritmo
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {brief.whyThisCarousel.rationale}
                  </p>
                </div>
              </div>
            ) : null}

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setCurrentStep("config")}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#FF5E36] via-[#E1306C] to-[#833AB4] text-white font-bold text-xs flex items-center gap-2 shadow-xl hover:opacity-90 transition-all cursor-pointer"
              >
                <span>Avançar para Configuração</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: CONFIGURAÇÃO & ESTRUTURA NARRATIVA */}
      {currentStep === "config" && (
        <div className="p-6 rounded-3xl bg-[#0C1021] border border-white/10 shadow-2xl space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold text-white font-display flex items-center gap-2">
              <Sliders size={18} className="text-[#FA26A0]" />
              <span>Configuração da Máquina de Carrosséis</span>
            </h2>
            <span className="text-xs text-slate-400 font-mono">Etapa 2 de 3</span>
          </div>

          {/* 1. Objetivo */}
          <div className="space-y-2.5">
            <label className="text-xs font-mono uppercase font-bold text-slate-400 block">
              1. Objetivo Estratégico
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {[
                { id: "authority", label: "Autoridade", desc: "Demonstrar método e domínio" },
                { id: "conversion", label: "Conversão", desc: "Leads e Direct" },
                { id: "growth", label: "Descoberta", desc: "Quebra de padrão topo de funil" },
                { id: "engagement", label: "Engajamento", desc: "Comentários e salvamentos" },
                { id: "education", label: "Educação", desc: "Processo passo a passo" },
                { id: "sales", label: "Venda Direta", desc: "Apresentação da oferta" }
              ].map(obj => (
                <button
                  key={obj.id}
                  type="button"
                  onClick={() => setSelectedObjective(obj.id as ContentObjectiveType)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    selectedObjective === obj.id
                      ? "bg-[#FA26A0]/20 border-[#FA26A0] text-white shadow-lg"
                      : "bg-white/[0.02] border-white/10 text-slate-400 hover:text-white"
                  }`}
                >
                  <div className="text-xs font-bold text-white mb-0.5">{obj.label}</div>
                  <div className="text-[10px] text-slate-400 leading-tight">{obj.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Tema */}
          <div className="space-y-3">
            <label className="text-xs font-mono uppercase font-bold text-slate-400 block">
              2. Tema & Enredo
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setThemeMode("strategic_recommendation")}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  themeMode === "strategic_recommendation"
                    ? "bg-white/15 border-white text-white"
                    : "bg-white/[0.02] border-white/10 text-slate-400 hover:text-white"
                }`}
              >
                <div className="text-xs font-bold text-white">⭐ Recomendação Estratégica</div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Usa o tema derivado do seu gargalo e C.A.G.E.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setThemeMode("custom_theme")}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  themeMode === "custom_theme"
                    ? "bg-white/15 border-white text-white"
                    : "bg-white/[0.02] border-white/10 text-slate-400 hover:text-white"
                }`}
              >
                <div className="text-xs font-bold text-white">✍️ Informar Tema Específico</div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Você define o tópico exato e o IA estrutura.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setThemeMode("dna_ideation")}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  themeMode === "dna_ideation"
                    ? "bg-white/15 border-white text-white"
                    : "bg-white/[0.02] border-white/10 text-slate-400 hover:text-white"
                }`}
              >
                <div className="text-xs font-bold text-white">💡 Ideação com Content DNA</div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Explora ângulos anti-senso comum do seu nicho.
                </p>
              </button>
            </div>

            {themeMode === "custom_theme" && (
              <input
                type="text"
                value={customTheme}
                onChange={e => setCustomTheme(e.target.value)}
                placeholder="Ex: Como precificar consultoria sem medo de perder clientes..."
                className="w-full bg-black/40 border border-white/15 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#FA26A0]"
              />
            )}
          </div>

          {/* 3. Quantidade de Slides */}
          <div className="space-y-2.5">
            <label className="text-xs font-mono uppercase font-bold text-slate-400 block">
              3. Quantidade de Slides (Arquitetura Narrativa)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {[
                { count: 5, label: "5 Slides", badge: "Alta Retenção", desc: "Rápido, dinâmico e direto ao ponto" },
                { count: 7, label: "7 Slides", badge: "Padrão de Autoridade", desc: "Hook -> Problema -> Insight -> Método -> CTA" },
                { count: 8, label: "8 Slides", badge: "Objeções & Prova", desc: "Desconstrução de mitos com evidências" },
                { count: 10, label: "10 Slides", badge: "Masterclass", desc: "Framework profundo de 3 fases completas" },
                { count: 12, label: "12 Slides", badge: "Guia Definitivo", desc: "Blueprint exaustivo com estudo de caso" }
              ].map(s => (
                <button
                  key={s.count}
                  type="button"
                  onClick={() => setSlideCount(s.count as any)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    slideCount === s.count
                      ? "bg-[#FA26A0]/20 border-[#FA26A0] text-white shadow-lg"
                      : "bg-white/[0.02] border-white/10 text-slate-400 hover:text-white"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white">{s.label}</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-slate-300">
                      {s.badge}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">{s.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* 4. CTA Personalizada */}
          <div className="space-y-2">
            <label className="text-xs font-mono uppercase font-bold text-slate-400 block">
              4. Chamada para Ação (CTA) — Opcional
            </label>
            <input
              type="text"
              value={customCta}
              onChange={e => setCustomCta(e.target.value)}
              placeholder="Deixe em branco para usar a CTA automática baseada na sua Next Best Action..."
              className="w-full bg-black/40 border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#FA26A0]"
            />
          </div>

          {/* Generate Button */}
          <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => setCurrentStep("brief")}
              className="text-xs font-bold text-slate-400 hover:text-white cursor-pointer"
            >
              ← Voltar ao Contexto
            </button>

            <button
              type="button"
              disabled={isGenerating}
              onClick={handleGenerateCarousel}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#FF5E36] via-[#E1306C] to-[#833AB4] text-white font-bold text-xs flex items-center justify-center gap-2.5 shadow-2xl hover:opacity-90 transition-all cursor-pointer disabled:opacity-50"
            >
              <Sparkles size={16} />
              <span>Gerar Carrossel Estratégico ({slideCount} Slides)</span>
            </button>
          </div>
        </div>
      )}

      {/* GENERATION PROGRESS INDICATOR */}
      {isGenerating && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-6 rounded-3xl bg-[#090C16] border border-[#FA26A0]/40 shadow-2xl space-y-4"
        >
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-white flex items-center gap-2">
              <Sparkles size={16} className="text-[#FA26A0] animate-spin" />
              {generationStatus}
            </span>
            <span className="font-mono text-[#FA26A0] font-bold text-sm">{generationProgress}%</span>
          </div>
          <div className="w-full bg-black/80 h-2.5 rounded-full overflow-hidden p-0.5 border border-white/10">
            <div
              className="h-full bg-gradient-to-r from-[#FF5E36] via-[#E1306C] to-[#833AB4] rounded-full transition-all duration-500 shadow-[0_0_15px_rgba(250,38,160,0.5)]"
              style={{ width: `${generationProgress}%` }}
            />
          </div>
        </motion.div>
      )}

      {/* STEP 3: CARROSSEL PRONTO (OUTPUT & VIEWER) */}
      {currentStep === "output" && carouselOutput && (
        <div className="space-y-6">
          {/* Strategic Summary Header */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-[#101428] to-[#0A0D18] border border-white/15 shadow-2xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-[#FA26A0]/20 text-[#FA26A0] border border-[#FA26A0]/40">
                  {carouselOutput.objective.toUpperCase()}
                </span>
                <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
                  PILAR: {carouselOutput.cagePillar.toUpperCase()}
                </span>
                <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-white/10 text-white">
                  {carouselOutput.slides.length} SLIDES
                </span>
              </div>

              {carouselOutput.qualityReport && (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 font-bold">
                    <ShieldCheck size={14} />
                    Quality Gate: {carouselOutput.qualityReport.score}/100
                  </span>
                </div>
              )}
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white font-display">
                {carouselOutput.title}
              </h2>
              <p className="text-xs text-slate-300 mt-1">
                {carouselOutput.coverSubtitle}
              </p>
            </div>

            {/* Quick Actions Bar */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 text-xs">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setViewMode(viewMode === "carousel" ? "list" : "carousel")}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  {viewMode === "carousel" ? <List size={14} /> : <Eye size={14} />}
                  <span>{viewMode === "carousel" ? "Modo Lista" : "Modo Slide a Slide"}</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={copyFullCarousel}
                  className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  {copiedKey === "full" ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  <span>{copiedKey === "full" ? "Copiado!" : "Copiar Carrossel Completo"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveToLibrary}
                  disabled={isSaved}
                  className={`px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    isSaved
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                      : "bg-white/10 hover:bg-white/20 text-white"
                  }`}
                >
                  <Bookmark size={14} />
                  <span>{isSaved ? "Salvo na Biblioteca" : "Salvar na Biblioteca"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowFeedbackModal(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-amber-300 font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <MessageSquare size={14} />
                  <span>Avaliar</span>
                </button>

                <button
                  type="button"
                  onClick={handleGenerateCarousel}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#FF5E36] to-[#E1306C] text-white font-bold flex items-center gap-1.5 transition-all cursor-pointer hover:opacity-90"
                >
                  <RefreshCw size={14} />
                  <span>Regenerar</span>
                </button>
              </div>
            </div>
          </div>

          {/* SLIDE VIEWER: CAROUSEL MODE */}
          {viewMode === "carousel" && (
            <div className="space-y-4">
              {/* Active Slide Card */}
              {carouselOutput.slides[activeSlideIndex] && (
                <div className="relative p-6 sm:p-8 rounded-3xl bg-[#090C18] border border-white/15 shadow-2xl space-y-6">
                  {/* Top Bar of Slide */}
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-mono font-extrabold px-3 py-1 rounded-xl bg-white/15 text-white">
                        SLIDE {carouselOutput.slides[activeSlideIndex].slideNumber} / {carouselOutput.slides.length}
                      </span>
                      <span className="text-xs font-bold text-[#FA26A0]">
                        {carouselOutput.slides[activeSlideIndex].roleLabel}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => copySlideText(carouselOutput.slides[activeSlideIndex])}
                        className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        {copiedKey === `slide_${carouselOutput.slides[activeSlideIndex].slideNumber}` ? (
                          <Check size={13} className="text-emerald-400" />
                        ) : (
                          <Copy size={13} />
                        )}
                        <span>Copiar Slide</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStartEditSlide(carouselOutput.slides[activeSlideIndex])}
                        className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Edit3 size={13} />
                        <span>Editar</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setRegenerateSlideNumber(carouselOutput.slides[activeSlideIndex].slideNumber)}
                        className="px-2.5 py-1 rounded-lg bg-[#FA26A0]/10 hover:bg-[#FA26A0]/20 text-[#FA26A0] text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw size={13} />
                        <span>Regenerar Este Slide</span>
                      </button>
                    </div>
                  </div>

                  {/* Slide Content Preview / Edit Form */}
                  {editingSlideNumber === carouselOutput.slides[activeSlideIndex].slideNumber ? (
                    <div className="space-y-4 p-4 rounded-2xl bg-black/40 border border-white/10">
                      <div>
                        <label className="text-[10px] font-mono uppercase font-bold text-slate-400 block mb-1">
                          Headline
                        </label>
                        <input
                          type="text"
                          value={editedHeadline}
                          onChange={e => setEditedHeadline(e.target.value)}
                          className="w-full bg-black/60 border border-white/20 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#FA26A0]"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-mono uppercase font-bold text-slate-400 block mb-1">
                          Texto Principal (Copy)
                        </label>
                        <textarea
                          rows={4}
                          value={editedBody}
                          onChange={e => setEditedBody(e.target.value)}
                          className="w-full bg-black/60 border border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FA26A0]"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-mono uppercase font-bold text-slate-400 block mb-1">
                          Direção Visual
                        </label>
                        <textarea
                          rows={2}
                          value={editedVisual}
                          onChange={e => setEditedVisual(e.target.value)}
                          className="w-full bg-black/60 border border-white/20 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-[#FA26A0]"
                        />
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setEditingSlideNumber(null)}
                          className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveSlideEdit}
                          className="px-4 py-1.5 rounded-xl bg-emerald-500 text-white font-bold text-xs"
                        >
                          Salvar Alterações
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                      {/* Left: Copy & Text */}
                      <div className="lg:col-span-7 space-y-4">
                        <h3 className="text-xl sm:text-2xl font-extrabold text-white font-display leading-snug">
                          {carouselOutput.slides[activeSlideIndex].headline}
                        </h3>

                        <div className="text-sm text-slate-200 leading-relaxed whitespace-pre-line font-medium">
                          {carouselOutput.slides[activeSlideIndex].body}
                        </div>

                        {carouselOutput.slides[activeSlideIndex].emphasis && (
                          <div className="inline-block px-3 py-1 rounded-xl bg-white/5 border border-white/10 text-xs text-amber-300 font-semibold">
                            ✨ Ênfase: {carouselOutput.slides[activeSlideIndex].emphasis}
                          </div>
                        )}
                      </div>

                      {/* Right: Visual Guidance Box */}
                      <div className="lg:col-span-5 p-5 rounded-2xl bg-gradient-to-b from-white/[0.04] to-transparent border border-white/10 space-y-3">
                        <div className="flex items-center gap-2 text-xs font-mono uppercase font-bold text-purple-400">
                          <Palette size={15} />
                          <span>Direção Visual & Layout</span>
                        </div>

                        <div className="text-xs text-slate-300 leading-relaxed">
                          {carouselOutput.slides[activeSlideIndex].visualDirection}
                        </div>

                        {carouselOutput.slides[activeSlideIndex].layoutSuggestion && (
                          <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 text-[11px] text-slate-400">
                            <strong className="text-slate-200">Layout Sugerido:</strong> {carouselOutput.slides[activeSlideIndex].layoutSuggestion}
                          </div>
                        )}

                        {carouselOutput.slides[activeSlideIndex].designIntent && (
                          <div className="text-[11px] text-slate-400 italic">
                            🎯 Intenção: {carouselOutput.slides[activeSlideIndex].designIntent}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Carousel Pagination Controls */}
                  <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <button
                      type="button"
                      disabled={activeSlideIndex === 0}
                      onClick={() => setActiveSlideIndex(prev => Math.max(0, prev - 1))}
                      className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <ChevronLeft size={16} />
                      <span>Anterior</span>
                    </button>

                    <div className="flex items-center gap-1.5 overflow-x-auto px-2 max-w-[200px] sm:max-w-none">
                      {carouselOutput.slides.map((s, idx) => (
                        <button
                          key={s.slideNumber}
                          type="button"
                          onClick={() => setActiveSlideIndex(idx)}
                          className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            activeSlideIndex === idx
                              ? "bg-[#FA26A0] text-white shadow-lg scale-110"
                              : "bg-white/5 text-slate-400 hover:text-white"
                          }`}
                        >
                          {s.slideNumber}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      disabled={activeSlideIndex === carouselOutput.slides.length - 1}
                      onClick={() => setActiveSlideIndex(prev => Math.min(carouselOutput.slides.length - 1, prev + 1))}
                      className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <span>Próximo</span>
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SLIDE VIEWER: LIST GRID MODE */}
          {viewMode === "list" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {carouselOutput.slides.map(slide => (
                  <div
                    key={slide.slideNumber}
                    className="p-5 rounded-2xl bg-[#090C18] border border-white/10 hover:border-white/25 transition-all space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-lg bg-white/10 text-white">
                          SLIDE {slide.slideNumber} · {slide.roleLabel}
                        </span>
                        <button
                          type="button"
                          onClick={() => copySlideText(slide)}
                          className="text-slate-400 hover:text-white cursor-pointer"
                        >
                          {copiedKey === `slide_${slide.slideNumber}` ? (
                            <Check size={14} className="text-emerald-400" />
                          ) : (
                            <Copy size={14} />
                          )}
                        </button>
                      </div>

                      <h4 className="text-base font-bold text-white font-display">
                        {slide.headline}
                      </h4>

                      <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                        {slide.body}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 text-[11px] text-purple-300 mt-2">
                      <strong>🎨 Visual:</strong> {slide.visualDirection}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CAPTION & HASHTAGS CARD */}
          <div className="p-6 rounded-3xl bg-[#0B0E1E] border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider flex items-center gap-2">
                <FileText size={16} className="text-[#FA26A0]" />
                <span>Legenda Completa para o Feed</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(`${carouselOutput.caption}\n\n${carouselOutput.hashtags.join(" ")}`);
                  setCopiedKey("caption");
                  setTimeout(() => setCopiedKey(null), 2500);
                }}
                className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                {copiedKey === "caption" ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                <span>{copiedKey === "caption" ? "Copiada!" : "Copiar Legenda"}</span>
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-black/40 border border-white/5 text-xs text-slate-200 whitespace-pre-line leading-relaxed">
              {carouselOutput.caption}
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {carouselOutput.hashtags.map((tag, idx) => (
                <span key={idx} className="text-[11px] font-mono text-[#FA26A0] bg-[#FA26A0]/10 px-2 py-0.5 rounded">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: REGENERATE SINGLE SLIDE */}
      {regenerateSlideNumber !== null && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0D1120] border border-white/20 rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white font-display">
              Regenerar Slide {regenerateSlideNumber}
            </h3>
            <p className="text-xs text-slate-400">
              O motor de IA irá reescrever este slide mantendo a continuidade com o resto da narrativa.
            </p>

            <div>
              <label className="text-xs font-mono uppercase font-bold text-slate-400 block mb-1.5">
                Instrução Opcional
              </label>
              <textarea
                rows={3}
                value={slideInstruction}
                onChange={e => setSlideInstruction(e.target.value)}
                placeholder="Ex: Torne o gancho mais provocativo; dê um exemplo mais prático..."
                className="w-full bg-black/60 border border-white/15 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#FA26A0]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRegenerateSlideNumber(null)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isRegeneratingSlide}
                onClick={handleRegenerateSingleSlide}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#FF5E36] to-[#E1306C] text-white font-bold text-xs flex items-center gap-1.5 disabled:opacity-50"
              >
                {isRegeneratingSlide ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
                <span>Regenerar Agora</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: FEEDBACK & LEARNING LOOP */}
      {showFeedbackModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0D1120] border border-white/20 rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white font-display">
              Avaliação & Aprendizado Contínuo
            </h3>
            <p className="text-xs text-slate-400">
              Sua avaliação ajusta automaticamente o seu Digital Twin e evita temas repetidos na memória.
            </p>

            {feedbackSubmitted ? (
              <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-2">
                <Check size={24} className="text-emerald-400 mx-auto" />
                <div className="text-xs font-bold text-emerald-300">
                  Feedback Registrado com Sucesso!
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Rating Selection */}
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "excellent", label: "🔥 Excelente" },
                    { id: "good", label: "👍 Bom" },
                    { id: "does_not_fit", label: "⚠️ Não combina comigo" },
                    { id: "makes_no_sense", label: "❌ Não faz sentido" }
                  ].map(r => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setFeedbackRating(r.id as any)}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        feedbackRating === r.id
                          ? "bg-white/20 border-white text-white"
                          : "bg-white/[0.02] border-white/10 text-slate-400"
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>

                {/* Reason Selection */}
                <div>
                  <label className="text-[10px] font-mono uppercase font-bold text-slate-400 block mb-1">
                    Motivo Principal
                  </label>
                  <select
                    value={feedbackReason}
                    onChange={e => setFeedbackReason(e.target.value as any)}
                    className="w-full bg-black/60 border border-white/15 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="depth">Profundidade & Qualidade Técnica</option>
                    <option value="tone">Tom de Voz & Estilo</option>
                    <option value="theme">Tema / Assunto</option>
                    <option value="structure">Estrutura Narrativa</option>
                    <option value="cta">Chamada para Ação (CTA)</option>
                    <option value="positioning">Posicionamento do Nicho</option>
                    <option value="other">Outro</option>
                  </select>
                </div>

                {/* Custom Notes */}
                <div>
                  <label className="text-[10px] font-mono uppercase font-bold text-slate-400 block mb-1">
                    Comentários Adicionais (Opcional)
                  </label>
                  <textarea
                    rows={2}
                    value={feedbackNotes}
                    onChange={e => setFeedbackNotes(e.target.value)}
                    placeholder="Conte como podemos melhorar as próximas gerações..."
                    className="w-full bg-black/60 border border-white/15 rounded-xl p-2.5 text-xs text-white focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowFeedbackModal(false)}
                    className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                  >
                    Fechar
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmitFeedback}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#FF5E36] to-[#E1306C] text-white font-bold text-xs"
                  >
                    Enviar Avaliação
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
