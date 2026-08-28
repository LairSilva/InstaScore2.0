/**
 * INSTASCORE OS V14 — CONTENT PRODUCTION PRO VIEW
 * End-to-End Content Production for Carrossel Pro + Post Estático Pro
 * Strategy → Content Brief → Copy → Visual Generation → Composition → Quality Gate → Final Render → Ready to Publish
 */

import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Layers,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  Download,
  Copy,
  Check,
  RefreshCw,
  Edit3,
  Eye,
  Sliders,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  ThumbsUp,
  ThumbsDown,
  ArrowRight,
  Target,
  Palette,
  Maximize2,
  FileText,
  Share2,
  Bookmark,
  Zap,
  Lock,
  Flame,
  Info
} from "lucide-react";
import {
  ContentProductionFormat,
  VisualThemeId,
  StrategicContentProductionBrief,
  CarouselProductionOutput,
  StaticPostProductionOutput,
  ProductionSlide,
  ProductionFeedbackRating,
  ProductionFeedbackReason
} from "../../../types/content-production";
import { ContentDNA, ContentObjectiveType, CagePillarId } from "../../../types/content-engine";
import { DigitalTwin } from "../../../core/DigitalTwin";
import { apiFetch } from "../../../lib/api-client";
import {
  VISUAL_THEMES,
  renderCarouselSlideToDataUrl,
  renderStaticPostToDataUrl,
  renderAllCarouselSlides,
  downloadDataUrlAsPng,
  downloadAllSlidesSequentially
} from "../../../engine/visual/ContentVisualRenderer";

interface ContentProductionProViewProps {
  dna: ContentDNA;
  digitalTwin?: DigitalTwin | null;
  isPro?: boolean;
  onOpenPaywall?: () => void;
  onSavedToLibrary?: (item: any) => void;
  onBackToModes?: () => void;
  initialFormat?: ContentProductionFormat;
  initialTopic?: string;
  initialObjective?: ContentObjectiveType;
}

const OBJECTIVES: { id: ContentObjectiveType; label: string; desc: string; icon: string; pillar: CagePillarId }[] = [
  { id: "authority", label: "Autoridade Técnica", desc: "Consolida seu posicionamento como referência inquestionável no nicho.", icon: "👑", pillar: "authority" },
  { id: "conversion", label: "Conversão & Vendas", desc: "Quebra objeções silenciosas e conduz para oferta ou direct.", icon: "💰", pillar: "conversion" },
  { id: "growth", label: "Crescimento & Alcance", desc: "Tese contrária e alta retenção para atrair novos seguidores qualificados.", icon: "🚀", pillar: "growth" },
  { id: "education", label: "Educação & Framework", desc: "Passo a passo profundo com método acionável que gera salvamentos.", icon: "📚", pillar: "expression" },
  { id: "engagement", label: "Engajamento & Debate", desc: "Provoca discussão técnica e posicionamento da comunidade.", icon: "💬", pillar: "expression" }
];

const GENERATION_STEPS = [
  { step: 1, label: "Entendendo sua estratégia" },
  { step: 2, label: "Construindo o conceito" },
  { step: 3, label: "Escrevendo o conteúdo" },
  { step: 4, label: "Criando os visuais" },
  { step: 5, label: "Montando a composição" },
  { step: 6, label: "Executando o Quality Gate" },
  { step: 7, label: "Finalizando seu conteúdo" }
];

export const ContentProductionProView: React.FC<ContentProductionProViewProps> = ({
  dna,
  digitalTwin,
  isPro = true,
  onOpenPaywall,
  onSavedToLibrary,
  onBackToModes,
  initialFormat = "carousel",
  initialTopic = "",
  initialObjective = "authority"
}) => {
  // Navigation & Mode
  const [format, setFormat] = useState<ContentProductionFormat>(initialFormat);
  const [selectedObjective, setSelectedObjective] = useState<ContentObjectiveType>(initialObjective);
  const [slideCount, setSlideCount] = useState<5 | 7 | 8 | 10 | 12>(7);
  const [themeMode, setThemeMode] = useState<"strategic_recommendation" | "custom_theme" | "dna_ideation">("strategic_recommendation");
  const [customTheme, setCustomTheme] = useState<string>(initialTopic);
  const [selectedVisualTheme, setSelectedVisualTheme] = useState<VisualThemeId>("dark_editorial");
  const [customCta, setCustomCta] = useState<string>("");

  // Generation state
  const [isPreparingBrief, setIsPreparingBrief] = useState(false);
  const [currentBrief, setCurrentBrief] = useState<StrategicContentProductionBrief | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStepIndex, setGenerationStepIndex] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Deliverables
  const [carouselResult, setCarouselResult] = useState<CarouselProductionOutput | null>(null);
  const [staticPostResult, setStaticPostResult] = useState<StaticPostProductionOutput | null>(null);

  // Carousel interactive viewer
  const [activeSlideIndex, setActiveSlideIndex] = useState<number>(0);
  const [viewMode, setViewMode] = useState<"single" | "grid">("single");
  const [renderedSlidesDataUrls, setRenderedSlidesDataUrls] = useState<string[]>([]);
  const [renderedPostDataUrl, setRenderedPostDataUrl] = useState<string>("");

  // In-place editing state
  const [editingSlideNumber, setEditingSlideNumber] = useState<number | null>(null);
  const [editHeadline, setEditHeadline] = useState("");
  const [editBody, setEditBody] = useState("");
  const [editEmphasis, setEditEmphasis] = useState("");
  const [isRegeneratingSlide, setIsRegeneratingSlide] = useState(false);
  const [slideRegenInstruction, setSlideRegenInstruction] = useState("");

  // Static post editing
  const [isEditingPost, setIsEditingPost] = useState(false);
  const [editPostHeadline, setEditPostHeadline] = useState("");
  const [editPostBody, setEditPostBody] = useState("");
  const [editPostTakeaway, setEditPostTakeaway] = useState("");
  const [editPostCta, setEditPostCta] = useState("");

  // Feedback State
  const [feedbackRating, setFeedbackRating] = useState<ProductionFeedbackRating | null>(null);
  const [feedbackReason, setFeedbackReason] = useState<ProductionFeedbackReason>("tone");
  const [customFeedbackNotes, setCustomFeedbackNotes] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  // Toast / Copy states
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [copiedDeck, setCopiedDeck] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Handle
  const handle = dna?.handle ? (dna.handle.startsWith("@") ? dna.handle : `@${dna.handle}`) : "@seuperfil";

  // Re-render carousel slides when result or visual theme changes
  useEffect(() => {
    if (carouselResult && typeof window !== "undefined") {
      const urls = renderAllCarouselSlides(carouselResult, {
        themeId: selectedVisualTheme,
        handle
      });
      setRenderedSlidesDataUrls(urls);
    }
  }, [carouselResult, selectedVisualTheme, handle]);

  // Re-render static post when result or visual theme changes
  useEffect(() => {
    if (staticPostResult && typeof window !== "undefined") {
      const url = renderStaticPostToDataUrl(staticPostResult, {
        themeId: selectedVisualTheme,
        handle
      });
      setRenderedPostDataUrl(url);
    }
  }, [staticPostResult, selectedVisualTheme, handle]);

  // Step progress simulator during generation
  useEffect(() => {
    let timer: any;
    if (isGenerating) {
      setGenerationStepIndex(0);
      timer = setInterval(() => {
        setGenerationStepIndex((prev) => {
          if (prev < GENERATION_STEPS.length - 1) {
            return prev + 1;
          }
          return prev;
        });
      }, 1200);
    }
    return () => clearInterval(timer);
  }, [isGenerating]);

  // 1. Prepare Brief
  const handlePrepareBrief = async (): Promise<StrategicContentProductionBrief | null> => {
    setIsPreparingBrief(true);
    setErrorMsg(null);
    try {
      console.log(`[Frontend Pipeline] [brief_request_sent] format=${format} objective=${selectedObjective}`);
      const data = await apiFetch<{ success: boolean; brief?: StrategicContentProductionBrief; message?: string }>("/api/content-production/brief", {
        method: "POST",
        body: JSON.stringify({
          format,
          dna,
          digitalTwin,
          objective: selectedObjective,
          theme: customTheme.trim() || undefined,
          themeMode,
          slideCount: format === "carousel" ? slideCount : undefined,
          visualTheme: selectedVisualTheme,
          customCta: customCta.trim() || undefined
        })
      });
      if (!data || !data.success || !data.brief) {
        throw new Error(data?.message || "Falha ao preparar briefing estratégico.");
      }
      setCurrentBrief(data.brief);
      console.log(`[Frontend Pipeline] [brief_created] briefId=${data.brief.id}`);
      return data.brief;
    } catch (err: any) {
      console.error("[Prepare Brief Error]", err);
      setErrorMsg(err.message || "Erro ao consultar motor estratégico.");
      return null;
    } finally {
      setIsPreparingBrief(false);
    }
  };

  // 2. Generate Deliverable (Carousel or Static Post)
  const handleExecuteGeneration = async () => {
    setIsGenerating(true);
    setErrorMsg(null);
    setFeedbackRating(null);
    setFeedbackSent(false);

    try {
      console.log(`[Frontend Pipeline] [production_started] format=${format}`);

      // If brief is not yet prepared, fetch it directly
      let activeBrief: StrategicContentProductionBrief | null = currentBrief;
      if (!activeBrief) {
        activeBrief = await handlePrepareBrief();
      }

      if (!activeBrief) {
        setIsGenerating(false);
        setErrorMsg("Não foi possível consolidar o briefing estratégico para produção.");
        return;
      }

      if (format === "carousel") {
        console.log(`[Frontend Pipeline] [generate_carousel_sent] slides=${activeBrief.slideCount || 7}`);
        const data = await apiFetch<{
          success: boolean;
          carousel?: CarouselProductionOutput;
          message?: string;
          error?: any;
          paywallRequired?: boolean;
        }>("/api/content-production/generate-carousel", {
          method: "POST",
          body: JSON.stringify({ brief: activeBrief })
        });
        if (data.paywallRequired) {
          setIsGenerating(false);
          if (onOpenPaywall) onOpenPaywall();
          return;
        }
        if (!data.success || !data.carousel) {
          throw new Error(data.message || (data.error && data.error.message) || "Erro na geração do carrossel.");
        }
        console.log(`[Frontend Pipeline] [frontend_received_result] carouselId=${data.carousel.id} slides=${data.carousel.slides?.length}`);
        
        // Immediate client-side canvas render
        console.log(`[Frontend Pipeline] [render_started] format=carousel theme=${selectedVisualTheme}`);
        const urls = renderAllCarouselSlides(data.carousel, {
          themeId: selectedVisualTheme,
          handle
        });
        setRenderedSlidesDataUrls(urls);
        console.log(`[Frontend Pipeline] [render_completed] renderedCount=${urls.length}`);
        console.log(`[Frontend Pipeline] [preview_rendered]`);
        console.log(`[Frontend Pipeline] [download_ready]`);

        setCarouselResult(data.carousel);
        setActiveSlideIndex(0);
      } else {
        console.log(`[Frontend Pipeline] [generate_post_sent] pillar=${activeBrief.primaryPillar}`);
        const data = await apiFetch<{
          success: boolean;
          post?: StaticPostProductionOutput;
          message?: string;
          error?: any;
          paywallRequired?: boolean;
        }>("/api/content-production/generate-post", {
          method: "POST",
          body: JSON.stringify({ brief: activeBrief })
        });
        if (data.paywallRequired) {
          setIsGenerating(false);
          if (onOpenPaywall) onOpenPaywall();
          return;
        }
        if (!data.success || !data.post) {
          throw new Error(data.message || (data.error && data.error.message) || "Erro na geração do post.");
        }
        console.log(`[Frontend Pipeline] [frontend_received_result] postId=${data.post.id}`);
        
        // Immediate client-side canvas render
        console.log(`[Frontend Pipeline] [render_started] format=static_post theme=${selectedVisualTheme}`);
        const url = renderStaticPostToDataUrl(data.post, {
          themeId: selectedVisualTheme,
          handle
        });
        setRenderedPostDataUrl(url);
        console.log(`[Frontend Pipeline] [render_completed]`);
        console.log(`[Frontend Pipeline] [preview_rendered]`);
        console.log(`[Frontend Pipeline] [download_ready]`);

        setStaticPostResult(data.post);
      }
    } catch (err: any) {
      console.error("[Generation Error]", err);
      if (err?.status === 403 && err?.data?.paywallRequired) {
        if (onOpenPaywall) onOpenPaywall();
        return;
      }
      setErrorMsg(err.message || "Ocorreu um erro durante a produção de conteúdo.");
    } finally {
      setIsGenerating(false);
    }
  };

  // 3. Regenerate Single Slide
  const handleRegenerateSlide = async (slideNumber: number) => {
    if (!carouselResult) return;
    setIsRegeneratingSlide(true);
    try {
      const data = await apiFetch<{
        success: boolean;
        slide: ProductionSlide;
        message?: string;
      }>("/api/content-production/regenerate-slide", {
        method: "POST",
        body: JSON.stringify({
          carousel: carouselResult,
          slideNumber,
          customInstruction: slideRegenInstruction.trim() || undefined
        })
      });
      if (!data.success || !data.slide) {
        throw new Error(data.message || "Falha ao regenerar slide.");
      }
      const updatedSlides = carouselResult.slides.map((s) =>
        s.slideNumber === slideNumber ? data.slide : s
      );
      setCarouselResult({
        ...carouselResult,
        slides: updatedSlides
      });
      setEditingSlideNumber(null);
      setSlideRegenInstruction("");
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    } finally {
      setIsRegeneratingSlide(false);
    }
  };

  // 4. Save In-Place Slide Edits
  const handleSaveSlideEdits = (slideNum: number) => {
    if (!carouselResult) return;
    const updated = carouselResult.slides.map((s) => {
      if (s.slideNumber === slideNum) {
        return {
          ...s,
          headline: editHeadline,
          body: editBody,
          emphasis: editEmphasis || s.emphasis
        };
      }
      return s;
    });
    setCarouselResult({
      ...carouselResult,
      slides: updated
    });
    setEditingSlideNumber(null);
  };

  // 5. Save In-Place Static Post Edits
  const handleSavePostEdits = () => {
    if (!staticPostResult) return;
    setStaticPostResult({
      ...staticPostResult,
      headline: editPostHeadline || staticPostResult.headline,
      bodyCopy: editPostBody || staticPostResult.bodyCopy,
      takeaway: editPostTakeaway || staticPostResult.takeaway,
      finalCta: editPostCta || staticPostResult.finalCta
    });
    setIsEditingPost(false);
  };

  // 6. Submit Feedback & Learn
  const handleSubmitFeedback = async (rating: ProductionFeedbackRating) => {
    const deliverable = format === "carousel" ? carouselResult : staticPostResult;
    if (!deliverable) return;
    setFeedbackRating(rating);
    setIsSubmittingFeedback(true);
    try {
      await apiFetch("/api/content-production/feedback", {
        method: "POST",
        body: JSON.stringify({
          content: deliverable,
          feedback: {
            contentId: deliverable.id,
            format,
            rating,
            reason: feedbackReason,
            customNotes: customFeedbackNotes.trim() || undefined
          },
          digitalTwin
        })
      });
      setFeedbackSent(true);
    } catch (err) {
      console.warn("Feedback submission error", err);
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  // 7. Download helpers
  const handleDownloadCurrentSlide = () => {
    if (format === "carousel") {
      const dataUrl = renderedSlidesDataUrls[activeSlideIndex];
      if (dataUrl) {
        const num = String(activeSlideIndex + 1).padStart(2, "0");
        downloadDataUrlAsPng(dataUrl, `${carouselResult?.title || "carrossel"}_slide_${num}`);
      }
    } else {
      if (renderedPostDataUrl) {
        downloadDataUrlAsPng(renderedPostDataUrl, `${staticPostResult?.title || "post"}_arte_final`);
      }
    }
  };

  const handleDownloadAllSlides = async () => {
    if (format === "carousel" && renderedSlidesDataUrls.length > 0) {
      await downloadAllSlidesSequentially(renderedSlidesDataUrls, carouselResult?.title || "carrossel_pro");
    }
  };

  // 8. Copy Deck Text
  const handleCopyFullDeck = () => {
    if (format === "carousel" && carouselResult) {
      const deckText = `【 ${carouselResult.title.toUpperCase()} 】\n\n` +
        carouselResult.slides
          .map((s) => `[ SLIDE ${s.slideNumber} - ${s.roleLabel} ]\n▸ Título: ${s.headline}\n▸ Conteúdo: ${s.body}\n${s.emphasis ? `▸ Destaque: ${s.emphasis}\n` : ""}`)
          .join("\n---\n\n") +
        `\n\n【 LEGENDA 】\n${carouselResult.caption}\n\n${carouselResult.hashtags.join(" ")}`;
      navigator.clipboard.writeText(deckText);
      setCopiedDeck(true);
      setTimeout(() => setCopiedDeck(false), 2500);
    }
  };

  const handleCopyCaption = () => {
    const text = format === "carousel" ? carouselResult?.caption : staticPostResult?.caption;
    const tags = format === "carousel" ? carouselResult?.hashtags : staticPostResult?.hashtags;
    if (text) {
      const full = `${text}\n\n${(tags || []).join(" ")}`;
      navigator.clipboard.writeText(full);
      setCopiedCaption(true);
      setTimeout(() => setCopiedCaption(false), 2500);
    }
  };

  // Save to Library
  const handleSaveToLibrary = () => {
    const deliverable = format === "carousel" ? carouselResult : staticPostResult;
    if (!deliverable) return;
    setIsSaving(true);
    if (onSavedToLibrary) {
      onSavedToLibrary({
        id: deliverable.id,
        type: format === "carousel" ? "carousel" : "post",
        objective: deliverable.objective,
        cagePillar: deliverable.cagePillar,
        title: deliverable.title,
        hook: (deliverable as any).coverHeadline || (deliverable as any).headline,
        content: deliverable,
        caption: deliverable.caption,
        status: "ready",
        createdAt: new Date().toISOString()
      });
    }
    setTimeout(() => {
      setIsSaving(false);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }, 400);
  };

  const currentSlide = carouselResult?.slides?.[activeSlideIndex];
  const activeTheme = VISUAL_THEMES[selectedVisualTheme];

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* 1. TOP HEADER & WORKSPACE NAVIGATION */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {onBackToModes && (
              <button
                onClick={onBackToModes}
                className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"
                title="Voltar aos formatos"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full bg-gradient-to-r from-violet-600/30 to-fuchsia-600/30 border border-violet-500/40 text-violet-300">
                  V14 Strategic Architecture
                </span>
                <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 flex items-center gap-1">
                  <Flame className="w-3 h-3 text-amber-400" /> PRO Deliverable
                </span>
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight mt-1 flex items-center gap-2">
                Content Engine PRO: Produção End-to-End
              </h1>
              <p className="text-xs md:text-sm text-slate-400">
                Você escolhe o objetivo. O InstaScore pensa, escreve, cria o design e entrega o material pronto para publicar.
              </p>
            </div>
          </div>

          {/* Format Switcher (Carousel vs Static Post) */}
          <div className="flex items-center bg-slate-950 p-1.5 rounded-2xl border border-slate-800 w-full md:w-auto">
            <button
              onClick={() => {
                setFormat("carousel");
                setCurrentBrief(null);
              }}
              className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                format === "carousel"
                  ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-600/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Layers className="w-4 h-4" />
              Carrossel PRO (Multi-Slide)
            </button>
            <button
              onClick={() => {
                setFormat("static_post");
                setCurrentBrief(null);
              }}
              className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                format === "static_post"
                  ? "bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-lg shadow-pink-600/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              Post Estático PRO (Arte Única)
            </button>
          </div>
        </div>
      </div>

      {/* ERROR ALERT BANNER */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            onClick={() => setErrorMsg(null)}
            className="text-rose-400 hover:text-white font-bold text-xs uppercase px-2 py-1 rounded-lg bg-rose-500/20"
          >
            Fechar
          </button>
        </div>
      )}

      {/* 2. STRATEGY CONFIGURATION CARD (When not generated or preparing) */}
      {!carouselResult && !staticPostResult && !isGenerating && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-8">
          {/* Header & Pillar Context */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
            <div>
              <span className="text-xs font-bold text-violet-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                <Target className="w-4 h-4" /> Configuração Estratégica do Formato
              </span>
              <h2 className="text-xl font-bold text-white">
                Defina o objetivo e o estilo visual para este {format === "carousel" ? "Carrossel" : "Post"}
              </h2>
            </div>
            {dna?.niche && (
              <div className="px-4 py-2 rounded-2xl bg-slate-800/80 border border-slate-700/80 text-xs font-semibold text-slate-300">
                Nicho: <span className="text-white font-bold">{dna.niche}</span> • Handle: <span className="text-violet-300">{handle}</span>
              </div>
            )}
          </div>

          {/* Objective Selector */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-violet-400" />
              1. Objetivo de Negócio & Funil
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {OBJECTIVES.map((obj) => (
                <button
                  key={obj.id}
                  onClick={() => setSelectedObjective(obj.id)}
                  className={`p-4 rounded-2xl text-left border transition-all flex flex-col justify-between ${
                    selectedObjective === obj.id
                      ? "bg-violet-600/20 border-violet-500 shadow-md shadow-violet-600/10"
                      : "bg-slate-950/40 border-slate-800 hover:border-slate-700 text-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{obj.icon}</span>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                      {obj.pillar}
                    </span>
                  </div>
                  <div className="mt-3">
                    <div className="text-sm font-bold text-white">{obj.label}</div>
                    <div className="text-xs text-slate-400 mt-1 leading-relaxed">{obj.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Format-Specific Structure Settings */}
          {format === "carousel" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-400" />
                  2. Densidade & Estrutura Narrativa
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {[5, 7, 8, 10, 12].map((count) => (
                    <button
                      key={count}
                      onClick={() => setSlideCount(count as any)}
                      className={`py-3 px-2 rounded-xl text-center border font-bold text-sm transition-all ${
                        slideCount === count
                          ? "bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/20"
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      {count} <span className="text-[10px] block font-normal opacity-80">slides</span>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-slate-400">
                  {slideCount === 5 && "⚡ Estrutura Express: Alto impacto rápido, ideal para topo de funil."}
                  {slideCount === 7 && "🔥 Estrutura Standard: Equilíbrio perfeito entre gancho, problema, método e CTA."}
                  {slideCount === 8 && "💎 Deep Value: Pacing ideal para quebra de objeções e estudo de caso."}
                  {slideCount === 10 && "📚 Masterclass: Framework completo com passo a passo denso."}
                  {slideCount === 12 && "🏆 Blueprint Definitivo: Máxima retenção para conteúdos épicos e guias."}
                </p>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-pink-400" />
                  3. Tema / Ângulo do Conteúdo
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setThemeMode("strategic_recommendation")}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold border ${
                      themeMode === "strategic_recommendation"
                        ? "bg-slate-800 border-violet-500 text-white"
                        : "bg-slate-950 border-slate-800 text-slate-400"
                    }`}
                  >
                    Recomendação C.A.G.E.
                  </button>
                  <button
                    onClick={() => setThemeMode("custom_theme")}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold border ${
                      themeMode === "custom_theme"
                        ? "bg-slate-800 border-violet-500 text-white"
                        : "bg-slate-950 border-slate-800 text-slate-400"
                    }`}
                  >
                    Tema Customizado
                  </button>
                </div>
                {themeMode === "custom_theme" ? (
                  <input
                    type="text"
                    value={customTheme}
                    onChange={(e) => setCustomTheme(e.target.value)}
                    placeholder="Ex: O maior erro que você comete ao precificar serviços..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
                  />
                ) : (
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs text-slate-300 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                    O motor selecionará automaticamente o tema prioritário para sanar os gargalos do seu perfil.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-pink-400" />
                2. Tema Central do Post Estático
              </label>
              <input
                type="text"
                value={customTheme}
                onChange={(e) => setCustomTheme(e.target.value)}
                placeholder="Deixe em branco para usar recomendação inteligente ou digite um tema específico..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-pink-500"
              />
              <p className="text-xs text-slate-400">
                Posts estáticos concentram máxima densidade e impacto em uma única arte de alto contraste para o feed.
              </p>
            </div>
          )}

          {/* Visual Theme System (Design Engine) */}
          <div className="space-y-3 pt-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Palette className="w-4 h-4 text-emerald-400" />
              {format === "carousel" ? "4" : "3"}. Identidade Visual & Design System da Arte
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {(Object.keys(VISUAL_THEMES) as VisualThemeId[]).map((themeKey) => {
                const theme = VISUAL_THEMES[themeKey];
                const isSelected = selectedVisualTheme === themeKey;
                return (
                  <button
                    key={themeKey}
                    onClick={() => setSelectedVisualTheme(themeKey)}
                    className={`p-3 rounded-2xl text-left border transition-all relative overflow-hidden flex flex-col justify-between h-28 ${
                      isSelected
                        ? "border-emerald-500 ring-2 ring-emerald-500/30 shadow-lg"
                        : "border-slate-800 hover:border-slate-700 bg-slate-950"
                    }`}
                    style={{
                      background: `linear-gradient(135deg, ${theme.bgGradient[0]} 0%, ${theme.bgGradient[1]} 100%)`
                    }}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.accentColor }} />
                        {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                      </div>
                      <div className="text-xs font-bold text-white mt-2 leading-tight">{theme.name}</div>
                    </div>
                    <div className="text-[10px] text-slate-400 line-clamp-1">{theme.badge}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Trigger Button */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-800">
            <div className="text-xs text-slate-400">
              ⚡ Geração completa com <span className="text-white font-semibold">Quality Gate 2.0</span> e renderização instantânea em Canvas 1080x1350.
            </div>

            <button
              onClick={handleExecuteGeneration}
              disabled={isGenerating || isPreparingBrief}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-pink-600 text-white font-black text-sm tracking-wide shadow-xl shadow-violet-600/30 hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              {format === "carousel"
                ? `Produzir Carrossel Completo (${slideCount} Slides Prontos)`
                : "Produzir Post Estático Completo (Arte Pronta)"}
            </button>
          </div>
        </div>
      )}

      {/* 3. UX PROGRESS FLOW (During Generation) */}
      {isGenerating && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 md:p-12 text-center space-y-8 shadow-2xl backdrop-blur-xl animate-fadeIn">
          <div className="relative w-20 h-20 mx-auto">
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-violet-600 to-pink-600 animate-spin opacity-80 blur-md" />
            <div className="relative w-full h-full rounded-full bg-slate-950 flex items-center justify-center border border-slate-800">
              <Sparkles className="w-8 h-8 text-violet-400 animate-pulse" />
            </div>
          </div>

          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-xl font-black text-white tracking-tight">
              Produzindo {format === "carousel" ? "Carrossel Estratégico" : "Post Estático"}
            </h3>
            <p className="text-xs text-slate-400">
              Executando pipeline completo de estratégia, copy slide a slide, composição visual e Quality Gate.
            </p>
          </div>

          {/* 7-Step Realistic Pipeline */}
          <div className="max-w-lg mx-auto space-y-2 text-left">
            {GENERATION_STEPS.map((stepItem, idx) => {
              const isPast = idx < generationStepIndex;
              const isCurrent = idx === generationStepIndex;
              return (
                <div
                  key={stepItem.step}
                  className={`flex items-center justify-between px-4 py-2.5 rounded-xl border transition-all ${
                    isCurrent
                      ? "bg-violet-600/20 border-violet-500/50 text-white font-bold"
                      : isPast
                        ? "bg-slate-950/60 border-slate-800 text-emerald-400"
                        : "bg-slate-950/20 border-slate-900 text-slate-600"
                  }`}
                >
                  <div className="flex items-center gap-3 text-xs">
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border border-current">
                      {isPast ? <Check className="w-3 h-3" /> : stepItem.step}
                    </span>
                    <span>{stepItem.label}</span>
                  </div>
                  {isCurrent && (
                    <span className="text-[10px] uppercase font-bold text-violet-400 animate-pulse">
                      Em progresso...
                    </span>
                  )}
                  {isPast && <span className="text-[10px] text-emerald-400 font-semibold">Concluído</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. WORKSPACE: DELIVERABLE READY TO PUBLISH */}
      {(carouselResult || staticPostResult) && !isGenerating && (
        <div className="space-y-8">
          {/* Top Deliverable Control Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 shadow-xl">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Pronto para Publicação
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-800 border border-slate-700 text-slate-300">
                  {format === "carousel" ? `${carouselResult?.slides.length} Slides` : "Arte 1080x1350"}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-violet-950 border border-violet-800 text-violet-300">
                  Tema: {activeTheme?.name}
                </span>
              </div>
              <h2 className="text-xl font-black text-white mt-2">
                {format === "carousel" ? carouselResult?.title : staticPostResult?.title}
              </h2>
            </div>

            {/* Main Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
              <button
                onClick={handleDownloadCurrentSlide}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 flex items-center justify-center gap-1.5 transition-colors"
                title="Baixar imagem individual em PNG de alta resolução"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                {format === "carousel" ? `Baixar Slide ${activeSlideIndex + 1}` : "Baixar Arte PNG"}
              </button>

              {format === "carousel" && (
                <button
                  onClick={handleDownloadAllSlides}
                  className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-95 text-white text-xs font-bold shadow-md shadow-violet-600/20 flex items-center justify-center gap-1.5"
                  title="Baixar todos os slides ordenados para publicar no Instagram"
                >
                  <Layers className="w-4 h-4" />
                  Baixar Todos ({carouselResult?.slides.length})
                </button>
              )}

              <button
                onClick={handleSaveToLibrary}
                disabled={isSaving}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-colors flex items-center justify-center gap-1.5 ${
                  savedSuccess
                    ? "bg-emerald-600/20 border-emerald-500 text-emerald-300"
                    : "bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200"
                }`}
              >
                <Bookmark className="w-4 h-4 text-amber-400" />
                {savedSuccess ? "Salvo na Biblioteca!" : "Salvar na Biblioteca"}
              </button>

              <button
                onClick={() => {
                  setCarouselResult(null);
                  setStaticPostResult(null);
                }}
                className="px-3 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-white text-xs font-semibold transition-colors"
                title="Criar novo conteúdo"
              >
                Novo
              </button>
            </div>
          </div>

          {/* Theme Switcher Strip (Real-time live re-render) */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
              <Palette className="w-4 h-4 text-emerald-400" />
              <span>Alternar Tema Visual Instantâneo:</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {(Object.keys(VISUAL_THEMES) as VisualThemeId[]).map((tKey) => {
                const t = VISUAL_THEMES[tKey];
                const isActive = selectedVisualTheme === tKey;
                return (
                  <button
                    key={tKey}
                    onClick={() => setSelectedVisualTheme(tKey)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all ${
                      isActive
                        ? "bg-slate-800 border-emerald-500 text-white ring-1 ring-emerald-500/30"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.accentColor }} />
                    {t.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* WORKSPACE MAIN GRID: CANVAS PREVIEW & INSPECTION */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* LEFT COLUMN: HIGH-RES CANVAS PREVIEW (7 Cols) */}
            <div className="lg:col-span-7 space-y-4">
              {format === "carousel" && carouselResult ? (
                <div className="bg-slate-950 border border-slate-800 rounded-3xl p-4 md:p-6 shadow-2xl flex flex-col items-center">
                  {/* View Mode Toggle (Single vs Grid) */}
                  <div className="w-full flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setViewMode("single")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          viewMode === "single"
                            ? "bg-slate-800 text-white"
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        Visualização Individual
                      </button>
                      <button
                        onClick={() => setViewMode("grid")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          viewMode === "grid"
                            ? "bg-slate-800 text-white"
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        Visão Geral do Deck (Grade)
                      </button>
                    </div>

                    <div className="text-xs font-bold text-slate-400">
                      Slide {activeSlideIndex + 1} de {carouselResult.slides.length}
                    </div>
                  </div>

                  {/* Single Slide Mode */}
                  {viewMode === "single" ? (
                    <div className="w-full flex flex-col items-center space-y-4">
                      {/* 4:5 Instagram Portrait Ratio Canvas Render */}
                      <div className="relative max-w-sm w-full rounded-2xl overflow-hidden shadow-2xl border border-slate-800 bg-slate-900 group">
                        {renderedSlidesDataUrls[activeSlideIndex] ? (
                          <img
                            src={renderedSlidesDataUrls[activeSlideIndex]}
                            alt={`Slide ${activeSlideIndex + 1}`}
                            className="w-full h-auto block rounded-2xl"
                          />
                        ) : (
                          <div className="aspect-[4/5] flex items-center justify-center text-xs text-slate-500">
                            Renderizando slide em alta resolução...
                          </div>
                        )}
                      </div>

                      {/* Carousel Slide Switcher Navigation */}
                      <div className="flex items-center justify-between w-full max-w-sm pt-2">
                        <button
                          onClick={() => setActiveSlideIndex((prev) => Math.max(0, prev - 1))}
                          disabled={activeSlideIndex === 0}
                          className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white transition-colors border border-slate-700"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-1.5 overflow-x-auto px-2">
                          {carouselResult.slides.map((s, idx) => (
                            <button
                              key={s.slideNumber}
                              onClick={() => setActiveSlideIndex(idx)}
                              className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                                activeSlideIndex === idx
                                  ? "bg-violet-600 text-white scale-110 shadow-md shadow-violet-600/30"
                                  : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                              }`}
                            >
                              {idx + 1}
                            </button>
                          ))}
                        </div>

                        <button
                          onClick={() =>
                            setActiveSlideIndex((prev) =>
                              Math.min(carouselResult.slides.length - 1, prev + 1)
                            )
                          }
                          disabled={activeSlideIndex === carouselResult.slides.length - 1}
                          className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white transition-colors border border-slate-700"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Deck Grid Mode */
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full max-h-[600px] overflow-y-auto p-2">
                      {renderedSlidesDataUrls.map((url, idx) => (
                        <div
                          key={idx}
                          onClick={() => {
                            setActiveSlideIndex(idx);
                            setViewMode("single");
                          }}
                          className={`cursor-pointer rounded-xl overflow-hidden border transition-all ${
                            activeSlideIndex === idx
                              ? "border-violet-500 ring-2 ring-violet-500/40"
                              : "border-slate-800 hover:border-slate-600"
                          }`}
                        >
                          <img src={url} alt={`Slide ${idx + 1}`} className="w-full h-auto block" />
                          <div className="bg-slate-900 p-1 text-center text-[10px] font-bold text-slate-300">
                            Slide {idx + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* Static Post Canvas Preview */
                <div className="bg-slate-950 border border-slate-800 rounded-3xl p-4 md:p-6 shadow-2xl flex flex-col items-center space-y-4">
                  <div className="w-full flex items-center justify-between mb-2 border-b border-slate-800 pb-3">
                    <span className="text-xs font-bold text-slate-400">
                      Arte Final em Alta Resolução (1080x1350 - Proporção 4:5 Instagram Feed)
                    </span>
                    <button
                      onClick={handleDownloadCurrentSlide}
                      className="text-xs font-bold text-emerald-400 flex items-center gap-1 hover:underline"
                    >
                      <Download className="w-3.5 h-3.5" /> Baixar PNG
                    </button>
                  </div>

                  <div className="relative max-w-sm w-full rounded-2xl overflow-hidden shadow-2xl border border-slate-800 bg-slate-900">
                    {renderedPostDataUrl ? (
                      <img
                        src={renderedPostDataUrl}
                        alt="Arte do Post"
                        className="w-full h-auto block rounded-2xl"
                      />
                    ) : (
                      <div className="aspect-[4/5] flex items-center justify-center text-xs text-slate-500">
                        Renderizando arte em alta resolução...
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Quality Gate 2.0 Audit Badge & Score */}
              {((carouselResult && carouselResult.qualityReport) ||
                (staticPostResult && staticPostResult.qualityReport)) && (
                <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-lg">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-emerald-400" />
                      <span className="text-sm font-bold text-white">Quality Gate 2.0 Audit</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">Score de Retenção:</span>
                      <span className="text-base font-black text-emerald-400">
                        {(carouselResult || staticPostResult)?.qualityReport.score}/100
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
                    <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                      <div className="text-[10px] text-slate-400">Alinhamento</div>
                      <div className="font-bold text-white">
                        {(carouselResult || staticPostResult)?.qualityReport.dimensions.strategyAlignmentScore}/20
                      </div>
                    </div>
                    <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                      <div className="text-[10px] text-slate-400">Originalidade</div>
                      <div className="font-bold text-white">
                        {(carouselResult || staticPostResult)?.qualityReport.dimensions.originalityScore}/20
                      </div>
                    </div>
                    <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                      <div className="text-[10px] text-slate-400">Brand Fit</div>
                      <div className="font-bold text-white">
                        {(carouselResult || staticPostResult)?.qualityReport.dimensions.brandFitScore}/20
                      </div>
                    </div>
                    <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                      <div className="text-[10px] text-slate-400">Execução</div>
                      <div className="font-bold text-white">
                        {(carouselResult || staticPostResult)?.qualityReport.dimensions.executionScore}/20
                      </div>
                    </div>
                    <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                      <div className="text-[10px] text-slate-400">Preferências</div>
                      <div className="font-bold text-white">
                        {(carouselResult || staticPostResult)?.qualityReport.dimensions.contextScore}/20
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 mt-3 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    {(carouselResult || staticPostResult)?.qualityReport.improvementApplied}
                  </p>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: COPY EDITING, CAPTION & FEEDBACK (5 Cols) */}
            <div className="lg:col-span-5 space-y-6">
              {/* SLIDE COPY & VISUAL DIRECTION INSPECTOR (FOR CAROUSEL) */}
              {format === "carousel" && currentSlide && (
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-violet-600/30 border border-violet-500/40 text-violet-300">
                        {currentSlide.roleLabel}
                      </span>
                      <span className="text-xs font-semibold text-slate-400">
                        Slide {currentSlide.slideNumber}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        if (editingSlideNumber === currentSlide.slideNumber) {
                          setEditingSlideNumber(null);
                        } else {
                          setEditingSlideNumber(currentSlide.slideNumber);
                          setEditHeadline(currentSlide.headline);
                          setEditBody(currentSlide.body);
                          setEditEmphasis(currentSlide.emphasis || "");
                        }
                      }}
                      className="text-xs font-bold text-violet-400 hover:text-violet-300 flex items-center gap-1"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      {editingSlideNumber === currentSlide.slideNumber ? "Cancelar Edição" : "Editar Copy"}
                    </button>
                  </div>

                  {/* Editing or View Mode */}
                  {editingSlideNumber === currentSlide.slideNumber ? (
                    <div className="space-y-3 animate-fadeIn">
                      <div>
                        <label className="text-[11px] font-bold text-slate-400 uppercase">Título / Headline do Slide</label>
                        <input
                          type="text"
                          value={editHeadline}
                          onChange={(e) => setEditHeadline(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500 mt-1"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-400 uppercase">Corpo do Slide</label>
                        <textarea
                          rows={3}
                          value={editBody}
                          onChange={(e) => setEditBody(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500 mt-1"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-400 uppercase">Ponto-Chave / Destaque</label>
                        <input
                          type="text"
                          value={editEmphasis}
                          onChange={(e) => setEditEmphasis(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500 mt-1"
                        />
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={() => handleSaveSlideEdits(currentSlide.slideNumber)}
                          className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20"
                        >
                          Salvar & Re-renderizar Imagem
                        </button>
                      </div>

                      {/* Regenerate this specific slide */}
                      <div className="pt-3 border-t border-slate-800 space-y-2">
                        <label className="text-[11px] font-bold text-slate-400 uppercase">
                          Ou Regenerar Apenas Este Slide:
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={slideRegenInstruction}
                            onChange={(e) => setSlideRegenInstruction(e.target.value)}
                            placeholder="Instrução opcional (ex: mais direto, focar em dor)..."
                            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                          />
                          <button
                            onClick={() => handleRegenerateSlide(currentSlide.slideNumber)}
                            disabled={isRegeneratingSlide}
                            className="px-3 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold flex items-center gap-1"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${isRegeneratingSlide ? "animate-spin" : ""}`} />
                            Regenerar
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <div className="text-[11px] font-bold uppercase text-slate-500">Headline do Slide</div>
                        <div className="text-sm font-bold text-white mt-0.5">{currentSlide.headline}</div>
                      </div>

                      <div>
                        <div className="text-[11px] font-bold uppercase text-slate-500">Conteúdo do Slide</div>
                        <div className="text-xs text-slate-300 mt-0.5 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                          {currentSlide.body}
                        </div>
                      </div>

                      {currentSlide.emphasis && (
                        <div>
                          <div className="text-[11px] font-bold uppercase text-slate-500">Ponto de Ênfase</div>
                          <div className="text-xs text-amber-300 font-semibold mt-0.5">
                            ★ {currentSlide.emphasis}
                          </div>
                        </div>
                      )}

                      <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/80 space-y-1">
                        <div className="text-[11px] font-bold text-slate-400">Direção Visual:</div>
                        <div className="text-xs text-slate-400 italic">
                          {currentSlide.visualDirection || currentSlide.visualConcept}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* STATIC POST COPY INSPECTOR (FOR POST) */}
              {format === "static_post" && staticPostResult && (
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-pink-600/30 border border-pink-500/40 text-pink-300">
                      Post Estático de Alto Impacto
                    </span>

                    <button
                      onClick={() => {
                        if (isEditingPost) {
                          setIsEditingPost(false);
                        } else {
                          setIsEditingPost(true);
                          setEditPostHeadline(staticPostResult.headline);
                          setEditPostBody(staticPostResult.bodyCopy);
                          setEditPostTakeaway(staticPostResult.takeaway);
                          setEditPostCta(staticPostResult.finalCta);
                        }
                      }}
                      className="text-xs font-bold text-pink-400 hover:text-pink-300 flex items-center gap-1"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      {isEditingPost ? "Cancelar" : "Editar Arte"}
                    </button>
                  </div>

                  {isEditingPost ? (
                    <div className="space-y-3 animate-fadeIn">
                      <div>
                        <label className="text-[11px] font-bold text-slate-400 uppercase">Headline da Arte</label>
                        <input
                          type="text"
                          value={editPostHeadline}
                          onChange={(e) => setEditPostHeadline(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-pink-500 mt-1"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-400 uppercase">Texto Central da Arte</label>
                        <textarea
                          rows={3}
                          value={editPostBody}
                          onChange={(e) => setEditPostBody(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-pink-500 mt-1"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-400 uppercase">Conclusão / Takeaway</label>
                        <input
                          type="text"
                          value={editPostTakeaway}
                          onChange={(e) => setEditPostTakeaway(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-pink-500 mt-1"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-400 uppercase">CTA no Rodapé</label>
                        <input
                          type="text"
                          value={editPostCta}
                          onChange={(e) => setEditPostCta(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-pink-500 mt-1"
                        />
                      </div>

                      <button
                        onClick={handleSavePostEdits}
                        className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20"
                      >
                        Salvar & Re-renderizar Arte
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <div className="text-[11px] font-bold uppercase text-slate-500">Headline Principal</div>
                        <div className="text-sm font-bold text-white mt-0.5">{staticPostResult.headline}</div>
                      </div>

                      <div>
                        <div className="text-[11px] font-bold uppercase text-slate-500">Texto Central</div>
                        <div className="text-xs text-slate-300 mt-0.5 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                          {staticPostResult.bodyCopy}
                        </div>
                      </div>

                      {staticPostResult.takeaway && (
                        <div>
                          <div className="text-[11px] font-bold uppercase text-slate-500">Takeaway de Conclusão</div>
                          <div className="text-xs text-amber-300 font-semibold mt-0.5">
                            ⚡ {staticPostResult.takeaway}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* FULL CAPTION & HASHTAGS (READY TO COPY) */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-violet-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      Legenda Completa para o Feed
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {format === "carousel" && (
                      <button
                        onClick={handleCopyFullDeck}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold border border-slate-700 flex items-center gap-1"
                        title="Copiar texto de todos os slides e legenda"
                      >
                        <Copy className="w-3 h-3" />
                        {copiedDeck ? "Copiado!" : "Copiar Deck"}
                      </button>
                    )}

                    <button
                      onClick={handleCopyCaption}
                      className="px-3 py-1 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-[11px] font-bold flex items-center gap-1 shadow-md shadow-violet-600/20"
                    >
                      {copiedCaption ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
                      {copiedCaption ? "Legenda Copiada!" : "Copiar Legenda"}
                    </button>
                  </div>
                </div>

                <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800/80 max-h-56 overflow-y-auto">
                  <p className="text-xs text-slate-300 whitespace-pre-line leading-relaxed font-sans">
                    {format === "carousel" ? carouselResult?.caption : staticPostResult?.caption}
                  </p>
                  <div className="mt-4 pt-3 border-t border-slate-800 text-xs text-violet-400 font-medium">
                    {((format === "carousel" ? carouselResult?.hashtags : staticPostResult?.hashtags) || []).join(" ")}
                  </div>
                </div>
              </div>

              {/* FEEDBACK & DIGITAL TWIN LEARNING LOOP */}
              <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 space-y-3">
                <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Avaliação & Aprendizado Contínuo do Digital Twin
                </div>
                <p className="text-[11px] text-slate-400">
                  Sua avaliação treina o cérebro para calibrar temas futuros e afinar o tom de voz do seu perfil.
                </p>

                {feedbackSent ? (
                  <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Feedback registrado! O motor aprendeu com esta entrega.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => handleSubmitFeedback("excellent")}
                      disabled={isSubmittingFeedback}
                      className="py-2.5 px-3 rounded-xl bg-slate-950 hover:bg-emerald-950/40 border border-slate-800 hover:border-emerald-500/50 text-xs font-bold text-emerald-400 flex items-center justify-center gap-1.5 transition-all"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" /> Excelente
                    </button>
                    <button
                      onClick={() => handleSubmitFeedback("good")}
                      disabled={isSubmittingFeedback}
                      className="py-2.5 px-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-300 flex items-center justify-center gap-1.5 transition-all"
                    >
                      Bom
                    </button>
                    <button
                      onClick={() => handleSubmitFeedback("does_not_fit")}
                      disabled={isSubmittingFeedback}
                      className="py-2.5 px-3 rounded-xl bg-slate-950 hover:bg-amber-950/40 border border-slate-800 hover:border-amber-500/50 text-xs font-bold text-amber-400 flex items-center justify-center gap-1.5 transition-all"
                    >
                      <ThumbsDown className="w-3.5 h-3.5" /> Não se encaixa
                    </button>
                    <button
                      onClick={() => handleSubmitFeedback("makes_no_sense")}
                      disabled={isSubmittingFeedback}
                      className="py-2.5 px-3 rounded-xl bg-slate-950 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-500/50 text-xs font-bold text-rose-400 flex items-center justify-center gap-1.5 transition-all"
                    >
                      Não faz sentido
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
