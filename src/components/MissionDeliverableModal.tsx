import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, Check, Copy, Sparkles, Zap, Target, ShieldCheck, 
  ArrowRight, Compass, Layers, Film, User, Star, HelpCircle, 
  RefreshCw, Award, Lock, ExternalLink, AlertTriangle, AlertCircle
} from "lucide-react";
import { 
  MissionExecutionResult, 
  BioModifier, 
  BioOption, 
  SeoNameOption, 
  StrategicHighlightItem, 
  HumanizationDeliverable, 
  AuthorityDeliverable, 
  CustomMissionDeliverable 
} from "../types/missions";
import { SolutionFeedback } from "./SolutionFeedback";

interface MissionDeliverableModalProps {
  isOpen: boolean;
  onClose: () => void;
  missionResult: MissionExecutionResult | null;
  loading: boolean;
  loadingStage?: string;
  errorMessage?: string | null;
  onRetry?: () => void;
  onRegenerateBio?: (modifier: BioModifier) => void;
  activeBioModifier?: BioModifier;
  onOpenPaywall?: () => void;
}

export function MissionDeliverableModal({
  isOpen,
  onClose,
  missionResult,
  loading,
  loadingStage = "Analisando perfil e construindo entregável tático...",
  errorMessage,
  onRetry,
  onRegenerateBio,
  activeBioModifier = "default",
  onOpenPaywall
}: MissionDeliverableModalProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("all");

  if (!isOpen) return null;

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId((prev) => (prev === id ? null : prev));
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-4xl max-h-[90vh] bg-[#0A0E1A] border border-white/15 rounded-3xl shadow-2xl text-slate-100 flex flex-col overflow-hidden my-8"
      >
        {/* Glow ambient background aura */}
        <div className="absolute -top-32 -right-32 w-80 h-80 bg-[#FF5E36]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-[#833AB4]/15 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between relative z-10 bg-[#080C16]/80 backdrop-blur-md">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#FF5E36]/20 text-[#FF5E36] border border-[#FF5E36]/30 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1">
                <Zap size={11} /> MISSÃO EXECUTIVA IA
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-bold flex items-center gap-1">
                <ShieldCheck size={11} /> 100% Contextualizado
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white font-display">
              {missionResult?.title || "Central de Execução Tática"}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6 relative z-10">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-white/10 border-t-[#FF5E36] animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles size={20} className="text-[#FA26A0] animate-pulse" />
                </div>
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-bold text-white font-display">IA em Ação Estratégica</h3>
                <p className="text-xs text-slate-400 max-w-sm font-mono">
                  {loadingStage}
                </p>
              </div>
            </div>
          ) : errorMessage || !missionResult ? (
            <div className="py-12 px-4 flex flex-col items-center justify-center text-center space-y-5">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/5">
                <AlertTriangle size={28} />
              </div>
              <div className="space-y-2 max-w-md">
                <h3 className="text-lg font-bold text-white font-display">
                  Não foi possível concluir a missão
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {errorMessage || "O motor de inteligência artificial não retornou dados válidos para este plano tático."}
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                {onRetry && (
                  <button
                    onClick={onRetry}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF5E36] to-[#FA26A0] text-white font-bold text-sm shadow-lg shadow-[#FF5E36]/20 hover:opacity-90 transition-opacity flex items-center gap-2 cursor-pointer"
                  >
                    <RefreshCw size={15} />
                    Tentar Novamente
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-medium text-sm border border-white/10 transition-colors cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* 1. SEO & NAME OPTIMIZATION VIEW */}
              {missionResult.missionType === 'seo_name_optimization' && missionResult.data.seoNames && (
                <div className="space-y-6">
                  <div className="p-4 bg-gradient-to-r from-sky-500/10 to-indigo-500/10 border border-sky-500/20 rounded-2xl">
                    <p className="text-xs text-slate-300 leading-relaxed">
                      💡 <strong className="text-white">Por que o nome é crucial:</strong> O campo de nome no Instagram funciona como o título SEO do seu perfil. Ter as palavras-chave certas faz você aparecer automaticamente quando clientes pesquisarem no Explorar.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {missionResult.data.seoNames.map((opt, idx) => (
                      <div 
                        key={idx}
                        className="glass-panel rounded-2xl p-5 border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between space-y-4 group"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-mono font-bold text-sky-400 uppercase tracking-wider">
                              OPÇÃO 0{idx + 1}
                            </span>
                            <div className="flex items-center gap-1 text-xs font-mono font-bold text-emerald-400">
                              <Target size={12} /> {opt.overallScore} pts
                            </div>
                          </div>

                          <div>
                            <span className="text-xs text-slate-400 block mb-1">Campo Nome:</span>
                            <h4 className="text-base font-bold text-white font-display bg-slate-900/80 px-3 py-2 rounded-xl border border-white/10 select-all">
                              {opt.name}
                            </h4>
                          </div>

                          <div>
                            <span className="text-xs text-slate-400 block mb-1">Sugestão de @handle:</span>
                            <p className="text-xs font-mono text-slate-300 bg-slate-900/40 px-3 py-1.5 rounded-lg border border-white/5">
                              {opt.handleSuggestion}
                            </p>
                          </div>

                          <p className="text-xs text-slate-300 leading-relaxed">
                            {opt.rationale}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleCopy(`seo_${idx}`, opt.name)}
                          className="w-full py-2.5 px-4 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-xl border border-white/10 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                        >
                          {copiedId === `seo_${idx}` ? (
                            <>
                              <Check size={14} className="text-emerald-400" />
                              <span className="text-emerald-400">Nome Copiado!</span>
                            </>
                          ) : (
                            <>
                              <Copy size={14} />
                              <span>Copiar Nome</span>
                            </>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. STRATEGIC HIGHLIGHTS VIEW */}
              {missionResult.missionType === 'strategic_highlights' && missionResult.data.highlights && (
                <div className="space-y-6">
                  <div className="p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl">
                    <p className="text-xs text-slate-300 leading-relaxed">
                      📌 <strong className="text-white">Funil de Destaques:</strong> Visitantes que chegam no perfil olham os destaques antes de decidir seguir ou comprar. Siga esta sequência exata da esquerda para a direita.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {missionResult.data.highlights.map((hl, idx) => (
                      <div 
                        key={idx}
                        className="glass-panel rounded-2xl p-5 border border-white/10 space-y-4"
                      >
                        <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-white/10">
                          <div className="flex items-center gap-3">
                            <span className="w-8 h-8 rounded-xl bg-[#FF5E36]/20 text-[#FF5E36] font-mono font-bold flex items-center justify-center text-xs border border-[#FF5E36]/30">
                              0{hl.order || idx + 1}
                            </span>
                            <div>
                              <h4 className="text-base font-bold text-white font-display">{hl.name}</h4>
                              <p className="text-xs text-slate-400">{hl.objective}</p>
                            </div>
                          </div>

                          <span className="text-[11px] font-mono text-slate-400 bg-slate-900 px-3 py-1 rounded-full border border-white/5">
                            Capa: {hl.coverSuggestion}
                          </span>
                        </div>

                        {/* Story Frames */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                          {hl.frames.map((frame, fIdx) => (
                            <div key={fIdx} className="bg-slate-900/60 p-3.5 rounded-xl border border-white/5 space-y-2">
                              <span className="text-[10px] font-mono font-bold text-[#38BDF8] uppercase tracking-wider block">
                                Story {frame.frameNumber || fIdx + 1}: {frame.title}
                              </span>
                              <p className="text-xs text-slate-300 leading-snug">
                                {frame.content}
                              </p>
                              {frame.visualCue && (
                                <p className="text-[11px] text-slate-400 italic">
                                  🎬 {frame.visualCue}
                                </p>
                              )}
                              {frame.cta && (
                                <span className="text-[10px] font-bold text-[#FA26A0] block">
                                  ↳ CTA: {frame.cta}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>

                        <div className="flex items-center justify-between pt-2">
                          <span className="text-xs font-bold text-slate-300">
                            CTA Final do Destaque: <strong className="text-white">{hl.cta}</strong>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(`hl_${idx}`, `${hl.name}\n${hl.frames.map(f => `Story ${f.frameNumber}: ${f.title}\n${f.content}\nCTA: ${f.cta || ''}`).join('\n\n')}`)}
                            className="px-3.5 py-1.5 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-lg border border-white/10 transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            {copiedId === `hl_${idx}` ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                            <span>{copiedId === `hl_${idx}` ? "Copiado!" : "Copiar Roteiro"}</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. HUMANIZATION PLAN VIEW */}
              {missionResult.missionType === 'humanization_plan' && missionResult.data.humanization && (
                <div className="space-y-6">
                  <div className="p-4 bg-gradient-to-r from-rose-500/10 to-pink-500/10 border border-rose-500/20 rounded-2xl">
                    <p className="text-xs text-slate-300 leading-relaxed">
                      🤝 {missionResult.data.humanization.overview}
                    </p>
                  </div>

                  {/* Video Presentation Script */}
                  <div className="glass-panel rounded-2xl p-6 border border-[#E1306C]/30 bg-gradient-to-br from-[#1A0C28]/80 to-[#0F1424] space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-base font-bold text-white font-display flex items-center gap-2">
                        <Film size={18} className="text-[#FA26A0]" /> Roteiro de Vídeo Âncora (Apresentação Fixada)
                      </h4>
                      <button
                        type="button"
                        onClick={() => handleCopy('pres_script', `${missionResult.data.humanization?.presentationScript.hook}\n\n${missionResult.data.humanization?.presentationScript.transformation}\n\n${missionResult.data.humanization?.presentationScript.proofContext}\n\n${missionResult.data.humanization?.presentationScript.cta}`)}
                        className="px-3 py-1.5 bg-white/10 hover:bg-white/15 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        {copiedId === 'pres_script' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                        <span>{copiedId === 'pres_script' ? "Copiado!" : "Copiar Roteiro"}</span>
                      </button>
                    </div>

                    <div className="space-y-3 text-xs leading-relaxed bg-slate-950/60 p-4 rounded-xl border border-white/5">
                      <div>
                        <strong className="text-[#38BDF8] block mb-0.5">0-3s Gancho Inicial:</strong>
                        <p className="text-slate-200">"{missionResult.data.humanization.presentationScript.hook}"</p>
                      </div>
                      <div>
                        <strong className="text-amber-400 block mb-0.5">3-20s Transformação & Método:</strong>
                        <p className="text-slate-300">{missionResult.data.humanization.presentationScript.transformation}</p>
                      </div>
                      <div>
                        <strong className="text-emerald-400 block mb-0.5">20-30s Prova & Posicionamento:</strong>
                        <p className="text-slate-300">{missionResult.data.humanization.presentationScript.proofContext}</p>
                      </div>
                      <div>
                        <strong className="text-[#FA26A0] block mb-0.5">30-35s Chamada para Ação:</strong>
                        <p className="text-white font-medium">"{missionResult.data.humanization.presentationScript.cta}"</p>
                      </div>
                    </div>
                  </div>

                  {/* 5 Reel Ideas */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                      <Zap size={14} className="text-[#FF5E36]" /> 5 Ideias de Conteúdo Humanizado para Gravar
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {missionResult.data.humanization.reelIdeas.map((reel, idx) => (
                        <div key={idx} className="bg-slate-900/80 p-4 rounded-2xl border border-white/10 space-y-3 flex flex-col justify-between">
                          <div className="space-y-2">
                            <span className="text-[10px] font-mono font-bold text-[#FF5E36] uppercase tracking-wider">
                              REEL 0{idx + 1}
                            </span>
                            <h5 className="font-bold text-sm text-white">{reel.title}</h5>
                            <p className="text-xs text-amber-300/90 font-medium">
                              🪝 Gancho: "{reel.hook}"
                            </p>
                            <ul className="text-xs text-slate-300 space-y-1 pl-3 list-disc">
                              {reel.body.map((b, bIdx) => (
                                <li key={bIdx}>{b}</li>
                              ))}
                            </ul>
                          </div>

                          <div className="pt-2 flex items-center justify-between border-t border-white/5">
                            <span className="text-[11px] text-[#FA26A0] font-bold">CTA: {reel.cta}</span>
                            <button
                              type="button"
                              onClick={() => handleCopy(`reel_${idx}`, `Título: ${reel.title}\nGancho: ${reel.hook}\nCorpo:\n${reel.body.join('\n')}\nCTA: ${reel.cta}`)}
                              className="p-1.5 text-slate-400 hover:text-white transition-colors"
                            >
                              {copiedId === `reel_${idx}` ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 4. AUTHORITY STRATEGY VIEW */}
              {missionResult.missionType === 'authority_strategy' && missionResult.data.authority && (
                <div className="space-y-6">
                  <div className="p-4 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-2xl">
                    <p className="text-xs text-slate-300 leading-relaxed">
                      👑 <strong className="text-white">Estratégia de Autoridade:</strong> {missionResult.data.authority.strategyOverview}
                    </p>
                  </div>

                  {/* Case Study Templates */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                      <Award size={14} className="text-amber-400" /> Modelos de Estudo de Caso (Para Documentar Resultados Reais)
                    </h4>

                    {missionResult.data.authority.caseStudyTemplates.map((cs, idx) => (
                      <div key={idx} className="glass-panel p-5 rounded-2xl border border-white/10 space-y-3">
                        <div className="flex items-center justify-between">
                          <h5 className="font-bold text-base text-white">{cs.title}</h5>
                          <span className="text-xs font-mono text-slate-400">{cs.suggestedFormat}</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div className="bg-slate-900 p-3 rounded-xl border border-white/5">
                            <span className="text-rose-400 font-bold block mb-1">1. Ponto Inicial / Dor:</span>
                            <p className="text-slate-300">{cs.structure.initialProblem}</p>
                          </div>
                          <div className="bg-slate-900 p-3 rounded-xl border border-white/5">
                            <span className="text-sky-400 font-bold block mb-1">2. Método Aplicado:</span>
                            <p className="text-slate-300">{cs.structure.appliedMethod}</p>
                          </div>
                          <div className="bg-slate-900 p-3 rounded-xl border border-white/5">
                            <span className="text-emerald-400 font-bold block mb-1">3. Resultado Tangível:</span>
                            <p className="text-slate-300">{cs.structure.tangibleResult}</p>
                          </div>
                          <div className="bg-slate-900 p-3 rounded-xl border border-white/5">
                            <span className="text-amber-400 font-bold block mb-1">4. Lição Estratégica:</span>
                            <p className="text-slate-300">{cs.structure.finalTakeaway}</p>
                          </div>
                        </div>

                        <div className="flex justify-end pt-2">
                          <button
                            type="button"
                            onClick={() => handleCopy(`case_${idx}`, `${cs.title}\n1. Problema: ${cs.structure.initialProblem}\n2. Método: ${cs.structure.appliedMethod}\n3. Resultado: ${cs.structure.tangibleResult}\n4. Lição: ${cs.structure.finalTakeaway}`)}
                            className="px-3.5 py-1.5 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-lg border border-white/10 transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            {copiedId === `case_${idx}` ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                            <span>{copiedId === `case_${idx}` ? "Copiado!" : "Copiar Estrutura"}</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 5. BIO GENERATOR PRO (5 RADICALLY DIFFERENT ARCHETYPES) */}
              {missionResult.missionType === 'bio_generator_pro' && missionResult.data.bios && (
                <div className="space-y-6">
                  {/* Modifier Bar */}
                  {onRegenerateBio && (
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                      <span className="text-xs text-slate-400 font-mono shrink-0 mr-1">Regenerar tom:</span>
                      {[
                        { id: 'default', label: 'Equilibrado' },
                        { id: 'commercial', label: 'Mais Comercial' },
                        { id: 'premium', label: 'Mais Premium' },
                        { id: 'human', label: 'Mais Humana' },
                        { id: 'authority', label: 'Mais Autoridade' },
                        { id: 'direct', label: 'Mais Direta' }
                      ].map((mod) => (
                        <button
                          key={mod.id}
                          type="button"
                          onClick={() => onRegenerateBio(mod.id as BioModifier)}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-medium border transition-all shrink-0 cursor-pointer ${
                            activeBioModifier === mod.id
                              ? 'bg-gradient-to-r from-[#FF5E36] to-[#E1306C] text-white border-white/20 shadow-md font-bold'
                              : 'bg-slate-900 text-slate-400 hover:text-white border-white/10'
                          }`}
                        >
                          {mod.label}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-6">
                    {missionResult.data.bios.map((b, idx) => (
                      <div 
                        key={idx}
                        className="glass-panel rounded-3xl p-6 border border-white/10 hover:border-white/20 transition-all space-y-5 relative overflow-hidden"
                      >
                        {/* Header of Bio Card */}
                        <div className="flex items-center justify-between flex-wrap gap-2 pb-4 border-b border-white/10">
                          <div className="flex items-center gap-3">
                            <span className="px-3 py-1 rounded-full bg-[#E1306C]/20 text-[#FA26A0] border border-[#E1306C]/30 text-xs font-mono font-bold uppercase tracking-wider">
                              {b.archetype}
                            </span>
                            <h4 className="text-lg font-bold text-white font-display">{b.title}</h4>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                              Bio Score: {b.score}/100
                            </span>
                          </div>
                        </div>

                        {/* Main Instagram Bio Preview Shell */}
                        <div className="bg-[#05070E] p-5 rounded-2xl border border-white/10 relative">
                          <div className="flex items-center justify-between mb-3 text-[11px] text-slate-400 font-mono">
                            <span>Instagram Bio Preview</span>
                            <span className="text-slate-500">{b.bio.length} / 150 caracteres</span>
                          </div>

                          <div className="text-sm font-sans text-slate-100 whitespace-pre-line leading-relaxed font-medium">
                            {b.bio}
                          </div>
                        </div>

                        {/* Why it works & Diagnostic connection */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                          <div className="bg-slate-900/60 p-4 rounded-xl border border-white/5 space-y-1.5">
                            <strong className="text-sky-400 block font-mono">🎯 Por que funciona:</strong>
                            <p className="text-slate-300 leading-relaxed">{b.whyItWorks}</p>
                          </div>

                          <div className="bg-slate-900/60 p-4 rounded-xl border border-white/5 space-y-1.5">
                            <strong className="text-amber-400 block font-mono">💡 Recomendado para:</strong>
                            <p className="text-slate-300 leading-relaxed">{b.bestFor}</p>
                          </div>
                        </div>

                        {/* Metric Bars */}
                        {b.metrics && (
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                            <div>
                              <div className="flex justify-between text-[10px] text-slate-400 mb-1 font-mono">
                                <span>Clareza</span>
                                <span>{b.metrics.clarity}%</span>
                              </div>
                              <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-[#38BDF8] h-full" style={{ width: `${b.metrics.clarity}%` }} />
                              </div>
                            </div>

                            <div>
                              <div className="flex justify-between text-[10px] text-slate-400 mb-1 font-mono">
                                <span>Especificidade</span>
                                <span>{b.metrics.specificity}%</span>
                              </div>
                              <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-emerald-400 h-full" style={{ width: `${b.metrics.specificity}%` }} />
                              </div>
                            </div>

                            <div>
                              <div className="flex justify-between text-[10px] text-slate-400 mb-1 font-mono">
                                <span>Diferenciação</span>
                                <span>{b.metrics.differentiation}%</span>
                              </div>
                              <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-[#E1306C] h-full" style={{ width: `${b.metrics.differentiation}%` }} />
                              </div>
                            </div>

                            <div>
                              <div className="flex justify-between text-[10px] text-slate-400 mb-1 font-mono">
                                <span>Força do CTA</span>
                                <span>{b.metrics.ctaStrength}%</span>
                              </div>
                              <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-[#FF5E36] h-full" style={{ width: `${b.metrics.ctaStrength}%` }} />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Copy Button */}
                        <div className="pt-2 flex justify-end">
                          <button
                            type="button"
                            onClick={() => handleCopy(`bio_${idx}`, b.bio)}
                            className="px-6 py-3 bg-gradient-to-r from-[#FF5E36] via-[#E1306C] to-[#833AB4] hover:opacity-95 text-white text-xs font-bold rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer active:scale-98"
                          >
                            {copiedId === `bio_${idx}` ? (
                              <>
                                <Check size={16} className="text-emerald-300" />
                                <span>✓ Bio Copiada!</span>
                              </>
                            ) : (
                              <>
                                <Copy size={16} />
                                <span>Copiar Esta Bio</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 6. CUSTOM MISSION DELIVERABLE */}
              {missionResult.missionType === 'custom_mission_resolver' && missionResult.data.custom && (
                <div className="space-y-6">
                  <div className="p-4 bg-slate-900 border border-white/10 rounded-2xl space-y-1">
                    <span className="text-[10px] font-mono font-bold text-[#FF5E36] uppercase tracking-wider">Causa Raiz Identificada</span>
                    <p className="text-xs text-slate-200">{missionResult.data.custom.rootProblem}</p>
                  </div>

                  {/* Tactical Plan */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Plano de Ação Imediato</h4>
                    <div className="space-y-2">
                      {missionResult.data.custom.tacticalPlan.map((step, sIdx) => (
                        <div key={sIdx} className="bg-slate-900/60 p-3.5 rounded-xl border border-white/5 flex items-start gap-3">
                          <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-mono font-bold shrink-0 mt-0.5">
                            {sIdx + 1}
                          </span>
                          <p className="text-xs text-slate-200 leading-relaxed">{step}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Templates */}
                  {missionResult.data.custom.readyToUseTemplates.map((tpl, tIdx) => (
                    <div key={tIdx} className="glass-panel p-5 rounded-2xl border border-white/10 space-y-3">
                      <div className="flex items-center justify-between">
                        <h5 className="text-sm font-bold text-white">{tpl.title}</h5>
                        <button
                          type="button"
                          onClick={() => handleCopy(`custom_tpl_${tIdx}`, tpl.content)}
                          className="p-1.5 text-slate-400 hover:text-white"
                        >
                          {copiedId === `custom_tpl_${tIdx}` ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                        </button>
                      </div>
                      <div className="bg-slate-950 p-4 rounded-xl border border-white/5 text-xs text-slate-200 whitespace-pre-line font-mono">
                        {tpl.content}
                      </div>
                      <p className="text-[11px] text-slate-400 italic">
                        Instruções: {tpl.instructions}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Universal Solution Feedback on deliverable */}
              <div className="mt-6 pt-4 border-t border-white/10">
                <SolutionFeedback
                  solutionType={`mission_${missionResult.missionType}`}
                  itemTitle={missionResult.title}
                />
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-white/10 flex items-center justify-between bg-[#080C16]/80 text-xs text-slate-400 font-mono">
          <span>InstaScore OS Engine • Execução Tática Conectada</span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-white/10 hover:bg-white/15 text-white font-bold rounded-xl transition-all cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </motion.div>
    </div>
  );
}
