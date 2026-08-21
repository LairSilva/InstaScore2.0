import React from "react";
import { motion } from "motion/react";
import { DigitalTwin, createDefaultDigitalTwin } from "../../core/DigitalTwin";
import { Fingerprint, Target, Users, Megaphone, Palette, Clock, Repeat, LayoutGrid, PlaySquare, LineChart, Shield, History, Brain } from "lucide-react";

interface DigitalTwinViewProps {
  digitalTwin?: DigitalTwin | null;
}

export function DigitalTwinView({ digitalTwin: rawTwin }: DigitalTwinViewProps) {
  const digitalTwin = rawTwin || createDefaultDigitalTwin();
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8 max-w-5xl mx-auto pb-12"
    >
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider mb-2">
          <Fingerprint size={14} /> Gêmeo Digital (Módulo 1)
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Modelo Estratégico do Perfil</h1>
        <p className="text-slate-400">
          Consolidação dos dados extraídos do perfil com diretrizes e baselines analíticos para guiar a execução.
        </p>
      </div>

      {/* Nota de Transparência */}
      <div className="p-4 bg-slate-900/60 border border-blue-500/20 rounded-2xl flex items-center gap-3 text-xs text-slate-300">
        <Shield size={16} className="text-blue-400 shrink-0" />
        <span>
          <strong>Transparência Metodológica:</strong> Os campos de Bio, CTA e Identidade são extraídos da análise do perfil. Horários, frequências e taxas são <em>baselines e hipóteses estimadas</em> da metodologia C.A.G.E.
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Identidade */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 lg:row-span-2">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
              <Shield size={20} />
            </div>
            <h2 className="text-xl font-bold text-white">Identidade</h2>
          </div>

          <div className="space-y-4">
            <div>
              <span className="text-xs text-slate-500 font-bold uppercase tracking-wider flex items-center gap-2"><Target size={14}/> Nicho</span>
              <p className="text-sm text-slate-200 mt-1">{digitalTwin.identity.niche}</p>
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
            <div>
              <span className="text-xs text-slate-500 font-bold uppercase tracking-wider flex items-center gap-2"><Palette size={14}/> Estilo Visual</span>
              <p className="text-sm text-slate-200 mt-1">{digitalTwin.identity.visualStyle}</p>
            </div>
            <div>
              <span className="text-xs text-slate-500 font-bold uppercase tracking-wider flex items-center gap-2"><Shield size={14}/> Brand Identity</span>
              <p className="text-sm text-slate-200 mt-1">{digitalTwin.identity.brandIdentity}</p>
            </div>
          </div>
        </div>

        {/* Estratégia de Conteúdo */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 lg:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <LayoutGrid size={20} />
            </div>
            <h2 className="text-xl font-bold text-white">Estrutura e Conteúdo</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Bio Atual</span>
                <div className="mt-2 p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <p className="text-sm text-slate-300">{digitalTwin.content.currentBio}</p>
                </div>
              </div>
              <div>
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">CTA Principal</span>
                <p className="text-sm text-slate-200 mt-1 font-mono bg-slate-800/50 px-2 py-1 rounded inline-block">{digitalTwin.content.currentCta}</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <div>
                  <span className="text-xs text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1"><Clock size={12}/> Horários Sugeridos (Baseline)</span>
                  <p className="text-sm text-slate-200 mt-1">{digitalTwin.content.bestPostingTimes.join(", ")}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1"><Repeat size={12}/> Frequência Sugerida (Baseline)</span>
                  <p className="text-sm text-slate-200 mt-1">{digitalTwin.content.postingFrequency}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
               <div>
                  <span className="text-xs text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1"><LayoutGrid size={12}/> Diretrizes de Feed (Sugeridas)</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {digitalTwin.content.feedStrategyPatterns.map(p => <span key={p} className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-md text-xs text-emerald-400">{p}</span>)}
                  </div>
               </div>
               <div>
                  <span className="text-xs text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1"><PlaySquare size={12}/> Diretrizes de Reels (Sugeridas)</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {digitalTwin.content.reelsStrategyPatterns.map(p => <span key={p} className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-md text-xs text-emerald-400">{p}</span>)}
                  </div>
               </div>
            </div>
          </div>
        </div>

        {/* Memory & Evolution */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
           <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-violet-500/10 flex items-center justify-center text-violet-400">
                <Brain size={20} />
              </div>
              <h2 className="text-xl font-bold text-white">Memória & Estimativas</h2>
           </div>
           
           <div className="space-y-4 mt-4">
             <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
               <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Estimativa Baseline de Conversão</span>
               <div className="flex items-end gap-2 mt-1">
                 <span className="text-3xl font-black text-white">{digitalTwin.historyData.conversionRate}%</span>
                 <span className="text-[11px] text-slate-400 mb-1">(Projeção Teórica C.A.G.E.)</span>
               </div>
             </div>

             <div>
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Hipóteses e Padrões Estruturais (IA)</span>
                <ul className="mt-2 space-y-2">
                  {digitalTwin.content.discoveredPatterns.map(p => (
                    <li key={p} className="text-sm text-slate-300 flex items-start gap-2">
                      <span className="text-violet-400 mt-1">•</span> {p}
                    </li>
                  ))}
                </ul>
             </div>
           </div>
        </div>

      </div>
    </motion.div>
  );
}
