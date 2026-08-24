import React from "react";
import { motion } from "motion/react";
import { DigitalTwin, createDefaultDigitalTwin } from "../../core/DigitalTwin";
import { 
  Fingerprint, 
  Target, 
  Users, 
  Megaphone, 
  Palette, 
  Clock, 
  Repeat, 
  LayoutGrid, 
  PlaySquare, 
  Shield, 
  Brain, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  TrendingUp, 
  Sliders, 
  Layers 
} from "lucide-react";

interface DigitalTwinViewProps {
  digitalTwin?: DigitalTwin | null;
}

export function DigitalTwinView({ digitalTwin: rawTwin }: DigitalTwinViewProps) {
  const digitalTwin = rawTwin || createDefaultDigitalTwin();
  const insights = digitalTwin.learningInsights || [];
  const preferences = digitalTwin.preferences;
  const performance = digitalTwin.performance;
  const behavior = digitalTwin.behavior;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8 max-w-5xl mx-auto pb-12"
    >
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider mb-2">
          <Fingerprint size={14} /> Gêmeo Digital V13 (Intelligence Evolution)
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Modelo Evolutivo do Perfil</h1>
        <p className="text-slate-400">
          Cérebro estratégico contínuo que aprende com seu histórico, preferências e padrões de conversão.
        </p>
      </div>

      {/* Nota de Metodologia e Aprendizado */}
      <div className="p-4 bg-slate-900/60 border border-blue-500/20 rounded-2xl flex items-center gap-3 text-xs text-slate-300">
        <Shield size={16} className="text-blue-400 shrink-0" />
        <span>
          <strong>Aprendizado Baseado em Evidências:</strong> O Gêmeo Digital atualiza hipóteses e preferências a cada interação e feedback. Insights com amostras pequenas mantêm níveis de confiança calculados e são aprofundados com a publicação contínua.
        </span>
      </div>

      {/* ==========================================
          SEÇÃO 1: APRENDIZADO EVOLUTIVO (V13 INSIGHTS)
          ========================================== */}
      <div className="bg-slate-900 border border-violet-500/30 rounded-3xl p-6 space-y-5 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-violet-500/10 flex items-center justify-center text-violet-400">
              <Brain size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                Aprendizados & Insights Evolutivos
                <span className="text-xs font-mono font-normal px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                  {insights.length} descobertas
                </span>
              </h2>
              <p className="text-xs text-slate-400">Regras de decisão aprendidas pelo sistema para guiar a estratégia do perfil.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {insights.map((ins) => (
            <div 
              key={ins.id} 
              className="p-4 bg-slate-950/80 border border-slate-800 hover:border-violet-500/40 rounded-2xl space-y-3 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  {ins.category.toUpperCase()} • {ins.source.replace("_", " ")}
                </span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-xs font-bold font-mono text-violet-300">
                    {ins.confidence}% conf.
                  </span>
                </div>
              </div>

              <p className="text-sm font-semibold text-white leading-snug">
                {ins.insight}
              </p>

              <div className="text-xs text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/80">
                <span className="truncate max-w-[200px] text-slate-500">
                  Evidência: {ins.evidence}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  Amostra: {ins.sampleCount}x
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Identidade */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
              <Shield size={20} />
            </div>
            <h2 className="text-xl font-bold text-white">Identidade Central</h2>
          </div>

          <div className="space-y-4">
            <div>
              <span className="text-xs text-slate-500 font-bold uppercase tracking-wider flex items-center gap-2"><Target size={14}/> Nicho</span>
              <p className="text-sm text-slate-200 mt-1 font-medium">{digitalTwin.identity.niche}</p>
            </div>
            <div>
              <span className="text-xs text-slate-500 font-bold uppercase tracking-wider flex items-center gap-2"><Target size={14}/> Objetivos</span>
              <div className="flex flex-wrap gap-2 mt-2">
                {digitalTwin.identity.objectives.map(o => <span key={o} className="px-2 py-1 bg-slate-800 rounded-md text-xs text-slate-300">{o}</span>)}
              </div>
            </div>
            <div>
              <span className="text-xs text-slate-500 font-bold uppercase tracking-wider flex items-center gap-2"><Users size={14}/> Público</span>
              <p className="text-sm text-slate-200 mt-1">{digitalTwin.identity.targetAudience}</p>
            </div>
            <div>
              <span className="text-xs text-slate-500 font-bold uppercase tracking-wider flex items-center gap-2"><Megaphone size={14}/> Linguagem</span>
              <p className="text-sm text-slate-200 mt-1">{digitalTwin.identity.toneOfVoice}</p>
            </div>
          </div>
        </div>

        {/* Preferências & Vetos */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-400">
              <Sliders size={20} />
            </div>
            <h2 className="text-xl font-bold text-white">Preferências do Criador</h2>
          </div>

          <div className="space-y-4">
            <div>
              <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 size={13} /> Ângulos & Estratégias Favoritas
              </span>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {(preferences?.preferredAngles || []).length > 0 ? (
                  preferences?.preferredAngles?.map(a => (
                    <span key={a} className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs text-emerald-300">
                      {a}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-500 italic">Nenhum ângulo priorizado ainda.</span>
                )}
              </div>
            </div>

            <div>
              <span className="text-xs text-rose-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <XCircle size={13} /> Temas ou Formatos Vetados
              </span>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {[...(preferences?.excludedThemes || []), ...(preferences?.rejectedFormats || [])].length > 0 ? (
                  [...(preferences?.excludedThemes || []), ...(preferences?.rejectedFormats || [])].map(t => (
                    <span key={t} className="px-2 py-1 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-rose-300">
                      {t}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-500 italic">Nenhum veto registrado.</span>
                )}
              </div>
            </div>

            {preferences?.userFeedbackNotes && preferences.userFeedbackNotes.length > 0 && (
              <div>
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-1">
                  Diretrizes Pessoais Anotadas
                </span>
                <ul className="space-y-1.5">
                  {preferences.userFeedbackNotes.slice(0, 3).map((note, idx) => (
                    <li key={idx} className="text-xs text-slate-300 p-2 bg-slate-950 rounded-lg border border-slate-800">
                      "{note}"
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Performance & Comportamento */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-400">
              <TrendingUp size={20} />
            </div>
            <h2 className="text-xl font-bold text-white">Performance do Perfil</h2>
          </div>

          <div className="space-y-4">
            <div>
              <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block mb-1.5">Formatos Campeões</span>
              <div className="flex flex-wrap gap-2">
                {(performance?.winningFormats || ["carousel", "reel"]).map(f => (
                  <span key={f} className="px-2.5 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-xs font-bold text-cyan-300 uppercase font-mono">
                    {f}
                  </span>
                ))}
              </div>
            </div>

            {behavior?.formatsUsed && (
              <div>
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block mb-1.5">Histórico de Produção</span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 bg-slate-950 rounded-lg border border-slate-800 flex justify-between">
                    <span className="text-slate-400">Carrosséis:</span>
                    <span className="font-bold text-white font-mono">{behavior.formatsUsed.carousel || 0}</span>
                  </div>
                  <div className="p-2 bg-slate-950 rounded-lg border border-slate-800 flex justify-between">
                    <span className="text-slate-400">Reels:</span>
                    <span className="font-bold text-white font-mono">{behavior.formatsUsed.reel || 0}</span>
                  </div>
                  <div className="p-2 bg-slate-950 rounded-lg border border-slate-800 flex justify-between">
                    <span className="text-slate-400">Posts:</span>
                    <span className="font-bold text-white font-mono">{behavior.formatsUsed.post || 0}</span>
                  </div>
                  <div className="p-2 bg-slate-950 rounded-lg border border-slate-800 flex justify-between">
                    <span className="text-slate-400">Stories:</span>
                    <span className="font-bold text-white font-mono">{behavior.formatsUsed.story || 0}</span>
                  </div>
                </div>
              </div>
            )}

            <div>
              <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block mb-1">Frequência Observada</span>
              <p className="text-xs text-slate-300 font-mono">{behavior?.postingFrequency || "4-5x / semana"}</p>
            </div>
          </div>
        </div>

      </div>
    </motion.div>
  );
}
