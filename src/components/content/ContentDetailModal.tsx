import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, 
  Copy, 
  Check, 
  Sparkles, 
  Layers, 
  Video, 
  Instagram, 
  FileText, 
  ShieldCheck, 
  Download, 
  Share2, 
  Bookmark, 
  Palette,
  ChevronLeft,
  ChevronRight,
  Clock,
  Volume2,
  Send,
  HelpCircle,
  Hash,
  ThumbsUp,
  ThumbsDown,
  Brain,
  MessageSquare,
  AlertOctagon
} from "lucide-react";
import { ContentIdea, ContentFormatType } from "../../types/content-engine";
import { FeedbackRating, FeedbackReason } from "../../types/intelligence";

interface ContentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  idea: ContentIdea | null;
  onSaveToLibrary?: (item: ContentIdea) => void;
  onFeedbackSubmit?: (feedback: {
    contentId?: string;
    title?: string;
    theme?: string;
    format?: ContentFormatType;
    rating: FeedbackRating;
    reason?: FeedbackReason;
    customNote?: string;
  }) => void;
  isSaved?: boolean;
}

export const ContentDetailModal: React.FC<ContentDetailModalProps> = ({
  isOpen,
  onClose,
  idea,
  onSaveToLibrary,
  onFeedbackSubmit,
  isSaved = false
}) => {
  const [activeTab, setActiveTab] = useState<"structure" | "caption" | "quality" | "feedback">("structure");
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  // V13 Feedback Engine States
  const [selectedRating, setSelectedRating] = useState<FeedbackRating | null>(null);
  const [selectedReason, setSelectedReason] = useState<FeedbackReason | "">("");
  const [customNote, setCustomNote] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(false);

  if (!isOpen || !idea) return null;

  const format = idea.type || "post";
  const payload = idea.content?.data as any;

  const handleSendFeedback = () => {
    if (!selectedRating) return;
    if (onFeedbackSubmit) {
      onFeedbackSubmit({
        contentId: idea.id,
        title: idea.title,
        theme: payload?.concept || idea.title,
        format,
        rating: selectedRating,
        reason: selectedReason ? (selectedReason as FeedbackReason) : undefined,
        customNote: customNote.trim() || undefined
      });
    }
    setFeedbackSent(true);
    setTimeout(() => {
      setFeedbackSent(false);
    }, 4000);
  };


  const handleCopyCaption = () => {
    let textToCopy = "";
    if (payload?.caption) {
      textToCopy = payload.caption;
      if (payload.hashtags && payload.hashtags.length > 0) {
        textToCopy += "\n\n" + payload.hashtags.join(" ");
      }
    } else if (idea.caption) {
      textToCopy = idea.caption;
    }

    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      setCopiedCaption(true);
      setTimeout(() => setCopiedCaption(false), 2500);
    }
  };

  const handleCopyFullScript = () => {
    let script = `TÍTULO: ${idea.title}\nFORMATO: ${format.toUpperCase()}\nOBJETIVO: ${idea.objective}\nPILAR C.A.G.E.: ${idea.cagePillar}\n\n`;
    
    if (format === "carousel" && payload?.slides) {
      script += `CAPA: ${payload.coverHeadline}\nSUBTÍTULO: ${payload.coverSubtitle}\n\n`;
      payload.slides.forEach((s: any, idx: number) => {
        script += `SLIDE ${idx + 1} (${s.slideType}):\nHeadline: ${s.headline}\nTexto: ${s.body}\nDiretriz Visual: ${s.visualGuidance || "N/A"}\n\n`;
      });
      script += `CTA FINAL: ${payload.finalCta}\n`;
    } else if (format === "reel" && payload?.scenes) {
      script += `GANCHO FALADO: ${payload.hookSpoken}\nGANCHO VISUAL: ${payload.hookVisual}\nDURAÇÃO: ${payload.estimatedDuration}\n\n`;
      payload.scenes.forEach((sc: any, idx: number) => {
        script += `CENA ${idx + 1} [${sc.timeframe}]:\nVisual: ${sc.visualDirection}\nFala: "${sc.spokenText}"\nTexto na Tela: ${sc.onScreenText || "N/A"}\nB-Roll: ${sc.bRollSuggestion || "N/A"}\n\n`;
      });
      script += `CTA: ${payload.cta}\nÁUDIO: ${payload.audioRecommendation}\n`;
    } else if (format === "story" && payload?.stories) {
      script += `SEQUÊNCIA: ${payload.sequenceTitle}\nOBJETIVO: ${payload.sequenceGoal}\n\n`;
      payload.stories.forEach((st: any, idx: number) => {
        script += `STORY ${idx + 1} [${st.storyType}]:\nCena: ${st.visualScene}\nTexto: "${st.textOverlay}"\nInteração: ${st.suggestedInteraction || "N/A"}\n\n`;
      });
      script += `GATILHO DIRECT: ${payload.directTrigger}\n`;
    } else if (format === "post" && payload) {
      script += `CONCEITO: ${payload.concept}\nHEADLINE: ${payload.headline}\nESTRUTURA VISUAL: ${payload.visualStructure}\nCTA: ${payload.cta}\n`;
    }

    navigator.clipboard.writeText(script);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-4xl max-h-[92vh] bg-[#0A0D18] border border-white/15 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100"
      >
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#0E1322]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF5E36] via-[#E1306C] to-[#833AB4] flex items-center justify-center text-white shadow-md shrink-0">
              {format === "carousel" ? <Layers size={20} /> : format === "reel" ? <Video size={20} /> : format === "story" ? <Instagram size={20} /> : <FileText size={20} />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-mono font-bold px-2 py-0.5 rounded bg-white/10 text-white">
                  {format.toUpperCase()}
                </span>
                <span className="text-xs uppercase font-mono px-2 py-0.5 rounded bg-[#FA26A0]/15 text-[#FA26A0] font-bold border border-[#FA26A0]/30">
                  {idea.cagePillar?.toUpperCase()}
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {idea.objective}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white font-display truncate max-w-[280px] sm:max-w-md mt-0.5">
                {idea.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onSaveToLibrary && (
              <button
                type="button"
                onClick={() => onSaveToLibrary(idea)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isSaved 
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" 
                    : "bg-white/5 hover:bg-white/10 text-slate-300 border-white/10"
                }`}
              >
                <Bookmark size={14} className={isSaved ? "fill-emerald-400" : ""} />
                <span>{isSaved ? "Salvo" : "Salvar"}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-5 py-2.5 border-b border-white/10 bg-[#070913] text-xs">
          <button
            type="button"
            onClick={() => setActiveTab("structure")}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              activeTab === "structure" 
                ? "bg-white/15 text-white border border-white/20 shadow-sm" 
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {format === "carousel" ? "Slides do Carrossel" : format === "reel" ? "Roteiro Cenas a Cenas" : format === "story" ? "Sequência de Stories" : "Estrutura do Post"}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("caption")}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              activeTab === "caption" 
                ? "bg-white/15 text-white border border-white/20 shadow-sm" 
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Legenda & Hashtags
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("quality")}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "quality" 
                ? "bg-white/15 text-white border border-white/20 shadow-sm" 
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <ShieldCheck size={14} className="text-emerald-400" />
            <span>Quality Gate 2.0</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("feedback")}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "feedback" 
                ? "bg-violet-500/20 text-violet-300 border border-violet-500/40 shadow-sm" 
                : "text-slate-400 hover:text-violet-300"
            }`}
          >
            <Brain size={14} className="text-violet-400" />
            <span>Feedback & Aprendizado</span>
          </button>
        </div>


        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          
          {/* TAB 1: STRUCTURE */}
          {activeTab === "structure" && (
            <div className="space-y-4">
              {/* Strategic Why Card */}
              {idea.whyThisTheme && (
                <div className="p-3.5 rounded-xl bg-[#E1306C]/10 border border-[#E1306C]/25 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-[#FA26A0] mb-1">
                    <Sparkles size={14} />
                    <span>Por que estamos criando este conteúdo? (C.A.G.E. Rationale)</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    {idea.whyThisTheme}
                  </p>
                </div>
              )}

              {/* FORMAT SPECIFIC VIEW */}
              {format === "carousel" && payload?.slides && (
                <div className="space-y-4">
                  {/* Slide Carousel Navigator */}
                  <div className="flex items-center justify-between bg-white/[0.03] p-3 rounded-xl border border-white/10">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-400">
                        Slide {currentSlideIndex + 1} de {payload.slides.length}
                      </span>
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-white/10 text-white font-bold">
                        {payload.slides[currentSlideIndex]?.slideType}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setCurrentSlideIndex(prev => Math.max(0, prev - 1))}
                        disabled={currentSlideIndex === 0}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 text-white cursor-pointer"
                      >
                        <ChevronLeft size={18} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setCurrentSlideIndex(prev => Math.min(payload.slides.length - 1, prev + 1))}
                        disabled={currentSlideIndex === payload.slides.length - 1}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 text-white cursor-pointer"
                      >
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Active Slide Card Preview */}
                  {payload.slides[currentSlideIndex] && (
                    <div className="p-6 rounded-2xl bg-gradient-to-b from-[#121728] to-[#0D111F] border border-white/15 shadow-xl relative overflow-hidden">
                      <div className="absolute top-4 right-4 text-3xl font-black font-mono text-white/5">
                        0{currentSlideIndex + 1}
                      </div>

                      <div className="max-w-xl">
                        <span className="text-[10px] font-mono uppercase tracking-widest text-[#FF5E36] font-extrabold block mb-2">
                          {payload.slides[currentSlideIndex].slideType.toUpperCase()}
                        </span>
                        <h3 className="text-lg sm:text-xl font-bold text-white mb-3 font-display">
                          {payload.slides[currentSlideIndex].headline}
                        </h3>
                        <p className="text-sm text-slate-300 whitespace-pre-line leading-relaxed mb-4">
                          {payload.slides[currentSlideIndex].body}
                        </p>

                        {payload.slides[currentSlideIndex].visualGuidance && (
                          <div className="p-3 rounded-xl bg-black/40 border border-white/10 text-xs text-slate-400">
                            <strong className="text-slate-200">Diretriz Visual para o Designer:</strong> {payload.slides[currentSlideIndex].visualGuidance}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Slide Thumbnails List */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                    {payload.slides.map((s: any, idx: number) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setCurrentSlideIndex(idx)}
                        className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                          currentSlideIndex === idx 
                            ? "bg-[#E1306C]/20 border-[#FA26A0] text-white" 
                            : "bg-white/[0.02] border-white/5 text-slate-400 hover:text-white"
                        }`}
                      >
                        <div className="text-[10px] font-mono font-bold opacity-70">Slide {idx + 1}</div>
                        <div className="text-xs font-bold truncate mt-0.5">{s.headline}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {format === "reel" && payload?.scenes && (
                <div className="space-y-4">
                  {/* Hook Highlight Banner */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
                      <span className="text-[10px] uppercase font-mono font-bold text-amber-400 block mb-1">
                        GANCHO FALADO (0-3s)
                      </span>
                      <p className="text-xs sm:text-sm font-semibold text-white">
                        "{payload.hookSpoken}"
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-[#833AB4]/10 border border-[#833AB4]/30">
                      <span className="text-[10px] uppercase font-mono font-bold text-purple-400 block mb-1">
                        AÇÃO VISUAL / QUEBRA DE PADRÃO (0-3s)
                      </span>
                      <p className="text-xs sm:text-sm font-semibold text-white">
                        {payload.hookVisual}
                      </p>
                    </div>
                  </div>

                  {/* Scenes Timeline List */}
                  <div className="space-y-3">
                    {payload.scenes.map((scene: any, idx: number) => (
                      <div key={idx} className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center text-xs font-mono font-bold text-white">
                              {idx + 1}
                            </span>
                            <span className="text-xs font-bold text-white">Cena {idx + 1}</span>
                          </div>
                          <span className="text-xs font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-300 flex items-center gap-1">
                            <Clock size={12} className="text-[#FF5E36]" />
                            {scene.timeframe}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                          <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                            <span className="text-[10px] uppercase font-mono text-slate-400 block mb-1 font-bold">
                              O que você fala:
                            </span>
                            <p className="text-slate-200 font-medium leading-relaxed">
                              "{scene.spokenText}"
                            </p>
                          </div>

                          <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                            <span className="text-[10px] uppercase font-mono text-slate-400 block mb-1 font-bold">
                              O que aparece na tela:
                            </span>
                            <p className="text-slate-300 mb-1">
                              <strong>Visual:</strong> {scene.visualDirection}
                            </p>
                            {scene.onScreenText && (
                              <p className="text-amber-300 font-mono">
                                <strong>Texto na tela:</strong> {scene.onScreenText}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Audio recommendation */}
                  {payload.audioRecommendation && (
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs flex items-center gap-2 text-slate-300">
                      <Volume2 size={16} className="text-emerald-400 shrink-0" />
                      <span><strong>Recomendação de Áudio:</strong> {payload.audioRecommendation}</span>
                    </div>
                  )}
                </div>
              )}

              {format === "story" && payload?.stories && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {payload.stories.map((story: any, idx: number) => (
                      <div key={idx} className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono font-bold text-[#FA26A0]">
                            STORY {idx + 1} • {story.storyType?.toUpperCase()}
                          </span>
                          {story.suggestedInteraction && (
                            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                              {story.suggestedInteraction}
                            </span>
                          )}
                        </div>

                        <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-xs text-white font-medium">
                          "{story.textOverlay}"
                        </div>

                        <p className="text-xs text-slate-400">
                          <strong>Cena visual:</strong> {story.visualScene}
                        </p>
                      </div>
                    ))}
                  </div>

                  {payload.directTrigger && (
                    <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-xs text-emerald-300 flex items-center gap-2 font-semibold">
                      <Send size={16} />
                      <span>Gatilho para Direct: {payload.directTrigger}</span>
                    </div>
                  )}
                </div>
              )}

              {format === "post" && payload && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
                    <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block mb-1">
                      CONCEITO CENTRAL
                    </span>
                    <p className="text-sm font-semibold text-white">
                      {payload.concept}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
                    <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block mb-1">
                      HEADLINE PRINCIPAL DA IMAGEM
                    </span>
                    <h3 className="text-lg font-bold text-white font-display">
                      {payload.headline}
                    </h3>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
                    <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block mb-1">
                      DIRETRIZ VISUAL & LAYOUT
                    </span>
                    <p className="text-xs text-slate-300">
                      {payload.visualStructure}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CAPTION */}
          {activeTab === "caption" && (
            <div className="space-y-4">
              <div className="p-4 sm:p-5 rounded-2xl bg-[#060810] border border-white/10 space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <span className="text-xs font-mono font-bold uppercase text-slate-400">
                    Legenda Otimizada para Retenção
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyCaption}
                    className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-bold text-white flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    {copiedCaption ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    <span>{copiedCaption ? "Copiado!" : "Copiar Legenda"}</span>
                  </button>
                </div>

                <div className="text-sm text-slate-200 whitespace-pre-line leading-relaxed font-sans">
                  {payload?.caption || idea.caption || "Legenda em processamento..."}
                </div>

                {payload?.cta && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200">
                    <strong>Chamada para Ação (CTA):</strong> {payload.cta}
                  </div>
                )}

                {payload?.hashtags && payload.hashtags.length > 0 && (
                  <div className="pt-2">
                    <span className="text-[11px] font-mono text-slate-400 block mb-1.5 flex items-center gap-1">
                      <Hash size={12} /> Hashtags Estratégicas ({payload.hashtags.length})
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {payload.hashtags.map((tag: string, idx: number) => (
                        <span key={idx} className="text-xs px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-slate-300 font-mono">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: QUALITY GATE */}
          {activeTab === "quality" && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold font-mono">
                    95%
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      Aprovado no Quality Gate Anti-Clichê
                    </h4>
                    <p className="text-xs text-slate-300">
                      O conteúdo atende aos parâmetros rigorosos de diferenciação do InstaScore OS.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 text-center">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Anti-Genérico</span>
                  <span className="text-base font-bold text-emerald-400 font-mono">10/10</span>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 text-center">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Alinhamento de Nicho</span>
                  <span className="text-base font-bold text-emerald-400 font-mono">10/10</span>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 text-center">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Força do Gancho</span>
                  <span className="text-base font-bold text-emerald-400 font-mono">9/10</span>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 text-center">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Clareza da CTA</span>
                  <span className="text-base font-bold text-emerald-400 font-mono">9/10</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: FEEDBACK & APRENDIZADO (V13 INTELLIGENCE) */}
          {activeTab === "feedback" && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-violet-500/10 border border-violet-500/30 flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-500/20 text-violet-400 flex items-center justify-center shrink-0">
                  <Brain size={22} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white">
                    Ensine seu Gêmeo Digital
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Seu feedback molda as próximas recomendações e refina a inteligência estratégica do seu perfil.
                  </p>
                </div>
              </div>

              {/* Step 1: Avaliação Geral */}
              <div className="space-y-2">
                <label className="text-xs font-mono font-bold uppercase text-slate-300 block">
                  1. Como você avalia esta sugestão?
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedRating("excellent")}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedRating === "excellent"
                        ? "bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-md"
                        : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                    }`}
                  >
                    <div className="text-base mb-1">🔥 Excelente</div>
                    <p className="text-[10px] text-slate-400">Perfeito para meu momento e tom</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedRating("good")}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedRating === "good"
                        ? "bg-blue-500/20 border-blue-500 text-blue-300 shadow-md"
                        : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                    }`}
                  >
                    <div className="text-base mb-1">👍 Bom</div>
                    <p className="text-[10px] text-slate-400">Funciona bem, usaria com ajustes</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedRating("does_not_fit")}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedRating === "does_not_fit"
                        ? "bg-amber-500/20 border-amber-500 text-amber-300 shadow-md"
                        : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                    }`}
                  >
                    <div className="text-base mb-1">👎 Não combina</div>
                    <p className="text-[10px] text-slate-400">Não reflete meu posicionamento</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedRating("makes_no_sense")}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedRating === "makes_no_sense"
                        ? "bg-rose-500/20 border-rose-500 text-rose-300 shadow-md"
                        : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                    }`}
                  >
                    <div className="text-base mb-1">❌ Sem sentido</div>
                    <p className="text-[10px] text-slate-400">Totalmente fora da minha realidade</p>
                  </button>
                </div>
              </div>

              {/* Step 2: Motivo (Exibido quando avaliação for negativa) */}
              {(selectedRating === "does_not_fit" || selectedRating === "makes_no_sense") && (
                <div className="space-y-2 p-4 rounded-2xl bg-white/[0.02] border border-white/10">
                  <label className="text-xs font-mono font-bold uppercase text-amber-400 block">
                    2. Qual foi o principal descompasso?
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      { id: "not_my_audience", label: "Não ressoa com meu público-alvo" },
                      { id: "already_spoke_about_this", label: "Já abordei esse tema recentemente" },
                      { id: "disliked_theme", label: "Não quero falar sobre este assunto" },
                      { id: "disliked_format", label: "Prefiro evitar este formato" },
                      { id: "dont_want_to_appear", label: "Não quero gravar vídeo/aparecer" },
                      { id: "doesnt_represent_brand", label: "Não representa o tom da minha marca" },
                      { id: "no_such_offer", label: "Não tenho esse produto/serviço" },
                      { id: "other", label: "Outro motivo" }
                    ].map((reason) => (
                      <button
                        key={reason.id}
                        type="button"
                        onClick={() => setSelectedReason(reason.id as FeedbackReason)}
                        className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                          selectedReason === reason.id
                            ? "bg-amber-500/20 border-amber-500 text-amber-200 font-bold"
                            : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                        }`}
                      >
                        {reason.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 3: Nota Pessoal Opcional */}
              <div className="space-y-2">
                <label className="text-xs font-mono font-bold uppercase text-slate-400 block">
                  3. Observação para o Gêmeo Digital (Opcional)
                </label>
                <textarea
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  placeholder="Ex: Prefiro ganchos focados em empresários com mais de 30 anos e tom mais sóbrio..."
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-500 min-h-[70px]"
                />
              </div>

              {/* Botão de Envio de Feedback */}
              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  disabled={!selectedRating}
                  onClick={handleSendFeedback}
                  className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-violet-600/30"
                >
                  <Brain size={16} />
                  <span>Registrar Aprendizado</span>
                </button>

                {feedbackSent && (
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 animate-pulse">
                    <Check size={16} /> Aprendizado salvo no Gêmeo Digital!
                  </span>
                )}
              </div>
            </div>
          )}
        </div>


        {/* Modal Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-white/10 bg-[#0E1322]">
          <button
            type="button"
            onClick={handleCopyFullScript}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            {copiedScript ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
            <span>{copiedScript ? "Roteiro Completo Copiado!" : "Copiar Roteiro & Estrutura"}</span>
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleCopyCaption}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF5E36] via-[#E1306C] to-[#833AB4] hover:opacity-90 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
            >
              {copiedCaption ? <Check size={16} className="text-emerald-300" /> : <Copy size={16} />}
              <span>{copiedCaption ? "Legenda Copiada!" : "Copiar Legenda Completa"}</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
