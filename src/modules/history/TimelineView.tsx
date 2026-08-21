import React, { useState } from "react";
import { motion } from "motion/react";
import { History, TrendingUp, Zap, LayoutTemplate, Star, Activity, BarChart2, CheckCircle, BrainCircuit } from "lucide-react";
import { AnalysisResponse } from "../../types";
import { DigitalTwin, createDefaultDigitalTwin } from "../../core/DigitalTwin";
import { MemoryEngine } from "../../ai/memory/MemoryEngine";
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip 
} from "recharts";

interface TimelineViewProps {
  diagnosisResult: AnalysisResponse;
  currentScore: number;
  digitalTwin?: DigitalTwin | null;
}

export function TimelineView({ diagnosisResult, currentScore, digitalTwin: rawTwin }: TimelineViewProps) {
  const [activeTab, setActiveTab] = useState<"radar" | "timeline">("radar");
  const digitalTwin = rawTwin || createDefaultDigitalTwin(diagnosisResult);

  const historyData = [
    { date: "12 Mar", score: Math.max(0, currentScore - 12), execution: 30, momentum: 40 },
    { date: "24 Mar", score: Math.max(0, currentScore - 5), execution: 55, momentum: 60 },
    { date: "Hoje", score: currentScore, execution: digitalTwin.metrics?.executionScore || 45, momentum: digitalTwin.metrics?.momentumScore || 50 }
  ];

  const radarData = [
    { subject: 'Autoridade', A: digitalTwin.metrics?.authorityVelocity || 50, fullMark: 100 },
    { subject: 'Crescimento', A: digitalTwin.metrics?.growthVelocity || 50, fullMark: 100 },
    { subject: 'Conversão', A: digitalTwin.metrics?.conversionVelocity || 50, fullMark: 100 },
    { subject: 'Execução', A: digitalTwin.metrics?.executionScore || 50, fullMark: 100 },
    { subject: 'Consistência', A: digitalTwin.metrics?.consistencyScore || 50, fullMark: 100 },
    { subject: 'Momentum', A: digitalTwin.metrics?.momentumScore || 50, fullMark: 100 },
  ];

  const mockMemoryEvent = MemoryEngine.recordEvent(digitalTwin, {
    actionType: "PROFILE_UPDATE",
    context: { bio: "Especialista em X" },
    impact: { scoreDelta: 5 }
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8 max-w-5xl mx-auto pb-12"
    >
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-2">
          <BarChart2 size={14} /> Analytics Engine
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Growth Graph & Histórico</h1>
        <p className="text-slate-400">Análise profunda dos seus padrões de crescimento usando o modelo do seu Digital Twin.</p>
      </div>

      <div className="flex gap-2 p-1 bg-slate-900 border border-slate-800 rounded-xl w-fit">
        <button 
          onClick={() => setActiveTab("radar")}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === "radar" ? "bg-slate-800 text-white shadow-sm" : "text-slate-500 hover:text-slate-300"}`}
        >
          <Activity size={16} /> Distribuição do Score
        </button>
        <button 
          onClick={() => setActiveTab("timeline")}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === "timeline" ? "bg-slate-800 text-white shadow-sm" : "text-slate-500 hover:text-slate-300"}`}
        >
          <TrendingUp size={16} /> Evolução Temporal
        </button>
      </div>

      {activeTab === "radar" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 h-[400px]">
            <h3 className="font-bold text-white mb-6">Mapeamento Dimensional</h3>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 'bold' }} />
                <Radar name="Seu Perfil" dataKey="A" stroke="#8b5cf6" strokeWidth={3} fill="#8b5cf6" fillOpacity={0.3} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }}
                  itemStyle={{ color: '#c4b5fd', fontWeight: 'bold' }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
              <h3 className="font-bold text-white">Insight do Algoritmo</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                O seu <strong className="text-violet-400">Momentum</strong> está forte, mas a velocidade de <strong className="text-rose-400">Conversão</strong> está atrasada em relação à base de seguidores.
              </p>
              <div className="p-3 bg-violet-500/10 border border-violet-500/20 rounded-xl">
                 <p className="text-xs font-bold text-violet-300 flex items-center gap-2 mb-1">
                   <Zap size={14} /> Recomendação Imediata
                 </p>
                 <p className="text-xs text-violet-400/80">Otimizar os Call-to-Actions (CTAs) nos próximos 3 posts.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "timeline" && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <TrendingUp size={18} className="text-violet-400" />
              Trajetória de Crescimento
            </h2>
            <span className="text-sm font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              +12 pts (30 dias)
            </span>
          </div>

          <div className="h-[300px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#475569" tick={{fill: '#94a3b8', fontSize: 12}} />
                <YAxis stroke="#475569" tick={{fill: '#94a3b8', fontSize: 12}} domain={[0, 100]} />
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="score" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h3 className="font-bold text-white mb-4">Memory Engine: Eventos Estruturados</h3>
        
        <div className="space-y-4">
          <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-5 flex items-start gap-4 hover:border-violet-500/30 transition-colors">
             <div className="mt-1 w-10 h-10 rounded-full bg-violet-500/10 text-violet-400 flex items-center justify-center shrink-0">
               <BrainCircuit size={18} />
             </div>
             <div>
               <div className="flex items-center gap-2 mb-1">
                 <h4 className="font-bold text-slate-200">Módulo 2: Insights Gerados</h4>
                 <span className="text-[10px] text-slate-500">Hoje</span>
               </div>
               <div className="space-y-2 mt-2">
                 {mockMemoryEvent.insights.map((insight, idx) => (
                    <div key={idx} className="text-sm text-slate-400 p-2 bg-slate-950 rounded border border-slate-800">
                      "{insight}"
                    </div>
                 ))}
               </div>
             </div>
          </div>

          <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-5 flex items-start gap-4 hover:border-slate-700 transition-colors">
             <div className="mt-1 w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
               <CheckCircle size={18} />
             </div>
             <div>
               <div className="flex items-center gap-2 mb-1">
                 <h4 className="font-bold text-slate-200">Ação Implementada: {mockMemoryEvent.actionType}</h4>
                 <span className="text-[10px] text-slate-500">24 Mar</span>
               </div>
               <p className="text-sm text-slate-400">Impacto confirmado pelo sistema: <strong className="text-emerald-400">+{mockMemoryEvent.impact.scoreDelta} pontos</strong>.</p>
             </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
